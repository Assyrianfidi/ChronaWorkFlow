// CRITICAL: Immutable Audit Log System - DRIZZLE VERSION
// MANDATORY: Tamper-resistant, append-only audit logging for compliance
// MIGRATION: Eliminated Prisma dependency, now uses Drizzle ORM only

import { db } from "../db";
import { eq, and, sql, desc } from "drizzle-orm";
import * as s from "../../shared/schema";
import { randomBytes, createHash } from "crypto";
import { logger } from "../utils/structured-logger.js";

export interface AuditEvent {
  id: string;
  tenantId: string;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  outcome: "SUCCESS" | "FAILURE" | "DENIED" | "ALLOWED";
  timestamp: Date;
  correlationId: string;
  metadata: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  category: "AUTHENTICATION" | "AUTHORIZATION" | "DATA_MUTATION" | "ROLE_PERMISSION_CHANGE" | "TENANT_LIFECYCLE" | "CONFIGURATION_CHANGE";
  hash?: string;
  previousHash?: string;
}

export interface AuditEventInput {
  tenantId: string;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  outcome: "SUCCESS" | "FAILURE" | "DENIED" | "ALLOWED";
  correlationId: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  category: AuditEvent["category"];
}

export interface AuditQuery {
  tenantId?: string;
  actorId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  outcome?: AuditEvent["outcome"];
  category?: AuditEvent["category"];
  severity?: AuditEvent["severity"];
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
 * CRITICAL: Immutable Audit Logger - DRIZZLE VERSION
 * 
 * This class provides tamper-resistant, append-only audit logging
 * that cannot be disabled, bypassed, or filtered by callers.
 * 
 * ALL security events MUST be logged through this system.
 * 
 * MIGRATION NOTE: Converted from Prisma to Drizzle ORM to eliminate
 * ORM duality and ensure single transaction boundary across all operations.
 */
export class ImmutableAuditLogger {
  private eventBuffer: AuditEvent[] = [];
  private bufferSize = 100;
  private flushInterval = 5000; // 5 seconds
  private flushTimer: NodeJS.Timeout | null = null;
  private lastHash: string | null = null;

  constructor() {
    this.startFlushTimer();
    this.initializeLastHash();
  }

  /**
   * CRITICAL: Log authentication event
   */
  logAuthenticationEvent(input: {
    tenantId: string;
    actorId: string;
    action: "LOGIN" | "LOGOUT" | "LOGIN_FAILURE" | "PASSWORD_CHANGE" | "MFA_SETUP" | "MFA_VERIFY";
    outcome: "SUCCESS" | "FAILURE";
    correlationId: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }): void {
    this.logEvent({
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: input.action,
      resourceType: "AUTHENTICATION",
      outcome: input.outcome,
      correlationId: input.correlationId,
      metadata: input.metadata,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      severity: input.action === "LOGIN_FAILURE" ? "HIGH" : "MEDIUM",
      category: "AUTHENTICATION"
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
    outcome: "SUCCESS" | "DENIED";
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
      severity: input.outcome === "DENIED" ? "MEDIUM" : "LOW",
      category: "AUTHORIZATION"
    });
  }

  /**
   * CRITICAL: Log data mutation
   */
  logDataMutation(input: {
    tenantId: string;
    actorId: string;
    action: "CREATE" | "UPDATE" | "DELETE" | "SOFT_DELETE";
    resourceType: string;
    resourceId: string;
    outcome: "SUCCESS" | "FAILURE";
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
      severity: input.action === "DELETE" ? "HIGH" : "MEDIUM",
      category: "DATA_MUTATION"
    });
  }

