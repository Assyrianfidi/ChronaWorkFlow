// CRITICAL: RBAC Auditing & Observability
// MANDATORY: Log all security events with tenant-safe sanitization

import { PrismaClient } from '@prisma/client';
import { TenantContext } from '../tenant/tenant-isolation.js';
import { Permission } from './tenant-permissions.js';
import { TenantUserRole } from '../tenant/tenant-service.js';
import { AuthorizationResult } from './authorization-engine.js';
import { logger } from '../utils/structured-logger.js';

export interface AuditEvent {
  eventType: 'PERMISSION_DENIED' | 'PRIVILEGE_ESCALATION' | 'SUSPICIOUS_ACCESS' | 'ROLE_CHANGE' | 'PERMISSION_GRANTED';
  timestamp: Date;
  tenantId: string;
  userId: string;
  userRole: TenantUserRole;
  permission?: Permission;
  resourceType?: string;
  resourceId?: string;
  operation: string;
  requestId: string;
  ip?: string;
  userAgent?: string;
  details: Record<string, any>;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface AuditMetrics {
  totalEvents: number;
  permissionDenials: number;
  privilegeEscalations: number;
  suspiciousAccess: number;
  roleChanges: number;
  permissionGrants: number;
  highSeverityEvents: number;
  criticalEvents: number;
  eventsByTenant: Map<string, number>;
  eventsByUser: Map<string, number>;
  eventsByPermission: Map<string, number>;
  topViolations: Array<{
    type: string;
    count: number;
    lastOccurrence: Date;
  }>;
}

/**
 * CRITICAL: RBAC Audit Logger
 * 
 * This class handles all RBAC-related auditing and observability.
 * ALL security events MUST be logged through this system.
 */
export class RbacAuditLogger {
  private prisma: PrismaClient;
  private eventBuffer: AuditEvent[] = [];
  private bufferSize = 1000;
  private flushInterval = 60000; // 1 minute
  private flushTimer: NodeJS.Timeout | null = null;
  private metrics: AuditMetrics;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.metrics = this.initializeMetrics();
    this.startFlushTimer();
  }

  /**
   * CRITICAL: Log permission denial
   */
  logPermissionDenial(
    tenantContext: TenantContext,
    permission: Permission,
    reason: string,
    resourceType?: string,
    resourceId?: string,
    operation?: string,
    context?: {
      requestId: string;
      ip?: string;
      userAgent?: string;
      validationChecks?: string[];
    }
  ): void {
    const event: AuditEvent = {
      eventType: 'PERMISSION_DENIED',
      timestamp: new Date(),
      tenantId: tenantContext.tenantId,
      userId: (tenantContext as any).user?.id || '',
      userRole: tenantContext.userRole,
      permission,
      resourceType,
      resourceId,
      operation: operation || 'unknown',
      requestId: context?.requestId || 'unknown',
      ip: context?.ip,
      userAgent: context?.userAgent,
      details: {
        reason,
        validationChecks: context?.validationChecks || [],
        sanitizedReason: this.sanitizeReason(reason)
      },
      severity: this.determineSeverity('PERMISSION_DENIED', reason, permission)
    };

    this.addEvent(event);
  }

  /**
   * CRITICAL: Log privilege escalation
   */
  logPrivilegeEscalation(
    tenantContext: TenantContext,
    fromRole: TenantUserRole,
    toRole: TenantUserRole,
    grantedBy: string,
    operation: string,
    requestId: string,
    context?: {
      ip?: string;
      userAgent?: string;
      justification?: string;
    }
  ): void {
    const event: AuditEvent = {
      eventType: 'PRIVILEGE_ESCALATION',
      timestamp: new Date(),
      tenantId: tenantContext.tenantId,
      userId: (tenantContext as any).user?.id || '',
      userRole: toRole,
      operation,
      requestId,
      ip: context?.ip,
      userAgent: context?.userAgent,
      details: {
        fromRole,
        toRole,
        grantedBy,
        justification: context?.justification,
        escalationLevel: this.getEscalationLevel(fromRole, toRole)
      },
      severity: this.determineSeverity('PRIVILEGE_ESCALATION', '', '')
    };

    this.addEvent(event);
  }

