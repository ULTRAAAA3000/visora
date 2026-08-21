-- Self-service plan purchases: /api/v1/payments/crypto/verify and
-- /api/v1/payments/bank/request (0025) only ever bought a one-time
-- add-on pack (credit_packages). Per the actual payment flow — "every
-- month the user makes the transaction themselves" — the same two
-- rails need to be able to buy a Growth/Scale *plan* (activate_subscription,
-- +30 days) too, not just top up credits without renewing.
--
-- Generalizes both tables' single `package_id` FK into an explicit
-- product_type + exactly-one-of(package_id, plan_id) pairing, rather
-- than adding a second parallel table — the rest of each row
-- (amount_usd, credit_amount, status, timestamps) means the same thing
-- either way.

ALTER TABLE public.crypto_transactions
  ALTER COLUMN package_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS plan_id TEXT REFERENCES public.subscription_plans(id),
  ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'addon' CHECK (product_type IN ('addon', 'plan'));

-- Every existing row predates this migration and was necessarily an
-- add-on (package_id was NOT NULL before), so the default backfills
-- correctly with no explicit UPDATE needed — this constraint just
-- keeps it that way going forward.
ALTER TABLE public.crypto_transactions
  ADD CONSTRAINT crypto_transactions_product_pairing_check CHECK (
    (product_type = 'addon' AND package_id IS NOT NULL AND plan_id IS NULL)
    OR (product_type = 'plan' AND plan_id IS NOT NULL AND package_id IS NULL)
  );

ALTER TABLE public.invoice_requests
  ALTER COLUMN package_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS plan_id TEXT REFERENCES public.subscription_plans(id),
  ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'addon' CHECK (product_type IN ('addon', 'plan'));

ALTER TABLE public.invoice_requests
  ADD CONSTRAINT invoice_requests_product_pairing_check CHECK (
    (product_type = 'addon' AND package_id IS NOT NULL AND plan_id IS NULL)
    OR (product_type = 'plan' AND plan_id IS NOT NULL AND package_id IS NULL)
  );

-- 'free' is never something to buy — exclude it from what these two
-- self-service rails will accept as a plan_id (enforced again at the
-- application layer in crypto-payments.ts/bank-payments.ts, this is
-- the belt to that suspenders).
ALTER TABLE public.crypto_transactions
  ADD CONSTRAINT crypto_transactions_plan_not_free_check CHECK (plan_id IS NULL OR plan_id <> 'free');
ALTER TABLE public.invoice_requests
  ADD CONSTRAINT invoice_requests_plan_not_free_check CHECK (plan_id IS NULL OR plan_id <> 'free');
