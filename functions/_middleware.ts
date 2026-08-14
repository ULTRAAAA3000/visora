import { isBotRequest } from './_lib/bots';
import { homepageSnapshot } from './_lib/snapshots';

// Dynamic rendering: Visora's frontend is a client-rendered React SPA, so
// the raw HTML it ships contains only `<div id="root">` until JS runs.
// Most AI crawlers (GPTBot, ClaudeBot, PerplexityBot, CCBot, etc.) and many
// traditional bots don't execute JS, so without this they'd see an empty
// page — unable to read, index, or recommend Visora at all.
//
// This middleware detects known crawler user-agents and serves a static
// HTML snapshot with the real page content instead, for a small set of
// high-value routes. Everyone else (real visitors, any browser) gets the
// normal SPA untouched — this changes nothing about the product experience.
//
// Currently covers: homepage only. /docs, /guide, /templates still fall
// through to the SPA shell for bots (they at least get correct
// title/meta-description — full snapshots for those are a follow-up).
export const onRequest: PagesFunction = async (context) => {
  const { request } = context;
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent');

  if (isBotRequest(userAgent) && url.pathname === '/') {
    return new Response(homepageSnapshot(), {
      headers: {
        'content-type': 'text/html; charset=UTF-8',
        'cache-control': 'public, max-age=3600',
      },
    });
  }

  return context.next();
};
