/**
 * Monitoring Routes
 * 
 * Comprehensive health checks and metrics endpoints for production monitoring.
 */

import { Request, Response, Router } from 'express';
import { getDatabaseStatus } from '../db';
import { jobService } from '../jobs/service';

const router = Router();

/**
 * Comprehensive health check endpoint
 * Returns detailed status of all system dependencies
 */
router.get('/health', async (req, res: Response) => {
  try {
    const dbStatus = getDatabaseStatus();
    
    // Check job service health
    let jobsHealth = { status: 'unknown', redis: false, queues: {}, initialized: false };
    try {
      jobsHealth = await jobService.healthCheck();
    } catch (error) {
      console.warn('Job service health check failed:', error instanceof Error ? error.message : error);
    }

    // Determine overall health status
    const isHealthy = dbStatus.available && (jobsHealth.redis || !jobsHealth.initialized);
    const isDegraded = !dbStatus.available || (jobsHealth.initialized && !jobsHealth.redis);

    const status = isHealthy ? 'healthy' : isDegraded ? 'degraded' : 'unhealthy';
    const httpStatus = isHealthy ? 200 : isDegraded ? 200 : 503;

    res.status(httpStatus).json({
      status,
      service: 'accubooks',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      dependencies: {
        database: {
          status: dbStatus.available ? 'connected' : 'unavailable',
          initialized: dbStatus.initialized,
        },
        redis: {
          status: jobsHealth.redis ? 'connected' : 'unavailable',
          initialized: jobsHealth.initialized,
        },
        jobQueues: {
          status: jobsHealth.status,
          queues: jobsHealth.queues,
        },
      },
      resources: {
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          unit: 'MB',
        },
        cpu: {
          user: process.cpuUsage().user,
          system: process.cpuUsage().system,
        },
      },
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      service: 'accubooks',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Liveness probe - simple check that server is running
 * Used by orchestrators (K8s, Docker) to determine if container should be restarted
 */
router.get('/live', (_req, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Readiness probe - check if server is ready to accept traffic
 * Used by load balancers to determine if instance should receive requests
 */
router.get('/ready', async (_req, res: Response) => {
  const dbStatus = getDatabaseStatus();
  
  // Server is ready if database is available OR if it's initialized but degraded
  // This allows the server to handle non-database requests even when DB is down
  const isReady = dbStatus.initialized;
  
  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ready' : 'not_ready',
    reason: isReady ? 'Server initialized' : 'Server still initializing',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Metrics endpoint for Prometheus scraping
 */
router.get('/metrics', async (req, res: Response) => {
  try {
    const dbStatus = getDatabaseStatus();
    let jobsHealth = { status: 'unknown', redis: false, queues: {}, initialized: false };
    
    try {
      jobsHealth = await jobService.healthCheck();
    } catch (error) {
      // Ignore job service errors for metrics
    }

    // Prometheus format metrics
    const metrics = [
      '# HELP accubooks_up Server is up and running',
      '# TYPE accubooks_up gauge',
      'accubooks_up 1',
      '',
      '# HELP accubooks_database_available Database connection status',
      '# TYPE accubooks_database_available gauge',
      `accubooks_database_available ${dbStatus.available ? 1 : 0}`,
      '',
      '# HELP accubooks_redis_available Redis connection status',
      '# TYPE accubooks_redis_available gauge',
      `accubooks_redis_available ${jobsHealth.redis ? 1 : 0}`,
      '',
      '# HELP accubooks_uptime_seconds Server uptime in seconds',
      '# TYPE accubooks_uptime_seconds counter',
      `accubooks_uptime_seconds ${Math.floor(process.uptime())}`,
      '',
      '# HELP accubooks_memory_used_bytes Memory used in bytes',
      '# TYPE accubooks_memory_used_bytes gauge',
      `accubooks_memory_used_bytes ${process.memoryUsage().heapUsed}`,
      '',
      '# HELP accubooks_memory_total_bytes Total memory allocated in bytes',
      '# TYPE accubooks_memory_total_bytes gauge',
      `accubooks_memory_total_bytes ${process.memoryUsage().heapTotal}`,
      '',
    ];

    res.set('Content-Type', 'text/plain; version=0.0.4');
    res.send(metrics.join('\n'));
  } catch (error) {
    console.error('Metrics endpoint error:', error);
    res.status(500).send('# Error generating metrics\n');
  }
});

export default router;
