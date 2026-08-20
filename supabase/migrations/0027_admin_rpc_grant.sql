-- /admin kept bouncing a confirmed is_admin=TRUE account back to
-- /dashboard. AdminRoute.tsx now checks admin status with a fresh
-- public.is_admin() RPC call on every visit instead of relying on the
-- profile object cached in AuthContext (which only refetches on
-- login, so granting is_admin via SQL mid-session wasn't reflected
-- without a full logout/login).
--
-- Functions get EXECUTE granted to PUBLIC by default in Postgres, but
-- belt-and-suspenders: grant explicitly so the RPC call can't silently
-- fail for either role that might call it.
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;
