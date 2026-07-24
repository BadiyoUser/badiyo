
-- 1) OTP rate limits table
CREATE TABLE IF NOT EXISTS public.otp_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text,
  ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS otp_rate_limits_phone_created_idx ON public.otp_rate_limits (phone, created_at DESC);
CREATE INDEX IF NOT EXISTS otp_rate_limits_ip_created_idx ON public.otp_rate_limits (ip, created_at DESC);
GRANT ALL ON public.otp_rate_limits TO service_role;
ALTER TABLE public.otp_rate_limits ENABLE ROW LEVEL SECURITY;
-- No client policies — service_role only.

-- 2) Remove client insert policy on wallet_transactions
DROP POLICY IF EXISTS "Users can insert their own wallet transactions" ON public.wallet_transactions;

-- 3) Bookings: server-side price + status enforcement via triggers
CREATE OR REPLACE FUNCTION public.bookings_before_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _price numeric;
BEGIN
  SELECT price INTO _price FROM public.service_catalogue_config
   WHERE duration_minutes = NEW.service_duration_minutes AND is_active = true
   ORDER BY created_at DESC LIMIT 1;
  IF _price IS NULL THEN
    RAISE EXCEPTION 'Invalid service duration';
  END IF;
  NEW.price := _price;
  NEW.status := 'confirmed';
  NEW.rating := NULL;
  NEW.review_text := NULL;
  RETURN NEW;
END;$$;
DROP TRIGGER IF EXISTS trg_bookings_before_insert ON public.bookings;
CREATE TRIGGER trg_bookings_before_insert BEFORE INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.bookings_before_insert();

CREATE OR REPLACE FUNCTION public.bookings_before_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _bypass text;
BEGIN
  BEGIN _bypass := current_setting('app.booking_bypass', true); EXCEPTION WHEN OTHERS THEN _bypass := NULL; END;
  IF _bypass = 'on' THEN
    RETURN NEW;
  END IF;
  -- Immutable columns from the client
  IF NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.price IS DISTINCT FROM OLD.price
     OR NEW.service_duration_minutes IS DISTINCT FROM OLD.service_duration_minutes
     OR NEW.service_label IS DISTINCT FROM OLD.service_label
     OR NEW.razorpay_order_id IS DISTINCT FROM OLD.razorpay_order_id
     OR NEW.razorpay_payment_id IS DISTINCT FROM OLD.razorpay_payment_id
     OR NEW.rating IS DISTINCT FROM OLD.rating
     OR NEW.review_text IS DISTINCT FROM OLD.review_text
  THEN
    RAISE EXCEPTION 'Field not updatable';
  END IF;
  -- Status: only confirmed -> cancelled allowed from client
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NOT (OLD.status = 'confirmed' AND NEW.status = 'cancelled') THEN
      RAISE EXCEPTION 'Invalid status transition';
    END IF;
  END IF;
  RETURN NEW;
END;$$;
DROP TRIGGER IF EXISTS trg_bookings_before_update ON public.bookings;
CREATE TRIGGER trg_bookings_before_update BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.bookings_before_update();

