import { useEffect, useMemo, useState } from 'react';
import { Search, ShieldCheck, RotateCcw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import type { Profile } from '../../lib/database.types';

type Row = Pick<Profile, 'id' | 'email' | 'plan_tier' | 'monthly_quota' | 'usage_this_month' | 'is_admin' | 'created_at'>;

const PLAN_TIERS: Profile['plan_tier'][] = ['free', 'starter', 'pro', 'agency'];

export default function AdminUsers() {
  const { profile: currentAdmin } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setLoadError(null);
    // NOTE: deliberately not selecting subscription_status here — that
    // column ships with the Paddle billing migration (0015), which is
    // being held back while billing is reworked. Selecting a column
    // that doesn't exist yet fails the whole query (empty table, no
    // visible error) rather than just that one field.
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, plan_tier, monthly_quota, usage_this_month, is_admin, created_at')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Failed to load users', error);
      setLoadError(error.message);
    } else if (data) {
      setRows(data);
    }
    setLoading(false);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.email.toLowerCase().includes(q));
  }, [rows, query]);

  async function updatePlan(id: string, plan_tier: Profile['plan_tier']) {
    setSavingId(id);
    const quota = { free: 500, starter: 2000, pro: 10000, agency: 50000 }[plan_tier];
    const { error } = await supabase.from('profiles').update({ plan_tier, monthly_quota: quota }).eq('id', id);
    if (!error) setRows((rs) => rs.map((r) => (r.id === id ? { ...r, plan_tier, monthly_quota: quota } : r)));
    setSavingId(null);
  }

  async function toggleAdmin(id: string, next: boolean) {
    if (id === currentAdmin?.id && !next) {
      if (!confirm("Remove your own admin access? You'll be redirected to the regular dashboard.")) return;
    }
    setSavingId(id);
    const { error } = await supabase.from('profiles').update({ is_admin: next }).eq('id', id);
    if (!error) setRows((rs) => rs.map((r) => (r.id === id ? { ...r, is_admin: next } : r)));
    setSavingId(null);
  }

  async function resetUsage(id: string) {
    setSavingId(id);
    const { error } = await supabase.from('profiles').update({ usage_this_month: 0 }).eq('id', id);
    if (!error) setRows((rs) => rs.map((r) => (r.id === id ? { ...r, usage_this_month: 0 } : r)));
    setSavingId(null);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-medium mb-1">Users</h1>
      <p className="text-gray-400 text-sm mb-6">{rows.length} total.</p>

      <div className="relative mb-6 max-w-sm">
        <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by email…"
          className="w-full rounded-lg bg-white/5 border border-white/10 pl-9 pr-3 py-2 text-sm outline-none focus:border-white/30 transition-colors"
        />
      </div>

      {loadError && (
        <p className="text-sm text-red-400 mb-4">Couldn't load users: {loadError}</p>
      )}

      {loading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Usage</th>
                <th className="px-4 py-3 font-medium">Plan status</th>
                <th className="px-4 py-3 font-medium">Admin</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 text-gray-200 max-w-[220px] truncate">{r.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={r.plan_tier}
                      disabled={savingId === r.id}
                      onChange={(e) => updatePlan(r.id, e.target.value as Profile['plan_tier'])}
                      className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-xs capitalize outline-none focus:border-white/30 disabled:opacity-50"
                    >
                      {PLAN_TIERS.map((t) => (
                        <option key={t} value={t} className="bg-black">
                          {t}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                    {r.usage_this_month} / {r.monthly_quota}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {r.plan_tier === 'free' ? 'Free' : 'Paid'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleAdmin(r.id, !r.is_admin)}
                      disabled={savingId === r.id}
                      className={`flex items-center gap-1 text-xs rounded-md px-2 py-1 border transition-colors disabled:opacity-50 ${
                        r.is_admin
                          ? 'border-amber-400/30 text-amber-400 bg-amber-400/10'
                          : 'border-white/10 text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      <ShieldCheck className="w-3 h-3" />
                      {r.is_admin ? 'Admin' : 'Grant'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => resetUsage(r.id)}
                      disabled={savingId === r.id || r.usage_this_month === 0}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors disabled:opacity-30"
                      title="Reset usage_this_month to 0"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset usage
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-600 text-sm">
                    No users match "{query}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
