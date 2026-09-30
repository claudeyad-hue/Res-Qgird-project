import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend directory or fallback to root .env if present
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = parseInt(process.env.PORT, 10) || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/resquard_db';
const JWT_SECRET = process.env.JWT_SECRET || (NODE_ENV === 'production' ? null : 'resquard_development_secret_key_change_me');
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const RATE_LIMIT_WINDOW_MINUTES = parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES, 10) || 15;
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX, 10) || 300;

if (NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET environment variable is required in production mode.');
  process.exit(1);
}

if (NODE_ENV === 'production' && !process.env.MONGODB_URI) {
  console.error('FATAL ERROR: MONGODB_URI environment variable is required in production mode.');
  process.exit(1);
}

export const env = {
  NODE_ENV,
  PORT,
  MONGODB_URI,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  FRONTEND_URL,
  RATE_LIMIT_WINDOW_MINUTES,
  RATE_LIMIT_MAX,
  isProduction: NODE_ENV === 'production',
};

export default env;
