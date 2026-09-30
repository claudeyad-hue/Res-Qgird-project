import { DEMO_TEAMS } from '../data/demoTeams.js';

const API_BASE = import.meta.env?.VITE_API_BASE_URL || '';
const STORAGE_KEY = 'resquard_teams_v2';

function loadStoredTeams() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [...DEMO_TEAMS];
}

function saveStoredTeams(teams) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(teams));
  } catch {}
}

let inMemoryTeams = loadStoredTeams();

export const teamService = {
  async getTeams() {
    if (API_BASE) {
      try {
        const res = await fetch(`${API_BASE}/api/teams`);
        if (res.ok) {
          const json = await res.json();
          const items = Array.isArray(json)
            ? json
            : Array.isArray(json?.data)
            ? json.data
            : [];
          if (items.length > 0) {
            inMemoryTeams = items;
            saveStoredTeams(items);
            return items;
          }
        }
      } catch (err) {
        console.warn('Backend /api/teams unavailable, using local teams:', err.message);
      }
    }
    return [...inMemoryTeams];
  },

  async updateTeamStatus(teamId, status, currentIncidentId = null) {
    inMemoryTeams = inMemoryTeams.map((t) => {
      if (t.teamId === teamId) {
        return {
          ...t,
          status,
          currentIncidentId: currentIncidentId !== undefined ? currentIncidentId : t.currentIncidentId,
        };
      }
      return t;
    });
    saveStoredTeams(inMemoryTeams);
    return inMemoryTeams.find((t) => t.teamId === teamId);
  },
};

export default teamService;
