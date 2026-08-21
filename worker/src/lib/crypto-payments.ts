import type { SupabaseClient } from '@supabase/supabase-js';
import { authenticateBasic, json } from './auth';
import { verifyBscUsdtPayment, verifyTronUsdtPayment } from './onchain';
import { sendCreditConfirmationEmail, sendSubscriptionActivatedEmail } from './payment-emails';
import { sendTelegramAlert } from './telegram';
import type { Env } from '../env';

interface VerifyCryptoBody {
  package_id?: string;
  plan_id?: string;
  network?: 'trc20' | 'bep20';
  tx_hash?: string;
}

export interface ResolvedProduct {
  productType: 'addon' | 'plan';
  id: string;
  credits: number;
  priceUsd: number;
}

/**
 * Both self-service rails (this file's crypto flow, and
 * bank-payments.ts's invoice flow) can pay for exactly one of two
 * things: a one-time add-on pack (credit_packages), or a Growth/Scale
 * plan renewal (subscription_plans — 'free' excluded, nothing to buy
 * there). Resolves whichever one the request named, or returns an
 * error Response ready to hand straight back to the caller.
 */
export async function resolveProduct(
  supabase: SupabaseClient,
  body: { package_id?: string; plan_id?: string }
): Promise<{ product: ResolvedProduct; error?: undefined } | { product?: undefined; error: Response }> {
  const { package_id, plan_id } = body;

  if (package_id && plan_id) {
    return { error: json({ success: false, error: 'Provide either `package_id` or `plan_id`, not both.' }, 400) };
  }

  if (package_id) {
    const { data: pkg, error } = await supabase
      .from('credit_packages')
      .select('id, credits, price_usd')
      .eq('id', package_id)
      .eq('is_active', true)
      .single();
    if (error || !pkg) {
      return { error: json({ success: false, error: 'Unknown credit package.' }, 404) };
    }
    return { product: { productType: 'addon', id: pkg.id, credits: pkg.credits, priceUsd: Number(pkg.price_usd) } };
  }

  if (plan_id) {
    if (plan_id === 'free') {
      return { error: json({ success: false, error: 'The Free plan is not something you buy.' }, 400) };
    }
    const { data: plan, error } = await supabase
      .from('subscription_plans')
      .select('id, credits, price_usd')
      .eq('id', plan_id)
      .single();
    if (error || !plan) {
      return { error: json({ success: false, error: 'Unknown subscription plan.' }, 404) };
    }
    return { product: { productType: 'plan', id: plan.id, credits: plan.credits, priceUsd: Number(plan.price_usd) } };
  }

  return { error: json({ success: false, error: 'Either `package_id` or `plan_id` is required.' }, 400) };
}

/**
 * Applies a resolved product to a profile: an add-on adds to `credits`
 * without touching credits_reset_at; a plan sets `credits` to the
 * plan's allotment and pushes credits_reset_at 30 days out. Both log
 * to credit_transactions via their respective RPC.
 */
