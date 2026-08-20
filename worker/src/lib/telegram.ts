import type { Env } from '../env';

/**
 * Fire-and-forget admin alert via the Telegram Bot API. Both env vars
 * are optional (same pattern as RESEND_API_KEY in contact.ts) — the
 * payment flows all work without Telegram configured, they just skip
 * the real-time nudge. Never throws; a failed alert must never fail
 * the payment/webhook request it's attached to.
 */
export async function sendTelegramAlert(env: Env, text: string): Promise<void> {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_ADMIN_CHAT_ID) return;

  try {
    const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_ADMIN_CHAT_ID,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      console.error('Telegram alert failed', res.status, await res.text());
    }
  } catch (err) {
    console.error('Telegram alert threw', err);
  }
}
