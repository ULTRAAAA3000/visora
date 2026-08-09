/**
 * Outbound render-completion webhooks — Pro/Agency feature.
 *
 * Fire-and-forget: called from inside `ctx.waitUntil(...)` in
 * index.ts, so a slow or dead endpoint on the customer's side never
 * delays or fails the actual render response. We deliberately don't
 * retry on failure for v1 — that needs a durable queue to do properly
 * (Cloudflare Queues, most likely) rather than best-effort retries
 * inside a Worker that's about to be torn down anyway.
 *
 * Signing follows the GitHub/Stripe convention: HMAC-SHA256 of the raw
 * JSON body, hex-encoded, sent as `X-Visora-Signature: sha256=<hex>`,
 * so recipients can verify authenticity without also needing IP
 * allowlisting.
 */

const PLANS_WITH_WEBHOOKS = new Set(['pro', 'agency']);

interface WebhookRecipient {
  plan_tier: string;
  webhook_url: string | null;
  webhook_secret: string | null;
}

async function sign(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function deliverRenderWebhook(
  profile: WebhookRecipient,
  event: 'render.completed' | 'webhook.test',
  data: Record<string, unknown>
): Promise<void> {
  if (!PLANS_WITH_WEBHOOKS.has(profile.plan_tier)) return;
  if (!profile.webhook_url || !profile.webhook_secret) return;

  const body = JSON.stringify({ event, data, timestamp: new Date().toISOString() });
  const signature = await sign(profile.webhook_secret, body);

  try {
    const res = await fetch(profile.webhook_url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-visora-event': event,
        'x-visora-signature': `sha256=${signature}`,
      },
      body,
    });
    if (!res.ok) {
      console.error(`Webhook delivery to ${profile.webhook_url} returned ${res.status}`);
    }
  } catch (err) {
    console.error(`Webhook delivery to ${profile.webhook_url} failed`, err);
  }
}
