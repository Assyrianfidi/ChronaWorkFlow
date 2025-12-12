"use strict";
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
var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
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
exports.DatabaseMonitor =
  exports.LoadTester =
  exports.PerformanceMonitor =
    void 0;
var logger_js_1 = require("./logger.js");
/**
 * Performance monitoring and benchmarking utilities
 */
var PerformanceMonitor = /** @class */ (function () {
  function PerformanceMonitor() {}
  /**
   * Start timing a performance metric
   */
  PerformanceMonitor.startTimer = function (name, metadata) {
    var _this = this;
    var startTime = Date.now();
    return function () {
      var endTime = Date.now();
      var duration = endTime - startTime;
      var metric = {
        name: name,
        startTime: startTime,
        endTime: endTime,
        duration: duration,
        metadata: metadata,
      };
      // Store metric
      if (!_this.metrics.has(name)) {
        _this.metrics.set(name, []);
      }
      _this.metrics.get(name).push(metric);
      // Keep only last 100 metrics per name
      var metrics = _this.metrics.get(name);
      if (metrics.length > 100) {
        metrics.shift();
      }
      // Log slow operations
      if (duration > _this.SLOW_REQUEST_THRESHOLD) {
        logger_js_1.logger.info({
          type: "WARNING",
          message: "Slow operation detected",
          details: {
            name: name,
            duration: "".concat(duration, "ms"),
            threshold: "".concat(_this.SLOW_REQUEST_THRESHOLD, "ms"),
            metadata: metadata,
          },
        });
      }
      return metric;
    };
  };
  /**
   * Get performance statistics
   */
  PerformanceMonitor.getStats = function (name) {
    var metrics = this.metrics.get(name);
    if (!metrics || metrics.length === 0) return null;
    var durations = metrics
      .map(function (m) {
        return m.duration;
      })
      .sort(function (a, b) {
        return a - b;
      });
    var count = durations.length;
    var sum = durations.reduce(function (a, b) {
      return a + b;
    }, 0);
    return {
      count: count,
      avgDuration: sum / count,
      minDuration: durations[0],
      maxDuration: durations[count - 1],
      p95Duration: durations[Math.floor(count * 0.95)],
      p99Duration: durations[Math.floor(count * 0.99)],
    };
  };
  /**
   * Performance monitoring middleware
   */
  PerformanceMonitor.performanceMiddleware = function () {
    var _this = this;
    return function (req, res, next) {
      var endTimer = _this.startTimer("http_request", {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      });
      // Override res.end to capture response time
      var originalEnd = res.end;
      res.end = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
          args[_i] = arguments[_i];
        }
        var metric = endTimer();
        // Add performance headers
        res.set("X-Response-Time", "".concat(metric.duration, "ms"));
        // Log request performance
        logger_js_1.logger.info({
          type: "INFO",
          message: "HTTP request completed",
          details: {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration: metric.duration,
            ip: req.ip,
          },
        });
        // Call original end with proper context
        return originalEnd.apply(this, args);
      };
      next();
    };
  };
  /**
   * Database query performance monitor
   */
  PerformanceMonitor.monitorQuery = function (queryName, queryFn, metadata) {
    return __awaiter(this, void 0, void 0, function () {
      var endTimer, result, metric, error_1;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            endTimer = this.startTimer("db_query_".concat(queryName), metadata);
            _a.label = 1;
          case 1:
            _a.trys.push([1, 3, , 4]);
            return [4 /*yield*/, queryFn()];
          case 2:
            result = _a.sent();
            metric = endTimer();
            // Log slow queries
            if (metric.duration > this.SLOW_QUERY_THRESHOLD) {
              logger_js_1.logger.info({
                type: "WARNING",
                message: "Slow database query detected",
                details: {
                  queryName: queryName,
                  duration: "".concat(metric.duration, "ms"),
                  threshold: "".concat(this.SLOW_QUERY_THRESHOLD, "ms"),
                  metadata: metadata,
                },
              });
            }
            return [2 /*return*/, result];
          case 3:
            error_1 = _a.sent();
            endTimer();
            throw error_1;
          case 4:
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * Cache performance monitor
   */
  PerformanceMonitor.monitorCache = function (operation, key, operationFn) {
    return __awaiter(this, void 0, void 0, function () {
      var endTimer, result, error_2;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            endTimer = this.startTimer("cache_".concat(operation), {
              key: key,
            });
            _a.label = 1;
          case 1:
            _a.trys.push([1, 3, , 4]);
            return [4 /*yield*/, operationFn()];
          case 2:
            result = _a.sent();
            endTimer();
            return [2 /*return*/, result];
          case 3:
            error_2 = _a.sent();
            endTimer();
            throw error_2;
          case 4:
            return [2 /*return*/];
        }
      });
    });
  };
  PerformanceMonitor.metrics = new Map();
  PerformanceMonitor.SLOW_QUERY_THRESHOLD = 1000; // ms
  PerformanceMonitor.SLOW_REQUEST_THRESHOLD = 2000; // ms
  return PerformanceMonitor;
})();
exports.PerformanceMonitor = PerformanceMonitor;
/**
 * Load testing utilities
 */
