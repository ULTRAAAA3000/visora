-- Render caching support. The render API has returned a `cached` field
-- since day one, but nothing ever set it to true — every request re-ran
-- a full headless-Chromium render even for identical (template, data)
-- pairs, burning Browser Rendering minutes for no reason.
--
-- Cache keys (see worker/src/lib/cache.ts) are a hash of
-- (template_id, template.updated_at, format, data). Bumping updated_at
-- on any edit is what makes a template change automatically invalidate
-- every cached render of it, without needing to explicitly walk R2 and
-- delete old cache entries.

ALTER TABLE public.templates
  ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER templates_set_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
