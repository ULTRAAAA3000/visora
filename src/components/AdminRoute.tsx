import { type ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';

export default function AdminRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  // Checked independently from AuthContext's cached `profile` — that
  // object is only fetched once per session (on login), so granting
  // is_admin via SQL after the session already exists wouldn't be
  // reflected without a full logout/login. A fresh RPC call on every
  // visit to /admin sidesteps that staleness entirely.
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!session) {
      setChecking(false);
      return;
    }
    let cancelled = false;
    setChecking(true);
    supabase
      .rpc('is_admin')
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('is_admin check failed', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(Boolean(data));
        }
        setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [session]);

  if (loading || (session && checking)) {
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
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
