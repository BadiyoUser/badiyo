
-- Referral system: security-definer functions for cross-user credit logic

CREATE OR REPLACE FUNCTION public.link_referral(_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _referrer_id uuid;
  _current_ref text;
BEGIN
  IF _uid IS NULL OR _code IS NULL OR length(trim(_code)) = 0 THEN
    RETURN;
  END IF;

  -- Don't allow overwriting an already-set referral link
  SELECT referred_by INTO _current_ref FROM public.users WHERE id = _uid;
  IF _current_ref IS NOT NULL AND length(_current_ref) > 0 THEN
    RETURN;
  END IF;

  SELECT id INTO _referrer_id
  FROM public.users
  WHERE upper(referral_code) = upper(trim(_code))
  LIMIT 1;

  -- Prevent self-referral
  IF _referrer_id IS NULL OR _referrer_id = _uid THEN
    RETURN;
  END IF;

  UPDATE public.users
    SET referred_by = upper(trim(_code))
  WHERE id = _uid;

  -- Only insert a pending row once
  IF NOT EXISTS (
    SELECT 1 FROM public.referral_transactions WHERE referred_user_id = _uid
  ) THEN
    INSERT INTO public.referral_transactions (referrer_id, referred_user_id, status)
    VALUES (_referrer_id, _uid, 'pending');
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.link_referral(text) FROM public;
GRANT EXECUTE ON FUNCTION public.link_referral(text) TO authenticated;


CREATE OR REPLACE FUNCTION public.credit_referral_for_booking(_booking_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _booking_user uuid;
  _booking_status text;
  _confirmed_count integer;
  _txn_id uuid;
  _referrer_id uuid;
  _is_active boolean;
  _reward numeric;
BEGIN
  IF _uid IS NULL THEN RETURN; END IF;

  SELECT user_id, status INTO _booking_user, _booking_status
  FROM public.bookings WHERE id = _booking_id;

  IF _booking_user IS NULL OR _booking_user <> _uid THEN RETURN; END IF;
  IF _booking_status <> 'confirmed' THEN RETURN; END IF;

  -- First confirmed booking?
  SELECT count(*) INTO _confirmed_count
  FROM public.bookings
  WHERE user_id = _uid AND status IN ('confirmed','expert_assigned','in_progress','completed');
  IF _confirmed_count <> 1 THEN RETURN; END IF;

  -- Pending referral row?
  SELECT id, referrer_id INTO _txn_id, _referrer_id
  FROM public.referral_transactions
  WHERE referred_user_id = _uid AND status = 'pending'
  LIMIT 1;
  IF _txn_id IS NULL THEN RETURN; END IF;

  SELECT is_active, reward_coins INTO _is_active, _reward
  FROM public.referral_config ORDER BY updated_at DESC NULLS LAST LIMIT 1;

  IF _is_active IS NOT TRUE THEN RETURN; END IF;
  _reward := COALESCE(_reward, 0);

  UPDATE public.referral_transactions
    SET status = 'reward_credited',
        reward_amount = _reward,
        reward_date = now(),
        booking_id = _booking_id
  WHERE id = _txn_id;

  UPDATE public.users
    SET total_coins_earned = COALESCE(total_coins_earned, 0) + _reward::int,
        successful_referrals = COALESCE(successful_referrals, 0) + 1
  WHERE id = _referrer_id;

  INSERT INTO public.wallet_transactions (user_id, amount, type, description)
  VALUES (_referrer_id, _reward, 'credit', 'Referral Reward');
END;
$$;

REVOKE ALL ON FUNCTION public.credit_referral_for_booking(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.credit_referral_for_booking(uuid) TO authenticated;
