// Production Monitoring Metrics
// Phase 2: Monitoring Setup Implementation
// Date: February 1, 2026
// Purpose: Prometheus-compatible metrics collection

import { Counter, Gauge, Histogram, Registry } from 'prom-client';

// Create a Registry to register the metrics
export const register = new Registry();

// ============================================
// API PERFORMANCE METRICS
// ============================================

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in milliseconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [10, 50, 100, 200, 500, 1000, 2000, 5000],
  registers: [register],
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const httpErrorRate = new Gauge({
  name: 'http_error_rate_percent',
  help: 'HTTP error rate as percentage',
  labelNames: ['status_code'],
  registers: [register],
});

// ============================================
// DATABASE METRICS
// ============================================

export const dbActiveConnections = new Gauge({
  name: 'db_active_connections',
  help: 'Number of active database connections',
  registers: [register],
});

export const dbPoolUtilization = new Gauge({
  name: 'db_pool_utilization_percent',
  help: 'Database connection pool utilization percentage',
  registers: [register],
});

export const dbConnectionWaitTime = new Histogram({
  name: 'db_connection_wait_time_ms',
  help: 'Time waiting for database connection in milliseconds',
  buckets: [1, 5, 10, 25, 50, 100, 250, 500],
  registers: [register],
});

export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_ms',
  help: 'Database query duration in milliseconds',
  labelNames: ['query_type'],
  buckets: [10, 50, 100, 200, 500, 1000, 2000],
  registers: [register],
});

export const dbConnectionErrors = new Counter({
  name: 'db_connection_errors_total',
  help: 'Total number of database connection errors',
  labelNames: ['error_type'],
  registers: [register],
});

export const dbPoolMax = new Gauge({
  name: 'db_pool_max_connections',
  help: 'Maximum database pool connections configured',
  registers: [register],
});

export const dbPoolMin = new Gauge({
  name: 'db_pool_min_connections',
  help: 'Minimum database pool connections configured',
  registers: [register],
});

// ============================================
// REDIS CACHE METRICS
// ============================================

export const cacheMemoryUsage = new Gauge({
  name: 'cache_memory_usage_bytes',
  help: 'Redis cache memory usage in bytes',
  registers: [register],
});

export const cacheMemoryPercent = new Gauge({
  name: 'cache_memory_usage_percent',
  help: 'Redis cache memory usage percentage',
  registers: [register],
});

export const cacheHitRate = new Gauge({
  name: 'cache_hit_rate_percent',
  help: 'Cache hit rate percentage',
  registers: [register],
});

export const cacheEvictionRate = new Gauge({
  name: 'cache_eviction_rate_per_sec',
  help: 'Cache eviction rate per second',
  registers: [register],
});

export const cacheLatency = new Histogram({
  name: 'cache_operation_duration_ms',
  help: 'Cache operation duration in milliseconds',
  labelNames: ['operation'],
  buckets: [1, 5, 10, 25, 50, 100],
  registers: [register],
});

export const cacheHits = new Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  registers: [register],
});

export const cacheMisses = new Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  registers: [register],
});

// ============================================
// FORECAST QUEUE METRICS
// ============================================

export const queueDepth = new Gauge({
  name: 'forecast_queue_depth',
  help: 'Number of jobs waiting in forecast queue',
  registers: [register],
});

export const queueWorkerUtilization = new Gauge({
  name: 'forecast_worker_utilization_percent',
  help: 'Forecast worker utilization percentage',
  registers: [register],
});

export const queueJobDuration = new Histogram({
  name: 'forecast_job_duration_seconds',
  help: 'Forecast job processing duration in seconds',
  buckets: [1, 2, 5, 8, 10, 15, 20, 30, 60],
  registers: [register],
});

export const queueJobsProcessed = new Counter({
  name: 'forecast_jobs_processed_total',
  help: 'Total number of forecast jobs processed',
  labelNames: ['status'],
  registers: [register],
});

