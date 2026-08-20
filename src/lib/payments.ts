import { supabase } from './supabase';
import type { CreditPackage } from './database.types';

/**
 * Client-side glue for the hybrid payment infrastructure (worker/src/lib/
 * crypto-payments.ts + bank-payments.ts). Credit packages are read
 * straight from Supabase (public SELECT policy, same as template_gallery)
 * — everything that actually moves money or credits goes through the
 * Worker's API, same split as paddle.ts vs. the rest of the dashboard.
 *
 * Uses the same VITE_RENDER_API_URL as the rest of the dashboard (see
 * Overview.tsx's webhook test button) — no new env var needed.
 */

export type CryptoNetwork = 'trc20' | 'bep20';

export interface PaymentConfig {
  usdt_trc20_wallet: string;
  usdt_bep20_wallet: string;
}

export interface BankInvoiceDetails {
  reference_code: string;
  amount_usd: number;
  credits: number;
  beneficiary: string;
  iban: string;
  swift: string;
  bank_address: string;
  tax_id: string;
}

function apiBase(): string | null {
  const base = import.meta.env.VITE_RENDER_API_URL;
  return base ? base.replace(/\/$/, '') : null;
}

export async function fetchCreditPackages(): Promise<CreditPackage[]> {
  const { data, error } = await supabase
    .from('credit_packages')
    .select('id, name, credits, price_usd, is_active')
    .eq('is_active', true)
    .order('price_usd', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function fetchPaymentConfig(): Promise<PaymentConfig> {
  const base = apiBase();
  if (!base) throw new Error('Payments are not configured yet — VITE_RENDER_API_URL is missing.');

  const res = await fetch(`${base}/api/v1/payments/config`);
  const body = (await res.json()) as { success: boolean; data?: PaymentConfig; error?: string };
  if (!res.ok || !body.success || !body.data) {
    throw new Error(body.error ?? 'Could not load payment configuration.');
  }
  return body.data;
}

/**
 * Submits a claimed on-chain payment for verification. Throws with a
 * human-readable message on any failure — the modal shows it directly,
 * it's already written to be shown to the person (see onchain.ts).
 */
export async function verifyCryptoPayment(
  apiKey: string,
  params: { package_id: string; network: CryptoNetwork; tx_hash: string }
): Promise<{ credits_added: number }> {
  const base = apiBase();
  if (!base) throw new Error('Payments are not configured yet — VITE_RENDER_API_URL is missing.');

  const res = await fetch(`${base}/api/v1/payments/crypto/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(params),
  });
  const body = (await res.json()) as { success: boolean; data?: { credits_added: number }; error?: string };
  if (!res.ok || !body.success || !body.data) {
    throw new Error(body.error ?? 'Could not verify this transaction.');
  }
  return body.data;
}

export async function requestBankInvoice(
  apiKey: string,
  params: { package_id: string; billing_name: string; billing_email: string }
): Promise<BankInvoiceDetails> {
  const base = apiBase();
  if (!base) throw new Error('Payments are not configured yet — VITE_RENDER_API_URL is missing.');

  const res = await fetch(`${base}/api/v1/payments/bank/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(params),
  });
  const body = (await res.json()) as { success: boolean; data?: BankInvoiceDetails; error?: string };
  if (!res.ok || !body.success || !body.data) {
    throw new Error(body.error ?? 'Could not create the invoice.');
  }
  return body.data;
}
