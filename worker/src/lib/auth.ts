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
  plan_tier: string;
  monthly_quota: number;
  usage_this_month: number;
  credit_balance: number;
  webhook_url: string | null;
  webhook_secret: string | null;
}

/**
 * `usedCredit: true` means this request is over its monthly_quota and
 * is being let through against `credit_balance` instead — the caller
 * (handleRender) needs this to know which counter to draw down in its
 * post-render bookkeeping, rather than always incrementing usage_this_month.
 */
type AuthResult =
  | { profile: AuthenticatedProfile; usedCredit: boolean; error?: undefined }
  | { profile?: undefined; usedCredit?: undefined; error: Response };

/**
 * Validates the `Authorization: Bearer VISORA_LIVE_KEY_...` header against
 * the `profiles.api_key` column in Supabase, and enforces monthly_quota —
 * falling back to the purchased `credit_balance` top-up (see migrations
 * 0025/0026) once quota is exhausted, rather than hard-blocking.
 *
 * Returns { profile, usedCredit } on success, or { error: Response } to
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

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, email, plan_tier, monthly_quota, usage_this_month, credit_balance, webhook_url, webhook_secret')
    .eq('api_key', token)
    .single();

  if (error || !profile) {
    return { error: json({ success: false, error: 'Invalid API key.' }, 401) };
  }

  if (profile.usage_this_month >= profile.monthly_quota) {
    if (profile.credit_balance <= 0) {
      return {
        error: json(
          {
            success: false,
            error: 'Monthly render quota exceeded and no credits remaining. Buy credits or upgrade your plan to continue.',
          },
          429
        ),
      };
    }
    // Actual decrement happens post-render in index.ts, via the atomic
    // consume_render_credit RPC — this only establishes that they're
    // allowed through. See that RPC for the race-safety reasoning.
    return { profile, usedCredit: true };
  }

  return { profile, usedCredit: false };
}

/**
 * Same API-key lookup as `authenticate`, but without the quota check —
 * for endpoints that aren't renders (payments, whoami-style checks).
 * A user hitting their render quota is exactly who's trying to buy
 * more, so blocking them here would be self-defeating.
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
