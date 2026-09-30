import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: '◈' },
  { to: '/map', label: 'Live Map', icon: '◎' },
  { to: '/incidents', label: 'Incidents', icon: '⚠' },
  { to: '/resources', label: 'Resources', icon: '◧' },
  { to: '/hospitals', label: 'Hospitals', icon: '✚' },
];

const NAV_BOTTOM = [
  { to: '/profile', label: 'Profile', icon: '◉', 'data-screen': 'profile' },
  { to: '/settings', label: 'Settings', icon: '⚙' },
];

export default function Sidebar() {
  const { criticalCount, logout } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="logo">UNIFIED</div>

      {NAV_ITEMS.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          data-screen={item['data-screen']}
        >
          <span>{item.icon}</span>
          <span>{item.label}</span>
          {item.to === '/incidents' && criticalCount > 0 && (
            <span className="nav-tag">{criticalCount}</span>
          )}
        </NavLink>
      ))}

      <div className="nav-div" />

      {NAV_BOTTOM.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}${item['data-screen'] ? ' profile-nav' : ''}`}
          data-screen={item['data-screen']}
        >
          <span>{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}

      <button
        type="button"
        className="nav-item"
        style={{ marginTop: '4px', color: 'rgba(255,255,255,0.72)' }}
        onClick={handleLogout}
      >
        <span>⏻</span>
        <span>Sign out</span>
      </button>
    </aside>
  );
}
