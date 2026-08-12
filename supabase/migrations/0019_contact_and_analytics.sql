-- Contact form + self-hosted page-view analytics, both admin-only to
-- read. Neither table has an INSERT policy for anon/authenticated —
-- writes only ever come from the Worker's service role
-- (worker/src/lib/contact.ts, worker/src/lib/track.ts), which bypasses
-- RLS entirely. Routing writes through the Worker instead of granting
-- a public INSERT policy keeps this off the open Supabase REST API,
-- and lets the Worker do basic validation/shape-checking before
-- anything lands in the table.

CREATE TABLE public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contact_messages_created_at ON public.contact_messages(created_at DESC);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view contact messages"
  ON public.contact_messages FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update contact messages"
  ON public.contact_messages FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Deliberately no raw IP address column — country (from Cloudflare's
-- request.cf.country, not looked up separately) is enough for "where
-- are visitors coming from" without storing anything more identifying
-- than what Privacy.tsx already discloses.
CREATE TABLE public.page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path TEXT NOT NULL,
  referrer TEXT,
  country TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_page_views_created_at ON public.page_views(created_at DESC);
CREATE INDEX idx_page_views_path ON public.page_views(path);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view page views"
  ON public.page_views FOR SELECT
  USING (public.is_admin(auth.uid()));
