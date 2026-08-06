import type { Env } from '../env';

export interface RenderResult {
  ok: true;
  imageUrl: string;
}
export interface RenderError {
  ok: false;
  error: string;
}

export async function renderTemplate(
  env: Env,
  apiKey: string,
  templateId: string,
  data: Record<string, string>
): Promise<RenderResult | RenderError> {
  let response: Response;
  try {
    response = await fetch(`${env.VISORA_API_URL.replace(/\/$/, '')}/api/v1/render`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ template_id: templateId, format: 'png', cache: true, data }),
    });
  } catch (err) {
    return { ok: false, error: 'Could not reach the Visora render API. Try again in a moment.' };
  }

  let body: { success?: boolean; data?: { url?: string }; error?: string } | null = null;
  try {
    body = await response.json();
  } catch {
    // fall through — body stays null, handled below
  }

  if (!response.ok || !body?.success || !body.data?.url) {
    return { ok: false, error: body?.error || `Render failed (HTTP ${response.status}).` };
  }

  return { ok: true, imageUrl: body.data.url };
}

/**
 * Parses `tpl_id title="Nike Air Max" price=3499` style command args.
 * The first bare token (no `=`) is treated as an optional template_id
 * override; everything else must be key=value or key="quoted value".
 */
export function parseRenderArgs(text: string): { templateId?: string; data: Record<string, string> } {
  const data: Record<string, string> = {};
  let templateId: string | undefined;

  const pattern = /(\w+)="([^"]*)"|(\w+)=(\S+)|(\S+)/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match[1] !== undefined) {
      data[match[1]] = match[2];
    } else if (match[3] !== undefined) {
      data[match[3]] = match[4];
    } else if (match[5] !== undefined && templateId === undefined && Object.keys(data).length === 0) {
      templateId = match[5];
    }
  }

  return { templateId, data };
}
