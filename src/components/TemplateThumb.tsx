import { useState } from 'react';
import { Crown, FileCode2 } from 'lucide-react';
import { templatePreviewUrl } from '../lib/templatePreview';

interface TemplateThumbProps {
  id: string;
  title: string;
  fallbackTier?: 'free' | 'pro' | 'agency';
}

/**
 * Preset thumbnail with a graceful fallback icon. The <img> points at
 * the render Worker's stable /preview/:id.png route (see
 * lib/templatePreview.ts) instead of a stored URL, so it can't go
 * stale — but network hiccups or a since-deleted preset still happen,
 * so `onError` swaps to the same icon used when no URL is configured
 * at all rather than showing a broken-image glyph.
 */
export default function TemplateThumb({ id, title, fallbackTier }: TemplateThumbProps) {
  const url = templatePreviewUrl(id);
  const [failed, setFailed] = useState(false);

  if (!url || failed) {
    return fallbackTier === 'agency' ? (
      <Crown className="w-6 h-6 text-amber-400/60" />
    ) : (
      <FileCode2 className="w-6 h-6 text-gray-600" />
    );
  }

  return (
    <img
      src={url}
      alt={title}
      loading="lazy"
      className="w-full h-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}
