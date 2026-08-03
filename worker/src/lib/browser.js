import puppeteer from 'puppeteer-core';

/**
 * Keeps a single long-lived Chromium instance around instead of
 * launching a fresh browser per request — this is most of where the
 * "< 150ms renders" number in the spec comes from. Pages are opened
 * and closed per-request; the browser process itself stays warm.
 */
let browserPromise = null;

const CHROMIUM_PATH =
  process.env.CHROMIUM_PATH || '/usr/bin/chromium-browser' /* Docker default, see Dockerfile */;

async function launchBrowser() {
  return puppeteer.launch({
    executablePath: CHROMIUM_PATH,
    headless: 'shell',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-extensions',
      '--disable-background-networking',
      '--font-render-hinting=none',
    ],
  });
}

export async function getBrowser() {
  if (!browserPromise) {
    browserPromise = launchBrowser();
  }

  const browser = await browserPromise;

  // If Chromium crashed or was killed, relaunch on next call.
  if (!browser.isConnected()) {
    browserPromise = launchBrowser();
    return browserPromise;
  }

  return browser;
}

export async function closeBrowser() {
  if (!browserPromise) return;
  const browser = await browserPromise;
  await browser.close();
  browserPromise = null;
}
