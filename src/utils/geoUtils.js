// Geospatial Utilities for ResQuard Disaster Management Console
// Ghaziabad-Only Geolocation, Operational Boundary Validation & Road Routing
// Uses browser Geolocation, Haversine formula, and real OSRM road-routing engine.

/**
 * Operational Configuration for Ghaziabad, Uttar Pradesh, India
 * Readily configurable for future operational expansion.
 */
export const GHAZIABAD_CONFIG = {
  id: 'GHAZIABAD_UP',
  name: 'Ghaziabad, Uttar Pradesh, India',
  city: 'Ghaziabad',
  state: 'Uttar Pradesh',
  country: 'India',
  center: [28.6692, 77.4538],
  defaultZoom: 12,
  minZoom: 10,
  maxZoom: 18,
  // Bounding box for fast pre-filtering
  boundingBox: {
    minLat: 28.5800,
    maxLat: 28.7800,
    minLng: 77.3000,
    maxLng: 77.5600,
  },
  // Documented approximate operational boundary polygon [lat, lng] vertices
  // Encloses the Ghaziabad Municipal and District operational response zone:
  // Muradnagar approach -> Duhai -> Govindpuram -> Dasna/Masuri -> Wave City ->
  // Crossings Republik -> Indirapuram -> Kaushambi/Anand Vihar -> Sahibabad -> Mohan Nagar
  boundaryPolygon: [
    [28.7650, 77.4100], // Northwest (Muradnagar approach)
    [28.7750, 77.4700], // North / Duhai
    [28.7400, 77.5300], // Northeast (Govindpuram / Dasna North)
    [28.6850, 77.5450], // East (Dasna / Masuri border)
    [28.6300, 77.5250], // Southeast (NH-9 / Wave City border)
    [28.6000, 77.4550], // South (Crossings Republik / Greater Noida West border)
    [28.6320, 77.3680], // Southwest (NH-9 border along Indirapuram / Noida Sector 62)
    [28.6350, 77.3150], // West-Southwest (Kaushambi / Delhi Anand Vihar border)
    [28.6850, 77.3300], // West (Sahibabad / Seemapuri Delhi border)
    [28.7300, 77.3700], // Northwest (Loni / Mohan Nagar approach)
  ],
};

/**
 * Point-in-polygon test using ray-casting algorithm.
 * @param {[number, number]} point [latitude, longitude]
 * @param {Array<[number, number]>} polygon Array of [latitude, longitude] vertices
 * @returns {boolean}
 */
export function isPointInPolygon(point, polygon) {
  if (!point || !Array.isArray(polygon) || polygon.length < 3) return false;
  const [lat, lng] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    const intersect =
      yi > lng !== yj > lng &&
      lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Validates whether a geographic coordinate falls inside the configured Ghaziabad operational area.
 * @param {{ latitude: number, longitude: number }} point
 * @param {typeof GHAZIABAD_CONFIG} [config]
 * @returns {boolean}
 */
export function isPointInOperationalArea(point, config = GHAZIABAD_CONFIG) {
  if (
    !point ||
    typeof point.latitude !== 'number' ||
    typeof point.longitude !== 'number' ||
    Number.isNaN(point.latitude) ||
    Number.isNaN(point.longitude)
  ) {
    return false;
  }

  const { latitude, longitude } = point;
  const { boundingBox, boundaryPolygon } = config;

  // 1. Fast bounding box rejection
  if (
    latitude < boundingBox.minLat ||
    latitude > boundingBox.maxLat ||
    longitude < boundingBox.minLng ||
    longitude > boundingBox.maxLng
  ) {
    return false;
  }

  // 2. Strict polygon ray-casting test
  return isPointInPolygon([latitude, longitude], boundaryPolygon);
}

/**
 * Comprehensive coordinate validator with descriptive status messages.
 * @param {{ latitude: number, longitude: number }} point
 * @param {typeof GHAZIABAD_CONFIG} [config]
 * @returns {{ valid: boolean, insideArea: boolean, error?: string }}
 */
export function validateCoordinates(point, config = GHAZIABAD_CONFIG) {
  if (!point) {
    return { valid: false, insideArea: false, error: 'No coordinates provided.' };
  }

  const lat = typeof point.latitude === 'number' ? point.latitude : parseFloat(point.latitude);
  const lng = typeof point.longitude === 'number' ? point.longitude : parseFloat(point.longitude);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return { valid: false, insideArea: false, error: 'Coordinates must be valid numbers.' };
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return { valid: false, insideArea: false, error: 'Coordinates out of global latitude/longitude range.' };
  }

  const inside = isPointInOperationalArea({ latitude: lat, longitude: lng }, config);
  if (!inside) {
    return {
      valid: true,
      insideArea: false,
      error: `Location (${lat.toFixed(4)}, ${lng.toFixed(4)}) is outside the active operational boundary (${config.name}).`,
    };
  }

  return { valid: true, insideArea: true };
}

/**
 * Haversine formula: calculates great-circle straight-line distance (km) between two coordinates.
 * @param {{ latitude: number, longitude: number }} pointA
 * @param {{ latitude: number, longitude: number }} pointB
 * @returns {number} Distance in kilometres (rounded to 2 decimal places)
 */
