-- Link waitlist rows to users/segments (table already existed)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'waitlist_requests_user_id_fkey') THEN
    ALTER TABLE public.waitlist_requests
      ADD CONSTRAINT waitlist_requests_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'waitlist_requests_segment_id_fkey') THEN
    ALTER TABLE public.waitlist_requests
      ADD CONSTRAINT waitlist_requests_segment_id_fkey
      FOREIGN KEY (segment_id) REFERENCES public.segments(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS waitlist_requests_user_segment_idx
  ON public.waitlist_requests (user_id, segment_id);

GRANT SELECT, INSERT ON public.waitlist_requests TO authenticated;
GRANT ALL ON public.waitlist_requests TO service_role;
REVOKE ALL ON public.waitlist_requests FROM anon;

DROP POLICY IF EXISTS "Users can insert their own waitlist requests" ON public.waitlist_requests;
CREATE POLICY "Users can insert their own waitlist requests"
ON public.waitlist_requests FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view their own waitlist requests" ON public.waitlist_requests;
CREATE POLICY "Users can view their own waitlist requests"
ON public.waitlist_requests FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.check_serviceability(_lat numeric, _lng numeric, _segment_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _zone_id uuid;
  _zone_name text;
BEGIN
  IF _lat IS NULL OR _lng IS NULL THEN
    RETURN jsonb_build_object('serviceable', false, 'zone_id', null, 'zone_name', null);
  END IF;

  SELECT z.id, z.name INTO _zone_id, _zone_name
  FROM public.zones z
  WHERE z.status = 'active'
    AND z.deleted_at IS NULL
    AND (_segment_id IS NULL OR z.segment_id = _segment_id)
    AND public.point_in_polygon(_lat, _lng, z.boundary)
  LIMIT 1;

  RETURN jsonb_build_object(
    'serviceable', _zone_id IS NOT NULL,
    'zone_id', _zone_id,
    'zone_name', _zone_name
  );
END;
$$;

REVOKE ALL ON FUNCTION public.check_serviceability(numeric, numeric, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_serviceability(numeric, numeric, uuid) TO anon, authenticated, service_role;