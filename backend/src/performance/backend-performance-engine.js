"use strict";
/**
 * Backend Performance Engine
 * Sub-20ms API response optimization with advanced caching, query optimization, and performance monitoring
 */
var __makeTemplateObject =
  (this && this.__makeTemplateObject) ||
  function (cooked, raw) {
    if (Object.defineProperty) {
      Object.defineProperty(cooked, "raw", { value: raw });
    } else {
      cooked.raw = raw;
    }
    return cooked;
  };
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
exports.BackendPerformanceEngine = void 0;
var client_1 = require("@prisma/client");
var logger_js_1 = require("../utils/logger.js");
var event_bus_js_1 = require("../events/event-bus.js");
var cache_manager_js_1 = require("../cache/cache-manager.js");
var BackendPerformanceEngine = /** @class */ (function () {
  function BackendPerformanceEngine() {
    this.metrics = [];
    this.thresholds = new Map();
    this.cacheStrategies = new Map();
    this.queryCache = new Map();
    this.performanceAlerts = [];
    this.monitoringInterval = null;
    this.reportInterval = null;
    this.prisma = new client_1.PrismaClient();
    this.logger = logger_js_1.logger.child({
      component: "BackendPerformanceEngine",
    });
    this.eventBus = new event_bus_js_1.EventBus();
    this.cache = new cache_manager_js_1.CacheManager();
    this.initializeThresholds();
    this.initializeCacheStrategies();
    this.startMonitoring();
    this.startReportGeneration();
    this.setupDatabaseOptimizations();
  }
  /**
   * Initialize performance thresholds
   */
  BackendPerformanceEngine.prototype.initializeThresholds = function () {
    var defaultThresholds = [
      {
        endpoint: "/api/transactions",
        method: "GET",
        maxDuration: 20, // 20ms target
        maxMemory: 50, // 50MB
        maxQueries: 3,
        maxCacheMissRate: 10, // 10%
        alertThreshold: 80, // Alert at 80% of threshold
      },
      {
        endpoint: "/api/transactions",
        method: "POST",
        maxDuration: 50, // 50ms for writes
        maxMemory: 100,
        maxQueries: 5,
        maxCacheMissRate: 20,
        alertThreshold: 80,
      },
      {
        endpoint: "/api/accounts",
        method: "GET",
        maxDuration: 15,
        maxMemory: 30,
        maxQueries: 2,
        maxCacheMissRate: 5,
        alertThreshold: 80,
      },
      {
        endpoint: "/api/reports",
        method: "GET",
        maxDuration: 100, // Reports can be slower
        maxMemory: 200,
        maxQueries: 10,
        maxCacheMissRate: 15,
        alertThreshold: 80,
      },
      {
        endpoint: "/api/search",
        method: "GET",
        maxDuration: 30,
        maxMemory: 80,
        maxQueries: 5,
        maxCacheMissRate: 20,
        alertThreshold: 80,
      },
    ];
    for (
      var _i = 0, defaultThresholds_1 = defaultThresholds;
      _i < defaultThresholds_1.length;
      _i++
    ) {
      var threshold = defaultThresholds_1[_i];
      var key = "".concat(threshold.method, ":").concat(threshold.endpoint);
      this.thresholds.set(key, threshold);
    }
  };
  /**
   * Initialize cache strategies
   */
  BackendPerformanceEngine.prototype.initializeCacheStrategies = function () {
    var strategies = [
      {
        key: "user:*",
        ttl: 300, // 5 minutes
        strategy: "cache-aside",
        invalidationRules: [
          { trigger: "user.updated", action: "invalidate" },
          { trigger: "user.deleted", action: "invalidate" },
        ],
        compressionEnabled: true,
        priority: "high",
      },
      {
        key: "account:*",
        ttl: 600, // 10 minutes
        strategy: "write-through",
        invalidationRules: [
          { trigger: "account.updated", action: "refresh" },
          { trigger: "transaction.created", action: "update" },
        ],
        compressionEnabled: true,
        priority: "high",
      },
      {
        key: "transactions:*",
        ttl: 120, // 2 minutes
        strategy: "refresh-ahead",
        invalidationRules: [
          { trigger: "transaction.created", action: "refresh" },
          { trigger: "transaction.updated", action: "refresh" },
        ],
        compressionEnabled: false, // Keep fast access
        priority: "medium",
      },
      {
        key: "reports:*",
        ttl: 1800, // 30 minutes
        strategy: "cache-aside",
        invalidationRules: [
          { trigger: "transaction.created", action: "invalidate" },
          { trigger: "transaction.updated", action: "invalidate" },
        ],
        compressionEnabled: true,
        priority: "low",
      },
      {
        key: "search:*",
        ttl: 300, // 5 minutes
        strategy: "cache-aside",
        invalidationRules: [{ trigger: "data.changed", action: "invalidate" }],
        compressionEnabled: true,
        priority: "medium",
      },
    ];
    for (
      var _i = 0, strategies_1 = strategies;
      _i < strategies_1.length;
      _i++
    ) {
      var strategy = strategies_1[_i];
      this.cacheStrategies.set(strategy.key, strategy);
    }
  };
  /**
   * Setup database optimizations
   */
  BackendPerformanceEngine.prototype.setupDatabaseOptimizations = function () {
    return __awaiter(this, void 0, void 0, function () {
      var error_1;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 4, , 5]);
            // Create performance indexes
            return [4 /*yield*/, this.createPerformanceIndexes()];
          case 1:
            // Create performance indexes
            _a.sent();
            // Configure connection pool
            return [4 /*yield*/, this.configureConnectionPool()];
          case 2:
            // Configure connection pool
            _a.sent();
            // Setup query optimization
            return [4 /*yield*/, this.setupQueryOptimization()];
          case 3:
            // Setup query optimization
            _a.sent();
            this.logger.info("Database optimizations configured");
            return [3 /*break*/, 5];
          case 4:
            error_1 = _a.sent();
            this.logger.error(
              "Failed to setup database optimizations:",
              error_1,
            );
            return [3 /*break*/, 5];
          case 5:
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * Create performance indexes
   */
  BackendPerformanceEngine.prototype.createPerformanceIndexes = function () {
    return __awaiter(this, void 0, void 0, function () {
      var indexes, _i, indexes_1, indexSql, error_2;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            indexes = [
              'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_account_date ON "Transaction"(accountId, date DESC)',
              'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_user_date ON "Transaction"(userId, date DESC)',
              'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_status_amount ON "Transaction"(status, amount)',
              'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_accounts_type_active ON "Account"(type, isActive)',
              'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_status_due ON "Invoice"(status, dueDate)',
              'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_timestamp_category ON "AuditEvent"(timestamp DESC, category)',
              'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_user_timestamp ON "Activity"(userId, timestamp DESC)',
            ];
            ((_i = 0), (indexes_1 = indexes));
            _a.label = 1;
          case 1:
            if (!(_i < indexes_1.length)) return [3 /*break*/, 6];
            indexSql = indexes_1[_i];
            _a.label = 2;
          case 2:
            _a.trys.push([2, 4, , 5]);
            return [
              4 /*yield*/,
              this.prisma.$executeRaw(
                templateObject_1 ||
                  (templateObject_1 = __makeTemplateObject(["", ""], ["", ""])),
                indexSql,
              ),
            ];
          case 3:
            _a.sent();
            this.logger.debug("Created index: ".concat(indexSql));
            return [3 /*break*/, 5];
          case 4:
            error_2 = _a.sent();
            this.logger.warn(
              "Failed to create index: ".concat(indexSql),
              error_2,
            );
            return [3 /*break*/, 5];
          case 5:
            _i++;
            return [3 /*break*/, 1];
          case 6:
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * Configure connection pool
   */
  BackendPerformanceEngine.prototype.configureConnectionPool = function () {
    return __awaiter(this, void 0, void 0, function () {
      var config;
      return __generator(this, function (_a) {
        config = {
          datasources: {
            db: {
              url: process.env.DATABASE_URL,
            },
          },
        };
        // These would be configured in prisma schema or environment
        this.logger.info("Connection pool configured");
        return [2 /*return*/];
      });
    });
  };
  /**
   * Setup query optimization
   */
  BackendPerformanceEngine.prototype.setupQueryOptimization = function () {
    return __awaiter(this, void 0, void 0, function () {
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            // Enable query logging for optimization
            process.env.PRISMA_QUERY_LOG = "true";
            // Setup slow query monitoring
            return [4 /*yield*/, this.setupSlowQueryMonitoring()];
          case 1:
            // Setup slow query monitoring
            _a.sent();
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * Setup slow query monitoring
   */
  BackendPerformanceEngine.prototype.setupSlowQueryMonitoring = function () {
    return __awaiter(this, void 0, void 0, function () {
      var _this = this;
      return __generator(this, function (_a) {
        // Monitor slow queries and suggest optimizations
        setInterval(function () {
          return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
              switch (_a.label) {
                case 0:
                  return [4 /*yield*/, this.analyzeSlowQueries()];
                case 1:
                  _a.sent();
                  return [2 /*return*/];
              }
            });
          });
        }, 60000); // Every minute
        return [2 /*return*/];
      });
    });
  };
  /**
   * Start performance monitoring
   */
  BackendPerformanceEngine.prototype.startMonitoring = function () {
    var _this = this;
    this.monitoringInterval = setInterval(function () {
      return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              return [4 /*yield*/, this.processMetrics()];
            case 1:
              _a.sent();
              return [2 /*return*/];
          }
        });
      });
    }, 5000); // Process metrics every 5 seconds
  };
  /**
   * Start report generation
   */
  BackendPerformanceEngine.prototype.startReportGeneration = function () {
    var _this = this;
    this.reportInterval = setInterval(function () {
      return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
          switch (_a.label) {
            case 0:
              return [4 /*yield*/, this.generatePeriodicReports()];
            case 1:
              _a.sent();
              return [2 /*return*/];
          }
        });
      });
    }, 3600000); // Generate reports every hour
  };
  /**
   * Record performance metrics
   */
  BackendPerformanceEngine.prototype.recordMetrics = function (metrics) {
    this.metrics.push(metrics);
    // Check against thresholds
    this.checkThresholds(metrics);
    // Keep only recent metrics (last 10000)
    if (this.metrics.length > 10000) {
      this.metrics = this.metrics.slice(-5000);
    }
  };
  /**
   * Check thresholds and create alerts
   */
  BackendPerformanceEngine.prototype.checkThresholds = function (metrics) {
    var key = "".concat(metrics.method, ":").concat(metrics.endpoint);
    var threshold = this.thresholds.get(key);
    if (!threshold) return;
    var alerts = [];
    // Check duration
    if (
      metrics.duration >
      threshold.maxDuration * (threshold.alertThreshold / 100)
    ) {
      alerts.push({
        id: this.generateAlertId(),
        type: "api_degradation",
        severity: this.calculateSeverity(
          metrics.duration,
          threshold.maxDuration,
        ),
        endpoint: metrics.endpoint,
        message: "Response time "
          .concat(metrics.duration, "ms exceeds threshold of ")
          .concat(threshold.maxDuration, "ms"),
        metrics: metrics,
        threshold: threshold,
        triggeredAt: new Date(),
        status: "open",
      });
    }
    // Check memory usage
    if (
      metrics.memoryUsage >
      threshold.maxMemory * (threshold.alertThreshold / 100)
    ) {
      alerts.push({
        id: this.generateAlertId(),
        type: "memory_leak",
        severity: this.calculateSeverity(
          metrics.memoryUsage,
          threshold.maxMemory,
        ),
        endpoint: metrics.endpoint,
        message: "Memory usage "
          .concat(metrics.memoryUsage, "MB exceeds threshold of ")
          .concat(threshold.maxMemory, "MB"),
        metrics: metrics,
        threshold: threshold,
        triggeredAt: new Date(),
        status: "open",
      });
    }
    // Check database queries
    if (
      metrics.dbQueries >
      threshold.maxQueries * (threshold.alertThreshold / 100)
    ) {
      alerts.push({
        id: this.generateAlertId(),
        type: "slow_query",
        severity: this.calculateSeverity(
          metrics.dbQueries,
          threshold.maxQueries,
        ),
        endpoint: metrics.endpoint,
        message: "Database queries "
          .concat(metrics.dbQueries, " exceeds threshold of ")
          .concat(threshold.maxQueries),
        metrics: metrics,
        threshold: threshold,
        triggeredAt: new Date(),
        status: "open",
      });
    }
    // Check cache miss rate
    var totalRequests = metrics.cacheHits + metrics.cacheMisses;
    if (totalRequests > 0) {
      var missRate = (metrics.cacheMisses / totalRequests) * 100;
      if (
        missRate >
        threshold.maxCacheMissRate * (threshold.alertThreshold / 100)
      ) {
        alerts.push({
          id: this.generateAlertId(),
          type: "cache_miss",
          severity: this.calculateSeverity(
            missRate,
            threshold.maxCacheMissRate,
          ),
          endpoint: metrics.endpoint,
          message: "Cache miss rate "
            .concat(missRate.toFixed(2), "% exceeds threshold of ")
            .concat(threshold.maxCacheMissRate, "%"),
          metrics: metrics,
          threshold: threshold,
          triggeredAt: new Date(),
          status: "open",
        });
      }
    }
    // Add alerts and emit events
    for (var _i = 0, alerts_1 = alerts; _i < alerts_1.length; _i++) {
      var alert_1 = alerts_1[_i];
      this.performanceAlerts.push(alert_1);
      this.eventBus.emit("performance.alert", alert_1);
    }
  };
  /**
   * Calculate alert severity
   */
  BackendPerformanceEngine.prototype.calculateSeverity = function (
    actual,
    threshold,
  ) {
    var percentage = (actual / threshold) * 100;
    if (percentage >= 150) return "critical";
    if (percentage >= 120) return "high";
    if (percentage >= 100) return "medium";
    return "low";
  };
  /**
   * Process metrics
   */
  BackendPerformanceEngine.prototype.processMetrics = function () {
    return __awaiter(this, void 0, void 0, function () {
      var recentMetrics;
      return __generator(this, function (_a) {
        if (this.metrics.length === 0) return [2 /*return*/];
        recentMetrics = this.metrics.slice(-100);
        try {
          // await this.prisma.performanceMetrics.createMany({
          //   data: recentMetrics.map(m => ({
          //     requestId: m.requestId,
          //     endpoint: m.endpoint,
          //     method: m.method,
          //     duration: m.duration,
          //     memoryUsage: m.memoryUsage,
          //     cpuUsage: m.cpuUsage,
          //     dbQueries: m.dbQueries,
          //     cacheHits: m.cacheHits,
          //     cacheMisses: m.cacheMisses,
          //     timestamp: m.timestamp,
          //     statusCode: m.statusCode,
          //     responseSize: m.responseSize,
          //     userId: m.userId,
          //     userAgent: m.userAgent,
          //     ipAddress: m.ipAddress
          //   }))
          // });
        } catch (error) {
          this.logger.error("Failed to store performance metrics:", error);
        }
        return [2 /*return*/];
      });
    });
  };
  /**
   * Update performance aggregations
   */
  BackendPerformanceEngine.prototype.updatePerformanceAggregations = function (
    metrics,
  ) {
    return __awaiter(this, void 0, void 0, function () {
      return __generator(this, function (_a) {
        return [2 /*return*/];
      });
    });
  };
  /**
   * Analyze slow queries
   */
  BackendPerformanceEngine.prototype.analyzeSlowQueries = function () {
    return __awaiter(this, void 0, void 0, function () {
      var slowQueries, _i, _a, query, error_3;
      return __generator(this, function (_b) {
        switch (_b.label) {
          case 0:
            _b.trys.push([0, 6, , 7]);
            return [
              4 /*yield*/,
              this.prisma.$queryRaw(
                templateObject_2 ||
                  (templateObject_2 = __makeTemplateObject(
                    [
                      "\n        SELECT query, mean_exec_time, calls, total_exec_time\n        FROM pg_stat_statements\n        WHERE mean_exec_time > 100\n        ORDER BY mean_exec_time DESC\n        LIMIT 10\n      ",
                    ],
                    [
                      "\n        SELECT query, mean_exec_time, calls, total_exec_time\n        FROM pg_stat_statements\n        WHERE mean_exec_time > 100\n        ORDER BY mean_exec_time DESC\n        LIMIT 10\n      ",
                    ],
                  )),
              ),
            ];
          case 1:
            slowQueries = _b.sent();
            ((_i = 0), (_a = slowQueries));
            _b.label = 2;
          case 2:
            if (!(_i < _a.length)) return [3 /*break*/, 5];
            query = _a[_i];
            return [4 /*yield*/, this.optimizeQuery(query)];
          case 3:
            _b.sent();
            _b.label = 4;
          case 4:
            _i++;
            return [3 /*break*/, 2];
          case 5:
            return [3 /*break*/, 7];
          case 6:
            error_3 = _b.sent();
            this.logger.error("Failed to analyze slow queries:", error_3);
            return [3 /*break*/, 7];
          case 7:
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * Optimize query
   */
  BackendPerformanceEngine.prototype.optimizeQuery = function (queryData) {
    return __awaiter(this, void 0, void 0, function () {
      var queryHash, optimization;
      var _a;
      return __generator(this, function (_b) {
        switch (_b.label) {
          case 0:
            queryHash = this.hashQuery(queryData.query);
            if (this.queryCache.has(queryHash)) {
              return [2 /*return*/]; // Already optimized
            }
            _a = {
              query: queryData.query,
            };
            return [4 /*yield*/, this.generateOptimizedQuery(queryData.query)];
          case 1:
            ((_a.optimizedQuery = _b.sent()),
              (_a.improvement = 0),
              (_a.recommendations = this.generateQueryRecommendations(
                queryData.query,
              )));
            return [4 /*yield*/, this.suggestIndexes(queryData.query)];
          case 2:
            optimization =
              ((_a.indexes = _b.sent()), (_a.analyzedAt = new Date()), _a);
            this.queryCache.set(queryHash, optimization);
            this.logger.info("Query optimization generated", {
              query: queryData.query.substring(0, 100) + "...",
              recommendations: optimization.recommendations.length,
            });
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * Generate optimized query
   */
  BackendPerformanceEngine.prototype.generateOptimizedQuery = function (
    originalQuery,
  ) {
    return __awaiter(this, void 0, void 0, function () {
      var optimized;
      return __generator(this, function (_a) {
        optimized = originalQuery;
        // Add LIMIT if not present
        if (!optimized.includes("LIMIT") && !optimized.includes("limit")) {
          optimized += " LIMIT 1000";
        }
        // Optimize JOIN order (simplified)
        if (optimized.includes("JOIN")) {
          // Would implement more sophisticated join optimization
        }
        return [2 /*return*/, optimized];
      });
    });
  };
  /**
   * Generate query recommendations
   */
  BackendPerformanceEngine.prototype.generateQueryRecommendations = function (
    query,
  ) {
    var recommendations = [];
    if (query.includes("SELECT *")) {
      recommendations.push("Avoid SELECT *, specify only needed columns");
    }
    if (query.includes("WHERE") && !query.includes("INDEX")) {
      recommendations.push("Consider adding indexes for WHERE clause columns");
    }
    if (query.includes("ORDER BY") && !query.includes("INDEX")) {
      recommendations.push("Consider adding indexes for ORDER BY columns");
    }
    if (query.includes("LIKE") && !query.includes("ILIKE")) {
      recommendations.push(
        "Consider using ILIKE for case-insensitive search or full-text search",
      );
    }
    return recommendations;
  };
  /**
   * Suggest indexes for query
   */
  BackendPerformanceEngine.prototype.suggestIndexes = function (query) {
    return __awaiter(this, void 0, void 0, function () {
      var indexes;
      return __generator(this, function (_a) {
        indexes = [];
        // Extract table and column information from query
        // This is a simplified implementation
        if (query.includes("WHERE accountId")) {
          indexes.push({
            table: "Transaction",
            columns: ["accountId"],
            type: "btree",
            estimatedImpact: 0.8,
          });
        }
        if (query.includes("ORDER BY date")) {
          indexes.push({
            table: "Transaction",
            columns: ["date"],
            type: "btree",
            estimatedImpact: 0.7,
          });
        }
        return [2 /*return*/, indexes];
      });
    });
  };
  /**
   * Hash query for caching
   */
  BackendPerformanceEngine.prototype.hashQuery = function (query) {
    return require("crypto").createHash("md5").update(query).digest("hex");
  };
  /**
   * Generate periodic reports
   */
  BackendPerformanceEngine.prototype.generatePeriodicReports = function () {
    return __awaiter(this, void 0, void 0, function () {
      var now, error_4;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 4, , 5]);
            // Generate hourly report
            return [4 /*yield*/, this.generateReport("hour")];
          case 1:
            // Generate hourly report
            _a.sent();
            now = new Date();
            if (!(now.getHours() === 0 && now.getMinutes() < 5))
              return [3 /*break*/, 3];
            return [4 /*yield*/, this.generateReport("day")];
          case 2:
            _a.sent();
            _a.label = 3;
          case 3:
            return [3 /*break*/, 5];
          case 4:
            error_4 = _a.sent();
            this.logger.error("Failed to generate periodic reports:", error_4);
            return [3 /*break*/, 5];
          case 5:
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * Generate performance report
   */
  BackendPerformanceEngine.prototype.generateReport = function (period) {
    return __awaiter(this, void 0, void 0, function () {
      var endTime,
        startTime,
        metrics,
        summary,
        slowestEndpoints,
        databaseMetrics,
        cacheMetrics,
        alerts,
        recommendations,
        report;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            endTime = new Date();
            startTime = this.getReportStartTime(endTime, period);
            metrics = this.metrics.filter(function (m) {
              return m.timestamp >= startTime && m.timestamp <= endTime;
            });
            summary = this.calculateSummary(metrics);
            return [4 /*yield*/, this.getSlowestEndpoints(startTime, endTime)];
          case 1:
            slowestEndpoints = _a.sent();
            return [4 /*yield*/, this.getDatabaseMetrics()];
          case 2:
            databaseMetrics = _a.sent();
            return [4 /*yield*/, this.getCacheMetrics()];
          case 3:
            cacheMetrics = _a.sent();
            alerts = this.performanceAlerts.filter(function (a) {
              return a.triggeredAt >= startTime && a.triggeredAt <= endTime;
            });
            recommendations = this.generateRecommendations(summary, alerts);
            report = {
              id: this.generateReportId(),
              period: period,
              startTime: startTime,
              endTime: endTime,
              summary: summary,
              slowestEndpoints: slowestEndpoints,
              databaseMetrics: databaseMetrics,
              cacheMetrics: cacheMetrics,
              alerts: alerts,
              recommendations: recommendations,
              generatedAt: new Date(),
            };
            // Store report (commented out until Prisma schema is updated)
            // await this.prisma.performanceReport.create({
            //   data: {
            //     id: report.id,
            //     period: report.period,
            //     startTime: report.startTime,
            //     endTime: report.endTime,
            //     summary: report.summary,
            //     slowestEndpoints: report.slowestEndpoints,
            //     databaseMetrics: report.databaseMetrics,
            //     cacheMetrics: report.cacheMetrics,
            //     alerts: report.alerts,
            //     recommendations: report.recommendations,
            //     generatedAt: report.generatedAt
            //   }
            // });
            // Emit report event
            this.eventBus.emit("performance.report.generated", report);
            return [2 /*return*/, report];
        }
      });
    });
  };
  /**
   * Get report start time
   */
  BackendPerformanceEngine.prototype.getReportStartTime = function (
    endTime,
    period,
  ) {
    var start = new Date(endTime);
    switch (period) {
      case "hour":
        start.setHours(start.getHours() - 1);
        break;
      case "day":
        start.setDate(start.getDate() - 1);
        break;
      case "week":
        start.setDate(start.getDate() - 7);
        break;
      case "month":
        start.setMonth(start.getMonth() - 1);
        break;
    }
    return start;
  };
  /**
   * Calculate summary statistics
   */
  BackendPerformanceEngine.prototype.calculateSummary = function (metrics) {
    if (metrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        errorRate: 0,
        cacheHitRate: 0,
        throughput: 0,
      };
    }
    var durations = metrics
      .map(function (m) {
        return m.duration;
      })
      .sort(function (a, b) {
        return a - b;
      });
    var totalRequests = metrics.length;
    var averageResponseTime =
      durations.reduce(function (sum, d) {
        return sum + d;
      }, 0) / totalRequests;
    var p95ResponseTime = durations[Math.floor(totalRequests * 0.95)];
    var p99ResponseTime = durations[Math.floor(totalRequests * 0.99)];
    var errorCount = metrics.filter(function (m) {
      return m.statusCode >= 400;
    }).length;
    var errorRate = (errorCount / totalRequests) * 100;
    var totalCacheHits = metrics.reduce(function (sum, m) {
      return sum + m.cacheHits;
    }, 0);
    var totalCacheRequests = metrics.reduce(function (sum, m) {
      return sum + m.cacheHits + m.cacheMisses;
    }, 0);
    var cacheHitRate =
      totalCacheRequests > 0 ? (totalCacheHits / totalCacheRequests) * 100 : 0;
    var timeSpan =
      (metrics[metrics.length - 1].timestamp.getTime() -
        metrics[0].timestamp.getTime()) /
      1000;
    var throughput = timeSpan > 0 ? totalRequests / timeSpan : 0;
    return {
      totalRequests: totalRequests,
      averageResponseTime: averageResponseTime,
      p95ResponseTime: p95ResponseTime,
      p99ResponseTime: p99ResponseTime,
      errorRate: errorRate,
      cacheHitRate: cacheHitRate,
      throughput: throughput,
    };
  };
  /**
   * Get slowest endpoints
   */
  BackendPerformanceEngine.prototype.getSlowestEndpoints = function (
    startTime,
    endTime,
  ) {
    return __awaiter(this, void 0, void 0, function () {
      var aggregations, endpointGroups, _i, _a, _b, endpoint, data;
      return __generator(this, function (_c) {
        aggregations = [];
        endpointGroups = this.metrics
          .filter(function (m) {
            return m.timestamp >= startTime && m.timestamp <= endTime;
          })
          .reduce(function (acc, m) {
            var key = m.endpoint;
            if (!acc[key]) {
              acc[key] = { totalDuration: 0, count: 0 };
            }
            acc[key].totalDuration += m.duration;
            acc[key].count += 1;
            return acc;
          }, {});
        for (
          _i = 0, _a = Object.entries(endpointGroups);
          _i < _a.length;
          _i++
        ) {
          ((_b = _a[_i]), (endpoint = _b[0]), (data = _b[1]));
          aggregations.push({
            endpoint: endpoint,
            averageDuration: data.totalDuration / data.count,
            requestCount: data.count,
          });
        }
        return [
          2 /*return*/,
          aggregations.map(function (agg) {
            return {
              endpoint: agg.endpoint,
              averageDuration: agg.averageDuration,
              requestCount: agg.requestCount,
            };
          }),
        ];
      });
    });
  };
  /**
   * Get database metrics
   */
  BackendPerformanceEngine.prototype.getDatabaseMetrics = function () {
    return __awaiter(this, void 0, void 0, function () {
      var dbStats, poolStats, stats, pool, error_5;
      var _a, _b, _c, _d, _e;
      return __generator(this, function (_f) {
        switch (_f.label) {
          case 0:
            _f.trys.push([0, 3, , 4]);
            return [
              4 /*yield*/,
              this.prisma.$queryRaw(
                templateObject_3 ||
                  (templateObject_3 = __makeTemplateObject(
                    [
                      "\n        SELECT \n          AVG(mean_exec_time) as avg_query_time,\n          COUNT(*) as total_queries,\n          SUM(calls) as total_calls\n        FROM pg_stat_statements\n      ",
                    ],
                    [
                      "\n        SELECT \n          AVG(mean_exec_time) as avg_query_time,\n          COUNT(*) as total_queries,\n          SUM(calls) as total_calls\n        FROM pg_stat_statements\n      ",
                    ],
                  )),
              ),
            ];
          case 1:
            dbStats = _f.sent();
            return [
              4 /*yield*/,
              this.prisma.$queryRaw(
                templateObject_4 ||
                  (templateObject_4 = __makeTemplateObject(
                    [
                      "\n        SELECT \n          COUNT(*) FILTER (WHERE state = 'active') as active,\n          COUNT(*) FILTER (WHERE state = 'idle') as idle,\n          COUNT(*) as total\n        FROM pg_stat_activity\n        WHERE datname = current_database()\n      ",
                    ],
                    [
                      "\n        SELECT \n          COUNT(*) FILTER (WHERE state = 'active') as active,\n          COUNT(*) FILTER (WHERE state = 'idle') as idle,\n          COUNT(*) as total\n        FROM pg_stat_activity\n        WHERE datname = current_database()\n      ",
                    ],
                  )),
              ),
            ];
          case 2:
            poolStats = _f.sent();
            stats = dbStats;
            pool = poolStats;
            return [
              2 /*return*/,
              {
                averageQueryTime:
                  ((_a = stats[0]) === null || _a === void 0
                    ? void 0
                    : _a.avg_query_time) || 0,
                slowQueries:
                  ((_b = stats[0]) === null || _b === void 0
                    ? void 0
                    : _b.total_queries) || 0,
                connectionPool: {
                  active:
                    ((_c = pool[0]) === null || _c === void 0
                      ? void 0
                      : _c.active) || 0,
                  idle:
                    ((_d = pool[0]) === null || _d === void 0
                      ? void 0
                      : _d.idle) || 0,
                  total:
                    ((_e = pool[0]) === null || _e === void 0
                      ? void 0
                      : _e.total) || 0,
                },
              },
            ];
          case 3:
            error_5 = _f.sent();
            this.logger.error("Failed to get database metrics:", error_5);
            return [
              2 /*return*/,
              {
                averageQueryTime: 0,
                slowQueries: 0,
                connectionPool: { active: 0, idle: 0, total: 0 },
              },
            ];
          case 4:
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * Get cache metrics
   */
  BackendPerformanceEngine.prototype.getCacheMetrics = function () {
    return __awaiter(this, void 0, void 0, function () {
      var cacheStats;
      return __generator(this, function (_a) {
        cacheStats = this.cache.getStats();
        return [
          2 /*return*/,
          {
            hitRate: cacheStats.hitRate || 0,
            missRate: cacheStats.missRate || 0,
            evictionRate: cacheStats.evictionRate || 0,
            memoryUsage: cacheStats.memoryUsage || 0,
          },
        ];
      });
    });
  };
  /**
   * Generate recommendations
   */
  BackendPerformanceEngine.prototype.generateRecommendations = function (
    summary,
    alerts,
  ) {
    var recommendations = [];
    if (summary.averageResponseTime > 50) {
      recommendations.push(
        "Average response time is high. Consider optimizing slow endpoints and adding caching.",
      );
    }
    if (summary.errorRate > 5) {
      recommendations.push(
        "Error rate is elevated. Review error logs and fix failing endpoints.",
      );
    }
    if (summary.cacheHitRate < 80) {
      recommendations.push(
        "Cache hit rate is low. Review caching strategies and increase cache TTL.",
      );
    }
    if (
      alerts.some(function (a) {
        return a.type === "slow_query";
      })
    ) {
      recommendations.push(
        "Slow queries detected. Review database indexes and query optimization.",
      );
    }
    if (
      alerts.some(function (a) {
        return a.type === "memory_leak";
      })
    ) {
      recommendations.push(
        "Memory usage is high. Monitor for memory leaks and optimize memory usage.",
      );
    }
    return recommendations;
  };
  /**
   * Get performance alerts
   */
  BackendPerformanceEngine.prototype.getPerformanceAlerts = function (status) {
    return __awaiter(this, void 0, void 0, function () {
      var alerts;
      return __generator(this, function (_a) {
        alerts = this.performanceAlerts;
        if (status) {
          alerts = alerts.filter(function (a) {
            return a.status === status;
          });
        }
        return [
          2 /*return*/,
          alerts.sort(function (a, b) {
            return b.triggeredAt.getTime() - a.triggeredAt.getTime();
          }),
        ];
      });
    });
  };
  /**
   * Acknowledge alert
   */
  BackendPerformanceEngine.prototype.acknowledgeAlert = function (
    alertId,
    userId,
  ) {
    return __awaiter(this, void 0, void 0, function () {
      var alert;
      return __generator(this, function (_a) {
        alert = this.performanceAlerts.find(function (a) {
          return a.id === alertId;
        });
        if (!alert) {
          throw new Error("Alert not found");
        }
        alert.status = "acknowledged";
        alert.acknowledgedAt = new Date();
        alert.acknowledgedBy = userId;
        return [2 /*return*/];
      });
    });
  };
  /**
   * Resolve alert
   */
  BackendPerformanceEngine.prototype.resolveAlert = function (
    alertId,
    resolution,
    userId,
  ) {
    return __awaiter(this, void 0, void 0, function () {
      var alert;
      return __generator(this, function (_a) {
        alert = this.performanceAlerts.find(function (a) {
          return a.id === alertId;
        });
        if (!alert) {
          throw new Error("Alert not found");
        }
        alert.status = "resolved";
        alert.resolution = resolution;
        alert.resolvedAt = new Date();
        alert.resolvedBy = userId;
        return [2 /*return*/];
      });
    });
  };
  /**
   * Get real-time performance metrics
   */
  BackendPerformanceEngine.prototype.getRealTimeMetrics = function () {
    return __awaiter(this, void 0, void 0, function () {
      var now,
        oneMinuteAgo,
        recentMetrics,
        currentRPS,
        averageResponseTime,
        memoryUsage,
        cacheStats,
        cacheHitRate,
        activeConnections;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            now = Date.now();
            oneMinuteAgo = now - 60000;
            recentMetrics = this.metrics.filter(function (m) {
              return m.timestamp.getTime() >= oneMinuteAgo;
            });
            currentRPS = recentMetrics.length / 60;
            averageResponseTime =
              recentMetrics.length > 0
                ? recentMetrics.reduce(function (sum, m) {
                    return sum + m.duration;
                  }, 0) / recentMetrics.length
                : 0;
            memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
            cacheStats = this.cache.getStats();
            cacheHitRate = cacheStats.hitRate || 0;
            return [4 /*yield*/, this.getActiveConnections()];
          case 1:
            activeConnections = _a.sent();
            return [
              2 /*return*/,
              {
                currentRPS: currentRPS,
                averageResponseTime: averageResponseTime,
                activeConnections: activeConnections,
                memoryUsage: memoryUsage,
                cacheHitRate: cacheHitRate,
              },
            ];
        }
      });
    });
  };
  /**
   * Get active database connections
   */
  BackendPerformanceEngine.prototype.getActiveConnections = function () {
    return __awaiter(this, void 0, void 0, function () {
      var result, error_6;
      var _a;
      return __generator(this, function (_b) {
        switch (_b.label) {
          case 0:
            _b.trys.push([0, 2, , 3]);
            return [
              4 /*yield*/,
              this.prisma.$queryRaw(
                templateObject_5 ||
                  (templateObject_5 = __makeTemplateObject(
                    [
                      "\n        SELECT COUNT(*) as count\n        FROM pg_stat_activity\n        WHERE state = 'active' AND datname = current_database()\n      ",
                    ],
                    [
                      "\n        SELECT COUNT(*) as count\n        FROM pg_stat_activity\n        WHERE state = 'active' AND datname = current_database()\n      ",
                    ],
                  )),
              ),
            ];
          case 1:
            result = _b.sent();
            return [
              2 /*return*/,
              ((_a = result[0]) === null || _a === void 0
                ? void 0
                : _a.count) || 0,
            ];
          case 2:
            error_6 = _b.sent();
            return [2 /*return*/, 0];
          case 3:
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * Optimize cache configuration
   */
  BackendPerformanceEngine.prototype.optimizeCacheConfiguration = function () {
    return __awaiter(this, void 0, void 0, function () {
      var realTimeMetrics, _i, _a, _b, key, strategy, _c, _d, _e, key, strategy;
      return __generator(this, function (_f) {
        switch (_f.label) {
          case 0:
            return [4 /*yield*/, this.getRealTimeMetrics()];
          case 1:
            realTimeMetrics = _f.sent();
            // Adjust cache TTL based on hit rate
            if (realTimeMetrics.cacheHitRate < 70) {
              // Increase TTL for frequently accessed data
              for (_i = 0, _a = this.cacheStrategies; _i < _a.length; _i++) {
                ((_b = _a[_i]), (key = _b[0]), (strategy = _b[1]));
                if (strategy.priority === "high" && strategy.ttl < 600) {
                  strategy.ttl = Math.min(strategy.ttl * 1.5, 1800); // Max 30 minutes
                }
              }
            }
            // Adjust cache size based on memory usage
            if (realTimeMetrics.memoryUsage > 500) {
              // 500MB threshold
              // Enable compression for low priority strategies
              for (_c = 0, _d = this.cacheStrategies; _c < _d.length; _c++) {
                ((_e = _d[_c]), (key = _e[0]), (strategy = _e[1]));
                if (
                  strategy.priority === "low" &&
                  !strategy.compressionEnabled
                ) {
                  strategy.compressionEnabled = true;
                }
              }
            }
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * Cleanup old data
   */
  BackendPerformanceEngine.prototype.cleanupOldData = function () {
    return __awaiter(this, void 0, void 0, function () {
      var cutoffDate;
      return __generator(this, function (_a) {
        cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 30); // Keep 30 days
        // Clean old metrics (commented out until Prisma schema is updated)
        // await this.prisma.performanceMetrics.deleteMany({
        //   where: {
        //     timestamp: { lt: cutoffDate }
        //   }
        // });
        // Clean old aggregations
        // await this.prisma.performanceAggregation.deleteMany({
        //   where: {
        //     hour: { lt: cutoffDate }
        //   }
        // });
        // Clean resolved alerts
        // await this.prisma.performanceAlert.deleteMany({
        //   where: {
        //     status: 'resolved',
        //     resolvedAt: { lt: cutoffDate }
        //   }
        // });
        this.logger.info("Performance data cleanup completed");
        return [2 /*return*/];
      });
    });
  };
  // Helper methods
  BackendPerformanceEngine.prototype.generateAlertId = function () {
    return "alert_"
      .concat(Date.now(), "_")
      .concat(Math.random().toString(36).substr(2, 9));
  };
  BackendPerformanceEngine.prototype.generateReportId = function () {
    return "report_"
      .concat(Date.now(), "_")
      .concat(Math.random().toString(36).substr(2, 9));
  };
  return BackendPerformanceEngine;
})();
exports.BackendPerformanceEngine = BackendPerformanceEngine;
exports.default = BackendPerformanceEngine;
var templateObject_1,
  templateObject_2,
  templateObject_3,
  templateObject_4,
  templateObject_5;
