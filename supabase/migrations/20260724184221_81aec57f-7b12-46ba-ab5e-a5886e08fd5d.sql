
-- 1. Restrict storage.objects for address-photos to owner (folder = auth.uid())
DROP POLICY IF EXISTS "Public read address photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view address photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view address photos" ON storage.objects;
DROP POLICY IF EXISTS "address-photos public read" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own address photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own address photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own address photos" ON storage.objects;

CREATE POLICY "Users can view own address photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'address-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own address photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'address-photos' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'address-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own address photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'address-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 2. Fix SECURITY DEFINER functions: lock down EXECUTE + set search_path
-- generate_referral_code is a trigger function; just pin search_path
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
begin
  if new.referral_code is null then
    new.referral_code := upper(substring(md5(new.id::text) from 1 for 6));
  end if;
  return new;
end;
$function$;

-- Revoke broad execute grants on SECURITY DEFINER functions
REVOKE ALL ON FUNCTION public.link_referral(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.credit_referral_for_booking(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_auth_user_id_by_phone(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_auth_user_id_by_email(text) FROM PUBLIC, anon, authenticated;

-- User-callable referral helpers: signed-in users only
GRANT EXECUTE ON FUNCTION public.link_referral(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.credit_referral_for_booking(uuid) TO authenticated;

-- Auth-lookup helpers are only for the verify-otp edge function (service_role)
GRANT EXECUTE ON FUNCTION public.get_auth_user_id_by_phone(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_auth_user_id_by_email(text) TO service_role;
