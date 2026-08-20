import { useEffect, useMemo, useRef, useState } from 'react';
import Papa from 'papaparse';
import {
  UploadCloud,
  FileSpreadsheet,
  Play,
  Download,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';
import { extractVariableKeys, humanizeKey } from '../../lib/template';
import { useToast } from '../../components/ToastProvider';
import { trackVisibilityDuringRender, shouldNotifyRenderComplete } from '../../lib/renderNotify';
import type { Template } from '../../lib/database.types';

type RowStatus = 'pending' | 'rendering' | 'done' | 'error';

interface BulkRow {
  index: number;
  values: Record<string, string>;
  status: RowStatus;
  imageUrl?: string;
  error?: string;
}

const MAX_ROWS = 500;
const CONCURRENCY = 4;

/** Parses a CSV or Excel file into an array of plain string-keyed row objects. */
async function parseSpreadsheet(file: File): Promise<Record<string, string>[]> {
  const isCsv = file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv';

  if (isCsv) {
    const text = await file.text();
    const result = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
    return result.data;
  }

  // Lazy-loaded: xlsx is a large dependency, and most users will either
  // use CSV or never touch Bulk generation at all — no reason to ship it
  // in the main bundle.
  const XLSX = await import('xlsx');
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '', raw: false });
}

function rowLabel(row: BulkRow, mapping: Record<string, string>, variableKeys: string[]): string {
  const firstKey = variableKeys[0];
  const column = firstKey ? mapping[firstKey] : undefined;
  const value = column ? row.values[column] : undefined;
  return value?.trim() || `Row ${row.index + 1}`;
}

