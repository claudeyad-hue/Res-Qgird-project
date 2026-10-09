import { Router } from 'express';
import { isDatabaseConnected } from '../config/database.js';
import env from '../config/env.js';
import { successResponse } from '../utils/apiResponse.js';

const router = Router();

router.get('/', (req, res) => {
  const dbConnected = isDatabaseConnected();

  return successResponse(res, {
    statusCode: 200,
    message: 'API is healthy',
    data: {
      server: 'ok',
      database: dbConnected ? 'connected' : 'in-memory-repository',
      storage: dbConnected ? 'mongodb' : 'in-memory',
      operationalArea: 'Ghaziabad, Uttar Pradesh, India',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    },
  });
});

export default router;
