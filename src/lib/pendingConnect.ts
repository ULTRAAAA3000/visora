// Third-party integrations (WordPress plugin, Make.com, browser extensions,
// Telegram bot) all use the same handshake to hand a user's API key back to
// them: they send the user to /connect?return_url=...&state=...&app=....
//
// If the user isn't logged in yet, they get bounced through /login or
// /signup — and if it's a fresh signup, through email confirmation too,
// which lands them on /dashboard with no query string left. Stashing the
// pending request in localStorage lets /connect (or a banner elsewhere)
// recover it after any of those detours.

export interface PendingConnect {
  returnUrl: string;
  state: string;
  app: string; // human-readable name of the requesting app, e.g. "WordPress"
}

const STORAGE_KEY = 'visora_pending_connect';

export function savePendingConnect(p: PendingConnect): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

export function loadPendingConnect(): PendingConnect | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.returnUrl === 'string' && typeof parsed.state === 'string') {
      return parsed as PendingConnect;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearPendingConnect(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/** Only allow handing off the API key to http(s) URLs — never javascript:, data:, etc. */
export function isSafeReturnUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
