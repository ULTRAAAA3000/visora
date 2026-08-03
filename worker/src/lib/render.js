import { getBrowser } from './browser.js';

/**
 * Replaces {{key}} placeholders in the template's html_body with values
 * from `data`, falling back to the template's own default_variables.
 * Unmatched placeholders are left blank rather than throwing, so a
 * missing field degrades gracefully instead of failing the whole render.
 */
export function fillTemplate(htmlBody, data = {}, defaultVariables = {}) {
  const merged = { ...defaultVariables, ...data };

  return htmlBody.replace(/{{\s*([\w.]+)\s*}}/g, (_match, key) => {
    const value = merged[key];
    return value === undefined || value === null ? '' : String(value);
  });
}

/**
 * Renders a filled HTML string to a PNG/JPEG buffer at the requested
 * dimensions using a shared, already-warm Chromium instance.
 */
export async function renderHtmlToImage({ html, width, height, format = 'png' }) {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setViewport({ width, height, deviceScaleFactor: 1 });

    // 'domcontentloaded' is enough since templates are self-contained
    // (inline styles / Tailwind CDN script), and networkidle waits are
    // exactly the kind of latency this engine exists to avoid.
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 5000 });

    // Let @import fonts / Tailwind CDN script finish applying styles.
    await page.evaluateHandle('document.fonts ? document.fonts.ready : true');

    const buffer = await page.screenshot({
      type: format === 'jpeg' ? 'jpeg' : 'png',
      clip: { x: 0, y: 0, width, height },
    });

    return buffer;
  } finally {
    await page.close();
  }
}
