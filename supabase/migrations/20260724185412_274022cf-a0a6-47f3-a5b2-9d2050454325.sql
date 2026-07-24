
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

REVOKE SELECT ON public.service_catalogue_config FROM anon, authenticated;
GRANT SELECT (id, duration_label, duration_minutes, subtitle, price, icon, display_order, is_active, created_at)
  ON public.service_catalogue_config TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.users_before_update() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bookings_before_insert() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bookings_before_update() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_referral_code() FROM PUBLIC, anon, authenticated;
