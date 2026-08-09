/**
 * Hand-written types mirroring supabase/migrations/*.sql. Keep these in
 * sync manually when the schema changes (no `supabase gen types` step
 * wired into CI yet — see README).
 *
 * Two things matter here, both discovered the hard way:
 *
 * 1. Insert/Update are explicit object literals (not derived via
 *    `Partial<Row> & Pick<...>`) — supabase-js's generic constraint
 *    resolution doesn't reliably simplify intersection types through its
 *    conditional-type chain, and silently collapses to `never` on every
 *    `.insert()`/`.update()` call if you do.
 *
 * 2. Row/Insert/Update use `type` aliases, not `interface`. Interfaces
 *    break the same constraint resolution (declaration-merging semantics
 *    interact badly with supabase-js's deeply nested conditional Schema
 *    type) even though they're structurally identical to the equivalent
 *    `type` alias. This is the same shape `supabase gen types typescript`
 *    generates, for the same reason.
 */

export type Profile = {
  id: string;
  email: string;
  api_key: string;
  plan_tier: 'free' | 'starter' | 'pro' | 'agency';
  monthly_quota: number;
  usage_this_month: number;
  onboarding_completed_at: string | null;
  lemonsqueezy_customer_id: string | null;
  lemonsqueezy_subscription_id: string | null;
  subscription_status: string | null;
  plan_renews_at: string | null;
  is_admin: boolean;
  webhook_url: string | null;
  webhook_secret: string | null;
  created_at: string;
};

export type Template = {
  id: string;
  user_id: string | null;
  is_preset: boolean;
  tier: 'free' | 'pro' | 'agency';
  title: string;
  category: string;
  html_body: string;
  default_variables: Record<string, string>;
  width: number;
  height: number;
  preview_image_url: string | null;
  created_at: string;
};

export type RenderLog = {
  id: string;
  user_id: string;
  template_id: string;
  render_time_ms: number;
  status_code: number;
  image_url: string | null;
  created_at: string;
};

export type TemplateGalleryEntry = {
  id: string;
  tier: 'free' | 'pro' | 'agency';
  title: string;
  category: string;
  width: number;
  height: number;
  preview_image_url: string | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          email: string;
          api_key: string;
          plan_tier?: Profile['plan_tier'];
          monthly_quota?: number;
          usage_this_month?: number;
          onboarding_completed_at?: string | null;
          lemonsqueezy_customer_id?: string | null;
          lemonsqueezy_subscription_id?: string | null;
          subscription_status?: string | null;
          plan_renews_at?: string | null;
          is_admin?: boolean;
          webhook_url?: string | null;
          webhook_secret?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          api_key?: string;
          plan_tier?: Profile['plan_tier'];
          monthly_quota?: number;
          usage_this_month?: number;
          onboarding_completed_at?: string | null;
          lemonsqueezy_customer_id?: string | null;
          lemonsqueezy_subscription_id?: string | null;
          subscription_status?: string | null;
          plan_renews_at?: string | null;
          is_admin?: boolean;
          webhook_url?: string | null;
          webhook_secret?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      templates: {
        Row: Template;
        Insert: {
          id?: string;
          user_id?: string | null;
          is_preset?: boolean;
          tier?: Template['tier'];
          title: string;
          category: string;
          html_body: string;
          default_variables?: Record<string, string>;
          width?: number;
          height?: number;
          preview_image_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          is_preset?: boolean;
          tier?: Template['tier'];
          title?: string;
          category?: string;
          html_body?: string;
          default_variables?: Record<string, string>;
          width?: number;
          height?: number;
          preview_image_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      render_logs: {
        Row: RenderLog;
        Insert: {
          id?: string;
          user_id: string;
          template_id: string;
          render_time_ms: number;
          status_code: number;
          image_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          template_id?: string;
          render_time_ms?: number;
          status_code?: number;
          image_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      template_gallery: {
        Row: TemplateGalleryEntry;
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
