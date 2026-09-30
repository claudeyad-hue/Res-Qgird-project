// Leaflet DivIcon Generator and SVG Vector Symbols (Section F, G, N)
// Bypasses default Leaflet image asset bundling issues and renders crisp, high-DPI icons
import L from 'leaflet';

// SVG Path definitions for all emergency incident types
const SVG_ICONS = {
  Fire: `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M12 23c-4.97 0-9-4.03-9-9 0-3.32 1.83-6.26 4.6-7.85.34-.2.78-.05.94.31.29.65.62 1.41.97 2.06.12.22.37.34.61.27.35-.09.77-.18 1.18-.18 2.05 0 3.7 1.66 3.7 3.7 0 .54-.12 1.05-.33 1.51-.15.33.02.72.36.83.3.1.63-.04.76-.34.34-.8.53-1.68.53-2.6 0-1.89-.9-3.58-2.31-4.71-.35-.28-.35-.8 0-1.08C15.82 4.47 17.5 7.02 17.5 10c0 .35-.03.7-.08 1.04-.04.29.13.57.41.65.29.08.59-.07.67-.36.14-.54.22-1.11.22-1.69 0-4.05-2.85-7.51-6.72-8.48-.38-.1-.7.22-.64.6.35 2.16-.39 4.38-1.92 5.86C7.57 9.4 6.5 11.6 6.5 14c0 3.03 2.47 5.5 5.5 5.5s5.5-2.47 5.5-5.5c0-.41-.34-.75-.75-.75s-.75.34-.75.75c0 4.14-3.36 7.5-7.5 7.5z"/>
    </svg>`,
  Flood: `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M12 2c-3.5 4.5-7 9.5-7 13.5C5 19.64 8.36 23 12.5 23s7.5-3.36 7.5-7.5C20 11.5 15.5 6.5 12 2zm0 18.5c-2.76 0-5-2.24-5-5 0-2.88 2.88-7.19 5-9.88 2.12 2.69 5 7 5 9.88 0 2.76-2.24 5-5 5z"/>
    </svg>`,
  'Road Accident': `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
    </svg>`,
  'Medical Emergency': `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M19 10.5h-5.5V5c0-.55-.45-1-1-1h-1c-.55 0-1 .45-1 1v5.5H5c-.55 0-1 .45-1 1v1c0 .55.45 1 1 1h5.5V19c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-5.5H19c.55 0 1-.45 1-1v-1c0-.55-.45-1-1-1z"/>
    </svg>`,
  Earthquake: `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M12 2L2 22h20L12 2zm0 3.99L19.53 20H4.47L12 5.99zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z"/>
    </svg>`,
  Landslide: `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M14 6l-4.22 5.63 1.77 2.37L10 16l-4-5.33L2 16h20l-8-10zm-6.5 5.5l2.5-3.33 2.5 3.33h-5z"/>
    </svg>`,
  'Building Collapse': `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M12 3L2 12h3v8h14v-8h3L12 3zm0 2.84L18 11.2V18H6v-6.8l6-5.36zM9 13h2v3H9zm4 0h2v3h-2z"/>
    </svg>`,
  Cyclone: `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
    </svg>`,
  Other: `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
    </svg>`,
  Team: `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
    </svg>`,
  Hospital: `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z"/>
    </svg>`,
};

/**
 * Creates custom incident DivIcon
 */
export function createIncidentIcon(type, severity) {
  const iconSvg = SVG_ICONS[type] || SVG_ICONS.Other;
  const isCritical = String(severity).toLowerCase() === 'critical';
  const size = isCritical ? 34 : 30;

  return L.divIcon({
    className: 'custom-map-marker-wrapper',
    html: `
      <div class="custom-map-marker marker-sev-${severity}" style="width: ${size}px; height: ${size}px;" title="${type} - ${severity}">
        ${iconSvg}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4],
  });
}

/**
 * Creates cluster DivIcon
 */
export function createClusterIcon(count, hasCritical = false) {
  const size = count < 10 ? 36 : count < 50 ? 44 : 52;
  const criticalClass = hasCritical ? 'has-critical' : '';

  return L.divIcon({
    className: 'custom-cluster-wrapper',
    html: `
      <div class="cluster-marker ${criticalClass}" style="width: ${size}px; height: ${size}px;">
        <span class="cluster-count">${count}</span>
        <span class="cluster-sub">INCIDENTS</span>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

/**
 * Creates response team DivIcon
 */
export function createTeamIcon(status) {
  const isEnRoute = status === 'En Route';
  const isOnScene = status === 'On Scene';
  const statusClass = isOnScene ? 'status-on-scene' : isEnRoute ? 'status-en-route' : '';

  return L.divIcon({
    className: 'custom-team-wrapper',
    html: `
      <div class="team-marker ${statusClass}" style="width: 32px; height: 32px;" title="Rescue Unit (${status})">
        ${SVG_ICONS.Team}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
}

/**
 * Creates user GPS DivIcon
 */
export function createUserGpsIcon() {
  return L.divIcon({
    className: 'custom-user-gps-wrapper',
    html: `
      <div class="user-gps-marker" title="Your GPS Location">
        <div class="user-gps-dot"></div>
        <div class="user-gps-pulse"></div>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -12],
  });
}

/**
 * Creates hospital DivIcon
 */
export function createHospitalIcon() {
  return L.divIcon({
    className: 'custom-hospital-wrapper',
    html: `
      <div class="custom-map-marker" style="width: 28px; height: 28px; background: #2F6FE0; border: 2px solid #ffffff; color: #ffffff;" title="Emergency Hospital">
        ${SVG_ICONS.Hospital}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}
