// @ts-ignore
import { prisma } from "../utils/prisma";

// Create a singleton instance for production
let prismaInstance = null;

function getPrismaInstance() {
  if (!prismaInstance) {
    prismaInstance = prisma;
  }
  return prismaInstance;
}

/**
 * Audit Logger Service
 * Logs all critical actions for security and compliance
 */

class AuditLoggerService {
  private static _auditLogs: any[] = [];
  private static _securityAlerts: any[] = [];
  /**
   * Set the Prisma client instance (for testing)
   * @param {PrismaClient} prisma - The Prisma client instance
   */
  static setPrismaInstance(prisma) {
    prismaInstance = prisma;
  }

  /**
   * Log an authentication event
   * @param {Object} event - The authentication event details
   */
  static async logAuthEvent(event) {
    const logEntry = {
      timestamp: new Date(),
      eventType: "AUTH",
      action: event.action, // LOGIN, LOGOUT, LOGIN_FAILED, REGISTER, PASSWORD_CHANGE
      userId: event.userId || null,
      email: event.email || null,
      ip: event.ip,
      userAgent: event.userAgent,
      success: event.success || false,
      details: event.details || {},
      severity: event.severity || "INFO", // INFO, WARNING, ERROR, CRITICAL
    };

    try {
      // Log to console (will be enhanced with database storage)
      console.log("[AUDIT] Auth Event:", JSON.stringify(logEntry, null, 2));

      // Store in database (will be implemented in Phase 6.4)
      // await this.storeLogEntry(logEntry);

      // Store in memory for now
      if (!this._auditLogs) {
        this._auditLogs = [];
      }
      this._auditLogs.push(logEntry);

      // Keep only last 10000 entries in memory
      if (this._auditLogs.length > 10000) {
        this._auditLogs = this._auditLogs.slice(-10000);
      }

      // Trigger alerts for critical events
      if (
        logEntry.severity === "CRITICAL" ||
        (logEntry.action === "LOGIN_FAILED" && event.details?.bruteForce)
      ) {
        await this.triggerSecurityAlert(logEntry);
      }
    } catch (error) {
      console.error("Failed to log auth event:", error);
    }
  }

  /**
   * Log a data access/modification event
   * @param {Object} event - The data event details
   */
  static async logDataEvent(event) {
    const logEntry: any = {
      timestamp: new Date(),
      eventType: "DATA",
      action: event.action, // CREATE, READ, UPDATE, DELETE, EXPORT
      resourceType: event.resourceType, // ACCOUNT, TRANSACTION, USER, INVENTORY
      resourceId: event.resourceId || null,
      userId: event.userId,
      companyId: event.companyId || null,
      ip: event.ip,
      userAgent: event.userAgent,
      success: event.success !== false,
      details: event.details || {},
      severity: event.severity || "INFO",
    };

    // Add sensitive data flag for important resources
    if (["ACCOUNT", "TRANSACTION", "USER"].includes(event.resourceType)) {
      logEntry.isSensitive = true;
    }

    try {
      console.log("[AUDIT] Data Event:", JSON.stringify(logEntry, null, 2));

      if (!this._auditLogs) {
        this._auditLogs = [];
      }
      this._auditLogs.push(logEntry);

      if (this._auditLogs.length > 10000) {
        this._auditLogs = this._auditLogs.slice(-10000);
      }

      // Trigger alerts for unauthorized access attempts
      if (logEntry.action === "DELETE" && logEntry.isSensitive) {
        await this.triggerSecurityAlert({
          ...logEntry,
          alertType: "SENSITIVE_DATA_DELETION",
          message: `Sensitive data deletion attempted: ${logEntry.resourceType}:${logEntry.resourceId}`,
        });
      }
    } catch (error) {
      console.error("Failed to log data event:", error);
    }
  }

