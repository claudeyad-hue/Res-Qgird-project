import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Map, Marker, NavigationControl, TerrainControl, Popup, LngLatBounds, setWorkerUrl } from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import IncidentPopup from './IncidentPopup';

const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const VECTOR_TILES_URL = 'https://tiles.openfreemap.org/planet';
const TERRAIN_URL = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';
const SATELLITE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const SATELLITE_LABELS_URL = 'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';
const IMAGERY_ATTRIBUTION = 'Imagery sources: Esri, DigitalGlobe, GeoEye, i-cubed, USDA FSA, USGS, AEX, Getmapping, Aerogrid, IGN, IGP, swisstopo, and the GIS User Community.';
const TERRAIN_ATTRIBUTION = 'Terrain: Mapzen / Tilezen via AWS Open Data. Regional source credits: tilezen/joerd attribution.';
const FALLBACK_STYLE = {
  version: 8,
  sources: {
    'resquard-osm-fallback': {
      type: 'raster',
      tiles: ['https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxzoom: 19,
    },
  },
  layers: [{ id: 'resquard-osm-fallback', type: 'raster', source: 'resquard-osm-fallback' }],
};

setWorkerUrl(maplibreWorkerUrl);

const validPoint = (item) => item && item.latitude !== null && item.longitude !== null
  && item.latitude !== '' && item.longitude !== ''
  && Number.isFinite(Number(item.latitude)) && Number.isFinite(Number(item.longitude));
const lngLat = (item) => [Number(item.longitude), Number(item.latitude)];
const safeText = (value, fallback = 'Not reported') => (value === undefined || value === null || value === '' ? fallback : String(value));

function popupRoot(map, position, content, options = {}) {
  const container = document.createElement('div');
  const root = createRoot(container);
  root.render(content);
  const popup = new Popup({ closeButton: true, closeOnClick: true, maxWidth: '360px', offset: 18, ...options })
    .setLngLat(position)
    .setDOMContent(container)
    .addTo(map);
  popup.once('close', () => root.unmount());
  return popup;
}

function addDataMarker(map, item, kind, handlers) {
  if (!validPoint(item)) return null;
  const marker = document.createElement('button');
  marker.type = 'button';
  marker.className = `map3d-marker map3d-marker-${kind}${kind === 'incident' ? ` marker-sev-${String(item.severity || 'low').toLowerCase().replace(/[^a-z0-9_-]/g, '-')}` : ''}`;
  const glyph = { incident: '!', hospital: '+', team: '◆', resource: /ambulance/i.test(item.type || '') ? '🚑' : '📦' }[kind];
  marker.textContent = glyph;
  marker.setAttribute('aria-label', `${kind}: ${item.title || item.name || item.type || item.id || 'map item'}`);
  marker.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    const position = lngLat(item);
    if (kind === 'incident') {
      popupRoot(map, position, <IncidentPopup
        incident={item}
        userLocation={handlers.userLocation}
        onOpenDrawer={handlers.onIncidentClick}
        onAssignTeam={handlers.onAssignTeam}
        onUpdateStatus={handlers.onUpdateStatus}
        userRole={handlers.userRole}
        onSelectForRouting={handlers.onSelectForRouting}
        activeRoutingIncidentId={handlers.activeRoutingIncidentId}
      />);
      return;
    }
    if (kind === 'hospital') {
      popupRoot(map, position, <div className="popup-container">
        <div className="popup-header"><div><span className="popup-id">{safeText(item.id)}</span><h4 className="popup-title">{safeText(item.name, 'Hospital')}</h4></div></div>
        <div className="popup-grid">
          <div className="popup-item"><span className="popup-label">Status</span><span className="popup-val">{safeText(item.status)}</span></div>
          <div className="popup-item"><span className="popup-label">Beds available</span><span className="popup-val">{safeText(item.bedsAvail, '0')} / {safeText(item.bedsTotal, '0')}</span></div>
          <div className="popup-item"><span className="popup-label">ICU available</span><span className="popup-val">{safeText(item.icuAvail, '0')} / {safeText(item.icuTotal, '0')}</span></div>
          <div className="popup-item"><span className="popup-label">Coordinates</span><span className="popup-val">{Number(item.latitude).toFixed(5)}, {Number(item.longitude).toFixed(5)}</span></div>
        </div>
        <button type="button" className="popup-btn popup-btn-primary" onClick={() => handlers.onHospitalClick?.(item)}>View Hospital Details →</button>
      </div>);
      return;
    }
    if (kind === 'team') {
      popupRoot(map, position, <div className="popup-container">
        <div className="popup-header"><div><span className="popup-id">{safeText(item.teamId)}</span><h4 className="popup-title">{safeText(item.name, 'Rescue team')}</h4></div></div>
        <div className="popup-grid">
          <div className="popup-item"><span className="popup-label">Status</span><span className="popup-val">{safeText(item.status)}</span></div>
          <div className="popup-item"><span className="popup-label">Unit type</span><span className="popup-val">{safeText(item.type)}</span></div>
          <div className="popup-item"><span className="popup-label">Responders</span><span className="popup-val">{safeText(item.members, '0')}</span></div>
          <div className="popup-item"><span className="popup-label">Assigned incident</span><span className="popup-val">{safeText(item.currentIncidentId, 'Standby')}</span></div>
        </div>
        <small>Simulation telemetry</small>
        {item.currentIncidentId && <button type="button" className="popup-btn popup-btn-primary" onClick={() => handlers.onIncidentClick?.({ id: item.currentIncidentId })}>View Assigned Incident →</button>}
      </div>);
      return;
    }
    popupRoot(map, position, <div className="popup-container">
      <div className="popup-header"><div><span className="popup-id">{safeText(item.id)}</span><h4 className="popup-title">{safeText(item.type, 'Emergency resource')}</h4></div></div>
      <div className="popup-grid">
        <div className="popup-item"><span className="popup-label">Status</span><span className="popup-val">{safeText(item.status)}</span></div>
        <div className="popup-item"><span className="popup-label">Stock / quantity</span><span className="popup-val">{safeText(item.amount, '0')} {safeText(item.unit, '')}</span></div>
        <div className="popup-item"><span className="popup-label">Location</span><span className="popup-val">{safeText(item.location)}</span></div>
        <div className="popup-item"><span className="popup-label">Coordinates</span><span className="popup-val">{Number(item.latitude).toFixed(5)}, {Number(item.longitude).toFixed(5)}</span></div>
      </div>
    </div>);
  });
  return new Marker({ element: marker, anchor: 'bottom' }).setLngLat(lngLat(item)).addTo(map);
}

