import client from 'prom-client';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

/**
 * Prometheus Metrics Configuration
 * Exposes /api/metrics endpoint for Grafana/Prometheus scraping
 */

// Create a Registry
const register = new client.Registry();

// Add default metrics (CPU, memory, event loop, GC, etc.)
client.collectDefaultMetrics({
  register,
  prefix: 'accubooks_',
});

// Custom metrics
const httpRequestDuration = new client.Histogram({
  name: 'accubooks_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

const httpRequestsTotal = new client.Counter({
  name: 'accubooks_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

const activeConnections = new client.Gauge({
  name: 'accubooks_active_connections',
  help: 'Number of active connections',
  registers: [register],
});

const tenantIsolationViolations = new client.Counter({
  name: 'accubooks_tenant_isolation_violations_total',
  help: 'Total tenant isolation violations detected',
  labelNames: ['model', 'action'],
  registers: [register],
});

const dbQueryDuration = new client.Histogram({
  name: 'accubooks_db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['model', 'action'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
  registers: [register],
});

const webhookEventsTotal = new client.Counter({
  name: 'accubooks_webhook_events_total',
  help: 'Total Stripe webhook events processed',
  labelNames: ['event_type', 'status'],
  registers: [register],
});

const gdprRequestsTotal = new client.Counter({
  name: 'accubooks_gdpr_requests_total',
  help: 'Total GDPR requests processed',
  labelNames: ['type', 'status'],
  registers: [register],
});

/**
 * Express middleware to track HTTP request metrics
 */
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = process.hrtime.bigint();
  activeConnections.inc();

  res.on('finish', () => {
    const durationNs = Number(process.hrtime.bigint() - start);
    const durationSec = durationNs / 1e9;

    // Normalize route to avoid high cardinality
    const route = normalizeRoute(req.route?.path || req.path);

    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode.toString() },
      durationSec,
    );

    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode.toString(),
    });

    activeConnections.dec();
  });

  next();
}

/**
 * Handler for /api/metrics endpoint
 */
export async function metricsHandler(_req: Request, res: Response): Promise<void> {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error: any) {
    logger.error('Error generating metrics', { error: (error as Error).message });
    res.status(500).end('Error generating metrics');
  }
}

/**
 * Normalize route paths to prevent high cardinality
 * e.g., /api/users/123 -> /api/users/:id
 */
function normalizeRoute(path: string): string {
  return path
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id') // UUIDs
    .replace(/\/\d+/g, '/:id') // numeric IDs
    .replace(/\/$/, '') || '/';
}

export {
  register,
  httpRequestDuration,
  httpRequestsTotal,
  activeConnections,
  tenantIsolationViolations,
  dbQueryDuration,
  webhookEventsTotal,
  gdprRequestsTotal,
};
