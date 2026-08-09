import type { TemplateVariables } from './render';

/**
 * A render is fully determined by (template content, format, input
 * data) — so it's cacheable. The key folds in the template's
 * `updated_at` rather than its content hash: cheaper to compute, and
 * since 0018 bumps updated_at on every UPDATE via trigger, an edit
 * automatically invalidates every previously-cached render of that
 * template without needing to hunt down and delete old R2 objects.
 *
 * Object keys in `data` are sorted before hashing so
 * `{a:1,b:2}` and `{b:2,a:1}` — the same request in practice — hit the
 * same cache entry instead of silently missing each other.
 */
export async function computeCacheKey(
  templateId: string,
  templateUpdatedAt: string,
  format: string,
  data: TemplateVariables
): Promise<string> {
  const sortedData: TemplateVariables = {};
  for (const key of Object.keys(data).sort()) {
    sortedData[key] = data[key];
  }

  const raw = `${templateId}|${templateUpdatedAt}|${format}|${JSON.stringify(sortedData)}`;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');

  return `cache/${hex}.${format}`;
}