function makeRing(latitude, longitude, radiusMeters, steps = 48) {
  const latitudeScale = 110540;
  const longitudeScale = 111320 * Math.cos((latitude * Math.PI) / 180);
  return Array.from({ length: steps + 1 }, (_, index) => {
    const angle = (index / steps) * Math.PI * 2;
    return [longitude + (radiusMeters * Math.cos(angle)) / Math.max(1, longitudeScale), latitude + (radiusMeters * Math.sin(angle)) / latitudeScale];
  });
}

function makeZones(zones, layers) {
  if (!layers.zones) return [];
  return zones.filter((zone) => {
    const type = String(zone.type || '').toLowerCase();
    if (type === 'flood') return layers.zones_flood;
    if (type === 'evacuation') return layers.zones_evacuation;
    return layers.zones_hazard;
  }).flatMap((zone) => {
    const type = String(zone.type || 'hazard').toLowerCase();
    if (zone.shape === 'circle' && Array.isArray(zone.center)) {
      const [latitude, longitude] = zone.center;
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];
      return [{ type: 'Feature', properties: { kind: type, name: safeText(zone.name), riskLevel: safeText(zone.riskLevel), description: safeText(zone.description) }, geometry: { type: 'Polygon', coordinates: [makeRing(latitude, longitude, Number(zone.radius) || 500)] } }];
    }
    if (zone.shape === 'polygon' && Array.isArray(zone.coordinates) && zone.coordinates.length > 2) {
      const ring = zone.coordinates.map(([latitude, longitude]) => [Number(longitude), Number(latitude)]);
      if (ring.length && (ring[0][0] !== ring.at(-1)[0] || ring[0][1] !== ring.at(-1)[1])) ring.push(ring[0]);
      return [{ type: 'Feature', properties: { kind: type, name: safeText(zone.name), riskLevel: safeText(zone.riskLevel), description: safeText(zone.description) }, geometry: { type: 'Polygon', coordinates: [ring] } }];
    }
    return [];
  });
}

