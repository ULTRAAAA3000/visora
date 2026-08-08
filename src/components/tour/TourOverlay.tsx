import { useEffect, useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { useTour } from '../../lib/tour/TourContext';

const PAD = 10;
const TOOLTIP_WIDTH = 320;

interface Position {
  top: number;
  left: number;
  width: number;
  height: number;
}

export default function TourOverlay() {
  const { running, step, stepIndex, totalSteps, next, skip } = useTour();
  const [rect, setRect] = useState<Position | null>(null);
  const [searching, setSearching] = useState(false);

  // Locate the current step's target element. Right after a route change
  // the element may not have painted yet, so poll briefly instead of
  // giving up on the first miss.
  useEffect(() => {
    if (!running || !step) {
      setRect(null);
      return;
    }
    if (!step.target) {
      setRect(null);
      return;
    }

    let cancelled = false;
    setSearching(true);

    const measure = () => {
      const el = document.querySelector(step.target!);
      if (!el) return false;
      const r = el.getBoundingClientRect();
      if (!cancelled) {
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
        setSearching(false);
      }
      return true;
    };

    if (measure()) return;

    let attempts = 0;
    const interval = setInterval(() => {
      attempts += 1;
      if (measure() || attempts > 40) {
        clearInterval(interval);
        if (attempts > 40 && !cancelled) setSearching(false);
      }
    }, 50);

    const onResize = () => measure();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);

    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [running, step]);

  if (!running || !step) return null;

  const isCentered = !step.target;
  const tooltipStyle = isCentered
    ? { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
    : rect
      ? computeTooltipStyle(rect, step.placement ?? 'bottom')
      : null;

  return (
    <div className="fixed inset-0 z-[9997]">
      {/* Dim backdrop — blocks background interaction so the tour stays linear */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Spotlight ring around the target */}
      {rect && (
        <div
          className="fixed z-[9998] rounded-xl pointer-events-none transition-all duration-300 ease-out"
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.75), 0 0 0 2px rgba(255,255,255,0.85)',
          }}
        >
          <span className="absolute -top-2 -left-2 w-4 h-4 rounded-full bg-white animate-ping opacity-75" />
          <span className="absolute -top-2 -left-2 w-4 h-4 rounded-full bg-white" />
        </div>
      )}

      {/* Callout */}
      {(isCentered || tooltipStyle) && (
        <div
          className="fixed z-[9999] liquid-glass bg-black/95 border border-white/15 rounded-2xl p-5 shadow-2xl animate-blur-fade-up"
          style={{ ...(tooltipStyle as React.CSSProperties), width: TOOLTIP_WIDTH, animationDuration: '300ms' }}
        >
          <button
            onClick={skip}
            className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors"
            aria-label="Skip tour"
          >
            <X className="w-4 h-4" />
          </button>

          <p className="text-[11px] uppercase tracking-widest text-gray-500 mb-2">
            Step {stepIndex + 1} of {totalSteps}
          </p>
          <h3 className="text-white font-semibold mb-2 pr-6">{step.title}</h3>
          <p className="text-sm text-gray-300 leading-relaxed mb-4">{step.body}</p>

          <div className="flex items-center justify-between">
            <button onClick={skip} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
              Skip tour
            </button>
            <button
              onClick={next}
              className="flex items-center gap-1.5 bg-white text-black rounded-full font-medium px-4 py-2 text-sm hover:bg-gray-200 transition-colors cursor-pointer"
            >
              {stepIndex + 1 === totalSteps ? 'Finish' : 'Next'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Waiting for the target to appear after a route change */}
      {!isCentered && !rect && searching && (
        <div
          className="fixed z-[9999] liquid-glass bg-black/95 border border-white/15 rounded-2xl p-5 shadow-2xl"
          style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: TOOLTIP_WIDTH }}
        >
          <p className="text-sm text-gray-400">Loading next step…</p>
        </div>
      )}
    </div>
  );
}

function computeTooltipStyle(rect: Position, placement: 'top' | 'bottom' | 'left' | 'right'): React.CSSProperties {
  const gap = 16;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let top = rect.top;
  let left = rect.left;

  switch (placement) {
    case 'bottom':
      top = rect.top + rect.height + gap;
      left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
      break;
    case 'top':
      top = rect.top - gap;
      left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
      break;
    case 'left':
      top = rect.top + rect.height / 2;
      left = rect.left - gap - TOOLTIP_WIDTH;
      break;
    case 'right':
      top = rect.top + rect.height / 2;
      left = rect.left + rect.width + gap;
      break;
  }

  // Clamp within viewport with a small margin
  left = Math.max(16, Math.min(left, vw - TOOLTIP_WIDTH - 16));
  top = Math.max(16, Math.min(top, vh - 200));

  const transform = placement === 'top' ? 'translateY(-100%)' : undefined;

  return { top, left, transform };
}
