import { useEffect, useState, useMemo } from 'react';
import { Shield, AlertTriangle, Trash2, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { BlockedIpRange, SignupAttempt, SecuritySettingsRow } from '../../lib/database.types';

interface AuditEvent {
  id: string;
  action: string | null;
  email: string | null;
  ip_address: string | null;
  created_at: string;
}

export default function AdminSecurity() {
  const [auditLog, setAuditLog] = useState<AuditEvent[]>([]);
  const [signupAttempts, setSignupAttempts] = useState<SignupAttempt[]>([]);
  const [blockedRanges, setBlockedRanges] = useState<BlockedIpRange[]>([]);
  const [settings, setSettings] = useState<SecuritySettingsRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newCidr, setNewCidr] = useState('');
  const [newReason, setNewReason] = useState('');
  const [addingRange, setAddingRange] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);

    const [auditRes, signupRes, rangesRes, settingsRes] = await Promise.all([
      supabase.rpc('admin_get_auth_audit_log', { result_limit: 300 }),
      supabase.from('signup_attempts').select('*').order('created_at', { ascending: false }).limit(300),
      supabase.from('blocked_ip_ranges').select('*').order('created_at', { ascending: false }),
      supabase.from('security_settings').select('*').eq('id', true).single(),
    ]);

    if (auditRes.error) setError(auditRes.error.message);
    setAuditLog(auditRes.data ?? []);
    setSignupAttempts(signupRes.data ?? []);
    setBlockedRanges(rangesRes.data ?? []);
    setSettings(settingsRes.data ?? null);
    setLoading(false);
  }

  // Repeat-IP detection across both login events and signup attempts —
  // the whole point of "see the same IP hitting this more than once".
  const repeatIps = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of auditLog) {
      if (!e.ip_address) continue;
      counts.set(e.ip_address, (counts.get(e.ip_address) ?? 0) + 1);
    }
    for (const s of signupAttempts) {
      counts.set(s.ip_address, (counts.get(s.ip_address) ?? 0) + 1);
    }
    return counts;
  }, [auditLog, signupAttempts]);

  const blockedCidrSet = useMemo(() => blockedRanges.map((r) => r.cidr), [blockedRanges]);

  async function addBlockedRange() {
    if (!newCidr.trim()) return;
    setAddingRange(true);
    const { data, error: err } = await supabase
      .from('blocked_ip_ranges')
      .insert({ cidr: newCidr.trim(), reason: newReason.trim() || null })
      .select()
      .single();
    if (!err && data) {
      setBlockedRanges((rs) => [data, ...rs]);
      setNewCidr('');
      setNewReason('');
    } else if (err) {
      setError(err.message);
    }
    setAddingRange(false);
  }

  async function removeBlockedRange(id: number) {
    const { error: err } = await supabase.from('blocked_ip_ranges').delete().eq('id', id);
    if (!err) setBlockedRanges((rs) => rs.filter((r) => r.id !== id));
  }

  async function saveSettings() {
    if (!settings) return;
    setSavingSettings(true);
    const { error: err } = await supabase
      .from('security_settings')
      .update({ ...settings, updated_at: new Date().toISOString() })
      .eq('id', true);
    if (err) setError(err.message);
    setSavingSettings(false);
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <p className="text-gray-400 text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
      <div className="flex items-center gap-2 mb-1">
        <Shield className="w-5 h-5 text-amber-400" />
        <h1 className="text-2xl font-medium">Security</h1>
      </div>
      <p className="text-gray-400 text-sm mb-6">
        Login/signup activity, IP blocklist, and abuse-protection limits.
      </p>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 mb-6">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-200/80">{error}</p>
        </div>
      )}

      <div className="flex items-start gap-3 rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 mb-8">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-200/80 leading-relaxed">
          IP blocklist below only blocks <strong>sign-ups</strong> — Supabase's login hook doesn't receive an IP
          address, only a user ID, so login protection is per-account lockout (settings below), not per-IP. The
          login log still shows real IPs for visibility, sourced from Supabase's own audit trail.
        </p>
      </div>

      {/* Rate limit / lockout settings */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 mb-8">
        <h2 className="text-sm font-medium text-gray-300 mb-4">Limits</h2>
        {settings && (
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <SettingField
              label="Max signup attempts per IP"
              value={settings.max_signup_attempts_per_ip}
              onChange={(v) => setSettings({ ...settings, max_signup_attempts_per_ip: v })}
            />
            <SettingField
              label="Signup window (hours)"
              value={settings.signup_window_hours}
              onChange={(v) => setSettings({ ...settings, signup_window_hours: v })}
            />
            <SettingField
              label="Max login failures per account"
              value={settings.max_login_failures_per_account}
              onChange={(v) => setSettings({ ...settings, max_login_failures_per_account: v })}
            />
            <SettingField
              label="Login lockout (minutes)"
              value={settings.login_lockout_window_minutes}
              onChange={(v) => setSettings({ ...settings, login_lockout_window_minutes: v })}
            />
          </div>
        )}
        <button
          onClick={saveSettings}
          disabled={savingSettings}
          className="flex items-center gap-2 text-xs rounded-lg bg-white text-black px-3 py-2 font-medium disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" />
          {savingSettings ? 'Saving…' : 'Save limits'}
        </button>
      </section>

      {/* IP blocklist */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 mb-8">
        <h2 className="text-sm font-medium text-gray-300 mb-4">IP blocklist (blocks sign-ups)</h2>
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <input
            value={newCidr}
            onChange={(e) => setNewCidr(e.target.value)}
            placeholder="CIDR, e.g. 1.2.3.0/24"
            className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-white/30"
          />
          <input
            value={newReason}
            onChange={(e) => setNewReason(e.target.value)}
            placeholder="Reason (optional)"
            className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-white/30"
          />
          <button
            onClick={addBlockedRange}
            disabled={addingRange || !newCidr.trim()}
            className="rounded-lg bg-white text-black px-4 py-2 text-sm font-medium disabled:opacity-50 shrink-0"
          >
            Block
          </button>
        </div>
        <div className="space-y-2">
          {blockedRanges.map((r) => (
            <div key={r.id} className="flex items-center justify-between text-sm bg-black/30 rounded-lg px-3 py-2">
              <div className="min-w-0">
                <span className="text-gray-200 font-mono text-xs">{r.cidr}</span>
                {r.reason && <span className="text-gray-500 text-xs ml-2">— {r.reason}</span>}
              </div>
              <button
                onClick={() => removeBlockedRange(r.id)}
                className="text-gray-500 hover:text-red-400 transition-colors shrink-0"
                title="Remove"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {blockedRanges.length === 0 && <p className="text-xs text-gray-600">No blocked ranges.</p>}
        </div>
      </section>

      {/* Login audit log */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 mb-8">
        <h2 className="text-sm font-medium text-gray-300 mb-1">Login activity</h2>
        <p className="text-xs text-gray-600 mb-4">
          From Supabase's own auth audit trail. IPs seen more than once across this log and the signup log below
          are highlighted.
        </p>
        <div className="overflow-x-auto rounded-xl border border-white/10 max-h-96 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-[#0a0a0a]">
              <tr className="border-b border-white/10 text-left text-gray-500 uppercase tracking-wide">
                <th className="px-3 py-2 font-medium">Action</th>
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">IP</th>
                <th className="px-3 py-2 font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {auditLog.map((e) => {
                const isRepeat = e.ip_address ? (repeatIps.get(e.ip_address) ?? 0) > 1 : false;
                return (
                  <tr key={e.id} className="border-b border-white/5 last:border-0">
                    <td className="px-3 py-2 text-gray-300 capitalize">{e.action?.replace(/_/g, ' ')}</td>
                    <td className="px-3 py-2 text-gray-400 max-w-[180px] truncate">{e.email ?? '—'}</td>
                    <td className={`px-3 py-2 font-mono ${isRepeat ? 'text-amber-400' : 'text-gray-400'}`}>
                      {e.ip_address ?? '—'}
                      {isRepeat && <span className="ml-1 text-amber-500">×{repeatIps.get(e.ip_address!)}</span>}
                    </td>
                    <td className="px-3 py-2 text-gray-500 whitespace-nowrap">
                      {new Date(e.created_at).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
              {auditLog.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-gray-600">
                    No login activity recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Signup attempts log */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-sm font-medium text-gray-300 mb-4">Signup attempts</h2>
        <div className="overflow-x-auto rounded-xl border border-white/10 max-h-96 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-[#0a0a0a]">
              <tr className="border-b border-white/10 text-left text-gray-500 uppercase tracking-wide">
                <th className="px-3 py-2 font-medium">IP</th>
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">Result</th>
                <th className="px-3 py-2 font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {signupAttempts.map((s) => {
                const isRepeat = (repeatIps.get(s.ip_address) ?? 0) > 1;
                const isBlockedRange = blockedCidrSet.length > 0 && s.block_reason && s.blocked;
                return (
                  <tr key={s.id} className="border-b border-white/5 last:border-0">
                    <td className={`px-3 py-2 font-mono ${isRepeat ? 'text-amber-400' : 'text-gray-400'}`}>
                      {s.ip_address}
                      {isRepeat && <span className="ml-1 text-amber-500">×{repeatIps.get(s.ip_address)}</span>}
                    </td>
                    <td className="px-3 py-2 text-gray-400 max-w-[180px] truncate">{s.email ?? '—'}</td>
                    <td className="px-3 py-2">
                      {s.blocked ? (
                        <span className="text-red-400" title={s.block_reason ?? undefined}>
                          Blocked{isBlockedRange ? ' (range)' : ''}
                        </span>
                      ) : (
                        <span className="text-emerald-400">Allowed</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-gray-500 whitespace-nowrap">
                      {new Date(s.created_at).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
              {signupAttempts.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-gray-600">
                    No signup attempts recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function SettingField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs text-gray-500 block mb-1">{label}</span>
      <input
        type="number"
        min={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-white/30"
      />
    </label>
  );
}
