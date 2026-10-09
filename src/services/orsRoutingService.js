// OpenRouteService (ORS) Integration — Routing Service (Frontend)
// Docs: https://openrouteservice.org/dev/#/api-docs
// Requires: VITE_ORS_API_KEY in .env (optional — falls back to OSRM if not set)
// ORS provides alternative road routing with additional profile options.

const ORS_BASE = 'https://api.openrouteservice.org/v2/directions/driving-car/geojson';
const ORS_API_KEY = import.meta.env?.VITE_ORS_API_KEY || null;

/**
 * Request road route from OpenRouteService.
 * Returns same shape as fetchOSRMRoute in geoUtils.js for drop-in compatibility.
 *
 * @param {{ latitude: number, longitude: number }} origin
 * @param {{ latitude: number, longitude: number }} destination
 * @returns {Promise<{ status: 'ok'|'error', coordinates: [lat,lng][], distanceKm: number, durationMin: number, provider: string, message?: string }>}
 */
export async function fetchORSRoute(origin, destination) {
  if (!ORS_API_KEY) {
    return {
      status: 'error',
      message: 'OpenRouteService API key not configured. Set VITE_ORS_API_KEY in .env to enable ORS routing.',
      provider: 'openrouteservice',
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const body = {
      coordinates: [
        [origin.longitude, origin.latitude],
        [destination.longitude, destination.latitude],
      ],
    };

    const res = await fetch(ORS_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: ORS_API_KEY,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`ORS HTTP ${res.status}: ${errBody.slice(0, 120)}`);
    }

    const data = await res.json();
    const feature = data?.features?.[0];
    if (!feature) throw new Error('ORS returned no route features');

    const rawCoords = feature.geometry.coordinates; // GeoJSON [lng, lat]
    const coordinates = rawCoords.map(([lng, lat]) => [lat, lng]); // → Leaflet [lat, lng]

    const summary = feature.properties?.summary || {};
    const distanceKm = Math.round((summary.distance / 1000) * 10) / 10;
    const durationMin = Math.max(1, Math.round(summary.duration / 60));

    return {
      status: 'ok',
      routeType: 'road',
      coordinates,
      distanceKm,
      durationMin,
      provider: 'openrouteservice',
    };
  } catch (err) {
    clearTimeout(timeoutId);
    const isTimeout = err.name === 'AbortError';
    return {
      status: 'error',
      message: isTimeout
        ? 'OpenRouteService request timed out.'
        : `ORS routing failed: ${err.message}`,
      provider: 'openrouteservice',
    };
  }
}

/**
 * Returns whether ORS is configured and ready.
 * Use to show/hide ORS-specific UI elements.
 */
export function isORSConfigured() {
  return Boolean(ORS_API_KEY);
}

export default { fetchORSRoute, isORSConfigured };
