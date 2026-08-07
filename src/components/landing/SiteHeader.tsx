import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, Menu, X } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';

interface NavItem {
  name: string;
  href: string;
  kind: 'route' | 'hash';
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Templates', href: '/templates', kind: 'route' },
  { name: 'Docs', href: '/docs', kind: 'route' },
  { name: 'Pricing', href: '/#pricing', kind: 'hash' },
  { name: 'Showcase', href: '/#showcase', kind: 'hash' },
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
  const [scrolled, setScrolled] = useState(!transparentAtTop);
  const navigate = useNavigate();
  const { session } = useAuth();

  useEffect(() => {
    if (!transparentAtTop) return;
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [transparentAtTop]);

  const renderNavLink = (item: NavItem, extraClassName: string, onClick?: () => void, withUnderline = false) => {
    const content = (
      <>
        {item.name}
        {withUnderline && (
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
      <header
        className={`fixed top-0 inset-x-0 z-50 flex items-center justify-between px-4 sm:px-6 md:px-12 py-4 md:py-6 w-full transition-all duration-500 ${
          scrolled ? 'bg-black/70 backdrop-blur-xl border-b border-white/10' : 'bg-transparent border-b border-transparent'
        }`}
      >
        <Link to="/" className="block h-10 sm:h-12 md:h-14 transition-transform duration-300 hover:scale-105">
          <img src="/visora-logo.png" alt="Visora" className="h-full w-auto object-contain" />
        </Link>

        <nav className="hidden lg:flex items-center space-x-8">
          {NAV_ITEMS.map((item) =>
            renderNavLink(item, 'group relative text-sm text-white hover:text-gray-300 transition-colors', undefined, true)
          )}
        </nav>

        <div className="flex items-center space-x-3 sm:space-x-4">
          <button
            className="hidden sm:flex items-center gap-2 px-4 md:px-6 py-2 rounded-full liquid-glass text-sm font-medium hover:bg-white/10 transition-all cursor-pointer"
            title="Search isn't built yet"
          >
            <Search className="w-[18px] h-[18px]" />
            <span>Search docs</span>
          </button>

          <button
            onClick={() => navigate(session ? '/dashboard' : '/login')}
            className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full liquid-glass hover:bg-white/10 transition-all cursor-pointer"
            aria-label="Account"
          >
            <User className="w-[18px] h-[18px]" />
          </button>

          <button
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
          </button>
        </div>
      </header>

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
              `py-3 px-3 rounded-lg text-base font-medium text-white hover:bg-gray-800/50 transition-all transform ${
                mobileMenuOpen ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'
              }`,
              () => setMobileMenuOpen(false)
            )
          )}
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
    </>
  );
}
