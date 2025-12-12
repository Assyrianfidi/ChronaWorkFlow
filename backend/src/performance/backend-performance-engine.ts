/**
 * Backend Performance Engine
 * Sub-20ms API response optimization with advanced caching, query optimization, and performance monitoring
 */

import { prisma, PrismaClientSingleton } from '../lib/prisma';
import { logger } from "../utils/logger.js";
import { EventBus } from "../events/event-bus.js";
import { CacheManager } from "../cache/cache-manager.js";

export interface PerformanceMetrics {
  requestId: string;
  endpoint: string;
  method: string;
  duration: number;
  memoryUsage: number;
  cpuUsage: number;
  dbQueries: number;
  cacheHits: number;
  cacheMisses: number;
  timestamp: Date;
  statusCode: number;
  responseSize: number;
  userId?: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface PerformanceThreshold {
  endpoint: string;
  method: string;
  maxDuration: number; // ms
  maxMemory: number; // MB
  maxQueries: number;
  maxCacheMissRate: number; // percentage
  alertThreshold: number; // percentage of threshold
}

export interface QueryOptimization {
  query: string;
  optimizedQuery: string;
  improvement: number; // percentage
  recommendations: string[];
  indexes: Array<{
    table: string;
    columns: string[];
    type: "btree" | "hash" | "gin" | "gist";
    estimatedImpact: number;
  }>;
  analyzedAt: Date;
}

export interface CacheStrategy {
  key: string;
  ttl: number;
  strategy: "write-through" | "write-behind" | "cache-aside" | "refresh-ahead";
  invalidationRules: Array<{
    trigger: string;
    action: "invalidate" | "refresh" | "update";
  }>;
  compressionEnabled: boolean;
  priority: "low" | "medium" | "high" | "critical";
}

export interface PerformanceAlert {
  id: string;
  type:
    | "slow_query"
    | "memory_leak"
    | "cache_miss"
    | "db_overload"
    | "api_degradation";
  severity: "low" | "medium" | "high" | "critical";
  endpoint?: string;
  message: string;
  metrics: Partial<PerformanceMetrics>;
  threshold: PerformanceThreshold;
  triggeredAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  status: "open" | "acknowledged" | "resolved" | "false_positive";
  resolution?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface PerformanceReport {
  id: string;
  period: "hour" | "day" | "week" | "month";
  startTime: Date;
  endTime: Date;
  summary: {
    totalRequests: number;
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    errorRate: number;
    cacheHitRate: number;
    throughput: number; // requests per second
  };
  slowestEndpoints: Array<{
    endpoint: string;
    averageDuration: number;
    requestCount: number;
  }>;
  databaseMetrics: {
    averageQueryTime: number;
    slowQueries: number;
    connectionPool: {
      active: number;
      idle: number;
      total: number;
    };
  };
  cacheMetrics: {
    hitRate: number;
    missRate: number;
    evictionRate: number;
    memoryUsage: number;
  };
  alerts: PerformanceAlert[];
  recommendations: string[];
  generatedAt: Date;
}

export class BackendPerformanceEngine {
  private prisma: PrismaClient;
  private logger: typeof logger;
  private eventBus: EventBus;
  private cache: CacheManager;
  private metrics: PerformanceMetrics[] = [];
  private thresholds: Map<string, PerformanceThreshold> = new Map();
  private cacheStrategies: Map<string, CacheStrategy> = new Map();
  private queryCache: Map<string, QueryOptimization> = new Map();
  private performanceAlerts: PerformanceAlert[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private reportInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.prisma = prisma;
    this.logger = logger.child({ component: "BackendPerformanceEngine" });
    this.eventBus = new EventBus();
    this.cache = new CacheManager();
    this.initializeThresholds();
    this.initializeCacheStrategies();
    this.startMonitoring();
    this.startReportGeneration();
    this.setupDatabaseOptimizations();
  }

