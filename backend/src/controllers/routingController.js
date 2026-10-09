// Routing Controller
// Handles POST /api/routes/incident and POST /api/routes/hospital
import routingService from '../services/routingService.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export async function routeToIncident(req, res) {
  try {
    const { origin, destinationId } = req.body;
    const result = await routingService.calculateRouteToIncident({ origin, destinationId });

    return successResponse(res, {
      statusCode: 200,
      message: 'Road route to incident calculated successfully',
      data: result,
    });
  } catch (err) {
    const status = err.statusCode || 500;
    return errorResponse(res, {
      statusCode: status,
      message: err.message || 'Failed to calculate route to incident',
      errorCode: err.errorCode || 'ROUTING_ERROR',
    });
  }
}

export async function routeToHospital(req, res) {
  try {
    const { origin, incidentId, destinationId } = req.body;
    const result = await routingService.calculateRouteToHospital({ origin, incidentId, destinationId });

    return successResponse(res, {
      statusCode: 200,
      message: 'Road route to hospital calculated successfully',
      data: result,
    });
  } catch (err) {
    const status = err.statusCode || 500;
    return errorResponse(res, {
      statusCode: status,
      message: err.message || 'Failed to calculate route to hospital',
      errorCode: err.errorCode || 'ROUTING_ERROR',
    });
  }
}

export default {
  routeToIncident,
  routeToHospital,
};
