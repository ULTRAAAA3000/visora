-- Bugfix + recovery migration.
--
-- Root cause found live: migration 0019 (contact_messages / page_views)
-- calls `public.is_admin(auth.uid())` — with an argument — but 0016
-- only ever defined a zero-argument `public.is_admin()`. That's a
-- different function signature in Postgres; calling it raises
-- "function public.is_admin(uuid) does not exist" at CREATE POLICY
-- time. Confirmed live: `public.contact_messages` doesn't exist at all
-- in production, meaning 0019 was run as one script/transaction and the
-- error on that later CREATE POLICY statement rolled back everything
-- before it too — including the CREATE TABLE statements.
--
-- This migration is written to be safe to run regardless of exactly
-- how much of 0019 landed: every statement is IF NOT EXISTS / OR
-- REPLACE / DROP-then-CREATE, so re-running it is a no-op wherever
-- 0019 already partially succeeded.

-- The missing overload 0019 needs.
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE((SELECT is_admin FROM public.profiles WHERE id = check_user_id), FALSE);
$$;

-- Re-create 0019's tables if they didn't survive the rollback.
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON public.contact_messages(created_at DESC);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view contact messages" ON public.contact_messages;
CREATE POLICY "Admins can view contact messages"
  ON public.contact_messages FOR SELECT
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update contact messages" ON public.contact_messages;
CREATE POLICY "Admins can update contact messages"
  ON public.contact_messages FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path TEXT NOT NULL,
  referrer TEXT,
  country TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON public.page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_path ON public.page_views(path);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view page views" ON public.page_views;
CREATE POLICY "Admins can view page views"
  ON public.page_views FOR SELECT
  USING (public.is_admin(auth.uid()));

-- ---------------------------------------------------------------------
-- Also worth checking directly: everything from migrations 0020-0023
-- that referenced tables/columns from earlier migrations could have
-- the same "ran as one script, one bad statement rolled back
-- everything" problem if any of them errored too. Run this to sanity
-- check what actually exists right now:
--
--   SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public' ORDER BY table_name;
--
-- Expected (as of this migration): profiles, templates, render_logs,
-- contact_messages, page_views, signup_attempts, blocked_ip_ranges,
-- security_settings, login_failures, webhook_deliveries (0017),
-- render_cache (0018) — plus the template_gallery view.
-- ---------------------------------------------------------------------
