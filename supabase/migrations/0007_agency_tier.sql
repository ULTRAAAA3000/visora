-- Visora — three-tier preset gating (free / pro / agency), replacing the
-- binary is_premium flag. Agency templates are exclusive: a 'pro' plan
-- does NOT unlock them, only 'agency' does. Pro templates unlock for both
-- 'pro' and 'agency' (agency includes everything pro gets, plus its own
-- exclusive set).

ALTER TABLE public.templates
  ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'free'
    CHECK (tier IN ('free', 'pro', 'agency'));

-- Backfill from the old is_premium flag before dropping it.
UPDATE public.templates SET tier = 'pro' WHERE is_premium = TRUE;

ALTER TABLE public.templates DROP COLUMN is_premium;

CREATE INDEX IF NOT EXISTS idx_templates_tier ON public.templates(tier);

-- Replace the SELECT policy: free tier always visible; 'pro' unlocks for
-- plan_tier IN ('pro','agency'); 'agency' unlocks ONLY for plan_tier =
-- 'agency' (exclusive, not inherited by 'pro').
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
          tier = 'pro'
          AND EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.plan_tier IN ('pro', 'agency')
          )
        )
        OR (
          tier = 'agency'
          AND EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.plan_tier = 'agency'
          )
        )
      )
    )
  );
