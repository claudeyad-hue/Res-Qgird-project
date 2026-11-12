import mongoose from 'mongoose';
import { isDatabaseConnected } from '../config/database.js';
import env from '../config/env.js';

export function mongoIsReady() {
  const connected = isDatabaseConnected();
  if (env.isProduction && !connected) {
    const error = new Error('Database is unavailable. Operational data cannot be served until MongoDB reconnects.');
    error.statusCode = 503;
    error.errorCode = 'DATABASE_UNAVAILABLE';
    throw error;
  }
  return connected;
}

export function codeQuery(Model, codeField, id) {
  const escaped = String(id).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const clauses = [{ [codeField]: new RegExp(`^${escaped}$`, 'i') }];
  if (mongoose.isValidObjectId(id)) clauses.push({ _id: id });
  return { $or: clauses };
}

export function serializeDocument(document) {
  return document ? document.toJSON({ virtuals: true }) : null;
}

export function matchesText(record, fields, query) {
  const term = String(query || '').trim().toLowerCase();
  return !term || fields.some((field) => String(record[field] || '').toLowerCase().includes(term));
}

export function paginate(records, page = 1, limit = 50) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 50);
  const start = (pageNum - 1) * limitNum;
  return { data: records.slice(start, start + limitNum), total: records.length, page: pageNum, limit: limitNum };
}
