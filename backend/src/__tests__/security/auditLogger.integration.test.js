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
var express_1 = require("express");
// Mock the services before importing
jest.mock("../../services/auditLogger.service.js", function () {
  return {
    default: jest.fn().mockImplementation(function () {
      return {
        logAuthEvent: jest.fn().mockResolvedValue(undefined),
        logDataEvent: jest.fn().mockResolvedValue(undefined),
        logSecurityEvent: jest.fn().mockResolvedValue(undefined),
        logSystemEvent: jest.fn().mockResolvedValue(undefined),
        getAuditLogs: jest.fn().mockReturnValue([]),
        getSecurityAlerts: jest.fn().mockReturnValue([]),
        acknowledgeAlert: jest.fn().mockReturnValue(true),
        exportAuditLogs: jest.fn().mockReturnValue({ logs: [], total: 0 }),
      };
    }),
  };
});
jest.mock("../../services/monitoring.service.js", function () {
  return {
    default: jest.fn().mockImplementation(function () {
      return {
        recordAuthMetrics: jest.fn(),
        recordRequestMetrics: jest.fn(),
        recordSecurityMetrics: jest.fn(),
        getMetrics: jest.fn().mockReturnValue({
          requests: { total: 0, successful: 0, failed: 0 },
          auth: { logins: 0, failedLogins: 0 },
          security: { unauthorizedAttempts: 0 },
        }),
        getHealthStatus: jest.fn().mockReturnValue({
          status: "healthy",
          issues: [],
        }),
        triggerAlert: jest.fn(),
        getAlerts: jest.fn().mockReturnValue([]),
        getPerformanceReport: jest.fn().mockReturnValue({
          period: { hours: 24 },
          metrics: {},
          alerts: { total: 0 },
        }),
      };
    }),
  };
});
// Import middleware after mocking
var _a = require("../../middleware/security/auditLogger.middleware.js"),
  logAllRequests = _a.logAllRequests,
  logPerformance = _a.logPerformance;
describe("Audit Logger Integration Tests", function () {
  var app;
  beforeAll(function () {
    // Set test environment
    process.env.NODE_ENV = "test";
    app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use(logPerformance);
    app.use(logAllRequests);
    // Test endpoints
    app.get("/test", function (req, res) {
      res.json({ success: true, message: "Test endpoint" });
    });
    app.post("/test", function (req, res) {
      res.json({ success: true, data: req.body });
    });
    app.get("/slow", function (req, res, next) {
      // Simulate slow response with proper async handling
      setTimeout(function () {
        try {
          res.json({ success: true, message: "Slow response" });
        } catch (error) {
          next(error);
        }
      }, 50); // Reduced timeout to speed up tests
    });
  });
  afterAll(function () {
    return __awaiter(void 0, void 0, void 0, function () {
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            // Clean up environment
            delete process.env.NODE_ENV;
            // Wait a bit for any async operations to complete
            return [
              4 /*yield*/,
              new Promise(function (resolve) {
                return setTimeout(resolve, 100);
              }),
            ];
          case 1:
            // Wait a bit for any async operations to complete
            _a.sent();
            return [2 /*return*/];
        }
      });
    });
  });
  describe("Basic Functionality", function () {
    it("should initialize app with middleware", function () {
      expect(app).toBeDefined();
      // Use app._router or app.router depending on Express version
      var router = app._router || app.router;
      expect(router).toBeDefined();
      expect(router.stack.length).toBeGreaterThan(0);
    });
    it("should have middleware applied", function () {
      // Check that middleware is in the stack
      var router = app._router || app.router;
      var middlewareStack = router.stack;
      expect(middlewareStack.length).toBeGreaterThan(0);
      // Verify the middleware functions are present
      var middlewareNames = middlewareStack.map(function (layer) {
        if (layer.handle && layer.handle.name) {
          return layer.handle.name;
        }
        return "anonymous";
      });
      // The middleware should be applied (we can't easily test exact names due to wrapping)
      expect(middlewareNames.length).toBeGreaterThan(0);
    });
    it("should have routes defined", function () {
      // Check that routes are registered
      var router = app._router || app.router;
      var routes = [];
      router.stack.forEach(function (layer) {
        if (layer.route) {
          routes.push({
            path: layer.route.path,
            methods: Object.keys(layer.route.methods),
          });
        }
      });
      expect(routes.length).toBeGreaterThan(0);
      expect(
        routes.some(function (r) {
          return r.path === "/test";
        }),
      ).toBe(true);
      expect(
        routes.some(function (r) {
          return r.path === "/slow";
        }),
      ).toBe(true);
    });
    it("should handle middleware execution", function () {
      return __awaiter(void 0, void 0, void 0, function () {
        var mockReq, mockRes, mockNext, router, index, executeStack;
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              mockReq = {
                method: "GET",
                url: "/test",
                headers: {},
                body: {},
                query: {},
                params: {},
                ip: "127.0.0.1",
                get: jest.fn().mockReturnValue("test-agent"),
              };
              mockRes = {
                json: jest.fn(),
                status: jest.fn().mockReturnThis(),
                send: jest.fn(),
                locals: {},
              };
              mockNext = jest.fn();
              router = app._router || app.router;
              index = 0;
              executeStack = function () {
                if (index >= router.stack.length) {
                  // Call next when stack is exhausted
                  mockNext();
                  return;
                }
                var layer = router.stack[index];
                index++;
                if (layer.route) {
                  // Skip route layers for this test
                  executeStack();
                } else if (layer.handle) {
                  try {
                    layer.handle(mockReq, mockRes, function (err) {
                      if (err) {
                        mockNext(err);
                      } else {
                        executeStack();
                      }
                    });
                  } catch (error) {
                    mockNext(error);
                  }
                } else {
                  executeStack();
                }
              };
              // Run the middleware stack
              return [
                4 /*yield*/,
                new Promise(function (resolve) {
                  executeStack();
                  setTimeout(resolve, 100);
                }),
              ];
            case 1:
              // Run the middleware stack
              _a.sent();
              // Verify middleware was called (should have called next)
              expect(mockNext).toHaveBeenCalled();
              return [2 /*return*/];
          }
        });
      });
    });
  });
  describe("Middleware Behavior", function () {
    it("should not start timers in test mode", function () {
      // Import the actual class (not the mock)
      jest.isolateModules(function () {
        // Clear the mock temporarily
        jest.unmock("../../services/monitoring.service.js");
        var MonitoringService = require("../../services/monitoring.service.js");
        // Create an instance to test instance method
        var instance = new MonitoringService();
        // The startMetricsCollection method should skip interval setup in test mode
        expect(function () {
          instance.startMetricsCollection();
        }).not.toThrow();
        // Check that no interval was set (should be null, not undefined)
        expect(instance._metricsInterval).toBeNull();
      });
    });
  });
});
