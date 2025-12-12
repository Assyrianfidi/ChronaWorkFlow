import { Request, Response, NextFunction } from "express";
import { logger } from "./logger.js";
import { CacheEngine } from "./cacheEngine.js";

/**
 * Performance metric interface
 */
export interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  metadata?: any;
}

/**
 * Performance monitoring and benchmarking utilities
 */
export class PerformanceMonitor {
  private static metrics: Map<string, PerformanceMetric[]> = new Map();
  private static readonly SLOW_QUERY_THRESHOLD = 1000; // ms
  private static readonly SLOW_REQUEST_THRESHOLD = 2000; // ms

  /**
   * Start timing a performance metric
   */
  static startTimer(name: string, metadata?: any): () => PerformanceMetric {
    const startTime = Date.now();

    return (): PerformanceMetric => {
      const endTime = Date.now();
      const duration = endTime - startTime;

      const metric: PerformanceMetric = {
        name,
        startTime,
        endTime,
        duration,
        metadata,
      };

      // Store metric
      if (!this.metrics.has(name)) {
        this.metrics.set(name, []);
      }
      this.metrics.get(name)!.push(metric);

      // Keep only last 100 metrics per name
      const metrics = this.metrics.get(name)!;
      if (metrics.length > 100) {
        metrics.shift();
      }

      // Log slow operations
      if (duration > this.SLOW_REQUEST_THRESHOLD) {
        logger.info({
          type: "WARNING",
          message: "Slow operation detected",
          details: {
            name,
            duration: `${duration}ms`,
            threshold: `${this.SLOW_REQUEST_THRESHOLD}ms`,
            metadata,
          },
        });
      }

      return metric;
    };
  }

  /**
   * Get performance statistics
   */
  static getStats(name: string): {
    count: number;
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
    p95Duration: number;
    p99Duration: number;
  } | null {
    const metrics = this.metrics.get(name);
    if (!metrics || metrics.length === 0) return null;

    const durations = metrics.map((m) => m.duration).sort((a, b) => a - b);
    const count = durations.length;
    const sum = durations.reduce((a, b) => a + b, 0);

    return {
      count,
      avgDuration: sum / count,
      minDuration: durations[0],
      maxDuration: durations[count - 1],
      p95Duration: durations[Math.floor(count * 0.95)],
      p99Duration: durations[Math.floor(count * 0.99)],
    };
  }

  /**
   * Performance monitoring middleware
   */
  static performanceMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const endTimer = this.startTimer("http_request", {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      });

      // Override res.end to capture response time
      const originalEnd = res.end;
      res.end = function (this: Response, ...args: any[]) {
        const metric = endTimer();

        // Add performance headers
        res.set("X-Response-Time", `${metric.duration}ms`);

        // Log request performance
        logger.info({
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
        return originalEnd.apply(this, args as any);
      };

      next();
    };
  }

  /**
   * Database query performance monitor
   */
  static async monitorQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>,
    metadata?: any,
  ): Promise<T> {
    const endTimer = this.startTimer(`db_query_${queryName}`, metadata);

    try {
      const result = await queryFn();
      const metric = endTimer();

      // Log slow queries
      if (metric.duration > this.SLOW_QUERY_THRESHOLD) {
        logger.info({
          type: "WARNING",
          message: "Slow database query detected",
          details: {
            queryName,
            duration: `${metric.duration}ms`,
            threshold: `${this.SLOW_QUERY_THRESHOLD}ms`,
            metadata,
          },
        });
      }

      return result;
    } catch (error) {
      endTimer();
      throw error;
    }
  }

  /**
   * Cache performance monitor
   */
  static async monitorCache<T>(
    operation: "get" | "set" | "del",
    key: string,
    operationFn: () => Promise<T>,
  ): Promise<T> {
    const endTimer = this.startTimer(`cache_${operation}`, { key });

    try {
      const result = await operationFn();
      endTimer();
      return result;
    } catch (error) {
      endTimer();
      throw error;
    }
  }
}

/**
 * Load testing utilities
 */
