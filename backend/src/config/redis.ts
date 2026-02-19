import { logger } from '../utils/logger.js';

/**
 * Redis Configuration for Production Rate Limiting
 * Falls back to in-memory store when Redis is unavailable
 */

let redisClient: any = null;
let RedisStore: any = null;

export async function initRedis(): Promise<void> {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    logger.info('REDIS_URL not set — using in-memory rate limiting');
    return;
  }

  try {
    const ioredis = await import('ioredis');
    const Redis = ioredis.default || ioredis;
    const rateLimitRedis = await import('rate-limit-redis');
    const RStore = (rateLimitRedis as any).RedisStore || (rateLimitRedis as any).default;

    redisClient = new (Redis as any)(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times: number) {
        if (times > 5) return null; // stop retrying after 5 attempts
        return Math.min(times * 200, 2000);
      },
      enableReadyCheck: true,
      lazyConnect: true,
    });

    await redisClient.connect();

    RedisStore = RStore;
    logger.info('Redis connected for rate limiting', { url: redisUrl.replace(/\/\/.*@/, '//***@') });
  } catch (error: any) {
    logger.warn('Redis connection failed — falling back to in-memory rate limiting', {
      error: (error as Error).message,
    });
    redisClient = null;
    RedisStore = null;
  }
}

export function getRedisRateLimitStore(prefix: string = 'rl:'): any {
  if (!redisClient || !RedisStore) return undefined;

  return new RedisStore({
    sendCommand: (...args: string[]) => redisClient.call(...args),
    prefix,
  });
}

export function getRedisClient(): any {
  return redisClient;
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
      logger.info('Redis disconnected');
    } catch (error: any) {
      logger.warn('Redis disconnect error', { error: (error as Error).message });
    }
  }
}
