import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function ResetPassword() {
  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    // The reset link's tokens are in the URL hash; supabase-js exchanges
    // them for a (recovery-scoped) session automatically on load and
    // fires PASSWORD_RECOVERY. If that never fires and there's also no
    // session a few seconds later, the link was invalid or already used.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });

    const timer = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setReady(true);
      } else {
        setInvalid(true);
      }
    }, 2500);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords don\'t match.');
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    setDone(true);
    setTimeout(() => navigate('/dashboard', { replace: true }), 1500);
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="block text-center mb-8">
          <img src="/visora-logo.png" alt="Visora" className="h-10 sm:h-12 md:h-14 mx-auto" />
        </Link>

        <div className="rounded-2xl p-8 bg-white/[0.03] border border-white/10">
          {invalid ? (
            <>
              <h1 className="text-xl font-medium mb-2">Link expired</h1>
              <p className="text-sm text-gray-400 leading-relaxed mb-4">
                This reset link is invalid or already used — they only work once. Request a new one.
              </p>
              <Link
                to="/forgot-password"
                className="block text-center w-full bg-white text-black rounded-lg font-medium py-2.5 hover:bg-gray-200 transition-colors"
              >
                Request new link
              </Link>
            </>
          ) : done ? (
            <>
              <h1 className="text-xl font-medium mb-2">Password updated</h1>
              <p className="text-sm text-gray-400">Taking you to your dashboard…</p>
            </>
          ) : !ready ? (
            <p className="text-sm text-gray-400">Verifying your link…</p>
          ) : (
            <>
              <h1 className="text-xl font-medium mb-6">Choose a new password</h1>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">New password</label>
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
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Confirm password</label>
                  <input
                    type="password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm outline-none focus:border-white/30 transition-colors"
                    placeholder="••••••••"
                  />
                </div>

                {error && <p className="text-sm text-red-400">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-white text-black rounded-lg font-medium py-2.5 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Saving…' : 'Update password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
