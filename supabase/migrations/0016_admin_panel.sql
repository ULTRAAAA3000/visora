-- Admin panel (main roadmap item 7): a flag on profiles + RLS policies
-- so an admin's browser session (using the publishable/anon key, same
-- as everyone else — no service role key in the frontend) can read
-- across all users instead of just their own row.
--
-- is_admin() is SECURITY DEFINER so the policy check itself doesn't
-- recurse through RLS on profiles (a plain subquery to profiles from
-- within a profiles policy would re-trigger RLS on itself).

ALTER TABLE public.profiles
  ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE((SELECT is_admin FROM public.profiles WHERE id = auth.uid()), FALSE);
$$;

CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can read all templates"
  ON public.templates FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can read all render logs"
  ON public.render_logs FOR SELECT
  USING (public.is_admin());

-- Nobody can grant themselves admin through the app — only UPDATE own
-- profile is allowed for regular users (migration 0001), and that
-- policy has no column restriction, so without this a user could
-- currently UPDATE their own is_admin via the publishable key. Replace
-- the original "own profile" update policy so a non-admin's own-row
-- update must keep is_admin FALSE (admins already have a separate,
-- unrestricted "update all profiles" policy above for the legitimate
-- case of granting/revoking admin on someone else's row).
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND is_admin = FALSE);

-- First admin has to be set manually — there's no self-serve path by
-- design. Run once, replacing the email:
--   UPDATE public.profiles SET is_admin = TRUE WHERE email = 'you@example.com';
