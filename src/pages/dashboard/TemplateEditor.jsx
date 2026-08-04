import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, Trash2, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase.js';

function fillTemplate(htmlBody, variables) {
  return htmlBody.replace(/{{\s*([\w.]+)\s*}}/g, (_match, key) => {
    const value = variables[key];
    return value === undefined || value === null ? '' : String(value);
  });
}

export default function TemplateEditor() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [template, setTemplate] = useState(null);
  const [variablesText, setVariablesText] = useState('{}');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    supabase
      .from('templates')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error: fetchError }) => {
        if (!isMounted) return;
        if (fetchError) {
          setError(fetchError.message);
        } else {
          setTemplate(data);
          setVariablesText(JSON.stringify(data.default_variables ?? {}, null, 2));
        }
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const parsedVariables = useMemo(() => {
    try {
      return { value: JSON.parse(variablesText), error: null };
    } catch (e) {
      return { value: {}, error: 'Invalid JSON' };
    }
  }, [variablesText]);

  const previewHtml = useMemo(() => {
    if (!template) return '';
    return fillTemplate(template.html_body, parsedVariables.value);
  }, [template, parsedVariables.value]);

  const handleSave = async () => {
    if (!template || parsedVariables.error) return;
    setSaving(true);
    setError(null);

    const { error: updateError } = await supabase
      .from('templates')
      .update({
        title: template.title,
        category: template.category,
        html_body: template.html_body,
        default_variables: parsedVariables.value,
        width: template.width,
        height: template.height,
      })
      .eq('id', id);

    setSaving(false);
    if (updateError) setError(updateError.message);
  };

  const handleDelete = async () => {
    if (!confirm('Delete this template? This cannot be undone.')) return;
    const { error: deleteError } = await supabase.from('templates').delete().eq('id', id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    navigate('/dashboard/templates');
  };

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-400 text-sm">Loading template…</p>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="p-8">
        <p className="text-red-400 text-sm">{error || 'Template not found.'}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('/dashboard/templates')}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Back to templates"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <input
            value={template.title}
            onChange={(e) => setTemplate({ ...template, title: e.target.value })}
            className="bg-transparent text-sm font-medium outline-none border-b border-transparent focus:border-white/30 truncate"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {error && <span className="text-xs text-red-400">{error}</span>}
          <button
            onClick={handleDelete}
            className="flex items-center justify-center w-9 h-9 rounded-lg text-gray-400 hover:text-red-400 hover:bg-white/5 transition-colors"
            aria-label="Delete template"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !!parsedVariables.error}
            className="flex items-center gap-2 bg-white text-black rounded-lg font-medium px-4 py-2 text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0">
        <div className="flex flex-col border-r border-white/10 min-h-0">
          <div className="flex-1 min-h-0 flex flex-col">
            <p className="text-xs uppercase tracking-wide text-gray-500 px-4 pt-4 pb-2">HTML template</p>
            <textarea
              value={template.html_body}
              onChange={(e) => setTemplate({ ...template, html_body: e.target.value })}
              spellCheck={false}
              className="flex-1 bg-black/40 text-gray-200 font-mono text-xs p-4 outline-none resize-none"
            />
          </div>
          <div className="h-48 border-t border-white/10 flex flex-col shrink-0">
            <p className="text-xs uppercase tracking-wide text-gray-500 px-4 pt-3 pb-2">
              Default variables (JSON)
            </p>
            <textarea
              value={variablesText}
              onChange={(e) => setVariablesText(e.target.value)}
              spellCheck={false}
              className="flex-1 bg-black/40 text-gray-200 font-mono text-xs p-4 outline-none resize-none"
            />
            {parsedVariables.error && (
              <p className="text-xs text-red-400 px-4 pb-2">{parsedVariables.error}</p>
            )}
          </div>
        </div>

        <div className="bg-[#0a0a0a] flex items-center justify-center p-6 overflow-auto min-h-0">
          <div className="shadow-2xl" style={{ width: template.width, height: template.height }}>
            <iframe
              title="Template preview"
              srcDoc={previewHtml}
              className="w-full h-full border-0 bg-white"
              sandbox="allow-scripts"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