export function calculateDistance(pointA, pointB) {
  if (
    !pointA || !pointB ||
    typeof pointA.latitude !== 'number' || typeof pointA.longitude !== 'number' ||
    typeof pointB.latitude !== 'number' || typeof pointB.longitude !== 'number'
  ) {
    return Infinity;
  }

  const R = 6371; // Earth's radius in km
  const dLat = toRad(pointB.latitude - pointA.latitude);
  const dLon = toRad(pointB.longitude - pointA.longitude);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(pointA.latitude)) *
      Math.cos(toRad(pointB.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 100) / 100;
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Finds the nearest suitable hospital to a given incident within the configured Ghaziabad operational area.
 * 
 * Rules:
 * - Candidate hospitals must have valid coordinates inside the operational area.
 * - Hospitals explicitly marked 'unavailable' or 'closed' are excluded.
 * - Calculates straight-line distance dynamically via Haversine formula.
 * - Ranks eligible candidates by distance.
 *
 * @param {{ latitude: number, longitude: number }} point - Incident coordinates
 * @param {Array} hospitals - Array of hospital objects
 * @param {typeof GHAZIABAD_CONFIG} [config]
 * @returns {{ hospital: Object, distance: number, distanceType: 'straight-line', candidateCount: number } | null}
 */
export function findNearestHospital(point, hospitals, config = GHAZIABAD_CONFIG) {
  if (!point || !Array.isArray(hospitals) || hospitals.length === 0) return null;

  // 1. Filter hospitals with valid coordinates inside the Ghaziabad operational area
  const inAreaHospitals = hospitals.filter((h) => {
    if (typeof h.latitude !== 'number' || typeof h.longitude !== 'number') return false;
    return isPointInOperationalArea({ latitude: h.latitude, longitude: h.longitude }, config);
  });

  if (inAreaHospitals.length === 0) return null;

  // 2. Exclude hospitals explicitly marked unavailable or closed
  const eligibleHospitals = inAreaHospitals.filter((h) => {
    const status = String(h.status || '').toLowerCase();
    if (status === 'unavailable' || status === 'closed' || status === 'diverting') {
      return false;
    }
    return true;
  });

  if (eligibleHospitals.length === 0) return null;

  // 3. Compute dynamic straight-line distance and availability scoring
  const scored = eligibleHospitals.map((h) => {
    const dist = calculateDistance(point, h);
    const isAccepting = String(h.status).toLowerCase() === 'accepting';
    const hasBeds = (h.bedsAvail || 0) > 0;
    // Lower score is preferred: accepting with beds (0), accepting without beds (1), other (2)
    const tier = isAccepting && hasBeds ? 0 : isAccepting ? 1 : 2;
    return { hospital: h, distance: dist, tier };
  });

  // 4. Rank candidates: primary by distance, secondary by availability tier
  scored.sort((a, b) => {
    if (a.distance !== b.distance) {
      return a.distance - b.distance;
    }
    return a.tier - b.tier;
  });

  const best = scored[0];
  return {
    hospital: best.hospital,
    distance: best.distance,
    distanceType: 'straight-line',
    candidateCount: scored.length,
  };
}

/**
 * Fetches real road routing geometry, distance, and duration from the public OSRM driving engine.
 * 
 * Strict non-fabrication guarantees:
 * - If routing service fails or is unreachable, returns status: 'error' with empty coordinates.
 * - Never returns straight lines as road routes or hardcodes fake duration.
 *
 * @param {{ latitude: number, longitude: number }} origin
 * @param {{ latitude: number, longitude: number }} destination
 * @param {{ timeoutMs?: number }} [options]
 * @returns {Promise<{
 *   coordinates: Array<[number, number]>,
 *   distanceKm: number,
 *   durationMin: number,
 *   status: 'ok' | 'error',
 *   routeType: 'road' | 'none',
 *   message?: string
 * }>}
 */
export async function fetchOSRMRoute(origin, destination, options = {}) {
  const timeoutMs = options.timeoutMs || 12000;

  if (
    !origin || !destination ||
    typeof origin.latitude !== 'number' || typeof destination.latitude !== 'number' ||
    typeof origin.longitude !== 'number' || typeof destination.longitude !== 'number'
  ) {
    return {
      coordinates: [],
      distanceKm: 0,
      durationMin: 0,
      status: 'error',
      routeType: 'none',
      message: 'Invalid coordinate pair for routing request.',
    };
  }

  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}` +
    `?overview=full&geometries=geojson&steps=false`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`OSRM routing server responded with HTTP ${res.status}`);
    }

    const data = await res.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      throw new Error(`Routing calculation failed: ${data.message || data.code || 'No route found'}`);
    }

    const route = data.routes[0];
    const rawCoords = route.geometry.coordinates; // GeoJSON is [lng, lat]
    // Leaflet Polyline expects [lat, lng]
    const coordinates = rawCoords.map(([lng, lat]) => [lat, lng]);
    const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
    const durationMin = Math.max(1, Math.round(route.duration / 60));

    return {
      coordinates,
      distanceKm,
      durationMin,
      status: 'ok',
      routeType: 'road',
    };
  } catch (err) {
    const isTimeout = err.name === 'AbortError';
    const message = isTimeout
      ? 'Routing request timed out. Please check network connection.'
      : `Road routing failed (${err.message}). Route not available.`;

    // Strictly adhere to non-fabrication rule: do not fabricate straight-line geometry or ETA
    return {
      coordinates: [],
      distanceKm: 0,
      durationMin: 0,
      status: 'error',
      routeType: 'none',
      message,
    };
  }
}
