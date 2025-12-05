import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';
import { config } from './config/config.js';
import { authRoutes } from './routes/auth.routes.js';
import invoicingRoutes from './routes/invoicing/index.js';
import billingRoutes from './routes/billing/billing.routes.js';
import documentRoutes from './routes/storage/document.routes.js';
import { StatusCodes } from 'http-status-codes';
import { CacheEngine } from './utils/cacheEngine.js';
import { PerformanceMonitor } from './utils/performanceMonitor.js';
import { RateLimiter } from './utils/rateLimiter.js';
import { errorHandler } from './utils/errorHandler.js';
import { CircuitBreaker } from './utils/circuitBreaker.js';
import { logger } from './utils/logger.js';
import { HealthChecker, MetricsCollector } from './utils/healthChecker.js';

export const prisma = new PrismaClient();

// Create Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.security.cors.origin,
  methods: [...config.security.cors.methods],
  allowedHeaders: [...config.security.cors.allowedHeaders],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Performance monitoring middleware
app.use(PerformanceMonitor.performanceMiddleware());

// Rate limiting middleware
app.use(RateLimiter.perIPAdaptive);

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Enhanced health check endpoint
app.get('/api/health', async (req: Request, res: Response) => {
  await HealthChecker.detailedHealth(req, res);
});

// Readiness probe
app.get('/api/ready', async (req: Request, res: Response) => {
  await HealthChecker.readiness(req, res);
});

// Liveness probe
app.get('/api/live', async (req: Request, res: Response) => {
  await HealthChecker.liveness(req, res);
});

// Performance metrics endpoint
app.get('/api/metrics', async (req: Request, res: Response) => {
  await MetricsCollector.prometheusMetrics(req, res);
});

// API Routes with rate limiting
app.use('/api/auth', RateLimiter.perUserLimit('auth'), authRoutes);
app.use('/api', invoicingRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/documents', documentRoutes);

// 404 handler with logging
app.use((req: Request, res: Response) => {
  logger.info('Request received', {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: 'Resource not found',
    error: {
      code: 'NOT_FOUND',
      path: req.path
    }
  });
});

// Global error handler with enhanced logging
app.use(errorHandler);

// Initialize services before starting server
async function startServer() {
  try {
    // Initialize cache
    await CacheEngine.initialize();
    
    // Log server startup
    logger.info('Server starting up', {
      port: config.port,
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version
    });
    
    // Start server
    const PORT = config.port;
    const server = app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
    
    return server;
  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
}

// Start server
startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', async (err: Error) => {
  console.error('Unhandled Rejection:', err);
  logger.error('Unhandled promise rejection', {
    error: err.message,
    stack: err.stack
  });
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', async (err: Error) => {
  console.error('Uncaught Exception:', err);
  logger.error('Uncaught exception', {
    error: err.message,
    stack: err.stack
  });
  process.exit(1);
});

// Handle SIGTERM
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully');
  logger.info('Server shutting down', {
    signal: 'SIGTERM'
  });
  process.exit(0);
});

export default app;
