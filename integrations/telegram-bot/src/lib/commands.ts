import { createClient } from '@supabase/supabase-js';
import type { Env } from '../env';
import { sendMessage, sendPhoto } from './telegram';
import { getLink, setDefaultTemplate, clearLink } from './db';
import { renderTemplate, parseRenderArgs } from './render';
import type { Database } from './database.types';

type SupabaseClient = ReturnType<typeof createClient<Database>>;

interface TelegramUpdate {
  message?: {
    chat: { id: number };
    text?: string;
  };
}

const HELP_TEXT = [
  '<b>Visora bot</b> — render OG images, banners, and certificates from your Telegram chat.',
  '',
  '/connect — link your Visora account (get an API key)',
  '/render &lt;template_id&gt; key=value key2="value two" — render a template',
  '/render key=value — same, using your default template (see /settemplate)',
  '/settemplate &lt;template_id&gt; — set a default template for /render',
  '/mykey — show your linked API key',
  '/disconnect — unlink your Visora account',
  '/help — show this message',
].join('\n');

export async function handleUpdate(update: TelegramUpdate, env: Env, workerOrigin: string): Promise<void> {
  const message = update.message;
  if (!message?.text) return;

  const chatId = message.chat.id;
  const text = message.text.trim();
  const supabase = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const [command, ...rest] = text.split(/\s+/);
  const argText = text.slice(command.length).trim();

  switch (command.split('@')[0]) {
    case '/start':
    case '/connect':
      await handleConnect(env, chatId, workerOrigin);
      return;

    case '/render':
      await handleRender(env, supabase, chatId, argText);
      return;

    case '/settemplate':
      await handleSetTemplate(env, supabase, chatId, rest[0]);
      return;

    case '/mykey':
      await handleMyKey(env, supabase, chatId);
      return;

    case '/disconnect':
      await clearLink(supabase, chatId);
      await sendMessage(env, chatId, 'Disconnected. Run /connect any time to link a new API key.');
      return;

    case '/help':
      await sendMessage(env, chatId, HELP_TEXT);
      return;

    default:
      await sendMessage(env, chatId, "Not sure what that means — try /help.");
  }
}

async function handleConnect(env: Env, chatId: number, workerOrigin: string): Promise<void> {
  const state = crypto.randomUUID().replace(/-/g, '');
  await env.CONNECT_STATE.put(`state:${state}`, String(chatId), { expirationTtl: 600 });

  const returnUrl = `${workerOrigin.replace(/\/$/, '')}/callback`;
  const connectUrl = new URL(`${env.VISORA_APP_URL.replace(/\/$/, '')}/connect`);
  connectUrl.searchParams.set('return_url', returnUrl);
  connectUrl.searchParams.set('state', state);
  connectUrl.searchParams.set('app', 'Telegram Bot');

  await sendMessage(env, chatId, 'Tap below, approve on Visora, and you\'ll be linked automatically. The link expires in 10 minutes.', {
    buttons: [{ text: 'Connect to Visora', url: connectUrl.toString() }],
  });
}

async function handleRender(env: Env, supabase: SupabaseClient, chatId: number, argText: string): Promise<void> {
  const link = await getLink(supabase, chatId);
  if (!link) {
    await sendMessage(env, chatId, "You're not connected yet. Run /connect first.");
    return;
  }

  const { templateId: overrideTemplateId, data } = parseRenderArgs(argText);
  const templateId = overrideTemplateId || link.default_template_id;

  if (!templateId) {
    await sendMessage(
      env,
      chatId,
      'No template specified. Usage: /render &lt;template_id&gt; key=value ...\nOr set a default with /settemplate &lt;template_id&gt;.'
    );
    return;
  }

  await sendMessage(env, chatId, 'Rendering…');

  const result = await renderTemplate(env, link.api_key, templateId, data);
  if (!result.ok) {
    await sendMessage(env, chatId, `Render failed: ${result.error}`);
    return;
  }

  await sendPhoto(env, chatId, result.imageUrl);
}

async function handleSetTemplate(env: Env, supabase: SupabaseClient, chatId: number, templateId?: string): Promise<void> {
  const link = await getLink(supabase, chatId);
  if (!link) {
    await sendMessage(env, chatId, "You're not connected yet. Run /connect first.");
    return;
  }
  if (!templateId) {
    await sendMessage(env, chatId, 'Usage: /settemplate &lt;template_id&gt;');
    return;
  }

  await setDefaultTemplate(supabase, chatId, templateId);
  await sendMessage(env, chatId, `Default template set to <code>${escapeHtml(templateId)}</code>.`);
}

async function handleMyKey(env: Env, supabase: SupabaseClient, chatId: number): Promise<void> {
  const link = await getLink(supabase, chatId);
  if (!link) {
    await sendMessage(env, chatId, "You're not connected yet. Run /connect first.");
    return;
  }
  await sendMessage(env, chatId, `Your API key:\n<code>${escapeHtml(link.api_key)}</code>`);
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);
}
