import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

export default function Header({ title, subtitle }) {
  const { avatarInitials, user } = useApp();
  const navigate = useNavigate();
  const dateStr = React.useMemo(() => new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }), []);

  return (
    <div className="topbar">
      <div>
        <h1 className="topbar-title">{title}</h1>
        {subtitle && <div className="greeting-sub">{subtitle}</div>}
      </div>
      <div className="topbar-right">
        <span>{dateStr}</span>
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
  );
}
