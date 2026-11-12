import { Router } from 'express';
import { register, login, getMe, assignHospitalFacilities } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.patch('/users/:userId/hospitals', protect, authorize('admin'), assignHospitalFacilities);

export default router;
