import dashboardService from '../services/dashboardService.js';
import { successResponse } from '../utils/apiResponse.js';

export async function getSummary(req, res, next) {
  try {
    const summary = await dashboardService.getDashboardSummary();
    return successResponse(res, {
      statusCode: 200,
      message: 'Dashboard summary fetched successfully',
      data: summary,
    });
  } catch (err) {
    next(err);
  }
}

export default {
  getSummary,
};
