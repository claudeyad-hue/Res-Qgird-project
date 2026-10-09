import app from './app.js';
import env from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';

let server;

async function startServer() {
  try {
    console.log(`[Res-QGIRD Server] Starting in ${env.NODE_ENV} mode...`);

    // 1. Connect to MongoDB (optional in Phase 1 standalone repository mode)
    try {
      await connectDatabase(env.MONGODB_URI);
    } catch (dbErr) {
      console.warn(`[Res-QGIRD Server] MongoDB not reachable (${dbErr.message}). Operating in in-memory repository mode.`);
    }

    // 2. Start HTTP server
    server = app.listen(env.PORT, () => {
      console.log(`[Res-QGIRD Server] Running on http://localhost:${env.PORT}`);
      console.log(`[Res-QGIRD Server] API Version 1: http://localhost:${env.PORT}/api/v1`);
      console.log(`[Res-QGIRD Server] Health check: http://localhost:${env.PORT}/api/v1/health`);
    });

    // 3. Graceful shutdown listeners
    const handleShutdown = async (signal) => {
      console.log(`\n[Res-QGIRD Server] Received ${signal}. Initiating graceful shutdown...`);
      if (server) {
        server.close(async () => {
          console.log('[Res-QGIRD Server] HTTP server closed.');
          try {
            await disconnectDatabase();
            process.exit(0);
          } catch (dbErr) {
            console.error('[Res-QGIRD Server] Error closing database connection:', dbErr);
            process.exit(1);
          }
        });
      } else {
        process.exit(0);
      }
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
  } catch (err) {
    console.error(`[Res-QGIRD Server] Startup failure: ${err.message}`);
    process.exit(1);
  }
}

// Global unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Res-QGIRD Server] Unhandled Promise Rejection:', reason);
});

// Global uncaught exception handler
process.on('uncaughtException', (err) => {
  console.error('[Res-QGIRD Server] Uncaught Exception:', err);
  process.exit(1);
});

startServer();

export default app;
