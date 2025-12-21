import {
  CacheEngine,
  CacheInvalidator,
  CacheMiddleware,
} from "../../utils/cacheEngine";
import { RateLimiter, RateLimitMiddleware } from "../../utils/rateLimiter";
import { PaginationEngine, FilterEngine } from "../../utils/paginationEngine";
import {
  PerformanceMonitor,
  LoadTester,
  DatabaseMonitor,
} from "../../utils/performanceMonitor";

describe("Performance Layer Tests", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe("CacheEngine", () => {
    beforeEach(() => {
      // Reset cache state
      CacheEngine["isConnected"] = false;
    });

    it("should handle get operation when not connected", async () => {
      const result = await CacheEngine.get("test-key");
      expect(result).toBeNull();
    });

    it("should handle set operation when not connected", async () => {
      await expect(
        CacheEngine.set("test-key", "value", 300),
      ).resolves.toBeUndefined();
    });

    it("should handle delete operation when not connected", async () => {
      await expect(CacheEngine.del("test-key")).resolves.toBeUndefined();
    });

    it("should handle pattern delete when not connected", async () => {
      await expect(CacheEngine.delPattern("test-*")).resolves.toBeUndefined();
    });

    it("should handle increment operation when not connected", async () => {
      const result = await CacheEngine.incr("counter");
      expect(result).toBe(0);
    });

    it("should handle exists check when not connected", async () => {
      const result = await CacheEngine.exists("test-key");
      expect(result).toBe(false);
    });
  });

  describe("CacheInvalidator", () => {
    it("should invalidate user caches", async () => {
      const delPatternSpy = jest.spyOn(CacheEngine, "delPattern");

      await CacheInvalidator.invalidateUser("user123");

      expect(delPatternSpy).toHaveBeenCalledWith("user:user123:*");
      expect(delPatternSpy).toHaveBeenCalledWith("transactions:user:user123:*");
      expect(delPatternSpy).toHaveBeenCalledWith("balances:user:user123:*");
    });

    it("should invalidate account caches", async () => {
      const delPatternSpy = jest.spyOn(CacheEngine, "delPattern");

      await CacheInvalidator.invalidateAccount("acc123");

      expect(delPatternSpy).toHaveBeenCalledWith("account:acc123:*");
      expect(delPatternSpy).toHaveBeenCalledWith("balances:account:acc123:*");
      expect(delPatternSpy).toHaveBeenCalledWith(
        "transactions:account:acc123:*",
      );
    });

    it("should invalidate transaction caches", async () => {
      const delSpy = jest.spyOn(CacheEngine, "del");
      const delPatternSpy = jest.spyOn(CacheEngine, "delPattern");

      await CacheInvalidator.invalidateTransaction("txn123");

      expect(delSpy).toHaveBeenCalledWith("transaction:txn123");
      expect(delPatternSpy).toHaveBeenCalledWith("transactions:*:txn123:*");
    });

    it("should invalidate all financial data caches", async () => {
      const delPatternSpy = jest.spyOn(CacheEngine, "delPattern");

      await CacheInvalidator.invalidateFinancialData();

      expect(delPatternSpy).toHaveBeenCalledWith("balances:*");
      expect(delPatternSpy).toHaveBeenCalledWith("transactions:*");
      expect(delPatternSpy).toHaveBeenCalledWith("reports:*");
    });
  });

  describe("CacheMiddleware", () => {
    it("should cache method results", async () => {
      const target = {
        expensiveMethod: jest.fn().mockResolvedValue("result"),
      };

      // Apply decorator
      const descriptor = {
        value: target.expensiveMethod,
        writable: true,
        enumerable: true,
        configurable: true,
      } as PropertyDescriptor;
      CacheMiddleware.cacheResponse(300)(target, "expensiveMethod", descriptor);
      Object.defineProperty(target, "expensiveMethod", descriptor);

      const getSpy = jest.spyOn(CacheEngine, "get").mockResolvedValue(null);
      const setSpy = jest.spyOn(CacheEngine, "set").mockResolvedValue();

      const result = await target.expensiveMethod("arg1", "arg2");

      expect(result).toBe("result");
      expect(getSpy).toHaveBeenCalledWith('expensiveMethod:["arg1","arg2"]');
      expect(setSpy).toHaveBeenCalledWith(
        'expensiveMethod:["arg1","arg2"]',
        "result",
        300,
      );
    });

    it("should return cached result when available", async () => {
      const target = {
        expensiveMethod: jest.fn().mockResolvedValue("result"),
      };

      const descriptor = {
        value: target.expensiveMethod,
        writable: true,
        enumerable: true,
        configurable: true,
      } as PropertyDescriptor;
      CacheMiddleware.cacheResponse(300)(target, "expensiveMethod", descriptor);
      Object.defineProperty(target, "expensiveMethod", descriptor);

      const getSpy = jest
        .spyOn(CacheEngine, "get")
        .mockResolvedValue("cached-result");
      const setSpy = jest.spyOn(CacheEngine, "set");

      const result = await target.expensiveMethod("arg1", "arg2");

      expect(result).toBe("cached-result");
      expect(getSpy).toHaveBeenCalledWith('expensiveMethod:["arg1","arg2"]');
      expect(setSpy).not.toHaveBeenCalled();
    });

    it("should check rate limits correctly", async () => {
      const result = await CacheMiddleware.checkRateLimit("user123", 10, 60);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
      expect(typeof result.resetTime).toBe("number");
    });
  });

  describe("RateLimiter", () => {
    it("should create per-user rate limiter", () => {
      const middleware = RateLimiter.perUserLimit("api");
      expect(typeof middleware).toBe("function");
    });

    it("should create per-user rate limiter with custom limits", () => {
      const middleware = RateLimiter.perUserLimit("auth", {
        requests: 3,
        window: 120,
      });
      expect(typeof middleware).toBe("function");
    });

    it("should create per-IP adaptive throttler", () => {
      const middleware = RateLimiter.perIPAdaptive;
      expect(typeof middleware).toBe("function");
    });

    it("should create burst controller", () => {
      const middleware = RateLimiter.burstControl(10, 30);
      expect(typeof middleware).toBe("function");
    });

    it("should update IP reputation", async () => {
      const setSpy = jest.spyOn(CacheEngine, "set");

      await RateLimiter.updateIPReputation("192.168.1.1", "good");

      expect(setSpy).toHaveBeenCalled();
    });
  });

  describe("RateLimitMiddleware", () => {
    it("should combine multiple rate limiters", () => {
      const limiter1 = jest.fn();
      const limiter2 = jest.fn();
      const combined = RateLimitMiddleware.combine(limiter1, limiter2);

      expect(typeof combined).toBe("function");
    });

    it("should create tier-based rate limiter", () => {
      const tierLimits = {
        basic: { requests: 100, window: 60 },
        premium: { requests: 500, window: 60 },
      };

      const middleware = RateLimitMiddleware.byUserTier(tierLimits);
      expect(typeof middleware).toBe("function");
    });
  });

  describe("PaginationEngine", () => {
    const mockModel = {
      findMany: jest.fn(),
      count: jest.fn(),
    };

    it("should paginate with offset", async () => {
      mockModel.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      mockModel.count.mockResolvedValue(25);

      const result = await PaginationEngine.paginateWithOffset(
        mockModel,
        { page: 1, limit: 20 },
        { userId: "user123" },
      );

      expect(result.data).toHaveLength(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
      expect(result.pagination.total).toBe(25);
      expect(result.pagination.totalPages).toBe(2);
    });

    it("should paginate with cursor", async () => {
      mockModel.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);

      const result = await PaginationEngine.paginateWithCursor(
        mockModel,
        { limit: 20, cursor: "cursor123" },
        { userId: "user123" },
        "id",
      );

      expect(result.data).toHaveLength(2);
      expect(result.pagination.hasNext).toBe(false);
      expect(result.pagination.hasPrev).toBe(true);
    });

    it("should validate pagination parameters", () => {
      expect(() =>
        PaginationEngine.validatePaginationParams({ page: 0 }),
      ).toThrow();
      expect(() =>
        PaginationEngine.validatePaginationParams({ limit: 0 }),
      ).toThrow();
      expect(() =>
        PaginationEngine.validatePaginationParams({ limit: 101 }),
      ).toThrow();
      expect(() =>
        PaginationEngine.validatePaginationParams({ cursor: 123 }),
      ).toThrow();
    });

    it("should validate sort parameters", () => {
      expect(() =>
        PaginationEngine.validateSortParams({ sortBy: "invalid" }, [
          "id",
          "name",
        ]),
      ).toThrow();
      expect(() =>
        PaginationEngine.validateSortParams({ sortOrder: "invalid" }, [
          "id",
          "name",
        ]),
      ).toThrow();
    });

    it("should create pagination metadata", () => {
      const pagination = {
        page: 2,
        limit: 10,
        total: 50,
        totalPages: 5,
        hasNext: true,
        hasPrev: true,
      };

      const meta = PaginationEngine.createPaginationMeta(
        pagination,
        "https://api.example.com/items",
        { filter: "test" },
      );

      expect(meta.page).toBe(2);
      expect(meta.self).toContain("page=2");
      expect(meta.first).toContain("page=1");
      expect(meta.last).toContain("page=5");
      expect(meta.prev).toContain("page=1");
      expect(meta.next).toContain("page=3");
    });
  });

  describe("FilterEngine", () => {
    it("should build filters from query parameters", () => {
      const query = {
        search: "test",
        startDate: "2023-01-01",
        endDate: "2023-12-31",
        minAmount: "100",
        maxAmount: "1000",
        ids: "id1,id2,id3",
      };

      const filters = FilterEngine.buildFilters(query);

      expect(filters.search).toBe("test");
      expect(filters.dateRange?.start).toBeInstanceOf(Date);
      expect(filters.dateRange?.end).toBeInstanceOf(Date);
      expect(filters.numericRange?.min).toBe(100);
      expect(filters.numericRange?.max).toBe(1000);
      expect(filters.in).toEqual(["id1", "id2", "id3"]);
    });

    it("should validate filters", () => {
      expect(() =>
        FilterEngine.validateFilters({
          dateRange: {
            start: new Date("2023-12-31"),
            end: new Date("2023-01-01"),
          },
        }),
      ).toThrow();

      expect(() =>
        FilterEngine.validateFilters({
          numericRange: { min: 1000, max: 100 },
        }),
      ).toThrow();
    });
  });

  describe("PerformanceMonitor", () => {
    beforeEach(() => {
      PerformanceMonitor["metrics"].clear();
    });

    it("should start and stop timer", () => {
      const endTimer = PerformanceMonitor.startTimer("test-operation");

      // Simulate some work
      setTimeout(() => {}, 10);

      const metric = endTimer();

      expect(metric.name).toBe("test-operation");
      expect(metric.duration).toBeGreaterThanOrEqual(0);
      expect(metric.startTime).toBeLessThanOrEqual(metric.endTime);
    });

    it("should get performance statistics", () => {
      const endTimer1 = PerformanceMonitor.startTimer("test-operation");
      const endTimer2 = PerformanceMonitor.startTimer("test-operation");

      endTimer1();
      endTimer2();

      const stats = PerformanceMonitor.getStats("test-operation");

      expect(stats).not.toBeNull();
      expect(stats!.count).toBe(2);
      expect(stats!.avgDuration).toBeGreaterThanOrEqual(0);
      expect(stats!.minDuration).toBeGreaterThanOrEqual(0);
      expect(stats!.maxDuration).toBeGreaterThanOrEqual(0);
    });

    it("should monitor database queries", async () => {
      const queryFn = jest.fn().mockResolvedValue("result");

      const result = await PerformanceMonitor.monitorQuery(
        "test-query",
        queryFn,
      );

      expect(result).toBe("result");
      expect(queryFn).toHaveBeenCalled();
    });

    it("should monitor cache operations", async () => {
      const operationFn = jest.fn().mockResolvedValue("result");

      const result = await PerformanceMonitor.monitorCache(
        "get",
        "test-key",
        operationFn,
      );

      expect(result).toBe("result");
      expect(operationFn).toHaveBeenCalled();
    });

    it("should create performance middleware", () => {
      const middleware = PerformanceMonitor.performanceMiddleware();
      expect(typeof middleware).toBe("function");
    });
  });

  describe("LoadTester", () => {
    it("should run concurrent requests", async () => {
      // Mock fetch
      (global as any).fetch = jest.fn().mockResolvedValue({
        status: 200,
      });

      const result = await LoadTester.runConcurrentRequests(
        "https://api.example.com/test",
        {
          concurrency: 5,
          totalRequests: 10,
        },
      );

      expect(result.totalTime).toBeGreaterThan(0);
      expect(result.requestsPerSecond).toBeGreaterThan(0);
      expect(result.successCount).toBe(10);
      expect(result.errorCount).toBe(0);
    });

    it("should handle errors in concurrent requests", async () => {
      // Mock fetch to throw error
      (global as any).fetch = jest.fn().mockRejectedValue(new Error("Network error"));

      const result = await LoadTester.runConcurrentRequests(
        "https://api.example.com/test",
        {
          concurrency: 2,
          totalRequests: 4,
        },
      );

      expect(result.errorCount).toBe(4);
      expect(result.successCount).toBe(0);
    });

    it("should run stress test", async () => {
      (global as any).fetch = jest.fn().mockResolvedValue({
        status: 200,
      });

      const result = await LoadTester.runStressTest(
        "https://api.example.com/test",
        {
          startConcurrency: 1,
          maxConcurrency: 3,
          stepSize: 1,
          requestsPerStep: 2,
          maxErrorRate: 0.1,
        },
      );

      expect(result.results).toHaveLength(3);
      expect(result.maxSustainedConcurrency).toBeGreaterThanOrEqual(0);
    });
  });

  describe("DatabaseMonitor", () => {
    const mockPrisma = {
      $queryRaw: jest.fn(),
    };

    it("should get connection pool stats", async () => {
      mockPrisma.$queryRaw.mockResolvedValue([
        {
          total: 10,
          active: 3,
          idle: 7,
          waiting: 0,
        },
      ]);

      const stats = await DatabaseMonitor.getConnectionPoolStats(mockPrisma);

      expect(stats.totalConnections).toBe(10);
      expect(stats.activeConnections).toBe(3);
      expect(stats.idleConnections).toBe(7);
      expect(stats.waitingClients).toBe(0);
    });

    it("should handle connection pool stats error", async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error("Database error"));

      const stats = await DatabaseMonitor.getConnectionPoolStats(mockPrisma);

      expect(stats.totalConnections).toBe(0);
      expect(stats.activeConnections).toBe(0);
      expect(stats.idleConnections).toBe(0);
      expect(stats.waitingClients).toBe(0);
    });

    it("should get slow queries", async () => {
      mockPrisma.$queryRaw.mockResolvedValue([
        { query: "SELECT * FROM users", calls: 100, mean_time: 1500 },
        { query: "SELECT * FROM orders", calls: 50, mean_time: 800 },
      ]);

      const slowQueries = await DatabaseMonitor.getSlowQueries(
        mockPrisma,
        1000,
      );

      expect(slowQueries).toHaveLength(2);
      expect(slowQueries[0].mean_time).toBeGreaterThan(1000);
    });

    it("should handle slow queries error", async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error("Database error"));

      const slowQueries = await DatabaseMonitor.getSlowQueries(mockPrisma);

      expect(slowQueries).toHaveLength(0);
    });
  });
});

export {};
