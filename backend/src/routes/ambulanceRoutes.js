import { Router } from 'express';
import { getAmbulances, getNearbyAmbulances, getAmbulance, createAmbulance, updateAmbulance, updateVerification, deleteAmbulance } from '../controllers/ambulanceController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = Router();
router.get('/', getAmbulances);
router.get('/nearby', getNearbyAmbulances);
router.get('/:id', getAmbulance);
router.post('/', protect, authorize('admin'), createAmbulance);
router.put('/:id', protect, authorize('admin'), updateAmbulance);
router.patch('/:id', protect, authorize('admin'), updateAmbulance);
router.patch('/:id/verification', protect, authorize('admin'), updateVerification);
router.delete('/:id', protect, authorize('admin'), deleteAmbulance);
export default router;
