GRANT SELECT ON public.homepage_sections TO anon, authenticated;
GRANT SELECT ON public.service_catalogue_config TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT ALL ON public.homepage_sections, public.service_catalogue_config, public.addresses, public.users TO service_role;