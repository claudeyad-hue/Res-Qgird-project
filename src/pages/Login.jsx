import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function Login() {
  const { login } = useApp();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Emergency Coordinator');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = 'Email is required.';
    else if (!validateEmail(email)) e.email = 'Enter a valid email address.';
    if (!password) e.password = 'Password is required.';
    else if (password.length < 6) e.password = 'Password must be at least 6 characters.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setTimeout(() => {
      login({ email, role });
      navigate('/dashboard');
      setLoading(false);
    }, 600);
  };

  return (
    <div id="screen-login">
      <div className="login-hero">
        <div className="mark">UNIFIED DISASTER MANAGEMENT</div>
        <h1>Coordinated response, every second counts.</h1>
        <p>Real-time situational awareness and multi-agency coordination.</p>
      </div>

      <div className="login-form-side">
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <h2>Sign in to Console</h2>
          <p className="sub">Authorized personnel only.</p>

          <div className="field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.gov"
              value={email}
              onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: null })); }}
              aria-describedby={errors.email ? 'login-email-err' : undefined}
            />
            {errors.email && (
              <span id="login-email-err" style={{ color: 'var(--critical)', fontSize: '12px' }}>
                {errors.email}
              </span>
            )}
          </div>

          <div className="field">
            <label htmlFor="login-pw">Password</label>
            <input
              id="login-pw"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: null })); }}
              aria-describedby={errors.password ? 'login-pw-err' : undefined}
            />
            {errors.password && (
              <span id="login-pw-err" style={{ color: 'var(--critical)', fontSize: '12px' }}>
                {errors.password}
              </span>
            )}
          </div>

          <div className="field">
            <label htmlFor="login-role">Role</label>
            <select id="login-role" value={role} onChange={e => setRole(e.target.value)}>
              <option>Emergency Coordinator</option>
              <option>Field Officer</option>
              <option>Hospital Liaison</option>
              <option>Resource Manager</option>
              <option>Command Center Admin</option>
            </select>
          </div>

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in →'}
          </button>

          <div className="login-links">
            <button type="button">Forgot password?</button>
            <span>v2.4.1 — Secure</span>
          </div>
        </form>
      </div>
    </div>
  );
}
