// CRITICAL: Immutable Audit Log System
// MANDATORY: Tamper-resistant, append-only audit logging for compliance

import { PrismaClient } from '@prisma/client';
import { randomBytes, createHash } from 'crypto';
import { logger } from '../utils/structured-logger.js';

export interface AuditEvent {
  id: string;
  tenantId: string;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  outcome: 'SUCCESS' | 'FAILURE' | 'DENIED' | 'ALLOWED';
  timestamp: Date;
  correlationId: string;
  metadata: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: 'AUTHENTICATION' | 'AUTHORIZATION' | 'DATA_MUTATION' | 'ROLE_PERMISSION_CHANGE' | 'TENANT_LIFECYCLE' | 'CONFIGURATION_CHANGE';
  hash?: string;
  previousHash?: string;
}

export interface AuditEventInput {
  tenantId: string;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  outcome: 'SUCCESS' | 'FAILURE' | 'DENIED' | 'ALLOWED';
  correlationId: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: AuditEvent['category'];
}

export interface AuditQuery {
  tenantId?: string;
  actorId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  outcome?: AuditEvent['outcome'];
  category?: AuditEvent['category'];
  severity?: AuditEvent['severity'];
  startDate?: Date;
  endDate?: Date;
  correlationId?: string;
  limit?: number;
  offset?: number;
}

export interface AuditExport {
  events: AuditEvent[];
  totalCount: number;
  exportId: string;
  exportedAt: Date;
  exportedBy: string;
  query: AuditQuery;
}

/**
 * CRITICAL: Immutable Audit Logger
 * 
 * This class provides tamper-resistant, append-only audit logging
 * that cannot be disabled, bypassed, or filtered by callers.
 * 
 * ALL security events MUST be logged through this system.
 */
