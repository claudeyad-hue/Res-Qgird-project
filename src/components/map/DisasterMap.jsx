import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet';
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
import { createHospitalIcon, createResourceIcon } from './mapIcons';
import RouteLayer from './RouteLayer';
import RoutingControls from './RoutingControls';
import RoutingPanel from './RoutingPanel';
import {
  GHAZIABAD_CONFIG,
  isPointInOperationalArea,
  fetchOSRMRoute,
  findNearestHospital,
} from '../../utils/geoUtils';

// Fix default Leaflet icon paths in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Ghaziabad Initial Geographic Scope
const DEFAULT_CENTER = GHAZIABAD_CONFIG.center; // [28.6692, 77.4538]
const DEFAULT_ZOOM = GHAZIABAD_CONFIG.defaultZoom; // 12

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
    resources = [],
    drawer,
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
  const [outOfAreaNotice, setOutOfAreaNotice] = useState(null);

  // ── Routing State ────────────────────────────────────────────────────────
  const [routingIncidentId, setRoutingIncidentId] = useState(null);
  const [incidentRoute, setIncidentRoute] = useState(null);
  const [hospitalRoute, setHospitalRoute] = useState(null);
  const [nearestHospital, setNearestHospital] = useState(null);
  const [isLoadingIncident, setIsLoadingIncident] = useState(false);
  const [isLoadingHospital, setIsLoadingHospital] = useState(false);
  const [isLoadingNearest, setIsLoadingNearest] = useState(false);

  // Automatically sync routing incident when an incident is opened in drawer
  useEffect(() => {
    if (drawer?.isOpen && drawer?.type === 'incident' && drawer?.id) {
      setRoutingIncidentId((prev) => (prev === drawer.id ? prev : drawer.id));
    }
  }, [drawer?.isOpen, drawer?.type, drawer?.id]);

  // Operational Filter: Only records within the configured Ghaziabad operational area
  const inAreaIncidents = useMemo(() => {
    return incidents.filter((inc) => isPointInOperationalArea(inc));
  }, [incidents]);

  const inAreaHospitals = useMemo(() => {
    return hospitals.filter((hosp) => isPointInOperationalArea(hosp));
  }, [hospitals]);

  const inAreaResources = useMemo(() => {
    return resources.filter((res) => isPointInOperationalArea(res));
  }, [resources]);

  const inAreaTeams = useMemo(() => {
    return teams.filter((t) => isPointInOperationalArea(t));
  }, [teams]);

  // Active routing incident reference
  const routingIncident = useMemo(() => {
    if (!routingIncidentId) return null;
    return inAreaIncidents.find((i) => i.id === routingIncidentId) || null;
  }, [routingIncidentId, inAreaIncidents]);

  // Filter incidents according to query and user filters
  const filteredIncidents = useMemo(() => {
    const nowMs = Date.now();
    return inAreaIncidents.filter((inc) => {
      // 1. Text search
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
        const diffMs = nowMs - repTime;
        const diffHours = diffMs / 3600000;
        if (diffHours > thresholdHours) return false;
      }

      return true;
    });
  }, [inAreaIncidents, searchQuery, activeFilter, severityFilter, statusFilter, timeRangeFilter]);

  // Browser Geolocation Handler with Ghaziabad Boundary Validation
  const handleLocateMe = useCallback(() => {
    if (!('geolocation' in navigator)) {
      showToast('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    showToast('Requesting GPS location from browser…');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude, accuracy } = pos.coords;
        const isInside = isPointInOperationalArea({ latitude, longitude });

        if (isInside) {
          const validLocation = {
            latitude,
            longitude,
            accuracy,
            inOperationalArea: true,
          };
          setUserLocation(validLocation);
          setOutOfAreaNotice(null);

          if (mapInstance) {
            mapInstance.flyTo([latitude, longitude], 14, { duration: 1.2 });
          }
          showToast(`Location verified within Ghaziabad (±${Math.round(accuracy)}m). Ready for dispatch routing.`);
        } else {
          // Reject out-of-area location strictly: do not fabricate or route from outside Ghaziabad
          setUserLocation(null);
          const errText = `Your current location (${latitude.toFixed(4)}, ${longitude.toFixed(4)}) is outside the active operational response area (${GHAZIABAD_CONFIG.name}). Navigation is only supported within Ghaziabad.`;
          setOutOfAreaNotice({
            message: errText,
            latitude,
            longitude,
          });
          showToast(errText);
        }
      },
      (err) => {
        setIsLocating(false);
        let msg = 'Could not obtain location.';
        if (err.code === 1) {
          msg = 'Location permission was denied. Please allow location access in your browser.';
        } else if (err.code === 2) {
          msg = 'GPS position is currently unavailable.';
        } else if (err.code === 3) {
          msg = 'Location request timed out. Please try again.';
        }
        showToast(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [mapInstance, setUserLocation, showToast]);

  // Demonstration helper: Set simulated in-area location for evaluation when physically outside Ghaziabad
  const handleSimulateGhaziabadLocation = useCallback(() => {
    const demoLocation = {
      latitude: 28.6410,
      longitude: 77.3750,
      accuracy: 12,
      isSimulatedDemo: true,
      inOperationalArea: true,
    };
    setUserLocation(demoLocation);
    setOutOfAreaNotice(null);

    if (mapInstance) {
      mapInstance.flyTo([demoLocation.latitude, demoLocation.longitude], 14, { duration: 1.2 });
    }
    showToast('Simulated demonstration origin set at Ghaziabad Incident Command Hub (Indirapuram). Ready for routing.');
  }, [mapInstance, setUserLocation, showToast]);

  // ── Routing Handlers ─────────────────────────────────────────────────────

  const handleClearRoutes = useCallback(() => {
    setIncidentRoute(null);
    setHospitalRoute(null);
    setNearestHospital(null);
    setRoutingIncidentId(null);
  }, []);

  const handleSelectIncidentForRouting = useCallback((incidentId) => {
    if (routingIncidentId !== incidentId) {
      setIncidentRoute(null);
      setHospitalRoute(null);
      setNearestHospital(null);
    }
    setRoutingIncidentId(incidentId);
  }, [routingIncidentId]);

  // Route A: User location → Selected incident
  const handleRouteToIncident = useCallback(async () => {
    if (!userLocation || !userLocation.inOperationalArea) {
      showToast('A valid location within Ghaziabad is required to calculate driving routes.');
      return;
    }
    if (!routingIncident) {
      showToast('Please select a Ghaziabad incident first.');
      return;
    }
    if (isLoadingIncident) return;

    setIsLoadingIncident(true);
    showToast('Calculating road route to incident (OSRM engine)…');

    const result = await fetchOSRMRoute(
      { latitude: userLocation.latitude, longitude: userLocation.longitude },
      { latitude: routingIncident.latitude, longitude: routingIncident.longitude }
    );

    setIncidentRoute(result);
    setIsLoadingIncident(false);

    if (result.status === 'ok') {
      showToast(`Road route ready — ${result.distanceKm} km · ${result.durationMin} min ETA`);
      if (mapInstance && result.coordinates.length > 1) {
        try {
          const bounds = L.latLngBounds(result.coordinates);
          mapInstance.fitBounds(bounds, { padding: [60, 80], animate: true });
        } catch { /* ignore */ }
      }
    } else {
      showToast(result.message || 'Road routing service failed to calculate route.');
    }
  }, [userLocation, routingIncident, isLoadingIncident, mapInstance, showToast]);

  // Find Nearest Suitable Hospital to Incident
  const handleFindNearestHospital = useCallback(() => {
    if (!routingIncident) {
      showToast('Please select an incident first to find the nearest suitable hospital.');
      return;
    }
    if (isLoadingNearest) return;

    setIsLoadingNearest(true);
    showToast('Calculating nearest eligible hospital inside Ghaziabad…');

    setTimeout(() => {
      const result = findNearestHospital(
        { latitude: routingIncident.latitude, longitude: routingIncident.longitude },
        inAreaHospitals,
        GHAZIABAD_CONFIG
      );
      setIsLoadingNearest(false);

      if (result) {
        setNearestHospital(result);
        setHospitalRoute(null);
        showToast(
          `Nearest eligible hospital: ${result.hospital.name} (${result.distance} km straight-line distance).`
        );
      } else {
        showToast('No eligible operational hospitals available within the Ghaziabad boundary.');
      }
    }, 500);
  }, [routingIncident, isLoadingNearest, inAreaHospitals, showToast]);

  // Route B: Incident → Selected suitable hospital
  const handleRouteToHospital = useCallback(async () => {
    if (!routingIncident) {
      showToast('Please select an incident first.');
      return;
    }
    if (!nearestHospital?.hospital) {
      showToast('Please find the nearest suitable hospital first.');
      return;
    }
    if (isLoadingHospital) return;

    setIsLoadingHospital(true);
    showToast('Calculating road route from incident to hospital (OSRM engine)…');

    const result = await fetchOSRMRoute(
      { latitude: routingIncident.latitude, longitude: routingIncident.longitude },
      { latitude: nearestHospital.hospital.latitude, longitude: nearestHospital.hospital.longitude }
    );

    setHospitalRoute(result);
    setIsLoadingHospital(false);

    if (result.status === 'ok') {
      showToast(`Hospital road route ready — ${result.distanceKm} km · ${result.durationMin} min ETA`);
      if (mapInstance && result.coordinates.length > 1) {
        try {
          const bounds = L.latLngBounds(result.coordinates);
          mapInstance.fitBounds(bounds, { padding: [60, 80], animate: true });
        } catch { /* ignore */ }
      }
    } else {
      showToast(result.message || 'Hospital road routing service unavailable.');
    }
  }, [routingIncident, nearestHospital, isLoadingHospital, mapInstance, showToast]);

  const handleMapClick = (coords) => {
    if (isPickingLocation && onPickLocation) {
      onPickLocation(coords);
    }
  };

  const handleOpenDrawer = useCallback(
    (type, id) => {
      if (mapInstance) {
        mapInstance.closePopup();
      }
      openDrawer(type, id);
    },
    [mapInstance, openDrawer]
  );

  const hospitalIcon = useMemo(() => createHospitalIcon(), []);

  return (
    <div
      ref={mapWrapperRef}
      className={`disaster-map-wrapper variant-${variant} ${drawer?.isOpen ? 'has-drawer-open' : ''} ${className}`}
      role="region"
      aria-label="Ghaziabad interactive disaster response map"
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
          <span>🎯 Click anywhere within Ghaziabad to set incident coordinates.</span>
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

      {/* Out-of-Area Geolocation Notice Banner */}
      {outOfAreaNotice && (
        <div
          style={{
            position: 'absolute',
            top: isPickingLocation ? '50px' : '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1002,
            background: '#ffffff',
            border: '2px solid var(--critical)',
            borderRadius: '10px',
            boxShadow: '0 6px 24px rgba(0,0,0,0.2)',
            padding: '12px 18px',
            maxWidth: '560px',
            width: '90%',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
            <div style={{ fontSize: '13px', color: 'var(--critical)', fontWeight: 600, lineHeight: 1.4 }}>
              📍 <strong>Location Outside Operational Boundary:</strong>
              <div style={{ fontSize: '12px', color: 'var(--ink)', fontWeight: 400, marginTop: '4px' }}>
                {outOfAreaNotice.message}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOutOfAreaNotice(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: 'var(--ink-muted)' }}
              title="Dismiss warning"
            >
              ✕
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--ink-muted)' }}>Evaluating outside Ghaziabad?</span>
            <button
              type="button"
              className="btn-primary"
              style={{ fontSize: '11.5px', height: '28px', padding: '0 10px' }}
              onClick={handleSimulateGhaziabadLocation}
            >
              Simulate In-Area Location (Ghaziabad)
            </button>
          </div>
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
        {/* OpenStreetMap Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Operational Boundary Polygon Overlay for Ghaziabad */}
        <Polygon
          positions={GHAZIABAD_CONFIG.boundaryPolygon}
          pathOptions={{
            color: '#2F6FE0',
            weight: 2.5,
            dashArray: '8, 6',
            fillColor: '#2F6FE0',
            fillOpacity: 0.04,
          }}
        >
          <Popup>
            <div style={{ padding: '4px 6px' }}>
              <strong style={{ color: '#2F6FE0' }}>Ghaziabad Operational Boundary</strong>
              <p style={{ margin: '4px 0 0 0', fontSize: '11.5px', color: 'var(--ink-muted)' }}>
                Active Disaster Management Scope: Ghaziabad District & Municipal Zone.
              </p>
            </div>
          </Popup>
        </Polygon>

        {/* Map Click Events Handler */}
        <MapClickHandler onMapClick={handleMapClick} isPickingLocation={isPickingLocation} />

        {/* Floating Controls */}
        <MapControls
          onLocateMe={handleLocateMe}
          isLocating={isLocating}
          incidents={filteredIncidents}
          mapWrapperRef={mapWrapperRef}
        />

        {/* Layer 1: Disaster Zones */}
        {mapLayers.zones && zones.map((zone) => (
          <DisasterZoneOverlay key={zone.zoneId} zone={zone} />
        ))}

        {/* Layer 2: Incident Density */}
        {mapLayers.density && (
          <IncidentDensityOverlay incidents={filteredIncidents} />
        )}

        {/* Layer 3: Hospitals */}
        {mapLayers.hospitals && inAreaHospitals.map((hosp) => {
          if (typeof hosp.latitude !== 'number' || typeof hosp.longitude !== 'number') return null;
          return (
            <Marker
              key={hosp.id}
              position={[hosp.latitude, hosp.longitude]}
              icon={hospitalIcon}
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
                  <div className="popup-actions" style={{ flexDirection: 'column', gap: '6px' }}>
                    <button
                      type="button"
                      className="popup-btn popup-btn-primary"
                      style={{ width: '100%' }}
                      onClick={() => handleOpenDrawer('hospital', hosp.id)}
                    >
                      View Hospital Details →
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Layer 4: Response Teams */}
        {mapLayers.teams && inAreaTeams.map((team) => (
          <ResponseTeamMarker
            key={team.teamId}
            team={team}
            onSelectIncident={(id) => handleOpenDrawer('incident', id)}
          />
        ))}

        {/* Layer 5: User GPS Location Marker */}
        {userLocation && (
          <UserLocationMarker location={userLocation} />
        )}

        {/* Layer 6: Incidents with Supercluster */}
        {mapLayers.incidents && (
          <IncidentClusters
            incidents={filteredIncidents}
            userLocation={userLocation}
            onOpenDrawer={handleOpenDrawer}
            onAssignTeam={assignTeam}
            onUpdateStatus={updateIncidentStatus}
            userRole={user?.role}
            onSelectForRouting={handleSelectIncidentForRouting}
            activeRoutingIncidentId={routingIncidentId}
          />
        )}

        {/* Layer 7: Emergency Resources */}
        {mapLayers.resources && inAreaResources.map((res) => {
          if (typeof res.latitude !== 'number' || typeof res.longitude !== 'number') return null;
          return (
            <Marker
              key={res.id}
              position={[res.latitude, res.longitude]}
              icon={createResourceIcon(res.type, res.status)}
            >
              <Popup>
                <div className="popup-container" style={{ minWidth: '200px' }}>
                  <div className="popup-header">
                    <div>
                      <span className="popup-id">{res.id}</span>
                      <h4 className="popup-title">{res.type}</h4>
                    </div>
                  </div>
                  <div className="popup-grid">
                    <div className="popup-item">
                      <span className="popup-label">Status</span>
                      <span className="popup-val" style={{ textTransform: 'capitalize' }}>{res.status}</span>
                    </div>
                    <div className="popup-item">
                      <span className="popup-label">Stock / Quantity</span>
                      <span className="popup-val">{res.amount} {res.unit}</span>
                    </div>
                  </div>
                  <div className="popup-item">
                    <span className="popup-label">Depot Location</span>
                    <span className="popup-val" style={{ fontSize: '12px' }}>{res.location}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Layer 8: Active Route Polylines */}
        <RouteLayer
          incidentRoute={incidentRoute}
          hospitalRoute={hospitalRoute}
          incident={routingIncident}
          hospital={nearestHospital?.hospital || null}
        />

        {/* Routing Action Controls */}
        <RoutingControls
          userLocation={userLocation}
          onUseMyLocation={handleLocateMe}
          onSimulateGhaziabadLocation={handleSimulateGhaziabadLocation}
          isLocating={isLocating}
          incidents={filteredIncidents}
          selectedIncident={routingIncident}
          onSelectIncident={handleSelectIncidentForRouting}
          nearestHospital={nearestHospital}
          incidentRoute={incidentRoute}
          hospitalRoute={hospitalRoute}
          isLoadingIncident={isLoadingIncident}
          isLoadingHospital={isLoadingHospital}
          isLoadingNearest={isLoadingNearest}
          onRouteToIncident={handleRouteToIncident}
          onFindNearestHospital={handleFindNearestHospital}
          onRouteToHospital={handleRouteToHospital}
          onClearRoutes={handleClearRoutes}
        />
      </MapContainer>

      {/* Layer Toggles Panel */}
      {variant === 'full' && (
        <LayerPanel layers={mapLayers} onToggleLayer={toggleMapLayer} />
      )}

      {/* Routing Info Panel */}
      <RoutingPanel
        incidentRoute={incidentRoute}
        hospitalRoute={hospitalRoute}
        incidentName={routingIncident?.title || routingIncident?.type || ''}
        hospitalName={nearestHospital?.hospital?.name || ''}
        nearestHospital={nearestHospital}
        isLoadingIncident={isLoadingIncident}
        isLoadingHospital={isLoadingHospital}
        isLoadingNearest={isLoadingNearest}
        onClearRoutes={handleClearRoutes}
      />

      {/* Live Status Bar */}
      <div className="map-live-status">
        <span className={`status-dot ${isPolling ? 'polling' : ''}`} />
        <span>
          {isPolling ? 'Refreshing…' : lastUpdated ? `Updated ${lastUpdated}` : 'Live System Ready'}
        </span>
        <span style={{ opacity: 0.5 }}>|</span>
        <span style={{ color: 'var(--ink)' }}>
          {filteredIncidents.length} Ghaziabad incidents
        </span>
        <span style={{ opacity: 0.5 }}>|</span>
        <span style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>
          Area: Ghaziabad, UP
        </span>
      </div>
    </div>
  );
}
