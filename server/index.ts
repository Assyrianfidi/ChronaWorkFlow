import { validateEnvironmentVariables, getServerConfig } from "./config/env-validation.js";
import { logger } from "./utils/structured-logger.js";
import { metrics } from "./utils/metrics.js";
import { shutdownManager, dbManager, connectionTrackingMiddleware, observabilityMiddleware } from "./utils/graceful-shutdown.js";
import { createApp } from "./app.js";
import { registerAllRoutes } from "./routes/index.js";

// Record startup time
const appStartTime = Date.now();

// Validate environment variables before starting server
validateEnvironmentVariables();

// Log application startup
logger.logStartup();

const { port: PORT, hostname: HOST } = getServerConfig();

const app = createApp();

// Canonical observability/connection tracking in the actual runtime server
app.use(observabilityMiddleware());
app.use(connectionTrackingMiddleware());

// Preserve non-API operational endpoints alongside the API
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "accubooks",
    env: process.env.NODE_ENV || "development",
  });
});

app.get("/metrics", (req, res) => {
  const handler = metrics.getMetricsHandler();
  return handler(req, res);
});

// Register all API routes (legacy + workflow routes) on the canonical app
await registerAllRoutes(app);

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
  } else {
    logger.error('Server error', error);
  }
  process.exit(1);
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
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled promise rejection', new Error(String(reason)), {
    type: 'unhandled_rejection',
    promise: promise.toString()
  });
  process.exit(1);
});
