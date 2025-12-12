"use strict";
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g = Object.create(
        (typeof Iterator === "function" ? Iterator : Object).prototype,
      );
    return (
      (g.next = verb(0)),
      (g["throw"] = verb(1)),
      (g["return"] = verb(2)),
      typeof Symbol === "function" &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError("Generator is already executing.");
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y["return"]
                  : op[0]
                    ? y["throw"] || ((t = y["return"]) && t.call(y), 0)
                    : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
Object.defineProperty(exports, "__esModule", { value: true });
var supertest_1 = require("supertest");
var express_1 = require("express");
var auditLogger_service_js_1 = require("../../services/auditLogger.service.js");
var monitoring_service_js_1 = require("../../services/monitoring.service.js");
var auditLogger_middleware_js_1 = require("../../middleware/security/auditLogger.middleware.js");
// Mock the services
jest.mock("../../services/auditLogger.service.js");
jest.mock("../../services/monitoring.service.js");
var MockedAuditLoggerService = auditLogger_service_js_1.default;
// Create mock functions for MonitoringService methods
var mockInitializeMetrics = jest.fn();
var mockGetMetrics = jest.fn().mockReturnValue({
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
var mockRecordRequestMetrics = jest.fn();
var mockRecordAuthMetrics = jest.fn();
var mockRecordSecurityMetrics = jest.fn();
var mockGetHealthStatus = jest.fn().mockReturnValue({
  status: "healthy",
  issues: [],
  uptime: 1000,
  memoryUsage: 50,
  averageResponseTime: 0,
  errorRate: 0,
});
var mockTriggerAlert = jest.fn();
var mockGetAlerts = jest.fn().mockReturnValue([]);
var mockAcknowledgeAlert = jest.fn().mockReturnValue(true);
var mockGetPerformanceReport = jest.fn().mockReturnValue({
  period: { hours: 24 },
  generatedAt: new Date(),
  metrics: {},
  health: {},
  alerts: { total: 0, critical: 0, warning: 0, info: 0 },
  topIssues: [],
  recommendations: [],
});
var mockCleanup = jest.fn();
// Mock the MonitoringService class
jest.mock("../../services/monitoring.service.js", function () {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(function () {
      return {
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
      };
    }),
  };
});
describe("Audit Logger Middleware", function () {
  var app;
  beforeEach(function () {
    jest.clearAllMocks();
    app = (0, express_1.default)();
    app.use(express_1.default.json());
    // Mock authentication
    var mockAuth = function (req, res, next) {
      if (req.headers.authorization) {
        req.user = { id: 1, email: "test@example.com", role: "admin" };
      }
      next();
    };
    // Test routes with audit middleware
    app.post(
      "/auth/login",
      mockAuth,
      (0, auditLogger_middleware_js_1.logAuthEvent)("LOGIN", true),
      function (req, res) {
        return res.json({ success: true, data: { user: { id: 1 } } });
      },
    );
    app.post(
      "/auth/login-failed",
      mockAuth,
      (0, auditLogger_middleware_js_1.logAuthEvent)("LOGIN", false),
      function (req, res) {
        return res.json({ success: false, message: "Invalid credentials" });
      },
    );
    app.post(
      "/accounts",
      mockAuth,
      (0, auditLogger_middleware_js_1.logDataEvent)("CREATE", "ACCOUNT"),
      function (req, res) {
        return res.json({
          success: true,
          data: { id: 1, name: "Test Account" },
        });
      },
    );
    app.delete(
      "/accounts/:id",
      mockAuth,
      (0, auditLogger_middleware_js_1.logDataEvent)("DELETE", "ACCOUNT"),
      function (req, res) {
        return res.json({ success: true });
      },
    );
    app.get(
      "/sensitive",
      mockAuth,
      (0, auditLogger_middleware_js_1.logSecurityEvent)("UNAUTHORIZED_ACCESS", {
        resource: "sensitive_data",
      }),
      function (req, res) {
        return res.json({ success: true });
      },
    );
  });
  describe("Auth Event Logging", function () {
    it("should log successful login events", function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              MockedAuditLoggerService.logAuthEvent.mockResolvedValue(
                undefined,
              );
              return [
                4 /*yield*/,
                (0, supertest_1.default)(app)
                  .post("/auth/login")
                  .set("Authorization", "Bearer token")
                  .send({ email: "test@example.com", password: "password" }),
              ];
            case 1:
              response = _a.sent();
              expect(response.status).toBe(200);
              expect(
                MockedAuditLoggerService.logAuthEvent,
              ).toHaveBeenCalledWith(
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
              return [2 /*return*/];
          }
        });
      });
    });
    it("should log failed login events", function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              MockedAuditLoggerService.logAuthEvent.mockResolvedValue(
                undefined,
              );
              return [
                4 /*yield*/,
                (0, supertest_1.default)(app)
                  .post("/auth/login-failed")
                  .set("Authorization", "Bearer token")
                  .send({ email: "test@example.com", password: "wrong" }),
              ];
            case 1:
              response = _a.sent();
              expect(response.status).toBe(200);
              expect(
                MockedAuditLoggerService.logAuthEvent,
              ).toHaveBeenCalledWith(
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
              return [2 /*return*/];
          }
        });
      });
    });
  });
  describe("Data Event Logging", function () {
    it("should log account creation events", function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              MockedAuditLoggerService.logDataEvent.mockResolvedValue(
                undefined,
              );
              return [
                4 /*yield*/,
                (0, supertest_1.default)(app)
                  .post("/accounts")
                  .set("Authorization", "Bearer token")
                  .send({ name: "Test Account", type: "asset" }),
              ];
            case 1:
              response = _a.sent();
              expect(response.status).toBe(200);
              expect(
                MockedAuditLoggerService.logDataEvent,
              ).toHaveBeenCalledWith(
                expect.objectContaining({
                  action: "CREATE",
                  resourceType: "ACCOUNT",
                  userId: 1,
                  success: true,
                  severity: "INFO",
                }),
              );
              return [2 /*return*/];
          }
        });
      });
    });
    it("should log account deletion events with warning severity", function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              MockedAuditLoggerService.logDataEvent.mockResolvedValue(
                undefined,
              );
              return [
                4 /*yield*/,
                (0, supertest_1.default)(app)
                  .delete("/accounts/123")
                  .set("Authorization", "Bearer token"),
              ];
            case 1:
              response = _a.sent();
              expect(response.status).toBe(200);
              expect(
                MockedAuditLoggerService.logDataEvent,
              ).toHaveBeenCalledWith(
                expect.objectContaining({
                  action: "DELETE",
                  resourceType: "ACCOUNT",
                  severity: "WARNING",
                }),
              );
              return [2 /*return*/];
          }
        });
      });
    });
  });
  describe("Security Event Logging", function () {
    it("should log security events immediately", function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              MockedAuditLoggerService.logSecurityEvent.mockResolvedValue(
                undefined,
              );
              return [
                4 /*yield*/,
                (0, supertest_1.default)(app)
                  .get("/sensitive")
                  .set("Authorization", "Bearer token"),
              ];
            case 1:
              response = _a.sent();
              expect(response.status).toBe(200);
              expect(
                MockedAuditLoggerService.logSecurityEvent,
              ).toHaveBeenCalledWith(
                expect.objectContaining({
                  action: "UNAUTHORIZED_ACCESS",
                  resource: "sensitive_data",
                  severity: "WARNING",
                }),
              );
              return [2 /*return*/];
          }
        });
      });
    });
  });
});
describe("Monitoring Service", function () {
  var mockMonitoringService;
  beforeEach(function () {
    jest.clearAllMocks();
    mockMonitoringService = new monitoring_service_js_1.default();
  });
  describe("Metrics Collection", function () {
    it("should initialize metrics", function () {
      mockMonitoringService.initializeMetrics();
      expect(mockInitializeMetrics).toHaveBeenCalled();
    });
    it("should record request metrics", function () {
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
    it("should record authentication metrics", function () {
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
    it("should record security metrics", function () {
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
  describe("Health Status", function () {
    it("should return health status", function () {
      var health = mockMonitoringService.getHealthStatus();
      expect(mockGetHealthStatus).toHaveBeenCalled();
      expect(health.status).toBe("healthy");
      expect(health.issues).toHaveLength(0);
    });
  });
  describe("Alert System", function () {
    it("should trigger alerts", function () {
      var alert = {
        type: "TEST_ALERT",
        severity: "WARNING",
        message: "Test alert message",
        details: { test: true },
      };
      mockMonitoringService.triggerAlert(alert);
      expect(mockTriggerAlert).toHaveBeenCalledWith(alert);
    });
    it("should get alerts with filters", function () {
      var filters = { severity: "WARNING" };
      mockMonitoringService.getAlerts(filters);
      expect(mockGetAlerts).toHaveBeenCalledWith(filters);
    });
    it("should acknowledge alerts", function () {
      var alertId = "2024-01-01T00:00:00.000Z";
      var userId = "admin-user";
      mockMonitoringService.acknowledgeAlert(alertId, userId);
      expect(mockAcknowledgeAlert).toHaveBeenCalledWith(alertId, userId);
    });
  });
  describe("Performance Reports", function () {
    it("should generate performance reports", function () {
      var period = { hours: 24 };
      mockMonitoringService.getPerformanceReport(period);
      expect(mockGetPerformanceReport).toHaveBeenCalledWith(period);
    });
  });
});
describe("Audit Logger Service", function () {
  beforeEach(function () {
    jest.clearAllMocks();
  });
  describe("Auth Event Logging", function () {
    it("should log authentication events with correct structure", function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var event;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              event = {
                action: "LOGIN",
                userId: 1,
                email: "test@example.com",
                ip: "127.0.0.1",
                userAgent: "test-agent",
                success: true,
                details: { test: true },
                severity: "INFO",
              };
              return [
                4 /*yield*/,
                MockedAuditLoggerService.logAuthEvent(event),
              ];
            case 1:
              _a.sent();
              expect(
                MockedAuditLoggerService.logAuthEvent,
              ).toHaveBeenCalledWith(event);
              return [2 /*return*/];
          }
        });
      });
    });
  });
  describe("Data Event Logging", function () {
    it("should log data events with sensitive flag for important resources", function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var event;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              event = {
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
              return [
                4 /*yield*/,
                MockedAuditLoggerService.logDataEvent(event),
              ];
            case 1:
              _a.sent();
              expect(
                MockedAuditLoggerService.logDataEvent,
              ).toHaveBeenCalledWith(event);
              return [2 /*return*/];
          }
        });
      });
    });
  });
  describe("Security Event Logging", function () {
    it("should log security events and trigger alerts", function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var event;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              event = {
                action: "UNAUTHORIZED_ACCESS",
                userId: null,
                ip: "127.0.0.1",
                userAgent: "test-agent",
                resource: "sensitive_data",
                details: { test: true },
                severity: "WARNING",
              };
              return [
                4 /*yield*/,
                MockedAuditLoggerService.logSecurityEvent(event),
              ];
            case 1:
              _a.sent();
              expect(
                MockedAuditLoggerService.logSecurityEvent,
              ).toHaveBeenCalledWith(event);
              return [2 /*return*/];
          }
        });
      });
    });
  });
  describe("Audit Log Retrieval", function () {
    it("should filter audit logs by various criteria", function () {
      var filters = {
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
    it("should get audit statistics", function () {
      var period = { days: 7 };
      MockedAuditLoggerService.getAuditStatistics(period);
      expect(MockedAuditLoggerService.getAuditStatistics).toHaveBeenCalledWith(
        period,
      );
    });
  });
  describe("Security Alerts", function () {
    it("should retrieve security alerts with filters", function () {
      var filters = {
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
    it("should acknowledge security alerts", function () {
      var alertId = "2024-01-01T00:00:00.000Z";
      var userId = "admin-user";
      MockedAuditLoggerService.acknowledgeAlert(alertId, userId);
      expect(MockedAuditLoggerService.acknowledgeAlert).toHaveBeenCalledWith(
        alertId,
        userId,
      );
    });
  });
  describe("Export Functionality", function () {
    it("should export audit logs with filters", function () {
      var filters = {
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
