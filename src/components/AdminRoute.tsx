import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

export default function AdminRoute({ children }: { children: ReactNode }) {
  const { session, profile, loading, profileLoading } = useAuth();
  const location = useLocation();

  // Both flags matter: `loading` covers the initial session check, but
  // `profile` (where is_admin lives) loads in a separate effect after
  // that. Checking is_admin before profileLoading finishes means it's
  // still null on every fresh load/refresh — bouncing real admins to
  // /dashboard before their own profile has even arrived.
  if (loading || (session && profileLoading)) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading…</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Bounce non-admins to the regular dashboard rather than a distinct
  // "forbidden" page — doesn't confirm/deny that /admin is even an
  // admin-only route to someone poking at it.
  if (!profile?.is_admin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
