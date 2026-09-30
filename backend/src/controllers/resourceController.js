import resourceService from '../services/resourceService.js';
import { successResponse, paginatedResponse } from '../utils/apiResponse.js';

export async function getResources(req, res, next) {
  try {
    const result = await resourceService.getResources(req.query);
    return paginatedResponse(res, {
      statusCode: 200,
      message: 'Resources fetched successfully',
      data: result.data,
      page: result.page,
      limit: result.limit,
      total: result.total,
    });
  } catch (err) {
    next(err);
  }
}

export async function getResourceById(req, res, next) {
  try {
    const resource = await resourceService.getResourceById(req.params.id);
    return successResponse(res, {
      statusCode: 200,
      message: 'Resource fetched successfully',
      data: resource,
    });
  } catch (err) {
    next(err);
  }
}

export async function createResource(req, res, next) {
  try {
    const resource = await resourceService.createResource(req.body);
    return successResponse(res, {
      statusCode: 201,
      message: 'Resource created successfully',
      data: resource,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateResource(req, res, next) {
  try {
    const resource = await resourceService.updateResource(req.params.id, req.body);
    return successResponse(res, {
      statusCode: 200,
      message: 'Resource updated successfully',
      data: resource,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateResourceStatus(req, res, next) {
  try {
    const status = req.body.status;
    const resource = await resourceService.updateResourceStatus(req.params.id, status);
    return successResponse(res, {
      statusCode: 200,
      message: `Resource status updated to '${resource.status}'`,
      data: resource,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteResource(req, res, next) {
  try {
    const result = await resourceService.deleteResource(req.params.id);
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
  getResources,
  getResourceById,
  createResource,
  updateResource,
  updateResourceStatus,
  deleteResource,
};
