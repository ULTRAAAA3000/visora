import { nanoid } from 'nanoid';

export function generateApiKey(): string {
  return `VISORA_LIVE_${nanoid(32)}`;
}
