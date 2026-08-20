import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Save, Trash2, ArrowLeft, Code2, ListChecks, Eye, Download, Link2, ImagePlus, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { useToast } from '../../components/ToastProvider';
import { trackVisibilityDuringRender, shouldNotifyRenderComplete } from '../../lib/renderNotify';
import type { Template } from '../../lib/database.types';
import { fillTemplate, extractVariableKeys, humanizeKey, type VariableValues } from '../../lib/template';

type View = 'fields' | 'html' | 'preview';

/** Field keys that read as "this holds a photo, not text" — swaps the text
 * input for a drag/drop file picker that inlines the image as a data URL. */
const IMAGE_KEY_PATTERN = /photo|image|logo|avatar|picture|background|banner|cover/i;

function isImageField(key: string): boolean {
  return IMAGE_KEY_PATTERN.test(key);
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function ImageField({
  keyName,
  value,
  onChange,
}: {
  keyName: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setImageError('Please choose an image file.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError('Image is too large — 5MB max.');
      return;
    }
    setImageError(null);
    onChange(await readFileAsDataUrl(file));
  };

  return (
    <div>
      <label className="block text-sm text-gray-300 mb-1.5">{humanizeKey(keyName)}</label>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void handleFile(e.dataTransfer.files?.[0]);
        }}
        onClick={() => inputRef.current?.click()}
        className={`relative rounded-lg border border-dashed px-3 py-3 text-sm cursor-pointer transition-colors flex items-center gap-3 ${
          dragOver ? 'border-white/50 bg-white/10' : 'border-white/15 bg-white/5 hover:border-white/30'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void handleFile(e.target.files?.[0])}
        />
        {value ? (
          <>
            <img src={value} alt="" className="w-10 h-10 rounded object-cover shrink-0 bg-black/40" />
            <span className="text-gray-300 truncate flex-1">Photo selected — click to replace</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="text-gray-500 hover:text-red-400 transition-colors shrink-0"
              aria-label="Remove photo"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <ImagePlus className="w-4 h-4 text-gray-500 shrink-0" />
            <span className="text-gray-500">Click or drag a photo here</span>
          </>
        )}
      </div>
      {imageError && <p className="text-xs text-red-400 mt-1">{imageError}</p>}
    </div>
  );
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
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [template, setTemplate] = useState<Template | null>(null);
  const [variableValues, setVariableValues] = useState<VariableValues>({});
  const [view, setView] = useState<View>('fields');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [renderUrl, setRenderUrl] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rerunId = searchParams.get('rerun');

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

  // Quick Re-run (from History): pull the exact field values used for a
  // past render and fire off a fresh render immediately — the whole
  // point is not making the user re-enter anything.
  useEffect(() => {
    if (!rerunId || !template) return;
    let isMounted = true;

    supabase
      .from('render_logs')
      .select('data')
      .eq('id', rerunId)
      .single()
      .then(({ data, error: fetchError }) => {
        if (!isMounted || fetchError || !data) return;
        const values = (data.data as VariableValues | null) ?? {};
        setVariableValues(values);
        void renderWithValues(values);
      });

    // Strip ?rerun= from the URL once consumed so refreshing/re-saving
    // doesn't keep re-triggering it.
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('rerun');
      return next;
    }, { replace: true });

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rerunId, template?.id]);

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
    setRenderUrl(null);
  };

  const renderWithValues = async (values: VariableValues) => {
    if (!id) return;
    const apiBase = import.meta.env.VITE_RENDER_API_URL;
    if (!apiBase || !profile?.api_key) {
      setError('Render API is not configured — no preview image was generated.');
      return;
    }

    setRendering(true);
    setError(null);
    const startedAt = performance.now();
    const visibility = trackVisibilityDuringRender();
    try {
      const res = await fetch(`${apiBase.replace(/\/$/, '')}/api/v1/render`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${profile.api_key}`,
        },
        body: JSON.stringify({ template_id: id, format: 'png', data: values }),
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) {
        throw new Error(payload.error || 'Render failed.');
      }
      setRenderUrl(payload.data.url as string);

      const durationMs = performance.now() - startedAt;
      if (shouldNotifyRenderComplete(durationMs, visibility)) {
        showToast('Image ready!', 'render-ready', { sound: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Render failed.');
    } finally {
      visibility.stop();
      setRendering(false);
    }
  };

  const handleSave = async () => {
    if (!template || !id) return;
    setSaving(true);
    setError(null);
    setRenderUrl(null);

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

    if (updateError) {
      setSaving(false);
      setError(updateError.message);
      return;
    }

    // Saving the template row doesn't produce an image on its own — render
    // one now with the current field values so there's something to
    // download/share immediately after hitting Save.
    await renderWithValues(variableValues);
    setSaving(false);
  };

  const downloadBlobUrl = (blobUrl: string) => {
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `${(template?.title || 'visora').replace(/\s+/g, '-').toLowerCase()}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleDownload = async () => {
    if (!renderUrl) return;
    try {
      const res = await fetch(renderUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      downloadBlobUrl(blobUrl);
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Cross-origin/CORS hiccup fallback — still gets the user their image.
      window.open(renderUrl, '_blank');
    }
  };

  const handleCopyLink = async () => {
    if (!renderUrl) return;
    await navigator.clipboard.writeText(renderUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
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
      <div className="p-4 sm:p-6 lg:p-8">
        <p className="text-gray-400 text-sm">Loading template…</p>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
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
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 sm:px-6 py-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            onClick={() => navigate('/dashboard/templates')}
            className="text-gray-400 hover:text-white transition-colors shrink-0"
            aria-label="Back to templates"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <input
            value={template.title}
            onChange={(e) => setTemplate({ ...template, title: e.target.value })}
            className="bg-transparent text-sm font-medium outline-none border-b border-transparent focus:border-white/30 truncate min-w-0 flex-1"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5 mr-0 sm:mr-2">
            {tabs.map(({ id: tabId, label, icon: Icon }) => (
              <button
                key={tabId}
                onClick={() => setView(tabId)}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  view === tabId ? 'bg-white text-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {error && <span className="text-xs text-red-400 hidden sm:inline">{error}</span>}
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
            className="flex items-center gap-2 bg-white text-black rounded-lg font-medium px-3 sm:px-4 py-2 text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{rendering ? 'Rendering…' : saving ? 'Saving…' : 'Save'}</span>
          </button>
        </div>
      </header>

      {renderUrl && (
        <div className="flex flex-wrap items-center gap-3 border-b border-white/10 bg-white/5 px-4 sm:px-6 py-2.5 text-xs shrink-0">
          <span className="text-gray-400">Saved — image is ready.</span>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 text-gray-200 hover:text-white transition-colors font-medium"
          >
            <Download className="w-3.5 h-3.5" />
            Download PNG
          </button>
          <span className="text-gray-700">·</span>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 text-gray-200 hover:text-white transition-colors font-medium"
          >
            <Link2 className="w-3.5 h-3.5" />
            {linkCopied ? 'Copied!' : 'Copy direct link'}
          </button>
        </div>
      )}

      <div className="flex-1 min-h-0">
        {view === 'fields' && (
          <div className="h-full flex flex-col lg:flex-row">
            {/* Left: the "sandbox" — plain-language fields, no JSON required. */}
            <div className="h-full overflow-y-auto p-6 space-y-5 lg:w-[420px] lg:shrink-0 lg:border-r lg:border-white/10">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Fill in the blanks — the preview updates as you type.
              </p>

              {variableKeys.length === 0 ? (
                <p className="text-sm text-gray-500">
                  This template has no <code className="text-gray-400">{'{{variables}}'}</code> yet. Switch to
                  the HTML tab to add some, e.g. <code className="text-gray-400">{'{{title}}'}</code>.
                </p>
              ) : (
                variableKeys.map((key) =>
                  isImageField(key) ? (
                    <ImageField
                      key={key}
                      keyName={key}
                      value={variableValues[key] ?? ''}
                      onChange={(value) => handleFieldChange(key, value)}
                    />
                  ) : (
                    <div key={key}>
                      <label className="block text-sm text-gray-300 mb-1.5">{humanizeKey(key)}</label>
                      <input
                        value={variableValues[key] ?? ''}
                        onChange={(e) => handleFieldChange(key, e.target.value)}
                        className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-white/30 transition-colors"
                        placeholder={key}
                      />
                    </div>
                  )
                )
              )}
            </div>

            {/* Right: live preview, always in sync with the fields — hidden
                on narrow screens where the Preview tab covers this instead. */}
            <div className="hidden lg:block flex-1 min-w-0 bg-[#0a0a0a]">
              <ScaledPreview html={previewHtml} width={template.width} height={template.height} />
            </div>
          </div>
        )}

        {view === 'html' && (
          <div className="h-full flex flex-col">
            <p className="text-xs uppercase tracking-wide text-gray-500 px-6 pt-4 pb-2">HTML template</p>
            <textarea
              value={template.html_body}
              onChange={(e) => {
                setTemplate({ ...template, html_body: e.target.value });
                setRenderUrl(null);
              }}
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
