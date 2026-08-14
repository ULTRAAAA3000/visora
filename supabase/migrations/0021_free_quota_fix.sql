-- The landing page's pricing table has always advertised 500 renders/mo
-- on Free, but the signup default (migration 0001) was still 100.
--
-- This was originally bundled into migration 0015 (LemonSqueezy billing),
-- which is being held back since billing is moving to a different
-- provider. Split out here so the quota fix can ship independently.

ALTER TABLE public.profiles ALTER COLUMN monthly_quota SET DEFAULT 500;

UPDATE public.profiles
SET monthly_quota = 500
WHERE plan_tier = 'free' AND monthly_quota = 100;
