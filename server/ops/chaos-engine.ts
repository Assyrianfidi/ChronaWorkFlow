import { logger } from '../utils/structured-logger.js';

export type ChaosFault =
  | 'DB_LATENCY'
  | 'DB_ERROR'
  | 'HTTP_500'
  | 'TIMEOUT';

export interface ChaosInjection {
  fault: ChaosFault;
  probability: number;
  latencyMs?: number;
}

let injections: ChaosInjection[] = [];

export function isChaosEnabled(): boolean {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }
  return process.env.CHAOS_ENABLED === 'true';
}

export function setChaosInjections(next: ChaosInjection[]): void {
  if (!isChaosEnabled()) {
    logger.warn('Chaos injections ignored (disabled)');
    injections = [];
    return;
  }

  injections = next;
  logger.warn('Chaos injections updated', { injections });
}

export async function maybeInject(fault: ChaosFault): Promise<void> {
  if (!isChaosEnabled()) {
    return;
  }

  const rule = injections.find(i => i.fault === fault);
  if (!rule) {
    return;
  }

  if (Math.random() > rule.probability) {
    return;
  }

  if (rule.latencyMs && rule.latencyMs > 0) {
    await new Promise(resolve => setTimeout(resolve, rule.latencyMs));
  }

  switch (fault) {
    case 'DB_ERROR':
      throw new Error('CHAOS_DB_ERROR');
    case 'HTTP_500':
      throw new Error('CHAOS_HTTP_500');
    case 'TIMEOUT':
      throw new Error('CHAOS_TIMEOUT');
    case 'DB_LATENCY':
    default:
      return;
  }
}
