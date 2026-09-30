import mongoose from 'mongoose';
import Resource from '../models/Resource.js';

class ResourceService {
  async getResources(query = {}) {
    const {
      status,
      type,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const filter = {};

    if (status) {
      filter.status = status.toLowerCase().trim();
    }

    if (type) {
      filter.type = new RegExp(`^${type.trim()}$`, 'i');
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { type: searchRegex },
        { location: searchRegex },
        { resourceCode: searchRegex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const allowedSortFields = ['createdAt', 'updatedAt', 'name', 'type', 'quantity', 'availableQuantity', 'status'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const safeSortOrder = sortOrder === 'asc' || sortOrder === '1' ? 1 : -1;

    const [data, total] = await Promise.all([
      Resource.find(filter)
        .sort({ [safeSortBy]: safeSortOrder })
        .skip(skip)
        .limit(limitNum)
        .populate('assignedIncident', 'title incidentCode location')
        .lean({ virtuals: true }),
      Resource.countDocuments(filter),
    ]);

    return {
      data,
      total,
      page: pageNum,
      limit: limitNum,
    };
  }

  async getResourceById(id) {
    let resource = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      resource = await Resource.findById(id).populate('assignedIncident', 'title incidentCode location');
    }

    if (!resource) {
      resource = await Resource.findOne({ resourceCode: id }).populate('assignedIncident', 'title incidentCode location');
    }

    if (!resource) {
      const err = new Error(`Resource with ID '${id}' not found.`);
      err.statusCode = 404;
      err.errorCode = 'RESOURCE_NOT_FOUND';
      throw err;
    }

    return resource;
  }

  async createResource(payload) {
    const quantity = payload.quantity !== undefined ? Number(payload.quantity) : (payload.amount !== undefined ? Number(payload.amount) : null);
    const availableQuantity = payload.availableQuantity !== undefined ? Number(payload.availableQuantity) : quantity;

    if (quantity === null || Number.isNaN(quantity) || quantity < 0) {
      const err = new Error('Quantity must be a valid non-negative number.');
      err.statusCode = 400;
      err.errorCode = 'INVALID_QUANTITY';
      throw err;
    }

    if (availableQuantity === null || Number.isNaN(availableQuantity) || availableQuantity < 0) {
      const err = new Error('Available quantity must be a valid non-negative number.');
      err.statusCode = 400;
      err.errorCode = 'INVALID_AVAILABLE_QUANTITY';
      throw err;
    }

    if (availableQuantity > quantity) {
      const err = new Error('Available quantity cannot exceed total quantity.');
      err.statusCode = 400;
      err.errorCode = 'INVALID_QUANTITY_RANGE';
      throw err;
    }

    const resourceData = {
      name: payload.name,
      type: payload.type,
      quantity,
      availableQuantity,
      unit: payload.unit || 'units',
      location: payload.location,
      status: (payload.status || 'available').toLowerCase(),
    };

    if (payload.assignedIncident && mongoose.Types.ObjectId.isValid(payload.assignedIncident)) {
      resourceData.assignedIncident = payload.assignedIncident;
    }

    if (payload.id && typeof payload.id === 'string' && payload.id.startsWith('RES-')) {
      resourceData.resourceCode = payload.id;
    }

    const resource = await Resource.create(resourceData);
    return resource;
  }

  async updateResource(id, payload) {
    const resource = await this.getResourceById(id);

    const newQuantity = payload.quantity !== undefined ? Number(payload.quantity) : resource.quantity;
    const newAvailable = payload.availableQuantity !== undefined ? Number(payload.availableQuantity) : resource.availableQuantity;

    if (newQuantity < 0 || Number.isNaN(newQuantity)) {
      const err = new Error('Quantity cannot be negative.');
      err.statusCode = 400;
      err.errorCode = 'INVALID_QUANTITY';
      throw err;
    }

    if (newAvailable < 0 || Number.isNaN(newAvailable)) {
      const err = new Error('Available quantity cannot be negative.');
      err.statusCode = 400;
      err.errorCode = 'INVALID_AVAILABLE_QUANTITY';
      throw err;
    }

    if (newAvailable > newQuantity) {
      const err = new Error('Available quantity cannot exceed total quantity.');
      err.statusCode = 400;
      err.errorCode = 'INVALID_QUANTITY_RANGE';
      throw err;
    }

    if (payload.name) resource.name = payload.name;
    if (payload.type) resource.type = payload.type;
    resource.quantity = newQuantity;
    resource.availableQuantity = newAvailable;
    if (payload.unit) resource.unit = payload.unit;
    if (payload.location) resource.location = payload.location;
    if (payload.status) resource.status = payload.status.toLowerCase();
    if (payload.assignedIncident !== undefined) {
      resource.assignedIncident = mongoose.Types.ObjectId.isValid(payload.assignedIncident) ? payload.assignedIncident : null;
    }

    await resource.save();
    return resource;
  }

  async updateResourceStatus(id, newStatus) {
    if (!newStatus) {
      const err = new Error('Status field is required.');
      err.statusCode = 400;
      err.errorCode = 'STATUS_REQUIRED';
      throw err;
    }

    const resource = await this.getResourceById(id);
    const validStatuses = ['available', 'low', 'depleted', 'in-transit', 'allocated'];
    const s = newStatus.toLowerCase().trim();

    if (!validStatuses.includes(s)) {
      const err = new Error(`Invalid status '${newStatus}'. Allowed: ${validStatuses.join(', ')}`);
      err.statusCode = 400;
      err.errorCode = 'INVALID_STATUS';
      throw err;
    }

    resource.status = s;
    await resource.save();
    return resource;
  }

  async deleteResource(id) {
    const resource = await this.getResourceById(id);
    await Resource.findByIdAndDelete(resource._id);
    return { id: resource.id, message: `Resource ${resource.id} deleted successfully.` };
  }
}

export const resourceService = new ResourceService();
export default resourceService;
