import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RotateCw, Download, ImageOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type HistoryRow = {
  id: string;
  template_id: string;
  image_url: string | null;
  data: Record<string, string> | null;
  created_at: string;
  render_time_ms: number;
  template: { title: string } | null;
};

const PAGE_SIZE = 30;

export default function History() {
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setLoadError(null);
    const { data, error } = await supabase
      .from('render_logs')
      .select('id, template_id, image_url, data, created_at, render_time_ms, template:templates(title)')
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE + 1);

    if (error) {
      console.error('Failed to load render history', error);
      setLoadError(error.message);
    } else if (data) {
      setHasMore(data.length > PAGE_SIZE);
      // Supabase's embed comes back as an array for one-to-many FK
      // direction even though template_id -> templates.id is many-to-one
      // here; normalize to a single object.
      const normalized = data.slice(0, PAGE_SIZE).map((r) => ({
        ...r,
        template: Array.isArray(r.template) ? (r.template[0] ?? null) : r.template,
      })) as HistoryRow[];
      setRows(normalized);
    }
    setLoading(false);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-medium mb-1">History</h1>
      <p className="text-gray-400 text-sm mb-6">Your last {PAGE_SIZE} renders. Repeat one instantly with the same field values.</p>

      {loadError && <p className="text-sm text-red-400 mb-4">Couldn't load history: {loadError}</p>}

      {loading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-gray-500 text-sm">No renders yet — generate something from Templates and it'll show up here.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {rows.map((r) => (
            <div key={r.id} className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden flex flex-col">
              <div className="aspect-[1.91/1] bg-black/40 flex items-center justify-center">
                {r.image_url ? (
                  <img src={r.image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <ImageOff className="w-6 h-6 text-gray-700" />
                )}
              </div>
              <div className="p-3 flex flex-col gap-2 flex-1">
                <p className="text-sm text-gray-200 truncate">{r.template?.title ?? 'Untitled template'}</p>
                <p className="text-xs text-gray-500">
                  {new Date(r.created_at).toLocaleString()} · {r.render_time_ms}ms
                </p>
                <div className="mt-auto flex items-center gap-2 pt-2">
                  <Link
                    to={`/dashboard/templates/${r.template_id}?rerun=${r.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs bg-white/10 hover:bg-white/20 transition-colors rounded-md px-2 py-1.5 text-gray-200"
                    title="Prefill the editor with these exact field values and re-render"
                  >
                    <RotateCw className="w-3 h-3" />
                    Quick Re-run
                  </Link>
                  {r.image_url && (
                    <a
                      href={r.image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center text-xs border border-white/10 hover:border-white/30 transition-colors rounded-md px-2 py-1.5 text-gray-400 hover:text-white"
                      title="Open full image"
                    >
                      <Download className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {hasMore && <p className="text-xs text-gray-600 mt-6">Showing the most recent {PAGE_SIZE} — older renders aren't listed yet.</p>}
    </div>
  );
}
