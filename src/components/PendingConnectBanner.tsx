import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlugZap } from 'lucide-react';
import { loadPendingConnect } from '../lib/pendingConnect';

/**
 * Signup requires email confirmation, which drops any query string and
 * lands the user on /dashboard. If they started a WordPress/Make.com/etc.
 * connect flow before that detour, this surfaces a reminder to finish it
 * instead of silently losing the request.
 */
export default function PendingConnectBanner() {
  const [app, setApp] = useState<string | null>(null);

  useEffect(() => {
    const pending = loadPendingConnect();
    if (pending) setApp(pending.app);
  }, []);

  if (!app) return null;

  return (
    <Link
      to="/connect"
      className="flex items-center gap-3 liquid-glass rounded-xl px-4 py-3 mb-6 hover:bg-white/5 transition-colors"
    >
      <PlugZap className="w-4 h-4 text-emerald-400 shrink-0" />
      <span className="text-sm text-gray-200">
        Finish connecting <strong className="text-white">{app}</strong> to your Visora account
      </span>
      <span className="ml-auto text-xs text-gray-500">Continue →</span>
    </Link>
  );
}