  /**
   * CRITICAL: Log suspicious access attempt
   */
  logSuspiciousAccess(
    tenantContext: TenantContext,
    suspiciousType: string,
    operation: string,
    requestId: string,
    details: Record<string, any>,
    context?: {
      ip?: string;
      userAgent?: string;
      attemptCount?: number;
      timeWindow?: number;
    }
  ): void {
    const event: AuditEvent = {
      eventType: 'SUSPICIOUS_ACCESS',
      timestamp: new Date(),
      tenantId: tenantContext.tenantId,
      userId: (tenantContext as any).user?.id || '',
      userRole: tenantContext.userRole,
      operation,
      requestId,
      ip: context?.ip,
      userAgent: context?.userAgent,
      details: {
        suspiciousType,
        attemptCount: context?.attemptCount || 1,
        timeWindow: context?.timeWindow || 0,
        ...this.sanitizeDetails(details)
      },
      severity: 'HIGH'
    };

    this.addEvent(event);
  }

  /**
   * CRITICAL: Log role change
   */
  logRoleChange(
    tenantContext: TenantContext,
    fromRole: TenantUserRole,
    toRole: TenantUserRole,
    changedBy: string,
    operation: string,
    requestId: string,
    context?: {
      ip?: string;
      userAgent?: string;
      reason?: string;
    }
  ): void {
    const event: AuditEvent = {
      eventType: 'ROLE_CHANGE',
      timestamp: new Date(),
      tenantId: tenantContext.tenantId,
      userId: (tenantContext as any).user?.id || '',
      userRole: toRole,
      operation,
      requestId,
      ip: context?.ip,
      userAgent: context?.userAgent,
      details: {
        fromRole,
        toRole,
        changedBy,
        reason: context?.reason,
        isEscalation: this.isEscalation(fromRole, toRole)
      },
      severity: this.determineSeverity('ROLE_CHANGE', '', '')
    };

    this.addEvent(event);
  }

  /**
   * CRITICAL: Log permission grant
   */
  logPermissionGrant(
    tenantContext: TenantContext,
    permission: Permission,
    resourceType?: string,
    resourceId?: string,
    operation: string,
    requestId: string,
    context?: {
      ip?: string;
      userAgent?: string;
      grantedBy?: string;
    }
  ): void {
    const event: AuditEvent = {
      eventType: 'PERMISSION_GRANTED',
      timestamp: new Date(),
      tenantId: tenantContext.tenantId,
      userId: (tenantContext as any).user?.id || '',
      userRole: tenantContext.userRole,
      permission,
      resourceType,
      resourceId,
      operation,
      requestId,
      ip: context?.ip,
      userAgent: context?.userAgent,
      details: {
        grantedBy: context?.grantedBy
      },
      severity: 'LOW'
    };

    this.addEvent(event);
  }

  /**
   * CRITICAL: Add event to buffer and update metrics
   */
  private addEvent(event: AuditEvent): void {
    // CRITICAL: Sanitize event for tenant safety
    const sanitizedEvent = this.sanitizeEvent(event);
    
    this.eventBuffer.push(sanitizedEvent);
    this.updateMetrics(sanitizedEvent);

    // CRITICAL: Log immediately for high-severity events
    if (sanitizedEvent.severity === 'CRITICAL' || sanitizedEvent.severity === 'HIGH') {
      this.logEventImmediately(sanitizedEvent);
    }

    // CRITICAL: Flush buffer if it's full
    if (this.eventBuffer.length >= this.bufferSize) {
      this.flushEvents();
    }
  }

