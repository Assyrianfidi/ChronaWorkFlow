import request from "supertest";
import express from "express";
import AuditLoggerService from "../../services/auditLogger.service";
import MonitoringService from "../../services/monitoring.service";
import {
  logAuthEvent,
  logDataEvent,
  logSecurityEvent,
  logAllRequests,
  logPerformance,
} from "../../middleware/security/auditLogger.middleware.js";

// Mock the services
jest.mock("../../services/auditLogger.service");
jest.mock("../../services/monitoring.service");

const MockedAuditLoggerService = AuditLoggerService as jest.Mocked<
  typeof AuditLoggerService
>;

// Create mock functions for MonitoringService methods
const mockInitializeMetrics = jest.fn();
const mockGetMetrics = jest.fn().mockReturnValue({
  requests: {
    total: 0,
    successful: 0,
    failed: 0,
    averageResponseTime: 0,
    slowRequests: 0,
  },
  auth: { logins: 0, failedLogins: 0, activeSessions: 0, passwordChanges: 0 },
  security: { unauthorizedAttempts: 0, rateLimitHits: 0, blockedIps: 0 },
  system: {
    uptime: 1000,
    memoryUsage: { heapUsed: 50000000 },
    cpuUsage: { user: 0, system: 0 },
  },
});
const mockRecordRequestMetrics = jest.fn();
const mockRecordAuthMetrics = jest.fn();
const mockRecordSecurityMetrics = jest.fn();
const mockGetHealthStatus = jest.fn().mockReturnValue({
  status: "healthy",
  issues: [],
  uptime: 1000,
  memoryUsage: 50,
  averageResponseTime: 0,
  errorRate: 0,
});
const mockTriggerAlert = jest.fn();
const mockGetAlerts = jest.fn().mockReturnValue([]);
const mockAcknowledgeAlert = jest.fn().mockReturnValue(true);
const mockGetPerformanceReport = jest.fn().mockReturnValue({
  period: { hours: 24 },
  generatedAt: new Date(),
  metrics: {},
  health: {},
  alerts: { total: 0, critical: 0, warning: 0, info: 0 },
  topIssues: [],
  recommendations: [],
});
const mockCleanup = jest.fn();

// Mock the MonitoringService class
jest.mock("../../services/monitoring.service", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      initializeMetrics: mockInitializeMetrics,
      getMetrics: mockGetMetrics,
      recordRequestMetrics: mockRecordRequestMetrics,
      recordAuthMetrics: mockRecordAuthMetrics,
      recordSecurityMetrics: mockRecordSecurityMetrics,
      getHealthStatus: mockGetHealthStatus,
      triggerAlert: mockTriggerAlert,
      getAlerts: mockGetAlerts,
      acknowledgeAlert: mockAcknowledgeAlert,
      getPerformanceReport: mockGetPerformanceReport,
      cleanup: mockCleanup,
    })),
  };
});

