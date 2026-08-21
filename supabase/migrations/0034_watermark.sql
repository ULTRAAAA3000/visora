-- Smart Watermark: a user uploads their own logo once (dashboard
-- Overview page) and Visora auto-composites it, semi-transparent, into
-- the bottom-right corner of every render from then on — content
-- protection for sellers whose product renders get re-hosted/reused
-- elsewhere without credit.
--
-- watermark_logo_key stores the R2 object key (visora-renders bucket,
-- fixed key 'watermarks/{user_id}' so re-uploading overwrites rather
-- than accumulating orphaned files), not a full URL — the serving
-- domain has already changed once (visora.io -> visor-a.com) and
-- storing a resolved URL is exactly the staleness bug migration 0026
-- just fixed for template previews. The public URL is always derived
-- at request time by the render Worker's GET /watermark-logo/:userId.
--
-- watermark_enabled is separate from "has a logo uploaded" so a user
-- can turn it off temporarily without losing/re-uploading the file.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS watermark_logo_key TEXT,
  ADD COLUMN IF NOT EXISTS watermark_enabled BOOLEAN NOT NULL DEFAULT TRUE;

-- get_profile_for_api_key (0032) needs to return the two new columns
-- so the render path (worker/src/index.ts handleRender) can decide
-- whether to composite a watermark without a second round-trip query.
-- Postgres requires dropping the function before changing its RETURNS
-- TABLE column list — CREATE OR REPLACE alone rejects that.
DROP FUNCTION IF EXISTS public.get_profile_for_api_key(TEXT);

CREATE FUNCTION public.get_profile_for_api_key(p_api_key TEXT)
RETURNS TABLE (
  id UUID,
  email TEXT,
  credits INT,
  subscription_plan TEXT,
  subscription_status TEXT,
  webhook_url TEXT,
  webhook_secret TEXT,
  watermark_logo_key TEXT,
  watermark_enabled BOOLEAN
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
    SELECT p.id, p.email, p.credits, p.subscription_plan, p.subscription_status, p.webhook_url, p.webhook_secret,
           p.watermark_logo_key, p.watermark_enabled
    FROM public.profiles p WHERE p.id = v_id;
END;
$$;
