-- Billing (Phase 4): LemonSqueezy subscription state on profiles.
--
-- Plan changes are driven entirely by the LemonSqueezy webhook (see
-- worker/src/lib/billing.ts), which runs with the service role key and
-- so bypasses RLS — no policy changes needed here.
--
-- subscription_status mirrors LemonSqueezy's own values verbatim
-- ('on_trial', 'active', 'paused', 'past_due', 'unpaid', 'cancelled',
-- 'expired') rather than inventing our own enum, so the webhook handler
-- never needs a translation table. NULL means "never subscribed".
--
-- Cancelling a subscription does NOT downgrade plan_tier immediately —
-- LemonSqueezy keeps `status: cancelled` access alive until the paid
-- period actually ends, at which point it fires `subscription_expired`
-- and *that's* what downgrades the account. See billing.ts.

ALTER TABLE public.profiles
  ADD COLUMN lemonsqueezy_customer_id TEXT,
  ADD COLUMN lemonsqueezy_subscription_id TEXT,
  ADD COLUMN subscription_status TEXT,
  ADD COLUMN plan_renews_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_ls_subscription_id
  ON public.profiles(lemonsqueezy_subscription_id)
  WHERE lemonsqueezy_subscription_id IS NOT NULL;

-- The landing page's pricing table has always advertised 500 renders/mo
-- on Free; the actual signup default (migration 0001) was still 100.
-- Bring both in line now that Pro/Agency have real paid quotas to
-- compare against.
ALTER TABLE public.profiles ALTER COLUMN monthly_quota SET DEFAULT 500;

UPDATE public.profiles
SET monthly_quota = 500
WHERE plan_tier = 'free' AND monthly_quota = 100;
