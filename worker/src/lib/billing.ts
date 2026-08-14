import type { SupabaseClient } from '@supabase/supabase-js';
import { json } from './auth';

/**
 * Paddle webhook handler (Phase 4 billing).
 *
 * The checkout is built client-side (see src/lib/paddle.ts) and always
 * passes `customData: { user_id, plan }` — Paddle echoes this back on
 * every subscription webhook as `data.custom_data`, which is how we
 * match a subscription to a Visora account without maintaining a
 * customer-id lookup table ourselves.
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

/**
 * Paddle's signature header looks like `ts=1671552777;h1=<hex>` — the
 * hash is HMAC-SHA256 over `${ts}:${rawBody}` (note the colon; this is
 * NOT just a signature over the raw body like LemonSqueezy/Stripe use),
 * keyed with the notification destination's secret key.
 * https://developer.paddle.com/webhooks/signature-verification
 */
async function verifySignature(rawBody: string, signatureHeader: string | null, secret: string): Promise<boolean> {
  if (!signatureHeader || !secret) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(';').map((pair) => {
      const [k, v] = pair.split('=');
      return [k, v];
    })
  );
  const timestamp = parts.ts;
  const receivedHash = parts.h1;
  if (!timestamp || !receivedHash) return false;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}:${rawBody}`));
  const digestHex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');

  return digestsMatch(digestHex, receivedHash);
}

interface PaddleWebhookPayload {
  event_type?: string;
  data?: {
    id?: string;
    status?: string; // 'trialing' | 'active' | 'past_due' | 'paused' | 'canceled'
    customer_id?: string;
    next_billed_at?: string | null;
    custom_data?: { user_id?: string; plan?: string } | null;
  };
}

export async function handlePaddleWebhook(request: Request, secret: string, supabase: SupabaseClient): Promise<Response> {
  const rawBody = await request.text();
  const signature = request.headers.get('Paddle-Signature');

  if (!(await verifySignature(rawBody, signature, secret))) {
    return json({ success: false, error: 'Invalid webhook signature.' }, 401);
  }

  let payload: PaddleWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json({ success: false, error: 'Invalid JSON body.' }, 400);
  }

  const eventType = payload.event_type ?? '';
  const data = payload.data ?? {};
  const userId = data.custom_data?.user_id;

  if (!userId) {
    // Can't match this event to a Visora account (e.g. a test event
    // fired from the Paddle dashboard without custom data). Ack with
    // 200 so Paddle doesn't retry indefinitely, but don't touch any row.
    console.error(`Paddle webhook '${eventType}' had no custom_data.user_id — ignored.`);
    return json({ success: true, ignored: true });
  }

  if (!eventType.startsWith('subscription.')) {
    // transaction.* events etc. — nothing to do, subscription.* events
    // are the authoritative source for plan_tier.
    return json({ success: true, ignored: true });
  }

  const status = data.status;
  const baseUpdate = {
    paddle_customer_id: data.customer_id,
    paddle_subscription_id: data.id,
    subscription_status: status,
    plan_renews_at: data.next_billed_at ?? null,
  };

  if (status === 'active' || status === 'trialing') {
    // Covers subscription.created/updated/activated/resumed — Paddle's
    // `status` field is authoritative, so branching on it directly
    // (rather than on which specific event_type fired) means a
    // scheduled-cancel-at-period-end subscription correctly keeps its
    // paid tier: Paddle keeps status 'active' with a scheduled_change
    // attached until the period actually ends.
    const tier = resolveTier(data.custom_data?.plan);
    await supabase
      .from('profiles')
      .update({ ...baseUpdate, plan_tier: tier, monthly_quota: QUOTA_BY_TIER[tier] })
      .eq('id', userId);
  } else if (status === 'canceled') {
    // The paid period is actually over — this is what downgrades access.
    await supabase
      .from('profiles')
      .update({ ...baseUpdate, plan_tier: 'free', monthly_quota: QUOTA_BY_TIER.free })
      .eq('id', userId);
  } else {
    // 'past_due' or 'paused' — record status so the dashboard can show
    // it, but don't touch plan_tier; Paddle's own dunning/grace-period
    // handling decides if/when this recovers or eventually cancels.
    await supabase.from('profiles').update(baseUpdate).eq('id', userId);
  }

  return json({ success: true });
}
