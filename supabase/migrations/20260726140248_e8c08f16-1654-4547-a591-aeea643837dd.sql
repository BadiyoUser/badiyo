
CREATE OR REPLACE FUNCTION public.has_login_pin(p_phone text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _digits text := regexp_replace(coalesce(p_phone,''), '\D', '', 'g');
  _exists boolean := false;
BEGIN
  IF _digits = '' THEN RETURN false; END IF;
  SELECT EXISTS(
    SELECT 1 FROM public.users u
    WHERE regexp_replace(coalesce(u.phone,''), '\D', '', 'g') = _digits
      AND u.pin_hash IS NOT NULL
  ) INTO _exists;
  RETURN _exists;
END;
$$;

REVOKE ALL ON FUNCTION public.has_login_pin(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_login_pin(text) TO anon, authenticated, service_role;