export default function Bulk() {
  const { profile } = useAuth();
  const { showToast } = useToast();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  const [fileName, setFileName] = useState<string | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [parseError, setParseError] = useState<string | null>(null);

  const [rows, setRows] = useState<BulkRow[]>([]);
  const [running, setRunning] = useState(false);
  const cancelRef = useRef(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!profile) return;
    let isMounted = true;
    supabase
      .from('templates')
      .select('*')
      .or(`user_id.eq.${profile.id},is_preset.eq.true`)
      .order('is_preset', { ascending: false })
      .order('title', { ascending: true })
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (!error) setTemplates(data ?? []);
        setTemplatesLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [profile?.id]);

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId) ?? null,
    [templates, selectedTemplateId]
  );

  const variableKeys = useMemo(
    () => (selectedTemplate ? extractVariableKeys(selectedTemplate.html_body) : []),
    [selectedTemplate?.html_body]
  );

  const allMapped = variableKeys.length > 0 && variableKeys.every((key) => mapping[key]);
  const doneCount = rows.filter((r) => r.status === 'done').length;
  const errorCount = rows.filter((r) => r.status === 'error').length;

  const resetSpreadsheet = () => {
    setFileName(null);
    setColumns([]);
    setParsedRows([]);
    setMapping({});
    setParseError(null);
    setRows([]);
  };

  const handleTemplateChange = (id: string) => {
    setSelectedTemplateId(id);
    resetSpreadsheet();
  };

  const handleFile = async (file: File) => {
    setParseError(null);
    setRows([]);
    try {
      const data = await parseSpreadsheet(file);
      if (data.length === 0) {
        setParseError('No rows found in that file.');
        return;
      }
      if (data.length > MAX_ROWS) {
        setParseError(`That file has ${data.length} rows — bulk generation supports up to ${MAX_ROWS} at a time.`);
        return;
      }

      const cols = Object.keys(data[0]);
      setFileName(file.name);
      setColumns(cols);
      setParsedRows(data);

      // Auto-map columns whose header matches a variable key (case-insensitive).
      const autoMapping: Record<string, string> = {};
      for (const key of variableKeys) {
        const match = cols.find((c) => c.trim().toLowerCase() === key.toLowerCase());
        if (match) autoMapping[key] = match;
      }
      setMapping(autoMapping);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Could not read that file.');
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleGenerate = async () => {
    if (!selectedTemplate || !profile || !allMapped) return;

    const apiBase = import.meta.env.VITE_RENDER_API_URL;
    if (!apiBase) {
      setParseError('Render API isn\u2019t configured yet — VITE_RENDER_API_URL is missing.');
      return;
    }

    const initialRows: BulkRow[] = parsedRows.map((raw, index) => {
      const values: Record<string, string> = {};
      for (const key of variableKeys) {
        values[key] = raw[mapping[key]] ?? '';
      }
      return { index, values, status: 'pending' };
    });

    setRows(initialRows);
    setRunning(true);
    cancelRef.current = false;

    const startedAt = performance.now();
    const visibility = trackVisibilityDuringRender();

    const queue = [...initialRows];
    const results = [...initialRows];

    const worker = async () => {
      while (queue.length > 0) {
        if (cancelRef.current) return;
        const row = queue.shift();
        if (!row) return;

        results[row.index] = { ...row, status: 'rendering' };
        setRows([...results]);

        try {
          const res = await fetch(`${apiBase.replace(/\/$/, '')}/api/v1/render`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${profile.api_key}`,
            },
            body: JSON.stringify({ template_id: selectedTemplate.id, data: row.values }),
          });
          const json = await res.json();

          if (!res.ok || !json.success) {
            results[row.index] = { ...row, status: 'error', error: json.error || `HTTP ${res.status}` };
          } else {
            results[row.index] = { ...row, status: 'done', imageUrl: json.data.url };
          }
        } catch (err) {
          results[row.index] = {
            ...row,
            status: 'error',
            error: err instanceof Error ? err.message : 'Network error',
          };
        }

        setRows([...results]);
      }
    };

    await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
    setRunning(false);

    visibility.stop();
    if (!cancelRef.current) {
      const durationMs = performance.now() - startedAt;
      const doneCount = results.filter((r) => r.status === 'done').length;
      if (doneCount > 0 && shouldNotifyRenderComplete(durationMs, visibility)) {
        showToast(
          doneCount === 1 ? 'Image ready!' : `${doneCount} images ready!`,
          'render-ready',
          { sound: true }
        );
      }
    }
  };

  const handleCancel = () => {
    cancelRef.current = true;
    setRunning(false);
  };

  const handleDownloadZip = async () => {
    const completed = rows.filter((r) => r.status === 'done' && r.imageUrl);
    if (completed.length === 0) return;

    const { default: JSZip } = await import('jszip');
    const zip = new JSZip();
    await Promise.all(
      completed.map(async (row) => {
        try {
          const res = await fetch(row.imageUrl!);
          const blob = await res.blob();
          const ext = row.imageUrl!.split('.').pop()?.split('?')[0] || 'png';
          const label = rowLabel(row, mapping, variableKeys).replace(/[^\w-]+/g, '_').slice(0, 40);
          zip.file(`${row.index + 1}_${label}.${ext}`, blob);
        } catch {
          // Skip files that fail to fetch — the rest of the zip still succeeds.
        }
      })
    );

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visora-bulk-${selectedTemplate?.title.replace(/[^\w-]+/g, '_') ?? 'export'}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadOne = (row: BulkRow) => {
    if (!row.imageUrl) return;
    const a = document.createElement('a');
    a.href = row.imageUrl;
    a.download = `${row.index + 1}_${rowLabel(row, mapping, variableKeys).replace(/[^\w-]+/g, '_')}.png`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.click();
  };

  if (templatesLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <p className="text-gray-400 text-sm">Loading templates…</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
      <h1 className="text-2xl font-medium mb-1">Bulk generation</h1>
      <p className="text-gray-400 text-sm mb-8">
        Upload a spreadsheet, map its columns to a template's fields, and generate every row at once.
      </p>

      {/* Step 1 — template */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 mb-6">
        <h2 className="text-sm font-medium text-gray-300 mb-3">1. Choose a template</h2>
        <select
          value={selectedTemplateId}
          onChange={(e) => handleTemplateChange(e.target.value)}
          className="w-full sm:w-96 bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-white/30"
        >
          <option value="">Select a template…</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title} ({t.width}×{t.height})
            </option>
          ))}
        </select>

        {selectedTemplate && variableKeys.length === 0 && (
          <p className="text-xs text-amber-400/80 mt-3">
            This template has no <code>{'{{variables}}'}</code> — add some in the template editor before using
            it for bulk generation.
          </p>
        )}
      </section>

      {/* Step 2 — upload */}
      {selectedTemplate && variableKeys.length > 0 && (
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 mb-6">
          <h2 className="text-sm font-medium text-gray-300 mb-3">2. Upload your data</h2>

          {!fileName ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="rounded-xl border border-dashed border-white/15 p-10 text-center cursor-pointer hover:bg-white/[0.03] transition-colors"
            >
              <UploadCloud className="w-7 h-7 text-gray-500 mx-auto mb-3" />
              <p className="text-sm text-gray-300 mb-1">Drop a CSV or Excel file, or click to browse</p>
              <p className="text-xs text-gray-500">Up to {MAX_ROWS} rows · .csv, .xlsx, .xls</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-lg bg-black/40 border border-white/10 px-4 py-3">
              <div className="flex items-center gap-2 min-w-0">
                <FileSpreadsheet className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-sm truncate">{fileName}</span>
                <span className="text-xs text-gray-500 shrink-0">· {parsedRows.length} rows</span>
              </div>
              <button
                onClick={resetSpreadsheet}
                className="text-gray-400 hover:text-white transition-colors shrink-0"
                aria-label="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {parseError && (
            <p className="text-sm text-red-400 mt-3 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {parseError}
            </p>
          )}
        </section>
      )}

      {/* Step 3 — map columns */}
      {fileName && columns.length > 0 && (
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 mb-6">
          <h2 className="text-sm font-medium text-gray-300 mb-1">3. Map columns to fields</h2>
          <p className="text-xs text-gray-500 mb-4">
            We matched columns with the same name automatically — adjust anything that's off.
          </p>

          <div className="space-y-3 max-w-xl">
            {variableKeys.map((key) => (
              <div key={key} className="flex items-center gap-3">
                <label className="w-40 shrink-0 text-sm text-gray-300">{humanizeKey(key)}</label>
                <select
                  value={mapping[key] ?? ''}
                  onChange={(e) => setMapping((prev) => ({ ...prev, [key]: e.target.value }))}
                  className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-white/30"
                >
                  <option value="">Don't map (leave blank)</option>
                  {columns.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Step 4 — generate */}
      {fileName && allMapped && (
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-sm font-medium text-gray-300">4. Generate</h2>

            <div className="flex items-center gap-2">
              {running ? (
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </button>
              ) : (
                <button
                  onClick={handleGenerate}
                  disabled={parsedRows.length === 0}
                  className="flex items-center gap-2 bg-white text-black rounded-lg font-medium px-4 py-2 text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {rows.length > 0 ? <RefreshCw className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {rows.length > 0 ? 'Regenerate all' : `Generate ${parsedRows.length} images`}
                </button>
              )}

              {doneCount > 0 && (
                <button
                  onClick={handleDownloadZip}
                  className="flex items-center gap-2 liquid-glass rounded-lg font-medium px-4 py-2 text-sm hover:bg-white/10 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download all ({doneCount})
                </button>
              )}
            </div>
          </div>

          {profile && parsedRows.length > profile.monthly_quota - profile.usage_this_month && (
            <p className="text-xs text-amber-400/80 mt-3">
              This batch of {parsedRows.length} may exceed your remaining monthly quota (
              {Math.max(0, profile.monthly_quota - profile.usage_this_month)} renders left). Cached rows won't
              count against it, but new ones will.
            </p>
          )}

          {rows.length > 0 && (
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span>
                  {doneCount} done{errorCount > 0 ? `, ${errorCount} failed` : ''} of {rows.length}
                </span>
                {running && (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Rendering…
                  </span>
                )}
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all"
                  style={{ width: `${((doneCount + errorCount) / rows.length) * 100}%` }}
                />
              </div>
            </div>
          )}
        </section>
      )}

      {/* Results grid */}
      {rows.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-gray-300 mb-4">Results</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {rows.map((row) => (
              <div
                key={row.index}
                className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden"
              >
                <div className="aspect-video bg-black/40 flex items-center justify-center relative">
                  {row.status === 'done' && row.imageUrl && (
                    <img src={row.imageUrl} alt={rowLabel(row, mapping, variableKeys)} className="w-full h-full object-cover" />
                  )}
                  {row.status === 'pending' && <span className="text-xs text-gray-600">Waiting…</span>}
                  {row.status === 'rendering' && <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />}
                  {row.status === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
                </div>
                <div className="p-3">
                  <p className="text-xs text-gray-300 truncate mb-1">{rowLabel(row, mapping, variableKeys)}</p>
                  {row.status === 'done' && (
                    <button
                      onClick={() => handleDownloadOne(row)}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      Download
                    </button>
                  )}
                  {row.status === 'error' && (
                    <p className="text-[11px] text-red-400/80 truncate" title={row.error}>
                      {row.error || 'Failed'}
                    </p>
                  )}
                  {row.status === 'done' && (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400/70 mt-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Ready
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
