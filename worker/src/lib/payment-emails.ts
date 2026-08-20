import type { Env } from '../env';

const FROM = 'Visora Billing <billing@visor-a.com>'; // update once verified in Resend, same as contact.ts

/**
 * Shared send wrapper — mirrors contact.ts's approach: best-effort,
 * never throws, logs and moves on. Every payment flow already writes
 * its own DB row before calling this, so a dropped email never loses
 * the underlying record.
 */
async function sendEmail(env: Env, to: string, subject: string, html: string, text: string): Promise<void> {
  if (!env.RESEND_API_KEY) return;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ from: FROM, to: [to], subject, html, text }),
    });
    if (!res.ok) {
      console.error('Resend send failed', res.status, await res.text());
    }
  } catch (err) {
    console.error('Resend send threw', err);
  }
}

function shell(bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#0a0a0a;font-family:ui-monospace,'SF Mono',Consolas,monospace;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#111111;border:1px solid #262626;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px 0 32px;">
                <div style="color:#ffffff;font-size:15px;font-weight:600;letter-spacing:0.02em;">Visora</div>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 32px 32px;color:#e5e5e5;font-size:14px;line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px;border-top:1px solid #262626;color:#737373;font-size:12px;">
                visor-a.com &middot; API-first image rendering
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;color:#a3a3a3;font-size:13px;">${label}</td>
    <td style="padding:6px 0;color:#ffffff;font-size:13px;text-align:right;font-weight:600;">${value}</td>
  </tr>`;
}

/**
 * Sent once a bank-transfer invoice is issued (Scenario B, step 3).
 * Carries the Monobank/SWIFT details and — critically — the payment
 * reference the reconciliation cron matches against, so it's called
 * out visually rather than buried in prose.
 */
export async function sendBankInvoiceEmail(
  env: Env,
  params: {
    toEmail: string;
    toName: string;
    referenceCode: string;
    amountUsd: number;
    credits: number;
  }
): Promise<void> {
  const { toEmail, toName, referenceCode, amountUsd, credits } = params;

  const html = shell(`
    <p style="margin:0 0 16px 0;">Hi ${escapeHtml(toName)},</p>
    <p style="margin:0 0 20px 0;">Here are the transfer details for your Visora credit purchase. Credits are added automatically once the transfer clears — usually within a few minutes.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border:1px solid #262626;border-radius:8px;padding:16px 18px;margin-bottom:20px;">
      ${row('Amount', `$${amountUsd.toFixed(2)}`)}
      ${row('Credits', credits.toLocaleString('en-US'))}
      ${row('Beneficiary', escapeHtml(env.MONO_BENEFICIARY_NAME ?? ''))}
      ${row('IBAN', escapeHtml(env.MONO_IBAN ?? ''))}
      ${row('SWIFT/BIC', escapeHtml(env.MONO_SWIFT_CODE ?? ''))}
      ${row('Bank address', escapeHtml(env.MONO_BANK_ADDRESS ?? ''))}
      ${row('Tax ID', escapeHtml(env.MONO_TAX_ID ?? ''))}
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#1f1508;border:1px solid #4a3210;border-radius:8px;padding:16px 18px;margin-bottom:20px;">
      <tr><td>
        <div style="color:#f5b942;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Required payment reference</div>
        <div style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:0.02em;">${escapeHtml(referenceCode)}</div>
      </tr></td>
    </table>
    <p style="margin:0;color:#a3a3a3;font-size:12.5px;">Put this exact reference in your transfer's payment comment/description field — it's how we match the transfer to your account automatically. Without it, matching has to be done manually and will be slower.</p>
  `);

  const text = `Hi ${toName},

Transfer details for your Visora credit purchase ($${amountUsd.toFixed(2)} / ${credits} credits):

Beneficiary: ${env.MONO_BENEFICIARY_NAME ?? ''}
IBAN: ${env.MONO_IBAN ?? ''}
SWIFT/BIC: ${env.MONO_SWIFT_CODE ?? ''}
Bank address: ${env.MONO_BANK_ADDRESS ?? ''}
Tax ID: ${env.MONO_TAX_ID ?? ''}

Required payment reference: ${referenceCode}

Put this exact reference in your transfer's payment comment — it's how we match it to your account automatically.`;

  await sendEmail(env, toEmail, `Visora invoice ${referenceCode} — bank transfer details`, html, text);
}

/**
 * Sent once credits are actually confirmed (crypto webhook or bank
 * reconciliation match) — the "you're good to go" receipt.
 */
export async function sendCreditConfirmationEmail(
  env: Env,
  params: { toEmail: string; toName?: string; credits: number; method: 'crypto' | 'bank'; reference: string }
): Promise<void> {
  const { toEmail, toName, credits, method, reference } = params;
  const methodLabel = method === 'crypto' ? 'Crypto payment' : 'Bank transfer';

  const html = shell(`
    <p style="margin:0 0 16px 0;">Hi ${escapeHtml(toName ?? '')},</p>
    <p style="margin:0 0 20px 0;">Your payment cleared and <strong style="color:#ffffff;">${credits.toLocaleString('en-US')} credits</strong> have been added to your Visora account. No action needed on your end.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border:1px solid #262626;border-radius:8px;padding:16px 18px;">
      ${row('Method', methodLabel)}
      ${row('Reference', escapeHtml(reference))}
      ${row('Credits added', credits.toLocaleString('en-US'))}
    </table>
  `);

  const text = `Hi ${toName ?? ''},

Your payment cleared and ${credits} credits have been added to your Visora account.

Method: ${methodLabel}
Reference: ${reference}`;

  await sendEmail(env, toEmail, 'Visora payment received — credits added', html, text);
}

function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
