// Mirrors supabase/migrations/0010_telegram_links.sql. Follows the exact
// shape documented in src/lib/database.types.ts on the main frontend:
// `type` aliases (not interfaces) with explicit inline Insert/Update
// object literals, plus the Relationships/Views/etc placeholders
// supabase-js's generic resolution expects — deviating from this shape
// silently collapses .insert()/.update() argument types to `never`.

export type TelegramLink = {
  chat_id: number;
  api_key: string;
  default_template_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      telegram_links: {
        Row: TelegramLink;
        Insert: {
          chat_id: number;
          api_key: string;
          default_template_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          chat_id?: number;
          api_key?: string;
          default_template_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
