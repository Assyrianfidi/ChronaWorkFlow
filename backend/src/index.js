// Load environment variables and config first
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

// Set Prisma to use WASM engine
process.env.PRISMA_QUERY_ENGINE_TYPE = 'wasm';

// Import config after .env is loaded
const config = require('./config');
const { NODE_ENV, PORT, CORS_ORIGIN } = config;
const { validateEnv } = require('./envValidator');

// Validate environment early
try {
  validateEnv();
} catch (err) {
  // If validation fails we abort startup by throwing — let the process crash
  // eslint-disable-next-line no-console
  console.error('Environment validation failed - aborting startup.');
  console.error(err);
  process.exit(1);
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const {
  globalErrorHandler,
  notFoundHandler,
  SystemPanicMonitor,
  asyncHandler
} = require('./utils/errorHandler');
const { sendSuccess } = require('./utils/responseEnvelope');
const { logger, stream } = require('./utils/logger');

// Initialize Prisma Client
const prisma = new PrismaClient();

// Create Express app
const app = express();

// Request timing middleware
app.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

// Test route
app.get('/', (req, res) => {
  res.send('AccuBooks Backend Server is running!');
});

// Test route for Jest tests
if (process.env.NODE_ENV === 'test') {
  app.get('/test', (req, res) => {
    res.json({ success: true, message: 'Test endpoint working' });
  });
}

// Health check endpoint with system metrics
app.get('/api/health', asyncHandler(async (req, res) => {
  const systemHealth = SystemPanicMonitor.checkSystemHealth();

  // Test database connection
  let dbStatus = 'healthy';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    dbStatus = 'unhealthy';
    systemHealth.issues.push('Database connection failed');
  }

  const healthData = {
    status: systemHealth.isHealthy && dbStatus === 'healthy' ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    services: {
      database: dbStatus,
      system: systemHealth.isHealthy ? 'healthy' : 'unhealthy',
    },
    metrics: {
      ...systemHealth.metrics,
      memory: process.memoryUsage(),
    },
    issues: systemHealth.issues,
  };

  if (systemHealth.isHealthy && dbStatus === 'healthy') {
    return sendSuccess(res, healthData);
  } else {
    return res.status(503).json({
      success: false,
      ...healthData,
    });
  }
}));

// Test database connection route
app.get('/test-db', asyncHandler(async (req, res) => {
  // Test connection by querying the database
  const users = await prisma.user.findMany({ take: 1 });
  return sendSuccess(res, {
    message: 'Database connection successful',
    data: users
  });
}));

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AccuBooks API',
      version: '1.0.0',
      description: 'Enterprise Accounting Platform API Documentation',
    },
    servers: [
      {
        url: `http://localhost:${PORT}/api/v1`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Middleware - Apply security middleware first
const applySecurityMiddlewares = require('./middleware/security');
const { authRateLimiter, sensitiveRouteLimiter } = require('./middleware/security');
const { logAllRequests, logErrors, logPerformance } = require('./middleware/security/auditLogger.middleware');

applySecurityMiddlewares(app);

// Apply audit logging middleware
app.use(logPerformance);
app.use(logAllRequests);

// Apply specific rate limiters to sensitive routes
app.use('/api/v1/auth/login', authRateLimiter);
app.use('/api/v1/auth/register', authRateLimiter);
app.use('/api/v1/accounts', sensitiveRouteLimiter);
app.use('/api/v1/transactions', sensitiveRouteLimiter);

// Morgan logging after security middleware
app.use(morgan('combined', { stream }));

// API Routes
// Mount auth (exists)
app.use('/api/v1', require('./routes/auth'));

// Mount monitoring routes
app.use('/api/v1/monitoring', require('./routes/monitoring.routes'));

// Mount accounts and transactions routes
route('/api/v1/accounts', './routes/accounts.routes');
route('/api/v1/transactions', './routes/transactions.routes');

// Mount business logic routes
route('/api/v1/business', './routes/business-logic.routes');

// Conditionally mount optional route modules if present. This avoids startup
// failures and ESLint 'node/no-missing-require' errors when routes are not
// present in every environment (e.g., trimmed builds or partial deployments).
const fs = require('fs');
const route = (mountPath, relPath) => {
  const fullPath = require('path').join(__dirname, relPath + '.js');
  if (fs.existsSync(fullPath)) {
    try {
      // require the route and mount it
      const r = require(relPath);
      app.use(mountPath, r);
    } catch (e) {
      logger.warn(`Route ${relPath} found but failed to load: ${e.message}`);
    }
  } else {
    logger.info(`Optional route not found: ${relPath}`);
  }
};

route('/api/v1/users', './routes/users');
route('/api/v1/businesses', './routes/businesses');
route('/api/v1/clients', './routes/clients');
route('/api/v1/invoices', './routes/invoices');
route('/api/v1/payments', './routes/payments');

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test email route (development only)
if (NODE_ENV === 'development') {
  try {
    const { sendEmail } = require('./utils/emailService');
    app.get('/test-email', async (req, res) => {
      try {
        const to = req.query.to || process.env.DEV_TEST_EMAIL || 'test@example.com';
        await sendEmail('welcome', to, 'Welcome to AccuBooks (test)', { name: 'Test User', link: process.env.FRONTEND_URL || 'http://localhost:3000' });
        res.send('Test email sent (development only)');
      } catch (err) {
        // return exact error for debugging in dev
        res.status(500).send(`Email send failed: ${err.message}`);
      }
    });
  } catch (e) {
    // If email service cannot be loaded, log and continue
    // eslint-disable-next-line no-console
    console.warn('Test email route not available:', e.message);
  }
}

// 404 handler - use new standardized handler
app.use(notFoundHandler);

// Global error handler - use new standardized handler
app.use(globalErrorHandler);

// Request metrics collection middleware (at the end)
app.use((req, res, next) => {
  const responseTime = Date.now() - (req.startTime || Date.now());
  const isError = res.statusCode >= 400;

  // Record metrics for system monitoring
  SystemPanicMonitor.recordRequest(responseTime, isError);

  // Log performance for audit trail
  if (req.logPerformance) {
    req.logPerformance('request_completed', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
  }

  next();
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Server running in ${NODE_ENV} mode on port ${PORT}`);
  logger.info(`API Documentation available at http://localhost:${PORT}/api-docs`);

  // Initialize monitoring service
  const MonitoringService = require('./services/monitoring.service');
  MonitoringService.initializeMetrics();

  // Log system startup
  logger.info('Monitoring service initialized');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  logger.error(err.stack);

  // Record error in panic monitor
  SystemPanicMonitor.recordRequest(0, true);

  // Close server and rethrow the error so the process terminates and
  // upstream supervisors can restart it.
  server.close(() => {
    throw err;
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  logger.error(err.stack);

  // Record error in panic monitor
  SystemPanicMonitor.recordRequest(0, true);

  // Close server and exit
  server.close(() => {
    process.exit(1);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully');

  // Cleanup monitoring service
  const MonitoringService = require('./services/monitoring.service');
  MonitoringService.cleanup();

  server.close(() => {
    logger.info('Process terminated');
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully');

  // Cleanup monitoring service
  const MonitoringService = require('./services/monitoring.service');
  MonitoringService.cleanup();

  server.close(() => {
    logger.info('Process terminated');
  });
});

module.exports = { app, prisma };
