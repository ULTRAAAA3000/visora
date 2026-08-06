export interface Env {
  // KV: short-lived state->chat_id mapping for the /connect handshake.
  // Entries are single-use and expire after 10 minutes even if unused.
  CONNECT_STATE: KVNamespace;

  // Secrets — set with `npx wrangler secret put <NAME>`.
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_WEBHOOK_SECRET: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;

  // Plain vars — see wrangler.toml. Not secrets, just config that will
  // change once the custom domain migration (main roadmap item 8) lands.
  VISORA_APP_URL: string;
  VISORA_API_URL: string;
}