export async function fulfillProduct(
  supabase: SupabaseClient,
  userId: string,
  product: ResolvedProduct,
  reference: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (product.productType === 'addon') {
    const { error } = await supabase.rpc('add_credit_addon', {
      p_user_id: userId,
      p_credits: product.credits,
      p_reference: reference,
    });
    if (error) {
      console.error('add_credit_addon failed', error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  }

  const { error } = await supabase.rpc('activate_subscription', {
    p_user_id: userId,
    p_plan: product.id,
    p_duration_days: 30,
  });
  if (error) {
    console.error('activate_subscription failed', error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function sendFulfillmentNotifications(
  env: Env,
  profile: { email: string; name?: string },
  product: ResolvedProduct,
  method: 'crypto' | 'bank',
  reference: string
): Promise<void> {
  if (product.productType === 'addon') {
    await sendCreditConfirmationEmail(env, { toEmail: profile.email, toName: profile.name, credits: product.credits, method, reference });
  } else {
    await sendSubscriptionActivatedEmail(env, {
      toEmail: profile.email,
      toName: profile.name,
      plan: product.id,
      credits: product.credits,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }
}

/**
 * Rail A (direct on-chain USDT, zero-KYC): the frontend modal shows
 * our wallet address for the chosen network, the user pays from their
 * own wallet, then submits the resulting tx hash here. No invoice is
 * pre-created — package_id/plan_id fully determines the expected
 * amount, so there's nothing to reconcile beforehand. Works for both a
 * one-time add-on pack and a Growth/Scale plan renewal — this is the
 * self-service path a paying user hits every month, since there's no
 * card auto-billing.
 */
export async function handleVerifyCryptoPayment(request: Request, env: Env, supabase: SupabaseClient): Promise<Response> {
  const auth = await authenticateBasic(request, supabase);
  if (auth.error) return auth.error;
  const { profile } = auth;

  let body: VerifyCryptoBody;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: 'Invalid JSON body.' }, 400);
  }

  const { network, tx_hash } = body;
  if (!network || !tx_hash) {
    return json({ success: false, error: '`network` and `tx_hash` are required.' }, 400);
  }
  if (network !== 'trc20' && network !== 'bep20') {
    return json({ success: false, error: '`network` must be "trc20" or "bep20".' }, 400);
  }

  const resolved = await resolveProduct(supabase, body);
  if (resolved.error) return resolved.error;
  const { product } = resolved;

  // Friendlier pre-check before spending an explorer API call — the
  // unique index on tx_hash is the real guarantee against double
  // redemption, this just avoids a wasted round trip for the common
  // case of someone re-submitting the same hash.
  const { data: existing } = await supabase.from('crypto_transactions').select('id').eq('tx_hash', tx_hash).maybeSingle();
  if (existing) {
    return json({ success: false, error: 'This transaction has already been redeemed.' }, 409);
  }

  const verification =
    network === 'trc20'
      ? await verifyTronUsdtPayment(env, tx_hash, product.priceUsd)
      : await verifyBscUsdtPayment(env, tx_hash, product.priceUsd);

  if (!verification.valid) {
    return json({ success: false, error: verification.error ?? 'Could not verify this transaction.' }, 400);
  }

  const { error: insertError } = await supabase.from('crypto_transactions').insert({
    user_id: profile.id,
    product_type: product.productType,
    package_id: product.productType === 'addon' ? product.id : null,
    plan_id: product.productType === 'plan' ? product.id : null,
    credit_amount: product.credits,
    amount_usd: product.priceUsd,
    network,
    tx_hash,
    status: 'verified',
    verified_at: new Date().toISOString(),
  });

  if (insertError) {
    // Most likely the unique index on tx_hash caught a race (two
    // requests verifying the same hash concurrently) rather than a
    // genuine server error — treat it as already-redeemed.
    console.error('crypto_transactions insert failed', insertError);
    return json({ success: false, error: 'This transaction has already been redeemed.' }, 409);
  }

  const fulfillment = await fulfillProduct(supabase, profile.id, product, tx_hash);
  if (!fulfillment.ok) {
    return json({ success: false, error: `Payment verified but crediting failed (${fulfillment.error}) — contact support and reference your tx hash.` }, 500);
  }

  await Promise.all([
    sendFulfillmentNotifications(env, profile, product, 'crypto', tx_hash),
    sendTelegramAlert(
      env,
      `✅ <b>Crypto payment verified</b>\n${product.productType === 'plan' ? `Plan: ${product.id}` : `+${product.credits.toLocaleString('en-US')} credits`} — $${product.priceUsd.toFixed(2)}\nNetwork: ${network.toUpperCase()}\nUser: ${profile.email}\nTx: <code>${tx_hash}</code>`
    ),
  ]);

  return json({ success: true, data: { product_type: product.productType, credits: product.credits } });
}

/**
 * Public — the frontend modal needs prices/credit amounts before the
 * user has authenticated a purchase, and there's nothing sensitive in
 * a price list.
 */
export async function handleListCreditPackages(supabase: SupabaseClient): Promise<Response> {
  const { data, error } = await supabase
    .from('credit_packages')
    .select('id, name, credits, price_usd')
    .eq('is_active', true)
    .order('price_usd', { ascending: true });

  if (error) {
    return json({ success: false, error: 'Could not list credit packages.' }, 500);
  }

  return json({ success: true, data: data ?? [] });
}

/**
 * Public — same reasoning as handleListCreditPackages, for the
 * Growth/Scale plan picker.
 */
export async function handleListSubscriptionPlans(supabase: SupabaseClient): Promise<Response> {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('id, name, credits, price_usd, duration_days')
    .neq('id', 'free')
    .order('price_usd', { ascending: true });

  if (error) {
    return json({ success: false, error: 'Could not list subscription plans.' }, 500);
  }

  return json({ success: true, data: data ?? [] });
}

/**
 * Public — receiving wallet addresses aren't secret (they have to be
 * shown to anyone paying), so the frontend reads them from here
 * instead of duplicating USDT_TRC20_WALLET/USDT_BEP20_WALLET into a
 * separate set of Pages env vars that could drift from the Worker's.
 */
export function handleGetPaymentConfig(env: Env): Response {
  return json({
    success: true,
    data: {
      usdt_trc20_wallet: env.USDT_TRC20_WALLET,
      usdt_bep20_wallet: env.USDT_BEP20_WALLET,
    },
  });
}
