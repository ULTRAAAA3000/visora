-- Both template galleries (public /templates and the dashboard) show a
-- placeholder icon instead of an actual preview right now. Add a column
-- to hold a rendered preview image URL — populated by actually calling
-- Visora's own render API on each preset's default_variables (see
-- scripts/generate-template-previews.mjs). Dogfooding: the preview
-- images for "render HTML into an image" are themselves renders.

ALTER TABLE public.templates
  ADD COLUMN preview_image_url TEXT;

CREATE OR REPLACE VIEW public.template_gallery AS
SELECT id, tier, title, category, width, height, preview_image_url, created_at
FROM public.templates
WHERE is_preset = TRUE;
