import { type ComponentType, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, FileCode2, LogOut, Compass, BookOpen, Menu, X, Home, Layers } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import PendingConnectBanner from '../../components/PendingConnectBanner';
import { TourProvider, useTour } from '../../lib/tour/TourContext';
import TourOverlay from '../../components/tour/TourOverlay';

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  end?: boolean;
  tourId?: string;
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true, tourId: 'nav-overview' },
  { to: '/dashboard/templates', label: 'Templates', icon: FileCode2, tourId: 'nav-templates' },
  { to: '/dashboard/bulk', label: 'Bulk', icon: Layers, tourId: 'nav-bulk' },
  { to: '/dashboard/guide', label: 'Guide', icon: BookOpen },
];

function DashboardChrome() {
  const { profile, signOut } = useAuth();
  const { start } = useTour();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const sidebarContent = (
    <>
      <div>
        <Link to="/" className="block px-2 mb-8">
          <img src="/visora-logo.png" alt="Visora" className="h-10 sm:h-12 md:h-14" />
        </Link>

        <nav className="space-y-1">
          {navItems.map(({ to, label, icon: Icon, end, tourId }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              data-tour={tourId}
              onClick={() => setMobileNavOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="px-2 space-y-3">
        <Link
          to="/"
          onClick={() => setMobileNavOpen(false)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <Home className="w-4 h-4" />
          Back to site
        </Link>
        <button
          onClick={() => {
            setMobileNavOpen(false);
            start();
          }}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <Compass className="w-4 h-4" />
          Take the tour
        </button>
        <div>
          <p className="text-xs text-gray-500 truncate mb-2">{profile?.email}</p>
          <button
            onClick={signOut}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-black text-white lg:flex">
      {/* Mobile top bar — hidden on lg+ where the static sidebar takes over */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-white/10 sticky top-0 bg-black z-30">
        <Link to="/" className="block">
          <img src="/visora-logo.png" alt="Visora" className="h-9" />
        </Link>
        <button
          onClick={() => setMobileNavOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile off-canvas nav */}
      {mobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMobileNavOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-black border-r border-white/10 flex flex-col justify-between py-6 px-4 animate-blur-fade-up" style={{ animationDuration: '200ms' }}>
            <button
              onClick={() => setMobileNavOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Static sidebar on large screens */}
      <aside className="hidden lg:flex w-60 shrink-0 border-r border-white/10 flex-col justify-between py-6 px-4">
        {sidebarContent}
      </aside>

      <main className="flex-1 overflow-y-auto min-w-0">
        <div className="px-4 sm:px-6 lg:px-8 pt-4 lg:pt-6">
          <PendingConnectBanner />
        </div>
        <Outlet />
      </main>

      <TourOverlay />
    </div>
  );
}

export default function DashboardLayout() {
  return (
    <TourProvider>
      <DashboardChrome />
    </TourProvider>
  );
}
