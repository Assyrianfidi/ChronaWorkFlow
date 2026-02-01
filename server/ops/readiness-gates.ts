import type { PrismaClient } from '@prisma/client';

import { logger } from '../utils/structured-logger.js';
import { isKillSwitchEnabled } from './kill-switch.js';

export type ReadinessStatus = 'ready' | 'not_ready';

export interface ReadinessGateResult {
  gate: string;
  ok: boolean;
  message?: string;
}

export interface ReadinessSnapshot {
  status: ReadinessStatus;
  results: ReadinessGateResult[];
  timestamp: string;
}

function isDeterministic(): boolean {
  return process.env.DETERMINISTIC_TEST_IDS === 'true';
}

function now(): Date {
  return isDeterministic() ? new Date(0) : new Date();
}

export async function runReadinessGates(prisma: PrismaClient): Promise<ReadinessSnapshot> {
  const results: ReadinessGateResult[] = [];

  // Gate: DB connectivity
  try {
    await prisma.$queryRaw`SELECT 1`;
    results.push({ gate: 'database', ok: true });
  } catch (error) {
    logger.error('Readiness gate database failed', error as Error);
    results.push({ gate: 'database', ok: false, message: (error as Error).message });
  }

  // Gate: kill switches
  if (isKillSwitchEnabled('GLOBAL_WRITE')) {
    results.push({ gate: 'kill_switch_global_write', ok: false, message: 'GLOBAL_WRITE kill switch enabled' });
  } else {
    results.push({ gate: 'kill_switch_global_write', ok: true });
  }

  const status: ReadinessStatus = results.every(r => r.ok) ? 'ready' : 'not_ready';

  return {
    status,
    results,
    timestamp: now().toISOString(),
  };
}
