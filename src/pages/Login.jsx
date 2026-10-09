import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import authService from '../services/authService';

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@unified.gov', role: 'Command Center Admin' },
  { label: 'Operator', email: 'operator@unified.gov', role: 'Emergency Coordinator' },
  { label: 'Responder', email: 'responder@unified.gov', role: 'Field Officer' },
  { label: 'Medical', email: 'medical@unified.gov', role: 'Hospital Liaison' },
  { label: 'Viewer', email: 'viewer@unified.gov', role: 'Public Information Viewer' },
];

export default function Login() {
  const { login, isAuthenticated } = useApp();
  const navigate = useNavigate();

  const [email, setEmail] = useState(() => authService.getRememberedEmail() || '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => Boolean(authService.getRememberedEmail()));
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [systemHealth, setSystemHealth] = useState({ online: true, label: 'System Operational' });
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Check real backend health status on mount
  useEffect(() => {
    let isMounted = true;
    async function checkStatus() {
      try {
        const health = await authService.checkHealth();
        if (isMounted) {
          if (health.online) {
            setSystemHealth({ online: true, label: 'System Operational — Ghaziabad Region' });
          } else {
            setSystemHealth({ online: false, label: 'Standby / Local Operations Mode' });
          }
        }
      } catch {
        if (isMounted) {
          setSystemHealth({ online: false, label: 'Standby Mode' });
        }
      }
    }
    checkStatus();
    return () => {
      isMounted = false;
    };
  }, []);

  const validate = () => {
    const e = {};
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      e.email = 'Email address is required.';
    } else if (!validateEmail(trimmedEmail)) {
      e.email = 'Please enter a valid emergency console email.';
    }

    if (!password) {
      e.password = 'Password is required.';
    } else if (password.length < 6) {
      e.password = 'Password must be at least 6 characters.';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validate()) return;

    setLoading(true);

    try {
      // Connect to the real authentication API
      const result = await authService.login({
        email: email.trim(),
        password,
      });

      // Handle remember me preference
      if (rememberMe) {
        authService.setRememberedEmail(email.trim());
      } else {
        authService.setRememberedEmail('');
      }

      // Update app context with verified user and token
      login({ user: result.user, token: result.token });

      // Navigate to operational dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('[Login] Authentication error:', err);
      setServerError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFillDemo = (demoAccount) => {
    setEmail(demoAccount.email);
    setPassword('password123');
    setErrors({});
    setServerError('');
  };

  return (
    <div id="screen-login">
      <div className="login-card" role="region" aria-label="Console Authentication Portal">
        {/* Brand & Crest Header */}
        <div className="login-brand-header">
          <div className="login-logo-emblem" aria-hidden="true">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 2L3 7V12C3 17.5 6.8 22.7 12 24C17.2 22.7 21 17.5 21 12V7L12 2Z"
                stroke="url(#shieldGrad)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 8L15 12L12 16L9 12L12 8Z"
                fill="#00D2FF"
              />
              <circle cx="12" cy="12" r="1.5" fill="#FFFFFF" />
              <defs>
                <linearGradient id="shieldGrad" x1="3" y1="2" x2="21" y2="24" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#00D2FF" />
                  <stop offset="0.5" stopColor="#0072FF" />
                  <stop offset="1" stopColor="#7928CA" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="login-brand-pill">
            <span>Unified Disaster Management</span>
          </div>
          <h1 className="login-title">Welcome Back</h1>
          <p className="login-subtitle">Sign in to access your emergency operations console.</p>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="login-alert login-alert-error" role="alert" aria-live="assertive">
            <svg style={{ flexShrink: 0, marginTop: '1px' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>{serverError}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Email / Operator ID Field */}
          <div className="login-field">
            <label htmlFor="login-email">Emergency Operator ID / Email</label>
            <div className="login-input-wrapper">
              <span className="login-input-icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </span>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="operator@unified.gov"
                className={`login-input ${errors.email ? 'is-invalid' : ''}`}
                value={email}
                disabled={loading}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                  if (serverError) setServerError('');
                }}
                aria-describedby={errors.email ? 'login-email-error' : undefined}
                aria-invalid={Boolean(errors.email)}
              />
            </div>
            {errors.email && (
              <div id="login-email-error" className="login-field-error" role="alert">
                <span>⚠</span>
                <span>{errors.email}</span>
              </div>
            )}
          </div>

          {/* Password Field */}
          <div className="login-field">
            <label htmlFor="login-password">Password</label>
            <div className="login-input-wrapper">
              <span className="login-input-icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••••••"
                className={`login-input has-toggle ${errors.password ? 'is-invalid' : ''}`}
                value={password}
                disabled={loading}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
                  if (serverError) setServerError('');
                }}
                aria-describedby={errors.password ? 'login-password-error' : undefined}
                aria-invalid={Boolean(errors.password)}
              />
              <button
                type="button"
                className="login-pw-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={0}
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <div id="login-password-error" className="login-field-error" role="alert">
                <span>⚠</span>
                <span>{errors.password}</span>
              </div>
            )}
          </div>

          {/* Options Row: Remember Me & Forgot Password */}
          <div className="login-options-row">
            <label className="login-remember-label">
              <input
                type="checkbox"
                className="login-remember-checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
              />
              <span>Remember this console</span>
            </label>

            <button
              type="button"
              className="login-forgot-btn"
              onClick={() => setIsRecoveryModalOpen(true)}
            >
              Forgot password?
            </button>
          </div>

          {/* Sign In Button with Cyan-to-Purple Gradient */}
          <button
            type="submit"
            className="login-submit-btn"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? (
              <>
                <span className="login-btn-spinner" aria-hidden="true" />
                <span>Authenticating…</span>
              </>
            ) : (
              <span>Sign In to Console →</span>
            )}
          </button>

          {/* Access Notice */}
          <div className="login-access-notice">
            <span aria-hidden="true">🔒</span>
            <span>Authorized personnel only. Access is monitored & logged.</span>
          </div>
        </form>

        {/* Quick Demo Access Bar */}
        <div className="login-demo-section">
          <div className="login-demo-header">
            <span className="login-demo-title">Quick Demo Access</span>
            <span style={{ fontSize: '11px', color: '#64748B' }}>Verified test roles</span>
          </div>
          <div className="login-demo-pills">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.label}
                type="button"
                className="login-demo-pill"
                onClick={() => handleQuickFillDemo(account)}
                title={`Populate credentials for ${account.role} (${account.email})`}
                disabled={loading}
              >
                {account.label}
              </button>
            ))}
          </div>
        </div>

        {/* Footer Metadata */}
        <div className="login-footer-meta">
          <div className="login-status-badge">
            <span
              className={`login-status-indicator ${systemHealth.online ? '' : 'offline'}`}
              aria-hidden="true"
            />
            <span>{systemHealth.label}</span>
          </div>
          <span>v1.0.0</span>
        </div>
      </div>

      {/* Password Recovery Modal */}
      {isRecoveryModalOpen && (
        <div
          className="login-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="recovery-modal-title"
          onClick={() => setIsRecoveryModalOpen(false)}
        >
          <div
            className="login-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="login-modal-header">
              <h3 id="recovery-modal-title" className="login-modal-title">
                Credential Recovery Protocol
              </h3>
              <button
                type="button"
                className="login-modal-close"
                onClick={() => setIsRecoveryModalOpen(false)}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>
            <div className="login-modal-body">
              <p style={{ marginTop: 0 }}>
                In accordance with emergency command operations security standards, automated self-service email resets are restricted for high-clearance consoles.
              </p>
              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '12px' }}>
                <div style={{ fontWeight: 600, color: '#E2E8F0', marginBottom: '4px' }}>Standard Procedure:</div>
                <ul style={{ margin: 0, paddingLeft: '18px', color: '#94A3B8' }}>
                  <li>Contact Command Center Administration at <code style={{ color: '#00D2FF' }}>admin@unified.gov</code>.</li>
                  <li>Provide your agency badge ID and operational duty assignment.</li>
                  <li>In active emergency scenarios, use the pre-authorized field demo credentials on this terminal.</li>
                </ul>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>
                If you are testing this deployment, click any role in <strong>Quick Demo Access</strong> below to authenticate.
              </p>
            </div>
            <div className="login-modal-footer">
              <button
                type="button"
                className="btn-primary"
                style={{ width: 'auto', height: '36px', padding: '0 18px', fontSize: '13px', background: 'var(--primary)' }}
                onClick={() => setIsRecoveryModalOpen(false)}
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
