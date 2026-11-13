import ambulanceService from '../services/ambulanceService.js';
import { paginatedResponse, successResponse } from '../utils/apiResponse.js';

export async function getAmbulances(req, res, next) { try { const result = await ambulanceService.getAll(req.query); return paginatedResponse(res, { message: 'Ambulance providers fetched successfully', ...result }); } catch (error) { next(error); } }
export async function getNearbyAmbulances(req, res, next) { try { return successResponse(res, { message: 'Nearby verified provider locations fetched successfully', data: await ambulanceService.nearby(req.query) }); } catch (error) { next(error); } }
export async function getAmbulance(req, res, next) { try { return successResponse(res, { message: 'Ambulance provider fetched successfully', data: await ambulanceService.getById(req.params.id) }); } catch (error) { next(error); } }
export async function createAmbulance(req, res, next) { try { return successResponse(res, { statusCode: 201, message: 'Ambulance provider created successfully', data: await ambulanceService.create(req.body) }); } catch (error) { next(error); } }
export async function updateAmbulance(req, res, next) { try { return successResponse(res, { message: 'Ambulance provider updated successfully', data: await ambulanceService.update(req.params.id, req.body) }); } catch (error) { next(error); } }
export async function updateVerification(req, res, next) { try { return successResponse(res, { message: 'Ambulance provider verification updated successfully', data: await ambulanceService.setVerification(req.params.id, req.body.verificationStatus, req.body.sourceUrl) }); } catch (error) { next(error); } }
export async function deleteAmbulance(req, res, next) { try { return successResponse(res, { message: 'Ambulance provider deleted successfully', data: await ambulanceService.remove(req.params.id) }); } catch (error) { next(error); } }
