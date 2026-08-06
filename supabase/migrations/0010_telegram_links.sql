-- Visora Telegram bot (parallel branch item 4): links a Telegram chat to
-- the API key the user approved via the /connect handshake, same pattern
-- as the WordPress plugin. Only ever touched by the bot Worker's service
-- role key, never by browser/anon clients — RLS is enabled with no
-- policies, so it's default-deny for anon/authenticated and untouched
-- for service_role (which bypasses RLS entirely).

CREATE TABLE public.telegram_links (
  chat_id BIGINT PRIMARY KEY,
  api_key TEXT NOT NULL,
  default_template_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.telegram_links ENABLE ROW LEVEL SECURITY;
