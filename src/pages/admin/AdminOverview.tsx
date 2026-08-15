import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Image, TrendingUp, Crown, DollarSign, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Profile } from '../../lib/database.types';

// Live prices from PricingSection — keep in sync if pricing changes.
const PLAN_PRICE_USD: Record<'pro' | 'agency', number> = { pro: 19, agency: 49 };

type CheckStatus = 'checking' | 'up' | 'down';

function useHealthCheck(url: string): CheckStatus {
  const [status, setStatus] = useState<CheckStatus>('checking');
  useEffect(() => {
    let cancelled = false;
    fetch(url, { method: 'GET', mode: 'no-cors' })
      .then(() => !cancelled && setStatus('up'))
      .catch(() => !cancelled && setStatus('down'));
    return () => {
      cancelled = true;
    };
  }, [url]);
  return status;
}

function StatusRow({ label, status }: { label: string; status: CheckStatus }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-400">{label}</span>
      {status === 'checking' && <span className="text-xs text-gray-600">Checking…</span>}
      {status === 'up' && (
        <span className="flex items-center gap-1.5 text-emerald-400 text-xs">
          <CheckCircle2 className="w-3.5 h-3.5" /> Up
        </span>
      )}
      {status === 'down' && (
        <span className="flex items-center gap-1.5 text-red-400 text-xs">
          <XCircle className="w-3.5 h-3.5" /> Unreachable
        </span>
      )}
    </div>
  );
}

interface Stats {
  totalUsers: number;
  byPlan: Record<Profile['plan_tier'], number>;
  rendersThisMonth: number;
  rendersTotal: number;
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<Pick<Profile, 'id' | 'email' | 'plan_tier' | 'created_at'>[]>([]);
  const [loading, setLoading] = useState(true);
  const siteStatus = useHealthCheck('https://visor-a.com/');
  const apiStatus = useHealthCheck('https://api.visor-a.com/');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [
        { count: totalUsers },
        { count: free },
        { count: starter },
        { count: pro },
        { count: agency },
        { count: rendersThisMonth },
        { count: rendersTotal },
        { data: recentUsers },
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('plan_tier', 'free'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('plan_tier', 'starter'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('plan_tier', 'pro'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('plan_tier', 'agency'),
        supabase
          .from('render_logs')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', startOfMonth.toISOString()),
        supabase.from('render_logs').select('id', { count: 'exact', head: true }),
        supabase
          .from('profiles')
          .select('id, email, plan_tier, created_at')
          .order('created_at', { ascending: false })
          .limit(8),
      ]);

      if (cancelled) return;

      setStats({
        totalUsers: totalUsers ?? 0,
        byPlan: { free: free ?? 0, starter: starter ?? 0, pro: pro ?? 0, agency: agency ?? 0 },
        rendersThisMonth: rendersThisMonth ?? 0,
        rendersTotal: rendersTotal ?? 0,
      });
      setRecent(recentUsers ?? []);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || !stats) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <p className="text-gray-400 text-sm">Loading…</p>
      </div>
    );
  }

  const paidUsers = stats.byPlan.starter + stats.byPlan.pro + stats.byPlan.agency;
  const estimatedMrr = stats.byPlan.pro * PLAN_PRICE_USD.pro + stats.byPlan.agency * PLAN_PRICE_USD.agency;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
      <h1 className="text-2xl font-medium mb-1">Overview</h1>
      <p className="text-gray-400 text-sm mb-8">Account-wide stats across all users.</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-2">
        <StatCard icon={Users} label="Total users" value={stats.totalUsers} />
        <StatCard icon={Crown} label="Paid users" value={paidUsers} />
        <StatCard icon={DollarSign} label="Est. MRR" value={estimatedMrr} prefix="$" />
        <StatCard icon={Image} label="Renders this month" value={stats.rendersThisMonth} />
        <StatCard icon={TrendingUp} label="Renders all-time" value={stats.rendersTotal} />
      </div>
      <p className="text-xs text-gray-600 mb-8">
        MRR is plan-tier count × list price (Pro ${PLAN_PRICE_USD.pro}, Agency ${PLAN_PRICE_USD.agency}) — not
        real payment data. LemonSqueezy is being replaced, so actual billing figures aren't wired up yet; see
        Billing for individual subscription status.
      </p>

      <div className="grid sm:grid-cols-2 gap-6">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-sm font-medium text-gray-300 mb-4">Users by plan</h2>
          <div className="space-y-3">
            {(['free', 'starter', 'pro', 'agency'] as const).map((tier) => (
              <div key={tier} className="flex items-center justify-between text-sm">
                <span className="text-gray-400 capitalize">{tier}</span>
                <span className="text-white font-medium">{stats.byPlan[tier]}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-300">Recent signups</h2>
            <Link to="/admin/users" className="text-xs text-gray-500 hover:text-white transition-colors">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {recent.map((u) => (
              <div key={u.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-300 truncate mr-2">{u.email}</span>
                <span className="text-xs text-gray-500 shrink-0 capitalize">{u.plan_tier}</span>
              </div>
            ))}
            {recent.length === 0 && <p className="text-xs text-gray-600">No signups yet.</p>}
          </div>
        </section>
      </div>

      <div className="grid sm:grid-cols-2 gap-6 mt-6">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-sm font-medium text-gray-300 mb-1">System status</h2>
          <p className="text-xs text-gray-600 mb-4">
            Live reachability check on page load — confirms the server responds, not that every feature works.
            No continuous monitoring or alerting is wired up yet.
          </p>
          <div className="space-y-3">
            <StatusRow label="Site (visor-a.com)" status={siteStatus} />
            <StatusRow label="Render API (api.visor-a.com)" status={apiStatus} />
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-sm font-medium text-gray-300 mb-1">Traffic &amp; search</h2>
          <p className="text-xs text-gray-600 mb-4">
            Not connected — these need OAuth setup with your own Google account, which has to be done from
            Google's side directly.
          </p>
          <div className="space-y-2">
            <a
              href="https://search.google.com/search-console"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-gray-300 hover:text-white transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Google Search Console
            </a>
            <a
              href="https://analytics.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-gray-300 hover:text-white transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Google Analytics
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  prefix,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  prefix?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <Icon className="w-4 h-4 text-gray-500 mb-3" />
      <p className="text-2xl font-medium">
        {prefix}
        {value.toLocaleString()}
      </p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}
