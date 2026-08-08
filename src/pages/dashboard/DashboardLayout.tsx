import { type ComponentType } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, FileCode2, LogOut, Compass, BookOpen } from 'lucide-react';
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
  { to: '/dashboard/guide', label: 'Guide', icon: BookOpen },
];

function DashboardChrome() {
  const { profile, signOut } = useAuth();
  const { start } = useTour();

  return (
    <div className="min-h-screen bg-black text-white flex">
      <aside className="w-60 shrink-0 border-r border-white/10 flex flex-col justify-between py-6 px-4">
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
          <button
            onClick={start}
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
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="px-8 pt-6">
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
