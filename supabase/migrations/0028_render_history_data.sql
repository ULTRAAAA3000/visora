-- Render history + "Quick Re-run": render_logs only ever stored
-- template_id/timing/status/image_url — never the actual field values
-- used, so there was nothing to prefill a re-run with. Add that.
ALTER TABLE public.render_logs
  ADD COLUMN IF NOT EXISTS data JSONB;

COMMENT ON COLUMN public.render_logs.data IS
  'Field values used for this render (same shape as templates.default_variables), captured at render time so the dashboard can offer "repeat with same settings" without the user re-entering anything.';