  /**
   * CRITICAL: Update metrics
   */
  private updateMetrics(event: AuditEvent): void {
    this.metrics.totalEvents++;

    switch (event.eventType) {
      case 'PERMISSION_DENIED':
        this.metrics.permissionDenials++;
        break;
      case 'PRIVILEGE_ESCALATION':
        this.metrics.privilegeEscalations++;
        break;
      case 'SUSPICIOUS_ACCESS':
        this.metrics.suspiciousAccess++;
        break;
      case 'ROLE_CHANGE':
        this.metrics.roleChanges++;
        break;
      case 'PERMISSION_GRANTED':
        this.metrics.permissionGrants++;
        break;
    }

    if (event.severity === 'HIGH') {
      this.metrics.highSeverityEvents++;
    }
    if (event.severity === 'CRITICAL') {
      this.metrics.criticalEvents++;
    }

    // Update counters
    const tenantCount = this.metrics.eventsByTenant.get(event.tenantId) || 0;
    this.metrics.eventsByTenant.set(event.tenantId, tenantCount + 1);

    const userCount = this.metrics.eventsByUser.get(event.userId) || 0;
    this.metrics.eventsByUser.set(event.userId, userCount + 1);

    if (event.permission) {
      const permissionCount = this.metrics.eventsByPermission.get(event.permission) || 0;
      this.metrics.eventsByPermission.set(event.permission, permissionCount + 1);
    }

    // Update top violations
    this.updateTopViolations(event);
  }

  /**
   * CRITICAL: Update top violations
   */
  private updateTopViolations(event: AuditEvent): void {
    const violationKey = `${event.eventType}:${event.details.reason || 'unknown'}`;
    const existing = this.metrics.topViolations.find(v => v.type === violationKey);

    if (existing) {
      existing.count++;
      existing.lastOccurrence = event.timestamp;
    } else {
      this.metrics.topViolations.push({
        type: violationKey,
        count: 1,
        lastOccurrence: event.timestamp
      });
    }

    // Keep only top 10 violations
    this.metrics.topViolations.sort((a, b) => b.count - a.count);
    this.metrics.topViolations = this.metrics.topViolations.slice(0, 10);
  }

  /**
   * CRITICAL: Sanitize event for tenant safety
   */
  private sanitizeEvent(event: AuditEvent): AuditEvent {
    return {
      ...event,
      // CRITICAL: Remove any sensitive tenant information
      details: this.sanitizeDetails(event.details),
      // CRITICAL: Ensure no tenant data leakage
      resourceId: event.resourceId ? this.maskResourceId(event.resourceId) : undefined
    };
  }

  /**
   * CRITICAL: Sanitize details object
   */
  private sanitizeDetails(details: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(details)) {
      // CRITICAL: Remove sensitive patterns
      if (this.isSensitiveField(key, value)) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * CRITICAL: Check if field is sensitive
   */
  private isSensitiveField(key: string, value: any): boolean {
    const sensitivePatterns = [
      /password/i,
      /token/i,
      /secret/i,
      /key/i,
      /credential/i,
      /session/i,
      /auth/i
    ];

    if (sensitivePatterns.some(pattern => pattern.test(key))) {
      return true;
    }

    // CRITICAL: Check for tenant IDs in values
    if (typeof value === 'string' && /^tn_[a-f0-9]{32}$/.test(value)) {
      return true;
    }

    return false;
  }

  /**
   * CRITICAL: Mask resource ID for logging
   */
  private maskResourceId(resourceId: string): string {
    if (resourceId.length <= 8) {
      return '[MASKED]';
    }
    return resourceId.substring(0, 4) + '[MASKED]' + resourceId.substring(resourceId.length - 4);
  }

  /**
   * CRITICAL: Sanitize reason for logging
   */
  private sanitizeReason(reason: string): string {
    const sensitivePatterns = [
      /tenant.*not.*found/i,
      /user.*not.*member/i,
      /cross.*tenant/i,
      /resource.*not.*found/i,
      /ownership.*denied/i
    ];

    if (sensitivePatterns.some(pattern => pattern.test(reason))) {
      return 'ACCESS_DENIED';
    }

    return reason;
  }

  /**
   * CRITICAL: Determine event severity
   */
  private determineSeverity(
    eventType: string,
    reason: string,
    permission?: string
  ): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    // CRITICAL: Critical events
    if (eventType === 'SUSPICIOUS_ACCESS') {
      return 'CRITICAL';
    }

    if (eventType === 'PRIVILEGE_ESCALATION') {
      return 'HIGH';
    }

    // CRITICAL: High severity denials
    const highSeverityReasons = [
      'TENANT_NOT_FOUND',
      'USER_NOT_TENANT_MEMBER',
      'ROLE_MISMATCH',
      'CROSS_TENANT_ACCESS',
      'PROBING_DETECTED'
    ];

    if (highSeverityReasons.includes(reason)) {
      return 'HIGH';
    }

    // CRITICAL: High severity permissions
    const highSeverityPermissions = [
      'system:admin',
      'users:delete',
      'system:tenant:delete',
      'billing:refund',
      'accounting:delete'
    ];

    if (permission && highSeverityPermissions.includes(permission)) {
      return 'HIGH';
    }

    // CRITICAL: Medium severity for other denials
    if (eventType === 'PERMISSION_DENIED') {
      return 'MEDIUM';
    }

    return 'LOW';
  }

