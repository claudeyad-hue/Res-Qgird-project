import teamService from '../services/teamService.js';
import { successResponse, paginatedResponse } from '../utils/apiResponse.js';

export async function getTeams(req, res, next) {
  try {
    const result = await teamService.getTeams(req.query);
    return paginatedResponse(res, {
      statusCode: 200,
      message: 'Teams fetched successfully',
      data: result.data,
      page: result.page,
      limit: result.limit,
      total: result.total,
    });
  } catch (err) {
    next(err);
  }
}

export async function getTeamById(req, res, next) {
  try {
    const team = await teamService.getTeamById(req.params.id);
    return successResponse(res, {
      statusCode: 200,
      message: 'Team fetched successfully',
      data: team,
    });
  } catch (err) {
    next(err);
  }
}

export async function createTeam(req, res, next) {
  try {
    const team = await teamService.createTeam(req.body);
    return successResponse(res, {
      statusCode: 201,
      message: 'Team registered successfully',
      data: team,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateTeam(req, res, next) {
  try {
    const team = await teamService.updateTeam(req.params.id, req.body);
    return successResponse(res, {
      statusCode: 200,
      message: 'Team updated successfully',
      data: team,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateTeamStatus(req, res, next) {
  try {
    const status = req.body.status || req.body.availability;
    const currentIncidentId = req.body.currentIncidentId;
    const team = await teamService.updateTeamStatus(req.params.id, status, currentIncidentId);
    return successResponse(res, {
      statusCode: 200,
      message: `Team status updated to '${team.availability}'`,
      data: team,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteTeam(req, res, next) {
  try {
    const result = await teamService.deleteTeam(req.params.id);
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
  getTeams,
  getTeamById,
  createTeam,
  updateTeam,
  updateTeamStatus,
  deleteTeam,
};
