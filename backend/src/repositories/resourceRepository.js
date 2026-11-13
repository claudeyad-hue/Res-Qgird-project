// Resource Repository
// In-memory data repository with clean interface compatible with future MongoDB integration.
import { SEED_RESOURCES } from '../data/ghaziabadSeed.js';
import Resource from '../models/Resource.js';
import { codeQuery, matchesText, mongoIsReady, paginate, serializeDocument } from './mongoRepositoryUtils.js';

function toMongoResource(payload = {}, creating = false) {
  const fields = { ...payload };
  if (fields.id !== undefined && fields.resourceCode === undefined) fields.resourceCode = fields.id;
  if (creating && fields.name === undefined) fields.name = fields.type || 'Emergency Resource';
  if (fields.amount !== undefined && fields.availableQuantity === undefined) fields.availableQuantity = fields.amount;
  if (creating) fields.quantity = fields.quantity ?? fields.availableQuantity;
  delete fields.id; delete fields.amount;
  return fields;
}

class ResourceRepository {
  constructor() {
    this.resources = JSON.parse(JSON.stringify(SEED_RESOURCES));
  }

  async findAll(query = {}) {
    const { type, status, search, page = 1, limit = 50 } = query;
    if (mongoIsReady()) {
      const records = (await Resource.find({}).sort({ createdAt: -1 })).map(serializeDocument);
      const filtered = records.filter((resource) =>
        (!type || String(resource.type || '').toLowerCase().includes(String(type).toLowerCase().trim())) &&
        (!status || String(resource.status || '').toLowerCase() === String(status).toLowerCase().trim()) &&
        matchesText(resource, ['id', 'type', 'name', 'location'], search)
      );
      return paginate(filtered, page, limit);
    }
    let results = [...this.resources];

    if (type) {
      const t = type.toLowerCase().trim();
      results = results.filter((r) => String(r.type || '').toLowerCase().includes(t));
    }

    if (status) {
      const s = status.toLowerCase().trim();
      results = results.filter((r) => String(r.status || '').toLowerCase() === s);
    }

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      results = results.filter((r) => {
        const text = `${r.id || ''} ${r.type || ''} ${r.location || ''}`.toLowerCase();
        return text.includes(q);
      });
    }

    const total = results.length;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 50);
    const start = (pageNum - 1) * limitNum;
    const paginated = results.slice(start, start + limitNum);

    return {
      data: paginated,
      total,
      page: pageNum,
      limit: limitNum,
    };
  }

  async findById(id) {
    if (!id) return null;
    if (mongoIsReady()) return serializeDocument(await Resource.findOne(codeQuery(Resource, 'resourceCode', id)));
    const strId = String(id).trim().toLowerCase();
    return this.resources.find((r) => String(r.id).toLowerCase() === strId) || null;
  }

  async create(payload) {
    if (mongoIsReady()) {
      const resourceCode = payload.id || payload.resourceCode || `RES-${Date.now()}`;
      return serializeDocument(await Resource.create(toMongoResource({ ...payload, resourceCode }, true)));
    }
    const maxNum = this.resources.reduce((max, r) => {
      const num = parseInt(String(r.id).replace('RES-', ''), 10);
      return Number.isFinite(num) ? Math.max(max, num) : max;
    }, 10);

    const newRecord = {
      id: payload.id || `RES-0${maxNum + 1}`,
      type: payload.type || 'Emergency Supplies',
      amount: payload.amount === undefined ? 1000 : Number(payload.amount),
      unit: payload.unit || 'units',
      location: payload.location || 'Ghaziabad Logistics Base',
      status: payload.status || 'available',
      latitude: parseFloat(payload.latitude),
      longitude: parseFloat(payload.longitude),
    };

    this.resources.push(newRecord);
    return newRecord;
  }

  async update(id, updates) {
    if (mongoIsReady()) {
      const resource = await Resource.findOne(codeQuery(Resource, 'resourceCode', id));
      if (!resource) return null;
      resource.set(toMongoResource(updates));
      await resource.save();
      return serializeDocument(resource);
    }
    const index = this.resources.findIndex((r) => String(r.id).toLowerCase() === String(id).toLowerCase());
    if (index === -1) return null;

    const existing = this.resources[index];
    const updated = {
      ...existing,
      ...updates,
      id: existing.id,
    };

    this.resources[index] = updated;
    return updated;
  }

  async allocate(id, allocation) {
    if (mongoIsReady()) {
      const filter = { ...codeQuery(Resource, 'resourceCode', id), availableQuantity: { $gte: allocation.amount } };
      const updated = await Resource.findOneAndUpdate(filter, [
        { $set: {
          availableQuantity: { $subtract: ['$availableQuantity', allocation.amount] },
          allocations: { $concatArrays: [{ $ifNull: ['$allocations', []] }, [{ $literal: allocation }]] },
        } },
        { $set: {
          status: { $switch: {
            branches: [
              { case: { $lte: ['$availableQuantity', 0] }, then: 'depleted' },
              { case: { $lt: ['$availableQuantity', { $multiply: ['$quantity', 0.25] }] }, then: 'low' },
            ],
            default: 'available',
          } },
        } },
      ], { new: true });
      if (updated) {
        return serializeDocument(updated);
      }
      const current = await Resource.findOne(codeQuery(Resource, 'resourceCode', id));
      if (!current) return null;
      return { insufficient: true, resource: serializeDocument(current) };
    }
    const index = this.resources.findIndex((resource) => String(resource.id).toLowerCase() === String(id).toLowerCase());
    if (index < 0) return null;
    const current = this.resources[index];
    if (allocation.amount > Number(current.amount)) return { insufficient: true, resource: current };
    const amount = Number(current.amount) - allocation.amount;
    const updated = {
      ...current,
      amount,
      availableQuantity: amount,
      status: amount <= 0 ? 'depleted' : amount < Number(current.quantity ?? current.amount) * 0.25 ? 'low' : 'available',
      allocations: [...(current.allocations || []), { ...allocation, allocatedAt: new Date().toISOString() }],
    };
    this.resources[index] = updated;
    return updated;
  }

  async delete(id) {
    if (mongoIsReady()) return Boolean(await Resource.findOneAndDelete(codeQuery(Resource, 'resourceCode', id)));
    const index = this.resources.findIndex((r) => String(r.id).toLowerCase() === String(id).toLowerCase());
    if (index === -1) return false;
    this.resources.splice(index, 1);
    return true;
  }

  reset() {
    this.resources = JSON.parse(JSON.stringify(SEED_RESOURCES));
  }
}

export const resourceRepository = new ResourceRepository();
export default resourceRepository;
