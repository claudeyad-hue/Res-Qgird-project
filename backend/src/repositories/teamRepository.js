import Team from '../models/Team.js';
import Incident from '../models/Incident.js';
import { codeQuery, mongoIsReady, serializeDocument } from './mongoRepositoryUtils.js';

class TeamRepository {
  constructor() {
    this.teams = [];
  }

  async findAll() {
    if (mongoIsReady()) {
      const records = await Team.find({}).sort({ name: 1 });
      return records.map(serializeDocument);
    }
    return this.teams.map((team) => ({ ...team, members: [...team.members] }));
  }

  async findById(id) {
    if (mongoIsReady()) {
      const record = await Team.findOne(codeQuery(Team, 'teamCode', id));
      return serializeDocument(record);
    }
    const key = String(id).toLowerCase();
    return this.teams.find((team) => String(team.id).toLowerCase() === key || String(team.teamCode).toLowerCase() === key) || null;
  }

  async create(team) {
    if (mongoIsReady()) {
      const teamCode = team.teamCode || `TEAM-${Date.now()}`;
      const record = await Team.create({ ...team, teamCode });
      return serializeDocument(record);
    }
    const maxId = this.teams.reduce((max, item) => Math.max(max, Number(String(item.teamCode).match(/\d+/)?.[0] || 0)), 0);
    const record = { ...team, teamCode: team.teamCode || `TEAM-${String(maxId + 1).padStart(2, '0')}`, id: team.teamCode || `TEAM-${String(maxId + 1).padStart(2, '0')}` };
    this.teams.push(record);
    return record;
  }

  async update(id, updates) {
    if (mongoIsReady()) {
      const team = await Team.findOne(codeQuery(Team, 'teamCode', id));
      if (!team) return null;
      const fields = { ...updates };
      if (fields.status !== undefined && fields.availability === undefined) fields.availability = fields.status;
      delete fields.status;
      if (fields.currentIncidentId !== undefined) {
        const incidentCode = fields.currentIncidentId ? String(fields.currentIncidentId) : null;
        if (!incidentCode) {
          fields.assignedIncident = null;
          fields.currentIncidentCode = null;
        } else {
          const incident = await Incident.findOne(codeQuery(Incident, 'incidentCode', incidentCode));
          if (!incident) {
            const error = new Error(`Incident with ID '${incidentCode}' not found.`);
            error.statusCode = 404;
            error.errorCode = 'INCIDENT_NOT_FOUND';
            throw error;
          }
          fields.assignedIncident = incident._id;
          fields.currentIncidentCode = incident.incidentCode;
        }
        delete fields.currentIncidentId;
      }
      team.set(fields);
      await team.save();
      return serializeDocument(team);
    }
    const key = String(id).toLowerCase();
    const team = this.teams.find((item) => String(item.id).toLowerCase() === key || String(item.teamCode).toLowerCase() === key);
    if (!team) return null;
    Object.assign(team, updates);
    team.availability = String(team.availability || team.status || 'available').toLowerCase();
    team.status = team.availability;
    return team;
  }

  async delete(id) {
    if (mongoIsReady()) {
      const team = await Team.findOneAndDelete(codeQuery(Team, 'teamCode', id));
      return serializeDocument(team);
    }
    const key = String(id).toLowerCase();
    const team = this.teams.find((item) => String(item.id).toLowerCase() === key || String(item.teamCode).toLowerCase() === key);
    if (!team) return null;
    this.teams = this.teams.filter((item) => item !== team);
    return team;
  }
}

export const teamRepository = new TeamRepository();
export default teamRepository;
