import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Profile } from '../../lib/database.types';

type Row = Pick<Profile, 'id' | 'email' | 'plan_tier' | 'subscription_status' | 'plan_renews_at' | 'paddle_customer_id'>;

export default function AdminBilling() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, email, plan_tier, subscription_status, plan_renews_at, paddle_customer_id')
      .neq('plan_tier', 'free')
      .order('plan_renews_at', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setRows(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-medium mb-1">Billing</h1>
      <p className="text-gray-400 text-sm mb-6">Paying customers — {rows.length} active.</p>

      <div className="flex items-start gap-3 rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 mb-6">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-200/80 leading-relaxed">
          Billing runs on Paddle. The webhook + checkout code is wired up in the codebase, but the products/prices
          and Paddle-side setup are pending — this list will populate once that's live.
        </p>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Renews / ends</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 text-gray-200 max-w-[220px] truncate">{r.email}</td>
                  <td className="px-4 py-3 capitalize text-gray-300">{r.plan_tier}</td>
                  <td className="px-4 py-3 text-gray-400">{r.subscription_status ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {r.plan_renews_at ? new Date(r.plan_renews_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-600 text-sm">
                    No paying customers yet.
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
