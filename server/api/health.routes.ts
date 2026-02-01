import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const router = Router();

// Initialize clients (these should ideally come from a shared instance)
let prisma: PrismaClient;
let redis: Redis;

try {
  prisma = new PrismaClient();
  redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
} catch (error) {
  console.error('Failed to initialize health check clients:', error);
}

/**
 * Basic health check endpoint
 * Returns 200 OK if the service is running
 * 
 * @route GET /health
 * @returns {object} 200 - Health status
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      service: 'AccuBooks API',
    };

    res.status(200).json(healthStatus);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
});

/**
 * Database health check endpoint
 * Verifies PostgreSQL connection and query execution
 * 
 * @route GET /health/db
 * @returns {object} 200 - Database health status
 * @returns {object} 503 - Database unhealthy
 */
router.get('/health/db', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    if (!prisma) {
      throw new Error('Prisma client not initialized');
    }

    // Execute a simple query to verify database connectivity
    await prisma.$queryRaw`SELECT 1 as health_check`;
    
    const responseTime = Date.now() - startTime;

    const dbHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'PostgreSQL',
      responseTime: `${responseTime}ms`,
      connected: true,
    };

    res.status(200).json(dbHealth);
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    console.error('Database health check failed:', error);
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'PostgreSQL',
      responseTime: `${responseTime}ms`,
      connected: false,
      error: error instanceof Error ? error.message : 'Database connection failed',
    });
  }
});

/**
 * Redis health check endpoint
 * Verifies Redis connection and operations
 * 
 * @route GET /health/redis
 * @returns {object} 200 - Redis health status
 * @returns {object} 503 - Redis unhealthy
 */
router.get('/health/redis', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    if (!redis) {
      throw new Error('Redis client not initialized');
    }

    // Test Redis connection with PING command
    const pingResult = await redis.ping();
    
    if (pingResult !== 'PONG') {
      throw new Error('Redis PING failed');
    }

    // Test SET and GET operations
    const testKey = 'health_check_test';
    const testValue = Date.now().toString();
    
    await redis.set(testKey, testValue, 'EX', 10); // Expire in 10 seconds
    const retrievedValue = await redis.get(testKey);
    
    if (retrievedValue !== testValue) {
      throw new Error('Redis SET/GET verification failed');
    }

    const responseTime = Date.now() - startTime;

    const redisHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      cache: 'Redis',
      responseTime: `${responseTime}ms`,
      connected: true,
      ping: 'PONG',
    };

    res.status(200).json(redisHealth);
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    console.error('Redis health check failed:', error);
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      cache: 'Redis',
      responseTime: `${responseTime}ms`,
      connected: false,
      error: error instanceof Error ? error.message : 'Redis connection failed',
    });
  }
});

/**
 * Comprehensive health check endpoint
 * Checks all critical services (API, Database, Redis)
 * 
 * @route GET /health/all
 * @returns {object} 200 - All services healthy
 * @returns {object} 503 - One or more services unhealthy
 */
router.get('/health/all', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const checks: any = {
    api: { status: 'healthy', checked: true },
    database: { status: 'unknown', checked: false },
    redis: { status: 'unknown', checked: false },
  };

  let overallStatus = 'healthy';

  // Check Database
  try {
    if (prisma) {
      await prisma.$queryRaw`SELECT 1 as health_check`;
      checks.database = { status: 'healthy', checked: true };
    } else {
      checks.database = { status: 'unhealthy', checked: true, error: 'Prisma not initialized' };
      overallStatus = 'unhealthy';
    }
  } catch (error) {
    checks.database = { 
      status: 'unhealthy', 
      checked: true, 
      error: error instanceof Error ? error.message : 'Database check failed' 
    };
    overallStatus = 'unhealthy';
  }

  // Check Redis
  try {
    if (redis) {
      const pingResult = await redis.ping();
      if (pingResult === 'PONG') {
        checks.redis = { status: 'healthy', checked: true };
      } else {
        checks.redis = { status: 'unhealthy', checked: true, error: 'PING failed' };
        overallStatus = 'unhealthy';
      }
    } else {
      checks.redis = { status: 'unhealthy', checked: true, error: 'Redis not initialized' };
      overallStatus = 'unhealthy';
    }
  } catch (error) {
    checks.redis = { 
      status: 'unhealthy', 
      checked: true, 
      error: error instanceof Error ? error.message : 'Redis check failed' 
    };
    overallStatus = 'unhealthy';
  }

  const responseTime = Date.now() - startTime;

  const healthResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    responseTime: `${responseTime}ms`,
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    checks,
  };

  const statusCode = overallStatus === 'healthy' ? 200 : 503;
  res.status(statusCode).json(healthResponse);
});

/**
 * Readiness probe endpoint
 * Used by orchestrators (Kubernetes, Docker Swarm) to determine if service is ready to accept traffic
 * 
 * @route GET /health/ready
 * @returns {object} 200 - Service ready
 * @returns {object} 503 - Service not ready
 */
router.get('/health/ready', async (req: Request, res: Response) => {
  try {
    // Check if critical dependencies are available
    const dbReady = prisma ? await prisma.$queryRaw`SELECT 1` : false;
    const redisReady = redis ? await redis.ping() === 'PONG' : false;

    if (dbReady && redisReady) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        database: dbReady ? 'ready' : 'not_ready',
        redis: redisReady ? 'ready' : 'not_ready',
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Readiness check failed',
    });
  }
});

/**
 * Liveness probe endpoint
 * Used by orchestrators to determine if service should be restarted
 * 
 * @route GET /health/live
 * @returns {object} 200 - Service alive
 */
router.get('/health/live', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Cleanup on process termination
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing health check connections...');
  if (prisma) await prisma.$disconnect();
  if (redis) await redis.quit();
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing health check connections...');
  if (prisma) await prisma.$disconnect();
  if (redis) await redis.quit();
});

export default router;
