// Routing Service
// Integrates OSRM road-routing engine on the backend with strict Ghaziabad boundary enforcement.
import incidentRepository from '../repositories/incidentRepository.js';
import hospitalRepository from '../repositories/hospitalRepository.js';
import { validateCoordinates } from '../utils/geoUtils.js';

class RoutingService {
  /**
   * Calls OSRM road-routing engine.
   * Returns decoded road geometry, road distance (km), and driving duration (min).
   */
  async requestRoadRoute(origin, destination) {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}` +
      `?overview=full&geometries=geojson&steps=false`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000); // 12-second timeout

    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`OSRM routing server responded with HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        throw new Error(data.message || 'No drivable route found between coordinates.');
      }

      const route = data.routes[0];
      const rawCoords = route.geometry.coordinates; // GeoJSON is [lng, lat]
      // Leaflet expects [lat, lng]
      const coordinates = rawCoords.map(([lng, lat]) => [lat, lng]);
      const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
      const durationMin = Math.max(1, Math.round(route.duration / 60));

      return {
        status: 'ok',
        routeType: 'road',
        coordinates,
        distanceKm,
        durationMin,
      };
    } catch (err) {
      clearTimeout(timeout);
      const isTimeout = err.name === 'AbortError';
      const errorMsg = isTimeout
        ? 'Routing service request timed out.'
        : `External road routing engine failed: ${err.message}`;

      const error = new Error(errorMsg);
      error.statusCode = 502;
      error.errorCode = 'ROUTING_SERVICE_UNAVAILABLE';
      throw error;
    }
  }

  /**
   * Phase H: Route to Incident
   * Origin: { latitude, longitude }
   * Destination: destinationId (Incident ID)
   */
  async calculateRouteToIncident({ origin, destinationId }) {
    if (!origin || typeof origin.latitude !== 'number' || typeof origin.longitude !== 'number') {
      const err = new Error('Valid origin with latitude and longitude is required.');
      err.statusCode = 400;
      err.errorCode = 'INVALID_ORIGIN_COORDINATES';
      throw err;
    }

    if (!destinationId) {
      const err = new Error('destinationId (Incident ID) is required.');
      err.statusCode = 400;
      err.errorCode = 'MISSING_DESTINATION_ID';
      throw err;
    }

    // 1. Validate Origin Coordinates & Operational Area
    const originCheck = validateCoordinates(origin);
    if (!originCheck.insideArea) {
      const err = new Error(originCheck.error || 'Origin is outside the Ghaziabad operational area.');
      err.statusCode = 400;
      err.errorCode = 'OUT_OF_OPERATIONAL_AREA';
      throw err;
    }

    // 2. Resolve Destination Incident
    const incident = await incidentRepository.findById(destinationId);
    if (!incident) {
      const err = new Error(`Incident with ID '${destinationId}' not found.`);
      err.statusCode = 404;
      err.errorCode = 'INCIDENT_NOT_FOUND';
      throw err;
    }

    const destination = {
      latitude: incident.latitude,
      longitude: incident.longitude,
    };

    // 3. Validate Destination Coordinates & Operational Area
    const destCheck = validateCoordinates(destination);
    if (!destCheck.insideArea) {
      const err = new Error(destCheck.error || 'Incident destination is outside the Ghaziabad operational area.');
      err.statusCode = 400;
      err.errorCode = 'DESTINATION_OUT_OF_AREA';
      throw err;
    }

    // 4. Request Road Route from Provider
    const routeResult = await this.requestRoadRoute(origin, destination);

    return {
      ...routeResult,
      origin: { latitude: origin.latitude, longitude: origin.longitude },
      destination: {
        id: incident.id,
        title: incident.title || incident.type,
        type: incident.type,
        severity: incident.severity,
        address: incident.address || incident.location,
        latitude: incident.latitude,
        longitude: incident.longitude,
      },
    };
  }

  /**
   * Phase H: Route to Hospital
   * Origin: { latitude, longitude } or incidentId
   * Destination: destinationId (Hospital ID)
   */
  async calculateRouteToHospital({ origin, incidentId, destinationId }) {
    if (!destinationId) {
      const err = new Error('destinationId (Hospital ID) is required.');
      err.statusCode = 400;
      err.errorCode = 'MISSING_DESTINATION_ID';
      throw err;
    }

    // Resolve Origin Coordinates
    let originCoords = null;
    if (origin && typeof origin.latitude === 'number' && typeof origin.longitude === 'number') {
      originCoords = origin;
    } else if (incidentId) {
      const incident = await incidentRepository.findById(incidentId);
      if (!incident) {
        const err = new Error(`Incident origin '${incidentId}' not found.`);
        err.statusCode = 404;
        err.errorCode = 'INCIDENT_ORIGIN_NOT_FOUND';
        throw err;
      }
      originCoords = { latitude: incident.latitude, longitude: incident.longitude };
    } else {
      const err = new Error('A valid origin (coordinates or incidentId) is required.');
      err.statusCode = 400;
      err.errorCode = 'INVALID_ORIGIN';
      throw err;
    }

    // 1. Validate Origin Coordinates & Operational Area
    const originCheck = validateCoordinates(originCoords);
    if (!originCheck.insideArea) {
      const err = new Error(originCheck.error || 'Route origin is outside the Ghaziabad operational area.');
      err.statusCode = 400;
      err.errorCode = 'OUT_OF_OPERATIONAL_AREA';
      throw err;
    }

    // 2. Resolve Destination Hospital
    const hospital = await hospitalRepository.findById(destinationId);
    if (!hospital) {
      const err = new Error(`Hospital with ID '${destinationId}' not found.`);
      err.statusCode = 404;
      err.errorCode = 'HOSPITAL_NOT_FOUND';
      throw err;
    }

    // Check if hospital is marked unavailable
    const status = String(hospital.status || '').toLowerCase();
    if (status === 'unavailable' || status === 'closed' || status === 'diverting') {
      const err = new Error(`Hospital '${hospital.name}' is currently unavailable/diverting.`);
      err.statusCode = 400;
      err.errorCode = 'HOSPITAL_UNAVAILABLE';
      throw err;
    }

    const destination = {
      latitude: hospital.latitude,
      longitude: hospital.longitude,
    };

    // 3. Validate Destination Coordinates & Operational Area
    const destCheck = validateCoordinates(destination);
    if (!destCheck.insideArea) {
      const err = new Error(destCheck.error || 'Hospital destination is outside the Ghaziabad operational area.');
      err.statusCode = 400;
      err.errorCode = 'DESTINATION_OUT_OF_AREA';
      throw err;
    }

    // 4. Request Road Route from Provider
    const routeResult = await this.requestRoadRoute(originCoords, destination);

    return {
      ...routeResult,
      origin: originCoords,
      destination: {
        id: hospital.id,
        name: hospital.name,
        status: hospital.status,
        address: hospital.address || hospital.location,
        latitude: hospital.latitude,
        longitude: hospital.longitude,
      },
    };
  }
}

export const routingService = new RoutingService();
export default routingService;
