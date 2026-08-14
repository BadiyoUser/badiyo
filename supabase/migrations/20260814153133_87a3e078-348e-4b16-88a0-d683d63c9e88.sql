REVOKE EXECUTE ON FUNCTION public.advance_booking_status(uuid, text) FROM authenticated, anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.advance_booking_status(uuid, text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.is_active_staff(uuid, text[]) FROM anon, PUBLIC;

REVOKE EXECUTE ON FUNCTION public.resolve_caller_identity(uuid) FROM authenticated, anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_caller_identity(uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.get_expert_id_for_auth(uuid) FROM authenticated, anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_expert_id_for_auth(uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.resolve_zone_for_point(numeric, numeric) FROM authenticated, anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_zone_for_point(numeric, numeric) TO service_role;

REVOKE EXECUTE ON FUNCTION public.system_accept_booking_after_payment(uuid) FROM anon, PUBLIC;

REVOKE EXECUTE ON FUNCTION public.get_eligible_experts_for_booking(uuid) FROM authenticated, anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_eligible_experts_for_booking(uuid) TO service_role;

REVOKE ALL ON TABLE public.edge_runtime_config FROM anon, authenticated, PUBLIC;
GRANT ALL ON TABLE public.edge_runtime_config TO service_role;
REVOKE ALL ON TABLE public.otp_codes FROM anon, authenticated, PUBLIC;
GRANT ALL ON TABLE public.otp_codes TO service_role;
REVOKE ALL ON TABLE public.otp_rate_limits FROM anon, authenticated, PUBLIC;
GRANT ALL ON TABLE public.otp_rate_limits TO service_role;
REVOKE ALL ON TABLE public.pin_login_lockouts FROM anon, authenticated, PUBLIC;
GRANT ALL ON TABLE public.pin_login_lockouts TO service_role;

REVOKE INSERT, UPDATE, DELETE ON TABLE public.wallet_ledger FROM anon, authenticated, PUBLIC;
GRANT ALL ON TABLE public.wallet_ledger TO service_role;