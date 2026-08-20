-- Belt-and-braces companion to the render Worker's new /preview/:id.png
-- route (self-healing thumbnails — see worker/src/index.ts handlePreview
-- and src/lib/templatePreview.ts, which the dashboard and public gallery
-- now use instead of this column).
--
-- `templates.preview_image_url` itself is no longer read by the
-- frontend, but it's kept around for any external consumer (API
-- clients, scripts/generate-template-previews.mjs) that might still
-- reference it. This trigger stops it from silently going stale the
-- way it did twice already (workers.dev -> custom domain migration,
-- then the visora.io -> visor-a.com watermark rewrite): any edit to a
-- preset's html_body nulls the column out rather than leaving a URL
-- that points at a render of the *old* content.
CREATE OR REPLACE FUNCTION public.clear_stale_preview_on_html_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_preset = TRUE AND NEW.html_body IS DISTINCT FROM OLD.html_body THEN
    NEW.preview_image_url := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_clear_stale_preview ON public.templates;

CREATE TRIGGER trg_clear_stale_preview
  BEFORE UPDATE ON public.templates
  FOR EACH ROW
  EXECUTE FUNCTION public.clear_stale_preview_on_html_change();
