import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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

export default function Sidebar({ onNavigate }) {
  const { criticalCount } = useApp();
  const location = useLocation();
  const isDashboardRoute = location.pathname === '/';
  return (
    <aside className="sidebar">
      <div className="logo">UNIFIED</div>

      {NAV_ITEMS.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `nav-item${isActive || (item.to === '/dashboard' && isDashboardRoute) ? ' active' : ''}`}
          data-screen={item['data-screen']}
          onClick={() => onNavigate?.()}
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
          className={({ isActive }) => `nav-item${isActive || (item.to === '/dashboard' && isDashboardRoute) ? ' active' : ''}${item['data-screen'] ? ' profile-nav' : ''}`}
          data-screen={item['data-screen']}
          onClick={() => onNavigate?.()}
        >
          <span>{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}

    </aside>
  );
}
