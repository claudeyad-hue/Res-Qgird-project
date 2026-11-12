import React, { lazy, Suspense, useState, useRef, useCallback, useMemo, useEffect } from 'react';
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
import WeatherWidget from './WeatherWidget';
import WeatherObservationsLayer from './WeatherObservationsLayer';
const ThreeDMap = lazy(() => import('./ThreeDMap'));
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

const INCIDENT_LAYER_MATCHERS = {
  incident_fire: (incident) => /fire/i.test(`${incident.type || ''} ${incident.title || ''} ${incident.description || incident.desc || ''}`),
  incident_flood: (incident) => /flood/i.test(`${incident.type || ''} ${incident.title || ''} ${incident.description || incident.desc || ''}`),
  incident_earthquake: (incident) => /earthquake/i.test(`${incident.type || ''} ${incident.title || ''} ${incident.description || incident.desc || ''}`),
  incident_landslide: (incident) => /landslide/i.test(`${incident.type || ''} ${incident.title || ''} ${incident.description || incident.desc || ''}`),
  incident_collapse: (incident) => /collapse/i.test(`${incident.type || ''} ${incident.title || ''} ${incident.description || incident.desc || ''}`),
  incident_road: (incident) => /road|accident|collision/i.test(`${incident.type || ''} ${incident.title || ''} ${incident.description || incident.desc || ''}`),
  incident_industrial: (incident) => /industrial/i.test(`${incident.type || ''} ${incident.title || ''} ${incident.description || incident.desc || ''}`),
  incident_chemical: (incident) => /chemical|hazmat|hazardous material/i.test(`${incident.type || ''} ${incident.title || ''} ${incident.description || incident.desc || ''}`),
  incident_missing: (incident) => /missing person/i.test(`${incident.type || ''} ${incident.title || ''} ${incident.description || incident.desc || ''}`),
  incident_unverified: (incident) => incident.verified === false || /unverified/i.test(incident.status || ''),
};

