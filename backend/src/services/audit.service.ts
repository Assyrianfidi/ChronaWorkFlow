import { prisma } from "../utils/prisma.js";
import { logger } from "../utils/logger.js";

export interface AuditLogEntry {
  userId?: number;
  userEmail?: string;
  userRole?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  status?: string;
  errorMessage?: string;
  metadata?: any;
}

export class AuditService {
  /**
   * Create an audit log entry
   * Immutable - logs cannot be updated or deleted
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await prisma.audit_logs.create({
        data: {
          userId: entry.userId,
          userEmail: entry.userEmail,
          userRole: entry.userRole,
          action: entry.action,
          resource: entry.resource,
          resourceId: entry.resourceId,
          details: entry.details,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          status: entry.status || 'success',
          errorMessage: entry.errorMessage,
          metadata: entry.metadata,
        },
      });

      logger.info('Audit log created', {
        action: entry.action,
        resource: entry.resource,
        userId: entry.userId,
      });
    } catch (error: any) {
      // Critical: audit logging failure should be logged but not block operations
      logger.error('Failed to create audit log', {
        error: (error as Error).message,
        entry,
      });
    }
  }

  /**
   * Query audit logs (read-only)
   */
  async query(filters: {
    userId?: number;
    action?: string;
    resource?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<any[]> {
    try {
      const where: any = {};

      if (filters.userId) where.userId = filters.userId;
      if (filters.action) where.action = filters.action;
      if (filters.resource) where.resource = filters.resource;
      if (filters.status) where.status = filters.status;

      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) where.createdAt.gte = filters.startDate;
        if (filters.endDate) where.createdAt.lte = filters.endDate;
      }

      const logs = await prisma.audit_logs.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 100,
      });

      return logs.map((log: any) => ({}));
    } catch (error: any) {
      logger.error('Failed to query audit logs', {
        error: error.message,
        filters,
      });
      throw error;
    }
  }

  /**
   * Get audit log statistics
   */
  async getStats(startDate: Date, endDate: Date): Promise<{
    totalLogs: number;
    byAction: Record<string, number>;
    byStatus: Record<string, number>;
    failureRate: number;
  }> {
    try {
      const logs = await prisma.audit_logs.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          action: true,
          status: true,
        },
      });

      const byAction: Record<string, number> = {};
      const byStatus: Record<string, number> = {};
      let failures = 0;

      logs.forEach((log: any) => {
        byAction[log.action] = (byAction[log.action] || 0) + 1;
        byStatus[log.status] = (byStatus[log.status] || 0) + 1;
        if (log.status === 'failure') failures++;
      });

      return {
        totalLogs: logs.length,
        byAction,
        byStatus,
        failureRate: logs.length > 0 ? (failures / logs.length) * 100 : 0,
      };
    } catch (error: any) {
      logger.error('Failed to get audit log stats', {
        error: (error as Error).message,
      });
      throw error;
    }
  }
}

export const auditService = new AuditService();