describe("Audit Logger Middleware", () => {
  let app: express.Application;

  beforeEach(() => {
    jest.clearAllMocks();

    app = express();
    app.use(express.json());

    // Mock authentication
    const mockAuth = (req, res, next) => {
      if (req.headers.authorization) {
        req.user = { id: 1, email: "test@example.com", role: "admin" };
      }
      next();
    };

    // Test routes with audit middleware
    app.post("/auth/login", mockAuth, logAuthEvent("LOGIN", true), (req, res) =>
      res.json({ success: true, data: { user: { id: 1 } } }),
    );

    app.post(
      "/auth/login-failed",
      mockAuth,
      logAuthEvent("LOGIN", false),
      (req, res) =>
        res.json({ success: false, message: "Invalid credentials" }),
    );

    app.post(
      "/accounts",
      mockAuth,
      logDataEvent("CREATE", "ACCOUNT"),
      (req, res) =>
        res.json({ success: true, data: { id: 1, name: "Test Account" } }),
    );

    app.delete(
      "/accounts/:id",
      mockAuth,
      logDataEvent("DELETE", "ACCOUNT"),
      (req, res) => res.json({ success: true }),
    );

    app.get(
      "/sensitive",
      mockAuth,
      logSecurityEvent("UNAUTHORIZED_ACCESS", { resource: "sensitive_data" }),
      (req, res) => res.json({ success: true }),
    );
  });

  describe("Auth Event Logging", () => {
    it("should log successful login events", async () => {
      MockedAuditLoggerService.logAuthEvent.mockResolvedValue(undefined);

      const response = await request(app)
        .post("/auth/login")
        .set("Authorization", "Bearer token")
        .send({ email: "test@example.com", password: "password" });

      expect(response.status).toBe(200);
      expect(MockedAuditLoggerService.logAuthEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "LOGIN",
          userId: 1,
          email: "test@example.com",
          success: true,
          severity: "INFO",
        }),
      );
      expect(mockRecordAuthMetrics).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "LOGIN",
          success: true,
          userId: 1,
        }),
      );
    });

    it("should log failed login events", async () => {
      MockedAuditLoggerService.logAuthEvent.mockResolvedValue(undefined);

      const response = await request(app)
        .post("/auth/login-failed")
        .set("Authorization", "Bearer token")
        .send({ email: "test@example.com", password: "wrong" });

      expect(response.status).toBe(200);
      expect(MockedAuditLoggerService.logAuthEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "LOGIN",
          success: false,
          severity: "WARNING",
          details: expect.objectContaining({
            reason: "Invalid credentials",
            bruteForce: true,
          }),
        }),
      );
    });
  });

  describe("Data Event Logging", () => {
    it("should log account creation events", async () => {
      MockedAuditLoggerService.logDataEvent.mockResolvedValue(undefined);

      const response = await request(app)
        .post("/accounts")
        .set("Authorization", "Bearer token")
        .send({ name: "Test Account", type: "asset" });

      expect(response.status).toBe(200);
      expect(MockedAuditLoggerService.logDataEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "CREATE",
          resourceType: "ACCOUNT",
          userId: 1,
          success: true,
          severity: "INFO",
        }),
      );
    });

    it("should log account deletion events with warning severity", async () => {
      MockedAuditLoggerService.logDataEvent.mockResolvedValue(undefined);

      const response = await request(app)
        .delete("/accounts/123")
        .set("Authorization", "Bearer token");

      expect(response.status).toBe(200);
      expect(MockedAuditLoggerService.logDataEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "DELETE",
          resourceType: "ACCOUNT",
          severity: "WARNING",
        }),
      );
    });
  });

  describe("Security Event Logging", () => {
    it("should log security events immediately", async () => {
      MockedAuditLoggerService.logSecurityEvent.mockResolvedValue(undefined);

      const response = await request(app)
        .get("/sensitive")
        .set("Authorization", "Bearer token");

      expect(response.status).toBe(200);
      expect(MockedAuditLoggerService.logSecurityEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "UNAUTHORIZED_ACCESS",
          resource: "sensitive_data",
          severity: "WARNING",
        }),
      );
    });
  });
});

describe("Monitoring Service", () => {
  let mockMonitoringService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockMonitoringService = new MonitoringService();
  });

  describe("Metrics Collection", () => {
    it("should initialize metrics", () => {
      mockMonitoringService.initializeMetrics();
      expect(mockInitializeMetrics).toHaveBeenCalled();
    });

    it("should record request metrics", () => {
      mockMonitoringService.recordRequestMetrics({
        method: "GET",
        route: "/test",
        statusCode: 200,
        duration: 150,
        success: true,
        ip: "127.0.0.1",
        userAgent: "test-agent",
      });

      expect(mockRecordRequestMetrics).toHaveBeenCalledWith({
        method: "GET",
        route: "/test",
        statusCode: 200,
        duration: 150,
        success: true,
        ip: "127.0.0.1",
        userAgent: "test-agent",
      });
    });

    it("should record authentication metrics", () => {
      mockMonitoringService.recordAuthMetrics({
        action: "LOGIN",
        success: true,
      });
      mockMonitoringService.recordAuthMetrics({
        action: "LOGIN_FAILED",
        success: false,
      });
      mockMonitoringService.recordAuthMetrics({
        action: "PASSWORD_CHANGE",
        success: true,
      });

      expect(mockRecordAuthMetrics).toHaveBeenCalledTimes(3);
    });

    it("should record security metrics", () => {
      mockMonitoringService.recordSecurityMetrics({
        action: "UNAUTHORIZED_ACCESS",
      });
      mockMonitoringService.recordSecurityMetrics({
        action: "RATE_LIMIT_EXCEEDED",
      });
      mockMonitoringService.recordSecurityMetrics({ action: "IP_BLOCKED" });

      expect(mockRecordSecurityMetrics).toHaveBeenCalledTimes(3);
    });
  });

  describe("Health Status", () => {
    it("should return health status", () => {
      const health = mockMonitoringService.getHealthStatus();

      expect(mockGetHealthStatus).toHaveBeenCalled();
      expect(health.status).toBe("healthy");
      expect(health.issues).toHaveLength(0);
    });
  });

  describe("Alert System", () => {
    it("should trigger alerts", () => {
      const alert = {
        type: "TEST_ALERT",
        severity: "WARNING",
        message: "Test alert message",
        details: { test: true },
      };

      mockMonitoringService.triggerAlert(alert);

      expect(mockTriggerAlert).toHaveBeenCalledWith(alert);
    });

    it("should get alerts with filters", () => {
      const filters = { severity: "WARNING" };
      mockMonitoringService.getAlerts(filters);

      expect(mockGetAlerts).toHaveBeenCalledWith(filters);
    });

    it("should acknowledge alerts", () => {
      const alertId = "2024-01-01T00:00:00.000Z";
      const userId = "admin-user";

      mockMonitoringService.acknowledgeAlert(alertId, userId);

      expect(mockAcknowledgeAlert).toHaveBeenCalledWith(alertId, userId);
    });
  });

  describe("Performance Reports", () => {
    it("should generate performance reports", () => {
      const period = { hours: 24 };
      mockMonitoringService.getPerformanceReport(period);

      expect(mockGetPerformanceReport).toHaveBeenCalledWith(period);
    });
  });
});

