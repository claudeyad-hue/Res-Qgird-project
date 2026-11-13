import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Toast from '../common/Toast';
import { useApp } from '../../context/AppContext';

export default function Layout() {
  const { demoMode, dataSources, isInitialLoading, authApiConfigured } = useApp();
  const demoSources = Object.entries(dataSources).filter(([, source]) => String(source).toLowerCase().includes('demo')).map(([name]) => name);
  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        {demoMode && <div className="global-demo-notice" role="status">
          <strong>{authApiConfigured ? 'DEMO ENVIRONMENT' : 'PREVIEW MODE · BACKEND NOT CONFIGURED'}</strong>
          <span>{authApiConfigured ? 'Scenario data is for testing only, not for emergency dispatch' : 'Preview mode: no account is signed in. Demo reports stay in this browser and do not notify responders'}{demoSources.length ? ` · Demo feeds: ${demoSources.join(', ')}` : ''}.</span>
        </div>}
        {isInitialLoading && <div className="global-loading" role="status">Loading operational records…</div>}
        <Outlet />
      </main>
      <Toast />
    </div>
  );
}
