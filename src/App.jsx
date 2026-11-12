import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import MapPage from './pages/Map';
import Incidents from './pages/Incidents';
import Resources from './pages/Resources';
import Hospitals from './pages/Hospitals';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import './styles/global.css';

function AppRoutes() {
  return (
    <Routes>
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

      <Route path="/login" element={<Navigate to="/dashboard" replace />} />

      {/* Catch-all */}
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
