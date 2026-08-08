/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_LEMONSQUEEZY_STORE?: string;
  readonly VITE_LEMONSQUEEZY_PRO_VARIANT_ID?: string;
  readonly VITE_LEMONSQUEEZY_AGENCY_VARIANT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
