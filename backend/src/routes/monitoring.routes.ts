// @ts-ignore
const express = require("express");
const router = express.Router();
const MonitoringService = require("../services/monitoring.service");
const AuditLoggerService = require("../services/auditLogger.service");
import { authenticate } from "../middleware/auth";

/**
 * @desc    Get system health status
 * @route   GET /api/v1/monitoring/health
 * @access  Public
 */
router.get("/health", (req: any, res: any) => {
  try {
    const health = MonitoringService.getHealthStatus();

    // Set appropriate status code based on health
    const statusCode =
      health.status === "healthy"
        ? 200
        : health.status === "degraded"
          ? 200
          : 503;

    res.status(statusCode).json({
      success: true,
      data: health,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      message: "Failed to get health status",
      error: msg,
    });
  }
});

/**
 * @desc    Get system metrics
 * @route   GET /api/v1/monitoring/metrics
 * @access  Private (Admin/Manager only)
 */
router.get("/metrics", authenticate, (req: any, res: any) => {
  try {
    // Check permissions
    if (!["admin", "manager"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin or Manager role required.",
      });
    }

    const metrics = MonitoringService.getMetrics();

    res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      message: "Failed to get metrics",
      error: msg,
    });
  }
});

/**
 * @desc    Get security alerts
 * @route   GET /api/v1/monitoring/alerts
 * @access  Private (Admin/Manager only)
 */
router.get("/alerts", authenticate, (req: any, res: any) => {
  try {
    // Check permissions
    if (!["admin", "manager"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin or Manager role required.",
      });
    }

    const filters = {
      severity: req.query.severity,
      type: req.query.type,
      acknowledged:
        req.query.acknowledged === "true"
          ? true
          : req.query.acknowledged === "false"
            ? false
            : undefined,
      limit: parseInt(req.query.limit) || 100,
    };

    const alerts = MonitoringService.getAlerts(filters);

    res.status(200).json({
      success: true,
      data: alerts,
      filters: filters,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      message: "Failed to get alerts",
      error: msg,
    });
  }
});

/**
 * @desc    Acknowledge an alert
 * @route   POST /api/v1/monitoring/alerts/:alertId/acknowledge
 * @access  Private (Admin/Manager only)
 */
router.post("/alerts/:alertId/acknowledge", authenticate, (req: any, res: any) => {
  try {
    // Check permissions
    if (!["admin", "manager"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin or Manager role required.",
      });
    }

    const success = MonitoringService.acknowledgeAlert(
      req.params.alertId,
      req.user.id,
    );

    if (success) {
      res.status(200).json({
        success: true,
        message: "Alert acknowledged successfully",
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Alert not found",
      });
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      message: "Failed to acknowledge alert",
      error: msg,
    });
  }
});

/**
 * @desc    Get audit logs
 * @route   GET /api/v1/monitoring/audit-logs
 * @access  Private (Admin only)
 */
router.get("/audit-logs", authenticate, (req: any, res: any) => {
  try {
    // Check permissions - Admin only
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin role required.",
      });
    }

    const filters = {
      eventType: req.query.eventType,
      userId: req.query.userId ? parseInt(req.query.userId) : undefined,
      severity: req.query.severity,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      limit: parseInt(req.query.limit) || 1000,
    };

    const logs = AuditLoggerService.getAuditLogs(filters);

    res.status(200).json({
      success: true,
      data: logs,
      filters: filters,
      total: logs.length,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      message: "Failed to get audit logs",
      error: msg,
    });
  }
});

/**
 * @desc    Get security alerts from audit logs
 * @route   GET /api/v1/monitoring/security-alerts
 * @access  Private (Admin only)
 */
router.get("/security-alerts", authenticate, (req: any, res: any) => {
  try {
    // Check permissions - Admin only
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin role required.",
      });
    }

    const filters = {
      alertType: req.query.alertType,
      severity: req.query.severity,
      acknowledged:
        req.query.acknowledged === "true"
          ? true
          : req.query.acknowledged === "false"
            ? false
            : undefined,
      limit: parseInt(req.query.limit) || 100,
    };

    const alerts = AuditLoggerService.getSecurityAlerts(filters);

    res.status(200).json({
      success: true,
      data: alerts,
      filters: filters,
      total: alerts.length,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      message: "Failed to get security alerts",
      error: msg,
    });
  }
});