export const queueJobFailureRate = new Gauge({
  name: 'forecast_job_failure_rate_percent',
  help: 'Forecast job failure rate percentage',
  registers: [register],
});

// ============================================
// BUSINESS METRICS
// ============================================

export const activeUsers = new Gauge({
  name: 'active_users_concurrent',
  help: 'Number of concurrent active users',
  registers: [register],
});

export const forecastsGenerated = new Counter({
  name: 'forecasts_generated_total',
  help: 'Total number of forecasts generated',
  labelNames: ['tier'],
  registers: [register],
});

export const tierLimitHits = new Counter({
  name: 'tier_limit_hits_total',
  help: 'Total number of tier limit hits',
  labelNames: ['tier', 'limit_type'],
  registers: [register],
});

export const trustLayerUsage = new Counter({
  name: 'trust_layer_usage_total',
  help: 'Total trust layer interactions',
  labelNames: ['component'],
  registers: [register],
});

export const userSessions = new Gauge({
  name: 'user_sessions_active',
  help: 'Number of active user sessions',
  registers: [register],
});

export const scenariosCreated = new Counter({
  name: 'scenarios_created_total',
  help: 'Total number of scenarios created',
  labelNames: ['tier'],
  registers: [register],
});

// ============================================
// SYSTEM HEALTH METRICS
// ============================================

export const systemUptime = new Gauge({
  name: 'system_uptime_seconds',
  help: 'System uptime in seconds',
  registers: [register],
});

export const systemHealthStatus = new Gauge({
  name: 'system_health_status',
  help: 'System health status (1=healthy, 0=unhealthy)',
  registers: [register],
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Update database pool metrics
 */
export function updateDbPoolMetrics(active: number, max: number, min: number) {
  dbActiveConnections.set(active);
  dbPoolMax.set(max);
  dbPoolMin.set(min);
  const utilization = (active / max) * 100;
  dbPoolUtilization.set(utilization);
}

/**
 * Update cache metrics
 */
export function updateCacheMetrics(memoryUsed: number, memoryMax: number, hits: number, misses: number) {
  cacheMemoryUsage.set(memoryUsed);
  const memoryPercent = (memoryUsed / memoryMax) * 100;
  cacheMemoryPercent.set(memoryPercent);
  
  const total = hits + misses;
  if (total > 0) {
    const hitRate = (hits / total) * 100;
    cacheHitRate.set(hitRate);
  }
}

/**
 * Update queue metrics
 */
export function updateQueueMetrics(depth: number, workers: number, activeWorkers: number) {
  queueDepth.set(depth);
  const utilization = workers > 0 ? (activeWorkers / workers) * 100 : 0;
  queueWorkerUtilization.set(utilization);
}

/**
 * Record HTTP request
 */
export function recordHttpRequest(method: string, route: string, statusCode: number, durationMs: number) {
  httpRequestTotal.inc({ method, route, status_code: statusCode });
  httpRequestDuration.observe({ method, route, status_code: statusCode }, durationMs);
}

/**
 * Record database query
 */
export function recordDbQuery(queryType: string, durationMs: number) {
  dbQueryDuration.observe({ query_type: queryType }, durationMs);
}

/**
 * Record cache operation
 */
export function recordCacheOperation(operation: string, durationMs: number, hit: boolean) {
  cacheLatency.observe({ operation }, durationMs);
  if (hit) {
    cacheHits.inc();
  } else {
    cacheMisses.inc();
  }
}

/**
 * Record forecast job
 */
export function recordForecastJob(status: 'success' | 'failure', durationSeconds: number) {
  queueJobsProcessed.inc({ status });
  queueJobDuration.observe(durationSeconds);
}

/**
 * Update system health
 */
export function updateSystemHealth(isHealthy: boolean) {
  systemHealthStatus.set(isHealthy ? 1 : 0);
}

/**
 * Update system uptime
 */
export function updateSystemUptime(uptimeSeconds: number) {
  systemUptime.set(uptimeSeconds);
}
