/**
 * Google Analytics 4 — loaded lazily and only if VITE_GA_MEASUREMENT_ID
 * is actually set, so local dev / previews without it don't send any
 * data or even load gtag.js. `send_page_view: false` on config because
 * this is a single-page app: the initial gtag.js load would otherwise
 * fire one pageview for whatever route the user landed on, and then
 * every subsequent in-app navigation (which never triggers a real page
 * load) would go untracked. trackPageview() is called manually on every
 * route change instead — see RouteTracker in main.tsx.
 *
 * No Google Signals / ad personalization is enabled — this is set up
 * for aggregate traffic/usage numbers only, matching what Privacy.tsx
 * describes.
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

let initialized = false;

export function initAnalytics(): void {
  if (!MEASUREMENT_ID || initialized) return;
  initialized = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', MEASUREMENT_ID, { send_page_view: false });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);
}

export function trackPageview(path: string): void {
  if (!MEASUREMENT_ID) return;
  window.gtag?.('event', 'page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
}
