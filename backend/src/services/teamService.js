import teamRepository from '../repositories/teamRepository.js';

const TEAM_STATUSES = ['available', 'assigned', 'deployed', 'standby', 'off-duty'];

function notFound(id) {
  const error = new Error(`Team with ID '${id}' not found.`);
  error.statusCode = 404;
  error.errorCode = 'TEAM_NOT_FOUND';
  return error;
}

class TeamService {
  async getTeams(query = {}) {
    const { availability, status, type, search, page = 1, limit = 20, sortBy = 'name', sortOrder = 'asc' } = query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const allowedSortFields = ['createdAt', 'name', 'type', 'availability', 'location'];
    const field = allowedSortFields.includes(sortBy) ? sortBy : 'name';
    const order = sortOrder === 'desc' || sortOrder === '-1' ? -1 : 1;
    const wantedStatus = (availability || status || '').toLowerCase().trim();
    const wantedType = (type || '').toLowerCase().trim();
    const term = (search || '').trim().toLowerCase();

    const allTeams = await teamRepository.findAll();
    const teams = allTeams.filter((team) =>
      (!wantedStatus || team.availability === wantedStatus) &&
      (!wantedType || team.type.toLowerCase() === wantedType) &&
      (!term || [team.name, team.location, team.type, team.teamCode].some((value) => String(value || '').toLowerCase().includes(term)))
    );
    teams.sort((a, b) => String(a[field] || '').localeCompare(String(b[field] || '')) * order);
    return { data: teams.slice((pageNum - 1) * limitNum, pageNum * limitNum), total: teams.length, page: pageNum, limit: limitNum };
  }

  async getTeamById(id) {
    const team = await teamRepository.findById(id);
    if (!team) throw notFound(id);
    return team;
  }

  async createTeam(payload) {
    if (!payload.name || !payload.type || !payload.location) {
      const error = new Error('Team name, type, and location are required.');
      error.statusCode = 400;
      error.errorCode = 'MISSING_REQUIRED_FIELDS';
      throw error;
    }
    const status = String(payload.availability || payload.status || 'available').toLowerCase();
    if (!TEAM_STATUSES.includes(status)) {
      const error = new Error(`Invalid team status '${status}'. Allowed: ${TEAM_STATUSES.join(', ')}`);
      error.statusCode = 400;
      error.errorCode = 'INVALID_STATUS';
      throw error;
    }
    return teamRepository.create({
      ...payload,
      availability: status,
      status,
      members: Array.isArray(payload.members) ? payload.members : [],
      latitude: payload.latitude == null ? null : Number(payload.latitude),
      longitude: payload.longitude == null ? null : Number(payload.longitude),
    });
  }

  async updateTeam(id, payload) {
    await this.getTeamById(id);
    const updates = { ...payload };
    const status = payload.availability || payload.status;
    if (status) {
      updates.availability = String(status).toLowerCase();
      updates.status = updates.availability;
      if (!TEAM_STATUSES.includes(updates.availability)) {
        const error = new Error(`Invalid team status '${status}'. Allowed: ${TEAM_STATUSES.join(', ')}`);
        error.statusCode = 400;
        error.errorCode = 'INVALID_STATUS';
        throw error;
      }
    }
    if (payload.latitude !== undefined) updates.latitude = Number(payload.latitude);
    if (payload.longitude !== undefined) updates.longitude = Number(payload.longitude);
    return teamRepository.update(id, updates);
  }

  async updateTeamStatus(id, status, currentIncidentId) {
    if (!status) {
      const error = new Error('Status/availability field is required.');
      error.statusCode = 400;
      error.errorCode = 'STATUS_REQUIRED';
      throw error;
    }
    const normalized = String(status).toLowerCase().trim();
    if (!TEAM_STATUSES.includes(normalized)) {
      const error = new Error(`Invalid team status '${status}'. Allowed: ${TEAM_STATUSES.join(', ')}`);
      error.statusCode = 400;
      error.errorCode = 'INVALID_STATUS';
      throw error;
    }
    await this.getTeamById(id);
    const updates = {
      availability: normalized,
      status: normalized,
    };
    if (currentIncidentId !== undefined) {
      updates.assignedIncident = currentIncidentId || null;
      updates.currentIncidentId = currentIncidentId || null;
    }
    return teamRepository.update(id, updates);
  }

  async deleteTeam(id) {
    const team = await teamRepository.delete(id);
    if (!team) throw notFound(id);
    return { id: team.id, message: `Team ${team.id} deleted successfully.` };
  }
}

export const teamService = new TeamService();
export default teamService;
