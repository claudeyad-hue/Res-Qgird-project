import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import env from './config/env.js';
import notFoundHandler from './middleware/notFoundMiddleware.js';
import errorHandler from './middleware/errorMiddleware.js';

import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import incidentRoutes from './routes/incidentRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import hospitalRoutes from './routes/hospitalRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import routingRoutes from './routes/routingRoutes.js';

const app = express();

// 1. Security Headers via Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// 2. CORS Configuration
const allowedOrigins = env.FRONTEND_URL
  ? env.FRONTEND_URL.split(',').map((url) => url.trim().replace(/\/$/, ''))
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (such as mobile apps, curl, postman, automated testing)
      if (!origin) return callback(null, true);

      // In development, permit localhost ports
      if (!env.isProduction) {
        if (/^http:\/\/localhost(:\d+)?$/.test(origin) || /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) {
          return callback(null, true);
        }
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS error: Origin '${origin}' is not authorized.`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// 3. Rate Limiting for API protection
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
});
app.use('/api', limiter);

// 4. Request Body Parsers
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// 5. Versioned Router (/api/v1)
const v1Router = express.Router();

v1Router.use('/health', healthRoutes);
v1Router.use('/auth', authRoutes);
v1Router.use('/incidents', incidentRoutes);
v1Router.use('/resources', resourceRoutes);
v1Router.use('/hospitals', hospitalRoutes);
v1Router.use('/teams', teamRoutes);
v1Router.use('/dashboard', dashboardRoutes);
v1Router.use('/routes', routingRoutes);

// Mount canonical /api/v1
app.use('/api/v1', v1Router);

// Mount /api alias to maintain 100% backward compatibility with React services calling /api/...
app.use('/api', v1Router);

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Unified Disaster Management Console API is online',
    version: '1.0.0',
    documentation: '/api/v1/health',
  });
});

// 6. 404 Route Handler
app.use(notFoundHandler);

// 7. Centralized Error Handler
app.use(errorHandler);

export default app;
