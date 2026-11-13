import React from 'react';
import { useApp } from '../context/AppContext';
import Header from '../components/layout/Header';

const roleLabels = {
  admin: 'Administrator',
  operator: 'Operations operator',
  responder: 'Field responder',
  medical: 'Medical operator',
  hospital_admin: 'Hospital administrator',
  viewer: 'Read-only viewer',
};

export default function Profile() {
  const { user, avatarInitials } = useApp();
  const rows = [
    ['Name', user?.name],
    ['Email', user?.email],
    ['Phone', user?.phone],
    ['Role', roleLabels[user?.role] || user?.role],
    ['Organization', user?.organization],
  ].filter(([, value]) => value);

  return (
    <>
      <Header title={user ? 'Profile' : 'Preview profile'} subtitle={user ? 'Account details supplied by your organization.' : 'No account is signed in while the backend is disconnected.'} />
      <div className="screen-body">
        <section className="panel profile-panel" aria-label="Account profile">
          <div className="profile-summary">
            <div className="profile-initials" aria-hidden="true">{avatarInitials}</div>
            <div>
              <h2>{user?.name || 'Preview mode'}</h2>
              <p>{roleLabels[user?.role] || user?.role || 'Unauthenticated preview'}</p>
            </div>
          </div>
          <div className="profile-details">
            {rows.map(([label, value]) => <div key={label} className="kv"><span>{label}</span><span>{value}</span></div>)}
            {user?.role === 'hospital_admin' && (
              <div className="kv"><span>Assigned hospital IDs</span><span>{user.hospitalIds?.join(', ') || 'No facilities assigned'}</span></div>
            )}
          </div>
          <p className="profile-note">For account changes or role updates, contact your system administrator.</p>
        </section>
      </div>
    </>
  );
}
