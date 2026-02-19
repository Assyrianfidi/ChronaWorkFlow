import { PrismaClientSingleton } from '../utils/prisma.js';
import { logger } from '../utils/logger.js';
import { SystemPanicMonitor } from '../utils/errorHandler.js';
import { CircuitBreakerRegistry } from '../utils/circuitBreaker.js';
import { performance } from 'perf_hooks';

/**
 * Interface for system metrics
 */
interface SystemMetrics {
  requests: {
    total: number;
    successful: number;
    failed: number;
    avgResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
  };
  auth: {
    logins: number;
    failedLogins: number;
    registrations: number;
    uniqueUsers: number;
  };
  security: {
    unauthorizedAttempts: number;
    blockedRequests: number;
    suspiciousActivities: number;
    bruteForceAttempts: number;
  };
  database: {
    connectionErrors: number;
    queryErrors: number;
    slowQueries: number;
    poolConnections: number;
    poolIdle: number;
  };
  system: {
    memoryUsage: number;
    memoryTotal: number;
    cpuUsage: number;
    uptime: number;
    activeHandles: number;
    activeRequests: number;
  };
  endpoints: Map<string, {
    count: number;
    avgResponseTime: number;
    errorRate: number;
  }>;
}

/**
 * Interface for alerts
 */
interface Alert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details?: any;
  timestamp: Date;
  acknowledged: boolean;
  resolved: boolean;
}

/**
 * Enhanced monitoring service with memory leak prevention and comprehensive metrics
 */
class MonitoringService {
  private static instance: MonitoringService | null = null;
  private prisma: any;
  private metrics: SystemMetrics;
  private alerts: Alert[];
  private responseTimes: number[] = [];
  private maxResponseTimesHistory = 1000;
  private lastCleanup: number = Date.now();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private metricsInterval: NodeJS.Timeout | null = null;
  _metricsInterval: NodeJS.Timeout | null = null;
  private dbCircuitBreaker: any;
  private endpointMetrics = new Map<string, { times: number[]; errors: number }>();

  constructor() {
    this.prisma = PrismaClientSingleton.getInstance();
    this.metrics = this.initializeMetrics();
    this.alerts = [];
    
    // Initialize circuit breaker for database operations
    this.dbCircuitBreaker = CircuitBreakerRegistry.get('database', {
      failureThreshold: 3,
      resetTimeout: 30000,
      expectedErrorRate: 0.5,
    });

    // Setup graceful cleanup
    this.setupGracefulShutdown();
  }

