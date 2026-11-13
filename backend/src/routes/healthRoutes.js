import { Router } from 'express';
import { isDatabaseConnected } from '../config/database.js';
import env from '../config/env.js';

const router = Router();

router.get('/', (req, res) => {
  const dbConnected = isDatabaseConnected();
  const database = dbConnected ? 'connected' : env.isProduction ? 'disconnected' : 'in-memory';
  const ready = !env.isProduction || dbConnected;

  return res.status(ready ? 200 : 503).json({
    success: ready,
    message: ready ? 'API is healthy' : 'API is unavailable because the database is not ready',
    data: {
      server: 'ok',
      readiness: ready ? 'ready' : 'not-ready',
      database,
      storage: dbConnected ? 'mongodb' : env.isProduction ? 'unavailable' : 'in-memory',
      userStore: dbConnected ? 'mongodb' : env.isProduction ? 'unavailable' : 'in-memory',
      notice: dbConnected
        ? 'Operational records are persisted in MongoDB.'
        : 'MongoDB is disconnected. Process-memory collections are temporary and start empty, except for the sourced hospital directory.',
      operationalArea: 'Ghaziabad, Uttar Pradesh, India',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    },
  });
});

export default router;