  /**
   * CRITICAL: Get escalation level
   */
  private getEscalationLevel(fromRole: TenantUserRole, toRole: TenantUserRole): string {
    const roleHierarchy = {
      [TenantUserRole.VIEWER]: 0,
      [TenantUserRole.EMPLOYEE]: 1,
      [TenantUserRole.MANAGER]: 2,
      [TenantUserRole.ADMIN]: 3,
      [TenantUserRole.OWNER]: 4
    };

    const fromLevel = roleHierarchy[fromRole];
    const toLevel = roleHierarchy[toRole];

    if (toLevel > fromLevel) {
      return `ESCALATION_${toLevel - fromLevel}`;
    }

    return 'NO_ESCALATION';
  }

  /**
   * CRITICAL: Check if role change is escalation
   */
  private isEscalation(fromRole: TenantUserRole, toRole: TenantUserRole): boolean {
    const roleHierarchy = {
      [TenantUserRole.VIEWER]: 0,
      [TenantUserRole.EMPLOYEE]: 1,
      [TenantUserRole.MANAGER]: 2,
      [TenantUserRole.ADMIN]: 3,
      [TenantUserRole.OWNER]: 4
    };

    return roleHierarchy[toRole] > roleHierarchy[fromRole];
  }

  /**
   * CRITICAL: Log event immediately
   */
  private logEventImmediately(event: AuditEvent): void {
    const logLevel = event.severity === 'CRITICAL' ? 'error' : 'warn';
    
    logger[logLevel](`RBAC Audit: ${event.eventType}`, new Error(event.eventType), {
      eventType: event.eventType,
      tenantId: event.tenantId,
      userId: event.userId,
      userRole: event.userRole,
      permission: event.permission,
      resourceType: event.resourceType,
      resourceId: event.resourceId,
      operation: event.operation,
      requestId: event.requestId,
      severity: event.severity,
      ...event.details
    });
  }

  /**
   * CRITICAL: Flush events to database
   */
  private async flushEvents(): Promise<void> {
    if (this.eventBuffer.length === 0) {
      return;
    }

    const eventsToFlush = [...this.eventBuffer];
    this.eventBuffer = [];

    try {
      // CRITICAL: Store events in database (in a real implementation)
      // await this.prisma.rbacAuditEvents.createMany({
      //   data: eventsToFlush.map(event => ({
      //     event_type: event.eventType,
      //     timestamp: event.timestamp,
      //     tenant_id: event.tenantId,
      //     user_id: event.userId,
      //     user_role: event.userRole,
      //     permission: event.permission,
      //     resource_type: event.resourceType,
      //     resource_id: event.resourceId,
      //     operation: event.operation,
      //     request_id: event.requestId,
      //     ip: event.ip,
      //     user_agent: event.userAgent,
      //     details: event.details,
      //     severity: event.severity
      //   }))
      // });

      logger.info('RBAC audit events flushed', {
        eventCount: eventsToFlush.length,
        highSeverityCount: eventsToFlush.filter(e => e.severity === 'HIGH').length,
        criticalCount: eventsToFlush.filter(e => e.severity === 'CRITICAL').length
      });

    } catch (error) {
      logger.error('Failed to flush RBAC audit events', error as Error, {
        eventCount: eventsToFlush.length
      });

      // CRITICAL: Put events back in buffer for retry
      this.eventBuffer.unshift(...eventsToFlush);
    }
  }

