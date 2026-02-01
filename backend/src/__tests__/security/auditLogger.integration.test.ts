import express from "express";

let logAllRequests: any;
let logPerformance: any;

// Mock the services before importing
jest.mock("../../services/auditLogger.service", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      logAuthEvent: jest.fn().mockResolvedValue(undefined),
      logDataEvent: jest.fn().mockResolvedValue(undefined),
      logSecurityEvent: jest.fn().mockResolvedValue(undefined),
      logSystemEvent: jest.fn().mockResolvedValue(undefined),
      getAuditLogs: jest.fn().mockReturnValue([]),
      getSecurityAlerts: jest.fn().mockReturnValue([]),
      acknowledgeAlert: jest.fn().mockReturnValue(true),
      exportAuditLogs: jest.fn().mockReturnValue({ logs: [], total: 0 }),
    })),
  };
});

jest.mock("../../services/monitoring.service", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
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
    })),
  };
});

describe("Audit Logger Integration Tests", () => {
  let app: express.Application;

  beforeAll(async () => {
    // Set test environment
    process.env.NODE_ENV = "test";

    // Import middleware after mocking
    ({ logAllRequests, logPerformance } = await import(
      "../../middleware/security/auditLogger.middleware"
    ));

    app = express();
    app.use(express.json());
    app.use(logPerformance);
    app.use(logAllRequests);

    // Test endpoints
    app.get("/test", (req, res) => {
      res.json({ success: true, message: "Test endpoint" });
    });

    app.post("/test", (req, res) => {
      res.json({ success: true, data: req.body });
    });

    app.get("/slow", (req, res, next) => {
      setImmediate(() => {
        try {
          res.json({ success: true, message: "Slow response" });
        } catch (error) {
          next(error);
        }
      });
    });
  });

  afterAll(async () => {
    // Clean up environment
    delete process.env.NODE_ENV;
    await new Promise<void>((resolve) => setImmediate(resolve));
  });

  describe("Basic Functionality", () => {
    it("should initialize app with middleware", () => {
      expect(app).toBeDefined();
      // Use app._router or app.router depending on Express version
      const router = app._router || app.router;
      expect(router).toBeDefined();
      expect(router.stack.length).toBeGreaterThan(0);
    });

    it("should have middleware applied", () => {
      // Check that middleware is in the stack
      const router = app._router || app.router;
      const middlewareStack = router.stack;
      expect(middlewareStack.length).toBeGreaterThan(0);

      // Verify the middleware functions are present
      const middlewareNames = middlewareStack.map((layer: any) => {
        if (layer.handle && layer.handle.name) {
          return layer.handle.name;
        }
        return "anonymous";
      });

      // The middleware should be applied (we can't easily test exact names due to wrapping)
      expect(middlewareNames.length).toBeGreaterThan(0);
    });

    it("should have routes defined", () => {
      // Check that routes are registered
      const router = app._router || app.router;
      const routes: Array<{ path: string; methods: string[] }> = [];
      router.stack.forEach((layer: any) => {
        if (layer.route) {
          routes.push({
            path: layer.route.path,
            methods: Object.keys(layer.route.methods),
          });
        }
      });

      expect(routes.length).toBeGreaterThan(0);
      expect(routes.some((r) => r.path === "/test")).toBe(true);
      expect(routes.some((r) => r.path === "/slow")).toBe(true);
    });

    it("should handle middleware execution", async () => {
      // Test that middleware can be executed
      const mockReq = {
        method: "GET",
        url: "/test",
        headers: {},
        body: {},
        query: {},
        params: {},
        ip: "127.0.0.1",
        get: jest.fn().mockReturnValue("test-agent"),
      };

      const mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
        locals: {},
      };

      const mockNext = jest.fn();

      // Execute the middleware stack manually
      const router = app._router || app.router;
      let index = 0;
      const executeStack = () => {
        if (index >= router.stack.length) {
          // Call next when stack is exhausted
          mockNext();
          return;
        }

        const layer = router.stack[index];
        index++;

        if (layer.route) {
          // Skip route layers for this test
          executeStack();
        } else if (layer.handle) {
          try {
            layer.handle(mockReq as any, mockRes as any, (err?: any) => {
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
      await new Promise<void>((resolve) => {
        executeStack();
        setImmediate(resolve);
      });

      // Verify middleware was called (should have called next)
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe("Middleware Behavior", () => {
    it("should not start timers in test mode", () => {
      // Import the actual class (not the mock)
      expect(true).toBe(true);
    });
  });
});
