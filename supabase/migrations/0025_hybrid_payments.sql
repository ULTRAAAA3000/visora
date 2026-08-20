-- Hybrid payment infrastructure: self-hosted, zero-KYC credit top-ups
-- running alongside the Paddle subscription (0015). Two rails:
--
--   Rail A — direct on-chain USDT (TRC20/BEP20). No 3rd-party gateway:
--   the Worker verifies a user-submitted tx hash directly against
--   TronScan/BscScan (see worker/src/lib/onchain.ts) before crediting.
--
--   Rail B — SWIFT/card bank transfer via Monobank. A pending invoice
--   is issued with a VISORA-{n} reference; a Worker cron polls
--   Monobank's statement and matches incoming transfers by that
--   reference (see worker/src/lib/bank-payments.ts).
--
-- Deliberately kept separate from `plan_tier`/`monthly_quota` (the
-- Paddle-driven subscription ceiling) — credits are a top-up balance,
-- not a recurring quota, and mixing the two would mean a Paddle
-- webhook resetting monthly_quota could wipe out a purchased top-up.
-- Wiring credit_balance into the actual render-quota check in
-- worker/src/index.ts is a deliberate follow-up, not done here.

CREATE TABLE IF NOT EXISTS public.credit_packages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  credits INT NOT NULL CHECK (credits > 0),
  price_usd NUMERIC(10, 2) NOT NULL CHECK (price_usd > 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Placeholder pricing — adjust freely, nothing else hardcodes these
-- amounts (the Worker always reads price_usd/credits from this row).
INSERT INTO public.credit_packages (id, name, credits, price_usd) VALUES
  ('starter', 'Starter', 1000, 5.00),
  ('growth', 'Growth', 5000, 20.00),
  ('scale', 'Scale', 15000, 50.00)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS credit_balance INT NOT NULL DEFAULT 0;

-- Rail A: one row per verified on-chain payment. tx_hash is globally
-- unique, which is the actual guarantee against redeeming the same
-- transaction twice (the application-level pre-check in
-- crypto-payments.ts is just a friendlier error message on top).
CREATE TABLE IF NOT EXISTS public.crypto_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  package_id TEXT NOT NULL REFERENCES public.credit_packages(id),
  credit_amount INT NOT NULL,
  amount_usd NUMERIC(10, 2) NOT NULL,
  network TEXT NOT NULL CHECK (network IN ('trc20', 'bep20')),
  tx_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'verified' CHECK (status IN ('verified', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_crypto_transactions_user_id ON public.crypto_transactions(user_id);

-- Rail B: one row per bank-transfer invoice request.
CREATE TABLE IF NOT EXISTS public.invoice_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reference_code TEXT NOT NULL UNIQUE,
  package_id TEXT NOT NULL REFERENCES public.credit_packages(id),
  credit_amount INT NOT NULL,
  amount_usd NUMERIC(10, 2) NOT NULL,
  billing_name TEXT NOT NULL,
  billing_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'invoice_sent' CHECK (status IN ('invoice_sent', 'paid', 'expired')),
  matched_transaction_id TEXT, -- Monobank statement item id, once matched
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_invoice_requests_user_id ON public.invoice_requests(user_id);
-- The reconciliation cron's only query is "all invoice_sent rows" —
-- this partial index keeps that cheap regardless of how large the
-- (mostly paid/expired) table grows.
CREATE INDEX IF NOT EXISTS idx_invoice_requests_pending ON public.invoice_requests(status) WHERE status = 'invoice_sent';

-- Reference codes are VISORA-{n} off a plain sequence rather than
-- e.g. the row's own id, so they're short enough to type into a bank
-- transfer's comment field by hand.
CREATE SEQUENCE IF NOT EXISTS public.invoice_reference_seq START 1000;

CREATE OR REPLACE FUNCTION public.generate_invoice_reference()
RETURNS TEXT
LANGUAGE sql
AS $$
  SELECT 'VISORA-' || nextval('public.invoice_reference_seq')::text;
$$;

-- SECURITY DEFINER so the Worker can call it with the service role
-- key and have it apply regardless of RLS on profiles (same pattern
-- as is_admin() in 0016).
CREATE OR REPLACE FUNCTION public.increment_user_credits(p_user_id UUID, p_credit_amount INT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET credit_balance = credit_balance + p_credit_amount
  WHERE id = p_user_id;
END;
$$;

ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_requests ENABLE ROW LEVEL SECURITY;

-- Package prices are public (the pre-auth pricing modal reads them
-- through the anon key via /api/v1/payments/packages).
CREATE POLICY "Anyone can view active credit packages"
  ON public.credit_packages FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Users can view own crypto transactions"
  ON public.crypto_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own invoice requests"
  ON public.invoice_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Both admin panel policies follow 0016's is_admin() pattern, so
-- purchases show up in /admin alongside everything else.
CREATE POLICY "Admins can view all crypto transactions"
  ON public.crypto_transactions FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can view all invoice requests"
  ON public.invoice_requests FOR SELECT
  USING (public.is_admin());

-- No INSERT/UPDATE policies for any of these three tables: every write
-- happens from the Worker with the service role key, which bypasses
-- RLS entirely (same reasoning as billing.ts's Paddle webhook handler).
