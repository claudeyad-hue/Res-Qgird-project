import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Header from '../components/layout/Header';

function SettingRow({ label, value, onToggle, isButton = false, buttonLabel, danger = false }) {
  return (
    <div className="list-row" style={{ cursor: 'default' }}>
      <span>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {value && <span className="setting-value">{value}</span>}
        {isButton && (
          <button
            type="button"
            className={danger ? 'btn-primary' : 'btn-secondary'}
            style={{
              height: '34px',
              padding: '0 14px',
              fontSize: '13px',
              background: danger ? 'var(--critical)' : undefined,
            }}
            onClick={onToggle}
          >
            {buttonLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export default function Settings() {
  const { theme, toggleAppearance, notificationsEnabled, toggleNotifications, logout } = useApp();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  const themeLabel =
    theme === 'dark' ? 'Dark' : theme === 'light' ? 'Light' : 'System default';

  return (
    <>
      <Header title="Settings" subtitle="Configure your console preferences." />
      <div className="screen-body">
        <div style={{ maxWidth: '600px' }}>

          {/* Appearance */}
          <div className="panel" style={{ marginBottom: 'var(--card-gap)' }}>
            <div className="panel-head"><h3>Appearance</h3></div>
            <SettingRow
              label="Theme"
              value={themeLabel}
              isButton
              buttonLabel={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
              onToggle={toggleAppearance}
            />
            <SettingRow
              label="Language"
              value="English (US)"
            />
            <SettingRow
              label="Time zone"
              value="UTC+05:30 — IST"
            />
          </div>

          {/* Notifications */}
          <div className="panel" style={{ marginBottom: 'var(--card-gap)' }}>
            <div className="panel-head"><h3>Notifications</h3></div>
            <SettingRow
              label="Push notifications"
              value={notificationsEnabled ? 'Enabled' : 'Disabled'}
              isButton
              buttonLabel={notificationsEnabled ? 'Disable' : 'Enable'}
              onToggle={toggleNotifications}
            />
            <SettingRow
              label="Critical alert sound"
              value="On"
            />
            <SettingRow
              label="Email digest"
              value="Daily summary"
            />
          </div>

          {/* Data & Privacy */}
          <div className="panel" style={{ marginBottom: 'var(--card-gap)' }}>
            <div className="panel-head"><h3>Data &amp; Privacy</h3></div>
            <SettingRow label="Data retention" value="90 days" />
            <SettingRow label="Audit log" value="Enabled" />
            <SettingRow label="Session timeout" value="30 minutes" />
          </div>

          {/* About */}
          <div className="panel" style={{ marginBottom: 'var(--card-gap)' }}>
            <div className="panel-head"><h3>About</h3></div>
            <SettingRow label="Console version" value="v2.4.1" />
            <SettingRow label="Build" value="2026.09" />
            <SettingRow label="Environment" value="Production" />
          </div>

          {/* Sign out */}
          <div className="panel">
            <div className="panel-head"><h3>Account</h3></div>
            <SettingRow
              label="Sign out of console"
              isButton
              buttonLabel="Sign out"
              onToggle={handleSignOut}
              danger
            />
          </div>
        </div>
      </div>
    </>
  );
}