  /**
   * Log a security event
   * @param {Object} event - The security event details
   */
  static async logSecurityEvent(event) {
    const logEntry = {
      timestamp: new Date(),
      eventType: "SECURITY",
      action: event.action, // UNAUTHORIZED_ACCESS, RATE_LIMIT_EXCEEDED, SUSPICIOUS_ACTIVITY
      userId: event.userId || null,
      ip: event.ip,
      userAgent: event.userAgent,
      resource: event.resource || null,
      details: event.details || {},
      severity: event.severity || "WARNING",
    };

    try {
      console.warn(
        "[AUDIT] Security Event:",
        JSON.stringify(logEntry, null, 2),
      );

      if (!this._auditLogs) {
        this._auditLogs = [];
      }
      this._auditLogs.push(logEntry);

      if (this._auditLogs.length > 10000) {
        this._auditLogs = this._auditLogs.slice(-10000);
      }

      // Always trigger alerts for security events
      await this.triggerSecurityAlert({
        ...logEntry,
        alertType: event.action,
        message: event.message || `Security event: ${event.action}`,
      });
    } catch (error) {
      console.error("Failed to log security event:", error);
    }
  }

  /**
   * Log a system event
   * @param {Object} event - The system event details
   */
  static async logSystemEvent(event) {
    const logEntry = {
      timestamp: new Date(),
      eventType: "SYSTEM",
      action: event.action, // STARTUP, SHUTDOWN, ERROR, PERFORMANCE_ISSUE
      details: event.details || {},
      severity: event.severity || "INFO",
    };

    try {
      console.log("[AUDIT] System Event:", JSON.stringify(logEntry, null, 2));

      if (!this._auditLogs) {
        this._auditLogs = [];
      }
      this._auditLogs.push(logEntry);

      if (this._auditLogs.length > 10000) {
        this._auditLogs = this._auditLogs.slice(-10000);
      }

      // Trigger alerts for critical system events
      if (logEntry.severity === "CRITICAL") {
        await this.triggerSecurityAlert({
          ...logEntry,
          alertType: "SYSTEM_CRITICAL",
          message: `Critical system event: ${event.action}`,
        });
      }
    } catch (error) {
      console.error("Failed to log system event:", error);
    }
  }

  /**
   * Trigger a security alert
   * @param {Object} alert - The alert details
   */
  static async triggerSecurityAlert(alert) {
    const alertEntry = {
      timestamp: alert.timestamp || new Date(),
      alertType: alert.alertType,
      severity: alert.severity,
      message: alert.message,
      userId: alert.userId || null,
      ip: alert.ip || null,
      details: alert.details || {},
      acknowledged: false,
    };

    try {
      // Store alert in memory (will be moved to database in Phase 6.4)
      if (!this._securityAlerts) {
        this._securityAlerts = [];
      }
      this._securityAlerts.push(alertEntry);

      // Keep only last 1000 alerts
      if (this._securityAlerts.length > 1000) {
        this._securityAlerts = this._securityAlerts.slice(-1000);
      }

      // Log the alert
      console.error(
        "[ALERT] Security Alert:",
        JSON.stringify(alertEntry, null, 2),
      );

      // In production, this would send notifications via email, Slack, etc.
      // await this.sendNotification(alertEntry);
    } catch (error) {
      console.error("Failed to trigger security alert:", error);
    }
  }

