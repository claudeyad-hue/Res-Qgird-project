import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import Drawer from '../common/Drawer';
import Sidebar from './Sidebar';

export default function Header({ title, subtitle }) {
  const { avatarInitials, user } = useApp();
  const navigate = useNavigate();
  const dateStr = React.useMemo(() => new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }), []);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const toggleDrawer = () => setDrawerOpen(!drawerOpen);
  const handleNav = (path) => {
    setDrawerOpen(false);
    navigate(path);
  };

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
            aria-label="Open navigation menu"
            onClick={toggleDrawer}
            style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
          >
            ☰
          </button>
          <div
            className="avatar"
            title={user.name}
            role="button"
            tabIndex={0}
            onClick={() => navigate('/profile')}
            onKeyDown={e => { if (e.key === 'Enter') navigate('/profile'); }}
            aria-label={`User profile: ${user.name}`}
          >
            {avatarInitials}
          </div>
        </div>
      </div>

      {/* Mobile drawer containing the sidebar navigation */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Menu"
        scrim="mobile-only"
        className="drawer--mobile"
      >
        <Sidebar onNavigate={handleNav} />
      </Drawer>
    </>
  );
}
