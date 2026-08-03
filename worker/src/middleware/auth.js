/**
 * Validates the `Authorization: Bearer VISORA_LIVE_KEY_...` header against
 * the `profiles.api_key` column in Supabase, and enforces monthly_quota.
 *
 * On success, attaches `request.profile` (the matching profiles row) so
 * downstream route handlers don't need to re-query it.
 */
export function createAuthMiddleware(supabase) {
  return async function authenticate(request, reply) {
    const authHeader = request.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return reply.code(401).send({
        success: false,
        error: 'Missing or malformed Authorization header. Expected: Bearer <api_key>',
      });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, email, plan_tier, monthly_quota, usage_this_month')
      .eq('api_key', token)
      .single();

    if (error || !profile) {
      return reply.code(401).send({ success: false, error: 'Invalid API key.' });
    }

    if (profile.usage_this_month >= profile.monthly_quota) {
      return reply.code(429).send({
        success: false,
        error: 'Monthly render quota exceeded. Upgrade your plan to continue.',
      });
    }

    request.profile = profile;
  };
}
