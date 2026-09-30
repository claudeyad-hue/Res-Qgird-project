import { Router } from 'express';
import {
  getHospitals,
  getHospitalById,
  createHospital,
  updateHospital,
  updateHospitalStatus,
  deleteHospital,
} from '../controllers/hospitalController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import env from '../config/env.js';

const router = Router();

function requireHospitalAuth(req, res, next) {
  if (process.env.REQUIRE_AUTH_FOR_HOSPITALS === 'true' || env.isProduction) {
    return protect(req, res, () => {
      authorize('admin', 'medical')(req, res, next);
    });
  }

  if (req.headers.authorization) {
    return protect(req, res, () => {
      authorize('admin', 'medical')(req, res, next);
    });
  }

  next();
}

router.get('/', getHospitals);
router.get('/:id', getHospitalById);
router.post('/', requireHospitalAuth, createHospital);
router.put('/:id', requireHospitalAuth, updateHospital);
router.patch('/:id/status', requireHospitalAuth, updateHospitalStatus);
router.patch('/:id', requireHospitalAuth, updateHospital);
router.delete('/:id', protect, authorize('admin'), deleteHospital);

export default router;
