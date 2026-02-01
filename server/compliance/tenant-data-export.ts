// CRITICAL: Tenant-Scoped Data Export System
// MANDATORY: Secure Right-to-Access data export with zero cross-tenant leakage

import { PrismaClient } from '@prisma/client';
import { randomBytes, createHash } from 'crypto';
import { logger } from '../utils/structured-logger.js';
import { getImmutableAuditLogger } from './immutable-audit-log.js';
import { TenantContext } from '../tenant/tenant-isolation.js';

export interface DataExportRequest {
  tenantId: string;
  userId: string;
  exportType: 'USER_DATA' | 'TRANSACTIONS' | 'INVOICES' | 'REPORTS' | 'AUDIT_LOGS' | 'FULL_EXPORT';
  format: 'JSON' | 'CSV';
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  filters?: Record<string, any>;
  reason: string;
  correlationId: string;
}

export interface DataExportJob {
  id: string;
  tenantId: string;
  userId: string;
  exportType: DataExportRequest['exportType'];
  format: DataExportRequest['format'];
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'EXPIRED';
  requestedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  expiresAt: Date;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  recordCount?: number;
  filters?: Record<string, any>;
  reason: string;
  correlationId: string;
  metadata: Record<string, any>;
  errors: string[];
}

export interface ExportResult {
  jobId: string;
  status: DataExportJob['status'];
  downloadUrl?: string;
  fileName?: string;
  fileSize?: number;
  recordCount?: number;
  expiresAt: Date;
  errors: string[];
}

export interface ExportStatistics {
  totalExports: number;
  exportsByType: Record<string, number>;
  exportsByFormat: Record<string, number>;
  activeJobs: number;
  recentExports: DataExportJob[];
  totalDataExported: number; // in bytes
}

/**
 * CRITICAL: Tenant-Scoped Data Export Manager
 * 
 * This class provides secure, tenant-isolated data export functionality
 * with permission gating, rate limiting, and comprehensive auditing.
 */
export class TenantDataExportManager {
  private prisma: PrismaClient;
  private auditLogger: any;
  private activeJobs: Map<string, DataExportJob> = new Map();
  private rateLimitMap: Map<string, { count: number; resetTime: number }> = new Map();
  
