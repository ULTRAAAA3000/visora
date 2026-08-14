import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { usePageMeta } from '../lib/usePageMeta';

export default function Signup() {
  usePageMeta({
    title: 'Sign Up',
    description: 'Create a free Visora account — 500 renders/month, no credit card required.',
    path: '/signup',
  });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    setSubmitting(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    // If email confirmation is required, there's no session yet.
    if (!data.session) {
      setConfirmationSent(true);
      return;
    }

    navigate('/dashboard', { replace: true });
  };

  if (confirmationSent) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <img src="/visora-logo.png" alt="Visora" className="h-10 sm:h-12 md:h-14 mx-auto mb-8" />
          <h1 className="text-xl font-medium mb-3">Check your email</h1>
          <p className="text-gray-400 text-sm">
            We sent a confirmation link to <span className="text-white">{email}</span>. Click it to
            activate your account, then log in.
          </p>
          <Link to="/login" className="inline-block mt-6 text-sm underline underline-offset-2">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="block text-center mb-8">
          <img src="/visora-logo.png" alt="Visora" className="h-10 sm:h-12 md:h-14 mx-auto" />
        </Link>

        <div className="rounded-2xl p-8 bg-white/[0.03] border border-white/10">
          <h1 className="text-xl font-medium mb-6">Create your account</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-white/30 transition-colors"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-white/30 transition-colors"
                placeholder="At least 8 characters"
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-white text-black rounded-lg font-medium py-2.5 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-sm text-gray-400 mt-6 text-center">
            Already have an account?{' '}
            <Link to="/login" className="text-white underline underline-offset-2">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
