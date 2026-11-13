import { DEMO_TEAMS } from '../data/demoTeams.js';
import { API_BASE } from './apiConfig.js';
import { apiFetch } from './apiClient.js';
const STORAGE_KEY = 'resquard_teams_v2';

function normalizeTeam(team) {
  return {
    ...team,
    id: team.id || team.teamCode || team.teamId,
    teamId: team.teamId || team.teamCode || team.id,
    status: team.status || team.availability || 'available',
    currentIncidentId: team.currentIncidentId ?? team.assignedIncident ?? null,
  };
}

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
        const res = await apiFetch('teams');
        if (!res.ok) throw new Error(`Team request failed (${res.status}).`);
        if (res.ok) {
          const json = await res.json();
          const items = Array.isArray(json)
            ? json
            : Array.isArray(json?.data)
            ? json.data
            : [];
          if (Array.isArray(json?.data) || items.length > 0) {
            inMemoryTeams = items.map(normalizeTeam);
            saveStoredTeams(inMemoryTeams);
            return inMemoryTeams;
          }
        }
      } catch (err) {
        if (API_BASE) throw err;
        console.warn('Backend /api/teams unavailable, using local teams:', err.message);
      }
    }
    return [...inMemoryTeams];
  },

  async updateTeamStatus(teamId, status, currentIncidentId = null) {
    if (API_BASE) {
      const response = await apiFetch(`teams/${encodeURIComponent(teamId)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, currentIncidentId }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || 'Team status update failed.');
      }
      const updated = payload.data;
      inMemoryTeams = inMemoryTeams.map((team) => (team.teamId === teamId || team.id === teamId ? updated : team));
      saveStoredTeams(inMemoryTeams);
      return updated;
    }

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
