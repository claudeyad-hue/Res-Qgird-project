// Incident Service (Section E, V, W, X)
// Implements clean service architecture with REST API endpoints:
// GET /api/incidents, GET /api/incidents/:id, POST /api/incidents, PATCH /api/incidents/:id
// Operational incidents are read from the configured backend only.
import { validateCoordinates } from '../utils/geoUtils.js';
import { API_BASE } from './apiConfig.js';
import { apiFetch } from './apiClient.js';
try { localStorage.removeItem('resquard_incidents_ghaziabad_v1'); } catch { /* Storage may be unavailable. */ }
let inMemoryIncidents = [];

export const incidentService = {
  /**
   * Fetch all incidents
   * @returns {Promise<Array>}
   */
  async getIncidents() {
    if (!API_BASE) return [];
    const res = await apiFetch('incidents');
    if (!res.ok) throw new Error(`Incident request failed (${res.status}).`);
    const json = await res.json();
    const items = Array.isArray(json)
      ? json
      : Array.isArray(json?.data?.incidents)
      ? json.data.incidents
      : Array.isArray(json?.data)
      ? json.data
      : null;
    if (!items) throw new Error('Incident service returned an invalid record list.');
    inMemoryIncidents = items;
    return items;
  },

  /**
   * Fetch a single incident by ID
   * @param {string} id
   */
  async getIncidentById(id) {
    if (!API_BASE) return null;
    const res = await apiFetch(`incidents/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error(`Incident request failed (${res.status}).`);
    const payload = await res.json();
    return payload.data || payload;
  },

  /**
   * Create a new incident report
   * @param {Object} incidentData
   */
  async createIncident(incidentData) {
    if (!API_BASE) throw new Error('Incident reporting is unavailable until the backend is connected.');
    const now = new Date().toISOString();
    const maxNum = inMemoryIncidents.reduce((max, i) => {
      const num = parseInt(String(i.id).replace('INC-', ''), 10);
      return Number.isFinite(num) ? Math.max(max, num) : max;
    }, 1000);

    const reqLat = parseFloat(incidentData.latitude);
    const reqLng = parseFloat(incidentData.longitude);
    const validLat = reqLat;
    const validLng = reqLng;

    if (!String(incidentData.title || '').trim() || !String(incidentData.type || '').trim() || !String(incidentData.location || incidentData.address || '').trim() || !String(incidentData.description || incidentData.desc || '').trim() || !Number.isFinite(validLat) || !Number.isFinite(validLng)) {
      throw new Error('Incident title, type, description, location and coordinates are required.');
    }

    const geoCheck = validateCoordinates({ latitude: validLat, longitude: validLng });
    if (!geoCheck.insideArea) {
      throw new Error(geoCheck.error || 'Incident coordinates are outside the Ghaziabad operational area.');
    }

    const newIncident = {
      id: `INC-${maxNum + 1}`,
      type: incidentData.type || 'Other',
      title: incidentData.title || `${incidentData.type || 'Disaster'} Emergency`,
      description: incidentData.description || incidentData.desc,
      latitude: validLat,
      longitude: validLng,
      severity: incidentData.severity || 'Medium',
      status: 'Reported',
      reportedAt: now,
      updatedAt: now,
      address: incidentData.address || incidentData.location || 'Location pending verification',
      reportedBy: incidentData.reportedBy || 'Public / Field Report',
      assignedTeamId: null,
      team: null,
      affectedPeople: incidentData.affectedPeople == null && incidentData.affected == null ? null : parseInt(incidentData.affectedPeople ?? incidentData.affected, 10),
      priority: incidentData.severity === 'Critical' ? 1 : incidentData.severity === 'High' ? 2 : 3,
      // Backward compatibility aliases:
      location: incidentData.address || incidentData.location || 'Location pending verification',
      affected: parseInt(incidentData.affectedPeople || incidentData.affected, 10) || 0,
      desc: incidentData.description || incidentData.desc || 'No description provided.',
      time: 'Just now',
      x: 50,
      y: 50,
    };

    const res = await apiFetch('incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newIncident),
    });
    if (!res.ok) throw new Error(`Incident report failed (${res.status}).`);
    const payload = await res.json();
    const saved = payload.data || payload;
    const record = saved.data || saved;
    inMemoryIncidents = [record, ...inMemoryIncidents];
    return record;
  },

  /**
   * Update incident fields (status, assigned team, etc.)
   * @param {string} id
   * @param {Object} patchData
   */
  async updateIncident(id, patchData) {
    if (!API_BASE) throw new Error('Incident updates are unavailable until the backend is connected.');
    const now = new Date().toISOString();
    const updatedFields = { ...patchData, updatedAt: now };

    const res = await apiFetch(`incidents/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedFields),
    });
    if (!res.ok) throw new Error(`Incident update failed (${res.status}).`);
    const payload = await res.json();
    const saved = payload.data || payload;
    inMemoryIncidents = inMemoryIncidents.map((incident) => incident.id === id ? (saved.data || saved) : incident);
    return saved;
  },
};

export default incidentService;
