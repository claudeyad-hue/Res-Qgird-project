import { Router } from 'express';
import { isDatabaseConnected } from '../config/database.js';
import env from '../config/env.js';

const router = Router();

router.get('/', (req, res) => {
  const dbConnected = isDatabaseConnected();
  const database = dbConnected ? 'connected' : env.isProduction ? 'disconnected' : 'in-memory-demo';
  const ready = !env.isProduction || dbConnected;

  return res.status(ready ? 200 : 503).json({
    success: ready,
    message: ready ? 'API is healthy' : 'API is unavailable because the database is not ready',
    data: {
      server: 'ok',
      readiness: ready ? 'ready' : 'not-ready',
      database,
      storage: dbConnected ? 'mongodb' : env.isProduction ? 'unavailable' : 'in-memory-demo',
      userStore: dbConnected ? 'mongodb' : env.isProduction ? 'unavailable' : 'in-memory-demo',
      notice: 'Operational incidents, teams, resources, and hospitals are held in process memory and reset when the server restarts.',
      operationalArea: 'Ghaziabad, Uttar Pradesh, India',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    },
  });
});

export default router;
