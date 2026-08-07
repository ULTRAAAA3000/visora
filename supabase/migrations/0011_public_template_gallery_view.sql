-- Visora — public gallery browsing for anonymous visitors.
--
-- The RLS policy on `templates` (0007) correctly hides pro/agency rows
-- entirely from anonymous requests (auth.uid() is NULL, so the tier
-- EXISTS-subquery never matches) — that's intentional, it protects the
-- html_body IP of gated templates. But it also means a logged-out visitor
-- browsing /templates would only ever see free-tier rows, silently
-- missing 20 of 30 templates with no error to explain why.
--
-- Fix: a view exposing only safe, non-sensitive columns (no html_body,
-- no default_variables) for every preset regardless of tier, so visitors
-- can see what exists and what's gated — without leaking the actual
-- template implementation of paid tiers.

CREATE OR REPLACE VIEW public.template_gallery AS
SELECT id, tier, title, category, width, height, created_at
FROM public.templates
WHERE is_preset = TRUE;

-- Views run with the creating role's privileges by default (not the
-- caller's RLS), which is what we want here — deliberately bypassing the
-- base table's tier-gated RLS for this metadata-only view. Grant access
-- explicitly since Supabase's anon/authenticated roles aren't covered by
-- table-level RLS grants automatically.
GRANT SELECT ON public.template_gallery TO anon, authenticated;