export class ImmutableAuditLogger {
  private prisma: PrismaClient;
  private eventBuffer: AuditEvent[] = [];
  private bufferSize = 100;
  private flushInterval = 5000; // 5 seconds
  private flushTimer: NodeJS.Timeout | null = null;
  private lastHash: string | null = null;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.startFlushTimer();
    this.initializeLastHash();
  }

  /**
   * CRITICAL: Log authentication event
   */
  logAuthenticationEvent(input: {
    tenantId: string;
    actorId: string;
    action: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILURE' | 'PASSWORD_CHANGE' | 'MFA_SETUP' | 'MFA_VERIFY';
    outcome: 'SUCCESS' | 'FAILURE';
    correlationId: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }): void {
    this.logEvent({
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: input.action,
      resourceType: 'AUTHENTICATION',
      outcome: input.outcome,
      correlationId: input.correlationId,
      metadata: input.metadata,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      severity: input.action === 'LOGIN_FAILURE' ? 'HIGH' : 'MEDIUM',
      category: 'AUTHENTICATION'
    });
  }

  /**
   * CRITICAL: Log authorization decision
   */
  logAuthorizationDecision(input: {
    tenantId: string;
    actorId: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    outcome: 'SUCCESS' | 'DENIED';
    correlationId: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }): void {
    this.logEvent({
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      outcome: input.outcome,
      correlationId: input.correlationId,
      metadata: input.metadata,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      severity: input.outcome === 'DENIED' ? 'MEDIUM' : 'LOW',
      category: 'AUTHORIZATION'
    });
  }

  /**
   * CRITICAL: Log data mutation
   */
  logDataMutation(input: {
    tenantId: string;
    actorId: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'SOFT_DELETE';
    resourceType: string;
    resourceId: string;
    outcome: 'SUCCESS' | 'FAILURE';
    correlationId: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }): void {
    this.logEvent({
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      outcome: input.outcome,
      correlationId: input.correlationId,
      metadata: input.metadata,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      severity: input.action === 'DELETE' ? 'HIGH' : 'MEDIUM',
      category: 'DATA_MUTATION'
    });
  }

  /**
   * CRITICAL: Log role or permission change
   */
  logRolePermissionChange(input: {
    tenantId: string;
    actorId: string;
    action: 'ROLE_ASSIGN' | 'ROLE_REMOVE' | 'PERMISSION_GRANT' | 'PERMISSION_REVOKE' | 'ROLE_CHANGE';
    resourceType: 'USER_ROLE' | 'ROLE_PERMISSIONS' | 'USER_PERMISSIONS';
    resourceId: string;
    outcome: 'SUCCESS' | 'FAILURE';
    correlationId: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }): void {
    this.logEvent({
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      outcome: input.outcome,
      correlationId: input.correlationId,
      metadata: input.metadata,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      severity: 'HIGH',
      category: 'ROLE_PERMISSION_CHANGE'
    });
  }

  /**
   * CRITICAL: Log tenant lifecycle event
   */
  logTenantLifecycleEvent(input: {
    tenantId: string;
    actorId: string;
    action: 'TENANT_CREATE' | 'TENANT_UPDATE' | 'TENANT_DELETE' | 'TENANT_SUSPEND' | 'TENANT_REACTIVATE';
    resourceType: 'TENANT';
    resourceId?: string;
    outcome: 'SUCCESS' | 'FAILURE';
    correlationId: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }): void {
    this.logEvent({
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId || input.tenantId,
      outcome: input.outcome,
      correlationId: input.correlationId,
      metadata: input.metadata,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      severity: input.action.includes('DELETE') ? 'CRITICAL' : 'HIGH',
      category: 'TENANT_LIFECYCLE'
    });
  }

  /**
   * CRITICAL: Log configuration change
   */
  logConfigurationChange(input: {
    tenantId: string;
    actorId: string;
    action: string;
    resourceType: 'SYSTEM_CONFIG' | 'TENANT_CONFIG' | 'SECURITY_CONFIG' | 'FEATURE_FLAG';
    resourceId?: string;
    outcome: 'SUCCESS' | 'FAILURE';
    correlationId: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }): void {
    this.logEvent({
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      outcome: input.outcome,
      correlationId: input.correlationId,
      metadata: input.metadata,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      severity: 'HIGH',
      category: 'CONFIGURATION_CHANGE'
    });
  }

  logSecurityEvent(input: {
    tenantId: string;
    actorId: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    outcome: AuditEvent['outcome'] | 'WARNING';
    correlationId: string;
    severity?: AuditEvent['severity'];
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }): void {
    const normalizedOutcome: AuditEvent['outcome'] = input.outcome === 'WARNING' ? 'SUCCESS' : input.outcome;
    const category: AuditEvent['category'] = normalizedOutcome === 'DENIED' ? 'AUTHORIZATION' : 'CONFIGURATION_CHANGE';
    const severity: AuditEvent['severity'] =
      input.severity ||
      (input.outcome === 'WARNING' ? 'MEDIUM' : normalizedOutcome === 'FAILURE' ? 'HIGH' : 'MEDIUM');

    this.logEvent({
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      outcome: normalizedOutcome,
      correlationId: input.correlationId,
      metadata: input.outcome === 'WARNING' ? { ...(input.metadata || {}), audit_warning: true } : input.metadata,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      severity,
      category
    });
  }

  /**
   * CRITICAL: Core event logging method
   */
  private logEvent(input: AuditEventInput): void {
    try {
      const event = this.createAuditEvent(input);
      this.eventBuffer.push(event);

      // CRITICAL: Flush immediately for high-severity events
      if (event.severity === 'CRITICAL' || event.severity === 'HIGH') {
        this.flushEvents();
      }

      // CRITICAL: Flush buffer if it's full
      if (this.eventBuffer.length >= this.bufferSize) {
        this.flushEvents();
      }

    } catch (error) {
      // CRITICAL: Logging failures must NEVER block security enforcement
      logger.error('Audit logging failed', error as Error, {
        tenantId: input.tenantId,
        actorId: input.actorId,
        action: input.action,
        resourceType: input.resourceType
      });
    }
  }

  /**
   * CRITICAL: Create audit event with cryptographic integrity
   */
  private createAuditEvent(input: AuditEventInput): AuditEvent {
    const event: AuditEvent = {
      id: this.generateSecureId(),
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      outcome: input.outcome,
      timestamp: new Date(),
      correlationId: input.correlationId,
      metadata: this.sanitizeMetadata(input.metadata || {}),
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      severity: input.severity || 'MEDIUM',
      category: input.category,
      previousHash: this.lastHash || undefined
    };

    // CRITICAL: Generate cryptographic hash for integrity
    event.hash = this.generateEventHash(event);
    this.lastHash = event.hash;

    return event;
  }

  /**
   * CRITICAL: Generate cryptographically secure ID
   */
  private generateSecureId(): string {
    const bytes = randomBytes(16);
    return `audit_${bytes.toString('hex')}`;
  }

  /**
   * CRITICAL: Generate event hash for integrity verification
   */
  private generateEventHash(event: AuditEvent): string {
    const eventString = JSON.stringify({
      id: event.id,
      tenantId: event.tenantId,
      actorId: event.actorId,
      action: event.action,
      resourceType: event.resourceType,
      resourceId: event.resourceId,
      outcome: event.outcome,
      timestamp: event.timestamp.toISOString(),
      correlationId: event.correlationId,
      metadata: event.metadata,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      severity: event.severity,
      category: event.category,
      previousHash: event.previousHash
    });

    return createHash('sha256').update(eventString).digest('hex');
  }

  /**
   * CRITICAL: Sanitize metadata to prevent sensitive data leakage
   */
  private sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    const sensitivePatterns = [
      /password/i,
      /token/i,
      /secret/i,
      /key/i,
      /credential/i,
      /session/i,
      /auth/i,
      /ssn/i,
      /credit.*card/i,
      /bank.*account/i
    ];

    for (const [key, value] of Object.entries(metadata)) {
      if (sensitivePatterns.some(pattern => pattern.test(key))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'string' && value.length > 1000) {
        // Truncate long strings
        sanitized[key] = value.substring(0, 1000) + '...[TRUNCATED]';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
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
      // CRITICAL: Use raw SQL to ensure append-only behavior
      const insertQuery = `
        INSERT INTO audit_logs (
          id, tenant_id, actor_id, action, resource_type, resource_id,
          outcome, timestamp, correlation_id, metadata, ip_address,
          user_agent, severity, category, hash, previous_hash
        ) VALUES 
        ${eventsToFlush.map((_, index) => 
          `($${index * 15 + 1}, $${index * 15 + 2}, $${index * 15 + 3}, $${index * 15 + 4}, $${index * 15 + 5}, $${index * 15 + 6}, $${index * 15 + 7}, $${index * 15 + 8}, $${index * 15 + 9}, $${index * 15 + 10}, $${index * 15 + 11}, $${index * 15 + 12}, $${index * 15 + 13}, $${index * 15 + 14}, $${index * 15 + 15})`
        ).join(', ')}
      `;

      const values = eventsToFlush.flatMap(event => [
        event.id,
        event.tenantId,
        event.actorId,
        event.action,
        event.resourceType,
        event.resourceId,
        event.outcome,
        event.timestamp,
        event.correlationId,
        JSON.stringify(event.metadata),
        event.ipAddress,
        event.userAgent,
        event.severity,
        event.category,
        event.hash,
        event.previousHash
      ]);

      await this.prisma.$executeRawUnsafe(insertQuery, ...values);

      logger.info('Audit events flushed to database', {
        eventCount: eventsToFlush.length,
        highSeverityCount: eventsToFlush.filter(e => e.severity === 'HIGH').length,
        criticalCount: eventsToFlush.filter(e => e.severity === 'CRITICAL').length
      });

    } catch (error) {
      logger.error('Failed to flush audit events', error as Error, {
        eventCount: eventsToFlush.length
      });

      // CRITICAL: Put events back in buffer for retry
      this.eventBuffer.unshift(...eventsToFlush);
    }
  }

  /**
   * CRITICAL: Query audit events (read-only)
   */
  async queryEvents(query: AuditQuery): Promise<{
    events: AuditEvent[];
    totalCount: number;
  }> {
    try {
      // CRITICAL: Build secure query with parameterized statements
      let whereClause = 'WHERE 1=1';
      const params: any[] = [];
      let paramIndex = 1;

      if (query.tenantId) {
        whereClause += ` AND tenant_id = $${paramIndex++}`;
        params.push(query.tenantId);
      }

      if (query.actorId) {
        whereClause += ` AND actor_id = $${paramIndex++}`;
        params.push(query.actorId);
      }

      if (query.action) {
        whereClause += ` AND action = $${paramIndex++}`;
        params.push(query.action);
      }

      if (query.resourceType) {
        whereClause += ` AND resource_type = $${paramIndex++}`;
        params.push(query.resourceType);
      }

      if (query.resourceId) {
        whereClause += ` AND resource_id = $${paramIndex++}`;
        params.push(query.resourceId);
      }

      if (query.outcome) {
        whereClause += ` AND outcome = $${paramIndex++}`;
        params.push(query.outcome);
      }

      if (query.category) {
        whereClause += ` AND category = $${paramIndex++}`;
        params.push(query.category);
      }

      if (query.severity) {
        whereClause += ` AND severity = $${paramIndex++}`;
        params.push(query.severity);
      }

      if (query.startDate) {
        whereClause += ` AND timestamp >= $${paramIndex++}`;
        params.push(query.startDate);
      }

      if (query.endDate) {
        whereClause += ` AND timestamp <= $${paramIndex++}`;
        params.push(query.endDate);
      }

      if (query.correlationId) {
        whereClause += ` AND correlation_id = $${paramIndex++}`;
        params.push(query.correlationId);
      }

      // CRITICAL: Get total count
      const countQuery = `SELECT COUNT(*) as total FROM audit_logs ${whereClause}`;
      const countResult = await this.prisma.$queryRawUnsafe(countQuery, ...params) as Array<{ total: bigint }>;
      const totalCount = Number(countResult[0].total);

      // CRITICAL: Get events with pagination
      let limitClause = '';
      if (query.limit) {
        limitClause += ` LIMIT $${paramIndex++}`;
        params.push(query.limit);
      }

      if (query.offset) {
        limitClause += ` OFFSET $${paramIndex++}`;
        params.push(query.offset);
      }

      const eventsQuery = `
        SELECT id, tenant_id, actor_id, action, resource_type, resource_id,
               outcome, timestamp, correlation_id, metadata, ip_address,
               user_agent, severity, category, hash, previous_hash
        FROM audit_logs 
        ${whereClause}
        ORDER BY timestamp DESC
        ${limitClause}
      `;

      const events = await this.prisma.$queryRawUnsafe(eventsQuery, ...params) as AuditEvent[];

      // CRITICAL: Parse JSON metadata
      events.forEach(event => {
        if (typeof event.metadata === 'string') {
          event.metadata = JSON.parse(event.metadata);
        }
      });

      return { events, totalCount };

    } catch (error) {
      logger.error('Failed to query audit events', error as Error, { query });
      throw error;
    }
  }

  /**
   * CRITICAL: Export audit events for compliance
   */
  async exportEvents(query: AuditQuery, exportedBy: string): Promise<AuditExport> {
    const { events, totalCount } = await this.queryEvents({
      ...query,
      limit: 10000 // Max export limit
    });

    return {
      events,
      totalCount,
      exportId: this.generateSecureId(),
      exportedAt: new Date(),
      exportedBy,
      query
    };
  }

  /**
   * CRITICAL: Verify audit log integrity
   */
  async verifyIntegrity(): Promise<{
    isValid: boolean;
    totalEvents: number;
    tamperedEvents: AuditEvent[];
    gaps: Array<{ index: number; expectedHash: string; actualHash: string | undefined }>;
  }> {
    try {
      const { events } = await this.queryEvents({
        limit: 1000 // Check last 1000 events for performance
      });

      const tamperedEvents: AuditEvent[] = [];
      const gaps: Array<{ index: number; expectedHash: string; actualHash: string | undefined }> = [];

      for (let i = 0; i < events.length; i++) {
        const event = events[i];
        const expectedHash = this.generateEventHash(event);

        if (event.hash !== expectedHash) {
          tamperedEvents.push(event);
        }

        // Check hash chain integrity
        if (i > 0 && (event.previousHash || undefined) !== events[i - 1].hash) {
          gaps.push({
            index: i,
            expectedHash: events[i - 1].hash || 'missing',
            actualHash: event.previousHash || 'missing'
          });
        }
      }

      return {
        isValid: tamperedEvents.length === 0 && gaps.length === 0,
        totalEvents: events.length,
        tamperedEvents,
        gaps
      };

    } catch (error) {
      logger.error('Failed to verify audit log integrity', error as Error);
      return {
        isValid: false,
        totalEvents: 0,
        tamperedEvents: [],
        gaps: []
      };
    }
  }

  /**
   * CRITICAL: Get audit statistics
   */
  async getStatistics(tenantId?: string): Promise<{
    totalEvents: number;
    eventsByCategory: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    eventsByOutcome: Record<string, number>;
    recentActivity: AuditEvent[];
  }> {
    const whereClause = tenantId ? `WHERE tenant_id = $1` : '';
    const params = tenantId ? [tenantId] : [];

    try {
      // CRITICAL: Get total events
      const totalQuery = `SELECT COUNT(*) as total FROM audit_logs ${whereClause}`;
      const totalResult = await this.prisma.$queryRawUnsafe(totalQuery, ...params) as Array<{ total: bigint }>;
      const totalEvents = Number(totalResult[0].total);

      // CRITICAL: Get events by category
      const categoryQuery = `
        SELECT category, COUNT(*) as count 
        FROM audit_logs ${whereClause}
        GROUP BY category
      `;
      const categoryResults = await this.prisma.$queryRawUnsafe(categoryQuery, ...params) as Array<{ category: string; count: bigint }>;
      const eventsByCategory = categoryResults.reduce((acc, row) => {
        acc[row.category] = Number(row.count);
        return acc;
      }, {} as Record<string, number>);

      // CRITICAL: Get events by severity
      const severityQuery = `
        SELECT severity, COUNT(*) as count 
        FROM audit_logs ${whereClause}
        GROUP BY severity
      `;
      const severityResults = await this.prisma.$queryRawUnsafe(severityQuery, ...params) as Array<{ severity: string; count: bigint }>;
      const eventsBySeverity = severityResults.reduce((acc, row) => {
        acc[row.severity] = Number(row.count);
        return acc;
      }, {} as Record<string, number>);

      // CRITICAL: Get events by outcome
      const outcomeQuery = `
        SELECT outcome, COUNT(*) as count 
        FROM audit_logs ${whereClause}
        GROUP BY outcome
      `;
      const outcomeResults = await this.prisma.$queryRawUnsafe(outcomeQuery, ...params) as Array<{ outcome: string; count: bigint }>;
      const eventsByOutcome = outcomeResults.reduce((acc, row) => {
        acc[row.outcome] = Number(row.count);
        return acc;
      }, {} as Record<string, number>);

      // CRITICAL: Get recent activity
      const recentQuery = `
        SELECT id, tenant_id, actor_id, action, resource_type, resource_id,
               outcome, timestamp, correlation_id, metadata, ip_address,
               user_agent, severity, category, hash, previous_hash
        FROM audit_logs ${whereClause}
        ORDER BY timestamp DESC
        LIMIT 10
      `;
      const recentEvents = await this.prisma.$queryRawUnsafe(recentQuery, ...params) as AuditEvent[];

      recentEvents.forEach(event => {
        if (typeof event.metadata === 'string') {
          event.metadata = JSON.parse(event.metadata);
        }
      });

      return {
        totalEvents,
        eventsByCategory,
        eventsBySeverity,
        eventsByOutcome,
        recentActivity: recentEvents
      };

    } catch (error) {
      logger.error('Failed to get audit statistics', error as Error, { tenantId });
      throw error;
    }
  }

  /**
   * CRITICAL: Initialize last hash from database
   */
  private async initializeLastHash(): Promise<void> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT hash FROM audit_logs 
        ORDER BY timestamp DESC 
        LIMIT 1
      ` as Array<{ hash: string }>;

      if (result.length > 0) {
        this.lastHash = result[0].hash || null;
      }

    } catch (error) {
      logger.error('Failed to initialize last hash', error as Error);
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
 * CRITICAL: Factory function for creating immutable audit logger
 */
export const createImmutableAuditLogger = (prisma: PrismaClient): ImmutableAuditLogger => {
  return new ImmutableAuditLogger(prisma);
};

/**
 * CRITICAL: Global immutable audit logger instance
 */
let globalImmutableAuditLogger: ImmutableAuditLogger | null = null;

/**
 * CRITICAL: Get or create global immutable audit logger
 */
export const getImmutableAuditLogger = (prisma?: PrismaClient): ImmutableAuditLogger => {
  if (!globalImmutableAuditLogger) {
    if (!prisma) {
      throw new Error('Prisma client required for first initialization');
    }
    globalImmutableAuditLogger = new ImmutableAuditLogger(prisma);
  }
  return globalImmutableAuditLogger;
};
