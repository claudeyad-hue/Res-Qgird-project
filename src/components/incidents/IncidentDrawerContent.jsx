import React from 'react';
import Badge from '../common/Badge';
import { routingService } from '../../services/routingService';
import { useApp } from '../../context/AppContext';

export default function IncidentDrawerContent({ incident, userLocation = null }) {
  if (!incident) return null;

  const handleDirections = (e) => {
    e.preventDefault();
    const { url } = routingService.getDirectionsUrl(
      { latitude: incident.latitude, longitude: incident.longitude, title: incident.title },
      userLocation ? { latitude: userLocation.latitude, longitude: userLocation.longitude } : null
    );
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const hasTeam = Boolean(incident.team || incident.assignedTeamId);

  return (
    <>
      <div className="kv">
        <span>Incident ID</span>
        <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{incident.id}</span>
      </div>
      <div className="kv">
        <span>Title</span>
        <span style={{ fontWeight: 600 }}>{incident.title || `${incident.type} Emergency`}</span>
      </div>
      <div className="kv">
        <span>Type</span>
        <span>{incident.type}</span>
      </div>
      <div className="kv">
        <span>Severity</span>
        <span>
          <Badge severity={incident.severity?.toLowerCase() || 'medium'} />
        </span>
      </div>
      <div className="kv">
        <span>Status</span>
        <span style={{ fontWeight: 600, color: incident.status === 'Resolved' ? '#2E8B57' : 'inherit' }}>
          {incident.status}
        </span>
      </div>
      <div className="kv">
        <span>Location / Address</span>
        <span>{incident.address || incident.location || `${incident.latitude?.toFixed(4)}, ${incident.longitude?.toFixed(4)}`}</span>
      </div>
      <div className="kv">
        <span>Coordinates</span>
        <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
          {typeof incident.latitude === 'number' && typeof incident.longitude === 'number'
            ? `${incident.latitude.toFixed(6)}, ${incident.longitude.toFixed(6)}`
            : 'Pending'}
        </span>
      </div>
      <div className="kv">
        <span>People affected</span>
        <span>{(incident.affectedPeople || incident.affected || 0).toLocaleString()}</span>
      </div>
      <div className="kv">
        <span>Assigned team</span>
        <span style={{ color: hasTeam ? '#2E8B57' : 'inherit', fontWeight: hasTeam ? 600 : 400 }}>
          {incident.team || incident.assignedTeamId || 'Unassigned'}
        </span>
      </div>
      <div className="kv">
        <span>Reported</span>
        <span>{incident.time || (incident.reportedAt ? new Date(incident.reportedAt).toLocaleTimeString() : 'Recently')}</span>
      </div>
      {incident.updatedAt && (
        <div className="kv">
          <span>Last Updated</span>
          <span>{new Date(incident.updatedAt).toLocaleTimeString()}</span>
        </div>
      )}

      {/* Description */}
      <div style={{ marginTop: '16px', padding: '12px', background: 'var(--surface-2)', borderRadius: '8px' }}>
        <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: '4px' }}>
          Incident Brief
        </div>
        <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--ink)', lineHeight: '1.5' }}>
          {incident.description || incident.desc || 'No detailed situation report available.'}
        </p>
      </div>

      {/* Directions Button */}
      <div style={{ marginTop: '16px' }}>
        <button
          type="button"
          className="btn-secondary"
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          onClick={handleDirections}
        >
          <span>↗ Get Route & Directions</span>
          {userLocation ? (
            <span style={{ fontSize: '11px', color: '#2F6FE0' }}>(from GPS position)</span>
          ) : (
            <span style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>(via Maps)</span>
          )}
        </button>
      </div>

      {/* Response Workflow Progress Visualization (Section O) */}
      <div style={{ marginTop: '20px', borderTop: '1px solid var(--line)', paddingTop: '14px' }}>
        <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: '10px' }}>
          Response Workflow Lifecycle
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
          {[
            { step: 'Reported', label: '1. Incident Reported' },
            { step: 'Verified', label: '2. Field Verified' },
            { step: 'Assigned', label: '3. Rescue Team Assigned' },
            { step: 'Rescue Dispatched', label: '4. Rescue Dispatched' },
            { step: 'In Progress', label: '5. Operation In Progress' },
            { step: 'Resolved', label: '6. All Clear & Resolved' },
          ].map((s, idx) => {
            const isCurrent = incident.status === s.step;
            const isDone =
              incident.status === 'Resolved' ||
              (incident.status === 'In Progress' && idx < 4) ||
              (incident.status === 'Rescue Dispatched' && idx < 3) ||
              (incident.status === 'Assigned' && idx < 2) ||
              (incident.status === 'Verified' && idx < 1);

            return (
              <div
                key={s.step}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: isCurrent ? 'var(--ink)' : isDone ? '#2E8B57' : 'var(--ink-muted)',
                  fontWeight: isCurrent ? 700 : 400,
                }}
              >
                <span>{isDone ? '✓' : isCurrent ? '●' : '○'}</span>
                <span>{s.label}</span>
                {isCurrent && (
                  <span
                    style={{
                      fontSize: '10px',
                      background: 'var(--primary)',
                      color: '#fff',
                      padding: '1px 5px',
                      borderRadius: '3px',
                    }}
                  >
                    CURRENT
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

export function IncidentDrawerActions({
  incident,
  onAssignTeam,
  onUpdateStatus,
}) {
  const { user } = useApp();
  if (!incident) return null;

  const isResolved = incident.status === 'Resolved';
  const hasTeam = Boolean(incident.team || incident.assignedTeamId);

  // Authorization check (Section I)
  const isAuthorized =
    user?.role === 'Emergency Coordinator' ||
    user?.role === 'Admin' ||
    user?.role === 'Coordinator' ||
    !user?.role;

  if (!isAuthorized) {
    return (
      <div style={{ fontSize: '12px', color: 'var(--ink-muted)', padding: '8px 0' }}>
        Read-only access: Operator credentials required to modify incident state.
      </div>
    );
  }

  return (
    <>
      {!hasTeam && (
        <button
          type="button"
          className="btn-ghost"
          onClick={() => onAssignTeam(incident.id, 'NDRF Taskforce 01', 'TEAM-01')}
        >
          Assign Team
        </button>
      )}

      <button
        type="button"
        className="btn-primary"
        style={{ marginTop: 0 }}
        disabled={isResolved}
        onClick={() => onUpdateStatus(incident.id)}
      >
        {isResolved
          ? 'Resolved'
          : incident.status === 'Reported'
          ? 'Verify Incident →'
          : incident.status === 'Verified'
          ? 'Assign Team →'
          : incident.status === 'Assigned'
          ? 'Dispatch Rescue →'
          : incident.status === 'Rescue Dispatched'
          ? 'Mark In Progress →'
          : 'Mark Resolved ✓'}
      </button>
    </>
  );
}
