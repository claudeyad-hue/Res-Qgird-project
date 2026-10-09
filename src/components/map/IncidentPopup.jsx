import React from 'react';
import Badge from '../common/Badge';
import { routingService } from '../../services/routingService';

export default function IncidentPopup({
  incident,
  userLocation,
  onOpenDrawer,
  onAssignTeam,
  onUpdateStatus,
  userRole,
  onSelectForRouting,
  activeRoutingIncidentId,
}) {
  if (!incident) return null;

  const isCoordinatorOrAdmin =
    userRole === 'Emergency Coordinator' ||
    userRole === 'Admin' ||
    userRole === 'Coordinator' ||
    !userRole; // default coordinator in Res-QGIRD

  const handleDirections = (e) => {
    e.preventDefault();
    const { url } = routingService.getDirectionsUrl(
      { latitude: incident.latitude, longitude: incident.longitude, title: incident.title },
      userLocation ? { latitude: userLocation.latitude, longitude: userLocation.longitude } : null
    );
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const isResolved = incident.status === 'Resolved';
  const hasTeam = Boolean(incident.assignedTeamId || incident.team);
  const isActiveRouting = activeRoutingIncidentId === incident.id;
  const hasCoords =
    typeof incident.latitude === 'number' && typeof incident.longitude === 'number';

  return (
    <div className="popup-container">
      <div className="popup-header">
        <div>
          <span className="popup-id">{incident.id}</span>
          <h4 className="popup-title">{incident.title || `${incident.type} Incident`}</h4>
        </div>
        <Badge severity={incident.severity?.toLowerCase() || 'medium'} />
      </div>

      <div className="popup-grid">
        <div className="popup-item">
          <span className="popup-label">Type</span>
          <span className="popup-val">{incident.type}</span>
        </div>
        <div className="popup-item">
          <span className="popup-label">Status</span>
          <span className="popup-val">{incident.status}</span>
        </div>
        <div className="popup-item">
          <span className="popup-label">Affected</span>
          <span className="popup-val">
            {(incident.affectedPeople || incident.affected || 0).toLocaleString()} people
          </span>
        </div>
        <div className="popup-item">
          <span className="popup-label">Assigned Team</span>
          <span className="popup-val" style={{ color: hasTeam ? '#2E8B57' : 'inherit' }}>
            {incident.team || incident.assignedTeamId || 'Unassigned'}
          </span>
        </div>
      </div>

      <div className="popup-item" style={{ marginBottom: '6px' }}>
        <span className="popup-label">Address</span>
        <span className="popup-val" style={{ fontSize: '12px' }}>
          {incident.address || incident.location || `${incident.latitude?.toFixed(4)}, ${incident.longitude?.toFixed(4)}`}
        </span>
      </div>

      {incident.description && (
        <div className="popup-desc">
          {incident.description}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--ink-muted)' }}>
        <span>Reported: {incident.time || new Date(incident.reportedAt).toLocaleTimeString()}</span>
        <span>Priority: P{incident.priority || 1}</span>
      </div>

      <div className="popup-actions">
        <button
          type="button"
          className="popup-btn popup-btn-primary"
          onClick={() => onOpenDrawer('incident', incident.id)}
        >
          View Incident
        </button>

        {/* Select for Routing — activates the routing controls panel for this incident */}
        {hasCoords && onSelectForRouting && (
          <button
            type="button"
            className={`popup-btn${isActiveRouting ? ' popup-btn-accent' : ''}`}
            onClick={() => onSelectForRouting(incident.id)}
            title={
              isActiveRouting
                ? 'This incident is selected for routing'
                : 'Select for routing & nearest hospital search'
            }
            style={isActiveRouting ? {} : { borderColor: '#2F6FE0', color: '#2F6FE0' }}
          >
            {isActiveRouting ? '✓ Routing Active' : '🗺 Select for Routing'}
          </button>
        )}

        <button
          type="button"
          className="popup-btn"
          onClick={handleDirections}
          title={userLocation ? 'Directions from your GPS location' : 'View on external map'}
        >
          Directions ↗
        </button>

        {isCoordinatorOrAdmin && !isResolved && (
          <>
            {!hasTeam && onAssignTeam && (
              <button
                type="button"
                className="popup-btn popup-btn-accent"
                onClick={() => onAssignTeam(incident.id)}
              >
                Assign Team
              </button>
            )}
            {onUpdateStatus && (
              <button
                type="button"
                className="popup-btn"
                onClick={() => onUpdateStatus(incident.id)}
              >
                Advance Status
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
