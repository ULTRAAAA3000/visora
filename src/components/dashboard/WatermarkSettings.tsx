import { useRef, useState } from 'react';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Upload-once, applies-forever logo watermark. The uploaded file is
 * composited by the render Worker into the bottom-right corner of
 * every future render (see worker/src/lib/render.ts withWatermark) —
 * nothing here touches individual templates or renders, it's purely
 * account-level state (profiles.watermark_logo_key / watermark_enabled).
 */
export default function WatermarkSettings() {
  const { profile, refreshProfile } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!profile) return null;

  const apiBase = import.meta.env.VITE_RENDER_API_URL;
  const hasLogo = Boolean(profile.watermark_logo_key);
  const logoUrl = hasLogo && apiBase ? `${apiBase.replace(/\/$/, '')}/watermark-logo/${profile.id}` : null;

  const callWatermarkApi = async (method: 'POST' | 'PATCH' | 'DELETE', body?: unknown) => {
    if (!apiBase) {
      setError('Render API is not configured.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase.replace(/\/$/, '')}/api/v1/watermark`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${profile.api_key}`,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok || !payload?.success) {
        throw new Error(payload?.error || 'Request failed.');
      }
      await refreshProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Please choose a PNG, JPEG, or WEBP image.');
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setError('Logo is too large — 2MB max.');
      return;
    }
    const dataUrl = await readFileAsDataUrl(file);
    await callWatermarkApi('POST', { image: dataUrl });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 mt-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-medium text-gray-300">Smart Watermark</h2>
        {hasLogo && (
          <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer select-none">
            <span>{profile.watermark_enabled ? 'On' : 'Off'}</span>
            <button
              type="button"
              role="switch"
              aria-checked={profile.watermark_enabled}
              disabled={busy}
              onClick={() => callWatermarkApi('PATCH', { enabled: !profile.watermark_enabled })}
              className={`relative w-9 h-5 rounded-full transition-colors disabled:opacity-50 ${
                profile.watermark_enabled ? 'bg-white' : 'bg-white/15'
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-black transition-transform ${
                  profile.watermark_enabled ? 'translate-x-[18px]' : 'translate-x-0.5'
                }`}
              />
            </button>
          </label>
        )}
      </div>

      <p className="text-xs text-gray-500 mb-4">
        Upload your logo once — Visora automatically overlays it, semi-transparent, in the corner of every render.
      </p>

      {hasLogo && logoUrl ? (
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
            <img src={logoUrl} alt="Your watermark logo" className="max-w-full max-h-full object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400">
              Applied to the bottom-right corner of every render{profile.watermark_enabled ? '.' : ' — currently off.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => callWatermarkApi('DELETE')}
            disabled={busy}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50 shrink-0"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
            Remove
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`flex items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-6 text-sm cursor-pointer transition-colors ${
            dragOver ? 'border-white/40 bg-white/5' : 'border-white/15 hover:border-white/30'
          }`}
        >
          {busy ? (
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          ) : (
            <ImagePlus className="w-4 h-4 text-gray-500" />
          )}
          <span className="text-gray-400">{busy ? 'Uploading…' : 'Click or drag your logo here (PNG/JPEG/WEBP, 2MB max)'}</span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
    </section>
  );
}
