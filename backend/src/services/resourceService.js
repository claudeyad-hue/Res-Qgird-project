// Resource Service
// Implements business logic and boundary validation for resources.
import resourceRepository from '../repositories/resourceRepository.js';
import { validateCoordinates } from '../utils/geoUtils.js';

class ResourceService {
  async getResources(query = {}) {
    return resourceRepository.findAll(query);
  }

  async getResourceById(id) {
    const resource = await resourceRepository.findById(id);
    if (!resource) {
      const err = new Error(`Resource with ID '${id}' not found.`);
      err.statusCode = 404;
      err.errorCode = 'RESOURCE_NOT_FOUND';
      throw err;
    }
    return resource;
  }

  async createResource(payload) {
    const quantity = Number(payload.amount ?? payload.availableQuantity ?? payload.quantity);
    if (!Number.isFinite(quantity) || quantity < 0) {
      const err = new Error('A valid non-negative resource amount is required.');
      err.statusCode = 400;
      err.errorCode = 'INVALID_QUANTITY';
      throw err;
    }
    const totalQuantity = Number(payload.quantity ?? quantity);
    if (!Number.isFinite(totalQuantity) || totalQuantity < quantity) {
      const err = new Error('Available resource amount cannot exceed total quantity.');
      err.statusCode = 400;
      err.errorCode = 'INVALID_QUANTITY_RANGE';
      throw err;
    }
    if (payload.latitude !== undefined && payload.longitude !== undefined) {
      const lat = parseFloat(payload.latitude);
      const lng = parseFloat(payload.longitude);
      const geoCheck = validateCoordinates({ latitude: lat, longitude: lng });
      if (!geoCheck.insideArea) {
        const err = new Error(geoCheck.error || 'Resource coordinates are outside the operational area (Ghaziabad).');
        err.statusCode = 400;
        err.errorCode = 'OUT_OF_OPERATIONAL_AREA';
        throw err;
      }
    }

    return resourceRepository.create({ ...payload, amount: quantity });
  }

  async updateResource(id, payload) {
    await this.getResourceById(id);

    const amount = payload.amount ?? payload.availableQuantity;
    if (amount !== undefined && (!Number.isFinite(Number(amount)) || Number(amount) < 0)) {
      const err = new Error('Resource amount must be a valid non-negative number.');
      err.statusCode = 400;
      err.errorCode = 'INVALID_QUANTITY';
      throw err;
    }

    // Legacy console clients call the available quantity `amount`.
    const updates = { ...payload };
    if (updates.amount !== undefined && updates.availableQuantity === undefined) {
      updates.availableQuantity = Number(updates.amount);
    }

    if (updates.latitude !== undefined || updates.longitude !== undefined) {
      const lat = parseFloat(updates.latitude);
      const lng = parseFloat(updates.longitude);
      const geoCheck = validateCoordinates({ latitude: lat, longitude: lng });
      if (!geoCheck.insideArea) {
        const err = new Error(geoCheck.error || 'Updated coordinates are outside the operational area (Ghaziabad).');
        err.statusCode = 400;
        err.errorCode = 'OUT_OF_OPERATIONAL_AREA';
        throw err;
      }
    }

    if (amount !== undefined) updates.amount = Number(amount);
    return resourceRepository.update(id, updates);
  }

  async updateResourceStatus(id, status) {
    if (!status) {
      const err = new Error('Status field is required.');
      err.statusCode = 400;
      err.errorCode = 'MISSING_STATUS';
      throw err;
    }
    return this.updateResource(id, { status });
  }

  async deleteResource(id) {
    await this.getResourceById(id);
    const deleted = await resourceRepository.delete(id);
    if (!deleted) {
      const err = new Error(`Could not delete resource '${id}'.`);
      err.statusCode = 500;
      throw err;
    }
    return { id, message: `Resource '${id}' deleted successfully.` };
  }
}

export const resourceService = new ResourceService();
export default resourceService;
