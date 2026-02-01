import type { PrismaClient } from '@prisma/client';

import type { Permission } from '../auth/tenant-permissions.js';
import { getAuthorizationEngine } from '../auth/authorization-engine.js';
import { getImmutableAuditLogger } from '../compliance/immutable-audit-log.js';
import { logger } from '../utils/structured-logger.js';
import type { TenantContext } from '../tenant/tenant-isolation.js';

export interface OpsAuthorizationContext {
  tenantContext: TenantContext;
  requestId: string;
  operation: string;
  ip?: string;
  userAgent?: string;
}

export class OpsAuthorizationError extends Error {
  public readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'OpsAuthorizationError';
    this.code = code;
  }
}

function getUserIdFromTenantContext(tenantContext: TenantContext): string {
  const userId = (tenantContext as any)?.user?.id as string | undefined;
  if (!userId) {
    throw new OpsAuthorizationError('User ID is required for ops authorization', 'OPS_USER_REQUIRED');
  }
  return userId;
}

export async function requireOpsPermission(
  prisma: PrismaClient,
  ctx: OpsAuthorizationContext,
  permission: Permission
): Promise<void> {
  const audit = getImmutableAuditLogger();
  const authorizationEngine = getAuthorizationEngine(prisma);

  const userId = getUserIdFromTenantContext(ctx.tenantContext);

  const result = await authorizationEngine.authorize({
    permission,
    tenantContext: ctx.tenantContext,
    context: {
      operation: ctx.operation,
      requestId: ctx.requestId,
      userId,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    },
  });

  if (!result.authorized) {
    audit.logSecurityEvent({
      tenantId: ctx.tenantContext.tenantId,
      actorId: userId,
      action: 'OPS_ACCESS_DENIED',
      resourceType: 'OPS_CONTROL_PLANE',
      resourceId: ctx.operation,
      outcome: 'FAILURE',
      correlationId: ctx.requestId,
      severity: 'HIGH',
      metadata: {
        permission,
        reason: result.reason,
        validationChecks: result.details?.validationChecks || [],
      },
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });

    logger.warn('Ops access denied', {
      tenantId: ctx.tenantContext.tenantId,
      userId,
      operation: ctx.operation,
      permission,
      reason: result.reason,
    });

    throw new OpsAuthorizationError('Access denied', 'OPS_ACCESS_DENIED');
  }

  audit.logSecurityEvent({
    tenantId: ctx.tenantContext.tenantId,
    actorId: userId,
    action: 'OPS_ACCESS_GRANTED',
    resourceType: 'OPS_CONTROL_PLANE',
    resourceId: ctx.operation,
    outcome: 'SUCCESS',
    correlationId: ctx.requestId,
    severity: 'LOW',
    metadata: {
      permission,
    },
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });
}
