export interface Env {
  MYBROWSER: Fetcher;
  RENDERS: R2Bucket;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  PADDLE_WEBHOOK_SECRET: string;
  // Optional — the contact form works (stores in Supabase, visible in
  // /admin) with this unset. Set it once a domain is verified in
  // Resend to also actually email visora.image@gmail.com.
  RESEND_API_KEY?: string;
}
