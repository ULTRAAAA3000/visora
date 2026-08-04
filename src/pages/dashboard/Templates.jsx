import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileCode2, Sparkles } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext.jsx';
import { supabase } from '../../lib/supabase.js';

export default function Templates() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [presets, setPresets] = useState([]);
  const [myTemplates, setMyTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

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
        const all = data ?? [];
        setPresets(all.filter((t) => t.is_preset));
        setMyTemplates(all.filter((t) => !t.is_preset));
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [profile?.id]);

  const handleCreateBlank = async () => {
    if (!profile) return;
    setBusyId('blank');

    const { data, error } = await supabase
      .from('templates')
      .insert({
        user_id: profile.id,
        is_preset: false,
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

    setBusyId(null);
    if (error) {
      console.error(error);
      return;
    }
    navigate(`/dashboard/templates/${data.id}`);
  };

  const handleUsePreset = async (preset) => {
    if (!profile) return;
    setBusyId(preset.id);

    const { data, error } = await supabase
      .from('templates')
      .insert({
        user_id: profile.id,
        is_preset: false,
        title: preset.title,
        category: preset.category,
        html_body: preset.html_body,
        default_variables: preset.default_variables,
        width: preset.width,
        height: preset.height,
      })
      .select()
      .single();

    setBusyId(null);
    if (error) {
      console.error(error);
      return;
    }
    navigate(`/dashboard/templates/${data.id}`);
  };

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-400 text-sm">Loading templates…</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl">
      {/* Presets gallery */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-gray-400" />
          <h1 className="text-xl font-medium">Preset gallery</h1>
        </div>
        <p className="text-gray-400 text-sm mb-6">
          Ready-made templates — click one, fill in the fields, and it's yours to render.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {presets.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => handleUsePreset(tpl)}
              disabled={busyId === tpl.id}
              className="text-left rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:bg-white/[0.06] transition-colors disabled:opacity-50"
            >
              <div className="aspect-[4/3] rounded-lg bg-black/40 border border-white/10 mb-4 flex items-center justify-center">
                <FileCode2 className="w-6 h-6 text-gray-600" />
              </div>
              <h2 className="font-medium mb-1">{tpl.title}</h2>
              <p className="text-xs text-gray-500">
                {tpl.category} · {tpl.width}×{tpl.height}
              </p>
              <span className="inline-block mt-3 text-xs text-white underline underline-offset-2">
                {busyId === tpl.id ? 'Creating…' : 'Use this template'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Your templates */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-medium mb-1">Your templates</h2>
            <p className="text-gray-400 text-sm">Templates you've created or customized.</p>
          </div>
          <button
            onClick={handleCreateBlank}
            disabled={busyId === 'blank'}
            className="flex items-center gap-2 bg-white text-black rounded-lg font-medium px-4 py-2 text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            {busyId === 'blank' ? 'Creating…' : 'Blank template'}
          </button>
        </div>

        {myTemplates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 p-12 text-center">
            <FileCode2 className="w-8 h-8 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              No templates yet. Use a preset above or start from a blank one.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {myTemplates.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => navigate(`/dashboard/templates/${tpl.id}`)}
                className="text-left rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:bg-white/[0.06] transition-colors"
              >
                <h2 className="font-medium truncate mb-1">{tpl.title}</h2>
                <p className="text-xs text-gray-500">
                  {tpl.category} · {tpl.width}×{tpl.height}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
