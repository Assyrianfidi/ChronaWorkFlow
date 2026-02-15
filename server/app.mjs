/**
 * ChronaWorkFlow - Production-Grade Backend Application
 * Elite-tier SaaS architecture for accounting & financial operations
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import cookieParser from 'cookie-parser';

// Import routes
import authRoutes from './routes/auth.routes.mjs';
import userRoutes from './routes/user.routes.mjs';
import accountingRoutes from './routes/accounting.routes.mjs';
import subscriptionRoutes from './routes/subscription.routes.mjs';
import billingRoutes from './routes/billing.routes.mjs';
import stripeWebhookRoutes from './routes/stripe.webhook.routes.mjs';
import aiRoutes from './routes/ai.routes.mjs';

// Import middleware
import { errorHandler } from './middleware/error.middleware.mjs';
import { authMiddleware } from './middleware/auth.middleware.mjs';
import { requestLogger } from './middleware/logging.middleware.mjs';
import { csrfProtection } from './middleware/csrf.middleware.mjs';
import { metricsHandler } from './utils/metrics.mjs';

// Load environment variables
config();

// Environment configuration
const PORT = parseInt(process.env.PORT || '5000', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';

// Initialize Prisma with error handling
let prisma;
try {
  prisma = new PrismaClient({
    log: NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
  });

  try {
    await prisma.$connect();
    console.log(' Prisma client connected');
  } catch (error) {
    const allowMockMode = process.env.ALLOW_MOCK_MODE === 'true' && NODE_ENV !== 'production';
    if (!allowMockMode) {
      console.error(' Prisma connection failed:', error.message);
      process.exit(1);
    }

    console.warn(' Prisma connection failed, using mock mode:', error.message);
    prisma = null;
  }
} catch (error) {
  const allowMockMode = process.env.ALLOW_MOCK_MODE === 'true' && NODE_ENV !== 'production';
  if (!allowMockMode) {
    console.error(' Prisma client initialization failed:', error.message);
    process.exit(1);
  }

  console.warn(' Prisma client initialization failed, using mock mode:', error.message);
  prisma = null;
}

// Make prisma available globally for routes
global.prisma = prisma;

// Validate required environment variables
if (!process.env.JWT_SECRET) {
  console.error(' JWT_SECRET must be set');
  process.exit(1);
}

// Allowed origins for CORS
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://chronaworkflow.com',
      'https://app.chronaworkflow.com',
    ];

// Create Express app
const app = express();

// Prometheus metrics
app.get('/api/metrics', metricsHandler);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP
  message: {
    success: false,
    error: 'Too Many Requests',
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// CORS configuration
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
}));

// Stripe webhooks must be registered BEFORE JSON parsing middleware
app.use('/api/stripe', stripeWebhookRoutes);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Cookie parsing (needed for httpOnly refresh tokens)
app.use(cookieParser());

// Request logging
app.use(requestLogger);

// Health check with database status
app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  let dbDetails = {};

  if (prisma) {
    try {
      await prisma.$connect();
      dbStatus = 'connected';
      // Get basic database info
      const userCount = await prisma.user.count().catch(() => 0);
      const accountCount = await prisma.account.count().catch(() => 0);
      dbDetails = { userCount, accountCount };
    } catch (error) {
      dbStatus = 'error';
      dbDetails = { error: error.message };
    }
  }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
    version: '1.0.0',
    database: {
      status: dbStatus,
      ...dbDetails,
    },
    services: {
      backend: 'running',
      database: dbStatus === 'connected' ? 'available' : (prisma ? 'unavailable' : 'mock-mode'),
    },
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, csrfProtection, userRoutes);
app.use('/api/accounting', authMiddleware, csrfProtection, accountingRoutes);
app.use('/api/subscriptions', authMiddleware, csrfProtection, subscriptionRoutes);
app.use('/api/billing', authMiddleware, csrfProtection, billingRoutes);
app.use('/api/ai', authMiddleware, csrfProtection, aiRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log(' SIGTERM received, shutting down gracefully');
  if (prisma) {
    await prisma.$disconnect();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log(' SIGINT received, shutting down gracefully');
  if (prisma) {
    await prisma.$disconnect();
  }
  process.exit(0);
});

// Start server
const server = app.listen(PORT, () => {
  console.log(' ChronaWorkFlow Elite SaaS Platform');
  console.log('============================================================');
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`Server: http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
  console.log(`Database: ${prisma ? 'Connected' : 'Mock Mode'}`);
  console.log(`Frontend: http://localhost:5173`);
  console.log('============================================================');
});

export default app;
