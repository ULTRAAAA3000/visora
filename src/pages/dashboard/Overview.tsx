import { useState } from 'react';
import { Copy, Check, RefreshCw } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';
import { generateApiKey } from '../../lib/apiKey';

export default function Overview() {
  const { profile, refreshProfile } = useAuth();
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!profile) {
    return (
      <div className="p-8">
        <p className="text-gray-400 text-sm">Loading your account…</p>
      </div>
    );
  }

  const usagePct = Math.min(100, Math.round((profile.usage_this_month / profile.monthly_quota) * 100));

  const handleCopy = async () => {
    await navigator.clipboard.writeText(profile.api_key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    if (!confirm('Regenerating your API key immediately invalidates the old one. Continue?')) return;

    setRegenerating(true);
    setError(null);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ api_key: generateApiKey() })
      .eq('id', profile.id);

    setRegenerating(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    await refreshProfile();
  };

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-medium mb-1">Overview</h1>
      <p className="text-gray-400 text-sm mb-8">
        Plan: <span className="text-white capitalize">{profile.plan_tier}</span>
      </p>

      <section data-tour="api-key" className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 mb-6">
        <h2 className="text-sm font-medium text-gray-300 mb-3">API Key</h2>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm font-mono truncate">
            {profile.api_key}
          </code>
          <button
            onClick={handleCopy}
            className="shrink-0 flex items-center justify-center w-10 h-10 rounded-lg liquid-glass hover:bg-white/10 transition-colors"
            aria-label="Copy API key"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="mt-4 flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
          Regenerate key
        </button>
        {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
      </section>

      <section data-tour="usage" className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-sm font-medium text-gray-300 mb-3">Monthly usage</h2>
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-2xl font-medium">{profile.usage_this_month}</span>
          <span className="text-sm text-gray-400">/ {profile.monthly_quota} renders</span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all"
            style={{ width: `${usagePct}%` }}
          />
        </div>
      </section>
    </div>
  );
}