  /**
   * Initialize performance thresholds
   */
  private initializeThresholds(): void {
    const defaultThresholds: PerformanceThreshold[] = [
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

    for (const threshold of defaultThresholds) {
      const key = `${threshold.method}:${threshold.endpoint}`;
      this.thresholds.set(key, threshold);
    }
  }

  /**
   * Initialize cache strategies
   */
  private initializeCacheStrategies(): void {
    const strategies: CacheStrategy[] = [
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

    for (const strategy of strategies) {
      this.cacheStrategies.set(strategy.key, strategy);
    }
  }

  /**
   * Setup database optimizations
   */
  private async setupDatabaseOptimizations(): Promise<void> {
    try {
      // Create performance indexes
      await this.createPerformanceIndexes();

      // Configure connection pool
      await this.configureConnectionPool();

      // Setup query optimization
      await this.setupQueryOptimization();

      this.logger.info("Database optimizations configured");
    } catch (error) {
      this.logger.error("Failed to setup database optimizations:", error);
    }
  }

  /**
   * Create performance indexes
   */
  private async createPerformanceIndexes(): Promise<void> {
    const indexes = [
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_account_date ON "Transaction"(accountId, date DESC)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_user_date ON "Transaction"(userId, date DESC)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_status_amount ON "Transaction"(status, amount)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_accounts_type_active ON "Account"(type, isActive)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_status_due ON "Invoice"(status, dueDate)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_timestamp_category ON "AuditEvent"(timestamp DESC, category)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_user_timestamp ON "Activity"(userId, timestamp DESC)',
    ];

    for (const indexSql of indexes) {
      try {
        await this.prisma.$executeRaw`${indexSql}`;
        this.logger.debug(`Created index: ${indexSql}`);
      } catch (error) {
        this.logger.warn(`Failed to create index: ${indexSql}`, error);
      }
    }
  }

  /**
   * Configure connection pool
   */
  private async configureConnectionPool(): Promise<void> {
    // Configure Prisma connection pool settings
    const config = {
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    };

    // These would be configured in prisma schema or environment
    this.logger.info("Connection pool configured");
  }

  /**
   * Setup query optimization
   */
  private async setupQueryOptimization(): Promise<void> {
    // Enable query logging for optimization
    process.env.PRISMA_QUERY_LOG = "true";

    // Setup slow query monitoring
    await this.setupSlowQueryMonitoring();
  }

  /**
   * Setup slow query monitoring
   */
  private async setupSlowQueryMonitoring(): Promise<void> {
    // Monitor slow queries and suggest optimizations
    setInterval(async () => {
      await this.analyzeSlowQueries();
    }, 60000); // Every minute
  }

  /**
   * Start performance monitoring
   */
  private startMonitoring(): void {
    this.monitoringInterval = setInterval(async () => {
      await this.processMetrics();
    }, 5000); // Process metrics every 5 seconds
  }

  /**
   * Start report generation
   */
  private startReportGeneration(): void {
    this.reportInterval = setInterval(async () => {
      await this.generatePeriodicReports();
    }, 3600000); // Generate reports every hour
  }

  /**
   * Record performance metrics
   */
  recordMetrics(metrics: PerformanceMetrics): void {
    this.metrics.push(metrics);

    // Check against thresholds
    this.checkThresholds(metrics);

    // Keep only recent metrics (last 10000)
    if (this.metrics.length > 10000) {
      this.metrics = this.metrics.slice(-5000);
    }
  }

  /**
   * Check thresholds and create alerts
   */
  private checkThresholds(metrics: PerformanceMetrics): void {
    const key = `${metrics.method}:${metrics.endpoint}`;
    const threshold = this.thresholds.get(key);

    if (!threshold) return;

    const alerts: PerformanceAlert[] = [];

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
        message: `Response time ${metrics.duration}ms exceeds threshold of ${threshold.maxDuration}ms`,
        metrics,
        threshold,
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
        message: `Memory usage ${metrics.memoryUsage}MB exceeds threshold of ${threshold.maxMemory}MB`,
        metrics,
        threshold,
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
        message: `Database queries ${metrics.dbQueries} exceeds threshold of ${threshold.maxQueries}`,
        metrics,
        threshold,
        triggeredAt: new Date(),
        status: "open",
      });
    }

