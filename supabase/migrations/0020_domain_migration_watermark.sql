-- Domain migration: visora.io -> visor-a.com.
--
-- Two preset templates (both titled 'Premium Magazine Cover' — one from
-- migration 0008, redesigned in 0012) bake a "visora.io" watermark
-- directly into html_body. Editing the old migration files does nothing
-- retroactively since they've already run — this UPDATE targets
-- whatever's actually live in the table right now, regardless of which
-- migration last wrote it.
UPDATE public.templates
SET html_body = REPLACE(html_body, 'visora.io', 'visor-a.com')
WHERE html_body LIKE '%visora.io%';