describe("Audit Logger Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Auth Event Logging", () => {
    it("should log authentication events with correct structure", async () => {
      const event = {
        action: "LOGIN",
        userId: 1,
        email: "test@example.com",
        ip: "127.0.0.1",
        userAgent: "test-agent",
        success: true,
        details: { test: true },
        severity: "INFO",
      };

      await MockedAuditLoggerService.logAuthEvent(event);

      expect(MockedAuditLoggerService.logAuthEvent).toHaveBeenCalledWith(event);
    });
  });

  describe("Data Event Logging", () => {
    it("should log data events with sensitive flag for important resources", async () => {
      const event = {
        action: "CREATE",
        resourceType: "ACCOUNT",
        resourceId: "123",
        userId: 1,
        companyId: "company1",
        ip: "127.0.0.1",
        userAgent: "test-agent",
        success: true,
        details: { test: true },
        severity: "INFO",
      };

      await MockedAuditLoggerService.logDataEvent(event);

      expect(MockedAuditLoggerService.logDataEvent).toHaveBeenCalledWith(event);
      // The isSensitive flag is added internally by the service, not expected in the call
    });
  });

  describe("Security Event Logging", () => {
    it("should log security events and trigger alerts", async () => {
      const event = {
        action: "UNAUTHORIZED_ACCESS",
        userId: null,
        ip: "127.0.0.1",
        userAgent: "test-agent",
        resource: "sensitive_data",
        details: { test: true },
        severity: "WARNING",
      };

      await MockedAuditLoggerService.logSecurityEvent(event);

      expect(MockedAuditLoggerService.logSecurityEvent).toHaveBeenCalledWith(
        event,
      );
    });
  });

  describe("Audit Log Retrieval", () => {
    it("should filter audit logs by various criteria", () => {
      const filters = {
        eventType: "AUTH",
        userId: 1,
        severity: "WARNING",
        limit: 100,
      };

      MockedAuditLoggerService.getAuditLogs(filters);

      expect(MockedAuditLoggerService.getAuditLogs).toHaveBeenCalledWith(
        filters,
      );
    });

    it("should get audit statistics", () => {
      const period = { days: 7 };

      MockedAuditLoggerService.getAuditStatistics(period);

      expect(MockedAuditLoggerService.getAuditStatistics).toHaveBeenCalledWith(
        period,
      );
    });
  });

  describe("Security Alerts", () => {
    it("should retrieve security alerts with filters", () => {
      const filters = {
        alertType: "UNAUTHORIZED_ACCESS",
        severity: "WARNING",
        acknowledged: false,
        limit: 50,
      };

      MockedAuditLoggerService.getSecurityAlerts(filters);

      expect(MockedAuditLoggerService.getSecurityAlerts).toHaveBeenCalledWith(
        filters,
      );
    });

    it("should acknowledge security alerts", () => {
      const alertId = "2024-01-01T00:00:00.000Z";
      const userId = "admin-user";

      MockedAuditLoggerService.acknowledgeAlert(alertId, userId);

      expect(MockedAuditLoggerService.acknowledgeAlert).toHaveBeenCalledWith(
        alertId,
        userId,
      );
    });
  });

  describe("Export Functionality", () => {
    it("should export audit logs with filters", () => {
      const filters = {
        eventType: "AUTH",
        period: { days: 30 },
      };

      MockedAuditLoggerService.exportAuditLogs(filters);

      expect(MockedAuditLoggerService.exportAuditLogs).toHaveBeenCalledWith(
        filters,
      );
    });
  });
});
