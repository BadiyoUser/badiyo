CREATE OR REPLACE FUNCTION public.get_auth_user_id_by_phone(_phone text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM auth.users WHERE phone = regexp_replace(_phone, '^\+', '') LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_auth_user_id_by_phone(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_auth_user_id_by_phone(text) TO service_role;