function makeDensity(incidents) {
  const hubs = new Map();
  incidents.filter(validPoint).forEach((incident) => {
    const key = `${(Math.round(Number(incident.latitude) * 2.5) / 2.5).toFixed(2)},${(Math.round(Number(incident.longitude) * 2.5) / 2.5).toFixed(2)}`;
    const hub = hubs.get(key) || { latitude: Number(incident.latitude), longitude: Number(incident.longitude), count: 0, critical: false };
    hub.count += 1;
    hub.critical ||= String(incident.severity).toLowerCase() === 'critical';
    hubs.set(key, hub);
  });
  return [...hubs.values()].flatMap((hub) => {
    const radius = Math.min(65000, 25000 + hub.count * 12000);
    const color = hub.critical ? '#C0392B' : '#E67E22';
    const opacity = Math.min(0.35, 0.15 + hub.count * 0.05);
    return [
      { type: 'Feature', properties: { color, opacity: opacity * 0.6 }, geometry: { type: 'Polygon', coordinates: [makeRing(hub.latitude, hub.longitude, radius)] } },
      { type: 'Feature', properties: { color, opacity }, geometry: { type: 'Polygon', coordinates: [makeRing(hub.latitude, hub.longitude, radius * 0.45)] } },
    ];
  });
}

function makeRoute(route, id, color) {
  if (!route || route.status !== 'ok' || !Array.isArray(route.coordinates) || route.coordinates.length < 2) return null;
  return { type: 'Feature', properties: { id, color }, geometry: { type: 'LineString', coordinates: route.coordinates.map(([latitude, longitude]) => [Number(longitude), Number(latitude)]) } };
}

