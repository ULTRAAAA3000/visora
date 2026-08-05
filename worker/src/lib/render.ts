import puppeteer from '@cloudflare/puppeteer';

export type TemplateVariables = Record<string, string>;

/**
 * Replaces {{key}} placeholders in the template's html_body with values
 * from `data`, falling back to the template's own default_variables.
 * Unmatched placeholders are left blank rather than throwing, so a
 * missing field degrades gracefully instead of failing the whole render.
 */
export function fillTemplate(
  htmlBody: string,
  data: TemplateVariables = {},
  defaultVariables: TemplateVariables = {}
): string {
  const merged = { ...defaultVariables, ...data };

  return htmlBody.replace(/{{\s*([\w.]+)\s*}}/g, (_match, key: string) => {
    const value = merged[key];
    return value === undefined || value === null ? '' : String(value);
  });
}

export interface RenderOptions {
  html: string;
  width: number;
  height: number;
  format?: 'png' | 'jpeg';
}

/**
 * Renders a filled HTML string to an image buffer using Cloudflare's
 * Browser Rendering binding (a Cloudflare-managed Chromium fleet reached
 * over an RPC channel — there is no local browser process on a Worker).
 */
export async function renderHtmlToImage(
  browserBinding: Fetcher,
  { html, width, height, format = 'png' }: RenderOptions
): Promise<Uint8Array> {
  const browser = await puppeteer.launch(browserBinding);

  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: 1 });

    // Templates are self-contained (inline styles / Tailwind CDN script),
    // so 'domcontentloaded' is enough — no need to wait on network idle.
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    // Passed as a string (not a function) on purpose: this runs inside the
    // Puppeteer-controlled page, a real browser context with `document` —
    // but the Worker's own TS lib has no DOM types, so a typed arrow
    // function here would fail to compile even though it's valid at runtime.
    await page.evaluate('document.fonts ? document.fonts.ready : true');

    return await page.screenshot({
      type: format === 'jpeg' ? 'jpeg' : 'png',
      clip: { x: 0, y: 0, width, height },
    });
  } finally {
    await browser.close();
  }
}