  /**
   * Initialize metrics structure
   */
  private initializeMetrics(): SystemMetrics {
    return {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        avgResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
      },
      auth: {
        logins: 0,
        failedLogins: 0,
        registrations: 0,
        uniqueUsers: 0,
      },
      security: {
        unauthorizedAttempts: 0,
        blockedRequests: 0,
        suspiciousActivities: 0,
        bruteForceAttempts: 0,
      },
      database: {
        connectionErrors: 0,
        queryErrors: 0,
        slowQueries: 0,
        poolConnections: 0,
        poolIdle: 0,
      },
      system: {
        memoryUsage: 0,
        memoryTotal: 0,
        cpuUsage: 0,
        uptime: 0,
        activeHandles: 0,
        activeRequests: 0,
      },
      endpoints: new Map(),
    };
  }

  /**
   * Setup graceful shutdown handlers
   */
  private setupGracefulShutdown(): void {
    const cleanup = () => {
      this.stopMetricsCollection();
      MonitoringService.instance = null;
    };

    process.on('SIGTERM', cleanup);
    process.on('SIGINT', cleanup);
    process.on('SIGUSR2', cleanup); // nodemon restart
  }

  /**
   * Initialize metrics collection
   */
  static initializeMetrics(): MonitoringService {
    if (process.env.NODE_ENV === 'test') {
      logger.info('[MONITORING] Metrics collection skipped in test mode');
      return new MonitoringService();
    }

    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
      MonitoringService.instance.startMetricsCollection();
    }
    
    return MonitoringService.instance!;
  }

  /**
   * Start collecting metrics periodically
   */
  startMetricsCollection(): void {
    if (process.env.NODE_ENV === 'test') {
      logger.info('[MONITORING] Metrics collection skipped in test mode');
      this._metricsInterval = null;
      return;
    }

    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    this.metricsInterval = setInterval(async () => {
      try {
        await this.collectSystemMetrics();
        await this.cleanupOldAlerts();
        this.cleanupResponseTimes();
      } catch (error: any) {
        logger.error('Error collecting metrics:', error);
      }
    }, 30000); // Every 30 seconds

    this._metricsInterval = this.metricsInterval;

    logger.info('Metrics collection started');
  }

  /**
   * Stop metrics collection
   */
  stopMetricsCollection(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }

    this._metricsInterval = this.metricsInterval;
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    logger.info('Metrics collection stopped');
  }

  /**
   * Record request metrics with enhanced tracking
   */
  recordRequestMetrics(data: {
    statusCode: number;
    responseTime: number;
    endpoint: string;
    method: string;
    userId?: string;
  }): void {
    this.metrics.requests.total++;

    // Track response times for percentile calculations
    this.responseTimes.push(data.responseTime);
    
    // Track endpoint-specific metrics
    const key = `${data.method} ${data.endpoint}`;
    if (!this.endpointMetrics.has(key)) {
      this.endpointMetrics.set(key, { times: [], errors: 0 });
    }
    const endpointMetric = this.endpointMetrics.get(key)!;
    endpointMetric.times.push(data.responseTime);

    if (data.statusCode >= 200 && data.statusCode < 400) {
      this.metrics.requests.successful++;
    } else {
      this.metrics.requests.failed++;
      endpointMetric.errors++;
    }

    // Update average response time
    this.updateResponseTimeMetrics();

    // Check for slow queries
    if (data.responseTime > 1000) {
      this.metrics.database.slowQueries++;
      this.triggerAlert(
        'SLOW_QUERY',
        'medium',
        `Slow query detected: ${data.responseTime}ms`,
        {
          endpoint: data.endpoint,
          method: data.method,
          responseTime: data.responseTime,
        }
      );
    }

    // Record in panic monitor
    SystemPanicMonitor.recordRequest(data.responseTime, data.statusCode >= 400);
  }

  /**
   * Update response time metrics including percentiles
   */
  private updateResponseTimeMetrics(): void {
    if (this.responseTimes.length === 0) return;

    const sorted = [...this.responseTimes].sort((a, b) => a - b);
    this.metrics.requests.avgResponseTime = 
      sorted.reduce((sum: any, time: any) => sum + time, 0) / sorted.length;
    
    const p95Index = Math.floor(sorted.length * 0.95);
    const p99Index = Math.floor(sorted.length * 0.99);
    
    this.metrics.requests.p95ResponseTime = sorted[p95Index] || 0;
    this.metrics.requests.p99ResponseTime = sorted[p99Index] || 0;

    // Update endpoint metrics
    this.metrics.endpoints.clear();
    for (const [endpoint, metric] of this.endpointMetrics.entries()) {
      if (metric.times.length > 0) {
        const avgTime = metric.times.reduce((sum: any, time: any) => sum + time, 0) / metric.times.length;
        const errorRate = metric.errors / metric.times.length;
        
        this.metrics.endpoints.set(endpoint, {
          count: metric.times.length,
          avgResponseTime: avgTime,
          errorRate,
        });
      }
    }
  }

  /**
   * Cleanup old response times to prevent memory leaks
   */
  private cleanupResponseTimes(): void {
    if (this.responseTimes.length > this.maxResponseTimesHistory) {
      this.responseTimes = this.responseTimes.slice(-this.maxResponseTimesHistory);
    }

    // Cleanup endpoint metrics
    for (const [endpoint, metric] of this.endpointMetrics.entries()) {
      if (metric.times.length > 100) {
        metric.times = metric.times.slice(-100);
      }
    }
  }

  /**
   * Record authentication metrics
   */
  recordAuthMetrics(data: {
    action: 'login' | 'register' | 'logout';
    success: boolean;
    userId?: string;
    ip?: string;
  }): void {
    if (data.action === 'login') {
      if (data.success) {
        this.metrics.auth.logins++;
      } else {
        this.metrics.auth.failedLogins++;

        // Check for brute force
        if (this.metrics.auth.failedLogins > 10) {
          this.metrics.security.bruteForceAttempts++;
          this.triggerAlert(
            'BRUTE_FORCE',
            'high',
            'Multiple failed login attempts detected',
            {
              failedAttempts: this.metrics.auth.failedLogins,
              userId: data.userId,
              ip: data.ip,
            }
          );
        }
      }
    } else if (data.action === 'register') {
      this.metrics.auth.registrations++;
    }
  }

  /**
   * Record security metrics
   */
  recordSecurityMetrics(data: {
    event: string;
    details?: any;
  }): void {
    switch (data.event) {
      case 'UNAUTHORIZED_ACCESS':
        this.metrics.security.unauthorizedAttempts++;
        break;
      case 'REQUEST_BLOCKED':
        this.metrics.security.blockedRequests++;
        break;
      case 'SUSPICIOUS_ACTIVITY':
        this.metrics.security.suspiciousActivities++;
        this.triggerAlert(
          'SUSPICIOUS_ACTIVITY',
          'medium',
          'Suspicious activity detected',
          data.details
        );
        break;
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): SystemMetrics & { 
    uptime: number;
    memory: NodeJS.MemoryUsage;
    alerts: Alert[];
    circuitBreakers: any;
  } {
    return {
      ...this.metrics,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      alerts: this.getAlerts(),
      circuitBreakers: CircuitBreakerRegistry.getAllStats(),
    };
  }

  /**
   * Get comprehensive health status
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: {
      database: { status: string; message: string; responseTime?: number };
      memory: { status: string; message: string; usage: number };
      circuitBreakers: { status: string; message: string };
      endpoints: { status: string; message: string; slowEndpoints: string[] };
    };
    issues: string[];
    recommendations: string[];
  }> {
    const health = {
      status: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
      checks: {
        database: { status: 'healthy', message: 'Connected' },
        memory: { status: 'healthy', message: 'Normal', usage: 0 },
        circuitBreakers: { status: 'healthy', message: 'All closed' },
        endpoints: { status: 'healthy', message: 'All normal', slowEndpoints: [] as string[] },
      },
      issues: [] as string[],
      recommendations: [] as string[],
    };

    // Check database connection with circuit breaker
    const dbStartTime = performance.now();
    try {
      await this.dbCircuitBreaker.execute(async () => {
        await this.prisma.$queryRaw`SELECT 1`;
      });
      // health.checks.database.responseTime = performance.now() - dbStartTime;
      
      if (false) {
        health.checks.database.status = 'degraded';
        health.checks.database.message = 'Response time check disabled during migration';
        health.issues.push('Database response time is slow');
        health.recommendations.push('Optimize database queries or check connection');
      }
    } catch (error: any) {
      health.checks.database.status = 'unhealthy';
      health.checks.database.message = (error as Error).message;
      health.issues.push('Database connection failed');
      health.status = 'degraded';
    }

    // Check memory usage
    const memUsage = process.memoryUsage();
    const heapUsedPercent = memUsage.heapUsed / memUsage.heapTotal;
    health.checks.memory.usage = heapUsedPercent;
    
    if (heapUsedPercent > 0.9) {
      health.checks.memory.status = 'unhealthy';
      health.checks.memory.message = `High memory usage: ${(heapUsedPercent * 100).toFixed(2)}%`;
      health.issues.push('High memory usage');
      health.recommendations.push('Investigate memory leaks or scale horizontally');
      health.status = 'degraded';
    } else if (heapUsedPercent > 0.7) {
      health.checks.memory.status = 'degraded';
      health.checks.memory.message = `Elevated memory usage: ${(heapUsedPercent * 100).toFixed(2)}%`;
      health.issues.push('Elevated memory usage');
      health.recommendations.push('Monitor memory usage closely');
    }

    // Check circuit breakers
    if (CircuitBreakerRegistry.hasOpenCircuits()) {
      health.checks.circuitBreakers.status = 'unhealthy';
      health.checks.circuitBreakers.message = 'Some circuits are open';
      health.issues.push('Circuit breakers open');
      health.status = 'degraded';
    }

    // Check endpoint performance
    const slowEndpoints: string[] = [];
    for (const [endpoint, metrics] of this.metrics.endpoints.entries()) {
      if (metrics.avgResponseTime > 1000) {
        slowEndpoints.push(endpoint);
      }
    }
    
    if (slowEndpoints.length > 0) {
      health.checks.endpoints.status = 'degraded';
      health.checks.endpoints.slowEndpoints = slowEndpoints;
      health.checks.endpoints.message = `${slowEndpoints.length} slow endpoints detected`;
      health.issues.push('Some endpoints are slow');
      health.recommendations.push('Optimize slow endpoint performance');
    }

    if (health.issues.length > 2) {
      health.status = 'unhealthy';
    } else if (health.issues.length > 0) {
      health.status = 'degraded';
    }

    return health;
  }

  /**
   * Trigger an alert with memory management
   */
  triggerAlert(
    type: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    message: string,
    details?: any
  ): void {
    const alert: Alert = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      message,
      details,
      timestamp: new Date(),
      acknowledged: false,
      resolved: false,
    };

    this.alerts.push(alert);
    
    // Limit alerts in memory to prevent leaks
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-500);
    }

    logger.warn(`Alert triggered: ${type} - ${message}`, details);

    // Store in database with circuit breaker
    this.dbCircuitBreaker
      .execute(async () => {
        try {
          await this.prisma.alert.create({
            data: {
              type,
              severity,
              message,
              details: JSON.stringify(details),
              timestamp: alert.timestamp,
            },
          });
        } catch (error: any) {
          logger.error('Failed to store alert in database:', error);
        }
      })
      .catch((error: any) => {
        logger.error('Circuit breaker prevented alert storage:', error);
      });
  }

  /**
   * Get alerts with filtering and pagination
   */
  getAlerts(filters: {
    severity?: string;
    type?: string;
    acknowledged?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Alert[] {
    let filtered = [...this.alerts];

    if (filters.severity) {
      filtered = filtered.filter(alert => alert.severity === filters.severity);
    }

    if (filters.type) {
      filtered = filtered.filter(alert => alert.type === filters.type);
    }

    if (filters.acknowledged !== undefined) {
      filtered = filtered.filter(alert => alert.acknowledged === filters.acknowledged);
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    const offset = filters.offset || 0;
    const limit = filters.limit || filtered.length;
    
    return filtered.slice(offset, offset + limit);
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  /**
   * Collect comprehensive system metrics
   */
  async collectSystemMetrics(): Promise<void> {
    const memUsage = process.memoryUsage();
    this.metrics.system.memoryUsage = memUsage.heapUsed;
    this.metrics.system.memoryTotal = memUsage.heapTotal;
    this.metrics.system.uptime = process.uptime();
    this.metrics.system.activeHandles = (process as any)._getActiveHandles().length;
    this.metrics.system.activeRequests = (process as any)._getActiveRequests().length;

    // Calculate CPU usage (approximation)
    const cpuUsage = process.cpuUsage();
    this.metrics.system.cpuUsage = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds

    // Check for memory leaks
    if (memUsage.heapUsed > 500 * 1024 * 1024) {
      this.triggerAlert(
        'HIGH_MEMORY',
        'medium',
        'High memory usage detected',
        {
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
          external: memUsage.external,
        }
      );
    }

    // Check for too many handles (potential leak)
    if (this.metrics.system.activeHandles > 1000) {
      this.triggerAlert(
        'HIGH_HANDLES',
        'medium',
        'High number of active handles detected',
        { activeHandles: this.metrics.system.activeHandles }
      );
    }

    // Get database pool stats if available
    try {
      const poolStats = await this.prisma.$metrics.json();
      if (poolStats && poolStats.counters) {
        this.metrics.database.poolConnections = poolStats.counters['prisma_pool_connections_active'] || 0;
        this.metrics.database.poolIdle = poolStats.counters['prisma_pool_connections_idle'] || 0;
      }
    } catch (error: any) {
      // Pool stats not available, ignore
    }
  }

  /**
   * Cleanup old alerts with memory management
   */
  async cleanupOldAlerts(): Promise<void> {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    // Remove old alerts from memory
    this.alerts = this.alerts.filter(alert => alert.timestamp.getTime() > oneHourAgo);

    // Clean up database with circuit breaker
    this.dbCircuitBreaker
      .execute(async () => {
        try {
          await this.prisma.alert.deleteMany({
            where: {
              timestamp: {
                lt: new Date(oneHourAgo),
              },
            },
          });
        } catch (error: any) {
          logger.error('Failed to cleanup old alerts from database:', error);
        }
      })
      .catch((error: any) => {
        logger.error('Circuit breaker prevented alert cleanup:', error);
      });
  }

  /**
   * Get comprehensive performance report
   */
  async getPerformanceReport(period: { hours: number } = { hours: 24 }): Promise<{
    period: { hours: number };
    metrics: SystemMetrics;
    alerts: Alert[];
    health: any;
    recommendations: Array<{
      type: string;
      priority: 'low' | 'medium' | 'high' | 'critical';
      message: string;
      metric?: string;
      value?: number;
    }>;
  }> {
    const report = {
      period,
      metrics: this.metrics,
      alerts: this.getAlerts(),
      health: await this.getHealthStatus(),
      recommendations: this.generateRecommendations(),
    };

    return report;
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations(): Array<{
    type: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    metric?: string;
    value?: number;
  }> {
    const recommendations: Array<{
      type: string;
      priority: 'low' | 'medium' | 'high' | 'critical';
      message: string;
      metric?: string;
      value?: number;
    }> = [];

    // Check response times
    if (this.metrics.requests.avgResponseTime > 500) {
      recommendations.push({
        type: 'PERFORMANCE',
        priority: 'medium',
        message: 'Average response time is high. Consider optimizing database queries.',
        metric: 'avgResponseTime',
        value: this.metrics.requests.avgResponseTime,
      });
    }

    if (this.metrics.requests.p95ResponseTime > 2000) {
      recommendations.push({
        type: 'PERFORMANCE',
        priority: 'high',
        message: '95th percentile response time is very high. Investigate outliers.',
        metric: 'p95ResponseTime',
        value: this.metrics.requests.p95ResponseTime,
      });
    }

    // Check error rate
    const errorRate = this.metrics.requests.total > 0 
      ? this.metrics.requests.failed / this.metrics.requests.total 
      : 0;
    
    if (errorRate > 0.1) {
      recommendations.push({
        type: 'RELIABILITY',
        priority: 'high',
        message: 'High error rate detected. Review error logs.',
        metric: 'errorRate',
        value: errorRate,
      });
    }

    // Check failed logins
    if (this.metrics.auth.logins > 0) {
      const failedLoginRate = this.metrics.auth.failedLogins / this.metrics.auth.logins;
      if (failedLoginRate > 0.3) {
        recommendations.push({
          type: 'SECURITY',
          priority: 'high',
          message: 'High rate of failed logins. Consider implementing rate limiting.',
          metric: 'failedLoginRate',
          value: failedLoginRate,
        });
      }
    }

    // Check memory usage
    const memoryUsagePercent = this.metrics.system.memoryUsage / this.metrics.system.memoryTotal;
    if (memoryUsagePercent > 0.8) {
      recommendations.push({
        type: 'MEMORY',
        priority: 'critical',
        message: 'Memory usage is critically high. Investigate potential memory leaks.',
        metric: 'memoryUsagePercent',
        value: memoryUsagePercent,
      });
    }

    // Check database connection pool
    if (this.metrics.database.poolConnections > 15) {
      recommendations.push({
        type: 'DATABASE',
        priority: 'medium',
        message: 'Database connection pool is nearly full. Consider increasing pool size.',
        metric: 'poolConnections',
        value: this.metrics.database.poolConnections,
      });
    }

    return recommendations;
  }

  /**
   * Reset all metrics (useful for testing)
   */
  resetMetrics(): void {
    this.metrics = this.initializeMetrics();
    this.alerts = [];
    this.responseTimes = [];
    this.endpointMetrics.clear();
  }

  /**
   * Cleanup resources and prevent memory leaks
   */
  static cleanup(): void {
    if (MonitoringService.instance) {
      MonitoringService.instance.stopMetricsCollection();
      MonitoringService.instance.resetMetrics();
      MonitoringService.instance = null;
    }
  }
}

// Export singleton
export default MonitoringService;
export { MonitoringService };
export type { SystemMetrics, Alert };
