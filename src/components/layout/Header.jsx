import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import Drawer from '../common/Drawer';
import Sidebar from './Sidebar';

export default function Header({ title, subtitle }) {
  const { avatarInitials, user } = useApp();
  const navigate = useNavigate();
  const dateStr = React.useMemo(() => new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }), []);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const toggleDrawer = useCallback(() => setDrawerOpen((open) => !open), []);
  const closeNavigation = useCallback(() => setDrawerOpen(false), []);

  return (
    <>
      <div className="topbar">
        <div>
          <h1 className="topbar-title">{title}</h1>
          {subtitle && <div className="greeting-sub">{subtitle}</div>}
        </div>
        <div className="topbar-right">
          <span>{dateStr}</span>
          {/* Hamburger for mobile */}
          <button
            className="hamburger-btn"
            aria-label={drawerOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={drawerOpen}
            aria-controls="mobile-navigation"
            onClick={toggleDrawer}
            style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
          >
            ☰
          </button>
          <button
            type="button"
            className="avatar"
            title={user.name}
            onClick={() => navigate('/profile')}
            aria-label={`User profile: ${user.name}`}
          >
            {avatarInitials}
          </button>
        </div>
      </div>

      {/* Mobile drawer containing the sidebar navigation */}
      <Drawer
        isOpen={drawerOpen}
        onClose={closeNavigation}
        title="Menu"
        scrim="always"
        className="drawer--mobile"
        id="mobile-navigation"
      >
        <Sidebar onNavigate={closeNavigation} />
      </Drawer>
    </>
  );
}
