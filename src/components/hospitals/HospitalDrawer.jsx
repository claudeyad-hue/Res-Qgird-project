import React from 'react';
import Drawer from '../common/Drawer';

function getStatusBadge(status) {
  if (status === 'accepting') return <span style={{ color: 'var(--good)', fontWeight: 600 }}>● Accepting</span>;
  if (status === 'limited') return <span style={{ color: 'var(--high)', fontWeight: 600 }}>● Limited</span>;
  return <span style={{ color: 'var(--critical)', fontWeight: 600 }}>● Full</span>;
}

export default function HospitalDrawer({ hospital, isOpen, onClose, onTransfer, alreadyRequested }) {
  if (!hospital) return <Drawer isOpen={isOpen} onClose={onClose} title="Hospital" />;

  const bedPct = Math.round((hospital.bedsAvail / hospital.bedsTotal) * 100);
  const icuPct = Math.round((hospital.icuAvail / hospital.icuTotal) * 100);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={hospital.name}
      actions={
        <>
          <button type="button" className="btn-ghost" onClick={onClose}>Close</button>
          <button
            type="button"
            className="btn-primary"
            style={{ marginTop: 0 }}
            disabled={alreadyRequested}
            onClick={() => onTransfer(hospital.id)}
          >
            {alreadyRequested ? 'Requested ✓' : 'Request transfer'}
          </button>
        </>
      }
    >
      <div className="kv"><span>Hospital ID</span><span>{hospital.id}</span></div>
      <div className="kv"><span>Distance</span><span>{hospital.distance}</span></div>
      <div className="kv"><span>Status</span><span>{getStatusBadge(hospital.status)}</span></div>
      <div className="kv"><span>Contact</span><span>{hospital.contact}</span></div>
      <div className="kv"><span>Ambulances available</span><span>{hospital.ambulances}</span></div>

      <div style={{ marginTop: '24px' }}>
        <p style={{ fontWeight: 600, marginBottom: '14px', fontSize: '14px' }}>Capacity</p>

        <div style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
            <span style={{ color: 'var(--ink-muted)' }}>General beds</span>
            <span>{hospital.bedsAvail} / {hospital.bedsTotal}</span>
          </div>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${bedPct}%` }} />
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
            <span style={{ color: 'var(--ink-muted)' }}>ICU beds</span>
            <span>{hospital.icuAvail} / {hospital.icuTotal}</span>
          </div>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${icuPct}%`, background: icuPct < 30 ? 'var(--critical)' : undefined }} />
          </div>
        </div>
      </div>
    </Drawer>
  );
}