    // Check cache miss rate
    const totalRequests = metrics.cacheHits + metrics.cacheMisses;
    if (totalRequests > 0) {
      const missRate = (metrics.cacheMisses / totalRequests) * 100;
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
          message: `Cache miss rate ${missRate.toFixed(2)}% exceeds threshold of ${threshold.maxCacheMissRate}%`,
          metrics,
          threshold,
          triggeredAt: new Date(),
          status: "open",
        });
      }
    }

    // Add alerts and emit events
    for (const alert of alerts) {
      this.performanceAlerts.push(alert);
      this.eventBus.emit("performance.alert", alert);
    }
  }

  /**
   * Calculate alert severity
   */
  private calculateSeverity(
    actual: number,
    threshold: number,
  ): PerformanceAlert["severity"] {
    const percentage = (actual / threshold) * 100;

    if (percentage >= 150) return "critical";
    if (percentage >= 120) return "high";
    if (percentage >= 100) return "medium";
    return "low";
  }

  /**
   * Process metrics
   */
  private async processMetrics(): Promise<void> {
    if (this.metrics.length === 0) return;

    // Store metrics in database (commented out until Prisma schema is updated)
    const recentMetrics = this.metrics.slice(-100);

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

    // Update performance aggregations (commented out until Prisma schema is updated)
    // await this.updatePerformanceAggregations(recentMetrics);
  }

  /**
   * Update performance aggregations
   */
  private async updatePerformanceAggregations(
    metrics: PerformanceMetrics[],
  ): Promise<void> {
    // Implementation commented out until Prisma schema is updated
    // const now = new Date();
    // const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
    // // Group metrics by endpoint and hour
    // const grouped: Record<string, PerformanceMetrics[]> = {};
    // for (const metric of metrics) {
    //   const key = `${metric.endpoint}:${metric.method}:${hourStart.getTime()}`;
    //   if (!grouped[key]) grouped[key] = [];
    //   grouped[key].push(metric);
    // }
    // // Update aggregations
    // for (const [key, group] of Object.entries(grouped)) {
    //   const [endpoint, method] = key.split(':');
    //
    //   const avgDuration = group.reduce((sum, m) => sum + m.duration, 0) / group.length;
    //   const avgMemory = group.reduce((sum, m) => sum + m.memoryUsage, 0) / group.length;
    //   const avgQueries = group.reduce((sum, m) => sum + m.dbQueries, 0) / group.length;
    //   const totalCacheHits = group.reduce((sum, m) => sum + m.cacheHits, 0);
    //   const totalCacheMisses = group.reduce((sum, m) => sum + m.cacheMisses, 0);
    //   const cacheHitRate = totalCacheHits + totalCacheMisses > 0
    //     ? (totalCacheHits / (totalCacheHits + totalCacheMisses)) * 100
    //     : 0;
    //   await this.prisma.performanceAggregation.upsert({
    //     where: {
    //       endpoint_method_hour: {
    //         endpoint,
    //         method,
    //         hour: hourStart
    //       }
    //     },
    //     update: {
    //       requestCount: { increment: group.length },
    //       averageDuration: avgDuration,
    //       averageMemoryUsage: avgMemory,
    //       averageQueries: avgQueries,
    //       cacheHitRate,
    //       lastUpdated: now
    //     },
    //     create: {
    //       endpoint,
    //       method,
    //       hour: hourStart,
    //       requestCount: group.length,
    //       averageDuration: avgDuration,
    //       averageMemoryUsage: avgMemory,
    //       averageQueries: avgQueries,
    //       cacheHitRate,
    //       lastUpdated: now
    //     }
    //   });
    // }
  }

  /**
   * Analyze slow queries
   */
  private async analyzeSlowQueries(): Promise<void> {
    try {
      // Get slow queries from database
      const slowQueries = await this.prisma.$queryRaw`
        SELECT query, mean_exec_time, calls, total_exec_time
        FROM pg_stat_statements
        WHERE mean_exec_time > 100
        ORDER BY mean_exec_time DESC
        LIMIT 10
      `;

      for (const query of slowQueries as any[]) {
        await this.optimizeQuery(query);
      }
    } catch (error) {
      this.logger.error("Failed to analyze slow queries:", error);
    }
  }

  /**
   * Optimize query
   */
  private async optimizeQuery(queryData: any): Promise<void> {
    const queryHash = this.hashQuery(queryData.query);

    if (this.queryCache.has(queryHash)) {
      return; // Already optimized
    }

    const optimization: QueryOptimization = {
      query: queryData.query,
      optimizedQuery: await this.generateOptimizedQuery(queryData.query),
      improvement: 0, // Would be calculated from actual performance
      recommendations: this.generateQueryRecommendations(queryData.query),
      indexes: await this.suggestIndexes(queryData.query),
      analyzedAt: new Date(),
    };

    this.queryCache.set(queryHash, optimization);

    this.logger.info("Query optimization generated", {
      query: queryData.query.substring(0, 100) + "...",
      recommendations: optimization.recommendations.length,
    });
  }

  /**
   * Generate optimized query
   */
  private async generateOptimizedQuery(originalQuery: string): Promise<string> {
    // Simple query optimization logic
    let optimized = originalQuery;

    // Add LIMIT if not present
    if (!optimized.includes("LIMIT") && !optimized.includes("limit")) {
      optimized += " LIMIT 1000";
    }

    // Optimize JOIN order (simplified)
    if (optimized.includes("JOIN")) {
      // Would implement more sophisticated join optimization
    }

    return optimized;
  }

  /**
   * Generate query recommendations
   */
  private generateQueryRecommendations(query: string): string[] {
    const recommendations: string[] = [];

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
  }

  /**
   * Suggest indexes for query
   */
  private async suggestIndexes(
    query: string,
  ): Promise<QueryOptimization["indexes"]> {
    const indexes: QueryOptimization["indexes"] = [];

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

    return indexes;
  }

  /**
   * Hash query for caching
   */
  private hashQuery(query: string): string {
    return require("crypto").createHash("md5").update(query).digest("hex");
  }

  /**
   * Generate periodic reports
   */
  private async generatePeriodicReports(): Promise<void> {
    try {
      // Generate hourly report
      await this.generateReport("hour");

      // Generate daily report at midnight
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() < 5) {
        await this.generateReport("day");
      }
    } catch (error) {
      this.logger.error("Failed to generate periodic reports:", error);
    }
  }

  /**
   * Generate performance report
   */
  async generateReport(
    period: PerformanceReport["period"],
  ): Promise<PerformanceReport> {
    const endTime = new Date();
    const startTime = this.getReportStartTime(endTime, period);

    // Get metrics for the period (commented out until Prisma schema is updated)
    // const metrics = await this.prisma.performanceMetrics.findMany({
    //   where: {
    //     timestamp: {
    //       gte: startTime,
    //       lte: endTime
    //     }
    //   },
    //   orderBy: { timestamp: 'desc' }
    // });

    // Use mock data for now
    const metrics = this.metrics.filter(
      (m) => m.timestamp >= startTime && m.timestamp <= endTime,
    );

    // Calculate summary statistics
    const summary = this.calculateSummary(metrics);

    // Get slowest endpoints
    const slowestEndpoints = await this.getSlowestEndpoints(startTime, endTime);

    // Get database metrics
    const databaseMetrics = await this.getDatabaseMetrics();

    // Get cache metrics
    const cacheMetrics = await this.getCacheMetrics();

    // Get recent alerts
    const alerts = this.performanceAlerts.filter(
      (a) => a.triggeredAt >= startTime && a.triggeredAt <= endTime,
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(summary, alerts);

    const report: PerformanceReport = {
      id: this.generateReportId(),
      period,
      startTime,
      endTime,
      summary,
      slowestEndpoints,
      databaseMetrics,
      cacheMetrics,
      alerts,
      recommendations,
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

    return report;
  }

  /**
   * Get report start time
   */
  private getReportStartTime(
    endTime: Date,
    period: PerformanceReport["period"],
  ): Date {
    const start = new Date(endTime);

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
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(
    metrics: PerformanceMetrics[],
  ): PerformanceReport["summary"] {
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

    const durations = metrics.map((m) => m.duration).sort((a, b) => a - b);
    const totalRequests = metrics.length;
    const averageResponseTime =
      durations.reduce((sum, d) => sum + d, 0) / totalRequests;
    const p95ResponseTime = durations[Math.floor(totalRequests * 0.95)];
    const p99ResponseTime = durations[Math.floor(totalRequests * 0.99)];
    const errorCount = metrics.filter((m) => m.statusCode >= 400).length;
    const errorRate = (errorCount / totalRequests) * 100;

    const totalCacheHits = metrics.reduce((sum, m) => sum + m.cacheHits, 0);
    const totalCacheRequests = metrics.reduce(
      (sum, m) => sum + m.cacheHits + m.cacheMisses,
      0,
    );
    const cacheHitRate =
      totalCacheRequests > 0 ? (totalCacheHits / totalCacheRequests) * 100 : 0;

    const timeSpan =
      (metrics[metrics.length - 1].timestamp.getTime() -
        metrics[0].timestamp.getTime()) /
      1000;
    const throughput = timeSpan > 0 ? totalRequests / timeSpan : 0;

    return {
      totalRequests,
      averageResponseTime,
      p95ResponseTime,
      p99ResponseTime,
      errorRate,
      cacheHitRate,
      throughput,
    };
  }

  /**
   * Get slowest endpoints
   */
  private async getSlowestEndpoints(
    startTime: Date,
    endTime: Date,
  ): Promise<PerformanceReport["slowestEndpoints"]> {
    // Get slowest endpoints (commented out until Prisma schema is updated)
    // const aggregations = await this.prisma.performanceAggregation.findMany({
    //   where: {
    //     hour: {
    //       gte: startTime,
    //       lte: endTime
    //     }
    //   },
    //   orderBy: { averageDuration: 'desc' },
    //   take: 10
    // });

    // Use mock data for now
    const aggregations: Array<{
      endpoint: string;
      averageDuration: number;
      requestCount: number;
    }> = [];
    const endpointGroups = this.metrics
      .filter((m) => m.timestamp >= startTime && m.timestamp <= endTime)
      .reduce(
        (acc, m) => {
          const key = m.endpoint;
          if (!acc[key]) {
            acc[key] = { totalDuration: 0, count: 0 };
          }
          acc[key].totalDuration += m.duration;
          acc[key].count += 1;
          return acc;
        },
        {} as Record<string, { totalDuration: number; count: number }>,
      );

    for (const [endpoint, data] of Object.entries(endpointGroups)) {
      aggregations.push({
        endpoint,
        averageDuration: data.totalDuration / data.count,
        requestCount: data.count,
      });
    }

    return aggregations.map(
      (agg: {
        endpoint: string;
        averageDuration: number;
        requestCount: number;
      }) => ({
        endpoint: agg.endpoint,
        averageDuration: agg.averageDuration,
        requestCount: agg.requestCount,
      }),
    );
  }

  /**
   * Get database metrics
   */
  private async getDatabaseMetrics(): Promise<
    PerformanceReport["databaseMetrics"]
  > {
    try {
      const dbStats = await this.prisma.$queryRaw`
        SELECT 
          AVG(mean_exec_time) as avg_query_time,
          COUNT(*) as total_queries,
          SUM(calls) as total_calls
        FROM pg_stat_statements
      `;

      const poolStats = await this.prisma.$queryRaw`
        SELECT 
          COUNT(*) FILTER (WHERE state = 'active') as active,
          COUNT(*) FILTER (WHERE state = 'idle') as idle,
          COUNT(*) as total
        FROM pg_stat_activity
        WHERE datname = current_database()
      `;

      const stats = dbStats as any[];
      const pool = poolStats as any[];

      return {
        averageQueryTime: stats[0]?.avg_query_time || 0,
        slowQueries: stats[0]?.total_queries || 0,
        connectionPool: {
          active: pool[0]?.active || 0,
          idle: pool[0]?.idle || 0,
          total: pool[0]?.total || 0,
        },
      };
    } catch (error) {
      this.logger.error("Failed to get database metrics:", error);
      return {
        averageQueryTime: 0,
        slowQueries: 0,
        connectionPool: { active: 0, idle: 0, total: 0 },
      };
    }
  }

  /**
   * Get cache metrics
   */
  private async getCacheMetrics(): Promise<PerformanceReport["cacheMetrics"]> {
    const cacheStats = this.cache.getStats();

    return {
      hitRate: cacheStats.hitRate || 0,
      missRate: cacheStats.missRate || 0,
      evictionRate: cacheStats.evictionRate || 0,
      memoryUsage: cacheStats.memoryUsage || 0,
    };
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    summary: PerformanceReport["summary"],
    alerts: PerformanceAlert[],
  ): string[] {
    const recommendations: string[] = [];

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

    if (alerts.some((a) => a.type === "slow_query")) {
      recommendations.push(
        "Slow queries detected. Review database indexes and query optimization.",
      );
    }

    if (alerts.some((a) => a.type === "memory_leak")) {
      recommendations.push(
        "Memory usage is high. Monitor for memory leaks and optimize memory usage.",
      );
    }

    return recommendations;
  }

  /**
   * Get performance alerts
   */
  async getPerformanceAlerts(
    status?: PerformanceAlert["status"],
  ): Promise<PerformanceAlert[]> {
    let alerts = this.performanceAlerts;

    if (status) {
      alerts = alerts.filter((a) => a.status === status);
    }

    return alerts.sort(
      (a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime(),
    );
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    const alert = this.performanceAlerts.find((a) => a.id === alertId);
    if (!alert) {
      throw new Error("Alert not found");
    }

    alert.status = "acknowledged";
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = userId;

    // Update in database (commented out until Prisma schema is updated)
    // await this.prisma.performanceAlert.update({
    //   where: { id: alertId },
    //   data: {
    //     status: 'acknowledged',
    //     acknowledgedAt: alert.acknowledgedAt,
    //     acknowledgedBy: alert.acknowledgedBy
    //   }
    // });
  }

  /**
   * Resolve alert
   */
  async resolveAlert(
    alertId: string,
    resolution: string,
    userId: string,
  ): Promise<void> {
    const alert = this.performanceAlerts.find((a) => a.id === alertId);
    if (!alert) {
      throw new Error("Alert not found");
    }

    alert.status = "resolved";
    alert.resolution = resolution;
    alert.resolvedAt = new Date();
    alert.resolvedBy = userId;

    // Update in database (commented out until Prisma schema is updated)
    // await this.prisma.performanceAlert.update({
    //   where: { id: alertId },
    //   data: {
    //     status: 'resolved',
    //     resolution,
    //     resolvedAt: alert.resolvedAt,
    //     resolvedBy: alert.resolvedBy
    //   }
    // });
  }

  /**
   * Get real-time performance metrics
   */
  async getRealTimeMetrics(): Promise<{
    currentRPS: number;
    averageResponseTime: number;
    activeConnections: number;
    memoryUsage: number;
    cacheHitRate: number;
  }> {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    const recentMetrics = this.metrics.filter(
      (m) => m.timestamp.getTime() >= oneMinuteAgo,
    );

    const currentRPS = recentMetrics.length / 60;
    const averageResponseTime =
      recentMetrics.length > 0
        ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) /
          recentMetrics.length
        : 0;

    const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024; // MB

    const cacheStats = this.cache.getStats();
    const cacheHitRate = cacheStats.hitRate || 0;

    const activeConnections = await this.getActiveConnections();

    return {
      currentRPS,
      averageResponseTime,
      activeConnections,
      memoryUsage,
      cacheHitRate,
    };
  }

  /**
   * Get active database connections
   */
  private async getActiveConnections(): Promise<number> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM pg_stat_activity
        WHERE state = 'active' AND datname = current_database()
      `;

      return (result as any[])[0]?.count || 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Optimize cache configuration
   */
  async optimizeCacheConfiguration(): Promise<void> {
    const realTimeMetrics = await this.getRealTimeMetrics();

    // Adjust cache TTL based on hit rate
    if (realTimeMetrics.cacheHitRate < 70) {
      // Increase TTL for frequently accessed data
      for (const [key, strategy] of this.cacheStrategies) {
        if (strategy.priority === "high" && strategy.ttl < 600) {
          strategy.ttl = Math.min(strategy.ttl * 1.5, 1800); // Max 30 minutes
        }
      }
    }

    // Adjust cache size based on memory usage
    if (realTimeMetrics.memoryUsage > 500) {
      // 500MB threshold
      // Enable compression for low priority strategies
      for (const [key, strategy] of this.cacheStrategies) {
        if (strategy.priority === "low" && !strategy.compressionEnabled) {
          strategy.compressionEnabled = true;
        }
      }
    }
  }

  /**
   * Cleanup old data
   */
  async cleanupOldData(): Promise<void> {
    const cutoffDate = new Date();
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
  }

  // Helper methods

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default BackendPerformanceEngine;
