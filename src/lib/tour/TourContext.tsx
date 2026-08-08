import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabase';
import { TOUR_STEPS } from './steps';

interface TourContextValue {
  running: boolean;
  stepIndex: number;
  step: (typeof TOUR_STEPS)[number] | null;
  totalSteps: number;
  start: () => void;
  next: () => void;
  skip: () => void;
}

const TourContext = createContext<TourContextValue | undefined>(undefined);

async function markOnboardingSeen(userId: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) console.error('Failed to mark onboarding seen', error);
}

export function TourProvider({ children }: { children: ReactNode }) {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [running, setRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const autoStarted = useRef(false);

  // Auto-start exactly once per profile load, only if never completed
  // before. The ref guard stops this re-firing on every re-render (e.g.
  // profile refetches) within the same session.
  useEffect(() => {
    if (!profile || autoStarted.current) return;
    if (profile.onboarding_completed_at) {
      autoStarted.current = true;
      return;
    }
    autoStarted.current = true;
    // Small delay so the dashboard layout has actually painted before
    // the overlay tries to measure a target element.
    const timer = setTimeout(() => {
      setStepIndex(0);
      setRunning(true);
    }, 600);
    return () => clearTimeout(timer);
  }, [profile]);

  const finish = useCallback(() => {
    setRunning(false);
    if (profile && !profile.onboarding_completed_at) {
      markOnboardingSeen(profile.id).then(() => refreshProfile());
    }
  }, [profile, refreshProfile]);

  const start = useCallback(() => {
    if (location.pathname !== '/dashboard') navigate('/dashboard');
    setStepIndex(0);
    setRunning(true);
  }, [navigate, location.pathname]);

  const next = useCallback(() => {
    const nextIndex = stepIndex + 1;
    if (nextIndex >= TOUR_STEPS.length) {
      finish();
      return;
    }
    const nextStep = TOUR_STEPS[nextIndex];
    if (nextStep.route && nextStep.route !== location.pathname) {
      navigate(nextStep.route);
    }
    setStepIndex(nextIndex);
  }, [stepIndex, finish, navigate, location.pathname]);

  const skip = useCallback(() => {
    finish();
  }, [finish]);

  const value: TourContextValue = {
    running,
    stepIndex,
    step: running ? TOUR_STEPS[stepIndex] ?? null : null,
    totalSteps: TOUR_STEPS.length,
    start,
    next,
    skip,
  };

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour(): TourContextValue {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour must be used within a TourProvider');
  return ctx;
}
