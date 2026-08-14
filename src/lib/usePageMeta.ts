import { useEffect } from 'react';

const SITE_NAME = 'Visora';
const SITE_URL = 'https://visor-a.com';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

function setMeta(selector: string, attr: string, value: string) {
  let el = document.head.querySelector(selector) as HTMLMetaElement | HTMLLinkElement | null;
  if (!el) {
    const isLink = selector.startsWith('link');
    el = document.createElement(isLink ? 'link' : 'meta');
    if (isLink) {
      const relMatch = selector.match(/rel="([^"]+)"/);
      if (relMatch) el.setAttribute('rel', relMatch[1]);
    } else {
      const propMatch = selector.match(/(property|name)="([^"]+)"/);
      if (propMatch) el.setAttribute(propMatch[1], propMatch[2]);
    }
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

interface PageMetaOptions {
  title: string;
  description: string;
  /** Defaults to the current pathname under https://visor-a.com. */
  path?: string;
  image?: string;
  /** Set false for titles that already stand alone (e.g. the homepage's). */
  suffix?: boolean;
}

/**
 * Every route shared the same <title>/<meta description>/OG tags from
 * index.html until this — meaning every browser tab said the same
 * thing regardless of page, and sharing a /docs or /guide link on
 * Twitter/Slack/Telegram (none of which execute JS) showed the
 * homepage's title and description instead of that page's.
 *
 * This only helps real browsers and JS-executing crawlers (Google/Bing
 * both render JS before indexing). Non-JS bots — most social-preview
 * unfurlers and several AI crawlers — never run this; those are
 * handled separately by functions/_lib/snapshots.ts, which serves
 * fully static HTML with the right tags baked in. Keep both in sync
 * when a page's title/description changes.
 */
export function usePageMeta({ title, description, path, image, suffix = true }: PageMetaOptions): void {
  useEffect(() => {
    const fullTitle = suffix ? `${title} · ${SITE_NAME}` : title;
    const url = `${SITE_URL}${path ?? window.location.pathname}`;
    const ogImage = image ?? DEFAULT_OG_IMAGE;

    document.title = fullTitle;
    setMeta('meta[name="description"]', 'content', description);
    setMeta('link[rel="canonical"]', 'href', url);

    setMeta('meta[property="og:title"]', 'content', fullTitle);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[property="og:url"]', 'content', url);
    setMeta('meta[property="og:image"]', 'content', ogImage);

    setMeta('meta[name="twitter:title"]', 'content', fullTitle);
    setMeta('meta[name="twitter:description"]', 'content', description);
    setMeta('meta[name="twitter:image"]', 'content', ogImage);
  }, [title, description, path, image, suffix]);
}
