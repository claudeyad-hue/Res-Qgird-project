import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Toast from '../common/Toast';
import { useApp } from '../../context/AppContext';

export default function Layout() {
  const { isInitialLoading, authApiConfigured } = useApp();
  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        {!authApiConfigured && <div className="backend-preview-notice" role="status">
          <strong>PREVIEW · BACKEND NOT CONFIGURED</strong>
          <span>Incident, response-team, resource, ambulance and hazard-zone feeds are empty. The hospital directory remains available; reporting and dispatch require a connected backend.</span>
        </div>}
        {isInitialLoading && <div className="global-loading" role="status">Loading operational records…</div>}
        <Outlet />
      </main>
      <Toast />
    </div>
  );
}
