require('dotenv').config();
// Validate environment early
try {
  const { validateEnv } = require('./envValidator');
  validateEnv();
} catch (err) {
  // If validation fails we abort startup by throwing — let the process crash
  // eslint-disable-next-line no-console
  console.error('Environment validation failed - aborting startup.');
  throw err;
}
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { PrismaClient } = require('@prisma/client');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const { errorHandler } = require('./middleware/errorHandler');
const { rateLimiter } = require('./middleware/rateLimiter');
const { logger, stream } = require('./utils/logger');
const { NODE_ENV, PORT, CORS_ORIGIN } = require('./config');

// Initialize Prisma Client
const prisma = new PrismaClient();

// Create Express app
const app = express();

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

// Middleware
app.use(helmet());
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream }));

// Rate limiting
app.use(rateLimiter);

// API Routes
// Mount auth (exists)
app.use('/api/v1', require('./routes/auth'));

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

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Not Found',
  });
});

// Error handler
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Server running in ${NODE_ENV} mode on port ${PORT}`);
  logger.info(`API Documentation available at http://localhost:${PORT}/api-docs`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Error: ${err.message}`);
  // Close server and rethrow the error so the process terminates and
  // upstream supervisors can restart it.
  server.close(() => {
    throw err;
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
});

module.exports = { app, prisma };
