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

    return resourceRepository.create(payload);
  }

  async updateResource(id, payload) {
    await this.getResourceById(id);

    if (payload.latitude !== undefined || payload.longitude !== undefined) {
      const lat = parseFloat(payload.latitude);
      const lng = parseFloat(payload.longitude);
      const geoCheck = validateCoordinates({ latitude: lat, longitude: lng });
      if (!geoCheck.insideArea) {
        const err = new Error(geoCheck.error || 'Updated coordinates are outside the operational area (Ghaziabad).');
        err.statusCode = 400;
        err.errorCode = 'OUT_OF_OPERATIONAL_AREA';
        throw err;
      }
    }

    return resourceRepository.update(id, payload);
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