var LoadTester = /** @class */ (function () {
  function LoadTester() {}
  /**
   * Concurrent request tester
   */
  LoadTester.runConcurrentRequests = function (url, options) {
    return __awaiter(this, void 0, void 0, function () {
      var startTime,
        promises,
        responseTimes,
        statusCodes,
        errorCount,
        successCount,
        i,
        requestPromise,
        totalTime,
        avgResponseTime,
        minResponseTime,
        maxResponseTime;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            startTime = Date.now();
            promises = [];
            responseTimes = [];
            statusCodes = {};
            errorCount = 0;
            successCount = 0;
            i = 0;
            _a.label = 1;
          case 1:
            if (!(i < options.totalRequests)) return [3 /*break*/, 6];
            requestPromise = this.makeRequest(url, options)
              .then(function (response) {
                responseTimes.push(response.duration);
                statusCodes[response.statusCode] =
                  (statusCodes[response.statusCode] || 0) + 1;
                if (response.statusCode >= 200 && response.statusCode < 400) {
                  successCount++;
                } else {
                  errorCount++;
                }
                return response;
              })
              .catch(function () {
                errorCount++;
                return { statusCode: 0, duration: 0 };
              });
            promises.push(requestPromise);
            if (!(promises.length >= options.concurrency))
              return [3 /*break*/, 3];
            return [
              4 /*yield*/,
              Promise.all(promises.splice(0, options.concurrency)),
            ];
          case 2:
            _a.sent();
            _a.label = 3;
          case 3:
            if (!(options.delay && options.delay > 0)) return [3 /*break*/, 5];
            return [
              4 /*yield*/,
              new Promise(function (resolve) {
                return setTimeout(resolve, options.delay);
              }),
            ];
          case 4:
            _a.sent();
            _a.label = 5;
          case 5:
            i++;
            return [3 /*break*/, 1];
          case 6:
            // Wait for remaining requests
            return [4 /*yield*/, Promise.all(promises)];
          case 7:
            // Wait for remaining requests
            _a.sent();
            totalTime = Date.now() - startTime;
            avgResponseTime =
              responseTimes.length > 0
                ? responseTimes.reduce(function (a, b) {
                    return a + b;
                  }, 0) / responseTimes.length
                : 0;
            minResponseTime =
              responseTimes.length > 0
                ? Math.min.apply(Math, responseTimes)
                : 0;
            maxResponseTime =
              responseTimes.length > 0
                ? Math.max.apply(Math, responseTimes)
                : 0;
            return [
              2 /*return*/,
              {
                totalTime: totalTime,
                requestsPerSecond: (options.totalRequests / totalTime) * 1000,
                avgResponseTime: avgResponseTime,
                minResponseTime: minResponseTime,
                maxResponseTime: maxResponseTime,
                errorCount: errorCount,
                successCount: successCount,
                statusCodeDistribution: statusCodes,
              },
            ];
        }
      });
    });
  };
  /**
   * Make a single request and measure response time
   */
  LoadTester.makeRequest = function (url, options) {
    return __awaiter(this, void 0, void 0, function () {
      var startTime, response, duration, error_3, duration;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            startTime = Date.now();
            _a.label = 1;
          case 1:
            _a.trys.push([1, 3, , 4]);
            return [
              4 /*yield*/,
              fetch(url, {
                method: options.body ? "POST" : "GET",
                headers: __assign(
                  { "Content-Type": "application/json" },
                  options.headers,
                ),
                body: options.body ? JSON.stringify(options.body) : undefined,
              }),
            ];
          case 2:
            response = _a.sent();
            duration = Date.now() - startTime;
            return [
              2 /*return*/,
              { statusCode: response.status, duration: duration },
            ];
          case 3:
            error_3 = _a.sent();
            duration = Date.now() - startTime;
            throw new Error(
              "Request failed after ".concat(duration, "ms: ").concat(error_3),
            );
          case 4:
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * Stress test with gradually increasing load
   */
  LoadTester.runStressTest = function (url, options) {
    return __awaiter(this, void 0, void 0, function () {
      var results, maxSustainedConcurrency, concurrency, result, errorRate;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            results = [];
            maxSustainedConcurrency = 0;
            concurrency = options.startConcurrency;
            _a.label = 1;
          case 1:
            if (!(concurrency <= options.maxConcurrency))
              return [3 /*break*/, 5];
            return [
              4 /*yield*/,
              this.runConcurrentRequests(url, {
                concurrency: concurrency,
                totalRequests: options.requestsPerStep,
              }),
            ];
          case 2:
            result = _a.sent();
            errorRate = result.errorCount / options.requestsPerStep;
            results.push({
              concurrency: concurrency,
              avgResponseTime: result.avgResponseTime,
              errorRate: errorRate,
              requestsPerSecond: result.requestsPerSecond,
            });
            if (errorRate <= options.maxErrorRate) {
              maxSustainedConcurrency = concurrency;
            } else {
              return [3 /*break*/, 5]; // Stop if error rate exceeds threshold
            }
            // Wait between steps
            return [
              4 /*yield*/,
              new Promise(function (resolve) {
                return setTimeout(resolve, 1000);
              }),
            ];
          case 3:
            // Wait between steps
            _a.sent();
            _a.label = 4;
          case 4:
            concurrency += options.stepSize;
            return [3 /*break*/, 1];
          case 5:
            return [
              2 /*return*/,
              {
                results: results,
                maxSustainedConcurrency: maxSustainedConcurrency,
              },
            ];
        }
      });
    });
  };
  return LoadTester;
})();
exports.LoadTester = LoadTester;
/**
 * Database latency monitoring
 */
