import app from '../src/app.js';
import env from '../src/config/env.js';
import { connectDatabase } from '../src/config/database.js';

let databaseConnection;

export default async function handler(request, response) {
  try {
    if (!databaseConnection) {
      databaseConnection = connectDatabase(env.MONGODB_URI).catch((error) => {
        databaseConnection = null;
        throw error;
      });
    }
    await databaseConnection;
    return app(request, response);
  } catch (error) {
    console.error('[API] Database connection unavailable:', error.message);
    return response.status(503).json({
      success: false,
      message: 'The API is temporarily unavailable because its database could not be reached.',
      error: { code: 'DATABASE_UNAVAILABLE' },
    });
  }
}
