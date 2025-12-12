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
exports.MetricsCollector = exports.HealthChecker = void 0;
var cacheEngine_js_1 = require("./cacheEngine.js");
var circuitBreaker_js_1 = require("./circuitBreaker.js");
var performanceMonitor_js_1 = require("./performanceMonitor.js");
var server_js_1 = require("../server.js");
/**
 * Comprehensive health check system
 */
var HealthChecker = /** @class */ (function () {
  function HealthChecker() {}
  /**
   * Basic health check
   */
  HealthChecker.basicHealth = function (req, res) {
    return __awaiter(this, void 0, void 0, function () {
      var health;
      return __generator(this, function (_a) {
        health = {
          status: "ok",
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || "development",
          version: process.env.npm_package_version || "1.0.0",
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
        };
        res.status(200).json(health);
        return [2 /*return*/];
      });
    });
  };
  /**
   * Detailed health check with service dependencies
   */
  HealthChecker.detailedHealth = function (req, res) {
    return __awaiter(this, void 0, void 0, function () {
      var checks, results, allHealthy, statusCode, health;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            return [
              4 /*yield*/,
              Promise.allSettled([
                this.checkDatabase(),
                this.checkCache(),
                this.checkCircuitBreakers(),
                this.checkMemory(),
                this.checkDiskSpace(),
              ]),
            ];
          case 1:
            checks = _a.sent();
            results = {
              database: this.getResult(checks[0]),
              cache: this.getResult(checks[1]),
              circuitBreakers: this.getResult(checks[2]),
              memory: this.getResult(checks[3]),
              diskSpace: this.getResult(checks[4]),
            };
            allHealthy = Object.values(results).every(function (r) {
              return r.status === "healthy";
            });
            statusCode = allHealthy ? 200 : 503;
            health = {
              status: allHealthy ? "healthy" : "unhealthy",
              timestamp: new Date().toISOString(),
              environment: process.env.NODE_ENV || "development",
              version: process.env.npm_package_version || "1.0.0",
              uptime: process.uptime(),
              checks: results,
            };
            res.status(statusCode).json(health);
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * Readiness probe - checks if application is ready to serve traffic
   */
  HealthChecker.readiness = function (req, res) {
    return __awaiter(this, void 0, void 0, function () {
      var ready, error_1, notReady;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 2, , 3]);
            // Check critical dependencies
            return [4 /*yield*/, this.checkDatabase()];
          case 1:
            // Check critical dependencies
            _a.sent();
            ready = {
              status: "ready",
              timestamp: new Date().toISOString(),
              checks: {
                database: "healthy",
              },
            };
            res.status(200).json(ready);
            return [3 /*break*/, 3];
          case 2:
            error_1 = _a.sent();
            notReady = {
              status: "not_ready",
              timestamp: new Date().toISOString(),
              error:
                error_1 instanceof Error ? error_1.message : "Unknown error",
            };
            res.status(503).json(notReady);
            return [3 /*break*/, 3];
          case 3:
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * Liveness probe - checks if application is alive
   */
  HealthChecker.liveness = function (req, res) {
    return __awaiter(this, void 0, void 0, function () {
      var alive;
      return __generator(this, function (_a) {
        alive = {
          status: "alive",
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
        };
        res.status(200).json(alive);
        return [2 /*return*/];
      });
    });
  };
  /**
   * Check database connection
   */
  HealthChecker.checkDatabase = function () {
    return __awaiter(this, void 0, void 0, function () {
      var start, latency, error_2;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 2, , 3]);
            start = Date.now();
            return [
              4 /*yield*/,
              server_js_1.prisma.$queryRaw(
                templateObject_1 ||
                  (templateObject_1 = __makeTemplateObject(
                    ["SELECT 1"],
                    ["SELECT 1"],
                  )),
              ),
            ];
          case 1:
            _a.sent();
            latency = Date.now() - start;
            if (latency > 1000) {
              return [
                2 /*return*/,
                {
                  status: "degraded",
                  latency: latency,
                  error: "High latency: ".concat(latency, "ms"),
                },
              ];
            }
            return [2 /*return*/, { status: "healthy", latency: latency }];
          case 2:
            error_2 = _a.sent();
            return [
              2 /*return*/,
              {
                status: "unhealthy",
                error:
                  error_2 instanceof Error ? error_2.message : "Unknown error",
              },
            ];
          case 3:
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * Check cache connection
   */
  HealthChecker.checkCache = function () {
    return __awaiter(this, void 0, void 0, function () {
      var value, error_3;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 3, , 4]);
            return [
              4 /*yield*/,
              cacheEngine_js_1.CacheEngine.set("health:check", "ok", 10),
            ];
          case 1:
            _a.sent();
            return [
              4 /*yield*/,
              cacheEngine_js_1.CacheEngine.get("health:check"),
            ];
          case 2:
            value = _a.sent();
            if (value === "ok") {
              return [2 /*return*/, { status: "healthy" }];
            } else {
              return [
                2 /*return*/,
                { status: "unhealthy", error: "Cache value mismatch" },
              ];
            }
            return [3 /*break*/, 4];
          case 3:
            error_3 = _a.sent();
            return [
              2 /*return*/,
              {
                status: "unhealthy",
                error:
                  error_3 instanceof Error ? error_3.message : "Unknown error",
              },
            ];
          case 4:
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * Check circuit breaker states
   */
  HealthChecker.checkCircuitBreakers = function () {
    return __awaiter(this, void 0, void 0, function () {
      var statuses, unhealthyBreakers;
      return __generator(this, function (_a) {
        statuses = circuitBreaker_js_1.CircuitBreakerRegistry.getAllStatuses();
        unhealthyBreakers = Object.entries(statuses)
          .filter(function (_a) {
            var _ = _a[0],
              state = _a[1];
            return state.state === "OPEN";
          })
          .map(function (_a) {
            var name = _a[0];
            return name;
          });
        return [
          2 /*return*/,
          {
            status: unhealthyBreakers.length > 0 ? "degraded" : "healthy",
            breakers: statuses,
          },
        ];
      });
    });
  };
  /**
   * Check memory usage
   */
  HealthChecker.checkMemory = function () {
    return __awaiter(this, void 0, void 0, function () {
      var usage, totalMemory, usedMemory, memoryUsagePercent, status;
      return __generator(this, function (_a) {
        usage = process.memoryUsage();
        totalMemory = usage.heapTotal;
        usedMemory = usage.heapUsed;
        memoryUsagePercent = (usedMemory / totalMemory) * 100;
        status = "healthy";
        if (memoryUsagePercent > 90) {
          status = "unhealthy";
        } else if (memoryUsagePercent > 80) {
          status = "degraded";
        }
        return [
          2 /*return*/,
          {
            status: status,
            usage: __assign(__assign({}, usage), {
              usagePercent: memoryUsagePercent,
            }),
          },
        ];
      });
    });
  };
  /**
   * Check disk space
   */
  HealthChecker.checkDiskSpace = function () {
    return __awaiter(this, void 0, void 0, function () {
      var fs, stats, error_4;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 3, , 4]);
            return [
              4 /*yield*/,
              Promise.resolve().then(function () {
                return require("fs/promises");
              }),
            ];
          case 1:
            fs = _a.sent();
            return [4 /*yield*/, fs.stat(process.cwd())];
          case 2:
            stats = _a.sent();
            // This is a simplified check - in production you'd want to check actual disk space
            return [2 /*return*/, { status: "healthy" }];
          case 3:
            error_4 = _a.sent();
            return [
              2 /*return*/,
              {
                status: "unhealthy",
                error:
                  error_4 instanceof Error ? error_4.message : "Unknown error",
              },
            ];
          case 4:
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * Extract result from PromiseSettled
   */
  HealthChecker.getResult = function (result) {
    if (result.status === "fulfilled") {
      return result.value;
    } else {
      return {
        status: "unhealthy",
        error:
          result.reason instanceof Error
            ? result.reason.message
            : "Unknown error",
      };
    }
  };
  return HealthChecker;
})();
exports.HealthChecker = HealthChecker;
/**
 * Metrics collector for monitoring
 */
var MetricsCollector = /** @class */ (function () {
  function MetricsCollector() {}
  /**
   * Get application metrics
   */
  MetricsCollector.getMetrics = function () {
    return __awaiter(this, void 0, void 0, function () {
      var _a, dbStats, circuitBreakerStats, memoryStats;
      return __generator(this, function (_b) {
        switch (_b.label) {
          case 0:
            return [
              4 /*yield*/,
              Promise.allSettled([
                performanceMonitor_js_1.DatabaseMonitor.getConnectionPoolStats(
                  server_js_1.prisma,
                ),
                Promise.resolve(
                  circuitBreaker_js_1.CircuitBreakerRegistry.getAllStatuses(),
                ),
                Promise.resolve(HealthChecker.checkMemory()),
              ]),
            ];
          case 1:
            ((_a = _b.sent()),
              (dbStats = _a[0]),
              (circuitBreakerStats = _a[1]),
              (memoryStats = _a[2]));
            return [
              2 /*return*/,
              {
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                memory:
                  memoryStats.status === "fulfilled" ? memoryStats.value : null,
                database: dbStats.status === "fulfilled" ? dbStats.value : null,
                circuitBreakers:
                  circuitBreakerStats.status === "fulfilled"
                    ? circuitBreakerStats.value
                    : null,
                process: {
                  pid: process.pid,
                  version: process.version,
                  platform: process.platform,
                  arch: process.arch,
                },
              },
            ];
        }
      });
    });
  };
  /**
   * Prometheus metrics endpoint
   */
  MetricsCollector.prometheusMetrics = function (req, res) {
    return __awaiter(this, void 0, void 0, function () {
      var metrics, prometheusMetrics;
      var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
      return __generator(this, function (_o) {
        switch (_o.label) {
          case 0:
            return [4 /*yield*/, this.getMetrics()];
          case 1:
            metrics = _o.sent();
            prometheusMetrics = [
              "# HELP accu_books_uptime_seconds Application uptime in seconds",
              "# TYPE accu_books_uptime_seconds counter",
              "accu_books_uptime_seconds ".concat(metrics.uptime),
              "",
              "# HELP accu_books_memory_usage_bytes Memory usage in bytes",
              "# TYPE accu_books_memory_usage_bytes gauge",
              'accu_books_memory_usage_bytes{type="rss"} '.concat(
                ((_b =
                  (_a = metrics.memory) === null || _a === void 0
                    ? void 0
                    : _a.usage) === null || _b === void 0
                  ? void 0
                  : _b.rss) || 0,
              ),
              'accu_books_memory_usage_bytes{type="heapTotal"} '.concat(
                ((_d =
                  (_c = metrics.memory) === null || _c === void 0
                    ? void 0
                    : _c.usage) === null || _d === void 0
                  ? void 0
                  : _d.heapTotal) || 0,
              ),
              'accu_books_memory_usage_bytes{type="heapUsed"} '.concat(
                ((_f =
                  (_e = metrics.memory) === null || _e === void 0
                    ? void 0
                    : _e.usage) === null || _f === void 0
                  ? void 0
                  : _f.heapUsed) || 0,
              ),
              'accu_books_memory_usage_bytes{type="external"} '.concat(
                ((_h =
                  (_g = metrics.memory) === null || _g === void 0
                    ? void 0
                    : _g.usage) === null || _h === void 0
                  ? void 0
                  : _h.external) || 0,
              ),
              "",
              "# HELP accu_books_db_connections Database connection pool stats",
              "# TYPE accu_books_db_connections gauge",
              'accu_books_db_connections{state="total"} '.concat(
                ((_j = metrics.database) === null || _j === void 0
                  ? void 0
                  : _j.totalConnections) || 0,
              ),
              'accu_books_db_connections{state="active"} '.concat(
                ((_k = metrics.database) === null || _k === void 0
                  ? void 0
                  : _k.activeConnections) || 0,
              ),
              'accu_books_db_connections{state="idle"} '.concat(
                ((_l = metrics.database) === null || _l === void 0
                  ? void 0
                  : _l.idleConnections) || 0,
              ),
              'accu_books_db_connections{state="waiting"} '.concat(
                ((_m = metrics.database) === null || _m === void 0
                  ? void 0
                  : _m.waitingClients) || 0,
              ),
            ].join("\n");
            res.set("Content-Type", "text/plain");
            res.send(prometheusMetrics);
            return [2 /*return*/];
        }
      });
    });
  };
  return MetricsCollector;
})();
exports.MetricsCollector = MetricsCollector;
var templateObject_1;
