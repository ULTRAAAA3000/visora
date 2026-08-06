import type { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

type SupabaseClient = ReturnType<typeof createClient<Database>>;

export interface TelegramLink {
  chat_id: number;
  api_key: string;
  default_template_id: string | null;
}

export async function getLink(supabase: SupabaseClient, chatId: number): Promise<TelegramLink | null> {
  const { data, error } = await supabase
    .from('telegram_links')
    .select('chat_id, api_key, default_template_id')
    .eq('chat_id', chatId)
    .maybeSingle();

  if (error) {
    console.error('getLink failed', error);
    return null;
  }
  return data;
}

export async function upsertApiKey(supabase: SupabaseClient, chatId: number, apiKey: string): Promise<void> {
  const { error } = await supabase
    .from('telegram_links')
    .upsert({ chat_id: chatId, api_key: apiKey, updated_at: new Date().toISOString() }, { onConflict: 'chat_id' });

  if (error) console.error('upsertApiKey failed', error);
}

export async function setDefaultTemplate(supabase: SupabaseClient, chatId: number, templateId: string): Promise<void> {
  const { error } = await supabase
    .from('telegram_links')
    .update({ default_template_id: templateId, updated_at: new Date().toISOString() })
    .eq('chat_id', chatId);

  if (error) console.error('setDefaultTemplate failed', error);
}

export async function clearLink(supabase: SupabaseClient, chatId: number): Promise<void> {
  const { error } = await supabase.from('telegram_links').delete().eq('chat_id', chatId);
  if (error) console.error('clearLink failed', error);
}
