/**
 * Decides whether a finished render is worth a toast + chime, versus
 * one that resolved fast enough while the user was watching that a
 * notification would just be noise.
 *
 * Two triggers, either one is enough:
 *  - it took a while (LONG_RENDER_MS or more)
 *  - the tab was backgrounded at any point during the request — the
 *    whole point of notifying is pulling the user's attention back.
 */
export const LONG_RENDER_MS = 2500;

export interface VisibilityTracker {
  /** True if the tab was hidden at any point since tracking started. */
  wasHidden: () => boolean;
  stop: () => void;
}

export function trackVisibilityDuringRender(): VisibilityTracker {
  let hidden = typeof document !== 'undefined' && document.hidden;

  const handler = () => {
    if (document.hidden) hidden = true;
  };

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handler);
  }

  return {
    wasHidden: () => hidden,
    stop: () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handler);
      }
    },
  };
}

export function shouldNotifyRenderComplete(durationMs: number, visibility: VisibilityTracker): boolean {
  return durationMs >= LONG_RENDER_MS || visibility.wasHidden();
}
