import type { SupabaseClient } from '@supabase/supabase-js';
import { json } from './auth';

/**
 * LemonSqueezy webhook handler (Phase 4 billing).
 *
 * The checkout is built client-side (see src/lib/lemonsqueezy.ts) and
 * always passes `checkout[custom][user_id]` and `checkout[custom][plan]`
 * — LemonSqueezy echoes these back on every webhook event as
 * `meta.custom_data`, which is how we match a subscription to a Visora
 * account without maintaining a customer-id lookup table ourselves.
 *
 * Quotas here must stay in sync with the numbers PricingSection.tsx
 * advertises on the landing page.
 */
const QUOTA_BY_TIER: Record<'free' | 'pro' | 'agency', number> = {
  free: 500,
  pro: 20_000,
  agency: 100_000,
};

function resolveTier(planFromCustomData: unknown): 'pro' | 'agency' {
  return planFromCustomData === 'agency' ? 'agency' : 'pro';
}

/** Timing-safe-ish hex digest comparison (lengths are always equal for SHA-256, but check anyway). */
function digestsMatch(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

async function verifySignature(rawBody: string, signatureHeader: string | null, secret: string): Promise<boolean> {
  if (!signatureHeader || !secret) return false;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
  const digestHex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');

  return digestsMatch(digestHex, signatureHeader);
}

interface LemonSqueezyWebhookPayload {
  meta?: {
    event_name?: string;
    custom_data?: { user_id?: string; plan?: string };
  };
  data?: {
    id?: string;
    attributes?: {
      status?: string;
      customer_id?: number;
      renews_at?: string | null;
      ends_at?: string | null;
    };
  };
}

export async function handleLemonSqueezyWebhook(
  request: Request,
  secret: string,
  supabase: SupabaseClient
): Promise<Response> {
  const rawBody = await request.text();
  const signature = request.headers.get('X-Signature');

  if (!(await verifySignature(rawBody, signature, secret))) {
    return json({ success: false, error: 'Invalid webhook signature.' }, 401);
  }

  let payload: LemonSqueezyWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json({ success: false, error: 'Invalid JSON body.' }, 400);
  }

  const eventName = payload.meta?.event_name ?? '';
  const userId = payload.meta?.custom_data?.user_id;

  if (!userId) {
    // Can't match this event to a Visora account (e.g. a test event fired
    // from the LemonSqueezy dashboard without custom data). Ack with 200
    // so LemonSqueezy doesn't retry indefinitely, but don't touch any row.
    console.error(`LemonSqueezy webhook '${eventName}' had no custom_data.user_id — ignored.`);
    return json({ success: true, ignored: true });
  }

  const attrs = payload.data?.attributes ?? {};
  const subscriptionId = payload.data?.id;
  const customerId = attrs.customer_id != null ? String(attrs.customer_id) : undefined;

  const baseUpdate = {
    lemonsqueezy_customer_id: customerId,
    lemonsqueezy_subscription_id: subscriptionId,
    subscription_status: attrs.status,
    plan_renews_at: attrs.renews_at ?? null,
  };

  switch (eventName) {
    // A brand-new or renewed/reactivated subscription — upgrade the account.
    case 'subscription_created':
    case 'subscription_updated':
    case 'subscription_resumed':
    case 'subscription_unpaused': {
      const tier = resolveTier(payload.meta?.custom_data?.plan);
      await supabase
        .from('profiles')
        .update({ ...baseUpdate, plan_tier: tier, monthly_quota: QUOTA_BY_TIER[tier] })
        .eq('id', userId);
      break;
    }

    // Cancelling doesn't end access immediately — LemonSqueezy keeps the
    // subscription `active`-equivalent until the paid period actually
    // runs out, then fires `subscription_expired`. Just record the status
    // here so the dashboard can show "cancels on <date>".
    case 'subscription_cancelled':
    case 'subscription_paused':
    case 'subscription_payment_failed': {
      await supabase.from('profiles').update(baseUpdate).eq('id', userId);
      break;
    }

    // The paid period is actually over — this is what downgrades access.
    case 'subscription_expired': {
      await supabase
        .from('profiles')
        .update({ ...baseUpdate, plan_tier: 'free', monthly_quota: QUOTA_BY_TIER.free })
        .eq('id', userId);
      break;
    }

    default:
      // subscription_payment_success and anything else — nothing to do.
      break;
  }

  return json({ success: true });
}
