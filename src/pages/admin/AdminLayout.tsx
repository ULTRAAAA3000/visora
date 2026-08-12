import { type ComponentType, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, LogOut, Menu, X, ShieldCheck, BarChart3, Mail } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  end?: boolean;
}

const navItems: NavItem[] = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/billing', label: 'Billing', icon: CreditCard },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/messages', label: 'Messages', icon: Mail },
];

export default function AdminLayout() {
  const { profile, signOut } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const sidebarContent = (
    <>
      <div>
        <div className="flex items-center gap-2 px-2 mb-8">
          <ShieldCheck className="w-5 h-5 text-amber-400" />
          <span className="font-medium">Admin</span>
        </div>

        <nav className="space-y-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
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
        <Link to="/dashboard" className="block text-sm text-gray-400 hover:text-white transition-colors">
          ← Back to dashboard
        </Link>
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
      <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-white/10 sticky top-0 bg-black z-30">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-amber-400" />
          <span className="font-medium">Admin</span>
        </div>
        <button
          onClick={() => setMobileNavOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {mobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMobileNavOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-black border-r border-white/10 flex flex-col justify-between py-6 px-4">
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

      <aside className="hidden lg:flex w-60 shrink-0 border-r border-white/10 flex-col justify-between py-6 px-4">
        {sidebarContent}
      </aside>

      <main className="flex-1 overflow-y-auto min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
