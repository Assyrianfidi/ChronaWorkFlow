const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { PrismaClient } = require('@prisma/client');
const { errorHandler } = require('./middleware/error.middleware');
const { notFoundHandler } = require('./middleware/not-found.middleware');
const authRouter = require('./routes/auth.routes');
const userRouter = require('./routes/user.routes');
const reportRouter = require('./routes/report.routes');

// Initialize Prisma Client
const prisma = new PrismaClient();

// Create Express application
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Logging middleware (only in development)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/reports', reportRouter);

// 404 Handler
app.use(notFoundHandler);

// Error Handler (must be the last middleware)
app.use(errorHandler);

// Graceful shutdown
const server = {
  start: async (port = process.env.PORT || 3000) => {
    try {
      // Test database connection
      await prisma.$connect();
      console.log('Database connection established successfully');
      
      const server = app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      });

      // Handle shutdown
      const shutdown = async () => {
        console.log('Shutting down server...');
        await prisma.$disconnect();
        server.close(() => {
          console.log('Server has been shut down');
          process.exit(0);
        });
      };

      process.on('SIGTERM', shutdown);
      process.on('SIGINT', shutdown);

      return server;
    } catch (error) {
      console.error('Failed to start server:', error);
      await prisma.$disconnect();
      process.exit(1);
    }
  },
};

// For development with `node src/server.js`
if (require.main === module) {
  const port = process.env.PORT || 3000;
  server.start(port).catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

module.exports = { app, server };