export default function ThreeDMap({
  center, zoom, incidents, hospitals, teams, resources, zones, layers, boundary,
  weather, userLocation, incidentRoute, hospitalRoute,
  userRole, routingIncidentId, mapWrapperRef, isLocating,
  onMapClick, onIncidentClick, onHospitalClick, onTeamClick, onResourceClick,
  onAssignTeam, onUpdateStatus, onSelectIncidentForRouting, onLocateMe, onMapReady, onFallbackTo2D,
}) {
  const host = useRef(null);
  const shell = useRef(null);
  const mapRef = useRef(null);
  const markerRefs = useRef([]);
  const mapReadyRef = useRef(false);
  const fallbackUsedRef = useRef(false);
  const terrainFailedRef = useRef(false);
  const imageryFailedRef = useRef(false);
  const vectorFailedRef = useRef(false);
  const vectorSourceIdsRef = useRef([]);
  const loadedVectorLayersRef = useRef([]);
  const terrainControlRef = useRef(null);
  const dataRef = useRef({});
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState('');
  const callbacksRef = useRef({});
  useEffect(() => {
    callbacksRef.current = { onMapClick, onIncidentClick, onHospitalClick, onTeamClick, onResourceClick, onAssignTeam, onUpdateStatus, onSelectIncidentForRouting, onFallbackTo2D };
  }, [onMapClick, onIncidentClick, onHospitalClick, onTeamClick, onResourceClick, onAssignTeam, onUpdateStatus, onSelectIncidentForRouting, onFallbackTo2D]);

  const zonesData = useMemo(() => ({ type: 'FeatureCollection', features: makeZones(zones, layers) }), [zones, layers]);
  const densityData = useMemo(() => ({ type: 'FeatureCollection', features: layers.density ? makeDensity(incidents) : [] }), [incidents, layers.density]);
  const routeData = useMemo(() => ({ type: 'FeatureCollection', features: [makeRoute(incidentRoute, 'incident', '#2F6FE0'), makeRoute(hospitalRoute, 'hospital', '#27AE60')].filter(Boolean) }), [incidentRoute, hospitalRoute]);
  useEffect(() => { dataRef.current = { zonesData, densityData, routeData }; }, [zonesData, densityData, routeData]);

  const addOperationalSources = useCallback((map) => {
    const style = map.getStyle();
    const styleLayers = style?.layers || [];
    vectorSourceIdsRef.current = Object.entries(style?.sources || {}).filter(([, source]) => source.type === 'vector').map(([id]) => id);
    loadedVectorLayersRef.current = styleLayers.filter((layer) => !layer.id.startsWith('resquard-') && layer.id !== 'background').map((layer) => ({ id: layer.id, visibility: layer.layout?.visibility || 'visible' }));

    if (!map.getSource('resquard-dem')) {
      map.addSource('resquard-dem', { type: 'raster-dem', tiles: [TERRAIN_URL], tileSize: 256, encoding: 'terrarium', maxzoom: 15, attribution: `${TERRAIN_ATTRIBUTION} <a href="https://github.com/tilezen/joerd/blob/master/docs/attribution.md" target="_blank" rel="noreferrer">Credits</a>` });
    }
    if (!map.getSource('resquard-satellite')) {
      map.addSource('resquard-satellite', { type: 'raster', tiles: [SATELLITE_URL], tileSize: 256, maxzoom: 19, attribution: IMAGERY_ATTRIBUTION });
      map.addLayer({ id: 'resquard-satellite-layer', type: 'raster', source: 'resquard-satellite', paint: { 'raster-fade-duration': 150 } });
    }
    if (!map.getSource('resquard-satellite-labels')) {
      map.addSource('resquard-satellite-labels', { type: 'raster', tiles: [SATELLITE_LABELS_URL], tileSize: 256, maxzoom: 19, attribution: 'Labels and boundaries: Esri' });
      map.addLayer({ id: 'resquard-satellite-labels-layer', type: 'raster', source: 'resquard-satellite-labels', paint: { 'raster-fade-duration': 150, 'raster-opacity': 0.92 } });
    }

    loadedVectorLayersRef.current.forEach(({ id }) => {
      if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', 'none');
    });
    if (!map.getSource('resquard-building-vector')) {
      map.addSource('resquard-building-vector', {
        type: 'vector',
        url: VECTOR_TILES_URL,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      });
    }
    if (!map.getLayer('resquard-3d-buildings')) {
      const mappedHeightFilter = ['all', ['any', ['has', 'render_height'], ['has', 'height']], ['!=', ['get', 'hide_3d'], true]];
      map.addLayer({
        id: 'resquard-3d-buildings', source: 'resquard-building-vector', 'source-layer': 'building',
        type: 'fill-extrusion', minzoom: 15, filter: mappedHeightFilter,
        paint: {
          'fill-extrusion-color': '#aab7c2',
          'fill-extrusion-height': ['to-number', ['coalesce', ['get', 'render_height'], ['get', 'height'], 0]],
          'fill-extrusion-base': ['to-number', ['coalesce', ['get', 'render_min_height'], ['get', 'min_height'], 0]],
          'fill-extrusion-opacity': 0.94,
        },
      });
    }

    if (!map.getTerrain()) {
      try {
        map.setTerrain({ source: 'resquard-dem', exaggeration: 1.25 });
        if (!terrainControlRef.current) {
          terrainControlRef.current = new TerrainControl({ source: 'resquard-dem', exaggeration: 1.25 });
          map.addControl(terrainControlRef.current, 'bottom-right');
        }
      } catch {
        terrainFailedRef.current = true;
        setMapError('Elevation tiles could not be enabled. 3D buildings and satellite imagery are still active.');
      }
    }

    if (!map.getSource('resquard-boundary')) {
      const polygon = boundary.map(([latitude, longitude]) => [longitude, latitude]);
      if (polygon.length && (polygon[0][0] !== polygon.at(-1)[0] || polygon[0][1] !== polygon.at(-1)[1])) polygon.push(polygon[0]);
      map.addSource('resquard-boundary', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [polygon] }, properties: {} } });
      map.addLayer({ id: 'resquard-boundary-line', type: 'line', source: 'resquard-boundary', paint: { 'line-color': '#2F6FE0', 'line-width': 2.5, 'line-dasharray': [2, 2] } });
    }
    if (!map.getSource('resquard-zones')) {
      map.addSource('resquard-zones', { type: 'geojson', data: dataRef.current.zonesData });
      map.addLayer({ id: 'resquard-zone-fill', type: 'fill', source: 'resquard-zones', paint: { 'fill-color': ['match', ['get', 'kind'], 'flood', '#168EEA', 'evacuation', '#23A56B', '#F47C20'], 'fill-opacity': 0.25 } });
      map.addLayer({ id: 'resquard-zone-line', type: 'line', source: 'resquard-zones', filter: ['!=', ['get', 'kind'], 'evacuation'], paint: { 'line-color': ['match', ['get', 'kind'], 'flood', '#168EEA', '#F47C20'], 'line-width': 2 } });
      map.addLayer({ id: 'resquard-evacuation-line', type: 'line', source: 'resquard-zones', filter: ['==', ['get', 'kind'], 'evacuation'], paint: { 'line-color': '#23A56B', 'line-width': 2, 'line-dasharray': [2, 2] } });
      map.on('click', 'resquard-zone-fill', (event) => {
        const feature = event.features?.[0];
        if (!feature) return;
        const properties = feature.properties || {};
        popupRoot(map, event.lngLat, <div className="popup-container">
          <div className="popup-header"><div><span className="popup-id">DEMONSTRATION ZONE</span><h4 className="popup-title">{safeText(properties.name, 'Hazard zone')}</h4></div></div>
          <div className="popup-grid"><div className="popup-item"><span className="popup-label">Type</span><span className="popup-val">{safeText(properties.kind)}</span></div><div className="popup-item"><span className="popup-label">Risk</span><span className="popup-val">{safeText(properties.riskLevel)}</span></div></div>
          <p>{safeText(properties.description)}</p>
        </div>);
      });
      map.on('mouseenter', 'resquard-zone-fill', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'resquard-zone-fill', () => { map.getCanvas().style.cursor = ''; });
    }
    if (!map.getSource('resquard-density')) {
      map.addSource('resquard-density', { type: 'geojson', data: dataRef.current.densityData });
      map.addLayer({ id: 'resquard-density-fill', type: 'fill', source: 'resquard-density', paint: { 'fill-color': ['get', 'color'], 'fill-opacity': ['get', 'opacity'] } });
      map.addLayer({ id: 'resquard-density-line', type: 'line', source: 'resquard-density', paint: { 'line-color': ['get', 'color'], 'line-opacity': 0.6, 'line-width': 1 } });
    }
    if (!map.getSource('resquard-routes')) {
      map.addSource('resquard-routes', { type: 'geojson', data: dataRef.current.routeData });
      map.addLayer({ id: 'resquard-routes-line', type: 'line', source: 'resquard-routes', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': ['get', 'color'], 'line-width': 5, 'line-opacity': 0.9 } });
    }
    mapReadyRef.current = true;
    setMapLoaded(true);
    onMapReady?.(map);
  }, [boundary, onMapReady]);

  useEffect(() => {
    if (!host.current) return undefined;
    mapReadyRef.current = false;
    setMapError('');
    let map;
    try {
      map = new Map({
        container: host.current,
        style: STYLE_URL,
        center: [center[1], center[0]],
        zoom,
        pitch: 56,
        bearing: -18,
        maxPitch: 75,
        minZoom: 3,
        attributionControl: { compact: true },
        cooperativeGestures: true,
        trackResize: true,
      });
    } catch {
      onFallbackTo2D?.();
      return undefined;
    }
    mapRef.current = map;
    map.addControl(new NavigationControl({ showCompass: true, showZoom: true, visualizePitch: true }), 'bottom-right');
    map.on('style.load', () => {
      try { addOperationalSources(map); }
      catch { setMapError('The map style loaded, but some 3D sources failed to initialize. Switch to 2D or retry the 3D view.'); }
    });
    map.on('click', (event) => callbacksRef.current.onMapClick?.({ latitude: event.lngLat.lat, longitude: event.lngLat.lng }));
    map.on('error', (event) => {
      const sourceId = event.sourceId || '';
      if (sourceId === 'resquard-dem' && !terrainFailedRef.current) {
        terrainFailedRef.current = true;
        try { map.setTerrain(null); } catch { /* retain the pitched camera if terrain has not initialized */ }
        if (terrainControlRef.current) {
          try { map.removeControl(terrainControlRef.current); } catch { /* control may already be removed */ }
          terrainControlRef.current = null;
        }
        setMapError('Elevation data is unavailable right now. Satellite imagery, buildings, and response layers remain active.');
      } else if ((sourceId === 'resquard-satellite' || sourceId === 'resquard-satellite-labels') && !imageryFailedRef.current) {
        imageryFailedRef.current = true;
        ['resquard-satellite-labels-layer', 'resquard-satellite-layer'].forEach((id) => { if (map.getLayer(id)) map.removeLayer(id); });
        ['resquard-satellite-labels', 'resquard-satellite'].forEach((id) => { if (map.getSource(id)) map.removeSource(id); });
        loadedVectorLayersRef.current.forEach(({ id, visibility }) => { if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', visibility); });
        setMapError('Satellite tiles are unavailable. Switched to the street/vector map; operational layers are still active.');
      } else if ((vectorSourceIdsRef.current.includes(sourceId) || sourceId === 'resquard-building-vector') && !vectorFailedRef.current) {
        vectorFailedRef.current = true;
        setMapError('Some vector tiles are unavailable. Satellite imagery and local response overlays remain visible; 3D buildings may be incomplete.');
      } else if (!mapReadyRef.current && !fallbackUsedRef.current) {
        fallbackUsedRef.current = true;
        setMapError('The 3D vector style did not load. Showing the OpenStreetMap fallback while keeping map interactions available.');
        try { map.setStyle(FALLBACK_STYLE); } catch { setMapError('The map style could not load. Switch to 2D or retry when the connection is available.'); }
      } else if (!mapReadyRef.current && fallbackUsedRef.current) {
        setMapError('Neither 3D nor fallback tiles could load. Returning to the working 2D map.');
        callbacksRef.current.onFallbackTo2D?.();
      }
    });
    map.on('load', () => {
      if (!mapReadyRef.current) {
        try { addOperationalSources(map); } catch { setMapError('Some 3D map layers could not be initialized.'); }
      }
    });
    const handleFullscreenChange = () => map.resize();
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      markerRefs.current.forEach((marker) => marker.remove());
      markerRefs.current = [];
      try { map.remove(); } catch { /* safe cleanup after a partial style load */ }
      mapRef.current = null;
      mapReadyRef.current = false;
      terrainControlRef.current = null;
      onMapReady?.(null);
    };
  }, [addOperationalSources, center, onFallbackTo2D, onMapReady, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReadyRef.current) return;
    const handlers = {
      userLocation, onIncidentClick: (...args) => callbacksRef.current.onIncidentClick?.(...args),
      onHospitalClick: (...args) => callbacksRef.current.onHospitalClick?.(...args),
      onTeamClick: (...args) => callbacksRef.current.onTeamClick?.(...args),
      onResourceClick: (...args) => callbacksRef.current.onResourceClick?.(...args),
      onAssignTeam: (...args) => callbacksRef.current.onAssignTeam?.(...args),
      onUpdateStatus: (...args) => callbacksRef.current.onUpdateStatus?.(...args),
      onSelectForRouting: (...args) => callbacksRef.current.onSelectIncidentForRouting?.(...args),
      userRole, activeRoutingIncidentId: routingIncidentId,
    };
    markerRefs.current.forEach((marker) => marker.remove());
    markerRefs.current = [];
    if (layers.incidents) incidents.forEach((item) => { const marker = addDataMarker(map, item, 'incident', handlers); if (marker) markerRefs.current.push(marker); });
    if (layers.hospitals) hospitals.forEach((item) => { const marker = addDataMarker(map, item, 'hospital', handlers); if (marker) markerRefs.current.push(marker); });
    if (layers.teams) teams.forEach((item) => { const marker = addDataMarker(map, item, 'team', handlers); if (marker) markerRefs.current.push(marker); });
    if (layers.resources || layers.ambulances) {
      resources.filter((item) => (/ambulance/i.test(item.type || '') ? layers.ambulances : layers.resources)).forEach((item) => {
        const marker = addDataMarker(map, item, 'resource', handlers);
        if (marker) markerRefs.current.push(marker);
      });
    }
    if (userLocation && validPoint(userLocation)) {
      const marker = document.createElement('button');
      marker.type = 'button';
      marker.className = 'map3d-marker map3d-marker-user';
      marker.setAttribute('aria-label', 'Your GPS location');
      marker.textContent = '●';
      marker.addEventListener('click', (event) => {
        event.preventDefault(); event.stopPropagation();
        popupRoot(map, lngLat(userLocation), <div className="popup-container"><div className="popup-header"><h4 className="popup-title">📍 Your Location</h4></div><p>Latitude: {Number(userLocation.latitude).toFixed(6)}<br />Longitude: {Number(userLocation.longitude).toFixed(6)}<br />Accuracy: ±{Math.round(userLocation.accuracy || 0)} m</p><small>{userLocation.isSimulatedDemo ? 'Simulated demonstration location' : 'GPS fix active'}</small></div>);
      });
      markerRefs.current.push(new Marker({ element: marker, anchor: 'bottom' }).setLngLat(lngLat(userLocation)).addTo(map));
    }
    if (weather && !weather.isFallback && layers.weatherObservations) {
      const marker = document.createElement('button');
      marker.type = 'button'; marker.className = 'map3d-marker map3d-marker-weather'; marker.textContent = weather.icon || '🌡️';
      marker.setAttribute('aria-label', 'Current weather observation');
      marker.addEventListener('click', (event) => {
        event.preventDefault(); event.stopPropagation();
        popupRoot(map, [center[1], center[0]], <div className="popup-container"><div className="popup-header"><h4 className="popup-title">Current Weather Observation</h4></div><div className="popup-grid"><div className="popup-item"><span className="popup-label">Conditions</span><span className="popup-val">{safeText(weather.label)}</span></div><div className="popup-item"><span className="popup-label">Temperature</span><span className="popup-val">{weather.temperature}°C</span></div><div className="popup-item"><span className="popup-label">Wind</span><span className="popup-val">{weather.windspeed} km/h</span></div></div><small>Source: {safeText(weather.source)}</small></div>);
      });
      markerRefs.current.push(new Marker({ element: marker, anchor: 'bottom' }).setLngLat([center[1], center[0]]).addTo(map));
    }
    const zonesSource = map.getSource('resquard-zones');
    if (zonesSource) zonesSource.setData(zonesData);
    const densitySource = map.getSource('resquard-density');
    if (densitySource) densitySource.setData(densityData);
    const routesSource = map.getSource('resquard-routes');
    if (routesSource) routesSource.setData(routeData);
  }, [center, densityData, incidents, hospitals, layers, resources, routeData, routingIncidentId, teams, userLocation, userRole, weather, zonesData]);

  const resetCamera = () => mapRef.current?.easeTo({ center: [center[1], center[0]], zoom, pitch: 56, bearing: -18, duration: 600 });
  const fitIncidents = () => {
    const points = incidents.filter(validPoint);
    if (!points.length) return resetCamera();
    const bounds = points.reduce((result, point) => result.extend(lngLat(point)), new LngLatBounds(lngLat(points[0]), lngLat(points[0])));
    mapRef.current?.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 600 });
  };
  const changePitch = (delta) => {
    const map = mapRef.current;
    if (map) map.easeTo({ pitch: Math.min(75, Math.max(0, map.getPitch() + delta)), duration: 250 });
  };
  const toggleFullscreen = async () => {
    const target = mapWrapperRef?.current || shell.current;
    if (!target) return;
    if (document.fullscreenElement) await document.exitFullscreen?.();
    else if (target.requestFullscreen) await target.requestFullscreen();
    else target.webkitRequestFullscreen?.();
  };

  return <div ref={shell} className="map3d-shell">
    <div ref={host} className="map3d-canvas" role="application" aria-label="Ghaziabad 3D satellite, terrain and incident map" />
    {!mapLoaded && <div className="map3d-loading" role="status"><span className="map3d-spinner" /> Loading satellite, terrain and vector map…</div>}
    {mapError && <div className="map3d-warning" role="status">{mapError}<button type="button" aria-label="Dismiss map warning" onClick={() => setMapError('')}>×</button></div>}
    <div className="map3d-camera-controls" aria-label="3D camera controls">
      <button type="button" onClick={() => changePitch(10)} title="Tilt camera up">Tilt +</button>
      <button type="button" onClick={() => changePitch(-10)} title="Tilt camera down">Tilt −</button>
      <button type="button" onClick={fitIncidents} title="Fit visible incidents">Fit Incidents</button>
      <button type="button" onClick={resetCamera} title="Reset pitch, rotation and Ghaziabad view">Reset View</button>
      <button type="button" onClick={toggleFullscreen} title="Toggle fullscreen">Fullscreen</button>
      <button type="button" onClick={onLocateMe} disabled={isLocating} title="Find my location">{isLocating ? 'Locating…' : 'My Location'}</button>
    </div>
  </div>;
}
