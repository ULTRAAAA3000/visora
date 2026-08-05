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
}

type AuthResult = { profile: AuthenticatedProfile; error?: undefined } | { profile?: undefined; error: Response };

/**
 * Validates the `Authorization: Bearer VISORA_LIVE_KEY_...` header against
 * the `profiles.api_key` column in Supabase, and enforces monthly_quota.
 *
 * Returns { profile } on success, or { error: Response } to short-circuit
 * the request with an already-built error response.
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
    .select('id, email, plan_tier, monthly_quota, usage_this_month')
    .eq('api_key', token)
    .single();

  if (error || !profile) {
    return { error: json({ success: false, error: 'Invalid API key.' }, 401) };
  }

  if (profile.usage_this_month >= profile.monthly_quota) {
    return {
      error: json(
        { success: false, error: 'Monthly render quota exceeded. Upgrade your plan to continue.' },
        429
      ),
    };
  }

  return { profile };
}
