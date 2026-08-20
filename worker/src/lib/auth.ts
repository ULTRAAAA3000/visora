import type { SupabaseClient } from '@supabase/supabase-js';

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

interface AuthenticatedProfile {
  id: string;
  email: string;
  credits: number;
  subscription_plan: string;
  subscription_status: string;
  webhook_url: string | null;
  webhook_secret: string | null;
}

type AuthResult = { profile: AuthenticatedProfile; error?: undefined } | { profile?: undefined; error: Response };

// Renders all cost the same for now — a template that turns out to be
// meaningfully more expensive to render (e.g. very large canvases) can
// read a per-template cost later; nothing here assumes 1.
export const RENDER_COST = 1;

/**
 * Validates the `Authorization: Bearer VISORA_LIVE_KEY_...` header and
 * enforces the prepaid-credits model (see migration 0027): looks the
 * profile up via `get_profile_for_api_key`, which also expires a stale
 * paid subscription back to Free right there if `credits_reset_at` has
 * passed — the "check on every request" requirement, done inline
 * rather than via a separate cron so there's no window where an
 * expired plan still spends against last month's credits.
 *
 * Returns { profile } on success, or { error: Response } to
 * short-circuit the request with an already-built error response.
 */
export async function authenticate(request: Request, supabase: SupabaseClient): Promise<AuthResult> {
  const authHeader = request.headers.get('Authorization') || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return {
      error: json(
        { success: false, error: 'Missing or malformed Authorization header. Expected: Bearer <api_key>' },
        401
      ),
    };
  }

  const { data, error } = await supabase.rpc('get_profile_for_api_key', { p_api_key: token });
  const profile = Array.isArray(data) ? data[0] : data;

  if (error || !profile) {
    return { error: json({ success: false, error: 'Invalid API key.' }, 401) };
  }

  if (profile.credits < RENDER_COST) {
    return {
      error: json(
        {
          success: false,
          error:
            profile.subscription_status === 'expired'
              ? 'Your subscription has expired. Renew your plan or buy credits to continue.'
              : 'Not enough credits. Buy credits or upgrade your plan to continue.',
        },
        429
      ),
    };
  }

  return { profile };
}

/**
 * Same API-key lookup, but without the credits check — for endpoints
 * that aren't renders (payments, whoami-style checks). Someone out of
 * credits is exactly who's trying to buy more, so blocking them here
 * would be self-defeating.
 */
export async function authenticateBasic(
  request: Request,
  supabase: SupabaseClient
): Promise<{ profile: { id: string; email: string }; error?: undefined } | { profile?: undefined; error: Response }> {
  const authHeader = request.headers.get('Authorization') || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return {
      error: json(
        { success: false, error: 'Missing or malformed Authorization header. Expected: Bearer <api_key>' },
        401
      ),
    };
  }

  const { data: profile, error } = await supabase.from('profiles').select('id, email').eq('api_key', token).single();

  if (error || !profile) {
    return { error: json({ success: false, error: 'Invalid API key.' }, 401) };
  }

  return { profile };
}

/**
 * Guards the two backend-to-backend payment endpoints
 * (/api/admin/subscriptions/activate, /api/webhooks/crypto) — these
 * are called by the admin panel, a Telegram bot, or a crypto
 * acquirer's server, never directly by a logged-in user, so a static
 * shared secret (not a user API key) is the right check.
 */
export function authenticateService(request: Request, expectedSecret: string | undefined): { error?: Response } {
  if (!expectedSecret) {
    return { error: json({ success: false, error: 'This endpoint is not configured.' }, 503) };
  }

  const authHeader = request.headers.get('Authorization') || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || token !== expectedSecret) {
    return { error: json({ success: false, error: 'Unauthorized.' }, 401) };
  }

  return {};
}
