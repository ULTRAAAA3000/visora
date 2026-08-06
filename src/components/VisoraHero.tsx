import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  User,
  Menu,
  X,
  Zap,
  Timer,
  ShieldCheck,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

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

interface NavLink {
  name: string;
  delay: string;
}

const VisoraHero: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { session } = useAuth();

  const navLinks: NavLink[] = [
    { name: 'Templates', delay: '100ms' },
    { name: 'Docs', delay: '150ms' },
    { name: 'Pricing', delay: '200ms' },
    { name: 'Showcase', delay: '250ms' },
    { name: 'Changelog', delay: '300ms' },
  ];

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

      {/* NAVBAR */}
      <header className="relative z-50 flex items-center justify-between px-4 sm:px-6 md:px-12 py-4 md:py-6 w-full">
        {/* Left: VISORA Logo */}
        <div className="animate-blur-fade-up" style={{ animationDelay: '0ms' }}>
          <a href="#" className="block h-10 sm:h-12 md:h-14">
            <img src="/visora-logo.png" alt="Visora" className="h-full w-auto object-contain" />
          </a>
        </div>

        {/* Center: Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={`#${link.name.toLowerCase().replace(/\s+/g, '-')}`}
              className="text-sm text-white hover:text-gray-300 transition-colors animate-blur-fade-up"
              style={{ animationDelay: link.delay }}
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Right: Action Buttons */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <button
            className="hidden sm:flex items-center gap-2 px-4 md:px-6 py-2 rounded-full liquid-glass text-sm font-medium hover:bg-white/10 transition-all animate-blur-fade-up cursor-pointer"
            style={{ animationDelay: '350ms' }}
          >
            <Search className="w-[18px] h-[18px]" />
            <span>Search docs</span>
          </button>

          <button
            onClick={() => navigate(session ? '/dashboard' : '/login')}
            className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full liquid-glass hover:bg-white/10 transition-all animate-blur-fade-up cursor-pointer"
            style={{ animationDelay: '400ms' }}
            aria-label="Account"
          >
            <User className="w-[18px] h-[18px]" />
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-full liquid-glass transition-all animate-blur-fade-up relative cursor-pointer"
            style={{ animationDelay: '350ms' }}
            aria-label="Toggle Menu"
          >
            <div className="relative w-[18px] h-[18px] flex items-center justify-center">
              <Menu
                className={`absolute w-[18px] h-[18px] transition-all duration-500 ease-out ${
                  mobileMenuOpen ? 'opacity-0 scale-50 rotate-180' : 'opacity-100 scale-100 rotate-0'
                }`}
              />
              <X
                className={`absolute w-[18px] h-[18px] transition-all duration-500 ease-out ${
                  mobileMenuOpen ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 -rotate-180'
                }`}
              />
            </div>
          </button>
        </div>
      </header>

      {/* MOBILE MENU DROPDOWN */}
      <div
        className={`absolute top-[72px] left-0 w-full z-40 lg:hidden bg-gray-900/95 backdrop-blur-lg border-t border-b border-gray-800 shadow-2xl transition-all duration-500 ease-out ${
          mobileMenuOpen
            ? 'translate-y-0 opacity-100 pointer-events-auto'
            : '-translate-y-4 opacity-0 pointer-events-none'
        }`}
      >
        <div className="px-4 py-6 flex flex-col space-y-1">
          {navLinks.map((link, idx) => (
            <a
              key={link.name}
              href={`#${link.name.toLowerCase().replace(/\s+/g, '-')}`}
              className={`py-3 px-3 rounded-lg text-base font-medium text-white hover:bg-gray-800/50 transition-all transform ${
                mobileMenuOpen ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'
              }`}
              style={{ transitionDelay: `${mobileMenuOpen ? idx * 50 : 0}ms` }}
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.name}
            </a>
          ))}
          <div className="pt-4 mt-2 border-t border-gray-800 flex sm:hidden items-center justify-between gap-3">
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full liquid-glass text-sm font-medium">
              <Search className="w-[18px] h-[18px]" />
              <span>Search docs</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                navigate(session ? '/dashboard' : '/login');
              }}
              className="flex items-center justify-center w-10 h-10 rounded-full liquid-glass"
              aria-label="Account"
            >
              <User className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>
      </div>

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
                className="rounded-full font-medium liquid-glass px-6 sm:px-8 py-2.5 sm:py-3 hover:bg-white/10 transition-colors animate-blur-fade-up cursor-pointer"
                style={{ animationDelay: '700ms' }}
                title="Docs page isn't built yet"
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
