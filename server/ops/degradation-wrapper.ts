import { logger } from '../utils/structured-logger.js';
import { getSystemState } from '../resilience/degradation-modes.js';

export type DegradationLevel = 'NORMAL' | 'DEGRADED' | 'EMERGENCY';

export function getCurrentDegradationLevel(): DegradationLevel {
  try {
    const state = getSystemState();

    switch (state.overallLevel) {
      case 'EMERGENCY':
        return 'EMERGENCY';
      case 'READ_ONLY':
      case 'PARTIAL':
      case 'MINIMAL':
        return 'DEGRADED';
      case 'NONE':
      default:
        return 'NORMAL';
    }
  } catch (error) {
    logger.error('Failed to read degradation mode', error as Error);
    return 'EMERGENCY';
  }
}

export function assertNotEmergencyMode(operation: string): void {
  const level = getCurrentDegradationLevel();
  if (level === 'EMERGENCY') {
    throw new Error(`Operation blocked in emergency mode: ${operation}`);
  }
}