  /**
   * Get audit logs with filtering
   * @param {Object} filters - Filter criteria
   * @returns {Array} - Filtered audit logs
   */
  static getAuditLogs(
    filters: {
      eventType?: string;
      userId?: string | number;
      severity?: string;
      startDate?: string | Date;
      endDate?: string | Date;
      limit?: number;
    } = {},
  ) {
    if (!this._auditLogs) {
      return [];
    }

    let logs = [...this._auditLogs];

    // Apply filters
    if (filters.eventType) {
      logs = logs.filter((log: any) => log.eventType === filters.eventType);
    }
    if (filters.userId) {
      logs = logs.filter((log: any) => log.userId === filters.userId);
    }
    if (filters.severity) {
      logs = logs.filter((log: any) => log.severity === filters.severity);
    }
    if (filters.startDate) {
      logs = logs.filter(
        (log: any) => new Date(log.timestamp) >= new Date(filters.startDate),
      );
    }
    if (filters.endDate) {
      logs = logs.filter(
        (log: any) => new Date(log.timestamp) <= new Date(filters.endDate),
      );
    }

    // Sort by timestamp descending
    logs.sort(
      (a: any, b: any) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    // Apply limit
    if (filters.limit) {
      logs = logs.slice(0, filters.limit);
    }

    return logs;
  }

  /**
   * Get security alerts
   * @param {Object} filters - Filter criteria
   * @returns {Array} - Filtered security alerts
   */
  static getSecurityAlerts(
    filters: {
      alertType?: string;
      severity?: string;
      acknowledged?: boolean;
      limit?: number;
    } = {},
  ) {
    if (!this._securityAlerts) {
      return [];
    }

    let alerts = [...this._securityAlerts];

    // Apply filters
    if (filters.alertType) {
      alerts = alerts.filter((alert: any) => alert.alertType === filters.alertType);
    }
    if (filters.severity) {
      alerts = alerts.filter((alert: any) => alert.severity === filters.severity);
    }
    if (filters.acknowledged !== undefined) {
      alerts = alerts.filter(
        (alert: any) => alert.acknowledged === filters.acknowledged,
      );
    }

    // Sort by timestamp descending
    alerts.sort(
      (a: any, b: any) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    // Apply limit
    if (filters.limit) {
      alerts = alerts.slice(0, filters.limit);
    }

    return alerts;
  }

  /**
   * Acknowledge a security alert
   * @param {string} alertId - The alert ID (timestamp)
   * @param {string} userId - The user acknowledging the alert
   * @returns {boolean} - Whether the alert was acknowledged
   */
  static acknowledgeAlert(alertId, userId) {
    if (!this._securityAlerts) {
      return false;
    }

    const alert = this._securityAlerts.find(
      (a: any) => a.timestamp.getTime() === new Date(alertId).getTime(),
    );
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedBy = userId;
      alert.acknowledgedAt = new Date();

      console.log(
        `[ALERT] Alert acknowledged by user ${userId}:`,
        alert.alertType,
      );
      return true;
    }

    return false;
  }

  /**
   * Get audit statistics
   * @param {Object} period - Time period for statistics
   * @returns {Object} - Audit statistics
   */
  static getAuditStatistics(period: { days: number } = { days: 7 }) {
    if (!this._auditLogs) {
      return {
        totalEvents: 0,
        authEvents: 0,
        dataEvents: 0,
        securityEvents: 0,
        systemEvents: 0,
        criticalEvents: 0,
        alertsTriggered: 0,
      };
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period.days);

    const recentLogs = this._auditLogs.filter(
      (log: any) => new Date(log.timestamp) >= startDate,
    );
    const recentAlerts = this._securityAlerts
      ? this._securityAlerts.filter(
          (alert: any) => new Date(alert.timestamp) >= startDate,
        )
      : [];

    return {
      totalEvents: recentLogs.length,
      authEvents: recentLogs.filter((log: any) => log.eventType === "AUTH").length,
      dataEvents: recentLogs.filter((log: any) => log.eventType === "DATA").length,
      securityEvents: recentLogs.filter((log: any) => log.eventType === "SECURITY")
        .length,
      systemEvents: recentLogs.filter((log: any) => log.eventType === "SYSTEM")
        .length,
      criticalEvents: recentLogs.filter((log: any) => log.severity === "CRITICAL")
        .length,
      alertsTriggered: recentAlerts.length,
      period: period,
    };
  }

  /**
   * Export audit logs (for compliance)
   * @param {Object} filters - Export filters
   * @returns {Object} - Export data
   */
  static exportAuditLogs(
    filters: {
      eventType?: string;
      userId?: string | number;
      severity?: string;
      startDate?: string | Date;
      endDate?: string | Date;
      limit?: number;
      period?: { days: number };
    } = {},
  ) {
    const logs = this.getAuditLogs(filters);
    const alerts = this.getSecurityAlerts(filters);

    return {
      exportDate: new Date(),
      filters: filters,
      auditLogs: logs,
      securityAlerts: alerts,
      statistics: this.getAuditStatistics(filters.period || { days: 30 }),
    };
  }
}

export default AuditLoggerService;
