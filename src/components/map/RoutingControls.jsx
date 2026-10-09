import React from 'react';

/**
 * RoutingControls — Context-aware Ghaziabad routing actions (Section 16).
 * Controls:
 *   [ Use My Location ] (Browser Geolocation API)
 *   [ Select Incident ] (Quick dropdown & map marker selection)
 *   [ Route to Incident ] (Route A: User -> Incident)
 *   [ Find Nearest Suitable Hospital ] (Dynamic Haversine triage)
 *   [ Route to Hospital ] (Route B: Incident -> Hospital)
 *   [ Clear Routes ]
 */
export default function RoutingControls({
  userLocation,
  onUseMyLocation,
  onSimulateGhaziabadLocation,
  isLocating,
  incidents = [],
  selectedIncident,
  onSelectIncident,
  nearestHospital,
  incidentRoute,
  hospitalRoute,
  isLoadingIncident,
  isLoadingHospital,
  isLoadingNearest,
  onRouteToIncident,
  onFindNearestHospital,
  onRouteToHospital,
  onClearRoutes,
}) {

  const hasUserLocation = Boolean(userLocation?.latitude && userLocation?.longitude && userLocation?.inOperationalArea);
  const hasIncident = Boolean(
    selectedIncident &&
    typeof selectedIncident.latitude === 'number' &&
    typeof selectedIncident.longitude === 'number'
  );
  const hasNearestHospital = Boolean(nearestHospital?.hospital);
  const hasAnyActive = incidentRoute || hospitalRoute || nearestHospital;

  return (
    <div
      className="map-routing-controls"
      aria-label="Ghaziabad disaster routing and hospital triage controls"
    >
      {/* 1. Incident Quick-Selector */}
      <div className="routing-control-card">
        <label
          htmlFor="incident-select"
          style={{
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--ink-muted)',
            fontWeight: 700,
            display: 'block',
            marginBottom: '4px',
          }}
        >
          Selected Ghaziabad Incident
        </label>
        <select
          id="incident-select"
          className="routing-incident-select"
          value={selectedIncident?.id || ''}
          onChange={(e) => onSelectIncident(e.target.value)}
          style={{
            width: '100%',
            padding: '6px 8px',
            borderRadius: '6px',
            border: '1px solid var(--line)',
            background: 'var(--surface)',
            color: 'var(--ink)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <option value="">-- Choose Incident to Route --</option>
          {incidents
            .filter((i) => typeof i.latitude === 'number' && typeof i.longitude === 'number')
            .map((inc) => (
              <option key={inc.id} value={inc.id}>
                {inc.id}: {inc.type} — {inc.title ? inc.title.slice(0, 24) : inc.location}
              </option>
            ))}
        </select>
      </div>

      {/* 2. Geolocation Control */}
      {!hasUserLocation ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <button
            type="button"
            className={`map-control-btn routing-btn${isLocating ? ' routing-btn-active' : ''}`}
            onClick={onUseMyLocation}
            disabled={isLocating}
            title="Request current GPS location via browser Geolocation API"
            aria-label="Use My Location"
          >
            <span style={{ fontSize: '14px' }}>🎯</span>
            <span>{isLocating ? 'Locating GPS…' : 'Use My Location'}</span>
          </button>
          {onSimulateGhaziabadLocation && (
            <button
              type="button"
              className="link-btn"
              onClick={onSimulateGhaziabadLocation}
              style={{
                fontSize: '11px',
                color: 'var(--primary)',
                textAlign: 'center',
                padding: '2px',
                fontWeight: 600,
              }}
              title="Set simulated demonstration location inside Ghaziabad for remote evaluation"
            >
              Demo Location (Ghaziabad HQ) ↺
            </button>
          )}
        </div>
      ) : (
        <div
          style={{
            fontSize: '11px',
            padding: '6px 10px',
            borderRadius: '6px',
            background: 'var(--surface-2)',
            border: '1px solid var(--line)',
            color: 'var(--ink)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>📍 Origin: Ghaziabad ({userLocation.latitude.toFixed(3)}, {userLocation.longitude.toFixed(3)})</span>
          <button
            type="button"
            className="link-btn"
            style={{ fontSize: '11px', color: 'var(--primary)' }}
            onClick={onUseMyLocation}
            title="Re-acquire GPS location"
          >
            Update
          </button>
        </div>
      )}

      {/* Context Hint */}
      {hasIncident && !hasUserLocation && (
        <div className="routing-hint routing-hint-warn">
          <span>📍 Acquire in-area location to enable Route to Incident</span>
        </div>
      )}

      {/* 3. [ Route to Incident ] button */}
      <button
        type="button"
        className={`map-control-btn routing-btn${incidentRoute && !isLoadingIncident ? ' routing-btn-active' : ''}`}
        onClick={onRouteToIncident}
        disabled={isLoadingIncident || !hasUserLocation || !hasIncident}
        title={
          !hasIncident
            ? 'Select a Ghaziabad incident first'
            : !hasUserLocation
            ? 'Acquire location in Ghaziabad first'
            : isLoadingIncident
            ? 'Calculating road route…'
            : `Calculate road route to ${selectedIncident.title || selectedIncident.type}`
        }
        aria-label="Route to Incident"
      >
        <span style={{ fontSize: '13px' }}>🚨</span>
        <span>
          {isLoadingIncident
            ? 'Routing to Incident…'
            : incidentRoute && incidentRoute.status === 'ok'
            ? `Route to Incident (${incidentRoute.distanceKm} km)`
            : 'Route to Incident'}
        </span>
      </button>

      {/* 4. [ Find Nearest Suitable Hospital ] button */}
      <button
        type="button"
        className={`map-control-btn routing-btn${hasNearestHospital && !isLoadingNearest ? ' routing-btn-hospital' : ''}`}
        onClick={onFindNearestHospital}
        disabled={isLoadingNearest || !hasIncident}
        title={
          !hasIncident
            ? 'Select an incident first to find nearest hospital'
            : isLoadingNearest
            ? 'Finding nearest hospital…'
            : 'Rank eligible Ghaziabad hospitals dynamically by Haversine distance'
        }
        aria-label="Find Nearest Suitable Hospital"
      >
        <span style={{ fontSize: '13px' }}>🏥</span>
        <span>
          {isLoadingNearest
            ? 'Ranking Hospitals…'
            : hasNearestHospital
            ? `Nearest: ${nearestHospital.hospital.name.slice(0, 15)}… (${nearestHospital.distance} km)`
            : 'Find Nearest Suitable Hospital'}
        </span>
      </button>

      {/* 5. [ Route to Hospital ] button */}
      <button
        type="button"
        className={`map-control-btn routing-btn${hospitalRoute && !isLoadingHospital ? ' routing-btn-hospital routing-btn-active' : ''}`}
        onClick={onRouteToHospital}
        disabled={isLoadingHospital || !hasNearestHospital || !hasIncident}
        title={
          !hasNearestHospital
            ? 'Find nearest hospital first'
            : isLoadingHospital
            ? 'Calculating road route to hospital…'
            : `Calculate road route to ${nearestHospital.hospital.name}`
        }
        aria-label="Route to Hospital"
      >
        <span style={{ fontSize: '13px' }}>🚑</span>
        <span>
          {isLoadingHospital
            ? 'Routing to Hospital…'
            : hospitalRoute && hospitalRoute.status === 'ok'
            ? `Route to Hospital (${hospitalRoute.distanceKm} km)`
            : 'Route to Hospital'}
        </span>
      </button>

      {/* 6. [ Clear Routes ] button */}
      {hasAnyActive && (
        <button
          type="button"
          className="map-control-btn routing-btn routing-btn-clear"
          onClick={onClearRoutes}
          title="Clear all active route polylines and triage states"
          aria-label="Clear Routes"
        >
          <span style={{ fontSize: '12px' }}>✕</span>
          <span>Clear Routes</span>
        </button>
      )}
    </div>
  );
}
