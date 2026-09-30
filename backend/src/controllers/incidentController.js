import incidentService from '../services/incidentService.js';
import { successResponse, paginatedResponse } from '../utils/apiResponse.js';

export async function getIncidents(req, res, next) {
  try {
    const result = await incidentService.getIncidents(req.query);
    return paginatedResponse(res, {
      statusCode: 200,
      message: 'Incidents fetched successfully',
      data: result.data,
      page: result.page,
      limit: result.limit,
      total: result.total,
    });
  } catch (err) {
    next(err);
  }
}

export async function getIncidentById(req, res, next) {
  try {
    const incident = await incidentService.getIncidentById(req.params.id);
    return successResponse(res, {
      statusCode: 200,
      message: 'Incident fetched successfully',
      data: incident,
    });
  } catch (err) {
    next(err);
  }
}

export async function createIncident(req, res, next) {
  try {
    const incident = await incidentService.createIncident(req.body);
    return successResponse(res, {
      statusCode: 201,
      message: 'Incident reported successfully',
      data: incident,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateIncident(req, res, next) {
  try {
    const incident = await incidentService.updateIncident(req.params.id, req.body);
    return successResponse(res, {
      statusCode: 200,
      message: 'Incident updated successfully',
      data: incident,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateIncidentStatus(req, res, next) {
  try {
    const status = req.body.status;
    const incident = await incidentService.updateIncidentStatus(req.params.id, status);
    return successResponse(res, {
      statusCode: 200,
      message: `Incident status updated to '${incident.status}'`,
      data: incident,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteIncident(req, res, next) {
  try {
    const result = await incidentService.deleteIncident(req.params.id);
    return successResponse(res, {
      statusCode: 200,
      message: result.message,
      data: { id: result.id },
    });
  } catch (err) {
    next(err);
  }
}

export default {
  getIncidents,
  getIncidentById,
  createIncident,
  updateIncident,
  updateIncidentStatus,
  deleteIncident,
};