export class LoadTester {
  /**
   * Concurrent request tester
   */
  static async runConcurrentRequests(
    url: string,
    options: {
      concurrency: number;
      totalRequests: number;
      delay?: number;
      headers?: Record<string, string>;
      body?: any;
    },
  ): Promise<{
    totalTime: number;
    requestsPerSecond: number;
    avgResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    errorCount: number;
    successCount: number;
    statusCodeDistribution: Record<number, number>;
  }> {
    const startTime = Date.now();
    const promises: Promise<any>[] = [];
    const responseTimes: number[] = [];
    const statusCodes: Record<number, number> = {};
    let errorCount = 0;
    let successCount = 0;

    for (let i = 0; i < options.totalRequests; i++) {
      const requestPromise = this.makeRequest(url, options)
        .then((response) => {
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
        .catch(() => {
          errorCount++;
          return { statusCode: 0, duration: 0 };
        });

      promises.push(requestPromise);

      // Control concurrency
      if (promises.length >= options.concurrency) {
        await Promise.all(promises.splice(0, options.concurrency));
      }

      // Add delay between requests
      if (options.delay && options.delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, options.delay));
      }
    }

    // Wait for remaining requests
    await Promise.all(promises);

    const totalTime = Date.now() - startTime;
    const avgResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;
    const minResponseTime =
      responseTimes.length > 0 ? Math.min(...responseTimes) : 0;
    const maxResponseTime =
      responseTimes.length > 0 ? Math.max(...responseTimes) : 0;

    return {
      totalTime,
      requestsPerSecond: (options.totalRequests / totalTime) * 1000,
      avgResponseTime,
      minResponseTime,
      maxResponseTime,
      errorCount,
      successCount,
      statusCodeDistribution: statusCodes,
    };
  }

  /**
   * Make a single request and measure response time
   */
  private static async makeRequest(
    url: string,
    options: {
      headers?: Record<string, string>;
      body?: any;
    },
  ): Promise<{ statusCode: number; duration: number }> {
    const startTime = Date.now();

    try {
      // This is a simplified implementation
      // In a real scenario, you'd use fetch or axios
      const response = await fetch(url, {
        method: options.body ? "POST" : "GET",
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      const duration = Date.now() - startTime;
      return { statusCode: response.status, duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      throw new Error(`Request failed after ${duration}ms: ${error}`);
    }
  }

  /**
   * Stress test with gradually increasing load
   */
  static async runStressTest(
    url: string,
    options: {
      startConcurrency: number;
      maxConcurrency: number;
      stepSize: number;
      requestsPerStep: number;
      maxErrorRate: number;
    },
  ): Promise<{
    results: Array<{
      concurrency: number;
      avgResponseTime: number;
      errorRate: number;
      requestsPerSecond: number;
    }>;
    maxSustainedConcurrency: number;
  }> {
    const results = [];
    let maxSustainedConcurrency = 0;

    for (
      let concurrency = options.startConcurrency;
      concurrency <= options.maxConcurrency;
      concurrency += options.stepSize
    ) {
      const result = await this.runConcurrentRequests(url, {
        concurrency,
        totalRequests: options.requestsPerStep,
      });

      const errorRate = result.errorCount / options.requestsPerStep;

      results.push({
        concurrency,
        avgResponseTime: result.avgResponseTime,
        errorRate,
        requestsPerSecond: result.requestsPerSecond,
      });

      if (errorRate <= options.maxErrorRate) {
        maxSustainedConcurrency = concurrency;
      } else {
        break; // Stop if error rate exceeds threshold
      }

      // Wait between steps
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return {
      results,
      maxSustainedConcurrency,
    };
  }
}

/**
 * Database latency monitoring
 */
export class DatabaseMonitor {
  /**
   * Monitor database connection pool
   */
  static async getConnectionPoolStats(prisma: any): Promise<{
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
    waitingClients: number;
  }> {
    try {
      // This would depend on your database driver
      // For Prisma, you might need to use internal APIs or custom monitoring
      const stats = await prisma.$queryRaw`SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN state = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN state = 'idle' THEN 1 ELSE 0 END) as idle,
        SUM(CASE WHEN waiting = true THEN 1 ELSE 0 END) as waiting
        FROM pg_stat_activity WHERE datname = current_database()`;

      return {
        totalConnections: stats[0]?.total || 0,
        activeConnections: stats[0]?.active || 0,
        idleConnections: stats[0]?.idle || 0,
        waitingClients: stats[0]?.waiting || 0,
      };
    } catch (error) {
      logger.info({
        type: "ERROR",
        message: "Failed to get connection pool stats",
        details: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });

      return {
        totalConnections: 0,
        activeConnections: 0,
        idleConnections: 0,
        waitingClients: 0,
      };
    }
  }

  /**
   * Monitor slow queries
   */
  static async getSlowQueries(
    prisma: any,
    thresholdMs: number = 1000,
  ): Promise<any[]> {
    try {
      const slowQueries = await prisma.$queryRaw`
        SELECT 
          query,
          calls,
          total_time,
          mean_time,
          rows
        FROM pg_stat_statements 
        WHERE mean_time > ${thresholdMs}
        ORDER BY mean_time DESC
        LIMIT 10
      `;

      return slowQueries;
    } catch (error) {
      logger.info({
        type: "ERROR",
        message: "Failed to get slow queries",
        details: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });

      return [];
    }
  }
}
