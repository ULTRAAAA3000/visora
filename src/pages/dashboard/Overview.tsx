import { useEffect, useState, type FormEvent } from 'react';
import { Copy, Check, RefreshCw, Crown, Webhook, Send, Lock } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';
import { generateApiKey, generateWebhookSecret } from '../../lib/apiKey';
import { openCheckout, isCheckoutConfigured, type PaidPlan } from '../../lib/paddle';

const PLAN_LABEL: Record<string, string> = { free: 'Free', starter: 'Starter', pro: 'Pro', agency: 'Agency' };
const WEBHOOK_PLANS = new Set(['pro', 'agency']);

export default function Overview() {
  const { user, profile, refreshProfile } = useAuth();
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState<PaidPlan | null>(null);
  const [webhookUrlInput, setWebhookUrlInput] = useState('');
  const [webhookSaving, setWebhookSaving] = useState(false);
  const [webhookSaved, setWebhookSaved] = useState(false);
  const [webhookError, setWebhookError] = useState<string | null>(null);
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<'ok' | 'error' | null>(null);
  const [secretCopied, setSecretCopied] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordChanged, setPasswordChanged] = useState(false);

  useEffect(() => {
    setWebhookUrlInput(profile?.webhook_url ?? '');
  }, [profile?.webhook_url]);

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
      <div className="p-4 sm:p-6 lg:p-8">
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

  const handleSaveWebhook = async () => {
    setWebhookSaving(true);
    setWebhookError(null);
    setTestResult(null);

    const trimmed = webhookUrlInput.trim();
    if (trimmed && !/^https:\/\/.+/.test(trimmed)) {
      setWebhookSaving(false);
      setWebhookError('Webhook URL must start with https://');
      return;
    }

    const update: { webhook_url: string | null; webhook_secret?: string } = { webhook_url: trimmed || null };
    if (trimmed && !profile.webhook_secret) {
      update.webhook_secret = generateWebhookSecret();
    }

    const { error: updateError } = await supabase.from('profiles').update(update).eq('id', profile.id);

    setWebhookSaving(false);
    if (updateError) {
      setWebhookError(updateError.message);
      return;
    }
    setWebhookSaved(true);
    setTimeout(() => setWebhookSaved(false), 2000);
    await refreshProfile();
  };

  const handleCopySecret = async () => {
    if (!profile.webhook_secret) return;
    await navigator.clipboard.writeText(profile.webhook_secret);
    setSecretCopied(true);
    setTimeout(() => setSecretCopied(false), 2000);
  };

  const handleChangePassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordChanged(false);

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords don't match.");
      return;
    }

    setChangingPassword(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);

    if (updateError) {
      setPasswordError(updateError.message);
      return;
    }
    setNewPassword('');
    setConfirmPassword('');
    setPasswordChanged(true);
    setTimeout(() => setPasswordChanged(false), 3000);
  };

  const handleSendTestWebhook = async () => {
    const apiBase = import.meta.env.VITE_RENDER_API_URL;
    if (!apiBase) return;

    setTestSending(true);
    setTestResult(null);
    try {
      const res = await fetch(`${apiBase.replace(/\/$/, '')}/api/v1/webhooks/test`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${profile.api_key}` },
      });
      setTestResult(res.ok ? 'ok' : 'error');
    } catch {
      setTestResult('error');
    }
    setTestSending(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl">
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

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 mt-6">
        <div className="flex items-center gap-2 mb-1">
          <Webhook className="w-4 h-4 text-gray-300" />
          <h2 className="text-sm font-medium text-gray-300">Webhooks</h2>
        </div>

        {!WEBHOOK_PLANS.has(profile.plan_tier) ? (
          <p className="text-xs text-gray-500">
            Get notified the moment a render finishes instead of polling — available on Pro and Agency.
          </p>
        ) : (
          <>
            <p className="text-xs text-gray-500 mb-4">
              We'll POST a <code className="text-gray-400">render.completed</code> event here every time a render
              finishes, signed with your secret below.
            </p>

            <div className="flex flex-col sm:flex-row gap-2 mb-2">
              <input
                type="url"
                value={webhookUrlInput}
                onChange={(e) => setWebhookUrlInput(e.target.value)}
                placeholder="https://your-app.com/webhooks/visora"
                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm font-mono placeholder:text-gray-600 focus:outline-none focus:border-white/30"
              />
              <button
                onClick={handleSaveWebhook}
                disabled={webhookSaving || webhookUrlInput.trim() === (profile.webhook_url ?? '')}
                className="shrink-0 flex items-center justify-center gap-2 bg-white text-black rounded-lg font-medium px-4 py-2.5 text-sm hover:bg-gray-200 transition-colors disabled:opacity-40"
              >
                {webhookSaved ? <Check className="w-4 h-4" /> : webhookSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
            {webhookError && <p className="text-sm text-red-400 mb-2">{webhookError}</p>}

            {profile.webhook_secret && (
              <div className="flex items-center gap-2 mt-3">
                <code className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm font-mono truncate text-gray-400">
                  {profile.webhook_secret}
                </code>
                <button
                  onClick={handleCopySecret}
                  className="shrink-0 flex items-center justify-center w-10 h-10 rounded-lg liquid-glass hover:bg-white/10 transition-colors"
                  aria-label="Copy webhook secret"
                >
                  {secretCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            )}

            {profile.webhook_url && profile.webhook_secret && (
              <div className="mt-4">
                {import.meta.env.VITE_RENDER_API_URL ? (
                  <button
                    onClick={handleSendTestWebhook}
                    disabled={testSending}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                  >
                    <Send className={`w-3.5 h-3.5 ${testSending ? 'animate-pulse' : ''}`} />
                    {testSending ? 'Sending…' : 'Send test event'}
                  </button>
                ) : (
                  <p className="text-[11px] text-gray-600">Test-send isn't wired up yet.</p>
                )}
                {testResult === 'ok' && <p className="text-xs text-emerald-400/80 mt-2">Sent — check your endpoint.</p>}
                {testResult === 'error' && (
                  <p className="text-xs text-red-400/80 mt-2">Couldn't reach that URL, or it returned an error.</p>
                )}
              </div>
            )}
          </>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 mt-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-4 h-4 text-gray-300" />
          <h2 className="text-sm font-medium text-gray-300">Account security</h2>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-3 max-w-sm">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">New password</label>
            <input
              type="password"
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-white/30"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Confirm new password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-white/30"
            />
          </div>

          {passwordError && <p className="text-sm text-red-400">{passwordError}</p>}
          {passwordChanged && <p className="text-sm text-emerald-400/80">Password updated.</p>}

          <button
            type="submit"
            disabled={changingPassword || !newPassword}
            className="bg-white text-black rounded-lg font-medium px-4 py-2 text-sm hover:bg-gray-200 transition-colors disabled:opacity-40"
          >
            {changingPassword ? 'Saving…' : 'Update password'}
          </button>
        </form>
      </section>
    </div>
  );
}
