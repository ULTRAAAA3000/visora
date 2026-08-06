import type { Env } from '../env';

async function call(env: Env, method: string, body: unknown): Promise<void> {
  const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    // Telegram API errors shouldn't take down the Worker — log and move on.
    console.error(`Telegram API ${method} failed`, res.status, await res.text());
  }
}

export interface InlineUrlButton {
  text: string;
  url: string;
}

export function sendMessage(
  env: Env,
  chatId: number,
  text: string,
  opts?: { buttons?: InlineUrlButton[] }
): Promise<void> {
  return call(env, 'sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    reply_markup: opts?.buttons ? { inline_keyboard: [opts.buttons.map((b) => ({ text: b.text, url: b.url }))] } : undefined,
  });
}

export function sendPhoto(env: Env, chatId: number, photoUrl: string, caption?: string): Promise<void> {
  return call(env, 'sendPhoto', {
    chat_id: chatId,
    photo: photoUrl,
    caption,
  });
}
