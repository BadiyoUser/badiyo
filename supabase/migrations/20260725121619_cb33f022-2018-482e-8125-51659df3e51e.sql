
-- 1. Columns for OTPs
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS start_otp TEXT,
  ADD COLUMN IF NOT EXISTS end_otp   TEXT;

-- 2. Harden update trigger: forbid client-side edits to OTP fields (bypass only).
CREATE OR REPLACE FUNCTION public.bookings_before_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _bypass text;
BEGIN
  BEGIN _bypass := current_setting('app.booking_bypass', true); EXCEPTION WHEN OTHERS THEN _bypass := NULL; END;
  IF _bypass = 'on' THEN
    RETURN NEW;
  END IF;
  IF NEW.user_id IS DISTINCT FROM OLD.user_id
     OR NEW.price IS DISTINCT FROM OLD.price
     OR NEW.service_duration_minutes IS DISTINCT FROM OLD.service_duration_minutes
     OR NEW.service_label IS DISTINCT FROM OLD.service_label
     OR NEW.razorpay_order_id IS DISTINCT FROM OLD.razorpay_order_id
     OR NEW.razorpay_payment_id IS DISTINCT FROM OLD.razorpay_payment_id
     OR NEW.rating IS DISTINCT FROM OLD.rating
     OR NEW.review_text IS DISTINCT FROM OLD.review_text
     OR NEW.assigned_expert_id IS DISTINCT FROM OLD.assigned_expert_id
     OR NEW.zone_id IS DISTINCT FROM OLD.zone_id
     OR NEW.cancellation_reason IS DISTINCT FROM OLD.cancellation_reason
     OR NEW.address_id IS DISTINCT FROM OLD.address_id
     OR NEW.start_otp IS DISTINCT FROM OLD.start_otp
     OR NEW.end_otp   IS DISTINCT FROM OLD.end_otp
     OR NEW.started_at IS DISTINCT FROM OLD.started_at
     OR NEW.service_end_at IS DISTINCT FROM OLD.service_end_at
  THEN
    RAISE EXCEPTION 'Field not updatable';
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NOT (OLD.status = 'confirmed' AND NEW.status = 'cancelled') THEN
      RAISE EXCEPTION 'Invalid status transition';
    END IF;
  END IF;
  RETURN NEW;
END;$function$;

-- 3. Helper: 4-digit random code
CREATE OR REPLACE FUNCTION public.generate_otp4()
 RETURNS text
 LANGUAGE sql
 VOLATILE
 SET search_path TO 'public'
AS $$
  SELECT lpad((floor(random() * 10000))::int::text, 4, '0');
$$;

-- 4. Owner-scoped: ensure start_otp exists once expert is assigned (or later).
CREATE OR REPLACE FUNCTION public.ensure_start_otp(_booking_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _uid uuid := auth.uid(); _owner uuid; _status text; _otp text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT user_id, status, start_otp INTO _owner, _status, _otp
    FROM public.bookings WHERE id = _booking_id;
  IF _owner IS NULL OR _owner <> _uid THEN RAISE EXCEPTION 'Not found'; END IF;
  IF _otp IS NOT NULL THEN RETURN _otp; END IF;
  IF _status NOT IN ('expert_assigned','in_progress','completed') THEN
    RAISE EXCEPTION 'Start code not available yet';
  END IF;
  _otp := public.generate_otp4();
  PERFORM set_config('app.booking_bypass','on', true);
  UPDATE public.bookings SET start_otp = _otp WHERE id = _booking_id;
  PERFORM set_config('app.booking_bypass','off', true);
  RETURN _otp;
END;$function$;

REVOKE ALL ON FUNCTION public.ensure_start_otp(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_start_otp(uuid) TO authenticated;

-- 5. start_service now also generates end_otp when transitioning to in_progress.
CREATE OR REPLACE FUNCTION public.start_service(_booking_id uuid)
 RETURNS timestamptz
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _owner uuid; _status text; _duration int; _existing_end timestamptz; _end timestamptz;
  _end_otp text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT user_id, status, service_duration_minutes, service_end_at, end_otp
    INTO _owner, _status, _duration, _existing_end, _end_otp
    FROM public.bookings WHERE id = _booking_id;
  IF _owner IS NULL OR _owner <> _uid THEN RAISE EXCEPTION 'Not found'; END IF;
  IF _status = 'in_progress' AND _existing_end IS NOT NULL THEN
    RETURN _existing_end;
  END IF;
  IF _status <> 'expert_assigned' THEN
    RAISE EXCEPTION 'Invalid status transition';
  END IF;
  _end := now() + make_interval(mins => _duration);
  IF _end_otp IS NULL THEN _end_otp := public.generate_otp4(); END IF;
  PERFORM set_config('app.booking_bypass', 'on', true);
  UPDATE public.bookings
     SET status = 'in_progress',
         started_at = now(),
         service_end_at = _end,
         end_otp = _end_otp
   WHERE id = _booking_id;
  PERFORM set_config('app.booking_bypass', 'off', true);
  RETURN _end;
END;$function$;

REVOKE ALL ON FUNCTION public.start_service(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.start_service(uuid) TO authenticated;

-- 6. Realtime: publish bookings so the customer app auto-advances on verification.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime' AND schemaname='public' AND tablename='bookings'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings';
  END IF;
END $$;

ALTER TABLE public.bookings REPLICA IDENTITY FULL;
