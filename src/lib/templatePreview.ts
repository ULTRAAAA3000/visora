/**
 * Stable, self-healing preview-image URL for a preset template. Served
 * by the render Worker's /preview/:id.png route (see worker/src/index.ts
 * handlePreview), which re-derives the render on demand — so unlike a
 * one-off URL stored in `templates.preview_image_url`, this never goes
 * stale when the API domain changes or a preset's html_body is edited.
 *
 * Falls back to `undefined` if VITE_RENDER_API_URL isn't configured,
 * same graceful-degradation pattern used elsewhere in the dashboard.
 */
export function templatePreviewUrl(templateId: string): string | undefined {
  const apiBase = import.meta.env.VITE_RENDER_API_URL;
  if (!apiBase) return undefined;
  return `${apiBase.replace(/\/$/, '')}/preview/${templateId}.png`;
}
