-- 1) Lock internal tables to service role only (belt-and-braces; RLS already on, no policies)
REVOKE ALL ON public.edge_runtime_config FROM anon, authenticated, PUBLIC;
REVOKE ALL ON public.otp_codes FROM anon, authenticated, PUBLIC;
REVOKE ALL ON public.otp_rate_limits FROM anon, authenticated, PUBLIC;
REVOKE ALL ON public.pin_login_lockouts FROM anon, authenticated, PUBLIC;
GRANT ALL ON public.edge_runtime_config TO service_role;
GRANT ALL ON public.otp_codes TO service_role;
GRANT ALL ON public.otp_rate_limits TO service_role;
GRANT ALL ON public.pin_login_lockouts TO service_role;

-- 2) Revoke anon EXECUTE on every SECURITY DEFINER function except has_login_pin
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND p.proname <> 'has_login_pin'
      AND has_function_privilege('anon', p.oid, 'EXECUTE')
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon, PUBLIC;', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated;', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role;', r.sig);
  END LOOP;
END $$;

-- keep has_login_pin callable pre-login
GRANT EXECUTE ON FUNCTION public.has_login_pin(text) TO anon, authenticated, service_role;

-- 3) Internal-only routines: not callable directly by signed-in users
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND (
        p.prorettype = 'trigger'::regtype
        OR p.proname IN (
          'verify_login_pin',
          'verify_login_pin_internal',
          'get_auth_user_id_by_email',
          'get_auth_user_id_by_phone',
          'expand_stale_broadcasts',
          'broadcast_booking_to_experts',
          'notify_customer_push',
          'notify_expert_push',
          'notify_expert_broadcast'
        )
      )
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon, authenticated, PUBLIC;', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role;', r.sig);
  END LOOP;
END $$;
