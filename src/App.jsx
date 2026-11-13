import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import MapPage from './pages/Map';
import Incidents from './pages/Incidents';
import Resources from './pages/Resources';
import Hospitals from './pages/Hospitals';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Login from './pages/Login';
import './styles/global.css';

function RequireAuth() {
  const { user, authLoading } = useApp();
  const location = useLocation();
  if (authLoading) return <main className="route-loading" role="status">Checking your session…</main>;
  return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}

function AppRoutes() {
  const { user, authLoading } = useApp();
  return (
    <Routes>
      <Route path="/login" element={authLoading ? <main className="route-loading" role="status">Checking your session…</main> : user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/incidents" element={<Incidents />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/hospitals" element={<Hospitals />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}
