import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Header from '../components/layout/Header';

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function Profile() {
  const { user, updateUser, showToast, avatarInitials } = useApp();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...user });
  const [errors, setErrors] = useState({});

  const startEdit = () => {
    setForm({ ...user });
    setErrors({});
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setErrors({});
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required.';
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!validateEmail(form.email)) e.email = 'Enter a valid email address.';
    if (!form.phone.trim()) e.phone = 'Phone is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!validate()) return;
    updateUser(form);
    setEditing(false);
    showToast('Profile updated successfully.');
  };

  const field = (key) => ({
    value: form[key],
    onChange: (ev) => {
      setForm(p => ({ ...p, [key]: ev.target.value }));
      setErrors(p => ({ ...p, [key]: null }));
    },
  });

  return (
    <>
      <Header title="Profile" subtitle="Manage your account and role." />
      <div className="screen-body">
        <div style={{ maxWidth: '600px' }}>

          {/* Avatar card */}
          <div className="panel" style={{ marginBottom: 'var(--card-gap)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: 'var(--card-pad)' }}>
              <div
                className="avatar"
                style={{ width: '64px', height: '64px', fontSize: '22px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}
              >
                {avatarInitials}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '18px' }}>{user.name}</div>
                <div style={{ color: 'var(--ink-muted)', fontSize: '14px', marginTop: '4px' }}>{user.role}</div>
                <div style={{ color: 'var(--ink-muted)', fontSize: '13px' }}>{user.org}</div>
              </div>
              {!editing && (
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ marginLeft: 'auto', height: '38px', padding: '0 16px', fontSize: '13px' }}
                  onClick={startEdit}
                >
                  Edit profile
                </button>
              )}
            </div>
          </div>

          {/* Details / Edit form */}
          <div className="panel">
            <div className="panel-head">
              <h3>{editing ? 'Edit profile' : 'Profile details'}</h3>
            </div>

            {editing ? (
              <form onSubmit={handleSave} noValidate style={{ padding: 'var(--card-pad)' }}>
                <div className="field">
                  <label>Full name</label>
                  <input {...field('name')} placeholder="Full name" />
                  {errors.name && <span style={{ color: 'var(--critical)', fontSize: '12px' }}>{errors.name}</span>}
                </div>

                <div className="field">
                  <label>Email</label>
                  <input type="email" {...field('email')} placeholder="you@example.gov" />
                  {errors.email && <span style={{ color: 'var(--critical)', fontSize: '12px' }}>{errors.email}</span>}
                </div>

                <div className="field">
                  <label>Phone</label>
                  <input {...field('phone')} placeholder="+1 555-0000" />
                  {errors.phone && <span style={{ color: 'var(--critical)', fontSize: '12px' }}>{errors.phone}</span>}
                </div>

                <div className="field">
                  <label>Role</label>
                  <select {...field('role')}>
                    <option>Emergency Coordinator</option>
                    <option>Field Officer</option>
                    <option>Hospital Liaison</option>
                    <option>Resource Manager</option>
                    <option>Command Center Admin</option>
                  </select>
                </div>

                <div className="field">
                  <label>Organization</label>
                  <input {...field('org')} placeholder="Organization name" />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button type="button" className="btn-ghost" style={{ flex: 1, height: 'var(--btn-h)', borderRadius: '8px', fontSize: '14px', fontWeight: 600 }} onClick={cancelEdit}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" style={{ flex: 1, marginTop: 0 }}>
                    Save changes
                  </button>
                </div>
              </form>
            ) : (
              <div>
                {[
                  { label: 'Full name', value: user.name },
                  { label: 'Email', value: user.email },
                  { label: 'Phone', value: user.phone },
                  { label: 'Role', value: user.role },
                  { label: 'Organization', value: user.org },
                ].map(row => (
                  <div key={row.label} className="kv" style={{ padding: '14px var(--card-pad)' }}>
                    <span>{row.label}</span>
                    <span style={{ fontWeight: 500 }}>{row.value}</span>
                  </div>
                ))}

                {/* Permissions */}
                <div style={{ padding: 'var(--card-pad)', borderTop: '1px solid var(--line)' }}>
                  <p style={{ fontWeight: 600, fontSize: '14px', marginBottom: '12px' }}>Permissions</p>
                  {['View all incidents', 'Assign rescue teams', 'Allocate resources', 'Request hospital transfers', 'Generate reports'].map(perm => (
                    <div key={perm} className="perm-item">
                      <span className="check">✓</span>
                      <span>{perm}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
