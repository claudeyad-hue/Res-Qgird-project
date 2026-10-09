// Routing Routes
import { Router } from 'express';
import { routeToIncident, routeToHospital } from '../controllers/routingController.js';

const router = Router();

// POST /api/routes/incident
router.post('/incident', routeToIncident);

// POST /api/routes/hospital
router.post('/hospital', routeToHospital);

export default router;