var DatabaseMonitor = /** @class */ (function () {
  function DatabaseMonitor() {}
  /**
   * Monitor database connection pool
   */
  DatabaseMonitor.getConnectionPoolStats = function (prisma) {
    return __awaiter(this, void 0, void 0, function () {
      var stats, error_4;
      var _a, _b, _c, _d;
      return __generator(this, function (_e) {
        switch (_e.label) {
          case 0:
            _e.trys.push([0, 2, , 3]);
            return [
              4 /*yield*/,
              prisma.$queryRaw(
                templateObject_1 ||
                  (templateObject_1 = __makeTemplateObject(
                    [
                      "SELECT \n        COUNT(*) as total,\n        SUM(CASE WHEN state = 'active' THEN 1 ELSE 0 END) as active,\n        SUM(CASE WHEN state = 'idle' THEN 1 ELSE 0 END) as idle,\n        SUM(CASE WHEN waiting = true THEN 1 ELSE 0 END) as waiting\n        FROM pg_stat_activity WHERE datname = current_database()",
                    ],
                    [
                      "SELECT \n        COUNT(*) as total,\n        SUM(CASE WHEN state = 'active' THEN 1 ELSE 0 END) as active,\n        SUM(CASE WHEN state = 'idle' THEN 1 ELSE 0 END) as idle,\n        SUM(CASE WHEN waiting = true THEN 1 ELSE 0 END) as waiting\n        FROM pg_stat_activity WHERE datname = current_database()",
                    ],
                  )),
              ),
            ];
          case 1:
            stats = _e.sent();
            return [
              2 /*return*/,
              {
                totalConnections:
                  ((_a = stats[0]) === null || _a === void 0
                    ? void 0
                    : _a.total) || 0,
                activeConnections:
                  ((_b = stats[0]) === null || _b === void 0
                    ? void 0
                    : _b.active) || 0,
                idleConnections:
                  ((_c = stats[0]) === null || _c === void 0
                    ? void 0
                    : _c.idle) || 0,
                waitingClients:
                  ((_d = stats[0]) === null || _d === void 0
                    ? void 0
                    : _d.waiting) || 0,
              },
            ];
          case 2:
            error_4 = _e.sent();
            logger_js_1.logger.info({
              type: "ERROR",
              message: "Failed to get connection pool stats",
              details: {
                error:
                  error_4 instanceof Error ? error_4.message : "Unknown error",
              },
            });
            return [
              2 /*return*/,
              {
                totalConnections: 0,
                activeConnections: 0,
                idleConnections: 0,
                waitingClients: 0,
              },
            ];
          case 3:
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * Monitor slow queries
   */
  DatabaseMonitor.getSlowQueries = function (prisma_1) {
    return __awaiter(this, arguments, void 0, function (prisma, thresholdMs) {
      var slowQueries, error_5;
      if (thresholdMs === void 0) {
        thresholdMs = 1000;
      }
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 2, , 3]);
            return [
              4 /*yield*/,
              prisma.$queryRaw(
                templateObject_2 ||
                  (templateObject_2 = __makeTemplateObject(
                    [
                      "\n        SELECT \n          query,\n          calls,\n          total_time,\n          mean_time,\n          rows\n        FROM pg_stat_statements \n        WHERE mean_time > ",
                      "\n        ORDER BY mean_time DESC\n        LIMIT 10\n      ",
                    ],
                    [
                      "\n        SELECT \n          query,\n          calls,\n          total_time,\n          mean_time,\n          rows\n        FROM pg_stat_statements \n        WHERE mean_time > ",
                      "\n        ORDER BY mean_time DESC\n        LIMIT 10\n      ",
                    ],
                  )),
                thresholdMs,
              ),
            ];
          case 1:
            slowQueries = _a.sent();
            return [2 /*return*/, slowQueries];
          case 2:
            error_5 = _a.sent();
            logger_js_1.logger.info({
              type: "ERROR",
              message: "Failed to get slow queries",
              details: {
                error:
                  error_5 instanceof Error ? error_5.message : "Unknown error",
              },
            });
            return [2 /*return*/, []];
          case 3:
            return [2 /*return*/];
        }
      });
    });
  };
  return DatabaseMonitor;
})();
exports.DatabaseMonitor = DatabaseMonitor;
var templateObject_1, templateObject_2;
