import type { SupabaseClient } from '@supabase/supabase-js';
import { authenticateBasic, json } from './auth';
import { sendBankInvoiceEmail, sendCreditConfirmationEmail } from './payment-emails';
import { sendTelegramAlert } from './telegram';
import type { Env } from '../env';

interface CreateBankInvoiceBody {
  package_id?: string;
  billing_name?: string;
  billing_email?: string;
}

/**
 * Rail B, step 1: registers a pending invoice and emails Monobank
 * transfer details + the `VISORA-{n}` reference the cron reconciler
 * matches against. Nothing is credited yet — that happens in
 * `runMonobankReconciliation` once the transfer actually clears.
 */
export async function handleCreateBankInvoice(request: Request, env: Env, supabase: SupabaseClient): Promise<Response> {
  const auth = await authenticateBasic(request, supabase);
  if (auth.error) return auth.error;
  const { profile } = auth;

  let body: CreateBankInvoiceBody;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: 'Invalid JSON body.' }, 400);
  }

  const billingName = (body.billing_name ?? '').trim().slice(0, 200);
  const billingEmail = (body.billing_email || profile.email || '').trim().slice(0, 200);
  if (!billingName) {
    return json({ success: false, error: '`billing_name` is required.' }, 400);
  }

  const { data: pkg, error: pkgError } = await supabase
    .from('credit_packages')
    .select('id, credits, price_usd')
    .eq('id', body.package_id)
    .eq('is_active', true)
    .single();
  if (pkgError || !pkg) {
    return json({ success: false, error: 'Unknown credit package.' }, 404);
  }

  const { data: referenceCode, error: refError } = await supabase.rpc('generate_invoice_reference');
  if (refError || !referenceCode) {
    console.error('generate_invoice_reference failed', refError);
    return json({ success: false, error: 'Could not create invoice.' }, 500);
  }

  const { error: insertError } = await supabase.from('invoice_requests').insert({
    user_id: profile.id,
    reference_code: referenceCode,
    package_id: pkg.id,
    credit_amount: pkg.credits,
    amount_usd: pkg.price_usd,
    billing_name: billingName,
    billing_email: billingEmail,
    status: 'invoice_sent',
  });
  if (insertError) {
    console.error('invoice_requests insert failed', insertError);
    return json({ success: false, error: 'Could not create invoice.' }, 500);
  }

  await Promise.all([
    sendBankInvoiceEmail(env, {
      toEmail: billingEmail,
      toName: billingName,
      referenceCode,
      amountUsd: Number(pkg.price_usd),
      credits: pkg.credits,
    }),
    sendTelegramAlert(
      env,
      `🚨 <b>New invoice requested</b>\n${referenceCode} — $${Number(pkg.price_usd).toFixed(2)} (${pkg.credits.toLocaleString('en-US')} credits)\n${billingName} &lt;${billingEmail}&gt;`
    ),
  ]);

  return json({
    success: true,
    data: {
      reference_code: referenceCode,
      amount_usd: pkg.price_usd,
      credits: pkg.credits,
      beneficiary: env.MONO_BENEFICIARY_NAME,
      iban: env.MONO_IBAN,
      swift: env.MONO_SWIFT_CODE,
      bank_address: env.MONO_BANK_ADDRESS,
      tax_id: env.MONO_TAX_ID,
    },
  });
}

interface MonoStatementItem {
  id: string;
  time: number;
  description?: string;
  comment?: string;
  amount: number; // minor units (cents); positive = incoming
}

interface PendingInvoice {
  id: string;
  reference_code: string;
  user_id: string;
  credit_amount: number;
  amount_usd: number;
  billing_name: string;
  billing_email: string;
}

