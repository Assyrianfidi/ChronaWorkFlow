/**
 * Audit Log Service
 * 
 * Logs all authorization decisions for security auditing
 */

import { PrismaClient } from '../../generated/prisma';

const prisma = new PrismaClient();

export interface AuditLogEntry {
  tenantId: string;
  userId: string;
  action: string;
  resource?: string;
  resourceId?: string;
  allowed: boolean;
  reason?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an authorization event
 */
export async function logAuthorizationEvent(entry: AuditLogEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: entry.tenantId,
        userId: entry.userId,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId,
        allowed: entry.allowed,
        reason: entry.reason,
        metadata: entry.metadata || {},
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
      },
    });
  } catch (error) {
    // Don't fail the request if audit logging fails
    console.error('[AUDIT] Failed to log event:', error);
  }
}

/**
 * Get audit logs for a tenant
 */
export async function getAuditLogs(
  tenantId: string,
  options: {
    userId?: string;
    action?: string;
    allowed?: boolean;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  } = {}
) {
  const where: any = { tenantId };

  if (options.userId) where.userId = options.userId;
  if (options.action) where.action = options.action;
  if (options.allowed !== undefined) where.allowed = options.allowed;
  if (options.startDate || options.endDate) {
    where.createdAt = {};
    if (options.startDate) where.createdAt.gte = options.startDate;
    if (options.endDate) where.createdAt.lte = options.endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: options.limit || 100,
      skip: options.offset || 0,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total };
}

/**
 * Get authorization failure rate for monitoring
 */
export async function getAuthorizationFailureRate(
  tenantId: string,
  timeWindowMinutes: number = 60
): Promise<number> {
  const since = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

  const [total, denied] = await Promise.all([
    prisma.auditLog.count({
      where: {
        tenantId,
        createdAt: { gte: since },
      },
    }),
    prisma.auditLog.count({
      where: {
        tenantId,
        allowed: false,
        createdAt: { gte: since },
      },
    }),
  ]);

  return total > 0 ? (denied / total) * 100 : 0;
}
