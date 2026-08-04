import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase.js';
import { generateApiKey } from './apiKey.js';

const AuthContext = createContext(undefined);

/**
 * Ensures a `profiles` row exists for the given auth user. New signups
 * don't automatically get one (no DB trigger yet — see README), so the
 * dashboard creates it on first load using the INSERT policy added in
 * migration 0002.
 */
async function ensureProfile(user) {
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
      email: user.email,
      api_key: generateApiKey(),
    })
    .select()
    .single();

  if (insertError) throw insertError;
  return created;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (isMounted) {
        setSession(data.session);
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setProfile(null);
      return;
    }

    let isMounted = true;
    ensureProfile(session.user)
      .then((p) => {
        if (isMounted) setProfile(p);
      })
      .catch((err) => console.error('Failed to load/create profile', err));

    return () => {
      isMounted = false;
    };
  }, [session?.user?.id]);

  const refreshProfile = async () => {
    if (!session?.user) return;
    const { data, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
    if (!error) setProfile(data);
  };

  const signOut = () => supabase.auth.signOut();

  const value = { session, user: session?.user ?? null, profile, loading, refreshProfile, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
