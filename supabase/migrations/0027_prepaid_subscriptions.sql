-- Prepaid subscription model — replaces the render-time gating logic
-- (not the columns) of the old Paddle-driven plan_tier/monthly_quota/
-- usage_this_month system with a manual-renewal, prepaid-credits model.
--
-- Why: there is no card auto-billing. Every renewal is either a manual
-- bank transfer (confirmed by hand/bot) or a self-initiated crypto
-- payment — there is no "subscription" in the recurring-charge sense,
-- just "credits that were paid for and expire in 30 days if not
-- topped up again." Two credit sources exist per user:
--   1. A subscription_plan grant (free/growth/scale) — SETS credits to
--      the plan's allotment and pushes credits_reset_at 30 days out.
--   2. An add-on purchase (credit_packages, unchanged from 0025) —
--      ADDS to credits, never touches credits_reset_at.
--
-- profiles.plan_tier / monthly_quota / usage_this_month / credit_balance
-- are deliberately left in place (not dropped) — they're still read by
-- the existing Paddle checkout UI and admin panels, which are a
-- separate follow-up to migrate off. Only the Worker's render-gating
-- logic (auth.ts) switches to the columns/functions below.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS credits INT NOT NULL DEFAULT 500,
  ADD COLUMN IF NOT EXISTS subscription_plan TEXT NOT NULL DEFAULT 'free'
    CHECK (subscription_plan IN ('free', 'growth', 'scale')),
  ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'active'
    CHECK (subscription_status IN ('active', 'expired')),
  ADD COLUMN IF NOT EXISTS credits_reset_at TIMESTAMPTZ; -- NULL = never expires (free plan)

-- Reference table for what each plan grants. Prices are placeholders —
-- nothing in the Worker hardcodes them, everything reads from here, so
-- adjust freely.
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id TEXT PRIMARY KEY CHECK (id IN ('free', 'growth', 'scale')),
  name TEXT NOT NULL,
  credits INT NOT NULL CHECK (credits >= 0),
  price_usd NUMERIC(10, 2) NOT NULL DEFAULT 0,
  duration_days INT -- NULL for 'free' (doesn't expire)
);

INSERT INTO public.subscription_plans (id, name, credits, price_usd, duration_days) VALUES
  ('free', 'Free', 500, 0, NULL),
  ('growth', 'Growth', 10000, 20.00, 30),
  ('scale', 'Scale', 30000, 50.00, 30)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  credits = EXCLUDED.credits,
  price_usd = EXCLUDED.price_usd,
  duration_days = EXCLUDED.duration_days;

-- Full audit trail of every credits change — plan activations, add-on
-- purchases, render consumption, expiry resets, admin grants. Explicitly
-- requested as `credit_transactions` for the add-on flow, and useful
-- generally for support/dispute questions ("where did my credits go").
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (
    type IN ('subscription_activation', 'addon_purchase', 'render_consumption', 'expiry_reset', 'admin_grant')
  ),
  amount INT NOT NULL, -- signed: positive = credited, negative = spent
  balance_after INT NOT NULL,
  reference TEXT, -- tx hash / invoice reference / admin note / template_id, depending on type
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id, created_at DESC);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view subscription plans"
  ON public.subscription_plans FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can view own credit transactions"
  ON public.credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all credit transactions"
  ON public.credit_transactions FOR SELECT
  USING (public.is_admin());

-- Old fallback functions from 0025/0026 operated on credit_balance,
-- which this migration supersedes with the unified `credits` field —
-- dropped so nothing accidentally keeps writing to the old column.
DROP FUNCTION IF EXISTS public.consume_render_credit(UUID);
DROP FUNCTION IF EXISTS public.increment_user_credits(UUID, INT);

