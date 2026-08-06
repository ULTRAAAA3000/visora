import { createClient } from '@supabase/supabase-js';
import type { Env } from './env';
import type { Database } from './lib/database.types';
import { handleUpdate } from './lib/commands';
import { sendMessage } from './lib/telegram';
import { upsertApiKey } from './lib/db';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return new Response('ok');
    }

    if (request.method === 'POST' && url.pathname === '/webhook') {
      return handleWebhook(request, env, ctx, url.origin);
    }

    if (request.method === 'GET' && url.pathname === '/callback') {
      return handleCallback(env, url.searchParams);
    }

    return new Response('Not found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;

async function handleWebhook(request: Request, env: Env, ctx: ExecutionContext, workerOrigin: string): Promise<Response> {
  // Telegram echoes this header back on every webhook call when the
  // webhook was registered with a secret_token (see README setup step).
  // Without it, anyone who finds the URL could POST fake updates.
  const secret = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
  if (secret !== env.TELEGRAM_WEBHOOK_SECRET) {
    return new Response('Forbidden', { status: 403 });
  }

  let update: unknown;
  try {
    update = await request.json();
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  // Telegram expects a fast 200 OK; do the actual work in the background
  // so a slow render/Supabase call doesn't cause Telegram to retry.
  ctx.waitUntil(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleUpdate(update as any, env, workerOrigin).catch((err) => console.error('handleUpdate failed', err))
  );

  return new Response('ok');
}

/**
 * Step 2 of the /connect handshake: the user approved on Visora's
 * /connect page and got redirected here with ?api_key=...&state=....
 * We look up which chat requested that state, save the key, and notify
 * them in Telegram — then show a plain "you can close this tab" page.
 */
async function handleCallback(env: Env, params: URLSearchParams): Promise<Response> {
  const state = params.get('state');
  const apiKey = params.get('api_key');

  if (!state || !apiKey) {
    return htmlResponse('Missing parameters. Go back to Telegram and try /connect again.', 400);
  }

  const kvKey = `state:${state}`;
  const chatIdStr = await env.CONNECT_STATE.get(kvKey);

  if (!chatIdStr) {
    return htmlResponse('This connect link expired or was already used. Go back to Telegram and run /connect again.', 400);
  }

  await env.CONNECT_STATE.delete(kvKey); // single-use

  const chatId = Number(chatIdStr);
  const supabase = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  await upsertApiKey(supabase, chatId, apiKey);
  await sendMessage(env, chatId, "✅ Connected! Try /render or /help to see what's available.");

  return htmlResponse('Connected! You can close this tab and go back to Telegram.', 200);
}

function htmlResponse(message: string, status: number): Response {
  return new Response(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Visora</title>
      <style>body{background:#000;color:#fff;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;padding:0 24px;}</style>
      </head><body><p>${escapeHtml(message)}</p></body></html>`,
    { status, headers: { 'content-type': 'text/html; charset=utf-8' } }
  );
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);
}
