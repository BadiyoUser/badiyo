CREATE OR REPLACE FUNCTION public.customer_set_language(_lang text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _lang NOT IN ('en','mr') THEN
    RAISE EXCEPTION 'invalid language';
  END IF;
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  UPDATE public.users SET preferred_language = _lang, updated_at = now() WHERE id = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION public.customer_set_language(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.customer_set_language(text) TO authenticated;