-- Looks a profile up by API key, expiring a stale paid subscription
-- first if `credits_reset_at` has passed — this *is* the "Middleware
-- при каждом запросе проверяет" requirement, run inline on every
-- authenticated request rather than as a separate cron, so there's no
-- window where an expired plan still spends against stale credits.
-- SECURITY DEFINER so the Worker's service-role call bypasses RLS.
CREATE OR REPLACE FUNCTION public.get_profile_for_api_key(p_api_key TEXT)
RETURNS TABLE (
  id UUID,
  email TEXT,
  credits INT,
  subscription_plan TEXT,
  subscription_status TEXT,
  webhook_url TEXT,
  webhook_secret TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_old_credits INT;
BEGIN
  SELECT p.id, p.credits INTO v_id, v_old_credits FROM public.profiles p WHERE p.api_key = p_api_key;
  IF v_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.profiles p
  SET subscription_plan = 'free',
      subscription_status = 'expired',
      credits = 500,
      credits_reset_at = NULL
  WHERE p.id = v_id
    AND p.subscription_plan <> 'free'
    AND p.credits_reset_at IS NOT NULL
    AND p.credits_reset_at < now();

  IF FOUND THEN
    INSERT INTO public.credit_transactions (user_id, type, amount, balance_after, reference)
    VALUES (v_id, 'expiry_reset', 500 - v_old_credits, 500, 'Subscription expired (30-day prepaid period elapsed)');
  END IF;

  RETURN QUERY
    SELECT p.id, p.email, p.credits, p.subscription_plan, p.subscription_status, p.webhook_url, p.webhook_secret
    FROM public.profiles p WHERE p.id = v_id;
END;
$$;

-- Atomic "is there enough, and if so spend it" — the actual per-render
-- deduction. Guarded UPDATE...WHERE + ROW_COUNT so two concurrent
-- renders can't both succeed against the last few credits.
CREATE OR REPLACE FUNCTION public.consume_credits(p_user_id UUID, p_amount INT, p_reference TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows INT;
  v_balance INT;
BEGIN
  UPDATE public.profiles
  SET credits = credits - p_amount
  WHERE id = p_user_id AND credits >= p_amount
  RETURNING credits INTO v_balance;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.credit_transactions (user_id, type, amount, balance_after, reference)
  VALUES (p_user_id, 'render_consumption', -p_amount, v_balance, p_reference);

  RETURN TRUE;
END;
$$;

-- Plan activation (Growth/Scale, or resetting back to Free): SETS
-- credits to the plan's allotment (prepaid periods don't stack) and
-- pushes credits_reset_at `p_duration_days` out. Used by both
-- /api/admin/subscriptions/activate (manual bank transfer / bot / email
-- confirmation) and /api/webhooks/crypto (on-site crypto acquiring).
CREATE OR REPLACE FUNCTION public.activate_subscription(p_user_id UUID, p_plan TEXT, p_duration_days INT DEFAULT 30)
RETURNS TABLE (credits INT, subscription_plan TEXT, credits_reset_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_credits INT;
BEGIN
  SELECT sp.credits INTO v_plan_credits FROM public.subscription_plans sp WHERE sp.id = p_plan;
  IF v_plan_credits IS NULL THEN
    RAISE EXCEPTION 'Unknown subscription plan: %', p_plan;
  END IF;

  UPDATE public.profiles p
  SET subscription_plan = p_plan,
      subscription_status = 'active',
      credits = v_plan_credits,
      credits_reset_at = CASE WHEN p_plan = 'free' THEN NULL ELSE now() + make_interval(days => p_duration_days) END
  WHERE p.id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No profile with id %', p_user_id;
  END IF;

  INSERT INTO public.credit_transactions (user_id, type, amount, balance_after, reference)
  VALUES (p_user_id, 'subscription_activation', v_plan_credits, v_plan_credits, p_plan);

  RETURN QUERY SELECT p.credits, p.subscription_plan, p.credits_reset_at FROM public.profiles p WHERE p.id = p_user_id;
END;
$$;

-- Add-on top-up: ADDS credits, never touches credits_reset_at or
-- subscription_plan/status. Used by crypto-payments.ts and
-- bank-payments.ts (replacing the old increment_user_credits).
CREATE OR REPLACE FUNCTION public.add_credit_addon(p_user_id UUID, p_credits INT, p_reference TEXT DEFAULT NULL)
RETURNS INT -- new balance
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance INT;
BEGIN
  UPDATE public.profiles SET credits = credits + p_credits WHERE id = p_user_id RETURNING credits INTO v_balance;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No profile with id %', p_user_id;
  END IF;

  INSERT INTO public.credit_transactions (user_id, type, amount, balance_after, reference)
  VALUES (p_user_id, 'addon_purchase', p_credits, v_balance, p_reference);

  RETURN v_balance;
END;
$$;

-- credit_packages (0025) used ids 'starter'/'growth'/'scale' for
-- one-time add-on packs — now that 'growth'/'scale' mean something
-- different (30-day prepaid plans, above), keep the two concepts from
-- colliding in anyone's head. Renaming the primary key in place would
-- need an ON UPDATE CASCADE on crypto_transactions.package_id /
-- invoice_requests.package_id that doesn't exist, so instead: retire
-- the old rows (any existing FK references still resolve fine) and
-- insert plainly-named replacements. GET /api/v1/payments/packages
-- already filters `is_active = true`, so this is enough for the
-- add-on picker to stop showing 'Growth'/'Scale' as pack names.
UPDATE public.credit_packages SET is_active = FALSE WHERE id IN ('starter', 'growth', 'scale');

INSERT INTO public.credit_packages (id, name, credits, price_usd) VALUES
  ('addon_1k', '1,000 Credits', 1000, 5.00),
  ('addon_5k', '5,000 Credits', 5000, 20.00),
  ('addon_15k', '15,000 Credits', 15000, 50.00)
ON CONFLICT (id) DO NOTHING;

-- Template tier rename to match the new plan names 1:1 (Growth unlocks
-- what Pro used to, Scale unlocks what Agency used to) — same rows,
-- just relabeled, so nothing about which templates exist or who owns
-- them changes.
--
-- The tier CHECK constraint from 0007 was added inline (no explicit
-- name), so Postgres auto-named it — almost certainly
-- `templates_tier_check`, but rather than bet the UPDATE below on that
-- guess, find and drop whatever check constraint actually references
-- `tier` by inspecting pg_constraint directly.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'templates'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%tier%'
  LOOP
    EXECUTE format('ALTER TABLE public.templates DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

-- Temporarily permissive (old + new values) so the UPDATEs below can
-- transition existing rows without tripping the constraint mid-migration.
ALTER TABLE public.templates ADD CONSTRAINT templates_tier_check CHECK (tier IN ('free', 'growth', 'scale', 'pro', 'agency'));

UPDATE public.templates SET tier = 'growth' WHERE tier = 'pro';
UPDATE public.templates SET tier = 'scale' WHERE tier = 'agency';

ALTER TABLE public.templates DROP CONSTRAINT templates_tier_check;
ALTER TABLE public.templates ADD CONSTRAINT templates_tier_check CHECK (tier IN ('free', 'growth', 'scale'));

-- The SELECT policy from 0007 hardcoded `tier = 'pro'` / `tier =
-- 'agency'` — after the rename above those branches would never match
-- anything, silently hiding every paid template from everyone. Replace
-- it to match the new tier values, and gate on subscription_plan (this
-- migration's model) instead of the old plan_tier: an expired
-- subscription_status now genuinely revokes access, which plan_tier
-- alone never did.
DROP POLICY IF EXISTS "Anyone can read own templates or unlocked presets" ON public.templates;

CREATE POLICY "Anyone can read own templates or unlocked presets"
  ON public.templates FOR SELECT
  USING (
    auth.uid() = user_id
    OR (
      is_preset = TRUE
      AND (
        tier = 'free'
        OR (
          tier = 'growth'
          AND EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.subscription_plan IN ('growth', 'scale') AND p.subscription_status = 'active'
          )
        )
        OR (
          tier = 'scale'
          AND EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.subscription_plan = 'scale' AND p.subscription_status = 'active'
          )
        )
      )
    )
  );

-- template_gallery (0011/0013) is a plain view over templates.tier, so
-- it picks up the renamed values automatically — no separate migration
-- needed there.
