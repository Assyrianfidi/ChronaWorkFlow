import { getImmutableAuditLogger } from '../compliance/immutable-audit-log.js';
import { logger } from '../utils/structured-logger.js';
import type { TenantContext } from '../tenant/tenant-isolation.js';

export type KillSwitchName =
  | 'GLOBAL_WRITE'
  | 'BILLING'
  | 'WEBHOOKS'
  | 'BACKGROUND_JOBS'
  | 'EXTERNAL_INTEGRATIONS';

export interface KillSwitchState {
  enabled: boolean;
  reason?: string;
  updatedAt: Date;
  updatedBy?: string;
}

const switches: Map<KillSwitchName, KillSwitchState> = new Map();

function getUserId(tenantContext: TenantContext): string {
  return ((tenantContext as any)?.user?.id || 'system') as string;
}

export function isKillSwitchEnabled(name: KillSwitchName): boolean {
  const envOverride = process.env.OPS_KILL_SWITCH;
  if (envOverride && envOverride.split(',').map(s => s.trim()).includes(name)) {
    return true;
  }

  return switches.get(name)?.enabled || false;
}

export function getKillSwitchState(name: KillSwitchName): KillSwitchState {
  const existing = switches.get(name);
  if (existing) {
    return existing;
  }

  return {
    enabled: false,
    updatedAt: new Date(0),
  };
}

export function setKillSwitch(
  name: KillSwitchName,
  enabled: boolean,
  reason: string,
  tenantContext: TenantContext,
  requestId: string
): void {
  const audit = getImmutableAuditLogger();
  const updatedBy = getUserId(tenantContext);

  const state: KillSwitchState = {
    enabled,
    reason,
    updatedAt: new Date(),
    updatedBy,
  };

  switches.set(name, state);

  audit.logSecurityEvent({
    tenantId: tenantContext.tenantId,
    actorId: updatedBy,
    action: enabled ? 'KILL_SWITCH_ENABLED' : 'KILL_SWITCH_DISABLED',
    resourceType: 'KILL_SWITCH',
    resourceId: name,
    outcome: 'SUCCESS',
    correlationId: requestId,
    severity: 'HIGH',
    metadata: {
      enabled,
      reason,
    },
  });

  logger.warn('Kill switch updated', {
    name,
    enabled,
    tenantId: tenantContext.tenantId,
    updatedBy,
  });
}

export function assertKillSwitchOff(name: KillSwitchName): void {
  if (isKillSwitchEnabled(name)) {
    throw new Error(`Operation blocked by kill switch: ${name}`);
  }
}
