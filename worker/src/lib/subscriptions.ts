import type { SupabaseClient } from '@supabase/supabase-js';
import { authenticateService, json } from './auth';
import { sendSubscriptionActivatedEmail } from './payment-emails';
import { sendTelegramAlert } from './telegram';
import type { Env } from '../env';

const VALID_PLANS = new Set(['free', 'growth', 'scale']);

interface ActivateResult {
  credits: number;
  subscription_plan: string;
  credits_reset_at: string | null;
}

async function activate(
  supabase: SupabaseClient,
  userId: string,
  plan: string,
  durationDays: number
): Promise<{ data?: ActivateResult; error?: string }> {
  const { data, error } = await supabase.rpc('activate_subscription', {
    p_user_id: userId,
    p_plan: plan,
    p_duration_days: durationDays,
  });
  if (error) {
    console.error('activate_subscription failed', error);
    return { error: error.message };
  }
  const row = Array.isArray(data) ? data[0] : data;
  return { data: row };
}

interface ActivateSubscriptionBody {
  user_id?: string;
  plan?: string;
  duration_days?: number;
}

/**
 * Manual-renewal activation for prepaid plans — there's no card
 * auto-billing (see migration 0027), so every Growth/Scale renewal
 * ultimately funnels through this endpoint: a human (Artem, or
 * whoever's running the Telegram bot / admin panel) confirms a bank
 * transfer landed, or an automated flow does the same after a manual
 * review, and calls this to actually grant the credits.
 *
 * Backend-to-backend only — guarded by ADMIN_API_SECRET, not a user's
 * own API key. Never exposed to the dashboard directly.
 */
export async function handleActivateSubscription(request: Request, env: Env, supabase: SupabaseClient): Promise<Response> {
  const auth = authenticateService(request, env.ADMIN_API_SECRET);
  if (auth.error) return auth.error;

  let body: ActivateSubscriptionBody;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: 'Invalid JSON body.' }, 400);
  }

  const { user_id, plan, duration_days = 30 } = body;
  if (!user_id || !plan) {
    return json({ success: false, error: '`user_id` and `plan` are required.' }, 400);
  }
  if (!VALID_PLANS.has(plan)) {
    return json({ success: false, error: `\`plan\` must be one of: ${[...VALID_PLANS].join(', ')}.` }, 400);
  }
  if (!Number.isInteger(duration_days) || duration_days <= 0) {
    return json({ success: false, error: '`duration_days` must be a positive integer.' }, 400);
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', user_id)
    .single();
  if (profileError || !profile) {
    return json({ success: false, error: 'No profile with that user_id.' }, 404);
  }

  const { data: result, error } = await activate(supabase, user_id, plan, duration_days);
  if (error || !result) {
    return json({ success: false, error: error ?? 'Could not activate subscription.' }, 500);
  }

  await Promise.all([
    sendSubscriptionActivatedEmail(env, {
      toEmail: profile.email,
      plan,
      credits: result.credits,
      expiresAt: result.credits_reset_at,
    }),
    sendTelegramAlert(
      env,
      `✅ <b>Subscription activated (manual)</b>\n${profile.email} → ${plan} (${result.credits.toLocaleString('en-US')} credits, ${duration_days}d)`
    ),
  ]);

  return json({ success: true, data: result });
}

interface CryptoWebhookBody {
  user_id?: string;
  email?: string;
  plan?: string;
  duration_days?: number;
  tx_reference?: string;
}

/**
 * Payment-confirmation postback for on-site crypto acquiring of a
 * subscription plan (distinct from crypto-payments.ts's
 * `/api/v1/payments/crypto/verify`, which is a user-submitted-TxID
 * flow for one-time credit add-ons, not plans). Exact payload shape
 * depends on whichever acquirer ends up wired in here — this accepts
 * a generic shared-secret-authenticated shape (user_id or email, plan,
 * tx_reference) that can be adapted once that integration is chosen.
 */
export async function handleCryptoSubscriptionWebhook(request: Request, env: Env, supabase: SupabaseClient): Promise<Response> {
  const auth = authenticateService(request, env.CRYPTO_WEBHOOK_SECRET);
  if (auth.error) return auth.error;

  let body: CryptoWebhookBody;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: 'Invalid JSON body.' }, 400);
  }

  const { user_id, email, plan, duration_days = 30, tx_reference } = body;
  if (!plan || !VALID_PLANS.has(plan)) {
    return json({ success: false, error: `\`plan\` must be one of: ${[...VALID_PLANS].join(', ')}.` }, 400);
  }
  if (!user_id && !email) {
    return json({ success: false, error: 'Either `user_id` or `email` is required.' }, 400);
  }

  const profileQuery = supabase.from('profiles').select('id, email');
  const { data: profile, error: profileError } = user_id
    ? await profileQuery.eq('id', user_id).single()
    : await profileQuery.eq('email', email).single();

  if (profileError || !profile) {
    return json({ success: false, error: 'No matching profile found.' }, 404);
  }

  const { data: result, error } = await activate(supabase, profile.id, plan, duration_days);
  if (error || !result) {
    return json({ success: false, error: error ?? 'Could not activate subscription.' }, 500);
  }

  await Promise.all([
    sendSubscriptionActivatedEmail(env, {
      toEmail: profile.email,
      plan,
      credits: result.credits,
      expiresAt: result.credits_reset_at,
    }),
    sendTelegramAlert(
      env,
      `✅ <b>Subscription activated (crypto)</b>\n${profile.email} → ${plan} (${result.credits.toLocaleString('en-US')} credits, ${duration_days}d)${tx_reference ? `\nRef: <code>${tx_reference}</code>` : ''}`
    ),
  ]);

  return json({ success: true, data: result });
}
