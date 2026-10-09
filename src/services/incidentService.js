// Incident Service (Section E, V, W, X)
// Implements clean service architecture with REST API endpoints:
// GET /api/incidents, GET /api/incidents/:id, POST /api/incidents, PATCH /api/incidents/:id
// When backend is unavailable, gracefully uses synchronized local storage with DEMO_INCIDENTS.

import { DEMO_INCIDENTS } from '../data/demoIncidents.js';
import { validateCoordinates, GHAZIABAD_CONFIG } from '../utils/geoUtils.js';

const API_BASE = import.meta.env?.VITE_API_BASE_URL || '';
const STORAGE_KEY = 'resquard_incidents_ghaziabad_v1';

function loadStoredIncidents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore json error
  }
  return [...DEMO_INCIDENTS];
}

function saveStoredIncidents(incidents) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(incidents));
  } catch {
    // ignore storage quota error
  }
}

let inMemoryIncidents = loadStoredIncidents();

export const incidentService = {
  /**
   * Fetch all incidents
   * @returns {Promise<Array>}
   */
  async getIncidents() {
    if (API_BASE) {
      try {
        const res = await fetch(`${API_BASE}/api/incidents`);
        if (res.ok) {
          const json = await res.json();
          const items = Array.isArray(json)
            ? json
            : Array.isArray(json?.data?.incidents)
            ? json.data.incidents
            : Array.isArray(json?.data)
            ? json.data
            : [];
          if (items.length > 0) {
            inMemoryIncidents = items;
            saveStoredIncidents(items);
            return items;
          }
        }
      } catch (err) {
        console.warn('Backend API unavailable, falling back to local dataset:', err.message);
      }
    }
    return [...inMemoryIncidents];
  },

  /**
   * Fetch a single incident by ID
   * @param {string} id
   */
  async getIncidentById(id) {
    if (API_BASE) {
      try {
        const res = await fetch(`${API_BASE}/api/incidents/${id}`);
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.warn('Backend API unavailable:', err.message);
      }
    }
    return inMemoryIncidents.find((i) => i.id === id) || null;
  },

  /**
   * Create a new incident report
   * @param {Object} incidentData
   */
  async createIncident(incidentData) {
    const now = new Date().toISOString();
    const maxNum = inMemoryIncidents.reduce((max, i) => {
      const num = parseInt(String(i.id).replace('INC-', ''), 10);
      return Number.isFinite(num) ? Math.max(max, num) : max;
    }, 1000);

    const reqLat = parseFloat(incidentData.latitude);
    const reqLng = parseFloat(incidentData.longitude);
    const validLat = Number.isFinite(reqLat) ? reqLat : GHAZIABAD_CONFIG.center[0];
    const validLng = Number.isFinite(reqLng) ? reqLng : GHAZIABAD_CONFIG.center[1];

    const geoCheck = validateCoordinates({ latitude: validLat, longitude: validLng });
    if (!geoCheck.insideArea) {
      console.warn('[IncidentService] Warning: coordinates outside operational boundary:', geoCheck.error);
    }

    const newIncident = {
      id: `INC-${maxNum + 1}`,
      type: incidentData.type || 'Other',
      title: incidentData.title || `${incidentData.type || 'Disaster'} Emergency`,
      description: incidentData.description || incidentData.desc || 'No description provided.',
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
      affectedPeople: parseInt(incidentData.affectedPeople || incidentData.affected, 10) || 0,
      priority: incidentData.severity === 'Critical' ? 1 : incidentData.severity === 'High' ? 2 : 3,
      // Backward compatibility aliases:
      location: incidentData.address || incidentData.location || 'Location pending verification',
      affected: parseInt(incidentData.affectedPeople || incidentData.affected, 10) || 0,
      desc: incidentData.description || incidentData.desc || 'No description provided.',
      time: 'Just now',
      x: 50,
      y: 50,
    };

    if (API_BASE) {
      try {
        const res = await fetch(`${API_BASE}/api/incidents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newIncident),
        });
        if (res.ok) {
          const saved = await res.json();
          inMemoryIncidents = [saved, ...inMemoryIncidents];
          saveStoredIncidents(inMemoryIncidents);
          return saved;
        }
      } catch (err) {
        console.warn('Backend POST failed, storing locally:', err.message);
      }
    }

    inMemoryIncidents = [newIncident, ...inMemoryIncidents];
    saveStoredIncidents(inMemoryIncidents);
    return newIncident;
  },

  /**
   * Update incident fields (status, assigned team, etc.)
   * @param {string} id
   * @param {Object} patchData
   */
  async updateIncident(id, patchData) {
    const now = new Date().toISOString();
    const updatedFields = { ...patchData, updatedAt: now };

    if (API_BASE) {
      try {
        const res = await fetch(`${API_BASE}/api/incidents/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedFields),
        });
        if (res.ok) {
          const saved = await res.json();
          inMemoryIncidents = inMemoryIncidents.map((i) => (i.id === id ? saved : i));
          saveStoredIncidents(inMemoryIncidents);
          return saved;
        }
      } catch (err) {
        console.warn('Backend PATCH failed, updating locally:', err.message);
      }
    }

    inMemoryIncidents = inMemoryIncidents.map((i) => {
      if (i.id === id) {
        const merged = { ...i, ...updatedFields };
        if (updatedFields.status) {
          merged.status = updatedFields.status;
          if (updatedFields.status === 'Resolved') {
            merged.severity = 'Resolved';
          }
        }
        if (updatedFields.team) {
          merged.team = updatedFields.team;
        }
        if (updatedFields.assignedTeamId) {
          merged.assignedTeamId = updatedFields.assignedTeamId;
        }
        return merged;
      }
      return i;
    });

    saveStoredIncidents(inMemoryIncidents);
    return inMemoryIncidents.find((i) => i.id === id);
  },

  /**
   * Reset to pristine initial demo dataset
   */
  resetDemoData() {
    inMemoryIncidents = [...DEMO_INCIDENTS];
    saveStoredIncidents(inMemoryIncidents);
    return [...inMemoryIncidents];
  },
};

export default incidentService;
