/**
 * Shared {{variable}} template helpers. Extracted out of TemplateEditor
 * so the bulk-generation page (Dashboard → Bulk) can reuse the exact
 * same fill/extract logic instead of drifting out of sync with it.
 */

export type VariableValues = Record<string, string>;

export function fillTemplate(htmlBody: string, variables: VariableValues): string {
  return htmlBody.replace(/{{\s*([\w.]+)\s*}}/g, (_match, key: string) => {
    const value = variables[key];
    return value === undefined || value === null ? '' : String(value);
  });
}

/** Extracts every unique {{key}} placeholder from an HTML template, in order of first appearance. */
export function extractVariableKeys(htmlBody: string): string[] {
  const keys: string[] = [];
  const seen = new Set<string>();
  const regex = /{{\s*([\w.]+)\s*}}/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(htmlBody)) !== null) {
    if (!seen.has(match[1])) {
      seen.add(match[1]);
      keys.push(match[1]);
    }
  }
  return keys;
}

export function humanizeKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
