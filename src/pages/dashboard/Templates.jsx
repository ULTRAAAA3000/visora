import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FileCode2 } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext.jsx';
import { supabase } from '../../lib/supabase.js';

export default function Templates() {
  const { profile } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!profile) return;

    let isMounted = true;
    supabase
      .from('templates')
      .select('*')
      .or(`user_id.eq.${profile.id},is_preset.eq.true`)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error) console.error(error);
        setTemplates(data ?? []);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [profile?.id]);

  const handleCreate = async () => {
    if (!profile) return;
    setCreating(true);

    const { data, error } = await supabase
      .from('templates')
      .insert({
        user_id: profile.id,
        title: 'Untitled template',
        category: 'banner',
        html_body:
          '<!DOCTYPE html>\n<html>\n<head>\n  <script src="https://cdn.tailwindcss.com"></script>\n</head>\n<body class="bg-slate-950 text-white w-[1200px] h-[630px] flex items-center justify-center">\n  <h1 class="text-5xl font-bold">{{title}}</h1>\n</body>\n</html>',
        default_variables: { title: 'Hello, Visora' },
        width: 1200,
        height: 630,
      })
      .select()
      .single();

    setCreating(false);
    if (error) {
      console.error(error);
      return;
    }
    setTemplates((prev) => [data, ...prev]);
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-medium mb-1">Templates</h1>
          <p className="text-gray-400 text-sm">HTML/Tailwind templates used by the render API.</p>
        </div>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="flex items-center gap-2 bg-white text-black rounded-lg font-medium px-4 py-2 text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          {creating ? 'Creating…' : 'New template'}
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading templates…</p>
      ) : templates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 p-12 text-center">
          <FileCode2 className="w-8 h-8 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No templates yet. Create your first one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {templates.map((tpl) => (
            <Link
              key={tpl.id}
              to={`/dashboard/templates/${tpl.id}`}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:bg-white/[0.06] transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-medium truncate">{tpl.title}</h2>
                {tpl.is_preset && (
                  <span className="text-[10px] uppercase tracking-wide text-gray-400 border border-white/15 rounded-full px-2 py-0.5">
                    Preset
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {tpl.category} · {tpl.width}×{tpl.height}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
