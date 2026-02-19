/**
 * AccuBooks Health Check Server
 * 
 * Dedicated health check server on port 3001 (separate from main API on 3000)
 * This ensures health endpoints are ALWAYS accessible without authentication,
 * CSRF tokens, rate limiting, or any other middleware that could block them.
 * 
 * Used by:
 * - Load balancers (AWS ALB, Azure LB, etc.)
 * - Kubernetes readiness/liveness probes
 * - Docker healthcheck
 * - Monitoring systems (Datadog, New Relic, PagerDuty)
 * 
 * Industry Standard Pattern:
 * Many production systems (Google, Netflix, Amazon) use separate health servers
 * to isolate health checks from application complexity.
 */

import express from 'express';

const app = express();
const PORT = process.env.HEALTH_PORT || 3001;
const START_TIME = Date.now();

// Simple logging middleware
app.use((req, res, next) => {
  console.log(`[Health] ${req.method} ${req.path}`);
  next();
});

// Main health check - comprehensive status
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'accubooks-api',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - START_TIME) / 1000),
    memory: {
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB',
      heap: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
    },
  });
});

// Readiness probe - checks if application is ready to serve traffic
// Used by load balancers to determine if instance should receive traffic
app.get('/ready', (req, res) => {
  res.status(200).json({
    ready: true,
    timestamp: new Date().toISOString()
  });
});

// Liveness probe - checks if application is alive (not deadlocked)
// Used by orchestration systems to determine if container should be restarted
app.get('/alive', (req, res) => {
  res.status(200).json({
    alive: true,
    uptime: Math.floor((Date.now() - START_TIME) / 1000),
    timestamp: new Date().toISOString()
  });
});

// Alternative paths with /api prefix for compatibility
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health/ready', (req, res) => {
  res.status(200).json({
    ready: true,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health/alive', (req, res) => {
  res.status(200).json({
    alive: true,
    uptime: Math.floor((Date.now() - START_TIME) / 1000),
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    service: 'AccuBooks Health Check Server',
    version: '1.0.0',
    endpoints: [
      'GET /health',
      'GET /ready',
      'GET /alive',
      'GET /api/health',
      'GET /api/health/ready',
      'GET /api/health/alive'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✓ AccuBooks Health Check Server running on port ${PORT}`);
  console.log(`  Health endpoints:`);
  console.log(`    http://localhost:${PORT}/health`);
  console.log(`    http://localhost:${PORT}/ready`);
  console.log(`    http://localhost:${PORT}/alive`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing health server');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing health server');
  await prisma.$disconnect();
  process.exit(0);
});
