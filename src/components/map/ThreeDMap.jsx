import { useEffect, useRef, useState } from 'react';
import { Map, Marker, NavigationControl, TerrainControl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const TERRAIN_URL = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';
const asPoint = (item) => [Number(item.longitude), Number(item.latitude)];
const hasPoint = (item) => Number.isFinite(Number(item.latitude)) && Number.isFinite(Number(item.longitude));

function addMarker(map, item, kind, onSelect) {
  if (!hasPoint(item)) return null;
  const el = document.createElement('button');
  el.type = 'button';
  el.className = `map3d-marker map3d-marker-${kind}`;
  el.textContent = kind === 'incident' ? '!' : kind === 'hospital' ? '+' : kind === 'team' ? '◆' : '●';
  el.setAttribute('aria-label', `${kind}: ${item.title || item.name || item.type || item.id || 'map item'}`);
  el.addEventListener('click', (event) => { event.stopPropagation(); onSelect?.(item); });
  return new Marker({ element: el, anchor: 'bottom' }).setLngLat(asPoint(item)).addTo(map);
}

export default function ThreeDMap({ center, zoom, incidents, hospitals, teams, resources, zones, layers, boundary, onMapClick, onIncidentClick, onHospitalClick, onTeamClick, onResourceClick }) {
  const host = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const onMapClickRef = useRef(onMapClick);
  useEffect(() => { onMapClickRef.current = onMapClick; }, [onMapClick]);

  useEffect(() => {
    if (!host.current) return undefined;
    const map = new Map({
      container: host.current,
      style: STYLE_URL,
      center: [center[1], center[0]],
      zoom,
      pitch: 58,
      bearing: -18,
      maxPitch: 75,
      attributionControl: true,
    });
    mapRef.current = map;
    setMapLoaded(false);
    map.addControl(new NavigationControl({ visualizePitch: true }), 'bottom-right');
    map.on('load', () => {
      map.addSource('resquard-dem', { type: 'raster-dem', tiles: [TERRAIN_URL], tileSize: 256, encoding: 'terrarium', maxzoom: 15 });
      map.setTerrain({ source: 'resquard-dem', exaggeration: 1.25 });
      map.addControl(new TerrainControl({ source: 'resquard-dem', exaggeration: 1.25 }), 'bottom-right');
      map.addSource('resquard-boundary', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[...boundary.map(([lat, lng]) => [lng, lat]), [boundary[0][1], boundary[0][0]]]] }, properties: {} } });
      map.addLayer({ id: 'resquard-boundary-line', type: 'line', source: 'resquard-boundary', paint: { 'line-color': '#2f6fe0', 'line-width': 3, 'line-dasharray': [2, 2] } });
      map.addSource('resquard-zones', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({ id: 'resquard-zone-fill', type: 'fill', source: 'resquard-zones', paint: { 'fill-color': ['match', ['get', 'kind'], 'flood', '#168eea', 'evacuation', '#23a56b', '#f47c20'], 'fill-opacity': 0.28 } });
      map.addLayer({ id: 'resquard-zone-line', type: 'line', source: 'resquard-zones', paint: { 'line-color': ['match', ['get', 'kind'], 'flood', '#168eea', 'evacuation', '#23a56b', '#f47c20'], 'line-width': 2 } });
      const style = map.getStyle();
      const buildingLayer = style.layers?.find((layer) => layer.type === 'fill' && /building/i.test(`${layer.id} ${layer['source-layer'] || ''}`));
      if (buildingLayer) {
        map.addLayer({ id: 'resquard-3d-buildings', source: buildingLayer.source, 'source-layer': buildingLayer['source-layer'], type: 'fill-extrusion', minzoom: 14, filter: buildingLayer.filter, paint: {
          'fill-extrusion-color': '#9ba8b4',
          'fill-extrusion-height': ['coalesce', ['get', 'render_height'], ['get', 'height'], 8],
          'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], ['get', 'min_height'], 0],
          'fill-extrusion-opacity': 0.86,
        } }, buildingLayer.id);
      }
      map.on('click', (event) => onMapClickRef.current?.({ latitude: event.lngLat.lat, longitude: event.lngLat.lng }));
      setMapLoaded(true);
    });
    return () => { map.remove(); mapRef.current = null; };
  }, [center, zoom, boundary]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
    if (layers.incidents) incidents.forEach((item) => { const marker = addMarker(map, item, 'incident', onIncidentClick); if (marker) markersRef.current.push(marker); });
    if (layers.hospitals) hospitals.forEach((item) => { const marker = addMarker(map, item, 'hospital', onHospitalClick); if (marker) markersRef.current.push(marker); });
    if (layers.teams) teams.forEach((item) => { const marker = addMarker(map, item, 'team', onTeamClick); if (marker) markersRef.current.push(marker); });
    if (layers.resources || layers.ambulances) resources.filter((item) => (/ambulance/i.test(item.type || '') ? layers.ambulances : layers.resources)).forEach((item) => { const marker = addMarker(map, item, 'resource', onResourceClick); if (marker) markersRef.current.push(marker); });
    const source = map.getSource('resquard-zones');
    if (source) source.setData({ type: 'FeatureCollection', features: layers.zones ? zones.filter((zone) => {
      const type = String(zone.type || '').toLowerCase();
      if (type === 'flood') return layers.zones_flood;
      if (type === 'evacuation') return layers.zones_evacuation;
      return layers.zones_hazard;
    }).flatMap((zone) => {
      const kind = String(zone.type || 'hazard').toLowerCase();
      if (zone.shape === 'circle' && Array.isArray(zone.center)) {
        const [lat, lng] = zone.center;
        const radius = Number(zone.radius) || 500;
        const ring = Array.from({ length: 33 }, (_, i) => {
          const angle = (i / 32) * Math.PI * 2;
          return [lng + (radius * Math.cos(angle)) / (111320 * Math.cos((lat * Math.PI) / 180)), lat + (radius * Math.sin(angle)) / 110540];
        });
        return [{ type: 'Feature', properties: { kind }, geometry: { type: 'Polygon', coordinates: [ring] } }];
      }
      if (zone.shape === 'polygon' && Array.isArray(zone.coordinates) && zone.coordinates.length > 2) {
        const ring = zone.coordinates.map(([lat, lng]) => [lng, lat]);
        if (ring.length && (ring[0][0] !== ring.at(-1)[0] || ring[0][1] !== ring.at(-1)[1])) ring.push(ring[0]);
        return [{ type: 'Feature', properties: { kind }, geometry: { type: 'Polygon', coordinates: [ring] } }];
      }
      return [];
    }) : [] });
  }, [incidents, hospitals, teams, resources, zones, layers, onIncidentClick, onHospitalClick, onTeamClick, onResourceClick, mapLoaded]);

  return <div ref={host} className="map3d-canvas" role="application" aria-label="Ghaziabad 3D terrain and building map" />;
}
