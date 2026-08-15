-- Billing (Phase 4): Paddle subscription state on profiles.
--
-- Was originally written for LemonSqueezy; switched to Paddle before
-- this migration was ever applied (regional payment restrictions made
-- LemonSqueezy a non-starter), so it's rewritten in place rather than
-- left as dead history with a superseding migration on top. The old
-- free-quota-default fix that used to be bundled in here shipped
-- separately as 0021_free_quota_fix.sql.
--
-- Plan changes are driven entirely by the Paddle webhook (see
-- worker/src/lib/billing.ts), which runs with the service role key and
-- so bypasses RLS — no policy changes needed here.
--
-- subscription_status mirrors Paddle's own values verbatim ('trialing',
-- 'active', 'past_due', 'paused', 'canceled') rather than inventing our
-- own enum, so the webhook handler never needs a translation table.
-- NULL means "never subscribed".
--
-- Cancelling a Paddle subscription "at next billing period" does NOT
-- flip status to 'canceled' immediately — it stays 'active' (with a
-- scheduled_change Paddle attaches) until the paid period actually
-- ends, at which point Paddle fires subscription.canceled and *that's*
-- what downgrades the account. See billing.ts.

ALTER TABLE public.profiles
  ADD COLUMN paddle_customer_id TEXT,
  ADD COLUMN paddle_subscription_id TEXT,
  ADD COLUMN subscription_status TEXT,
  ADD COLUMN plan_renews_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_paddle_subscription_id
  ON public.profiles(paddle_subscription_id)
  WHERE paddle_subscription_id IS NOT NULL;
