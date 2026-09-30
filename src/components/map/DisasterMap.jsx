import React, { useState, useRef, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import '../../styles/map.css';

import { useApp } from '../../context/AppContext';
import IncidentClusters from './IncidentClusters';
import UserLocationMarker from './UserLocationMarker';
import ResponseTeamMarker from './ResponseTeamMarker';
import DisasterZoneOverlay from './DisasterZoneOverlay';
import IncidentDensityOverlay from './IncidentDensityOverlay';
import MapControls from './MapControls';
import LayerPanel from './LayerPanel';
import MapClickHandler from './MapClickHandler';
import { createHospitalIcon } from './mapIcons';

// Fix potential default Leaflet icon paths in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Center on India (Section C)
const DEFAULT_CENTER = [20.5937, 78.9629];
const DEFAULT_ZOOM = 5;

export default function DisasterMap({
  variant = 'full', // 'full' | 'mini'
  searchQuery = '',
  activeFilter = 'all',
  severityFilter = 'all',
  statusFilter = 'all',
  timeRangeFilter = 'all',
  onPickLocation = null,
  isPickingLocation = false,
  className = '',
}) {
  const {
    incidents,
    hospitals,
    openDrawer,
    assignTeam,
    updateIncidentStatus,
    user,
    userLocation,
    setUserLocation,
    showToast,
    teams = [],
    zones = [],
    mapLayers,
    toggleMapLayer,
    lastUpdated,
    isPolling,
  } = useApp();

  const mapWrapperRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  // Filter incidents according to query and filters (Section J)
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      // 1. Text search by ID, title, type, address
      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        const text = `${inc.id || ''} ${inc.title || ''} ${inc.type || ''} ${inc.address || inc.location || ''}`.toLowerCase();
        if (!text.includes(q)) return false;
      }

      // 2. Active chip filter
      if (activeFilter !== 'all') {
        if (activeFilter === 'Critical') {
          if (String(inc.severity).toLowerCase() !== 'critical') return false;
        } else if (activeFilter === 'Resolved') {
          if (String(inc.status).toLowerCase() !== 'resolved') return false;
        } else {
          if (inc.type !== activeFilter) return false;
        }
      }

      // 3. Severity filter
      if (severityFilter && severityFilter !== 'all') {
        if (String(inc.severity).toLowerCase() !== severityFilter.toLowerCase()) return false;
      }

      // 4. Status filter
      if (statusFilter && statusFilter !== 'all') {
        if (String(inc.status).toLowerCase() !== statusFilter.toLowerCase()) return false;
      }

      // 5. Time range filter
      if (timeRangeFilter && timeRangeFilter !== 'all') {
        const thresholdHours =
          timeRangeFilter === '1h' ? 1 : timeRangeFilter === '6h' ? 6 : timeRangeFilter === '24h' ? 24 : 168;
        const repTime = new Date(inc.reportedAt || inc.updatedAt || 0).getTime();
        const diffMs = (Number(new Date()) - repTime);
        const diffHours = diffMs / 3600000;
        if (diffHours > thresholdHours) return false;
      }

      return true;
    });
  }, [incidents, searchQuery, activeFilter, severityFilter, statusFilter, timeRangeFilter]);

  // Locate Me Handler (Section D)
  const handleLocateMe = useCallback(() => {
    if (!('geolocation' in navigator)) {
      showToast('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    showToast('Requesting GPS location…');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude, accuracy } = pos.coords;
        const newLocation = { latitude, longitude, accuracy };
        setUserLocation(newLocation);

        if (mapInstance) {
          mapInstance.flyTo([latitude, longitude], 14, { duration: 1.2 });
        }
        showToast(`Located: ±${Math.round(accuracy)}m accuracy.`);
      },
      (err) => {
        setIsLocating(false);
        let msg = 'Could not obtain location.';
        if (err.code === 1) msg = 'Location access was denied.';
        else if (err.code === 2) msg = 'GPS position is currently unavailable.';
        else if (err.code === 3) msg = 'GPS request timed out.';
        showToast(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [mapInstance, setUserLocation, showToast]);

  // Handle map clicks when in picking mode
  const handleMapClick = (coords) => {
    if (isPickingLocation && onPickLocation) {
      onPickLocation(coords);
    }
  };

  // Hospital click helper
  const hospitalIcon = useMemo(() => createHospitalIcon(), []);

  return (
    <div
      ref={mapWrapperRef}
      className={`disaster-map-wrapper variant-${variant} ${className}`}
      role="region"
      aria-label="Interactive disaster response map"
    >
      {/* Location Picker Banner */}
      {isPickingLocation && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1001,
            background: 'var(--critical)',
            color: '#ffffff',
            padding: '10px 18px',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
          }}
        >
          <span>🎯 Click anywhere on the map to set the incident location coordinates.</span>
          <button
            type="button"
            className="btn-secondary"
            style={{ height: '30px', padding: '0 10px', fontSize: '11px', background: '#fff', color: '#10161D' }}
            onClick={() => onPickLocation(null)}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Map Container */}
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        className="disaster-map-container"
        zoomControl={false}
        ref={setMapInstance}
        attributionControl
      >
        {/* OpenStreetMap Tiles with proper attribution (Section A) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Map Click Events Handler */}
        <MapClickHandler onMapClick={handleMapClick} isPickingLocation={isPickingLocation} />

        {/* Floating Controls (Locate Me, Fit, Reset, Fullscreen, Zoom) */}
        <MapControls
          onLocateMe={handleLocateMe}
          isLocating={isLocating}
          incidents={filteredIncidents}
          mapWrapperRef={mapWrapperRef}
        />

        {/* Layer 1: Disaster Zones (Section Q) */}
        {mapLayers.zones && zones.map((zone) => (
          <DisasterZoneOverlay key={zone.zoneId} zone={zone} />
        ))}

        {/* Layer 2: Incident Density (Section R) */}
        {mapLayers.density && (
          <IncidentDensityOverlay incidents={filteredIncidents} />
        )}

        {/* Layer 3: Hospitals */}
        {mapLayers.hospitals && hospitals && hospitals.map((hosp) => {
          if (typeof hosp.latitude !== 'number' || typeof hosp.longitude !== 'number') return null;
          return (
            <Marker
              key={hosp.id}
              position={[hosp.latitude, hosp.longitude]}
              icon={hospitalIcon}
              eventHandlers={{
                click: () => openDrawer('hospital', hosp.id),
              }}
            >
              <Popup>
                <div className="popup-container">
                  <div className="popup-header">
                    <div>
                      <span className="popup-id">{hosp.id}</span>
                      <h4 className="popup-title">{hosp.name}</h4>
                    </div>
                  </div>
                  <div className="popup-grid">
                    <div className="popup-item">
                      <span className="popup-label">Beds Available</span>
                      <span className="popup-val">{hosp.bedsAvail} / {hosp.bedsTotal}</span>
                    </div>
                    <div className="popup-item">
                      <span className="popup-label">ICU Available</span>
                      <span className="popup-val">{hosp.icuAvail} / {hosp.icuTotal}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="popup-btn popup-btn-primary"
                    style={{ marginTop: '8px', width: '100%' }}
                    onClick={() => openDrawer('hospital', hosp.id)}
                  >
                    View Hospital Details →
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Layer 4: Response Teams (Section N) */}
        {mapLayers.teams && teams.map((team) => (
          <ResponseTeamMarker
            key={team.teamId}
            team={team}
            onSelectIncident={(id) => openDrawer('incident', id)}
          />
        ))}

        {/* Layer 5: User GPS Location (Section D) */}
        {userLocation && (
          <UserLocationMarker location={userLocation} />
        )}

        {/* Layer 6: Incidents with Supercluster (Section K, E, F, G, H, I) */}
        {mapLayers.incidents && (
          <IncidentClusters
            incidents={filteredIncidents}
            userLocation={userLocation}
            onOpenDrawer={openDrawer}
            onAssignTeam={assignTeam}
            onUpdateStatus={updateIncidentStatus}
            userRole={user?.role}
          />
        )}
      </MapContainer>

      {/* Layer Toggles Panel (Section S) */}
      {variant === 'full' && (
        <LayerPanel layers={mapLayers} onToggleLayer={toggleMapLayer} />
      )}

      {/* Live Polling Status Bar (Section W) */}
      <div className="map-live-status">
        <span className={`status-dot ${isPolling ? 'polling' : ''}`} />
        <span>
          {isPolling ? 'Refreshing feed…' : lastUpdated ? `Updated ${lastUpdated}` : 'Live System Ready'}
        </span>
        <span style={{ opacity: 0.5 }}>|</span>
        <span style={{ color: 'var(--ink)' }}>{filteredIncidents.length} active incidents</span>
      </div>
    </div>
  );
}
