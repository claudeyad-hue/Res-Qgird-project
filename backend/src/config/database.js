import mongoose from 'mongoose';
import env from './env.js';

let isConnected = false;

// Helper to mask credentials in connection URI for safe logging
function maskMongoUri(uri) {
  if (!uri) return 'undefined';
  return uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
}

export async function connectDatabase(uri = env.MONGODB_URI) {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const safeUri = maskMongoUri(uri);

  mongoose.connection.on('connected', () => {
    isConnected = true;
    console.log(`[Database] MongoDB successfully connected to ${safeUri}`);
  });

  mongoose.connection.on('error', (err) => {
    isConnected = false;
    console.error(`[Database] MongoDB connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    console.warn('[Database] MongoDB connection lost/disconnected');
  });

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    return conn;
  } catch (err) {
    isConnected = false;
    console.error(`[Database] Failed to connect to MongoDB (${safeUri}): ${err.message}`);
    throw err;
  }
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('[Database] MongoDB disconnected cleanly');
  }
}

export function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}

export default {
  connectDatabase,
  disconnectDatabase,
  isDatabaseConnected,
};
