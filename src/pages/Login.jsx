import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Login() {
  const { signIn, authApiConfigured } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Enter your work email and password.');
      return;
    }
    setSubmitting(true);
    try {
      await signIn(email, password);
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (loginError) {
      setError(loginError.message || 'Sign in failed. Check your credentials and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-screen">
      <section className="auth-panel" aria-labelledby="login-title">
        <div className="auth-brand"><span className="auth-brand-mark" aria-hidden="true">U</span><span>UNIFIED</span></div>
        <p className="auth-eyebrow">DISASTER RESPONSE CONSOLE</p>
        <h1 id="login-title">Sign in to your workspace</h1>
        <p className="auth-description">Use your authorized operations account to continue.</p>
        {!authApiConfigured && (
          <div className="auth-notice" role="status">Sign in is unavailable because the backend URL is not configured. Contact the system administrator.</div>
        )}
        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="login-email">Work email</label>
          <input id="login-email" name="email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={!authApiConfigured || submitting} />
          <label htmlFor="login-password">Password</label>
          <input id="login-password" name="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required disabled={!authApiConfigured || submitting} />
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="btn-primary auth-submit" type="submit" disabled={!authApiConfigured || submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="auth-footnote">Access is managed by your organization. Contact an administrator if your account is not active.</p>
      </section>
    </main>
  );
}
