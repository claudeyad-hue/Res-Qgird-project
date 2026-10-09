import React from 'react';
import { Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

/**
 * RouteLayer — Renders verified road route polylines on the Leaflet map.
 * Supports two concurrent routes:
 *   incidentRoute: user location → incident (blue #2F6FE0)
 *   hospitalRoute: incident → nearest hospital (green #27AE60)
 *
 * Strict non-fabrication guarantee:
 * Only renders geometry when route.status === 'ok'. Never draws straight-line fallbacks.
 */
export default function RouteLayer({ incidentRoute, hospitalRoute, incident: _incident, hospital }) {
  return (
    <>
      {/* Route 1: User Location → Incident (Blue road polyline) */}
      {incidentRoute &&
        incidentRoute.status === 'ok' &&
        Array.isArray(incidentRoute.coordinates) &&
        incidentRoute.coordinates.length >= 2 && (
          <Polyline
            positions={incidentRoute.coordinates}
            pathOptions={{
              color: '#2F6FE0',
              weight: 5,
              opacity: 0.88,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        )}

      {/* Route 2: Incident → Hospital (Green road polyline) */}
      {hospitalRoute &&
        hospitalRoute.status === 'ok' &&
        Array.isArray(hospitalRoute.coordinates) &&
        hospitalRoute.coordinates.length >= 2 && (
          <Polyline
            positions={hospitalRoute.coordinates}
            pathOptions={{
              color: '#27AE60',
              weight: 5,
              opacity: 0.88,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        )}

      {/* Hospital destination pin when hospital route is active */}
      {hospitalRoute &&
        hospitalRoute.status === 'ok' &&
        hospital &&
        typeof hospital.latitude === 'number' &&
        typeof hospital.longitude === 'number' && (
          <Marker
            position={[hospital.latitude, hospital.longitude]}
            icon={createRouteDestIcon('🏥', '#27AE60')}
          >
            <Popup>
              <div className="popup-container" style={{ minWidth: '200px' }}>
                <div className="popup-header">
                  <h4 className="popup-title" style={{ color: '#27AE60' }}>
                    🏥 Triage Destination
                  </h4>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                  {hospital.name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>
                  {hospitalRoute.distanceKm} km road distance · {hospitalRoute.durationMin} min ETA
                </div>
              </div>
            </Popup>
          </Marker>
        )}
    </>
  );
}

function createRouteDestIcon(emoji, color) {
  return L.divIcon({
    className: 'custom-route-dest-wrapper',
    html: `
      <div style="
        width: 34px; height: 34px;
        background: ${color};
        border: 3px solid #ffffff;
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 16px;
        box-shadow: 0 3px 10px rgba(0,0,0,0.28);
        animation: routeDestPulse 2s infinite;
      ">${emoji}</div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -20],
  });
}
