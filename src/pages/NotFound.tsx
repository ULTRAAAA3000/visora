import { Link } from 'react-router-dom';
import '@fontsource/geist-mono/600.css';

/**
 * Full-viewport 404 — intentionally minimal (no header nav, no buttons
 * beyond the logo itself linking home) per the composition spec: video
 * background with zero overlay, a centered logo, and a 404/divider/
 * message stack, nothing else.
 *
 * Responsive values (font sizes, letter-spacing, content width, gap)
 * are plain Tailwind utilities rather than CSS clamp() — the spec's
 * mobile/desktop numbers aren't a smooth interpolation, they're two
 * fixed breakpoints, which is exactly what unprefixed-vs-`sm:` already
 * models (Tailwind's sm breakpoint is 640px, matching the spec's cutoff).
 *
 * The background video is the same CloudFront asset VisoraHero.tsx uses
 * (same account, just a different generated clip) — reusing an asset
 * that's actually ours rather than pointing at an arbitrary external
 * URL of unknown provenance.
 *
 * Geist Mono is self-hosted via @fontsource rather than pointed at
 * Figma's static-asset URL from the original spec — that endpoint is a
 * Figma export artifact, not a public CDN meant for production use.
 */
export default function NotFound() {
  return (
    <main className="relative w-screen overflow-x-hidden bg-black text-white" style={{ minHeight: '100svh' }}>
      <video
        autoPlay
        loop
        muted
        playsInline
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260406_094145_4a271a6c-3869-4f1c-8aa7-aeb0cb227994.mp4"
      />

      <Link
        to="/"
        aria-label="Visora"
        className="absolute left-1/2 -translate-x-1/2 z-10 top-8 sm:top-20 h-[30px] sm:h-10 transition-opacity hover:opacity-80"
      >
        <img src="/visora-logo.png" alt="Visora" className="h-full w-auto object-contain" />
      </Link>

      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center text-center gap-7 sm:gap-11 w-[min(100%-40px,360px)] sm:w-[min(100%-40px,483px)]"
      >
        <h1
          className="bg-clip-text text-transparent font-semibold leading-[1.1] text-[clamp(140px,52vw,200px)] sm:text-[295.75px] tracking-[-0.09em] sm:tracking-[-24.65px] pb-[0.08em]"
          style={{
            fontFamily: "'Geist Mono', monospace",
            backgroundImage:
              'linear-gradient(247.33deg, rgb(255,255,255) 2.5334%, rgba(255,255,255,0.4) 93.612%)',
            WebkitBackgroundClip: 'text',
          }}
        >
          404
        </h1>

        <div className="w-full sm:w-[425px] h-px bg-white" />

        <p
          className="text-white font-semibold leading-[1.1] text-[clamp(16px,4.5vw,20px)] sm:text-[24px] tracking-[-1.3px] sm:tracking-[-2px]"
          style={{ fontFamily: "'Geist Mono', monospace" }}
        >
          The render may be broken, but the pipeline isn't. Let's get you back.
        </p>
      </div>
    </main>
  );
}
