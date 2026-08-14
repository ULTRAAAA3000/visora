import { isBotRequest } from './_lib/bots';
import {
  homepageSnapshot,
  docsSnapshot,
  guideSnapshot,
  templatesSnapshot,
  changelogSnapshot,
  contactSnapshot,
  aboutSnapshot,
} from './_lib/snapshots';

// Dynamic rendering: Visora's frontend is a client-rendered React SPA, so
// the raw HTML it ships contains only `<div id="root">` until JS runs.
// Most AI crawlers (GPTBot, ClaudeBot, PerplexityBot, CCBot, etc.) and many
// traditional bots don't execute JS, so without this they'd see an empty
// page — unable to read, index, or recommend Visora at all. Social-preview
// unfurlers (Twitter/Slack/Discord/Telegram bots) don't execute JS either,
// so this is also what makes sharing a /docs or /guide link show that
// page's actual title/description instead of the homepage's.
//
// This middleware detects known crawler user-agents and serves a static
// HTML snapshot with the real page content instead, for a curated set of
// high-value routes. Everyone else (real visitors, any browser) gets the
// normal SPA untouched — this changes nothing about the product experience.
const SNAPSHOTS: Record<string, () => string> = {
  '/': homepageSnapshot,
  '/docs': docsSnapshot,
  '/guide': guideSnapshot,
  '/templates': templatesSnapshot,
  '/changelog': changelogSnapshot,
  '/contact': contactSnapshot,
  '/about': aboutSnapshot,
};

export const onRequest: PagesFunction = async (context) => {
  const { request } = context;
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent');

  const snapshot = SNAPSHOTS[url.pathname];
  if (snapshot && isBotRequest(userAgent)) {
    return new Response(snapshot(), {
      headers: {
        'content-type': 'text/html; charset=UTF-8',
        'cache-control': 'public, max-age=3600',
      },
    });
  }

  return context.next();
};
