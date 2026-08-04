import { nanoid } from 'nanoid';

export function generateApiKey() {
  return `VISORA_LIVE_${nanoid(32)}`;
}
