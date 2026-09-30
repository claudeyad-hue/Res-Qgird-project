import { Router } from 'express';
import {
  getIncidents,
  getIncidentById,
  createIncident,
  updateIncident,
  updateIncidentStatus,
  deleteIncident,
} from '../controllers/incidentController.js';
import { protect, optionalProtect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import env from '../config/env.js';

const router = Router();

// Conditional middleware for incident creation/updates to support both React frontend demo and strict production auth
function requireIncidentAuth(req, res, next) {
  if (process.env.REQUIRE_AUTH_FOR_INCIDENTS === 'true' || env.isProduction) {
    return protect(req, res, () => {
      authorize('admin', 'operator', 'responder')(req, res, next);
    });
  }

  // If token is provided, still validate role
  if (req.headers.authorization) {
    return protect(req, res, () => {
      authorize('admin', 'operator', 'responder')(req, res, next);
    });
  }

  next();
}

router.get('/', getIncidents);
router.get('/:id', getIncidentById);
router.post('/', requireIncidentAuth, createIncident);
router.put('/:id', requireIncidentAuth, updateIncident);
router.patch('/:id/status', requireIncidentAuth, updateIncidentStatus);
// Frontend compatibility: PATCH /:id updates incident details
router.patch('/:id', requireIncidentAuth, updateIncident);
router.delete('/:id', protect, authorize('admin', 'operator'), deleteIncident);

export default router;
