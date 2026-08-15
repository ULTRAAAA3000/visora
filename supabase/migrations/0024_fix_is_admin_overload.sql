-- Bugfix: migration 0019 (contact_messages / page_views admin policies)
-- calls `public.is_admin(auth.uid())` — passing an argument — but 0016
-- only ever defined a zero-argument `public.is_admin()`. Postgres treats
-- those as different function signatures; calling a 0-arg function with
-- 1 argument is a hard error at CREATE POLICY time, not a silent no-op.
-- If migrations run as one transaction per file, this means 0019 likely
-- never actually committed — contact_messages/page_views admin access
-- silently missing ever since.
--
-- Fix: add the 1-arg overload 0019 expects, calling the same logic, so
-- both call styles work going forward without touching the (already
-- shipped, working) zero-arg version other policies depend on.
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE((SELECT is_admin FROM public.profiles WHERE id = check_user_id), FALSE);
$$;

-- Re-run 0019's policies in case they never actually landed the first
-- time — DROP IF EXISTS first so this is safe to run whether or not
-- they already exist.
DROP POLICY IF EXISTS "Admins can view contact messages" ON public.contact_messages;
CREATE POLICY "Admins can view contact messages"
  ON public.contact_messages FOR SELECT
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update contact messages" ON public.contact_messages;
CREATE POLICY "Admins can update contact messages"
  ON public.contact_messages FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can view page views" ON public.page_views;
CREATE POLICY "Admins can view page views"
  ON public.page_views FOR SELECT
  USING (public.is_admin(auth.uid()));

-- ---------------------------------------------------------------------
-- This does NOT set anyone as admin — that's still the manual step from
-- 0016, and is very likely the actual reason /admin keeps bouncing to
-- /dashboard (not a frontend bug): if that UPDATE was never run, or was
-- run against a different email than the one you actually log in with,
-- is_admin is FALSE and every redirect you're seeing is correct
-- behavior for a non-admin account.
--
-- Run this in Supabase SQL Editor, with your real login email:
--   SELECT email, is_admin FROM public.profiles WHERE email = 'your@email.com';
-- If is_admin comes back false (or the row doesn't exist yet — it's
-- only created on first dashboard visit):
--   UPDATE public.profiles SET is_admin = TRUE WHERE email = 'your@email.com';
-- ---------------------------------------------------------------------
