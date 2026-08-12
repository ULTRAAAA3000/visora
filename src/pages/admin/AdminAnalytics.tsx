import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface PageView {
  path: string;
  referrer: string | null;
  country: string | null;
  created_at: string;
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-medium">{value}</p>
    </div>
  );
}

function referrerLabel(referrer: string | null): string {
  if (!referrer) return 'Direct';
  try {
    return new URL(referrer).hostname.replace(/^www\./, '');
  } catch {
    return referrer;
  }
}

const DAYS_SHOWN = 14;

export default function AdminAnalytics() {
  const [views, setViews] = useState<PageView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    supabase
      .from('page_views')
      .select('path, referrer, country, created_at')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })
      .limit(10000)
      .then(({ data, error }) => {
        if (!error && data) setViews(data);
        setLoading(false);
      });
  }, []);

  const stats = useMemo(() => {
    const now = Date.now();
    const DAY = 86_400_000;

    const today = views.filter((v) => now - new Date(v.created_at).getTime() < DAY).length;
    const last7d = views.filter((v) => now - new Date(v.created_at).getTime() < 7 * DAY).length;
    const last30d = views.length; // already scoped to 30d by the query

    const byPath = new Map<string, number>();
    const byReferrer = new Map<string, number>();
    const byDay = new Map<string, number>();

    for (const v of views) {
      byPath.set(v.path, (byPath.get(v.path) ?? 0) + 1);
      const ref = referrerLabel(v.referrer);
      byReferrer.set(ref, (byReferrer.get(ref) ?? 0) + 1);

      const dayKey = new Date(v.created_at).toISOString().slice(0, 10);
      byDay.set(dayKey, (byDay.get(dayKey) ?? 0) + 1);
    }

    const topPaths = [...byPath.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
    const topReferrers = [...byReferrer.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

    const days: { label: string; count: number }[] = [];
    for (let i = DAYS_SHOWN - 1; i >= 0; i--) {
      const d = new Date(now - i * DAY);
      const key = d.toISOString().slice(0, 10);
      days.push({ label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), count: byDay.get(key) ?? 0 });
    }
    const maxDayCount = Math.max(1, ...days.map((d) => d.count));

    return { today, last7d, last30d, topPaths, topReferrers, days, maxDayCount };
  }, [views]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <p className="text-gray-400 text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-medium mb-1">Analytics</h1>
      <p className="text-gray-400 text-sm mb-6">Self-hosted — no Google/Plausible in the loop, just our own Worker + Supabase.</p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Today" value={String(stats.today)} />
        <StatCard label="Last 7 days" value={String(stats.last7d)} />
        <StatCard label="Last 30 days" value={String(stats.last30d)} />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 mb-6">
        <p className="text-xs text-gray-500 mb-4">Views per day (last {DAYS_SHOWN} days)</p>
        <div className="flex items-end gap-1.5 h-32">
          {stats.days.map((d) => (
            <div key={d.label} className="flex-1 flex flex-col items-center gap-1.5 group relative">
              <div
                className="w-full bg-white/20 group-hover:bg-white/40 rounded-sm transition-colors"
                style={{ height: `${Math.max(2, (d.count / stats.maxDayCount) * 100)}%` }}
              />
              <span className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-white bg-black border border-white/10 rounded px-1.5 py-0.5 whitespace-nowrap">
                {d.label}: {d.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-white/10 overflow-hidden">
          <p className="text-xs text-gray-500 px-4 py-3 border-b border-white/10">Top pages (30d)</p>
          {stats.topPaths.length === 0 ? (
            <p className="px-4 py-6 text-center text-gray-600 text-sm">No data yet.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {stats.topPaths.map(([path, count]) => (
                  <tr key={path} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-2.5 text-gray-300 truncate max-w-0">{path}</td>
                    <td className="px-4 py-2.5 text-gray-500 text-right whitespace-nowrap">{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 overflow-hidden">
          <p className="text-xs text-gray-500 px-4 py-3 border-b border-white/10">Top referrers (30d)</p>
          {stats.topReferrers.length === 0 ? (
            <p className="px-4 py-6 text-center text-gray-600 text-sm">No data yet.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {stats.topReferrers.map(([ref, count]) => (
                  <tr key={ref} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-2.5 text-gray-300 truncate max-w-0">{ref}</td>
                    <td className="px-4 py-2.5 text-gray-500 text-right whitespace-nowrap">{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
