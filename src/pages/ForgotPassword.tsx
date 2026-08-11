import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setSubmitting(false);
    // Show the same success state whether or not the email exists —
    // otherwise this becomes a way to check which emails have accounts.
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="block text-center mb-8">
          <img src="/visora-logo.png" alt="Visora" className="h-10 sm:h-12 md:h-14 mx-auto" />
        </Link>

        <div className="rounded-2xl p-8 bg-white/[0.03] border border-white/10">
          {sent ? (
            <>
              <h1 className="text-xl font-medium mb-2">Check your email</h1>
              <p className="text-sm text-gray-400 leading-relaxed">
                If an account exists for <strong className="text-white">{email}</strong>, we've sent a link to
                reset your password. It expires in an hour.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-xl font-medium mb-2">Reset your password</h1>
              <p className="text-sm text-gray-400 mb-6">Enter your email and we'll send you a reset link.</p>

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

                {error && <p className="text-sm text-red-400">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-white text-black rounded-lg font-medium py-2.5 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Sending…' : 'Send reset link'}
                </button>
              </form>
            </>
          )}

          <p className="text-sm text-gray-400 mt-6 text-center">
            <Link to="/login" className="text-white underline underline-offset-2">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
