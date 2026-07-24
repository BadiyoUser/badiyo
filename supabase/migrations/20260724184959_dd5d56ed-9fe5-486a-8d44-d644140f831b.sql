
CREATE OR REPLACE FUNCTION public.submit_booking_review(_booking_id uuid, _rating int, _review text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _current text; _owner uuid; _r int;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT status, user_id INTO _current, _owner FROM public.bookings WHERE id = _booking_id;
  IF _owner IS NULL OR _owner <> _uid THEN RAISE EXCEPTION 'Not found'; END IF;
  IF _current <> 'in_progress' THEN RAISE EXCEPTION 'Invalid status transition'; END IF;
  _r := NULLIF(_rating, 0);
  IF _r IS NOT NULL AND (_r < 1 OR _r > 5) THEN RAISE EXCEPTION 'Invalid rating'; END IF;
  PERFORM set_config('app.booking_bypass', 'on', true);
  UPDATE public.bookings
     SET status='completed', rating=_r, review_text=NULLIF(btrim(coalesce(_review,'')),'')
   WHERE id = _booking_id;
  PERFORM set_config('app.booking_bypass', 'off', true);
END;$$;