const BASEMAPS = {
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri — Source: Esri, Vantor, Earthstar Geographics, and the GIS User Community',
    maxZoom: 19,
  },
  satelliteLabels: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri — Source: Esri, Vantor, Earthstar Geographics, and the GIS User Community',
    maxZoom: 19,
    labelsUrl: 'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
  },
  terrain: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri — National Geographic, Esri, Garmin, HERE, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, increment P Corp.',
    maxZoom: 19,
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
  },
};

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
    setMapLayers,
    toggleMapLayer,
    lastUpdated,
    isPolling,
    demoMode,
    dataSources,
  } = useApp();

  const mapWrapperRef = useRef(null);
  const mapLibreRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [basemap, setBasemap] = useState('street');
  const [is3D, setIs3D] = useState(false);
  const [weatherObservation, setWeatherObservation] = useState(null);
  const weatherAvailable = Boolean(weatherObservation && !weatherObservation.isFallback);
  const [isLocating, setIsLocating] = useState(false);
  const [outOfAreaNotice, setOutOfAreaNotice] = useState(null);
  const handleWeatherChange = useCallback((weather) => setWeatherObservation(weather), []);
  const setMapLibreMap = useCallback((map) => { mapLibreRef.current = map; }, []);
  const handle3DFallback = useCallback(() => {
    setIs3D(false);
    showToast('3D could not start in this browser; returned to the working 2D map.');
  }, [showToast]);
  const fitMapToCoordinates = useCallback((coordinates) => {
    if (!Array.isArray(coordinates) || coordinates.length < 2) return;
    if (mapInstance) {
      try { mapInstance.fitBounds(L.latLngBounds(coordinates), { padding: [60, 80], animate: true }); } catch { /* invalid route geometry */ }
    } else if (mapLibreRef.current) {
      try {
        const bounds = L.latLngBounds(coordinates);
        mapLibreRef.current.fitBounds([[bounds.getWest(), bounds.getSouth()], [bounds.getEast(), bounds.getNorth()]], {
          padding: { top: 60, right: 80, bottom: 60, left: 80 }, duration: 800,
        });
      } catch { /* invalid route geometry */ }
    }
  }, [mapInstance]);

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

  const displayIncidents = useMemo(() => filteredIncidents.filter((incident) => (
    mapLayers.incidents && Object.entries(INCIDENT_LAYER_MATCHERS).every(([key, matches]) => (
      !matches(incident) || mapLayers[key] !== false
    ))
  )), [filteredIncidents, mapLayers]);

  const availableLayers = useMemo(() => {
    const hasGeoPoint = (record) => Number.isFinite(record.latitude) && Number.isFinite(record.longitude);
    const available = {
      hospitals: inAreaHospitals.some(hasGeoPoint),
      hospitals_government: inAreaHospitals.some((hospital) => hasGeoPoint(hospital) && hospital.ownership === 'government'),
      hospitals_private: inAreaHospitals.some((hospital) => hasGeoPoint(hospital) && hospital.ownership === 'private'),
      hospitals_unclassified: inAreaHospitals.some((hospital) => hasGeoPoint(hospital) && !['government', 'private'].includes(hospital.ownership)),
      hospital_emergency_listed: inAreaHospitals.some((hospital) => hasGeoPoint(hospital) && hospital.emergencyServiceListed === true),
      ambulances: inAreaResources.some((resource) => hasGeoPoint(resource) && /ambulance/i.test(resource.type || '')),
      resources: inAreaResources.some(hasGeoPoint),
      density: inAreaIncidents.length > 0,
      teams: inAreaTeams.length > 0,
      incidents: inAreaIncidents.length > 0,
      zones: zones.length > 0,
      zones_flood: zones.some((zone) => String(zone.type).toLowerCase() === 'flood'),
      zones_evacuation: zones.some((zone) => String(zone.type).toLowerCase() === 'evacuation'),
      zones_hazard: zones.some((zone) => !['flood', 'evacuation'].includes(String(zone.type).toLowerCase())),
      weatherObservations: weatherAvailable,
    };
    for (const [key, matches] of Object.entries(INCIDENT_LAYER_MATCHERS)) {
      available[key] = inAreaIncidents.some(matches);
    }
    return available;
  }, [inAreaHospitals, inAreaResources, inAreaTeams, inAreaIncidents, zones, weatherAvailable]);

  const layerSources = {
    ...dataSources,
    density: dataSources.incidents,
    ambulances: dataSources.resources,
    weatherObservations: 'Open-Meteo',
  };

  const handleShowAvailableLayers = useCallback(() => {
    setMapLayers((current) => Object.fromEntries(Object.keys(current).map((key) => [key, Boolean(availableLayers[key])])));
  }, [availableLayers, setMapLayers]);

  const handleHideOverlays = useCallback(() => {
    setMapLayers((current) => Object.fromEntries(Object.keys(current).map((key) => [key, false])));
  }, [setMapLayers]);

  const handleResetLayers = useCallback(() => {
    setBasemap('street');
    setMapLayers({
      incidents: true, hospitals: true, hospitals_government: true, hospitals_private: true,
      hospitals_unclassified: true, hospital_emergency_listed: false, teams: true, zones: true, density: false, shelters: false,
      resources: false, ambulances: true, incident_fire: true, incident_flood: true,
      incident_earthquake: true, incident_landslide: true, incident_collapse: true, incident_road: true,
      incident_industrial: true, incident_chemical: true, incident_missing: true, incident_unverified: true,
      zones_flood: true, zones_evacuation: true, zones_hazard: true, weatherObservations: true,
    });
  }, [setMapLayers]);

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
          } else if (mapLibreRef.current) {
            mapLibreRef.current.flyTo({ center: [longitude, latitude], zoom: 14, duration: 1200 });
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
    } else if (mapLibreRef.current) {
      mapLibreRef.current.flyTo({ center: [demoLocation.longitude, demoLocation.latitude], zoom: 14, duration: 1200 });
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
      fitMapToCoordinates(result.coordinates);
    } else {
      showToast(result.message || 'Road routing service failed to calculate route.');
    }
  }, [userLocation, routingIncident, isLoadingIncident, fitMapToCoordinates, showToast]);

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
      fitMapToCoordinates(result.coordinates);
    } else {
      showToast(result.message || 'Hospital road routing service unavailable.');
    }
  }, [routingIncident, nearestHospital, isLoadingHospital, fitMapToCoordinates, showToast]);

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

  return (
    <div
      ref={mapWrapperRef}
      className={`disaster-map-wrapper variant-${variant} ${is3D ? 'map-is-3d' : ''} ${drawer?.isOpen ? 'has-drawer-open' : ''} ${className}`}
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

      <div className="map-view-toggle" role="group" aria-label="Map view">
        <button type="button" aria-pressed={!is3D} className={!is3D ? 'active' : ''} onClick={() => setIs3D(false)}>2D</button>
        <button type="button" aria-pressed={is3D} className={is3D ? 'active' : ''} onClick={() => setIs3D(true)}>3D</button>
      </div>

      {/* The 3D renderer is mounted only on demand; switching back restores Leaflet. */}
      {is3D ? (
        <Suspense fallback={<div className="map3d-loading" role="status">Loading 3D terrain map…</div>}>
        <ThreeDMap
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          incidents={displayIncidents}
          hospitals={inAreaHospitals}
          teams={inAreaTeams}
          resources={inAreaResources}
          zones={zones}
          layers={mapLayers}
          boundary={GHAZIABAD_CONFIG.boundaryPolygon}
          weather={weatherObservation}
          userLocation={userLocation}
          incidentRoute={incidentRoute}
          hospitalRoute={hospitalRoute}
          userRole={user?.role}
          routingIncidentId={routingIncidentId}
          mapWrapperRef={mapWrapperRef}
          isLocating={isLocating}
          onMapClick={handleMapClick}
          onIncidentClick={(incident) => handleOpenDrawer('incident', incident.id)}
          onHospitalClick={(hospital) => handleOpenDrawer('hospital', hospital.id)}
          onTeamClick={(team) => handleOpenDrawer('team', team.teamId || team.id)}
          onResourceClick={(resource) => handleOpenDrawer('resource', resource.id)}
          onAssignTeam={assignTeam}
          onUpdateStatus={updateIncidentStatus}
          onSelectIncidentForRouting={handleSelectIncidentForRouting}
          onLocateMe={handleLocateMe}
          onMapReady={setMapLibreMap}
          onFallbackTo2D={handle3DFallback}
        />
        </Suspense>
      ) : <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        className="disaster-map-container"
        zoomControl={false}
        ref={setMapInstance}
        attributionControl
      >
        {/* Switching raster sources keeps the map instance and camera in place. */}
        <TileLayer key={basemap} attribution={BASEMAPS[basemap].attribution} url={BASEMAPS[basemap].url} maxZoom={BASEMAPS[basemap].maxZoom} />
        {BASEMAPS[basemap].labelsUrl && (
          <TileLayer key={`${basemap}-labels`} attribution="Labels &copy; Esri" url={BASEMAPS[basemap].labelsUrl} maxZoom={19} pane="overlayPane" />
        )}

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
        <WeatherObservationsLayer
          visible={Boolean(mapLayers.weatherObservations)}
          weather={weatherObservation}
        />

        {/* Floating Controls */}
        <MapControls
          onLocateMe={handleLocateMe}
          isLocating={isLocating}
          incidents={displayIncidents}
          mapWrapperRef={mapWrapperRef}
        />

        {/* Layer 1: Disaster Zones */}
        {mapLayers.zones && zones.filter((zone) => {
          const type = String(zone.type).toLowerCase();
          if (type === 'flood') return mapLayers.zones_flood;
          if (type === 'evacuation') return mapLayers.zones_evacuation;
          return mapLayers.zones_hazard;
        }).map((zone) => (
          <DisasterZoneOverlay key={zone.zoneId} zone={zone} />
        ))}

        {/* Layer 2: Incident Density */}
        {mapLayers.density && (
          <IncidentDensityOverlay incidents={displayIncidents} />
        )}

        {/* Layer 3: Hospitals */}
        {mapLayers.hospitals && inAreaHospitals.filter((hosp) => {
          const categoryVisible = hosp.ownership === 'government'
            ? mapLayers.hospitals_government !== false
            : hosp.ownership === 'private'
              ? mapLayers.hospitals_private !== false
              : mapLayers.hospitals_unclassified !== false;
          return categoryVisible && (!mapLayers.hospital_emergency_listed || hosp.emergencyServiceListed === true);
        }).map((hosp) => {
          if (typeof hosp.latitude !== 'number' || typeof hosp.longitude !== 'number') return null;
          return (
            <Marker
              key={hosp.id}
              position={[hosp.latitude, hosp.longitude]}
              icon={createHospitalIcon(hosp.ownership)}
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
                    <div className="popup-item"><span className="popup-label">Facility type</span><span className="popup-val">{hosp.category || 'Not published'}</span></div>
                    <div className="popup-item"><span className="popup-label">Classification</span><span className="popup-val">{hosp.ownership === 'government' ? 'Government' : hosp.ownership === 'private' ? 'Private' : 'Not stated by source'}</span></div>
                    <div className="popup-item"><span className="popup-label">Address</span><span className="popup-val">{hosp.address || 'Not published'}</span></div>
                    <div className="popup-item"><span className="popup-label">Emergency status</span><span className="popup-val">{hosp.liveAvailability?.emergencyStatus || 'Not reported'}</span></div>
                    <div className="popup-item"><span className="popup-label">Availability</span><span className="popup-val">{hosp.liveAvailability?.updatedAt ? `Updated ${new Date(hosp.liveAvailability.updatedAt).toLocaleString()}` : 'Live availability not connected'}</span></div>
                    <div className="popup-item"><span className="popup-label">Contact</span><span className="popup-val">{hosp.contact || 'Not published'}</span></div>
                  </div>
                  <div className="popup-item" style={{ marginTop: '8px' }}>
                    <span className="popup-label">Coordinates</span>
                    <span className="popup-val">{hosp.latitude.toFixed(5)}, {hosp.longitude.toFixed(5)}</span>
                  </div>
                  {hosp.contact && <div className="popup-item" style={{ marginTop: '8px' }}>
                    <span className="popup-label">Contact</span><span className="popup-val">{hosp.contact}</span>
                  </div>}
                  {(hosp.sources || []).map((sourceUrl) => <a key={sourceUrl} href={sourceUrl} target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: '6px' }}>Official source ↗</a>)}
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
            incidents={displayIncidents}
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
        {(mapLayers.resources || mapLayers.ambulances) && inAreaResources.filter((res) => (
          /ambulance/i.test(res.type || '') ? mapLayers.ambulances : mapLayers.resources
        )).map((res) => {
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
                  <div className="popup-item" style={{ marginTop: '8px' }}>
                    <span className="popup-label">Coordinates</span>
                    <span className="popup-val">{res.latitude.toFixed(5)}, {res.longitude.toFixed(5)}</span>
                  </div>
                  {res.contact && <div className="popup-item" style={{ marginTop: '8px' }}>
                    <span className="popup-label">Contact</span><span className="popup-val">{res.contact}</span>
                  </div>}
                  <div className="popup-item" style={{ marginTop: '8px' }}>
                    <span className="popup-label">Last updated</span><span className="popup-val">{res.updatedAt || lastUpdated || 'Not reported'}</span>
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
      </MapContainer>}

      {/* Top-Right Control Area: Layer Controls & Routing Controls Stack */}
      <div className="map-top-right-controls">
        {variant === 'full' && (
          <LayerPanel
            layers={mapLayers}
            availableLayers={availableLayers}
            layerSources={layerSources}
            onToggleLayer={toggleMapLayer}
            basemap={basemap}
            onBasemapChange={setBasemap}
            is3D={is3D}
            onShowAll={handleShowAvailableLayers}
            onHideOverlays={handleHideOverlays}
            onReset={handleResetLayers}
            dataUpdated={lastUpdated}
          />
        )}
        <RoutingControls
          userLocation={userLocation}
          onUseMyLocation={handleLocateMe}
          onSimulateGhaziabadLocation={handleSimulateGhaziabadLocation}
          isLocating={isLocating}
          incidents={displayIncidents}
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
      </div>

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
          {isPolling ? 'Refreshing data…' : lastUpdated ? `Last app refresh ${lastUpdated}` : 'Waiting for first data refresh'}
        </span>
        <span style={{ opacity: 0.5 }}>|</span>
        <span style={{ color: 'var(--ink)' }}>
          {displayIncidents.length} Ghaziabad incidents
        </span>
        <span style={{ opacity: 0.5 }}>|</span>
        <WeatherWidget onWeatherChange={handleWeatherChange} />
        <span style={{ opacity: 0.5 }}>|</span>
        <span style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>
          Area: Ghaziabad, UP
        </span>
        <span className="map-data-source-tag">
          {Object.values(dataSources).includes('API') ? 'API + DEMO' : (demoMode ? 'DEMO / LOCAL' : 'NO OPERATIONAL FEED')}
        </span>
      </div>
    </div>
  );
}
