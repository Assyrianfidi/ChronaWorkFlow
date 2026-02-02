import { validateEnvironmentVariables, getServerConfig } from "./config/env-validation.js";
import { logger } from "./utils/structured-logger.js";
import { metrics } from "./utils/metrics.js";
import { shutdownManager, dbManager, connectionTrackingMiddleware, observabilityMiddleware } from "./utils/graceful-shutdown.js";
import { createApp } from "./app.js";
import { registerAllRoutes } from "./routes/index.js";
import { initializeDatabase, isDatabaseAvailable, getDatabaseStatus } from "./db.js";

// Record startup time
const appStartTime = Date.now();

// Validate environment variables before starting server
validateEnvironmentVariables();

// Log application startup
logger.logStartup();

const { port: PORT, hostname: HOST } = getServerConfig();

const app = createApp();

// Register monitoring routes BEFORE any middleware that requires authentication
// These endpoints must be publicly accessible for health checks and metrics scraping
import monitoringRoutes from "./api/monitoring.routes.js";
app.use("/api/monitoring", monitoringRoutes);

// Canonical observability/connection tracking in the actual runtime server
app.use(observabilityMiddleware());
app.use(connectionTrackingMiddleware());

// Initialize database connection (non-blocking)
const dbResult = await initializeDatabase();
if (!dbResult.success) {
  console.warn('⚠️  Starting server without database connection');
  console.warn('⚠️  Database error:', dbResult.error);
}

// Register all API routes (legacy + workflow routes) on the canonical app
// Wrap in try-catch to prevent route registration failures from crashing startup
try {
  await registerAllRoutes(app);
  console.log('✅ API routes registered successfully');
} catch (error) {
  console.error('❌ Failed to register some routes:', error instanceof Error ? error.message : error);
  console.warn('⚠️  Server will start with limited functionality');
}

// Register database error handler after all routes
// This catches database errors and returns 503 instead of crashing
const { databaseErrorHandler } = await import("./middleware/database-guard.js");
app.use(databaseErrorHandler);

const server = app.listen(PORT, HOST, () => {
  const startupDuration = Date.now() - appStartTime;

  // Record startup metrics
  metrics.recordStartupDuration(startupDuration);

  // Log successful startup
  logger.logReady(startupDuration);

  console.log(` AccuBooks server running on http://${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`Startup duration: ${startupDuration}ms`);

  if (process.env.NODE_ENV === 'production') {
    console.log(`Metrics available at: http://${HOST}:${PORT}/metrics`);
  }
});

// Handle server errors
server.on('error', (error: any) => {
  if (error.code === 'EADDRINUSE') {
    logger.error('Port already in use', error, { port: PORT });
    console.error(`❌ FATAL: Port ${PORT} is already in use. Cannot start server.`);
    console.error('   Please stop the existing process or use a different port.');
    process.exit(1); // This is acceptable - cannot run without a port
  } else {
    logger.error('Server error', error);
    console.error('❌ FATAL: Server failed to start:', error.message);
    process.exit(1); // This is acceptable - server cannot start
  }
});

// Register database connections for graceful shutdown
// Note: In a real application, you would register actual database connections here
// Example: dbManager.registerConnection('postgres', async () => { await pool.end(); });

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.logShutdown('SIGTERM');
  shutdownManager.initiateShutdown('SIGTERM');
});

process.on('SIGINT', () => {
  logger.logShutdown('SIGINT');
  shutdownManager.initiateShutdown('SIGINT');
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught exception', error, { type: 'uncaught_exception' });
  console.error('❌ UNCAUGHT EXCEPTION:', error.message);
  console.error('   Stack:', error.stack);
  
  // In production, attempt graceful shutdown instead of immediate exit
  if (process.env.NODE_ENV === 'production') {
    console.error('⚠️  Attempting graceful shutdown...');
    shutdownManager.initiateShutdown('uncaughtException').catch(() => {
      console.error('❌ Graceful shutdown failed, forcing exit');
      process.exit(1);
    });
  } else {
    // In development, exit immediately for faster debugging
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled promise rejection', new Error(String(reason)), {
    type: 'unhandled_rejection',
    promise: promise.toString()
  });
  console.error('❌ UNHANDLED REJECTION:', String(reason));
  
  // Log but don't crash - unhandled rejections should not take down the server
  // This is a critical production-readiness improvement
  console.warn('⚠️  Server continuing despite unhandled rejection');
  console.warn('⚠️  This should be investigated and fixed');
  
  // Only exit in development for debugging
  if (process.env.NODE_ENV !== 'production') {
    console.error('   Exiting in development mode for debugging');
    process.exit(1);
  }
});
