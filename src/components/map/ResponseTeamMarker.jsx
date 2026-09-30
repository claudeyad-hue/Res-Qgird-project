import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { createTeamIcon } from './mapIcons';

export default function ResponseTeamMarker({ team, onSelectIncident }) {
  if (!team || typeof team.latitude !== 'number' || typeof team.longitude !== 'number') {
    return null;
  }

  const icon = createTeamIcon(team.status);

  return (
    <Marker position={[team.latitude, team.longitude]} icon={icon}>
      <Popup>
        <div className="popup-container">
          <div className="popup-header">
            <div>
              <span className="popup-id">{team.teamId}</span>
              <h4 className="popup-title">{team.name}</h4>
            </div>
            <span
              className="badge"
              style={{
                background:
                  team.status === 'On Scene'
                    ? 'rgba(46, 139, 87, 0.15)'
                    : team.status === 'En Route'
                    ? 'rgba(212, 172, 13, 0.15)'
                    : 'rgba(47, 111, 224, 0.15)',
                color:
                  team.status === 'On Scene'
                    ? '#2E8B57'
                    : team.status === 'En Route'
                    ? '#B7950B'
                    : '#2F6FE0',
                border: 'none',
                fontWeight: 600,
                fontSize: '11px',
                padding: '3px 8px',
                borderRadius: '4px',
              }}
            >
              {team.status}
            </span>
          </div>

          <div className="popup-grid">
            <div className="popup-item">
              <span className="popup-label">Unit Type</span>
              <span className="popup-val">{team.type}</span>
            </div>
            <div className="popup-item">
              <span className="popup-label">Personnel</span>
              <span className="popup-val">{team.members} responders</span>
            </div>
          </div>

          {team.contact && (
            <div className="popup-item" style={{ marginBottom: '6px' }}>
              <span className="popup-label">Emergency Comms</span>
              <span className="popup-val" style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                {team.contact}
              </span>
            </div>
          )}

          {team.currentIncidentId ? (
            <div style={{ marginTop: '8px', padding: '8px', background: 'var(--surface-2)', borderRadius: '6px' }}>
              <div style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>Assigned Emergency:</div>
              <div style={{ fontWeight: 600, fontSize: '12.5px', marginTop: '2px' }}>
                {team.currentIncidentId}
              </div>
              {onSelectIncident && (
                <button
                  type="button"
                  className="popup-btn popup-btn-primary"
                  style={{ marginTop: '6px', width: '100%' }}
                  onClick={() => onSelectIncident(team.currentIncidentId)}
                >
                  View Assigned Incident →
                </button>
              )}
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: '#2E8B57', marginTop: '6px' }}>
              ● Standby: Ready for deployment
            </div>
          )}

          {/* Section N requirement: Explicitly label simulated team telemetry */}
          <div style={{ marginTop: '10px', textAlign: 'center' }}>
            <span
              style={{
                fontSize: '9.5px',
                letterSpacing: '0.08em',
                fontWeight: 700,
                background: 'rgba(230, 126, 34, 0.15)',
                color: '#D35400',
                padding: '2px 6px',
                borderRadius: '3px',
              }}
            >
              SIMULATION TELEMETRY
            </span>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
