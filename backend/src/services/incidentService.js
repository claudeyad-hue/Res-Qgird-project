// Incident Service
// Implements business logic and boundary validation for incidents using the repository layer.
import incidentRepository from '../repositories/incidentRepository.js';
import { validateCoordinates } from '../utils/geoUtils.js';

class IncidentService {
  async getIncidents(query = {}) {
    return incidentRepository.findAll(query);
  }

  async getIncidentById(id) {
    const incident = await incidentRepository.findById(id);
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
    const location = payload.location || payload.address || 'Ghaziabad, UP';
    const latitude = parseFloat(payload.latitude);
    const longitude = parseFloat(payload.longitude);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      const err = new Error('Valid latitude and longitude coordinates are required.');
      err.statusCode = 400;
      err.errorCode = 'INVALID_COORDINATES';
      throw err;
    }

    const geoValidation = validateCoordinates({ latitude, longitude });
    if (!geoValidation.insideArea) {
      const err = new Error(geoValidation.error || 'Submitted coordinates are outside the operational area (Ghaziabad).');
      err.statusCode = 400;
      err.errorCode = 'OUT_OF_OPERATIONAL_AREA';
      throw err;
    }

    const incidentData = {
      title,
      description,
      type: payload.type || 'Other',
      severity: payload.severity || 'Medium',
      status: payload.status || 'Reported',
      location,
      address: location,
      latitude,
      longitude,
      reportedBy: payload.reportedBy || 'Public / Field Report',
      affectedPeople: parseInt(payload.affectedPeople || payload.affected, 10) || 0,
      priority: payload.priority || (payload.severity === 'Critical' ? 1 : 2),
      team: payload.team || null,
      assignedTeamId: payload.assignedTeamId || null,
    };

    if (payload.id && typeof payload.id === 'string' && payload.id.startsWith('INC-')) {
      incidentData.id = payload.id;
    }

    return incidentRepository.create(incidentData);
  }

  async updateIncident(id, payload) {
    const existing = await this.getIncidentById(id);

    const updateFields = {};
    if (payload.title !== undefined) updateFields.title = payload.title;
    if (payload.description !== undefined) updateFields.description = payload.description;
    if (payload.desc !== undefined && payload.description === undefined) updateFields.description = payload.desc;
    if (payload.type !== undefined) updateFields.type = payload.type;
    if (payload.severity !== undefined) updateFields.severity = payload.severity;
    if (payload.status !== undefined) updateFields.status = payload.status;
    if (payload.location !== undefined) updateFields.location = payload.location;
    if (payload.address !== undefined) updateFields.address = payload.address;
    if (payload.latitude !== undefined) updateFields.latitude = parseFloat(payload.latitude);
    if (payload.longitude !== undefined) updateFields.longitude = parseFloat(payload.longitude);

    if (updateFields.latitude !== undefined || updateFields.longitude !== undefined) {
      const finalLat = updateFields.latitude !== undefined ? updateFields.latitude : existing.latitude;
      const finalLng = updateFields.longitude !== undefined ? updateFields.longitude : existing.longitude;
      const geoCheck = validateCoordinates({ latitude: finalLat, longitude: finalLng });
      if (!geoCheck.insideArea) {
        const err = new Error(geoCheck.error || 'Updated coordinates are outside the operational area (Ghaziabad).');
        err.statusCode = 400;
        err.errorCode = 'OUT_OF_OPERATIONAL_AREA';
        throw err;
      }
    }

    if (payload.reportedBy !== undefined) updateFields.reportedBy = payload.reportedBy;
    if (payload.affectedPeople !== undefined) updateFields.affectedPeople = parseInt(payload.affectedPeople, 10);
    if (payload.team !== undefined) updateFields.team = payload.team;
    if (payload.assignedTeamId !== undefined) updateFields.assignedTeamId = payload.assignedTeamId;

    return incidentRepository.update(id, updateFields);
  }

  async updateIncidentStatus(id, newStatus) {
    if (!newStatus) {
      const err = new Error('Status field is required.');
      err.statusCode = 400;
      err.errorCode = 'MISSING_STATUS';
      throw err;
    }

    return this.updateIncident(id, { status: newStatus });
  }

  async deleteIncident(id) {
    await this.getIncidentById(id); // verify existence
    const deleted = await incidentRepository.delete(id);
    if (!deleted) {
      const err = new Error(`Could not delete incident '${id}'.`);
      err.statusCode = 500;
      throw err;
    }
    return { id, message: `Incident '${id}' deleted successfully.` };
  }
}

export const incidentService = new IncidentService();
export default incidentService;