  // CRITICAL: Rate limiting configuration
  private readonly RATE_LIMIT_WINDOW = 3600000; // 1 hour
  private readonly RATE_LIMIT_MAX_REQUESTS = 5; // 5 exports per hour
  private readonly EXPORT_EXPIRY_HOURS = 24; // 24 hours
  private readonly MAX_EXPORT_SIZE = 100 * 1024 * 1024; // 100MB

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.auditLogger = getImmutableAuditLogger(prisma);
    this.startCleanupTimer();
  }

  /**
   * CRITICAL: Request data export
   */
  async requestExport(
    request: DataExportRequest,
    tenantContext: TenantContext
  ): Promise<ExportResult> {
    const startTime = Date.now();
    
    try {
      // CRITICAL: Validate tenant context
      if (tenantContext.tenantId !== request.tenantId) {
        throw new Error('Tenant context mismatch');
      }

      // CRITICAL: Check rate limiting
      await this.checkRateLimit((tenantContext as any).user?.id || 'unknown', request.tenantId);

      // CRITICAL: Validate export request
      this.validateExportRequest(request);

      // CRITICAL: Check permissions
      await this.checkExportPermissions(request, tenantContext);

      // CRITICAL: Create export job
      const job = await this.createExportJob(request, tenantContext);

      // CRITICAL: Log export request
      this.auditLogger.logDataMutation({
        tenantId: request.tenantId,
        actorId: (tenantContext as any).user?.id || 'unknown',
        action: 'CREATE',
        resourceType: 'DATA_EXPORT',
        resourceId: job.id,
        outcome: 'SUCCESS',
        correlationId: request.correlationId,
        metadata: {
          exportType: request.exportType,
          format: request.format,
          reason: request.reason,
          dateRange: request.dateRange,
          filters: request.filters
        }
      });

      // CRITICAL: Start export processing asynchronously
      this.processExportAsync(job.id).catch(error => {
        logger.error('Export processing failed', error as Error, { jobId: job.id });
      });

      logger.info('Data export requested', {
        jobId: job.id,
        tenantId: request.tenantId,
        userId: request.userId,
        exportType: request.exportType,
        format: request.format,
        reason: request.reason
      });

      return {
        jobId: job.id,
        status: job.status,
        expiresAt: job.expiresAt,
        errors: []
      };

    } catch (error) {
      // CRITICAL: Log export request failure
      this.auditLogger.logDataMutation({
        tenantId: request.tenantId,
        actorId: (tenantContext as any).user?.id || 'unknown',
        action: 'CREATE',
        resourceType: 'DATA_EXPORT',
        resourceId: 'unknown',
        outcome: 'FAILURE',
        correlationId: request.correlationId,
        metadata: {
          exportType: request.exportType,
          format: request.format,
          reason: request.reason,
          error: (error as Error).message
        }
      });

      logger.error('Data export request failed', error as Error, {
        tenantId: request.tenantId,
        userId: request.userId,
        exportType: request.exportType
      });

      throw error;
    }
  }

  /**
   * CRITICAL: Get export job status
   */
  async getExportStatus(
    jobId: string,
    tenantContext: TenantContext
  ): Promise<DataExportJob | null> {
    try {
      // CRITICAL: Verify tenant access
      const job = await this.getExportJob(jobId);
      if (!job || job.tenantId !== tenantContext.tenantId) {
        return null;
      }

      return job;

    } catch (error) {
      logger.error('Failed to get export status', error as Error, { jobId });
      return null;
    }
  }

  /**
   * CRITICAL: Get export download URL
   */
  async getExportDownloadUrl(
    jobId: string,
    tenantContext: TenantContext
  ): Promise<{ url: string; fileName: string; expiresAt: Date } | null> {
    try {
      // CRITICAL: Verify tenant access and job completion
      const job = await this.getExportJob(jobId);
      if (!job || job.tenantId !== tenantContext.tenantId || job.status !== 'COMPLETED') {
        return null;
      }

      // CRITICAL: Check if export has expired
      if (new Date() > job.expiresAt) {
        await this.markExportExpired(jobId);
        return null;
      }

      // CRITICAL: Generate secure download URL
      const downloadUrl = this.generateDownloadUrl(jobId);

      // CRITICAL: Log download access
      this.auditLogger.logAuthorizationDecision({
        tenantId: job.tenantId,
        actorId: (tenantContext as any).user?.id || 'unknown',
        action: 'DATA_EXPORT_DOWNLOAD',
        resourceType: 'DATA_EXPORT',
        resourceId: jobId,
        outcome: 'SUCCESS',
        correlationId: 'download_' + jobId,
        metadata: {
          fileName: job.fileName,
          fileSize: job.fileSize,
          expiresAt: job.expiresAt
        }
      });

      return {
        url: downloadUrl,
        fileName: job.fileName || 'export.zip',
        expiresAt: job.expiresAt
      };

    } catch (error) {
      logger.error('Failed to get export download URL', error as Error, { jobId });
      return null;
    }
  }

  /**
   * CRITICAL: Get export statistics
   */
  async getExportStatistics(
    tenantContext: TenantContext
  ): Promise<ExportStatistics> {
    try {
      // CRITICAL: Get tenant-specific statistics
      const result = await this.prisma.$queryRaw`
        SELECT 
          COUNT(*) as total_exports,
          export_type,
          format,
          COUNT(*) as type_count
        FROM data_export_jobs 
        WHERE tenant_id = ${tenantContext.tenantId}
        GROUP BY export_type, format
      ` as Array<{
        total_exports: bigint;
        export_type: string;
        format: string;
        type_count: bigint;
      }>;

      const totalExports = result.reduce((sum, row) => sum + Number(row.total_exports), 0);
      const exportsByType = result.reduce((acc, row) => {
        acc[row.export_type] = (acc[row.export_type] || 0) + Number(row.type_count);
        return acc;
      }, {} as Record<string, number>);
      const exportsByFormat = result.reduce((acc, row) => {
        acc[row.format] = (acc[row.format] || 0) + Number(row.type_count);
        return acc;
      }, {} as Record<string, number>);

      // CRITICAL: Get active jobs
      const activeJobs = await this.prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM data_export_jobs 
        WHERE tenant_id = ${tenantContext.tenantId}
        AND status IN ('PENDING', 'RUNNING')
      ` as Array<{ count: bigint }>;

      // CRITICAL: Get recent exports
      const recentExports = await this.prisma.$queryRaw`
        SELECT id, tenant_id, user_id, export_type, format, status,
               requested_at, started_at, completed_at, expires_at,
               file_name, file_size, record_count, reason, correlation_id
        FROM data_export_jobs 
        WHERE tenant_id = ${tenantContext.tenantId}
        ORDER BY requested_at DESC
        LIMIT 10
      ` as DataExportJob[];

      // CRITICAL: Get total data exported
      const totalDataResult = await this.prisma.$queryRaw`
        SELECT COALESCE(SUM(file_size), 0) as total_size
        FROM data_export_jobs 
        WHERE tenant_id = ${tenantContext.tenantId}
        AND status = 'COMPLETED'
      ` as Array<{ total_size: bigint }>;

      return {
        totalExports,
        exportsByType,
        exportsByFormat,
        activeJobs: Number(activeJobs[0].count),
        recentExports,
        totalDataExported: Number(totalDataResult[0].total_size)
      };

    } catch (error) {
      logger.error('Failed to get export statistics', error as Error, {
        tenantId: tenantContext.tenantId
      });
      throw error;
    }
  }

  /**
   * CRITICAL: Validate export request
   */
  private validateExportRequest(request: DataExportRequest): void {
    // CRITICAL: Validate export type
    const validExportTypes = ['USER_DATA', 'TRANSACTIONS', 'INVOICES', 'REPORTS', 'AUDIT_LOGS', 'FULL_EXPORT'];
    if (!validExportTypes.includes(request.exportType)) {
      throw new Error(`Invalid export type: ${request.exportType}`);
    }

    // CRITICAL: Validate format
    const validFormats = ['JSON', 'CSV'];
    if (!validFormats.includes(request.format)) {
      throw new Error(`Invalid format: ${request.format}`);
    }

    // CRITICAL: Validate date range
    if (request.dateRange) {
      if (request.dateRange.startDate >= request.dateRange.endDate) {
        throw new Error('Start date must be before end date');
      }

      const maxDateRange = 365 * 24 * 60 * 60 * 1000; // 1 year
      if (request.dateRange.endDate.getTime() - request.dateRange.startDate.getTime() > maxDateRange) {
        throw new Error('Date range cannot exceed 1 year');
      }
    }

    // CRITICAL: Validate reason
    if (!request.reason || request.reason.trim().length === 0) {
      throw new Error('Export reason is required');
    }

    if (request.reason.length > 500) {
      throw new Error('Export reason is too long (max 500 characters)');
    }
  }

  /**
   * CRITICAL: Check export permissions
   */
  private async checkExportPermissions(
    request: DataExportRequest,
    tenantContext: TenantContext
  ): Promise<void> {
    // CRITICAL: Check basic export permission
    const hasExportPermission = await this.checkPermission(
      tenantContext,
      'data:export'
    );

    if (!hasExportPermission) {
      throw new Error('Insufficient permissions for data export');
    }

    // CRITICAL: Check specific export type permissions
    const permissionMap: Record<DataExportRequest['exportType'], string> = {
      'USER_DATA': 'data:export:user_data',
      'TRANSACTIONS': 'data:export:transactions',
      'INVOICES': 'data:export:invoices',
      'REPORTS': 'data:export:reports',
      'AUDIT_LOGS': 'data:export:audit_logs',
      'FULL_EXPORT': 'data:export:full'
    };

    const specificPermission = permissionMap[request.exportType];
    if (specificPermission) {
      const hasSpecificPermission = await this.checkPermission(tenantContext, specificPermission);
      if (!hasSpecificPermission) {
        throw new Error(`Insufficient permissions for ${request.exportType} export`);
      }
    }

    // CRITICAL: Additional checks for sensitive exports
    if (request.exportType === 'AUDIT_LOGS' || request.exportType === 'FULL_EXPORT') {
      const hasAdminPermission = await this.checkPermission(tenantContext, 'data:export:admin');
      if (!hasAdminPermission) {
        throw new Error('Admin permissions required for sensitive exports');
      }
    }
  }

  /**
   * CRITICAL: Check permission (simplified - would integrate with RBAC system)
   */
  private async checkPermission(tenantContext: TenantContext, permission: string): Promise<boolean> {
    // CRITICAL: In a real implementation, this would integrate with the RBAC system
    // For now, we'll use a simplified check based on user role
    const userRole = tenantContext.userRole;
    
    const permissionMap: Record<string, string[]> = {
      'data:export': ['OWNER', 'ADMIN', 'MANAGER'],
      'data:export:user_data': ['OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE'],
      'data:export:transactions': ['OWNER', 'ADMIN', 'MANAGER'],
      'data:export:invoices': ['OWNER', 'ADMIN', 'MANAGER'],
      'data:export:reports': ['OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE'],
      'data:export:audit_logs': ['OWNER', 'ADMIN'],
      'data:export:full': ['OWNER'],
      'data:export:admin': ['OWNER', 'ADMIN']
    };

    const allowedRoles = permissionMap[permission] || [];
    return allowedRoles.includes(userRole);
  }

  /**
   * CRITICAL: Check rate limiting
   */
  private async checkRateLimit(userId: string, tenantId: string): Promise<void> {
    const now = Date.now();
    const rateLimitKey = `${tenantId}:${userId}`;
    const currentLimit = this.rateLimitMap.get(rateLimitKey);

    if (currentLimit && now < currentLimit.resetTime) {
      if (currentLimit.count >= this.RATE_LIMIT_MAX_REQUESTS) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      currentLimit.count++;
    } else {
      this.rateLimitMap.set(rateLimitKey, {
        count: 1,
        resetTime: now + this.RATE_LIMIT_WINDOW
      });
    }

    // CRITICAL: Clean up expired rate limits
    this.cleanupRateLimits();
  }

  /**
   * CRITICAL: Create export job
   */
  private async createExportJob(
    request: DataExportRequest,
    tenantContext: TenantContext
  ): Promise<DataExportJob> {
    const jobId = this.generateSecureId();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.EXPORT_EXPIRY_HOURS);

    const job: DataExportJob = {
      id: jobId,
      tenantId: request.tenantId,
      userId: request.userId,
      exportType: request.exportType,
      format: request.format,
      status: 'PENDING',
      requestedAt: new Date(),
      expiresAt,
      reason: request.reason,
      correlationId: request.correlationId,
      filters: request.filters,
      metadata: {
        dateRange: request.dateRange,
        requestedByRole: tenantContext.userRole
      },
      errors: []
    };

    // CRITICAL: Store job in database
    await this.prisma.$executeRaw`
      INSERT INTO data_export_jobs (
        id, tenant_id, user_id, export_type, format, status,
        requested_at, expires_at, reason, correlation_id,
        filters, metadata, errors
      ) VALUES (
        ${job.id}, ${job.tenantId}, ${job.userId}, ${job.exportType}, 
        ${job.format}, ${job.status}, ${job.requestedAt}, ${job.expiresAt},
        ${job.reason}, ${job.correlationId}, ${JSON.stringify(job.filters)},
        ${JSON.stringify(job.metadata)}, ${JSON.stringify(job.errors)}
      )
    `;

    this.activeJobs.set(jobId, job);
    return job;
  }

  /**
   * CRITICAL: Process export asynchronously
   */
  private async processExportAsync(jobId: string): Promise<void> {
    const job = this.activeJobs.get(jobId);
    if (!job) return;

    try {
      // CRITICAL: Update job status to running
      await this.updateJobStatus(jobId, 'RUNNING');

      // CRITICAL: Generate export data
      const exportData = await this.generateExportData(job);

      // CRITICAL: Check file size limit
      if (exportData.size > this.MAX_EXPORT_SIZE) {
        throw new Error('Export size exceeds maximum limit');
      }

      // CRITICAL: Store export file
      const fileUrl = await this.storeExportFile(jobId, exportData);

      // CRITICAL: Update job status to completed
      await this.updateJobStatus(jobId, 'COMPLETED', {
        fileUrl,
        fileName: exportData.fileName,
        fileSize: exportData.size,
        recordCount: exportData.recordCount
      });

      // CRITICAL: Log export completion
      this.auditLogger.logDataMutation({
        tenantId: job.tenantId,
        actorId: job.userId,
        action: 'UPDATE',
        resourceType: 'DATA_EXPORT',
        resourceId: jobId,
        outcome: 'SUCCESS',
        correlationId: job.correlationId,
        metadata: {
          exportType: job.exportType,
          format: job.format,
          fileName: exportData.fileName,
          fileSize: exportData.size,
          recordCount: exportData.recordCount,
          fileUrl
        }
      });

      logger.info('Data export completed', {
        jobId,
        tenantId: job.tenantId,
        exportType: job.exportType,
        format: job.format,
        fileSize: exportData.size,
        recordCount: exportData.recordCount
      });

    } catch (error) {
      // CRITICAL: Update job status to failed
      await this.updateJobStatus(jobId, 'FAILED', {
        errors: [(error as Error).message]
      });

      // CRITICAL: Log export failure
      this.auditLogger.logDataMutation({
        tenantId: job.tenantId,
        actorId: job.userId,
        action: 'UPDATE',
        resourceType: 'DATA_EXPORT',
        resourceId: jobId,
        outcome: 'FAILURE',
        correlationId: job.correlationId,
        metadata: {
          exportType: job.exportType,
          format: job.format,
          error: (error as Error).message
        }
      });

      logger.error('Data export failed', error as Error, {
        jobId,
        tenantId: job.tenantId,
        exportType: job.exportType
      });
    }
  }

  /**
   * CRITICAL: Generate export data
   */
  private async generateExportData(job: DataExportJob): Promise<{
    data: Buffer;
    fileName: string;
    size: number;
    recordCount: number;
  }> {
    // CRITICAL: Generate data based on export type
    switch (job.exportType) {
      case 'USER_DATA':
        return await this.generateUserDataExport(job);
      case 'TRANSACTIONS':
        return await this.generateTransactionsExport(job);
      case 'INVOICES':
        return await this.generateInvoicesExport(job);
      case 'REPORTS':
        return await this.generateReportsExport(job);
      case 'AUDIT_LOGS':
        return await this.generateAuditLogsExport(job);
      case 'FULL_EXPORT':
        return await this.generateFullExport(job);
      default:
        throw new Error(`Unsupported export type: ${job.exportType}`);
    }
  }

  /**
   * CRITICAL: Generate user data export
   */
  private async generateUserDataExport(job: DataExportJob): Promise<{
    data: Buffer;
    fileName: string;
    size: number;
    recordCount: number;
  }> {
    try {
      // CRITICAL: Get user data for tenant
      const query = `
        SELECT id, name, email, role, is_active, created_at, updated_at
        FROM users u
        JOIN user_tenants ut ON u.id = ut.user_id
        WHERE ut.tenant_id = $1
        AND ut.is_active = true
        ${job.metadata.dateRange ? 'AND u.created_at BETWEEN $2 AND $3' : ''}
        ORDER BY u.created_at DESC
      `;

      const params = [job.tenantId];
      if (job.metadata.dateRange) {
        params.push(job.metadata.dateRange.startDate, job.metadata.dateRange.endDate);
      }

      const users = await this.prisma.$queryRawUnsafe(query, ...params) as Array<{
        id: string;
        name: string;
        email: string;
        role: string;
        is_active: boolean;
        created_at: Date;
        updated_at: Date;
      }>;

      // CRITICAL: Generate export based on format
      if (job.format === 'JSON') {
        const jsonData = JSON.stringify({
          exportType: 'USER_DATA',
          tenantId: job.tenantId,
          exportedAt: new Date().toISOString(),
          recordCount: users.length,
          data: users
        }, null, 2);

        const buffer = Buffer.from(jsonData, 'utf8');
        const fileName = `user_data_${job.tenantId}_${Date.now()}.json`;

        return {
          data: buffer,
          fileName,
          size: buffer.length,
          recordCount: users.length
        };
      } else {
        // CSV format
        const csvData = this.generateCSV(users, [
          'id', 'name', 'email', 'role', 'is_active', 'created_at', 'updated_at'
        ]);
        const buffer = Buffer.from(csvData, 'utf8');
        const fileName = `user_data_${job.tenantId}_${Date.now()}.csv`;

        return {
          data: buffer,
          fileName,
          size: buffer.length,
          recordCount: users.length
        };
      }

    } catch (error) {
      logger.error('Failed to generate user data export', error as Error, { jobId: job.id });
      throw error;
    }
  }

  /**
   * CRITICAL: Generate transactions export
   */
  private async generateTransactionsExport(job: DataExportJob): Promise<{
    data: Buffer;
    fileName: string;
    size: number;
    recordCount: number;
  }> {
    // CRITICAL: Placeholder implementation
    const mockData = {
      exportType: 'TRANSACTIONS',
      tenantId: job.tenantId,
      exportedAt: new Date().toISOString(),
      recordCount: 0,
      data: []
    };

    const jsonData = JSON.stringify(mockData, null, 2);
    const buffer = Buffer.from(jsonData, 'utf8');
    const fileName = `transactions_${job.tenantId}_${Date.now()}.json`;

    return {
      data: buffer,
      fileName,
      size: buffer.length,
      recordCount: 0
    };
  }

  /**
   * CRITICAL: Generate invoices export
   */
  private async generateInvoicesExport(job: DataExportJob): Promise<{
    data: Buffer;
    fileName: string;
    size: number;
    recordCount: number;
  }> {
    // CRITICAL: Placeholder implementation
    const mockData = {
      exportType: 'INVOICES',
      tenantId: job.tenantId,
      exportedAt: new Date().toISOString(),
      recordCount: 0,
      data: []
    };

    const jsonData = JSON.stringify(mockData, null, 2);
    const buffer = Buffer.from(jsonData, 'utf8');
    const fileName = `invoices_${job.tenantId}_${Date.now()}.json`;

    return {
      data: buffer,
      fileName,
      size: buffer.length,
      recordCount: 0
    };
  }

  /**
   * CRITICAL: Generate reports export
   */
  private async generateReportsExport(job: DataExportJob): Promise<{
    data: Buffer;
    fileName: string;
    size: number;
    recordCount: number;
  }> {
    // CRITICAL: Placeholder implementation
    const mockData = {
      exportType: 'REPORTS',
      tenantId: job.tenantId,
      exportedAt: new Date().toISOString(),
      recordCount: 0,
      data: []
    };

    const jsonData = JSON.stringify(mockData, null, 2);
    const buffer = Buffer.from(jsonData, 'utf8');
    const fileName = `reports_${job.tenantId}_${Date.now()}.json`;

    return {
      data: buffer,
      fileName,
      size: buffer.length,
      recordCount: 0
    };
  }

  /**
   * CRITICAL: Generate audit logs export
   */
  private async generateAuditLogsExport(job: DataExportJob): Promise<{
    data: Buffer;
    fileName: string;
    size: number;
    recordCount: number;
  }> {
    // CRITICAL: Placeholder implementation
    const mockData = {
      exportType: 'AUDIT_LOGS',
      tenantId: job.tenantId,
      exportedAt: new Date().toISOString(),
      recordCount: 0,
      data: []
    };

    const jsonData = JSON.stringify(mockData, null, 2);
    const buffer = Buffer.from(jsonData, 'utf8');
    const fileName = `audit_logs_${job.tenantId}_${Date.now()}.json`;

    return {
      data: buffer,
      fileName,
      size: buffer.length,
      recordCount: 0
    };
  }

  /**
   * CRITICAL: Generate full export
   */
  private async generateFullExport(job: DataExportJob): Promise<{
    data: Buffer;
    fileName: string;
    size: number;
    recordCount: number;
  }> {
    // CRITICAL: Placeholder implementation
    const mockData = {
      exportType: 'FULL_EXPORT',
      tenantId: job.tenantId,
      exportedAt: new Date().toISOString(),
      recordCount: 0,
      data: {}
    };

    const jsonData = JSON.stringify(mockData, null, 2);
    const buffer = Buffer.from(jsonData, 'utf8');
    const fileName = `full_export_${job.tenantId}_${Date.now()}.json`;

    return {
      data: buffer,
      fileName,
      size: buffer.length,
      recordCount: 0
    };
  }

  /**
   * CRITICAL: Generate CSV data
   */
  private generateCSV(data: any[], headers: string[]): string {
    const csvRows = [headers.join(',')];
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return String(value);
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  }

  /**
   * CRITICAL: Store export file
   */
  private async storeExportFile(jobId: string, exportData: {
    data: Buffer;
    fileName: string;
    size: number;
    recordCount: number;
  }): Promise<string> {
    // CRITICAL: In a real implementation, this would store to cloud storage
    // For now, we'll return a mock URL
    const fileUrl = `/exports/${jobId}/${exportData.fileName}`;
    
    // CRITICAL: Store file metadata
    await this.prisma.$executeRaw`
      UPDATE data_export_jobs 
      SET file_url = ${fileUrl}, file_name = ${exportData.fileName}, 
          file_size = ${exportData.size}, record_count = ${exportData.recordCount}
      WHERE id = ${jobId}
    `;

    return fileUrl;
  }

  /**
   * CRITICAL: Update job status
   */
  private async updateJobStatus(
    jobId: string,
    status: DataExportJob['status'],
    updates?: Partial<DataExportJob>
  ): Promise<void> {
    const job = this.activeJobs.get(jobId);
    if (job) {
      job.status = status;
      if (updates) {
        Object.assign(job, updates);
      }
    }

    const setClause = [];
    const params = [];
    let paramIndex = 1;

    setClause.push(`status = $${paramIndex++}`);
    params.push(status);

    if (updates) {
      if (updates.startedAt) {
        setClause.push(`started_at = $${paramIndex++}`);
        params.push(updates.startedAt);
      }
      if (updates.completedAt) {
        setClause.push(`completed_at = $${paramIndex++}`);
        params.push(updates.completedAt);
      }
      if (updates.fileUrl) {
        setClause.push(`file_url = $${paramIndex++}`);
        params.push(updates.fileUrl);
      }
      if (updates.fileName) {
        setClause.push(`file_name = $${paramIndex++}`);
        params.push(updates.fileName);
      }
      if (updates.fileSize) {
        setClause.push(`file_size = $${paramIndex++}`);
        params.push(updates.fileSize);
      }
      if (updates.recordCount) {
        setClause.push(`record_count = $${paramIndex++}`);
        params.push(updates.recordCount);
      }
      if (updates.errors) {
        setClause.push(`errors = $${paramIndex++}`);
        params.push(JSON.stringify(updates.errors));
      }
    }

    setClause.push(`updated_at = NOW()`);
    params.push(jobId);

    await this.prisma.$executeRawUnsafe(`
      UPDATE data_export_jobs 
      SET ${setClause.join(', ')}
      WHERE id = $${paramIndex}
    `, ...params);
  }

  /**
   * CRITICAL: Get export job
   */
  private async getExportJob(jobId: string): Promise<DataExportJob | null> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT id, tenant_id, user_id, export_type, format, status,
               requested_at, started_at, completed_at, expires_at,
               file_url, file_name, file_size, record_count, reason,
               correlation_id, filters, metadata, errors
        FROM data_export_jobs 
        WHERE id = ${jobId}
      ` as DataExportJob[];

      if (result.length === 0) {
        return null;
      }

      const job = result[0];
      
      // CRITICAL: Parse JSON fields
      if (typeof job.filters === 'string') {
        job.filters = JSON.parse(job.filters);
      }
      if (typeof job.metadata === 'string') {
        job.metadata = JSON.parse(job.metadata);
      }
      if (typeof job.errors === 'string') {
        job.errors = JSON.parse(job.errors);
      }

      return job;

    } catch (error) {
      logger.error('Failed to get export job', error as Error, { jobId });
      return null;
    }
  }

  /**
   * CRITICAL: Mark export as expired
   */
  private async markExportExpired(jobId: string): Promise<void> {
    await this.updateJobStatus(jobId, 'EXPIRED');
    
    const job = this.activeJobs.get(jobId);
    if (job) {
      this.auditLogger.logDataMutation({
        tenantId: job.tenantId,
        actorId: 'system',
        action: 'UPDATE',
        resourceType: 'DATA_EXPORT',
        resourceId: jobId,
        outcome: 'SUCCESS',
        correlationId: 'expire_' + jobId,
        metadata: {
          reason: 'Export expired automatically'
        }
      });
    }
  }

  /**
   * CRITICAL: Generate secure download URL
   */
  private generateDownloadUrl(jobId: string): string {
    const token = this.generateSecureToken();
    return `/api/exports/${jobId}/download?token=${token}`;
  }

  /**
   * CRITICAL: Generate secure token
   */
  private generateSecureToken(): string {
    const bytes = randomBytes(32);
    return bytes.toString('hex');
  }

  /**
   * CRITICAL: Generate secure ID
   */
  private generateSecureId(): string {
    const bytes = randomBytes(16);
    return `export_${bytes.toString('hex')}`;
  }

  /**
   * CRITICAL: Cleanup rate limits
   */
  private cleanupRateLimits(): void {
    const now = Date.now();
    for (const [key, limit] of this.rateLimitMap.entries()) {
      if (now >= limit.resetTime) {
        this.rateLimitMap.delete(key);
      }
    }
  }

  /**
   * CRITICAL: Start cleanup timer
   */
  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanupExpiredExports();
      this.cleanupRateLimits();
    }, 60000); // Every minute
  }

  /**
   * CRITICAL: Cleanup expired exports
   */
  private async cleanupExpiredExports(): Promise<void> {
    try {
      const result = await this.prisma.$queryRaw`
        UPDATE data_export_jobs 
        SET status = 'EXPIRED', updated_at = NOW()
        WHERE status = 'COMPLETED' 
        AND expires_at < NOW()
        RETURNING id, tenant_id
      ` as Array<{ id: string; tenant_id: string }>;

      if (result.length > 0) {
        logger.info('Expired exports cleaned up', {
          count: result.length,
          expiredIds: result.map(r => r.id)
        });
      }

    } catch (error) {
      logger.error('Failed to cleanup expired exports', error as Error);
    }
  }
}

/**
 * CRITICAL: Factory function for creating tenant data export manager
 */
export const createTenantDataExportManager = (prisma: PrismaClient): TenantDataExportManager => {
  return new TenantDataExportManager(prisma);
};

/**
 * CRITICAL: Global tenant data export manager instance
 */
let globalTenantDataExportManager: TenantDataExportManager | null = null;

/**
 * CRITICAL: Get or create global tenant data export manager
 */
export const getTenantDataExportManager = (prisma?: PrismaClient): TenantDataExportManager => {
  if (!globalTenantDataExportManager) {
    if (!prisma) {
      throw new Error('Prisma client required for first initialization');
    }
    globalTenantDataExportManager = new TenantDataExportManager(prisma);
  }
  return globalTenantDataExportManager;
};
