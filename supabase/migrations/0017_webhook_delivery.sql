-- Webhook delivery (Pro/Agency feature — PricingSection.tsx has always
-- advertised this, but nothing implemented it until now).
--
-- webhook_secret is generated client-side by the dashboard the moment
-- someone sets a webhook_url (see Overview.tsx), the same pattern the
-- app already uses for api_key at signup — no extra round trip to the
-- Worker needed just to get a random string.
--
-- Free/starter accounts can technically have a webhook_url saved (RLS
-- doesn't forbid it), but worker/src/lib/webhook.ts refuses to actually
-- deliver anything unless plan_tier is pro or agency, so gating lives
-- in one place rather than being duplicated between DB and app code.

ALTER TABLE public.profiles
  ADD COLUMN webhook_url TEXT,
  ADD COLUMN webhook_secret TEXT;
