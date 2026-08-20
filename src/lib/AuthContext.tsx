import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { generateApiKey } from './apiKey';
import type { Profile } from './database.types';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  profileLoading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Ensures a `profiles` row exists for the given auth user. New signups
 * don't automatically get one (no DB trigger yet — see README), so the
 * dashboard creates it on first load using the INSERT policy added in
 * migration 0002.
 */
async function ensureProfile(user: User): Promise<Profile> {
  const { data: existing, error: selectError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing) return existing;

  const { data: created, error: insertError } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      email: user.email ?? '',
      api_key: generateApiKey(),
    })
    .select()
    .single();

  if (insertError) throw insertError;
  return created;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Deliberately NOT also calling supabase.auth.getSession() here.
    // onAuthStateChange's first invocation (event INITIAL_SESSION)
    // already waits for supabase-js's internal init — including
    // exchanging a pending OAuth `?code=` param for a session after
    // the Google redirect. Calling getSession() separately raced that
    // exchange: it could resolve with session=null a moment before the
    // real session landed, which set loading=false early and bounced
    // freshly-authenticated Google users straight back to /login.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!isMounted) return;
      setSession(newSession);
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    let isMounted = true;
    setProfileLoading(true);
    ensureProfile(session.user)
      .then((p) => {
        if (isMounted) setProfile(p);
      })
      .catch((err) => console.error('Failed to load/create profile', err))
      .finally(() => {
        if (isMounted) setProfileLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [session?.user?.id]);

  const refreshProfile = async () => {
    if (!session?.user) return;
    const { data, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
    if (!error) setProfile(data);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    profileLoading,
    refreshProfile,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
