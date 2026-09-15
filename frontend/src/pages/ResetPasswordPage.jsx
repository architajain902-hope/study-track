import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { supabase } from '../lib/supabase';
import { validateEmail, validatePassword } from '../lib/utils';

export default function ResetPasswordPage() {
  const { requestPasswordReset, updatePassword, logout } = useApp();
  const navigate = useNavigate();

  // 'request' = ask for a reset email; 'reset' = recovery session active, choose a new password
  const [mode, setMode] = useState('request');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  // A PASSWORD_RECOVERY event means the reset-link session was detected in the URL
  // (supabase client has detectSessionInUrl enabled). Switch to the new-password form.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('reset');
        setError('');
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submitRequest = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    if (!validateEmail(email)) return setError('Enter a valid email address.');
    setBusy(true);
    try {
      const { error } = await requestPasswordReset(email);
      if (error) throw new Error(error.message);
      // Generic message — don't reveal whether the account exists (prevents user enumeration).
      setNotice('If an account exists for that email, a password reset link has been sent. Check your inbox (and spam folder).');
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const submitReset = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    if (!validatePassword(password)) return setError('Password must be at least 6 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    setBusy(true);
    try {
      const { error } = await updatePassword(password);
      if (error) throw new Error(error.message);
      await logout(); // end the recovery session so they sign in with the new password
      navigate('/login', { replace: true, state: { notice: 'Password updated. Sign in with your new password.' } });
    } catch (err) {
      setError(err.message || 'Something went wrong.');
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-lighter to-brand text-3xl">
            🦉
          </div>
          <h1 className="text-2xl font-bold text-white">
            {mode === 'reset' ? 'Choose a new password' : 'Reset your password'}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {mode === 'reset'
              ? 'Your reset link is verified. Set a new password to continue.'
              : 'Enter the email for your account and we’ll send a reset link.'}
          </p>
        </div>

        <div className="rounded-2xl bg-surface-dark p-6 shadow-xl ring-1 ring-surface">
          {mode === 'request' ? (
            <form onSubmit={submitRequest} className="space-y-3">
              <input
                className="input-round"
                type="email"
                placeholder="College email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
              {error && (
                <p className="rounded-lg bg-danger/15 px-3 py-2 text-sm text-danger">{error}</p>
              )}
              {notice && (
                <p className="rounded-lg bg-brand-light/20 px-3 py-2 text-sm text-brand-lighter">{notice}</p>
              )}
              <button type="submit" disabled={busy} className="btn-primary w-full py-3">
                {busy ? 'Sending…' : 'Send reset link'}
              </button>
              <Link to="/login" className="block text-center text-xs text-muted hover:text-white">
                Back to log in
              </Link>
            </form>
          ) : (
            <form onSubmit={submitReset} className="space-y-3">
              <input
                className="input-round"
                type="password"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <input
                className="input-round"
                type="password"
                placeholder="Confirm new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
              />
              {error && (
                <p className="rounded-lg bg-danger/15 px-3 py-2 text-sm text-danger">{error}</p>
              )}
              {notice && (
                <p className="rounded-lg bg-brand-light/20 px-3 py-2 text-sm text-brand-lighter">{notice}</p>
              )}
              <button type="submit" disabled={busy} className="btn-primary w-full py-3">
                {busy ? 'Saving…' : 'Update password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}