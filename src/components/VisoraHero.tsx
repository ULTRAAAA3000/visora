import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Timer, ShieldCheck, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import SiteHeader from './landing/SiteHeader';

/**
 * Visora — Hero Landing
 *
 * Notes on deviations from the raw spec:
 * 1. Fixed the mobile menu icon className strings — the spec's JSX for the
 *    Menu/X toggle was garbled (stray backticks, misplaced ternary operators)
 *    and would not compile. Rebuilt with the same cross-fade/rotate intent.
 * 2. Swapped the placeholder copy. The spec's text (IMDB rating, "132 min",
 *    "Watch Now", nav links like "TV Series"/"Interviews") is streaming-service
 *    boilerplate that doesn't match Visora's actual product (an API for
 *    deterministic HTML-to-image rendering). Kept the exact visual system —
 *    liquid glass, blur mask, stagger timings, layout — and replaced only the
 *    words with ones a developer evaluating this tool would actually read.
 */

const VisoraHero: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useAuth();

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black text-white flex flex-col justify-between">
      {/* BACKGROUND VIDEO */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover z-0"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260406_094145_4a271a6c-3869-4f1c-8aa7-aeb0cb227994.mp4"
      />

      {/* BOTTOM BLUR OVERLAY */}
      <div
        className="fixed inset-0 z-[1] backdrop-blur-xl pointer-events-none"
        style={{
          WebkitMaskImage: 'linear-gradient(to top, black 0%, transparent 45%)',
          maskImage: 'linear-gradient(to top, black 0%, transparent 45%)',
        }}
      />

      <SiteHeader />

      {/* HERO CONTENT */}
      <main className="flex-1 flex flex-col justify-end px-4 sm:px-6 md:px-12 pb-8 md:pb-16 z-10 w-full">
        <div className="flex flex-col md:flex-row items-end gap-8 justify-between">
          <div className="flex-1 max-w-3xl">
            <div
              className="flex flex-wrap items-center gap-3 sm:gap-6 mb-6 md:mb-8 text-xs sm:text-sm animate-blur-fade-up"
              style={{ animationDelay: '300ms' }}
            >
              <div className="flex items-center gap-1.5 font-medium">
                <Timer className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                <span>&lt; 150ms renders</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-300">
                <ShieldCheck className="w-4 h-4" />
                <span>Pixel-exact, every time</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-300">
                <Zap className="w-4 h-4" />
                <span>One POST request</span>
              </div>
            </div>

            <h1
              className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-normal tracking-[-0.04em] mb-4 md:mb-6 leading-tight animate-blur-fade-up"
              style={{ animationDelay: '400ms' }}
            >
              Images your brand never gets wrong.
            </h1>

            <p
              className="text-base sm:text-lg md:text-xl text-gray-400 mb-6 md:mb-12 max-w-2xl animate-blur-fade-up"
              style={{ animationDelay: '500ms' }}
            >
              Turn HTML and Tailwind templates into OG images, product banners, and
              certificates — rendered by real Chromium, not a language model guessing at pixels.
            </p>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <button
                onClick={() => navigate(session ? '/dashboard' : '/signup')}
                className="bg-white text-black rounded-full font-medium px-6 sm:px-8 py-2.5 sm:py-3 flex items-center gap-2 hover:bg-gray-200 transition-colors animate-blur-fade-up cursor-pointer"
                style={{ animationDelay: '600ms' }}
              >
                <span>{session ? 'Go to dashboard' : 'Get your API key'}</span>
                <ArrowRight className="w-[18px] h-[18px]" />
              </button>
              <button
                onClick={() => navigate('/docs')}
                className="rounded-full font-medium liquid-glass px-6 sm:px-8 py-2.5 sm:py-3 hover:bg-white/10 transition-colors animate-blur-fade-up cursor-pointer"
                style={{ animationDelay: '700ms' }}
              >
                Read the docs
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-start md:justify-end">
            <button
              className="rounded-full liquid-glass px-4 sm:px-6 py-2.5 sm:py-3 hover:bg-white/10 transition-colors animate-blur-fade-up cursor-pointer flex items-center justify-center"
              style={{ animationDelay: '800ms' }}
              aria-label="Previous template"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              className="rounded-full liquid-glass px-4 sm:px-6 py-2.5 sm:py-3 hover:bg-white/10 transition-colors animate-blur-fade-up cursor-pointer flex items-center justify-center"
              style={{ animationDelay: '900ms' }}
              aria-label="Next template"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes blurFadeUp {
          from { opacity: 0; filter: blur(20px); transform: translateY(40px); }
          to { opacity: 1; filter: blur(0); transform: translateY(0); }
        }
        .animate-blur-fade-up {
          opacity: 0;
          animation: blurFadeUp 1s ease-out forwards;
        }
        .liquid-glass {
          background: rgba(255, 255, 255, 0.01);
          background-blend-mode: luminosity;
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          border: none;
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.1);
          position: relative;
          overflow: hidden;
        }
        .liquid-glass::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 1.4px;
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.45) 0%,
            rgba(255, 255, 255, 0.15) 20%,
            rgba(255, 255, 255, 0) 40%,
            rgba(255, 255, 255, 0) 60%,
            rgba(255, 255, 255, 0.15) 80%,
            rgba(255, 255, 255, 0.45) 100%
          );
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

export default VisoraHero;