/**
 * Rail B, step 2 — called from the Worker's `scheduled` handler (see
 * index.ts). Pulls a lookback window of the configured Monobank
 * account's statement, scans incoming transactions for a `VISORA-{n}`
 * reference in the description or comment, and matches against
 * pending invoices.
 *
 * The window is a fixed lookback rather than "since the last run" —
 * simpler, and self-healing if a run is skipped (Cloudflare Cron
 * doesn't guarantee no missed ticks, and Monobank itself rate-limits
 * to 1 request/60s). 48h is comfortably inside Monobank's 31-day max
 * period and covers any realistic gap between invoicing and a
 * transfer clearing.
 */
export async function runMonobankReconciliation(env: Env, supabase: SupabaseClient): Promise<void> {
  if (!env.MONO_API_TOKEN || !env.MONO_ACCOUNT_ID) return;

  const { data: pending, error: pendingError } = await supabase
    .from('invoice_requests')
    .select('id, reference_code, user_id, credit_amount, amount_usd, billing_name, billing_email')
    .eq('status', 'invoice_sent');

  if (pendingError) {
    console.error('Fetching pending invoice_requests failed', pendingError);
    return;
  }
  if (!pending || pending.length === 0) return;

  const to = Math.floor(Date.now() / 1000);
  const from = to - 48 * 60 * 60;

  let statement: MonoStatementItem[];
  try {
    const res = await fetch(`https://api.monobank.ua/personal/statement/${env.MONO_ACCOUNT_ID}/${from}/${to}`, {
      headers: { 'X-Token': env.MONO_API_TOKEN },
    });
    if (!res.ok) {
      console.error('Monobank statement fetch failed', res.status, await res.text());
      return;
    }
    statement = await res.json();
  } catch (err) {
    console.error('Monobank statement fetch threw', err);
    return;
  }

  const incoming = statement.filter((t) => t.amount > 0);

  for (const invoice of pending as PendingInvoice[]) {
    const match = incoming.find((t) => `${t.description ?? ''} ${t.comment ?? ''}`.includes(invoice.reference_code));
    if (!match) continue;

    const amountUsd = match.amount / 100;
    // Small tolerance for bank FX rounding; a meaningfully short
    // payment is left pending for manual review rather than silently
    // granting fewer credits than what was actually invoiced.
    if (amountUsd + 0.5 < Number(invoice.amount_usd)) {
      await sendTelegramAlert(
        env,
        `⚠️ <b>Underpaid invoice match</b>\n${invoice.reference_code}: expected $${Number(invoice.amount_usd).toFixed(2)}, got $${amountUsd.toFixed(2)}. Needs manual review.`
      );
      continue;
    }

    // `.select('id')` after the guarded update lets us tell "we just
    // claimed this invoice" apart from "another run already did" —
    // only credit in the former case, even if two runs overlap.
    const { data: updated, error: updateError } = await supabase
      .from('invoice_requests')
      .update({ status: 'paid', paid_at: new Date().toISOString(), matched_transaction_id: match.id })
      .eq('id', invoice.id)
      .eq('status', 'invoice_sent')
      .select('id');

    if (updateError) {
      console.error('invoice_requests update failed', updateError);
      continue;
    }
    if (!updated || updated.length === 0) continue; // already handled by a concurrent/overlapping run

    const { error: creditError } = await supabase.rpc('increment_user_credits', {
      p_user_id: invoice.user_id,
      p_credit_amount: invoice.credit_amount,
    });
    if (creditError) {
      console.error('increment_user_credits failed for invoice', invoice.reference_code, creditError);
    }

    await Promise.all([
      sendCreditConfirmationEmail(env, {
        toEmail: invoice.billing_email,
        toName: invoice.billing_name,
        credits: invoice.credit_amount,
        method: 'bank',
        reference: invoice.reference_code,
      }),
      sendTelegramAlert(
        env,
        `⚡ <b>Auto-match success</b>\n${invoice.reference_code} confirmed via Monobank — ${invoice.credit_amount.toLocaleString('en-US')} credits added automatically.`
      ),
    ]);
  }
}