  /**
   * CRITICAL: Start flush timer
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flushEvents();
    }, this.flushInterval);
  }

  /**
   * CRITICAL: Initialize metrics
   */
  private initializeMetrics(): AuditMetrics {
    return {
      totalEvents: 0,
      permissionDenials: 0,
      privilegeEscalations: 0,
      suspiciousAccess: 0,
      roleChanges: 0,
      permissionGrants: 0,
      highSeverityEvents: 0,
      criticalEvents: 0,
      eventsByTenant: new Map(),
      eventsByUser: new Map(),
      eventsByPermission: new Map(),
      topViolations: []
    };
  }

  /**
   * CRITICAL: Get current metrics
   */
  getMetrics(): AuditMetrics {
    return { ...this.metrics };
  }

  /**
   * CRITICAL: Get security summary
   */
  getSecuritySummary(): {
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    totalEvents: number;
    criticalEvents: number;
    highSeverityEvents: number;
    suspiciousActivity: boolean;
    topViolations: Array<{
      type: string;
      count: number;
      lastOccurrence: Date;
    }>;
    recommendations: string[];
  } {
    const { criticalEvents, highSeverityEvents, suspiciousAccess, topViolations } = this.metrics;
    
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (criticalEvents > 0) {
      riskLevel = 'CRITICAL';
    } else if (highSeverityEvents > 10 || suspiciousAccess > 5) {
      riskLevel = 'HIGH';
    } else if (highSeverityEvents > 0 || suspiciousAccess > 0) {
      riskLevel = 'MEDIUM';
    }

    const recommendations = this.generateRecommendations();

    return {
      riskLevel,
      totalEvents: this.metrics.totalEvents,
      criticalEvents,
      highSeverityEvents,
      suspiciousActivity: suspiciousAccess > 0,
      topViolations: topViolations.slice(0, 5),
      recommendations
    };
  }

  /**
   * CRITICAL: Generate security recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.metrics.permissionDenials > 100) {
      recommendations.push('High number of permission denials detected - review user permissions');
    }

    if (this.metrics.privilegeEscalations > 10) {
      recommendations.push('Frequent privilege escalations - review role assignment policies');
    }

    if (this.metrics.suspiciousAccess > 0) {
      recommendations.push('Suspicious access attempts detected - investigate potential security threats');
    }

    if (this.metrics.criticalEvents > 0) {
      recommendations.push('Critical security events detected - immediate investigation required');
    }

    return recommendations;
  }

  /**
   * CRITICAL: Cleanup
   */
  async cleanup(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    await this.flushEvents();
  }
}

/**
 * CRITICAL: Factory function for creating RBAC audit logger
 */
export const createRbacAuditLogger = (prisma: PrismaClient): RbacAuditLogger => {
  return new RbacAuditLogger(prisma);
};

/**
 * CRITICAL: Global RBAC audit logger instance
 */
let globalRbacAuditLogger: RbacAuditLogger | null = null;

/**
 * CRITICAL: Get or create global RBAC audit logger
 */
export const getRbacAuditLogger = (prisma?: PrismaClient): RbacAuditLogger => {
  if (!globalRbacAuditLogger) {
    if (!prisma) {
      throw new Error('Prisma client required for first initialization');
    }
    globalRbacAuditLogger = new RbacAuditLogger(prisma);
  }
  return globalRbacAuditLogger;
};
