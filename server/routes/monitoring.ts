// Production Monitoring Routes
// Phase 2: Monitoring Setup Implementation
// Date: February 1, 2026
// Purpose: Expose metrics and health endpoints

import express from 'express';
import { register, updateSystemHealth, updateSystemUptime } from '../monitoring/metrics';
import { db } from '../db';
import { getDatabasePoolConfig } from '../config/database-pool';
import { sql } from 'drizzle-orm';

const router = express.Router();

/**
 * Metrics endpoint for Prometheus scraping
 * GET /api/monitoring/metrics
 */
router.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error) {
    res.status(500).end(error);
  }
});

/**
 * Health check endpoint
 * GET /api/monitoring/health
 */
router.get('/health', async (req, res) => {
  try {
    const health = await getSystemHealth();
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Detailed health check with component status
 * GET /api/monitoring/health/detailed
 */
router.get('/health/detailed', async (req, res) => {
  try {
    const health = await getDetailedHealth();
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Database pool configuration endpoint
 * GET /api/monitoring/pool-config
 */
router.get('/pool-config', async (req, res) => {
  try {
    const poolConfig = getDatabasePoolConfig();
    const poolStats = await getDatabasePoolStats();
    
    res.json({
      configuration: poolConfig,
      current_stats: poolStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * System metrics summary
 * GET /api/monitoring/summary
 */
router.get('/summary', async (req, res) => {
  try {
    const summary = await getMetricsSummary();
    res.json(summary);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get system health status
 */
async function getSystemHealth() {
  const uptime = process.uptime();
  updateSystemUptime(uptime);

  // Check database connectivity
  const dbHealthy = await checkDatabaseHealth();
  
  // Overall health
  const isHealthy = dbHealthy;
  updateSystemHealth(isHealthy);

  return {
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: uptime,
    database: dbHealthy ? 'healthy' : 'unhealthy',
  };
}

/**
 * Get detailed health check
 */
async function getDetailedHealth() {
  const uptime = process.uptime();
  updateSystemUptime(uptime);

  // Check all components
  const dbHealth = await checkDatabaseHealth();
  const poolStats = await getDatabasePoolStats();

  const components = {
    database: {
      status: dbHealth ? 'healthy' : 'unhealthy',
      pool: poolStats,
    },
    application: {
      status: 'healthy',
      uptime: uptime,
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
    },
  };

  const allHealthy = dbHealth;
  updateSystemHealth(allHealthy);

  return {
    status: allHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: uptime,
    components,
  };
}

/**
 * Check database health
 */
async function checkDatabaseHealth(): Promise<boolean> {
  try {
    // Simple query to check database connectivity
    const result = await db.execute(sql`SELECT 1 as health_check`);
    return result.length > 0;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

/**
 * Get database pool statistics
 */
async function getDatabasePoolStats() {
  try {
    const poolConfig = getDatabasePoolConfig();
    
    // Get current pool stats (if available from pool object)
    // Note: Actual implementation depends on pool type (Neon vs PostgreSQL)
    const stats = {
      max: poolConfig.max,
      min: poolConfig.min,
      idle_timeout: poolConfig.idleTimeoutMillis,
      connection_timeout: poolConfig.connectionTimeoutMillis,
      // These would come from actual pool metrics if available
      total_count: 0,
      idle_count: 0,
      waiting_count: 0,
    };

    return stats;
  } catch (error) {
    console.error('Failed to get pool stats:', error);
    return null;
  }
}

/**
 * Get metrics summary
 */
async function getMetricsSummary() {
  const metrics = await register.getMetricsAsJSON();
  
  // Extract key metrics for summary
  const summary = {
    timestamp: new Date().toISOString(),
    database: {
      active_connections: findMetricValue(metrics, 'db_active_connections'),
      pool_utilization: findMetricValue(metrics, 'db_pool_utilization_percent'),
      pool_max: findMetricValue(metrics, 'db_pool_max_connections'),
      pool_min: findMetricValue(metrics, 'db_pool_min_connections'),
    },
    api: {
      total_requests: findMetricValue(metrics, 'http_requests_total'),
      error_rate: findMetricValue(metrics, 'http_error_rate_percent'),
    },
    cache: {
      memory_usage_percent: findMetricValue(metrics, 'cache_memory_usage_percent'),
      hit_rate: findMetricValue(metrics, 'cache_hit_rate_percent'),
    },
    queue: {
      depth: findMetricValue(metrics, 'forecast_queue_depth'),
      worker_utilization: findMetricValue(metrics, 'forecast_worker_utilization_percent'),
    },
    business: {
      active_users: findMetricValue(metrics, 'active_users_concurrent'),
      forecasts_generated: findMetricValue(metrics, 'forecasts_generated_total'),
    },
    system: {
      uptime: findMetricValue(metrics, 'system_uptime_seconds'),
      health_status: findMetricValue(metrics, 'system_health_status'),
    },
  };

  return summary;
}

/**
 * Find metric value from metrics array
 */
function findMetricValue(metrics: any[], metricName: string): number | null {
  const metric = metrics.find(m => m.name === metricName);
  if (!metric || !metric.values || metric.values.length === 0) {
    return null;
  }
  return metric.values[0].value;
}

export default router;
