/**
 * LemonSqueezy overlay checkout (lemon.js) — Phase 4 billing.
 *
 * We deliberately don't use LemonSqueezy's product-level Checkout API to
 * create a session server-side; a static Buy Link with query-string
 * overrides is enough for two fixed monthly plans and skips a whole
 * round trip. The checkout always carries `custom[user_id]` and
 * `custom[plan]` — the webhook (worker/src/lib/billing.ts) reads those
 * back to know which Visora account to upgrade and to which tier.
 *
 * Requires these in .env / Pages env vars once the products exist in
 * LemonSqueezy (see .env.example):
 *   VITE_LEMONSQUEEZY_STORE              e.g. "visora" for visora.lemonsqueezy.com
 *   VITE_LEMONSQUEEZY_PRO_VARIANT_ID
 *   VITE_LEMONSQUEEZY_AGENCY_VARIANT_ID
 */

export type PaidPlan = 'pro' | 'agency';

declare global {
  interface Window {
    createLemonSqueezy?: () => void;
    LemonSqueezy?: {
      Url: { Open: (url: string) => void };
      Setup: (options: { eventHandler?: (event: { event: string }) => void }) => void;
    };
  }
}

const STORE = import.meta.env.VITE_LEMONSQUEEZY_STORE as string | undefined;

const VARIANT_IDS: Record<PaidPlan, string | undefined> = {
  pro: import.meta.env.VITE_LEMONSQUEEZY_PRO_VARIANT_ID as string | undefined,
  agency: import.meta.env.VITE_LEMONSQUEEZY_AGENCY_VARIANT_ID as string | undefined,
};

export function isCheckoutConfigured(plan: PaidPlan): boolean {
  return Boolean(STORE && VARIANT_IDS[plan]);
}

let scriptLoadPromise: Promise<void> | null = null;

function loadLemonScript(): Promise<void> {
  if (window.LemonSqueezy) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://assets.lemonsqueezy.com/lemon.js';
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load the LemonSqueezy checkout script.'));
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

/**
 * Opens the overlay checkout for a plan. Resolves once the checkout
 * closes; `onSuccess` fires specifically on a completed purchase (the
 * webhook does the actual upgrade — this is just so the dashboard can
 * refetch the profile and show the new plan without a manual reload).
 */
export async function openCheckout(
  plan: PaidPlan,
  user: { id: string; email: string },
  onSuccess?: () => void
): Promise<void> {
  if (!isCheckoutConfigured(plan)) {
    console.error(
      `LemonSqueezy checkout for '${plan}' isn't configured — missing VITE_LEMONSQUEEZY_STORE or the variant id env var.`
    );
    return;
  }

  const url = new URL(`https://${STORE}.lemonsqueezy.com/buy/${VARIANT_IDS[plan]}`);
  url.searchParams.set('embed', '1');
  url.searchParams.set('checkout[email]', user.email);
  url.searchParams.set('checkout[custom][user_id]', user.id);
  url.searchParams.set('checkout[custom][plan]', plan);

  await loadLemonScript();
  window.createLemonSqueezy?.();

  if (onSuccess) {
    window.LemonSqueezy?.Setup({
      eventHandler: (event) => {
        if (event.event === 'Checkout.Success') onSuccess();
      },
    });
  }

  window.LemonSqueezy?.Url.Open(url.toString());
}
