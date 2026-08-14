import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, useScroll, useSpring } from 'framer-motion';
import { Search, User, Menu, X } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import SearchModal from '../SearchModal';

interface NavItem {
  name: string;
  href: string;
  kind: 'route' | 'hash';
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Templates', href: '/templates', kind: 'route' },
  { name: 'Docs', href: '/docs', kind: 'route' },
  { name: 'Guide', href: '/guide', kind: 'route' },
  { name: 'Pricing', href: '/#pricing', kind: 'hash' },
  { name: 'Showcase', href: '/#showcase', kind: 'hash' },
  { name: 'About', href: '/about', kind: 'route' },
  { name: 'Changelog', href: '/changelog', kind: 'route' },
];

/**
 * Fixed, scroll-aware site header shared by the landing page and every
 * standalone marketing page (Docs, Templates, Changelog). Transparent
 * over dark hero backgrounds, gains a blurred panel once scrolled.
 *
 * Pricing/Showcase are sections on the landing page, not routes — their
 * links go to `/#id` so they work from any page (Landing.tsx scrolls to
 * the hash on mount) instead of only working while already on "/".
 */
export default function SiteHeader({ transparentAtTop = true }: { transparentAtTop?: boolean }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(!transparentAtTop);
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();

  const { scrollYProgress } = useScroll();
  const progressScaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30, restDelta: 0.001 });

  const isActive = (item: NavItem) => item.kind === 'route' && location.pathname === item.href;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!transparentAtTop) return;
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [transparentAtTop]);

  const renderNavLink = (item: NavItem, extraClassName: string, onClick?: () => void, withUnderline = false) => {
    const active = isActive(item);
    const content = (
      <>
        {active && withUnderline && (
          <motion.span
            layoutId="nav-active-pill"
            className="absolute -inset-x-3 -inset-y-2 rounded-full bg-white/[0.08] border border-white/10 -z-10"
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          />
        )}
        {active && !withUnderline && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-1 h-1 rounded-full bg-white" />
        )}
        <span className="relative">{item.name}</span>
        {withUnderline && !active && (
          <span className="absolute left-0 -bottom-1.5 h-px w-0 bg-white transition-all duration-300 ease-out group-hover:w-full" />
        )}
      </>
    );

    if (item.kind === 'route') {
      return (
        <Link key={item.name} to={item.href} className={extraClassName} onClick={onClick}>
          {content}
        </Link>
      );
    }
    return (
      <a key={item.name} href={item.href} className={extraClassName} onClick={onClick}>
        {content}
      </a>
    );
  };

  return (
    <>
      <motion.div
        className="fixed top-0 inset-x-0 h-[2px] bg-gradient-to-r from-white/0 via-white to-white/0 origin-left z-[60] pointer-events-none"
        style={{ scaleX: progressScaleX }}
      />

      <motion.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        className={`fixed top-0 inset-x-0 z-50 flex items-center justify-between px-4 sm:px-6 md:px-12 py-4 md:py-6 w-full transition-all duration-500 ${
          scrolled ? 'bg-black/70 backdrop-blur-xl border-b border-white/10' : 'bg-transparent border-b border-transparent'
        }`}
      >
        <Link to="/" className="group block h-10 sm:h-12 md:h-14 relative transition-transform duration-300 hover:scale-105">
          <img src="/visora-logo.png" alt="Visora" className="h-full w-auto object-contain relative z-10" />
          <span className="absolute inset-0 rounded-full bg-white/0 group-hover:bg-white/10 blur-xl transition-all duration-500 -z-10 scale-150" />
        </Link>

        <nav className="hidden lg:flex items-center space-x-8">
          {NAV_ITEMS.map((item) =>
            renderNavLink(item, 'group relative text-sm text-white hover:text-gray-300 transition-colors', undefined, true)
          )}
        </nav>

        <div className="flex items-center space-x-3 sm:space-x-4">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setSearchOpen(true)}
            className="hidden sm:flex items-center gap-2 px-4 md:px-6 py-2 rounded-full liquid-glass text-sm font-medium hover:bg-white/10 transition-all cursor-pointer"
          >
            <Search className="w-[18px] h-[18px]" />
            <span>Search docs</span>
            <span className="hidden md:inline text-[10px] text-white/30 border border-white/15 rounded px-1.5 py-0.5 ml-1">
              ⌘K
            </span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(session ? '/dashboard' : '/login')}
            className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full liquid-glass hover:bg-white/10 transition-all cursor-pointer"
            aria-label="Account"
          >
            <User className="w-[18px] h-[18px]" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-full liquid-glass transition-all relative cursor-pointer"
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
          </motion.button>
        </div>
      </motion.header>

      {/* MOBILE MENU DROPDOWN */}
      <div
        className={`fixed top-[72px] left-0 w-full z-40 lg:hidden bg-gray-900/95 backdrop-blur-lg border-t border-b border-gray-800 shadow-2xl transition-all duration-500 ease-out ${
          mobileMenuOpen
            ? 'translate-y-0 opacity-100 pointer-events-auto'
            : '-translate-y-4 opacity-0 pointer-events-none'
        }`}
      >
        <div className="px-4 py-6 flex flex-col space-y-1">
          {NAV_ITEMS.map((item) =>
            renderNavLink(
              item,
              `relative py-3 px-3 rounded-lg text-base font-medium text-white hover:bg-gray-800/50 transition-all transform ${
                mobileMenuOpen ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'
              }`,
              () => setMobileMenuOpen(false)
            )
          )}
          <div className="pt-4 mt-2 border-t border-gray-800 flex sm:hidden items-center justify-between gap-3">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setSearchOpen(true);
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full liquid-glass text-sm font-medium"
            >
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

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
