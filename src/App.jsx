import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MapPage from './pages/Map';
import Incidents from './pages/Incidents';
import Resources from './pages/Resources';
import Hospitals from './pages/Hospitals';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import './styles/global.css';

// Auth guard — redirects unauthenticated users to /login
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useApp();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

// Root redirect — sends authenticated users to dashboard
function RootRedirect() {
  const { isAuthenticated } = useApp();
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<RootRedirect />} />

      {/* Protected — all wrapped in sidebar Layout */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/incidents" element={<Incidents />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/hospitals" element={<Hospitals />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
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
