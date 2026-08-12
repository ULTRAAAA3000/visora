import { useEffect, useState } from 'react';
import { Mail, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ContactMessage {
  id: string;
  name: string | null;
  email: string;
  subject: string | null;
  message: string;
  status: string;
  created_at: string;
}

export default function AdminMessages() {
  const [rows, setRows] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setRows(data);
        setLoading(false);
      });
  }, []);

  const markRead = async (id: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'read' } : r)));
    await supabase.from('contact_messages').update({ status: 'read' }).eq('id', id);
  };

  const newCount = rows.filter((r) => r.status === 'new').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-medium mb-1">Messages</h1>
      <p className="text-gray-400 text-sm mb-6">
        {rows.length} total{newCount > 0 && ` · ${newCount} new`}
      </p>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-white/10 px-4 py-8 text-center text-gray-600 text-sm">
          No messages yet.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div
              key={r.id}
              className={`rounded-2xl border p-4 sm:p-5 ${
                r.status === 'new' ? 'border-white/20 bg-white/[0.03]' : 'border-white/10'
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-100 truncate">
                    {r.name || 'Anonymous'} <span className="text-gray-500 font-normal">&lt;{r.email}&gt;</span>
                  </p>
                  {r.subject && <p className="text-xs text-gray-500 mt-0.5">{r.subject}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-gray-600 whitespace-nowrap">
                    {new Date(r.created_at).toLocaleString()}
                  </span>
                  {r.status === 'new' && (
                    <button
                      onClick={() => markRead(r.id)}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Mark read
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-300 whitespace-pre-wrap mb-3">{r.message}</p>
              <a
                href={`mailto:${r.email}${r.subject ? `?subject=Re: ${encodeURIComponent(r.subject)}` : ''}`}
                className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                Reply
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
