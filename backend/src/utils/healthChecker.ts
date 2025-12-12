import { Request, Response } from "express";
import { CacheEngine } from "./cacheEngine.js";
import { CircuitBreakerRegistry } from "./circuitBreaker.js";
import { logger } from "./logger.js";
import { DatabaseMonitor } from "./performanceMonitor.js";
import { prisma } from "../server.js";

/**
 * Comprehensive health check system
 */
export class HealthChecker {
  /**
   * Basic health check
   */
  static async basicHealth(req: Request, res: Response): Promise<void> {
    const health = {
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      version: process.env.npm_package_version || "1.0.0",
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
    };

    res.status(200).json(health);
  }

  /**
   * Detailed health check with service dependencies
   */
  static async detailedHealth(req: Request, res: Response): Promise<void> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkCache(),
      this.checkCircuitBreakers(),
      this.checkMemory(),
      this.checkDiskSpace(),
    ]);

    const results = {
      database: this.getResult(checks[0]),
      cache: this.getResult(checks[1]),
      circuitBreakers: this.getResult(checks[2]),
      memory: this.getResult(checks[3]),
      diskSpace: this.getResult(checks[4]),
    };

    const allHealthy = Object.values(results).every(
      (r) => r.status === "healthy",
    );
    const statusCode = allHealthy ? 200 : 503;

    const health = {
      status: allHealthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      version: process.env.npm_package_version || "1.0.0",
      uptime: process.uptime(),
      checks: results,
    };

    res.status(statusCode).json(health);
  }

  /**
   * Readiness probe - checks if application is ready to serve traffic
   */
  static async readiness(req: Request, res: Response): Promise<void> {
    try {
      // Check critical dependencies
      await this.checkDatabase();

      const ready = {
        status: "ready",
        timestamp: new Date().toISOString(),
        checks: {
          database: "healthy",
        },
      };

      res.status(200).json(ready);
    } catch (error) {
      const notReady = {
        status: "not_ready",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      };

      res.status(503).json(notReady);
    }
  }

  /**
   * Liveness probe - checks if application is alive
   */
  static async liveness(req: Request, res: Response): Promise<void> {
    const alive = {
      status: "alive",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };

    res.status(200).json(alive);
  }

  /**
   * Check database connection
   */
  static async checkDatabase(): Promise<{
    status: string;
    latency?: number;
    error?: string;
  }> {
    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;

      if (latency > 1000) {
        return {
          status: "degraded",
          latency,
          error: `High latency: ${latency}ms`,
        };
      }

      return { status: "healthy", latency };
    } catch (error) {
      return {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Check cache connection
   */
  static async checkCache(): Promise<{ status: string; error?: string }> {
    try {
      await CacheEngine.set("health:check", "ok", 10);
      const value = await CacheEngine.get("health:check");

      if (value === "ok") {
        return { status: "healthy" };
      } else {
        return { status: "unhealthy", error: "Cache value mismatch" };
      }
    } catch (error) {
      return {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Check circuit breaker states
   */
  static async checkCircuitBreakers(): Promise<{
    status: string;
    breakers: any;
  }> {
    const statuses = CircuitBreakerRegistry.getAllStatuses();
    const unhealthyBreakers = Object.entries(statuses)
      .filter(([_, state]: [string, any]) => state.state === "OPEN")
      .map(([name]) => name);

    return {
      status: unhealthyBreakers.length > 0 ? "degraded" : "healthy",
      breakers: statuses,
    };
  }

  /**
   * Check memory usage
   */
  static async checkMemory(): Promise<{ status: string; usage: any }> {
    const usage = process.memoryUsage();
    const totalMemory = usage.heapTotal;
    const usedMemory = usage.heapUsed;
    const memoryUsagePercent = (usedMemory / totalMemory) * 100;

    let status = "healthy";
    if (memoryUsagePercent > 90) {
      status = "unhealthy";
    } else if (memoryUsagePercent > 80) {
      status = "degraded";
    }

    return {
      status,
      usage: {
        ...usage,
        usagePercent: memoryUsagePercent,
      },
    };
  }

  /**
   * Check disk space
   */
  static async checkDiskSpace(): Promise<{ status: string; error?: string }> {
    try {
      const fs = await import("fs/promises");
      const stats = await fs.stat(process.cwd());

      // This is a simplified check - in production you'd want to check actual disk space
      return { status: "healthy" };
    } catch (error) {
      return {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Extract result from PromiseSettled
   */
  static getResult(result: PromiseSettledResult<any>): any {
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
  }
}

/**
 * Metrics collector for monitoring
 */
export class MetricsCollector {
  /**
   * Get application metrics
   */
  static async getMetrics(): Promise<any> {
    const [dbStats, circuitBreakerStats, memoryStats] =
      await Promise.allSettled([
        DatabaseMonitor.getConnectionPoolStats(prisma),
        Promise.resolve(CircuitBreakerRegistry.getAllStatuses()),
        Promise.resolve(HealthChecker.checkMemory()),
      ]);

    return {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: memoryStats.status === "fulfilled" ? memoryStats.value : null,
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
    };
  }

  /**
   * Prometheus metrics endpoint
   */
  static async prometheusMetrics(req: Request, res: Response): Promise<void> {
    const metrics = await this.getMetrics();

    // Convert to Prometheus format
    const prometheusMetrics = [
      `# HELP accu_books_uptime_seconds Application uptime in seconds`,
      `# TYPE accu_books_uptime_seconds counter`,
      `accu_books_uptime_seconds ${metrics.uptime}`,
      "",
      `# HELP accu_books_memory_usage_bytes Memory usage in bytes`,
      `# TYPE accu_books_memory_usage_bytes gauge`,
      `accu_books_memory_usage_bytes{type="rss"} ${metrics.memory?.usage?.rss || 0}`,
      `accu_books_memory_usage_bytes{type="heapTotal"} ${metrics.memory?.usage?.heapTotal || 0}`,
      `accu_books_memory_usage_bytes{type="heapUsed"} ${metrics.memory?.usage?.heapUsed || 0}`,
      `accu_books_memory_usage_bytes{type="external"} ${metrics.memory?.usage?.external || 0}`,
      "",
      `# HELP accu_books_db_connections Database connection pool stats`,
      `# TYPE accu_books_db_connections gauge`,
      `accu_books_db_connections{state="total"} ${metrics.database?.totalConnections || 0}`,
      `accu_books_db_connections{state="active"} ${metrics.database?.activeConnections || 0}`,
      `accu_books_db_connections{state="idle"} ${metrics.database?.idleConnections || 0}`,
      `accu_books_db_connections{state="waiting"} ${metrics.database?.waitingClients || 0}`,
    ].join("\n");

    res.set("Content-Type", "text/plain");
    res.send(prometheusMetrics);
  }
}
