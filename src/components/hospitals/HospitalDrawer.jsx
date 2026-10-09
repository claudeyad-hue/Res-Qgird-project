import React from 'react';
import Drawer from '../common/Drawer';

function getStatusBadge(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'accepting') return <span style={{ color: 'var(--good)', fontWeight: 600 }}>● Accepting</span>;
  if (s === 'limited') return <span style={{ color: 'var(--high)', fontWeight: 600 }}>● Limited Capacity</span>;
  if (s === 'unavailable') return <span style={{ color: 'var(--critical)', fontWeight: 600 }}>● Unavailable</span>;
  return <span style={{ color: 'var(--critical)', fontWeight: 600 }}>● Full</span>;
}

export default function HospitalDrawer({
  hospital,
  isOpen,
  onClose,
  onTransfer,
  alreadyRequested,
  scrim = 'always',
}) {
  if (!hospital) {
    return <Drawer isOpen={isOpen} onClose={onClose} title="Hospital" scrim={scrim} />;
  }

  const bedsTotal = hospital.bedsTotal || 0;
  const bedsAvail = hospital.bedsAvail || 0;
  const icuTotal = hospital.icuTotal || 0;
  const icuAvail = hospital.icuAvail || 0;

  const bedPct = bedsTotal > 0 ? Math.min(100, Math.round((bedsAvail / bedsTotal) * 100)) : 0;
  const icuPct = icuTotal > 0 ? Math.min(100, Math.round((icuAvail / icuTotal) * 100)) : 0;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={hospital.name || 'Hospital Details'}
      scrim={scrim}
      actions={
        <>
          <button type="button" className="btn-ghost" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className="btn-primary"
            style={{ marginTop: 0 }}
            disabled={alreadyRequested || hospital.status === 'unavailable'}
            onClick={() => onTransfer && onTransfer(hospital.id)}
          >
            {alreadyRequested ? 'Requested ✓' : 'Request transfer'}
          </button>
        </>
      }
    >
      <div className="hospital-drawer-details">
        <div className="kv">
          <span>Hospital ID</span>
          <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{hospital.id}</span>
        </div>
        <div className="kv">
          <span>Distance</span>
          <span style={{ fontWeight: 600 }}>{hospital.distance || 'In Ghaziabad District'}</span>
        </div>
        <div className="kv">
          <span>Status</span>
          <span>{getStatusBadge(hospital.status)}</span>
        </div>
        {hospital.address && (
          <div className="kv">
            <span>Address</span>
            <span style={{ fontSize: '12.5px' }}>{hospital.address}</span>
          </div>
        )}
        <div className="kv">
          <span>Contact</span>
          <span>
            {hospital.contact ? (
              <a href={`tel:${hospital.contact}`} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
                {hospital.contact}
              </a>
            ) : (
              'Emergency Dispatch Desk'
            )}
          </span>
        </div>
        <div className="kv">
          <span>Ambulances available</span>
          <span style={{ fontWeight: 600 }}>{hospital.ambulances ?? 0}</span>
        </div>

        {typeof hospital.latitude === 'number' && typeof hospital.longitude === 'number' && (
          <div className="kv">
            <span>Coordinates</span>
            <span style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--ink-muted)' }}>
              {hospital.latitude.toFixed(4)}, {hospital.longitude.toFixed(4)}
            </span>
          </div>
        )}

        <div style={{ marginTop: '22px' }}>
          <p style={{ fontWeight: 700, marginBottom: '14px', fontSize: '13.5px', color: 'var(--ink)' }}>
            Bed & ICU Availability
          </p>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
              <span style={{ color: 'var(--ink-muted)' }}>General beds</span>
              <span style={{ fontWeight: 600 }}>
                {bedsAvail} / {bedsTotal} ({bedPct}% free)
              </span>
            </div>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{
                  width: `${bedPct}%`,
                  background: bedPct < 20 ? 'var(--critical)' : bedPct < 40 ? 'var(--high)' : 'var(--good)',
                }}
              />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
              <span style={{ color: 'var(--ink-muted)' }}>ICU beds</span>
              <span style={{ fontWeight: 600 }}>
                {icuAvail} / {icuTotal} ({icuPct}% free)
              </span>
            </div>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{
                  width: `${icuPct}%`,
                  background: icuPct < 20 ? 'var(--critical)' : icuPct < 40 ? 'var(--high)' : 'var(--good)',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
