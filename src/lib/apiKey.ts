import { nanoid } from 'nanoid';

export function generateApiKey(): string {
  return `VISORA_LIVE_${nanoid(32)}`;
}

export function generateWebhookSecret(): string {
  return `whsec_${nanoid(32)}`;
}
