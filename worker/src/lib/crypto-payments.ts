import type { SupabaseClient } from '@supabase/supabase-js';
import { authenticateBasic, json } from './auth';
import { verifyBscUsdtPayment, verifyTronUsdtPayment } from './onchain';
import { sendCreditConfirmationEmail } from './payment-emails';
import { sendTelegramAlert } from './telegram';
import type { Env } from '../env';

interface VerifyCryptoBody {
  package_id?: string;
  network?: 'trc20' | 'bep20';
  tx_hash?: string;
}

/**
 * Rail A (direct on-chain USDT, zero-KYC): the frontend modal shows
 * our wallet address for the chosen network, the user pays from their
 * own wallet, then submits the resulting tx hash here. No invoice is
 * pre-created — the package_id fully determines the expected amount,
 * so there's nothing to reconcile beforehand.
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

  const { package_id, network, tx_hash } = body;
  if (!package_id || !network || !tx_hash) {
    return json({ success: false, error: '`package_id`, `network`, and `tx_hash` are required.' }, 400);
  }
  if (network !== 'trc20' && network !== 'bep20') {
    return json({ success: false, error: '`network` must be "trc20" or "bep20".' }, 400);
  }

  const { data: pkg, error: pkgError } = await supabase
    .from('credit_packages')
    .select('id, credits, price_usd')
    .eq('id', package_id)
    .eq('is_active', true)
    .single();

  if (pkgError || !pkg) {
    return json({ success: false, error: 'Unknown credit package.' }, 404);
  }

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
      ? await verifyTronUsdtPayment(env, tx_hash, Number(pkg.price_usd))
      : await verifyBscUsdtPayment(env, tx_hash, Number(pkg.price_usd));

  if (!verification.valid) {
    return json({ success: false, error: verification.error ?? 'Could not verify this transaction.' }, 400);
  }

  const { error: insertError } = await supabase.from('crypto_transactions').insert({
    user_id: profile.id,
    package_id: pkg.id,
    credit_amount: pkg.credits,
    amount_usd: pkg.price_usd,
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

  const { error: creditError } = await supabase.rpc('increment_user_credits', {
    p_user_id: profile.id,
    p_credit_amount: pkg.credits,
  });
  if (creditError) {
    console.error('increment_user_credits failed', creditError);
    return json({ success: false, error: 'Payment verified but crediting failed — contact support and reference your tx hash.' }, 500);
  }

  await Promise.all([
    sendCreditConfirmationEmail(env, {
      toEmail: profile.email,
      credits: pkg.credits,
      method: 'crypto',
      reference: tx_hash,
    }),
    sendTelegramAlert(
      env,
      `✅ <b>Crypto payment verified</b>\n+${pkg.credits.toLocaleString('en-US')} credits — $${Number(pkg.price_usd).toFixed(2)}\nNetwork: ${network.toUpperCase()}\nUser: ${profile.email}\nTx: <code>${tx_hash}</code>`
    ),
  ]);

  return json({ success: true, data: { credits_added: pkg.credits } });
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
