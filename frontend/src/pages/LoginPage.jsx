import { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { useLocation, Link } from 'react-router-dom';
import { validateEmail, validatePassword, greeting } from '../lib/utils';

export default function LoginPage() {
  const { login, signup } = useApp();
  const location = useLocation();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (location.state?.notice) setNotice(location.state.notice);
  }, [location.state]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    if (!validateEmail(email)) return setError('Enter a valid email address.');
    if (!validatePassword(password)) return setError('Password must be at least 6 characters.');

    setBusy(true);
    try {
      if (mode === 'login') {
        const { error } = await login(email, password);
        if (error) throw new Error(error.message);
      } else {
        const { error, data } = await signup(email, password, fullName);
        if (error) throw new Error(error.message);
        if (data.session) return; // auto sign-in
        setNotice('Check your inbox — confirm your email to activate your account.');
        setMode('login');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
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
          <h1 className="text-2xl font-bold text-white">SatiStudy</h1>
          <p className="mt-1 text-sm text-muted">{greeting()}! Your warm, witty study companion for Sati Vidisha.</p>
        </div>

        <div className="rounded-2xl bg-surface-dark p-6 shadow-xl ring-1 ring-surface">
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-ink p-1">
            {['login', 'signup'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(''); setNotice(''); }}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  mode === m ? 'bg-brand-lighter text-onbrand' : 'text-muted hover:text-white'
                }`}
              >
                {m === 'login' ? 'Log in' : 'Sign up'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === 'signup' && (
              <input
                className="input-round"
                placeholder="Full name (optional)"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
              />
            )}
            <input
              className="input-round"
              type="email"
              placeholder="College email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            <input
              className="input-round"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
            />
            {mode === 'login' && (
              <div className="text-right">
                <Link to="/reset-password" className="text-xs text-brand-lighter hover:underline">
                  Forgot password?
                </Link>
              </div>
            )}
            {error && (
              <p className="rounded-lg bg-danger/15 px-3 py-2 text-sm text-danger">{error}</p>
            )}
            {notice && (
              <p className="rounded-lg bg-brand-light/20 px-3 py-2 text-sm text-brand-lighter">{notice}</p>
            )}
            <button type="submit" disabled={busy} className="btn-primary w-full py-3">
              {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-muted">
            Study tasks, exam reminders and streaks — one chat board.
          </p>
        </div>
      </div>
    </div>
  );
}