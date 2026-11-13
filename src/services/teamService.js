import { API_BASE } from './apiConfig.js';
import { apiFetch } from './apiClient.js';

function normalizeTeam(team) {
  return {
    ...team,
    id: team.id || team.teamCode || team.teamId,
    teamId: team.teamId || team.teamCode || team.id,
    status: team.status || team.availability || 'available',
    currentIncidentId: team.currentIncidentId ?? team.assignedIncident ?? null,
  };
}

try { localStorage.removeItem('resquard_teams_v2'); } catch { /* Storage may be unavailable. */ }
let inMemoryTeams = [];

export const teamService = {
  async getTeams() {
    if (!API_BASE) return [];
    const res = await apiFetch('teams');
    if (!res.ok) throw new Error(`Team request failed (${res.status}).`);
    const json = await res.json();
    const items = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : null;
    if (!items) throw new Error('Team service returned an invalid record list.');
    inMemoryTeams = items.map(normalizeTeam);
    return inMemoryTeams;
  },

  async updateTeamStatus(teamId, status, currentIncidentId = null) {
    if (!API_BASE) throw new Error('Team updates are unavailable until the backend is connected.');
    const response = await apiFetch(`teams/${encodeURIComponent(teamId)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, currentIncidentId }),
    });
    const payload = await response.json();
    if (!response.ok || !payload?.success) throw new Error(payload?.message || 'Team status update failed.');
    const updated = payload.data;
    inMemoryTeams = inMemoryTeams.map((team) => (team.teamId === teamId || team.id === teamId ? updated : team));
    return updated;
  },
};

export default teamService;
