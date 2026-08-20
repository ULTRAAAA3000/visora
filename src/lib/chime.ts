/**
 * A soft, pleasant notification chime — synthesized with the Web Audio
 * API rather than shipping an audio file, so there's no asset to load
 * or fail to load. Two short sine-wave tones (a rising fifth, like the
 * "pop" Slack/Linear use) with a quick attack and gentle decay.
 *
 * Deliberately quiet by default (see GAIN below) — this should read as
 * a subtle confirmation, not an alert.
 */

let sharedContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!sharedContext) sharedContext = new Ctor();
  return sharedContext;
}

function playTone(ctx: AudioContext, startTime: number, frequency: number, duration: number, gain: number) {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, startTime);

  // Quick attack, smooth exponential decay — avoids the click/pop of a
  // hard gain cutoff at the end of the tone.
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.008);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

/** Plays the "your thing finished" chime. Safe to call even if the
 * browser blocks autoplay-adjacent audio — it just silently no-ops. */
export function playReadyChime() {
  try {
    const ctx = getContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    // A perfect fifth (C6 -> G6), quick and quiet.
    playTone(ctx, now, 1046.5, 0.22, 0.05);
    playTone(ctx, now + 0.09, 1568.0, 0.28, 0.045);
  } catch {
    // Audio is a nice-to-have; never let it break the app.
  }
}
