-- Tracks whether a user has been through the dashboard onboarding tour.
-- NULL = never completed (or dismissed) it — the dashboard auto-starts
-- the tour once, then sets this on finish/skip so it never auto-starts
-- again. The tour can still be replayed manually any time regardless of
-- this value (see "Take the tour" in the dashboard sidebar).

ALTER TABLE public.profiles
  ADD COLUMN onboarding_completed_at TIMESTAMPTZ;