/**
 * @desc    Acknowledge a security alert
 * @route   POST /api/v1/monitoring/security-alerts/:alertId/acknowledge
 * @access  Private (Admin only)
 */
router.post(
  "/security-alerts/:alertId/acknowledge",
  authenticate,
  (req: any, res: any) => {
    try {
      // Check permissions - Admin only
      if (req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Access denied. Admin role required.",
        });
      }

      const success = AuditLoggerService.acknowledgeAlert(
        req.params.alertId,
        req.user.id,
      );

      if (success) {
        res.status(200).json({
          success: true,
          message: "Security alert acknowledged successfully",
        });
      } else {
        res.status(404).json({
          success: false,
          message: "Security alert not found",
        });
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      res.status(500).json({
        success: false,
        message: "Failed to acknowledge security alert",
        error: msg,
      });
    }
  },
);

/**
 * @desc    Get audit statistics
 * @route   GET /api/v1/monitoring/audit-stats
 * @access  Private (Admin/Manager only)
 */
router.get("/audit-stats", authenticate, (req: any, res: any) => {
  try {
    // Check permissions
    if (!["admin", "manager"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin or Manager role required.",
      });
    }

    const period = {
      days: parseInt(req.query.days) || 7,
    };

    const stats = AuditLoggerService.getAuditStatistics(period);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      message: "Failed to get audit statistics",
      error: msg,
    });
  }
});

/**
 * @desc    Get performance report
 * @route   GET /api/v1/monitoring/performance-report
 * @access  Private (Admin only)
 */
router.get("/performance-report", authenticate, (req: any, res: any) => {
  try {
    // Check permissions - Admin only
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin role required.",
      });
    }

    const period = {
      hours: parseInt(req.query.hours) || 24,
    };

    const report = MonitoringService.getPerformanceReport(period);

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      message: "Failed to generate performance report",
      error: msg,
    });
  }
});

/**
 * @desc    Export audit logs (for compliance)
 * @route   GET /api/v1/monitoring/export-audit-logs
 * @access  Private (Admin only)
 */
router.get("/export-audit-logs", authenticate, (req: any, res: any) => {
  try {
    // Check permissions - Admin only
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin role required.",
      });
    }

    const filters = {
      eventType: req.query.eventType,
      userId: req.query.userId ? parseInt(req.query.userId) : undefined,
      severity: req.query.severity,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      period: req.query.period
        ? { days: parseInt(req.query.period) }
        : undefined,
    };

    const exportData = AuditLoggerService.exportAuditLogs(filters);

    // Set headers for file download
    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=audit-logs-${new Date().toISOString().split("T")[0]}.json`,
    );

    res.status(200).json(exportData);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      message: "Failed to export audit logs",
      error: msg,
    });
  }
});

/**
 * @desc    Get dashboard summary
 * @route   GET /api/v1/monitoring/dashboard
 * @access  Private (Admin/Manager only)
 */
router.get("/dashboard", authenticate, (req: any, res: any) => {
  try {
    // Check permissions
    if (!["admin", "manager"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin or Manager role required.",
      });
    }

    const metrics = MonitoringService.getMetrics();
    const auditStats = AuditLoggerService.getAuditStatistics({ days: 7 });
    const recentAlerts = MonitoringService.getAlerts({ limit: 10 });
    const recentSecurityAlerts = AuditLoggerService.getSecurityAlerts({
      limit: 10,
    });

    res.status(200).json({
      success: true,
      data: {
        health: metrics.health,
        systemMetrics: {
          uptime: metrics.system.uptime,
          memoryUsage: metrics.system.memoryUsage,
          averageResponseTime: metrics.requests.averageResponseTime,
          totalRequests: metrics.requests.total,
          errorRate:
            metrics.requests.total > 0
              ? (metrics.requests.failed / metrics.requests.total) * 100
              : 0,
        },
        auditStats: auditStats,
        recentAlerts: recentAlerts,
        recentSecurityAlerts: recentSecurityAlerts,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      message: "Failed to get dashboard data",
      error: msg,
    });
  }
});

export default router;
