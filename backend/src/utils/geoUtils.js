// Geospatial Utilities for Backend Validation
// Ghaziabad Operational Boundary and Geographic Validator

export const GHAZIABAD_CONFIG = {
  id: 'GHAZIABAD_UP',
  name: 'Ghaziabad, Uttar Pradesh, India',
  city: 'Ghaziabad',
  state: 'Uttar Pradesh',
  country: 'India',
  center: [28.6692, 77.4538],
  boundingBox: {
    minLat: 28.5800,
    maxLat: 28.7800,
    minLng: 77.3000,
    maxLng: 77.5600,
  },
  boundaryPolygon: [
    [28.7650, 77.4100],
    [28.7750, 77.4700],
    [28.7400, 77.5300],
    [28.6850, 77.5450],
    [28.6300, 77.5250],
    [28.6000, 77.4550],
    [28.6320, 77.3680],
    [28.6350, 77.3150],
    [28.6850, 77.3300],
    [28.7300, 77.3700],
  ],
};

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

  if (
    latitude < boundingBox.minLat ||
    latitude > boundingBox.maxLat ||
    longitude < boundingBox.minLng ||
    longitude > boundingBox.maxLng
  ) {
    return false;
  }

  return isPointInPolygon([latitude, longitude], boundaryPolygon);
}

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
      error: `Coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)}) fall outside the active operational area (${config.name}).`,
    };
  }

  return { valid: true, insideArea: true };
}

export function calculateDistance(pointA, pointB) {
  if (
    !pointA || !pointB ||
    typeof pointA.latitude !== 'number' || typeof pointA.longitude !== 'number' ||
    typeof pointB.latitude !== 'number' || typeof pointB.longitude !== 'number'
  ) {
    return Infinity;
  }

  const R = 6371; // Earth's radius in km
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(pointB.latitude - pointA.latitude);
  const dLon = toRad(pointB.longitude - pointA.longitude);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(pointA.latitude)) *
      Math.cos(toRad(pointB.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

