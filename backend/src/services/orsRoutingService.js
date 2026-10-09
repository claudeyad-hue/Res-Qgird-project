// OpenRouteService (ORS) Backend Routing Integration
// Docs: https://openrouteservice.org/dev/#/api-docs
// Requires: ORS_API_KEY in backend .env (optional — falls back to OSRM if not set)

const ORS_BASE = 'https://api.openrouteservice.org/v2/directions/driving-car/geojson';

/**
 * Request road route from OpenRouteService (backend).
 * Returns same shape as the OSRM requestRoadRoute for drop-in compatibility.
 *
 * @param {{ latitude: number, longitude: number }} origin
 * @param {{ latitude: number, longitude: number }} destination
 * @returns {Promise<{ status: 'ok'|'error', routeType: string, coordinates: Array, distanceKm: number, durationMin: number, provider: string }>}
 */
export async function requestORSRoute(origin, destination) {
  const apiKey = process.env.ORS_API_KEY;

  if (!apiKey) {
    const err = new Error(
      'OpenRouteService API key not configured. ' +
      'Set ORS_API_KEY in backend .env to enable ORS routing.'
    );
    err.statusCode = 503;
    err.errorCode = 'ORS_NOT_CONFIGURED';
    throw err;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

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
        Authorization: apiKey,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`ORS HTTP ${res.status}: ${errBody.slice(0, 200)}`);
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
    clearTimeout(timeout);
    const isTimeout = err.name === 'AbortError';
    const error = new Error(
      isTimeout ? 'ORS routing request timed out.' : `ORS routing failed: ${err.message}`
    );
    error.statusCode = err.statusCode || 502;
    error.errorCode = 'ORS_ROUTING_FAILED';
    throw error;
  }
}

/**
 * Returns true if ORS_API_KEY is configured in environment.
 */
export function isORSConfigured() {
  return Boolean(process.env.ORS_API_KEY);
}

export default { requestORSRoute, isORSConfigured };
