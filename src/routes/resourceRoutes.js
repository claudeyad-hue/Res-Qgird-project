import { Router } from 'express';
import {
  getResources,
  getResourceById,
  createResource,
  updateResource,
  updateResourceStatus,
  deleteResource,
} from '../controllers/resourceController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import env from '../config/env.js';

const router = Router();

function requireResourceAuth(req, res, next) {
  if (process.env.REQUIRE_AUTH_FOR_RESOURCES === 'true' || env.isProduction) {
    return protect(req, res, () => {
      authorize('admin', 'operator', 'medical')(req, res, next);
    });
  }

  if (req.headers.authorization) {
    return protect(req, res, () => {
      authorize('admin', 'operator', 'medical')(req, res, next);
    });
  }

  next();
}

router.get('/', getResources);
router.get('/:id', getResourceById);
router.post('/', requireResourceAuth, createResource);
router.put('/:id', requireResourceAuth, updateResource);
router.patch('/:id/status', requireResourceAuth, updateResourceStatus);
router.patch('/:id', requireResourceAuth, updateResource);
router.delete('/:id', protect, authorize('admin', 'operator'), deleteResource);

export default router;
