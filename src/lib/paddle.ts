/**
 * Paddle.js overlay checkout (Paddle Billing / paddle.js v2) — Phase 4
 * billing. Replaces the earlier LemonSqueezy integration (regional
 * payment restrictions made LemonSqueezy a non-starter; that code was
 * never live).
 *
 * The checkout always carries `customData: { user_id, plan }` — the
 * webhook (worker/src/lib/billing.ts) reads those back on every
 * subscription event to know which Visora account to upgrade and to
 * which tier, without us maintaining a customer-id lookup table.
 *
 * Requires these in .env / Pages env vars once the products/prices
 * exist in Paddle (see .env.example):
 *   VITE_PADDLE_CLIENT_TOKEN     public "Client-side token" — safe to expose, this is not a secret
 *   VITE_PADDLE_ENV              "sandbox" while testing, unset/"production" once live
 *   VITE_PADDLE_PRO_PRICE_ID     Price ID (pri_...) of the Pro monthly price
 *   VITE_PADDLE_AGENCY_PRICE_ID  Price ID (pri_...) of the Agency monthly price
 */

export type PaidPlan = 'pro' | 'agency';

interface PaddleEvent {
  name?: string;
}

declare global {
  interface Window {
    Paddle?: {
      Environment: { set: (env: 'sandbox' | 'production') => void };
      Initialize: (options: { token: string; eventCallback?: (event: PaddleEvent) => void }) => void;
      Checkout: {
        open: (options: {
          items: { priceId: string; quantity: number }[];
          customer?: { email: string };
          customData?: Record<string, string>;
        }) => void;
      };
    };
  }
}

const CLIENT_TOKEN = import.meta.env.VITE_PADDLE_CLIENT_TOKEN as string | undefined;
const ENVIRONMENT = (import.meta.env.VITE_PADDLE_ENV as string | undefined) ?? 'production';

const PRICE_IDS: Record<PaidPlan, string | undefined> = {
  pro: import.meta.env.VITE_PADDLE_PRO_PRICE_ID as string | undefined,
  agency: import.meta.env.VITE_PADDLE_AGENCY_PRICE_ID as string | undefined,
};

export function isCheckoutConfigured(plan: PaidPlan): boolean {
  return Boolean(CLIENT_TOKEN && PRICE_IDS[plan]);
}

let scriptLoadPromise: Promise<void> | null = null;
let initialized = false;
// The single most recent openCheckout() call's success callback. Paddle's
// eventCallback is registered once globally at Initialize() time, not
// per-open, so this is how a later `checkout.completed` event gets
// routed back to the call that triggered it. Fine in practice since a
// person only ever has one checkout overlay open at a time.
let pendingOnSuccess: (() => void) | null = null;

function loadPaddleScript(): Promise<void> {
  if (window.Paddle) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load the Paddle checkout script.'));
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

async function ensureInitialized(): Promise<void> {
  await loadPaddleScript();
  if (initialized || !window.Paddle || !CLIENT_TOKEN) return;

  if (ENVIRONMENT === 'sandbox') {
    window.Paddle.Environment.set('sandbox');
  }
  window.Paddle.Initialize({
    token: CLIENT_TOKEN,
    eventCallback: (event) => {
      if (event.name === 'checkout.completed') {
        pendingOnSuccess?.();
        pendingOnSuccess = null;
      }
    },
  });
  initialized = true;
}

/**
 * Opens the overlay checkout for a plan. `onSuccess` fires specifically
 * on a completed purchase (the webhook does the actual upgrade — this
 * is just so the dashboard can refetch the profile and show the new
 * plan without a manual reload).
 */
export async function openCheckout(
  plan: PaidPlan,
  user: { id: string; email: string },
  onSuccess?: () => void
): Promise<void> {
  if (!isCheckoutConfigured(plan)) {
    console.error(
      `Paddle checkout for '${plan}' isn't configured — missing VITE_PADDLE_CLIENT_TOKEN or the price id env var.`
    );
    return;
  }

  await ensureInitialized();
  pendingOnSuccess = onSuccess ?? null;

  window.Paddle?.Checkout.open({
    items: [{ priceId: PRICE_IDS[plan]!, quantity: 1 }],
    customer: { email: user.email },
    customData: { user_id: user.id, plan },
  });
}
