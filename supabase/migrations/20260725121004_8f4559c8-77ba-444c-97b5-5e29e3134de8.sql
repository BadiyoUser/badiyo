
-- 1. Columns
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS service_end_at timestamptz;

-- 2. Harden update trigger: block direct client edits to timing fields.
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

-- 3. start_service RPC: transitions expert_assigned -> in_progress and sets timing.
CREATE OR REPLACE FUNCTION public.start_service(_booking_id uuid)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _owner uuid; _status text; _duration int; _existing_end timestamptz; _end timestamptz;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT user_id, status, service_duration_minutes, service_end_at
    INTO _owner, _status, _duration, _existing_end
    FROM public.bookings WHERE id = _booking_id;
  IF _owner IS NULL OR _owner <> _uid THEN RAISE EXCEPTION 'Not found'; END IF;
  -- Idempotent: if already started, return the stored end.
  IF _status = 'in_progress' AND _existing_end IS NOT NULL THEN
    RETURN _existing_end;
  END IF;
  IF _status <> 'expert_assigned' THEN
    RAISE EXCEPTION 'Invalid status transition';
  END IF;
  _end := now() + make_interval(mins => _duration);
  PERFORM set_config('app.booking_bypass', 'on', true);
  UPDATE public.bookings
     SET status = 'in_progress',
         started_at = now(),
         service_end_at = _end
   WHERE id = _booking_id;
  PERFORM set_config('app.booking_bypass', 'off', true);
  RETURN _end;
END;$function$;

REVOKE ALL ON FUNCTION public.start_service(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.start_service(uuid) TO authenticated;

-- 4. booking_extensions table
CREATE TABLE IF NOT EXISTS public.booking_extensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  extra_minutes int NOT NULL,
  price numeric NOT NULL,
  razorpay_payment_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS booking_extensions_booking_idx ON public.booking_extensions(booking_id);

GRANT SELECT ON public.booking_extensions TO authenticated;
GRANT ALL ON public.booking_extensions TO service_role;

ALTER TABLE public.booking_extensions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own booking extensions"
  ON public.booking_extensions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND b.user_id = auth.uid()));

CREATE POLICY "Staff view all booking extensions"
  ON public.booking_extensions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.staff_users s WHERE s.auth_user_id = auth.uid() AND s.status = 'active'));

-- 5. extend_booking RPC
CREATE OR REPLACE FUNCTION public.extend_booking(_booking_id uuid, _extra_minutes int, _razorpay_payment_id text)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _owner uuid; _status text; _end timestamptz; _price numeric; _new_end timestamptz;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _extra_minutes IS NULL OR _extra_minutes <= 0 THEN
    RAISE EXCEPTION 'Invalid extension duration';
  END IF;
  SELECT user_id, status, service_end_at
    INTO _owner, _status, _end
    FROM public.bookings WHERE id = _booking_id;
  IF _owner IS NULL OR _owner <> _uid THEN RAISE EXCEPTION 'Not found'; END IF;
  IF _status <> 'in_progress' OR _end IS NULL THEN
    RAISE EXCEPTION 'Service not in progress';
  END IF;
  -- Allow extension until 10 min past the current end (grace window).
  IF now() > _end + interval '10 minutes' THEN
    RAISE EXCEPTION 'Extension window closed';
  END IF;

  SELECT price INTO _price FROM public.service_catalogue_config
    WHERE duration_minutes = _extra_minutes AND is_active = true
    ORDER BY created_at DESC LIMIT 1;
  IF _price IS NULL THEN RAISE EXCEPTION 'Extension duration not available'; END IF;

  -- Base extension on max(now, current end) so a late payment still adds full time.
  _new_end := GREATEST(_end, now()) + make_interval(mins => _extra_minutes);

  PERFORM set_config('app.booking_bypass', 'on', true);
  UPDATE public.bookings SET service_end_at = _new_end WHERE id = _booking_id;
  PERFORM set_config('app.booking_bypass', 'off', true);

  INSERT INTO public.booking_extensions(booking_id, extra_minutes, price, razorpay_payment_id)
    VALUES(_booking_id, _extra_minutes, _price, NULLIF(btrim(_razorpay_payment_id), ''));

  RETURN _new_end;
END;$function$;

REVOKE ALL ON FUNCTION public.extend_booking(uuid, int, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.extend_booking(uuid, int, text) TO authenticated;
