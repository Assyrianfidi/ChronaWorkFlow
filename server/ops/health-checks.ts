import type { PrismaClient } from '@prisma/client';

import { logger } from '../utils/structured-logger.js';

export type HealthStatus = 'ok' | 'degraded' | 'error';

export interface HealthCheckResult {
  status: HealthStatus;
  checks: Record<string, { status: HealthStatus; message?: string; durationMs?: number }>;
  timestamp: string;
}

export async function checkDatabase(prisma: PrismaClient): Promise<{ status: HealthStatus; message?: string; durationMs: number }> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', durationMs: Date.now() - start };
  } catch (error) {
    logger.error('Database health check failed', error as Error);
    return { status: 'error', message: (error as Error).message, durationMs: Date.now() - start };
  }
}

export async function getHealthSnapshot(prisma: PrismaClient): Promise<HealthCheckResult> {
  const checks: HealthCheckResult['checks'] = {};

  const db = await checkDatabase(prisma);
  checks.database = db;

  const memory = process.memoryUsage();
  checks.memory = {
    status: 'ok',
    message: `rss=${memory.rss} heapUsed=${memory.heapUsed}`,
  };

  checks.uptime = {
    status: 'ok',
    message: `uptimeSeconds=${Math.floor(process.uptime())}`,
  };

  const status: HealthStatus = Object.values(checks).some(c => c.status === 'error')
    ? 'error'
    : Object.values(checks).some(c => c.status === 'degraded')
      ? 'degraded'
      : 'ok';

  return {
    status,
    checks,
    timestamp: new Date().toISOString(),
  };
}
