import { useEffect, useState } from 'react';
import { Copy, Check, RefreshCw, Crown } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';
import { generateApiKey } from '../../lib/apiKey';
import { openCheckout, isCheckoutConfigured, type PaidPlan } from '../../lib/lemonsqueezy';

const PLAN_LABEL: Record<string, string> = { free: 'Free', starter: 'Starter', pro: 'Pro', agency: 'Agency' };

export default function Overview() {
  const { user, profile, refreshProfile } = useAuth();
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState<PaidPlan | null>(null);

  // Someone who picked Pro/Agency on the landing page before having an
  // account gets sent to sign up first (see PricingSection.tsx); once
  // their profile exists here, pick the checkout back up automatically.
  useEffect(() => {
    if (!user?.email || !profile) return;
    const pending = localStorage.getItem('visora_pending_plan');
    if (pending !== 'pro' && pending !== 'agency') return;

    localStorage.removeItem('visora_pending_plan');
    openCheckout(pending, { id: user.id, email: user.email }, refreshProfile);
  }, [user, profile, refreshProfile]);

  if (!profile) {
    return (
      <div className="p-8">
        <p className="text-gray-400 text-sm">Loading your account…</p>
      </div>
    );
  }

  const usagePct = Math.min(100, Math.round((profile.usage_this_month / profile.monthly_quota) * 100));

  const handleUpgrade = (plan: PaidPlan) => {
    if (!user?.email) return;
    setUpgrading(plan);
    openCheckout(plan, { id: user.id, email: user.email }, () => {
      refreshProfile();
      setUpgrading(null);
    });
  };

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

      <section data-tour="usage" className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 mb-6">
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

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-medium text-gray-300">Billing</h2>
          <span className="text-xs text-white capitalize">{PLAN_LABEL[profile.plan_tier] ?? profile.plan_tier}</span>
        </div>
        {profile.subscription_status === 'cancelled' && profile.plan_renews_at && (
          <p className="text-xs text-amber-400/80 mb-4">
            Cancels on {new Date(profile.plan_renews_at).toLocaleDateString()} — you'll keep {PLAN_LABEL[profile.plan_tier]} access until then.
          </p>
        )}
        {profile.plan_tier === 'free' && <p className="text-xs text-gray-500 mb-4">Upgrade for more renders, no watermark, and priority rendering.</p>}

        {profile.plan_tier !== 'agency' && (
          <div className="flex flex-wrap gap-3">
            {profile.plan_tier === 'free' && (
              <button
                onClick={() => handleUpgrade('pro')}
                disabled={upgrading !== null || !isCheckoutConfigured('pro')}
                className="flex items-center gap-2 bg-white text-black rounded-lg font-medium px-4 py-2 text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {upgrading === 'pro' ? 'Opening checkout…' : 'Upgrade to Pro'}
              </button>
            )}
            <button
              onClick={() => handleUpgrade('agency')}
              disabled={upgrading !== null || !isCheckoutConfigured('agency')}
              className="flex items-center gap-2 liquid-glass rounded-lg font-medium px-4 py-2 text-sm hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <Crown className="w-3.5 h-3.5" />
              {upgrading === 'agency' ? 'Opening checkout…' : 'Upgrade to Agency'}
            </button>
          </div>
        )}
        {!isCheckoutConfigured('pro') && !isCheckoutConfigured('agency') && (
          <p className="text-[11px] text-gray-600 mt-3">Billing isn't fully configured yet.</p>
        )}
      </section>
    </div>
  );
}
