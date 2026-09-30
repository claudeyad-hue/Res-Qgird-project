import React from 'react';

export default function MapLegend({ style = {} }) {
  return (
    <div
      className="legend"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px 16px',
        alignItems: 'center',
        fontSize: '12px',
        color: 'var(--ink-muted)',
        ...style,
      }}
      aria-label="Map Legend"
    >
      {/* User Location */}
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
        <span
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: '#2F6FE0',
            border: '2px solid #ffffff',
            boxShadow: '0 0 0 1px #2F6FE0',
            display: 'inline-block',
          }}
        />
        <span>User GPS</span>
      </span>

      {/* Incident */}
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
        <span
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: '#D35400',
            display: 'inline-block',
          }}
        />
        <span>Incident</span>
      </span>

      {/* Critical Incident */}
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
        <span
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: '#C0392B',
            animation: 'disasterPulse 2.2s infinite',
            display: 'inline-block',
          }}
        />
        <span style={{ fontWeight: 600, color: 'var(--ink)' }}>Critical</span>
      </span>

      {/* Response Team */}
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '14px',
            height: '14px',
            background: '#1B4F72',
            borderRadius: '3px',
            color: '#fff',
            fontSize: '9px',
            fontWeight: 800,
          }}
        >
          🛡
        </span>
        <span>Rescue Unit</span>
      </span>

      {/* Disaster Zone */}
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
        <span
          style={{
            width: '12px',
            height: '10px',
            background: 'rgba(192, 57, 43, 0.3)',
            border: '1.5px solid #C0392B',
            borderRadius: '2px',
            display: 'inline-block',
          }}
        />
        <span>Disaster Zone</span>
      </span>

      {/* Evacuation Zone */}
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
        <span
          style={{
            width: '12px',
            height: '10px',
            background: 'rgba(201, 112, 30, 0.3)',
            border: '1.5px dashed #C9701E',
            borderRadius: '2px',
            display: 'inline-block',
          }}
        />
        <span>Evacuation Zone</span>
      </span>
    </div>
  );
}
