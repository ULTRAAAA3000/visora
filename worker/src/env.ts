export interface Env {
  MYBROWSER: Fetcher;
  RENDERS: R2Bucket;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  PADDLE_WEBHOOK_SECRET: string;
  // Optional — the contact form (and now the payment email receipts)
  // work (data still lands in Supabase / gets logged) with this unset.
  // Set it once a domain is verified in Resend.
  RESEND_API_KEY?: string;

  // Telegram admin alerts for payment events. Both optional — every
  // payment flow works without them configured, they just skip the
  // real-time nudge to the admin chat.
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_ADMIN_CHAT_ID?: string;

  // Rail A — direct on-chain USDT verification (no 3rd-party gateway,
  // no KYC). These are the receiving wallets; TronScan/BscScan are
  // queried against them directly. See worker/src/lib/onchain.ts.
  USDT_TRC20_WALLET: string;
  USDT_BEP20_WALLET: string;
  TRONSCAN_API_KEY?: string; // optional — raises TronScan's rate limit
  BSCSCAN_API_KEY: string; // required — BscScan's tokentx endpoint needs a key

  // Rail B — Monobank statement polling for SWIFT/card bank transfers.
  // See worker/src/lib/bank-payments.ts.
  MONO_API_TOKEN: string;
  MONO_ACCOUNT_ID: string; // account id from Monobank's client-info endpoint, not the IBAN
  MONO_BENEFICIARY_NAME: string;
  MONO_IBAN: string;
  MONO_SWIFT_CODE: string;
  MONO_BANK_ADDRESS: string;
  MONO_TAX_ID: string;

  // Prepaid subscription plans (migration 0027) — backend-to-backend
  // endpoints, not user-facing. See lib/auth.ts's authenticateService.
  ADMIN_API_SECRET: string; // POST /api/admin/subscriptions/activate — admin panel / Telegram bot / manual-confirmation email flow
  CRYPTO_WEBHOOK_SECRET: string; // POST /api/webhooks/crypto — a future/external crypto acquirer's payment-confirmation postback
}
