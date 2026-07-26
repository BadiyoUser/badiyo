
CREATE OR REPLACE FUNCTION public.system_accept_booking_after_payment(_booking_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _current text;
  _owner uuid;
  _payment_id text;
  _before jsonb;
  _after jsonb;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT to_jsonb(b), b.status, b.user_id, b.razorpay_payment_id
    INTO _before, _current, _owner, _payment_id
    FROM public.bookings b WHERE b.id = _booking_id;

  IF _owner IS NULL OR _owner <> _uid THEN RAISE EXCEPTION 'Not found'; END IF;
  IF _payment_id IS NULL OR length(_payment_id) = 0 THEN RAISE EXCEPTION 'Payment not verified'; END IF;

  -- Log the initial 'confirmed' state (system, driven by successful payment)
  INSERT INTO public.audit_logs (actor_id, action, target_table, target_id, before_state, after_state)
  VALUES (_uid, 'system_payment_confirmed', 'bookings', _booking_id,
          NULL,
          _before || jsonb_build_object('actor_role','system'));

  -- Only auto-advance from 'confirmed'; if already advanced (e.g. staff acted), no-op.
  IF _current = 'confirmed' THEN
    PERFORM set_config('app.booking_bypass','on', true);
    UPDATE public.bookings SET status = 'accepted' WHERE id = _booking_id;
    PERFORM set_config('app.booking_bypass','off', true);

    SELECT to_jsonb(b) INTO _after FROM public.bookings b WHERE id = _booking_id;

    INSERT INTO public.audit_logs (actor_id, action, target_table, target_id, before_state, after_state)
    VALUES (_uid, 'system_auto_accept', 'bookings', _booking_id,
            _before || jsonb_build_object('actor_role','system'),
            _after  || jsonb_build_object('actor_role','system'));
  END IF;
END;
$function$;

REVOKE ALL ON FUNCTION public.system_accept_booking_after_payment(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.system_accept_booking_after_payment(uuid) TO authenticated;
