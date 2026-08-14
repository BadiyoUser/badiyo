-- 1. Bookings: strict allowlist for direct (non-RPC) customer updates -------
CREATE OR REPLACE FUNCTION public.bookings_before_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _bypass text;
  _allowed constant text[] := ARRAY['scheduled_date', 'scheduled_time_slot', 'updated_at'];
  _new jsonb;
  _old jsonb;
  _key text;
BEGIN
  BEGIN _bypass := current_setting('app.booking_bypass', true); EXCEPTION WHEN OTHERS THEN _bypass := NULL; END;
  IF _bypass = 'on' THEN
    RETURN NEW;
  END IF;

  -- Direct Data API writes may only touch the reschedule fields. Everything
  -- else (price, refunds, status, OTPs, expert, coordinates, payment ids, ...)
  -- must go through a SECURITY DEFINER function that sets app.booking_bypass.
  _new := to_jsonb(NEW);
  _old := to_jsonb(OLD);

  FOR _key IN SELECT jsonb_object_keys(_new) LOOP
    IF NOT (_key = ANY (_allowed)) AND (_new -> _key) IS DISTINCT FROM (_old -> _key) THEN
      IF _key = 'status' THEN
        RAISE EXCEPTION 'Status changes must go through server-side functions'
          USING ERRCODE = '42501';
      END IF;
      RAISE EXCEPTION 'Field not updatable: %', _key USING ERRCODE = '42501';
    END IF;
  END LOOP;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- 2. Referral transactions: scope the referrer read policy to signed-in users
DROP POLICY IF EXISTS "Users can view own referral transactions as referrer" ON public.referral_transactions;
CREATE POLICY "Users can view own referral transactions as referrer"
  ON public.referral_transactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_id);

-- 3. Realtime: stop broadcasting audit logs, and drop sensitive expert columns
ALTER PUBLICATION supabase_realtime DROP TABLE public.audit_logs;

ALTER PUBLICATION supabase_realtime DROP TABLE public.experts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.experts
  (id, name, photo_url, level, status, zone_id, is_online, is_busy,
   current_lat, current_lng, location_updated_at, auth_user_id,
   preferred_language, created_at);

-- 4. Serviceability check no longer needs to be callable by logged-out visitors
REVOKE EXECUTE ON FUNCTION public.check_serviceability(numeric, numeric, uuid) FROM anon;
