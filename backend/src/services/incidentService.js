import mongoose from 'mongoose';
import Incident from '../models/Incident.js';

class IncidentService {
  async getIncidents(query = {}) {
    const {
      status,
      severity,
      type,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const filter = {};

    if (status) {
      const s = status.toLowerCase().trim();
      if (s === 'active' || s === 'in-progress' || s === 'in progress') {
        filter.status = { $in: ['active', 'verified', 'reported'] };
      } else {
        filter.status = s;
      }
    }

    if (severity) {
      filter.severity = severity.toLowerCase().trim();
    }

    if (type) {
      filter.type = new RegExp(`^${type.trim()}$`, 'i');
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { location: searchRegex },
        { incidentCode: searchRegex },
        { type: searchRegex },
      ];
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Sorting whitelist
    const allowedSortFields = ['createdAt', 'updatedAt', 'title', 'severity', 'status', 'affectedPeople', 'priority'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const safeSortOrder = sortOrder === 'asc' || sortOrder === '1' ? 1 : -1;

    const [data, total] = await Promise.all([
      Incident.find(filter)
        .sort({ [safeSortBy]: safeSortOrder })
        .skip(skip)
        .limit(limitNum)
        .populate('assignedTeam', 'name type contact teamCode')
        .lean({ virtuals: true }),
      Incident.countDocuments(filter),
    ]);

    return {
      data,
      total,
      page: pageNum,
      limit: limitNum,
    };
  }

  async getIncidentById(id) {
    let incident = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      incident = await Incident.findById(id).populate('assignedTeam', 'name type contact teamCode');
    }

    if (!incident) {
      incident = await Incident.findOne({ incidentCode: id }).populate('assignedTeam', 'name type contact teamCode');
    }

    if (!incident) {
      const err = new Error(`Incident with ID '${id}' not found.`);
      err.statusCode = 404;
      err.errorCode = 'INCIDENT_NOT_FOUND';
      throw err;
    }

    return incident;
  }

  async createIncident(payload) {
    const title = payload.title || (payload.type ? `${payload.type} Emergency` : 'Emergency Incident');
    const description = payload.description || payload.desc || 'No description provided.';
    const location = payload.location || payload.address || 'Unknown Location';
    const latitude = parseFloat(payload.latitude);
    const longitude = parseFloat(payload.longitude);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      const err = new Error('Valid latitude and longitude coordinates are required.');
      err.statusCode = 400;
      err.errorCode = 'INVALID_COORDINATES';
      throw err;
    }

    const incidentData = {
      title,
      description,
      type: payload.type || 'Other',
      severity: (payload.severity || 'medium').toLowerCase(),
      status: (payload.status || 'reported').toLowerCase(),
      location,
      latitude,
      longitude,
      reportedBy: payload.reportedBy || 'Public / Field Report',
      affectedPeople: parseInt(payload.affectedPeople || payload.affected, 10) || 0,
      priority: payload.priority || (payload.severity === 'critical' ? 1 : payload.severity === 'high' ? 2 : 3),
      assignedTeamName: payload.team || payload.assignedTeamName || null,
    };

    if (payload.assignedTeam && mongoose.Types.ObjectId.isValid(payload.assignedTeam)) {
      incidentData.assignedTeam = payload.assignedTeam;
    }

    if (payload.id && typeof payload.id === 'string' && payload.id.startsWith('INC-')) {
      incidentData.incidentCode = payload.id;
    }

    const incident = await Incident.create(incidentData);
    return incident;
  }

  async updateIncident(id, payload) {
    const incident = await this.getIncidentById(id);

    const updateFields = {};
    if (payload.title !== undefined) updateFields.title = payload.title;
    if (payload.description !== undefined) updateFields.description = payload.description;
    if (payload.desc !== undefined && payload.description === undefined) updateFields.description = payload.desc;
    if (payload.type !== undefined) updateFields.type = payload.type;
    if (payload.severity !== undefined) updateFields.severity = payload.severity.toLowerCase();
    if (payload.status !== undefined) updateFields.status = payload.status.toLowerCase();
    if (payload.location !== undefined) updateFields.location = payload.location;
    if (payload.address !== undefined && payload.location === undefined) updateFields.location = payload.address;
    if (payload.latitude !== undefined) updateFields.latitude = parseFloat(payload.latitude);
    if (payload.longitude !== undefined) updateFields.longitude = parseFloat(payload.longitude);
    if (payload.reportedBy !== undefined) updateFields.reportedBy = payload.reportedBy;
    if (payload.affectedPeople !== undefined) updateFields.affectedPeople = parseInt(payload.affectedPeople, 10);
    if (payload.affected !== undefined && payload.affectedPeople === undefined) updateFields.affectedPeople = parseInt(payload.affected, 10);
    if (payload.team !== undefined) updateFields.assignedTeamName = payload.team;
    if (payload.assignedTeam !== undefined) {
      updateFields.assignedTeam = mongoose.Types.ObjectId.isValid(payload.assignedTeam) ? payload.assignedTeam : null;
    }

    Object.assign(incident, updateFields);
    await incident.save();
    return incident;
  }

  async updateIncidentStatus(id, newStatus) {
    if (!newStatus) {
      const err = new Error('Status field is required.');
      err.statusCode = 400;
      err.errorCode = 'STATUS_REQUIRED';
      throw err;
    }

    const incident = await this.getIncidentById(id);
    const s = newStatus.toLowerCase().trim();
    const validStatuses = ['reported', 'verified', 'active', 'contained', 'resolved'];
    const normalizedStatus = (s === 'in-progress' || s === 'in progress' || s === 'assigned') ? 'active' : s;

    if (!validStatuses.includes(normalizedStatus)) {
      const err = new Error(`Invalid status '${newStatus}'. Allowed: ${validStatuses.join(', ')}`);
      err.statusCode = 400;
      err.errorCode = 'INVALID_STATUS';
      throw err;
    }

    incident.status = normalizedStatus;
    await incident.save();
    return incident;
  }

  async deleteIncident(id) {
    const incident = await this.getIncidentById(id);
    await Incident.findByIdAndDelete(incident._id);
    return { id: incident.id, message: `Incident ${incident.id} deleted successfully.` };
  }
}

export const incidentService = new IncidentService();
export default incidentService;
