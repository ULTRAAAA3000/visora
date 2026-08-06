import { type ComponentType } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, FileCode2, LogOut } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import PendingConnectBanner from '../../components/PendingConnectBanner';

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  end?: boolean;
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/templates', label: 'Templates', icon: FileCode2 },
];

export default function DashboardLayout() {
  const { profile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-black text-white flex">
      <aside className="w-60 shrink-0 border-r border-white/10 flex flex-col justify-between py-6 px-4">
        <div>
          <Link to="/" className="block px-2 mb-8">
            <img src="/visora-logo.png" alt="Visora" className="h-10 sm:h-12 md:h-14" />
          </Link>

          <nav className="space-y-1">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
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

        <div className="px-2">
          <p className="text-xs text-gray-500 truncate mb-2">{profile?.email}</p>
          <button
            onClick={signOut}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="px-8 pt-6">
          <PendingConnectBanner />
        </div>
        <Outlet />
      </main>
    </div>
  );
}
