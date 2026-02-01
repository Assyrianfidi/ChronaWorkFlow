/**
 * Backend Performance Monitor
 * Tracks API latency, database performance, and system health
 */

import { Request, Response, NextFunction } from 'express';

interface PerformanceMetrics {
  endpoint: string;
  method: string;
  statusCode: number;
  duration: number;
  timestamp: number;
  tenantId?: string;
  userId?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxMetricsSize = 1000;

  /**
   * Express middleware for tracking request performance
   */
  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();

      // Capture response finish
      res.on('finish', () => {
        const duration = Date.now() - startTime;

        const metric: PerformanceMetrics = {
          endpoint: req.path,
          method: req.method,
          statusCode: res.statusCode,
          duration,
          timestamp: Date.now(),
          tenantId: (req as any).tenantId,
          userId: (req as any).userId,
        };

        this.recordMetric(metric);

        // Log slow requests
        if (duration > 1000) {
          console.warn('[Performance] Slow request:', {
            endpoint: metric.endpoint,
            method: metric.method,
            duration: `${duration}ms`,
          });
        }
      });

      next();
    };
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);

    // Trim metrics if too large
    if (this.metrics.length > this.maxMetricsSize) {
      this.metrics = this.metrics.slice(-this.maxMetricsSize);
    }
  }

  /**
   * Get performance statistics
   */
  getStats(endpoint?: string): {
    count: number;
    p50: number;
    p95: number;
    p99: number;
    avg: number;
    min: number;
    max: number;
  } {
    let filteredMetrics = this.metrics;

    if (endpoint) {
      filteredMetrics = this.metrics.filter((m) => m.endpoint === endpoint);
    }

    if (filteredMetrics.length === 0) {
      return { count: 0, p50: 0, p95: 0, p99: 0, avg: 0, min: 0, max: 0 };
    }

    const durations = filteredMetrics.map((m) => m.duration).sort((a, b) => a - b);
    const count = durations.length;

    return {
      count,
      p50: this.percentile(durations, 50),
      p95: this.percentile(durations, 95),
      p99: this.percentile(durations, 99),
      avg: durations.reduce((a, b) => a + b, 0) / count,
      min: durations[0],
      max: durations[count - 1],
    };
  }

  /**
   * Get recent slow requests
   */
  getSlowRequests(threshold: number = 1000, limit: number = 10): PerformanceMetrics[] {
    return this.metrics
      .filter((m) => m.duration > threshold)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  /**
   * Get error rate by endpoint
   */
  getErrorRate(endpoint?: string): number {
    let filteredMetrics = this.metrics;

    if (endpoint) {
      filteredMetrics = this.metrics.filter((m) => m.endpoint === endpoint);
    }

    if (filteredMetrics.length === 0) {
      return 0;
    }

    const errorCount = filteredMetrics.filter((m) => m.statusCode >= 400).length;
    return (errorCount / filteredMetrics.length) * 100;
  }

  /**
   * Clear metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Calculate percentile
   */
  private percentile(sortedArray: number[], percentile: number): number {
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)];
  }
}

// Singleton instance
const performanceMonitor = new PerformanceMonitor();

export { performanceMonitor, PerformanceMonitor };
export default performanceMonitor;
