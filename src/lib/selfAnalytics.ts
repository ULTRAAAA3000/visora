/**
 * Self-hosted pageview tracking — our own Worker + Supabase, not a
 * third-party analytics SDK. Visible in /admin (AdminAnalytics.tsx).
 * A no-op if VITE_RENDER_API_URL isn't set, same graceful-degradation
 * pattern as everything else that talks to the Worker directly.
 */
export function trackPageviewSelf(path: string): void {
  const apiBase = import.meta.env.VITE_RENDER_API_URL;
  if (!apiBase) return;

  // Skip /admin — Artem checking his own dashboard shouldn't inflate
  // the traffic numbers he's looking at.
  if (path.startsWith('/admin')) return;

  fetch(`${apiBase.replace(/\/$/, '')}/api/v1/track`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ path }),
    keepalive: true,
  }).catch(() => {
    // Best-effort — a dropped tracking beacon is never worth surfacing.
  });
}
