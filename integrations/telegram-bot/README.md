# Visora Telegram bot

Same funnel as the WordPress plugin: user follows a link, connects their
Visora account, and the bot ends up holding their API key so `/render`
can call the render API on their behalf.

## How it works

1. `/connect` (or `/start`) — bot generates a random `state`, stores
   `state -> chat_id` in Workers KV (10 min TTL), and sends a button
   linking to `{VISORA_APP_URL}/connect?return_url=...&state=...&app=Telegram+Bot`.
2. User logs in / approves on Visora's `/connect` page (same handshake
   the WordPress plugin uses).
3. Visora redirects the browser to this Worker's `/callback` with
   `?api_key=...&state=...`. The Worker looks up the state in KV,
   deletes it (single-use), saves `chat_id -> api_key` in Supabase
   (`telegram_links` table), and messages the user in Telegram to
   confirm.
4. `/render <template_id> key=value ...` calls
   `{VISORA_API_URL}/api/v1/render` with the saved key and sends the
   resulting image back as a photo.

## Setup

```bash
cd integrations/telegram-bot
npm install

# 1. Create the KV namespace for the connect handshake, then paste the
#    printed id into wrangler.toml's [[kv_namespaces]] block.
npx wrangler kv namespace create CONNECT_STATE

# 2. Secrets
npx wrangler secret put TELEGRAM_BOT_TOKEN        # from @BotFather
npx wrangler secret put TELEGRAM_WEBHOOK_SECRET   # any random string you choose
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY

# 3. Update [vars] in wrangler.toml if VISORA_APP_URL / VISORA_API_URL
#    aren't on visora.io yet (they aren't, pre domain-migration — point
#    them at your current Pages/Worker *.workers.dev URLs).

npm run deploy
```

Run the DB migration (`supabase/migrations/0010_telegram_links.sql`)
against your Supabase project before first use.

## Register the webhook

Telegram needs to know where to POST updates. Run this once after
deploying (replace the placeholders):

```bash
curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://<your-worker>.workers.dev/webhook",
    "secret_token": "<same value as TELEGRAM_WEBHOOK_SECRET>"
  }'
```

Verify with:

```bash
curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getWebhookInfo"
```

## Commands

- `/connect` (or `/start`) — link your Visora account
- `/render <template_id> key=value key2="value two"` — render a template
- `/render key=value` — same, using the default template (see `/settemplate`)
- `/settemplate <template_id>` — set a default template for `/render`
- `/mykey` — show your linked API key
- `/disconnect` — unlink
- `/help` — command list

## Local dev

`wrangler dev` won't receive real Telegram webhooks (Telegram needs a
public HTTPS URL). Either use `wrangler dev --remote` with a tunnel
(e.g. `cloudflared tunnel`), or test `/callback` directly by hitting it
with a manually-crafted `state` you put in KV yourself.
