import type { SupabaseClient } from '@supabase/supabase-js';
import { json } from './auth';

interface TrackBody {
  path?: string;
}

/**
 * The self-hosted alternative to a third-party analytics SDK: one tiny
 * row per pageview, geo from Cloudflare's own request.cf (no external
 * IP-lookup service, no raw IP stored). Fire-and-forget from the
 * caller's side — the frontend doesn't wait on or care about the
 * response, so this stays fast and never blocks navigation.
 */
export async function handleTrack(request: Request, supabase: SupabaseClient): Promise<Response> {
  let body: TrackBody;
  try {
    body = await request.json();
  } catch {
    return json({ success: false }, 400);
  }

  const path = (body.path ?? '/').slice(0, 500);
  const referrer = request.headers.get('referer')?.slice(0, 500) || null;
  const country = (request as Request & { cf?: { country?: string } }).cf?.country ?? null;

  const { error } = await supabase.from('page_views').insert({ path, referrer, country });
  if (error) {
    console.error('Failed to record page view', error);
    return json({ success: false }, 500);
  }

  return json({ success: true });
}