-- Secure RPC used by simulated tracking flow
CREATE OR REPLACE FUNCTION public.advance_booking_status(_booking_id uuid, _new_status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _current text; _owner uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT status, user_id INTO _current, _owner FROM public.bookings WHERE id = _booking_id;
  IF _owner IS NULL OR _owner <> _uid THEN RAISE EXCEPTION 'Not found'; END IF;
  IF NOT (
    (_current = 'confirmed' AND _new_status = 'expert_assigned')
    OR (_current = 'expert_assigned' AND _new_status = 'in_progress')
    OR (_current = 'in_progress' AND _new_status = 'completed')
  ) THEN
    RAISE EXCEPTION 'Invalid status transition';
  END IF;
  PERFORM set_config('app.booking_bypass', 'on', true);
  UPDATE public.bookings SET status = _new_status WHERE id = _booking_id;
  PERFORM set_config('app.booking_bypass', 'off', true);
END;$$;
REVOKE ALL ON FUNCTION public.advance_booking_status(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.advance_booking_status(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.submit_booking_review(_booking_id uuid, _rating int, _review text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _current text; _owner uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT status, user_id INTO _current, _owner FROM public.bookings WHERE id = _booking_id;
  IF _owner IS NULL OR _owner <> _uid THEN RAISE EXCEPTION 'Not found'; END IF;
  IF _current <> 'in_progress' THEN RAISE EXCEPTION 'Invalid status transition'; END IF;
  IF _rating IS NOT NULL AND (_rating < 1 OR _rating > 5) THEN RAISE EXCEPTION 'Invalid rating'; END IF;
  PERFORM set_config('app.booking_bypass', 'on', true);
  UPDATE public.bookings
     SET status='completed', rating=_rating, review_text=NULLIF(btrim(coalesce(_review,'')),'')
   WHERE id = _booking_id;
  PERFORM set_config('app.booking_bypass', 'off', true);
END;$$;
REVOKE ALL ON FUNCTION public.submit_booking_review(uuid, int, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_booking_review(uuid, int, text) TO authenticated;

-- 4) Users: protect referral/coin columns from client update
CREATE OR REPLACE FUNCTION public.users_before_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _bypass text;
BEGIN
  BEGIN _bypass := current_setting('app.users_bypass', true); EXCEPTION WHEN OTHERS THEN _bypass := NULL; END;
  IF _bypass = 'on' THEN RETURN NEW; END IF;
  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.total_coins_earned IS DISTINCT FROM OLD.total_coins_earned
     OR NEW.successful_referrals IS DISTINCT FROM OLD.successful_referrals
     OR NEW.referral_code IS DISTINCT FROM OLD.referral_code
     OR NEW.referred_by IS DISTINCT FROM OLD.referred_by
  THEN
    RAISE EXCEPTION 'Field not updatable';
  END IF;
  RETURN NEW;
END;$$;
DROP TRIGGER IF EXISTS trg_users_before_update ON public.users;
CREATE TRIGGER trg_users_before_update BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.users_before_update();

-- 5) Update existing definer functions to bypass the users trigger where needed
CREATE OR REPLACE FUNCTION public.link_referral(_code text)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
DECLARE
  _uid uuid := auth.uid();
  _referrer_id uuid;
  _current_ref text;
BEGIN
  IF _uid IS NULL OR _code IS NULL OR length(trim(_code)) = 0 THEN RETURN; END IF;
  SELECT referred_by INTO _current_ref FROM public.users WHERE id = _uid;
  IF _current_ref IS NOT NULL AND length(_current_ref) > 0 THEN RETURN; END IF;
  SELECT id INTO _referrer_id FROM public.users WHERE upper(referral_code) = upper(trim(_code)) LIMIT 1;
  IF _referrer_id IS NULL OR _referrer_id = _uid THEN RETURN; END IF;
  PERFORM set_config('app.users_bypass', 'on', true);
  UPDATE public.users SET referred_by = upper(trim(_code)) WHERE id = _uid;
  PERFORM set_config('app.users_bypass', 'off', true);
  IF NOT EXISTS (SELECT 1 FROM public.referral_transactions WHERE referred_user_id = _uid) THEN
    INSERT INTO public.referral_transactions (referrer_id, referred_user_id, status)
    VALUES (_referrer_id, _uid, 'pending');
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.credit_referral_for_booking(_booking_id uuid)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
DECLARE
  _uid uuid := auth.uid();
  _booking_user uuid; _booking_status text;
  _confirmed_count integer; _txn_id uuid; _referrer_id uuid;
  _is_active boolean; _reward numeric;
BEGIN
  IF _uid IS NULL THEN RETURN; END IF;
  SELECT user_id, status INTO _booking_user, _booking_status FROM public.bookings WHERE id = _booking_id;
  IF _booking_user IS NULL OR _booking_user <> _uid THEN RETURN; END IF;
  IF _booking_status <> 'confirmed' THEN RETURN; END IF;
  SELECT count(*) INTO _confirmed_count FROM public.bookings
    WHERE user_id = _uid AND status IN ('confirmed','expert_assigned','in_progress','completed');
  IF _confirmed_count <> 1 THEN RETURN; END IF;
  SELECT id, referrer_id INTO _txn_id, _referrer_id FROM public.referral_transactions
    WHERE referred_user_id = _uid AND status = 'pending' LIMIT 1;
  IF _txn_id IS NULL THEN RETURN; END IF;
  SELECT is_active, reward_coins INTO _is_active, _reward
    FROM public.referral_config ORDER BY updated_at DESC NULLS LAST LIMIT 1;
  IF _is_active IS NOT TRUE THEN RETURN; END IF;
  _reward := COALESCE(_reward, 0);
  UPDATE public.referral_transactions
    SET status='reward_credited', reward_amount=_reward, reward_date=now(), booking_id=_booking_id
    WHERE id = _txn_id;
  PERFORM set_config('app.users_bypass', 'on', true);
  UPDATE public.users
    SET total_coins_earned = COALESCE(total_coins_earned,0) + _reward::int,
        successful_referrals = COALESCE(successful_referrals,0) + 1
    WHERE id = _referrer_id;
  PERFORM set_config('app.users_bypass', 'off', true);
  INSERT INTO public.wallet_transactions (user_id, amount, type, description)
    VALUES (_referrer_id, _reward, 'credit', 'Referral Reward');
END;
$function$;