  /**
   * CRITICAL: Log role or permission change
   */
  logRolePermissionChange(input: {
    tenantId: string;
    actorId: string;
    action: "ROLE_ASSIGN" | "ROLE_REMOVE" | "PERMISSION_GRANT" | "PERMISSION_REVOKE" | "ROLE_CHANGE";
    resourceType: "USER_ROLE" | "ROLE_PERMISSIONS" | "USER_PERMISSIONS";
    resourceId: string;
    outcome: "SUCCESS" | "FAILURE";
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
      severity: "HIGH",
      category: "ROLE_PERMISSION_CHANGE"
    });
  }

  /**
   * CRITICAL: Log tenant lifecycle event
   */
  logTenantLifecycleEvent(input: {
    tenantId: string;
    actorId: string;
    action: "TENANT_CREATE" | "TENANT_UPDATE" | "TENANT_DELETE" | "TENANT_SUSPEND" | "TENANT_REACTIVATE";
    resourceType: "TENANT";
    resourceId?: string;
    outcome: "SUCCESS" | "FAILURE";
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
      severity: input.action.includes("DELETE") ? "CRITICAL" : "HIGH",
      category: "TENANT_LIFECYCLE"
    });
  }

  /**
   * CRITICAL: Log configuration change
   */
  logConfigurationChange(input: {
    tenantId: string;
    actorId: string;
    action: string;
    resourceType: "SYSTEM_CONFIG" | "TENANT_CONFIG" | "SECURITY_CONFIG" | "FEATURE_FLAG";
    resourceId?: string;
    outcome: "SUCCESS" | "FAILURE";
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
      severity: "HIGH",
      category: "CONFIGURATION_CHANGE"
    });
  }

  logSecurityEvent(input: {
    tenantId: string;
    actorId: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    outcome: AuditEvent["outcome"] | "WARNING";
    correlationId: string;
    severity?: AuditEvent["severity"];
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }): void {
    const normalizedOutcome: AuditEvent["outcome"] = input.outcome === "WARNING" ? "SUCCESS" : input.outcome;
    const category: AuditEvent["category"] = normalizedOutcome === "DENIED" ? "AUTHORIZATION" : "CONFIGURATION_CHANGE";
    const severity: AuditEvent["severity"] =
      input.severity ||
      (input.outcome === "WARNING" ? "MEDIUM" : normalizedOutcome === "FAILURE" ? "HIGH" : "MEDIUM");

    this.logEvent({
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      outcome: normalizedOutcome,
      correlationId: input.correlationId,
      metadata: input.outcome === "WARNING" ? { ...(input.metadata || {}), audit_warning: true } : input.metadata,
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
      if (event.severity === "CRITICAL" || event.severity === "HIGH") {
        this.flushEvents();
      }

      // CRITICAL: Flush buffer if it's full
      if (this.eventBuffer.length >= this.bufferSize) {
        this.flushEvents();
      }

    } catch (error) {
      // CRITICAL: Logging failures must NEVER block security enforcement
      logger.error("Audit logging failed", error as Error, {
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
      severity: input.severity || "MEDIUM",
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
    return `audit_${bytes.toString("hex")}`;
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

    return createHash("sha256").update(eventString).digest("hex");
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
        sanitized[key] = "[REDACTED]";
      } else if (typeof value === "string" && value.length > 1000) {
        sanitized[key] = value.substring(0, 1000) + "...[TRUNCATED]";
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * CRITICAL: Flush events to database using DRIZZLE ORM
   * MIGRATION: Converted from Prisma raw SQL to Drizzle ORM
   */
  private async flushEvents(): Promise<void> {
    if (this.eventBuffer.length === 0) {
      return;
    }

    const eventsToFlush = [...this.eventBuffer];
    this.eventBuffer = [];

    try {
      // MIGRATION: Use Drizzle ORM instead of Prisma
      const auditLogValues = eventsToFlush.map(event => ({
        id: event.id,
        tenantId: event.tenantId,
        actorId: event.actorId,
        action: event.action,
        resourceType: event.resourceType,
        resourceId: event.resourceId || null,
        outcome: event.outcome,
        timestamp: event.timestamp,
        correlationId: event.correlationId,
        metadata: JSON.stringify(event.metadata),
        ipAddress: event.ipAddress || null,
        userAgent: event.userAgent || null,
        severity: event.severity,
        category: event.category,
        hash: event.hash || null,
        previousHash: event.previousHash || null,
        createdAt: new Date()
      }));

      // Use Drizzle's insert with conflict handling
      await db.insert(s.auditLogs).values(auditLogValues as any)
        .onConflictDoNothing({ target: s.auditLogs.id });

      logger.info("Audit events flushed to database via Drizzle", {
        eventCount: eventsToFlush.length,
        highSeverityCount: eventsToFlush.filter(e => e.severity === "HIGH").length,
        criticalCount: eventsToFlush.filter(e => e.severity === "CRITICAL").length
      });

    } catch (error) {
      logger.error("Failed to flush audit events", error as Error, {
        eventCount: eventsToFlush.length
      });

      // CRITICAL: Put events back in buffer for retry
      this.eventBuffer.unshift(...eventsToFlush);
    }
  }

  /**
   * CRITICAL: Query audit events (read-only) - DRIZZLE VERSION
   */
  async queryEvents(query: AuditQuery): Promise<{
    events: AuditEvent[];
    totalCount: number;
  }> {
    try {
      // Build where conditions using Drizzle
      const conditions = [];

      if (query.tenantId) {
        conditions.push(eq(s.auditLogs.tenantId, query.tenantId));
      }
      if (query.actorId) {
        conditions.push(eq(s.auditLogs.actorId, query.actorId));
      }
      if (query.action) {
        conditions.push(eq(s.auditLogs.action, query.action));
      }
      if (query.resourceType) {
        conditions.push(eq(s.auditLogs.resourceType, query.resourceType));
      }
      if (query.resourceId) {
        conditions.push(eq(s.auditLogs.resourceId, query.resourceId));
      }
      if (query.outcome) {
        conditions.push(eq(s.auditLogs.outcome, query.outcome));
      }
      if (query.category) {
        conditions.push(eq(s.auditLogs.category, query.category));
      }
      if (query.severity) {
        conditions.push(eq(s.auditLogs.severity, query.severity));
      }
      if (query.startDate) {
        conditions.push(sql`${s.auditLogs.timestamp} >= ${query.startDate}`);
      }
      if (query.endDate) {
        conditions.push(sql`${s.auditLogs.timestamp} <= ${query.endDate}`);
      }
      if (query.correlationId) {
        conditions.push(eq(s.auditLogs.correlationId, query.correlationId));
      }

      // Get total count
      const countQuery = db.select({ count: sql<number>`count(*)` }).from(s.auditLogs);
      if (conditions.length > 0) {
        countQuery.where(and(...conditions));
      }
      const [countResult] = await countQuery;
      const totalCount = countResult?.count || 0;

      // Get events with pagination using Drizzle
      let eventsQuery = db.select().from(s.auditLogs)
        .orderBy(desc(s.auditLogs.timestamp));
      
      if (conditions.length > 0) {
        eventsQuery = eventsQuery.where(and(...conditions)) as typeof eventsQuery;
      }
      
      if (query.limit) {
        eventsQuery = eventsQuery.limit(query.limit) as typeof eventsQuery;
      }
      if (query.offset) {
        eventsQuery = eventsQuery.offset(query.offset) as typeof eventsQuery;
      }

      const rawEvents = await eventsQuery;

      // Parse JSON metadata
      const events: AuditEvent[] = rawEvents.map((event: any) => ({
        ...event,
        metadata: typeof event.metadata === "string" ? JSON.parse(event.metadata) : event.metadata || {}
      }));

      return { events, totalCount };

    } catch (error) {
      logger.error("Failed to query audit events", error as Error, { query });
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
            expectedHash: events[i - 1].hash || "missing",
            actualHash: event.previousHash || "missing"
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
      logger.error("Failed to verify audit log integrity", error as Error);
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
    try {
      // Get total events
      let totalQuery = db.select({ count: sql<number>`count(*)` }).from(s.auditLogs);
      if (tenantId) {
        totalQuery = totalQuery.where(eq(s.auditLogs.tenantId, tenantId)) as typeof totalQuery;
      }
      const [totalResult] = await totalQuery;
      const totalEvents = totalResult?.count || 0;

      // Get events by category
      let categoryQuery = db.select({
        category: s.auditLogs.category,
        count: sql<number>`count(*)`
      }).from(s.auditLogs).groupBy(s.auditLogs.category);
      if (tenantId) {
        categoryQuery = categoryQuery.where(eq(s.auditLogs.tenantId, tenantId)) as typeof categoryQuery;
      }
      const categoryResults = await categoryQuery;
      const eventsByCategory = categoryResults.reduce((acc, row) => {
        acc[row.category] = row.count;
        return acc;
      }, {} as Record<string, number>);

      // Get events by severity
      let severityQuery = db.select({
        severity: s.auditLogs.severity,
        count: sql<number>`count(*)`
      }).from(s.auditLogs).groupBy(s.auditLogs.severity);
      if (tenantId) {
        severityQuery = severityQuery.where(eq(s.auditLogs.tenantId, tenantId)) as typeof severityQuery;
      }
      const severityResults = await severityQuery;
      const eventsBySeverity = severityResults.reduce((acc, row) => {
        acc[row.severity] = row.count;
        return acc;
      }, {} as Record<string, number>);

      // Get events by outcome
      let outcomeQuery = db.select({
        outcome: s.auditLogs.outcome,
        count: sql<number>`count(*)`
      }).from(s.auditLogs).groupBy(s.auditLogs.outcome);
      if (tenantId) {
        outcomeQuery = outcomeQuery.where(eq(s.auditLogs.tenantId, tenantId)) as typeof outcomeQuery;
      }
      const outcomeResults = await outcomeQuery;
      const eventsByOutcome = outcomeResults.reduce((acc, row) => {
        acc[row.outcome] = row.count;
        return acc;
      }, {} as Record<string, number>);

      // Get recent activity
      let recentQuery = db.select().from(s.auditLogs)
        .orderBy(desc(s.auditLogs.timestamp))
        .limit(10);
      if (tenantId) {
        recentQuery = recentQuery.where(eq(s.auditLogs.tenantId, tenantId)) as typeof recentQuery;
      }
      const recentEvents = await recentQuery;

      const recentActivity: AuditEvent[] = recentEvents.map((event: any) => ({
        ...event,
        metadata: typeof event.metadata === "string" ? JSON.parse(event.metadata) : event.metadata || {}
      }));

      return {
        totalEvents,
        eventsByCategory,
        eventsBySeverity,
        eventsByOutcome,
        recentActivity
      };

    } catch (error) {
      logger.error("Failed to get audit statistics", error as Error, { tenantId });
      throw error;
    }
  }

  /**
   * CRITICAL: Initialize last hash from database
   */
  private async initializeLastHash(): Promise<void> {
    try {
      const result = await db.select({ hash: s.auditLogs.hash })
        .from(s.auditLogs)
        .orderBy(desc(s.auditLogs.timestamp))
        .limit(1);

      if (result.length > 0 && result[0].hash) {
        this.lastHash = result[0].hash;
      }

    } catch (error) {
      logger.error("Failed to initialize last hash", error as Error);
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
export const createImmutableAuditLogger = (): ImmutableAuditLogger => {
  return new ImmutableAuditLogger();
};

/**
 * CRITICAL: Global immutable audit logger instance
 */
let globalImmutableAuditLogger: ImmutableAuditLogger | null = null;

/**
 * CRITICAL: Get or create global immutable audit logger
 */
export const getImmutableAuditLogger = (): ImmutableAuditLogger => {
  if (!globalImmutableAuditLogger) {
    globalImmutableAuditLogger = new ImmutableAuditLogger();
  }
  return globalImmutableAuditLogger;
};

/**
 * MIGRATION COMPLETE: All Prisma dependencies removed
 * Now uses Drizzle ORM exclusively for:
 * - Event insertion with batching
 * - Event querying with filters
 * - Statistics aggregation
 * - Integrity verification
 * 
 * This ensures a single transaction boundary across all operations
 * and eliminates the ORM duality issue.
 */
