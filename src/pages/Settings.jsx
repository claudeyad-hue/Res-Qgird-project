import React from 'react';
import { useApp } from '../context/AppContext';
import Header from '../components/layout/Header';

function SettingRow({ label, value, onClick, actionLabel }) {
  return (
    <div className="list-row setting-row">
      <span>{label}</span>
      <div className="setting-row-value">
        <span className="setting-value">{value}</span>
        {actionLabel && <button type="button" className="btn-secondary setting-action" onClick={onClick}>{actionLabel}</button>}
      </div>
    </div>
  );
}

export default function Settings() {
  const { theme, toggleAppearance, notificationsEnabled, toggleNotifications, dataSources, authApiConfigured, demoMode } = useApp();
  const themeLabel = theme === 'dark' ? 'Dark' : theme === 'light' ? 'Light' : 'System default';
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Browser default';
  const sourceRows = Object.entries(dataSources || {});

  return (
    <>
      <Header title="Settings" subtitle="Review console preferences and operational data connections." />
      <div className="screen-body">
        <div className="settings-content">
          <section className="panel settings-panel">
            <div className="panel-head"><h3>Appearance</h3></div>
            <SettingRow label="Theme" value={themeLabel} actionLabel={theme === 'dark' ? 'Switch to light' : 'Switch to dark'} onClick={toggleAppearance} />
            <SettingRow label="Time zone" value={timeZone} />
          </section>

          <section className="panel settings-panel">
            <div className="panel-head"><h3>Notifications</h3></div>
            <SettingRow label="Browser alerts for new critical incidents" value={notificationsEnabled ? 'Enabled' : 'Disabled'} actionLabel={notificationsEnabled ? 'Disable' : 'Enable'} onClick={toggleNotifications} />
            <p className="settings-help">Alerts require browser permission and an active incident API connection.</p>
          </section>

          <section className="panel settings-panel">
            <div className="panel-head"><h3>Data connections</h3></div>
            <SettingRow label="Backend API" value={authApiConfigured ? 'Configured' : 'Not configured'} />
            <SettingRow label="Operational mode" value={demoMode ? 'Demo scenario' : 'Connected / mixed sources'} />
            {sourceRows.map(([name, source]) => <SettingRow key={name} label={`${name[0].toUpperCase()}${name.slice(1)}`} value={source} />)}
            <p className="settings-help">A source marked as demo or unavailable is not a verified live operational feed. Availability figures are only shown when supplied by a connected source.</p>
          </section>

          <section className="panel settings-panel">
            <div className="panel-head"><h3>Privacy &amp; storage</h3></div>
            <SettingRow label="Theme and alert preferences" value="Stored in this browser" />
            <SettingRow label="Authentication session" value="Stored for this browser session" />
          </section>

          <section className="panel settings-panel">
            <div className="panel-head"><h3>About</h3></div>
            <SettingRow label="Frontend build" value={import.meta.env.PROD ? 'Production' : 'Development'} />
          </section>
        </div>
      </div>
    </>
  );
}
