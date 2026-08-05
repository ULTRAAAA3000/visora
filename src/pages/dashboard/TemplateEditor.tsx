import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, Trash2, ArrowLeft, Code2, ListChecks, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Template } from '../../lib/database.types';

type VariableValues = Record<string, string>;
type View = 'fields' | 'html' | 'preview';

function fillTemplate(htmlBody: string, variables: VariableValues): string {
  return htmlBody.replace(/{{\s*([\w.]+)\s*}}/g, (_match, key: string) => {
    const value = variables[key];
    return value === undefined || value === null ? '' : String(value);
  });
}

/** Extracts every unique {{key}} placeholder from an HTML template, in order of first appearance. */
function extractVariableKeys(htmlBody: string): string[] {
  const keys: string[] = [];
  const seen = new Set<string>();
  const regex = /{{\s*([\w.]+)\s*}}/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(htmlBody)) !== null) {
    if (!seen.has(match[1])) {
      seen.add(match[1]);
      keys.push(match[1]);
    }
  }
  return keys;
}

function humanizeKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Renders the template's iframe scaled down to fit the available space,
 * so a 1600×1131 certificate or 1400×1400 podcast cover previews fully
 * on screen instead of forcing the user to scroll around it.
 */
function ScaledPreview({ html, width, height }: { html: string; width: number; height: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const recalc = () => {
      const { clientWidth, clientHeight } = el;
      const nextScale = Math.min(clientWidth / width, clientHeight / height, 1);
      setScale(nextScale > 0 ? nextScale : 1);
    };

    recalc();
    const observer = new ResizeObserver(recalc);
    observer.observe(el);
    return () => observer.disconnect();
  }, [width, height]);

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center p-6">
      <div className="shadow-2xl shrink-0" style={{ width: width * scale, height: height * scale }}>
        <iframe
          title="Template preview"
          srcDoc={html}
          sandbox="allow-scripts"
          style={{
            width,
            height,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            border: 0,
          }}
          className="bg-white"
        />
      </div>
    </div>
  );
}

interface Tab {
  id: View;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

export default function TemplateEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [template, setTemplate] = useState<Template | null>(null);
  const [variableValues, setVariableValues] = useState<VariableValues>({});
  const [view, setView] = useState<View>('fields');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
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
        } else if (data) {
          setTemplate(data);
          setVariableValues(data.default_variables ?? {});
        }
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const variableKeys = useMemo(
    () => (template ? extractVariableKeys(template.html_body) : []),
    [template?.html_body]
  );

  const previewHtml = useMemo(() => {
    if (!template) return '';
    return fillTemplate(template.html_body, variableValues);
  }, [template, variableValues]);

  const handleFieldChange = (key: string, value: string) => {
    setVariableValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!template || !id) return;
    setSaving(true);
    setError(null);

    const { error: updateError } = await supabase
      .from('templates')
      .update({
        title: template.title,
        category: template.category,
        html_body: template.html_body,
        default_variables: variableValues,
        width: template.width,
        height: template.height,
      })
      .eq('id', id);

    setSaving(false);
    if (updateError) setError(updateError.message);
  };

  const handleDelete = async () => {
    if (!id) return;
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

  const tabs: Tab[] = [
    { id: 'fields', label: 'Fields', icon: ListChecks },
    { id: 'html', label: 'HTML', icon: Code2 },
    { id: 'preview', label: 'Preview', icon: Eye },
  ];

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
          <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5 mr-2">
            {tabs.map(({ id: tabId, label, icon: Icon }) => (
              <button
                key={tabId}
                onClick={() => setView(tabId)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  view === tabId ? 'bg-white text-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

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
            disabled={saving}
            className="flex items-center gap-2 bg-white text-black rounded-lg font-medium px-4 py-2 text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-0">
        {view === 'fields' && (
          <div className="h-full overflow-y-auto p-6 max-w-xl mx-auto space-y-5">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Fill in the blanks — switch to the Preview tab to see the result.
            </p>

            {variableKeys.length === 0 ? (
              <p className="text-sm text-gray-500">
                This template has no <code className="text-gray-400">{'{{variables}}'}</code> yet. Switch to
                the HTML tab to add some, e.g. <code className="text-gray-400">{'{{title}}'}</code>.
              </p>
            ) : (
              variableKeys.map((key) => (
                <div key={key}>
                  <label className="block text-sm text-gray-300 mb-1.5">{humanizeKey(key)}</label>
                  <input
                    value={variableValues[key] ?? ''}
                    onChange={(e) => handleFieldChange(key, e.target.value)}
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-white/30 transition-colors"
                    placeholder={key}
                  />
                </div>
              ))
            )}
          </div>
        )}

        {view === 'html' && (
          <div className="h-full flex flex-col">
            <p className="text-xs uppercase tracking-wide text-gray-500 px-6 pt-4 pb-2">HTML template</p>
            <textarea
              value={template.html_body}
              onChange={(e) => setTemplate({ ...template, html_body: e.target.value })}
              spellCheck={false}
              className="flex-1 bg-black/40 text-gray-200 font-mono text-xs p-6 outline-none resize-none"
            />
          </div>
        )}

        {view === 'preview' && (
          <div className="h-full bg-[#0a0a0a]">
            <ScaledPreview html={previewHtml} width={template.width} height={template.height} />
          </div>
        )}
      </div>
    </div>
  );
}
