<<<<<<< HEAD
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

=======
import mongoose from 'mongoose';
import Team from '../models/Team.js';

class TeamService {
  async getTeams(query = {}) {
    const {
      availability,
      status,
      type,
      search,
      page = 1,
      limit = 20,
      sortBy = 'name',
      sortOrder = 'asc',
    } = query;

    const filter = {};

    const availFilter = availability || status;
    if (availFilter) {
      filter.availability = availFilter.toLowerCase().trim();
    }

    if (type) {
      filter.type = new RegExp(`^${type.trim()}$`, 'i');
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { location: searchRegex },
        { type: searchRegex },
        { teamCode: searchRegex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const allowedSortFields = ['createdAt', 'name', 'type', 'availability', 'location'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'name';
    const safeSortOrder = sortOrder === 'desc' || sortOrder === '-1' ? -1 : 1;

    const [data, total] = await Promise.all([
      Team.find(filter)
        .sort({ [safeSortBy]: safeSortOrder })
        .skip(skip)
        .limit(limitNum)
        .populate('assignedIncident', 'title incidentCode location severity status')
        .lean({ virtuals: true }),
      Team.countDocuments(filter),
    ]);

    return {
      data,
      total,
      page: pageNum,
      limit: limitNum,
    };
  }

  async getTeamById(id) {
    let team = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      team = await Team.findById(id).populate('assignedIncident', 'title incidentCode location severity status');
    }

    if (!team) {
      team = await Team.findOne({ teamCode: id }).populate('assignedIncident', 'title incidentCode location severity status');
    }

    if (!team) {
      const err = new Error(`Team with ID '${id}' not found.`);
      err.statusCode = 404;
      err.errorCode = 'TEAM_NOT_FOUND';
      throw err;
    }

    return team;
  }

  async createTeam(payload) {
    if (!payload.name || !payload.type || !payload.location) {
      const err = new Error('Team name, type, and location are required.');
      err.statusCode = 400;
      err.errorCode = 'MISSING_REQUIRED_FIELDS';
      throw err;
    }

    const teamData = {
      name: payload.name,
      type: payload.type,
      location: payload.location,
      availability: (payload.availability || payload.status || 'available').toLowerCase(),
      contact: payload.contact || '',
      latitude: payload.latitude !== undefined ? parseFloat(payload.latitude) : null,
      longitude: payload.longitude !== undefined ? parseFloat(payload.longitude) : null,
      members: Array.isArray(payload.members) ? payload.members : [],
    };

    if (payload.assignedIncident && mongoose.Types.ObjectId.isValid(payload.assignedIncident)) {
      teamData.assignedIncident = payload.assignedIncident;
    }

    if (payload.id && typeof payload.id === 'string' && payload.id.startsWith('TEAM-')) {
      teamData.teamCode = payload.id;
    }

    const team = await Team.create(teamData);
    return team;
  }

  async updateTeam(id, payload) {
    const team = await this.getTeamById(id);

    if (payload.name) team.name = payload.name;
    if (payload.type) team.type = payload.type;
    if (payload.location) team.location = payload.location;
    if (payload.contact !== undefined) team.contact = payload.contact;
    if (payload.availability) team.availability = payload.availability.toLowerCase();
    if (payload.status) team.availability = payload.status.toLowerCase();
    if (payload.latitude !== undefined) team.latitude = parseFloat(payload.latitude);
    if (payload.longitude !== undefined) team.longitude = parseFloat(payload.longitude);
    if (payload.members && Array.isArray(payload.members)) team.members = payload.members;

    if (payload.assignedIncident !== undefined) {
      team.assignedIncident = mongoose.Types.ObjectId.isValid(payload.assignedIncident) ? payload.assignedIncident : null;
    }

    await team.save();
    return team;
  }

  async updateTeamStatus(id, newStatus, currentIncidentId = null) {
    if (!newStatus) {
      const err = new Error('Status/availability field is required.');
      err.statusCode = 400;
      err.errorCode = 'STATUS_REQUIRED';
      throw err;
    }

    const team = await this.getTeamById(id);
    const valid = ['available', 'assigned', 'deployed', 'standby', 'off-duty'];
    const s = newStatus.toLowerCase().trim();

    if (!valid.includes(s)) {
      const err = new Error(`Invalid team status '${newStatus}'. Allowed: ${valid.join(', ')}`);
      err.statusCode = 400;
      err.errorCode = 'INVALID_STATUS';
      throw err;
    }

    team.availability = s;

    if (currentIncidentId !== undefined) {
      if (currentIncidentId && mongoose.Types.ObjectId.isValid(currentIncidentId)) {
        team.assignedIncident = currentIncidentId;
      } else if (!currentIncidentId) {
        team.assignedIncident = null;
      }
    }

    await team.save();
    return team;
  }

  async deleteTeam(id) {
    const team = await this.getTeamById(id);
    await Team.findByIdAndDelete(team._id);
    return { id: team.id, message: `Team ${team.id} deleted successfully.` };
  }
}

export const teamService = new TeamService();
>>>>>>> 929286bc51a871a5a567db8378397eb4df7d1f82
export default teamService;
