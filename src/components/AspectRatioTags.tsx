import { Loader2 } from 'lucide-react';
import { ASPECT_RATIO_PRESETS, type AspectPreset } from '../lib/aspectRatioPresets';

interface AspectRatioTagsProps {
  currentWidth: number;
  currentHeight: number;
  applyingId: string | null;
  disabled?: boolean;
  onSelect: (preset: AspectPreset) => void;
}

/**
 * "Amazon (1:1)", "Etsy (4:3)", etc — one click resizes and re-renders
 * the template at that marketplace's standard dimensions. No pixel
 * entry: the mapping from platform to width/height lives in
 * lib/aspectRatioPresets.ts.
 */
export default function AspectRatioTags({
  currentWidth,
  currentHeight,
  applyingId,
  disabled,
  onSelect,
}: AspectRatioTagsProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {ASPECT_RATIO_PRESETS.map((preset) => {
        const isActive = currentWidth === preset.width && currentHeight === preset.height;
        const isApplying = applyingId === preset.id;
        return (
          <button
            key={preset.id}
            type="button"
            onClick={() => onSelect(preset)}
            disabled={disabled || isApplying}
            title={`Render at ${preset.width}×${preset.height}`}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isActive
                ? 'bg-white text-black border-white'
                : 'bg-white/5 text-gray-300 border-white/10 hover:border-white/30 hover:text-white'
            }`}
          >
            {isApplying && <Loader2 className="w-3 h-3 animate-spin" />}
            {preset.platform} ({preset.ratioLabel})
          </button>
        );
      })}
    </div>
  );
}
