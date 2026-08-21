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
 * Overlays a semi-transparent logo in the bottom-right corner before
 * rendering. Injected as a plain <img> with `position:fixed` — since
 * rendering already goes through a real headless-Chromium page
 * (renderHtmlToImage below), compositing here means Chromium does the
 * image work for free, no separate image-manipulation library needed
 * in the Worker. `fixed` (not `absolute`) makes it independent of
 * whatever positioning scheme a given template's own markup uses —
 * every preset renders it identically, in a corner of the viewport,
 * regardless of internal layout.
 *
 * Percentage-based sizing/inset so it scales sensibly across very
 * different render dimensions (a 1080x1920 Instagram Story vs a
 * 1600x900 Shopify banner) without per-format tuning.
 */
export function withWatermark(html: string, logoUrl: string): string {
  const overlay =
    `<img src="${logoUrl}" alt="" ` +
    `style="position:fixed;bottom:3%;right:3%;max-width:16%;max-height:16%;` +
    `opacity:0.55;pointer-events:none;z-index:2147483647;" />`;

  return /<\/body>/i.test(html) ? html.replace(/<\/body>/i, `${overlay}</body>`) : html + overlay;
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
