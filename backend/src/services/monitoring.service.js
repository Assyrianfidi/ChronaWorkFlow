const { PrismaClient } = require('@prisma/client');
const { logger } = require('../utils/logger');
const { SystemPanicMonitor } = require('../utils/errorHandler');
const { CircuitBreakerRegistry } = require('../utils/circuitBreaker');

/**
 * Service for monitoring application health and metrics
 */
class MonitoringService {
  constructor() {
    this.prisma = new PrismaClient();
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        avgResponseTime: 0,
      },
      auth: {
        logins: 0,
        failedLogins: 0,
        registrations: 0,
      },
      security: {
        unauthorizedAttempts: 0,
        blockedRequests: 0,
        suspiciousActivities: 0,
      },
      database: {
        connectionErrors: 0,
        queryErrors: 0,
        slowQueries: 0,
      },
      system: {
        memoryUsage: 0,
        cpuUsage: 0,
        uptime: 0,
      },
    };
    this.alerts = [];
    this.lastCleanup = Date.now();
    this.cleanupInterval = null;
    this._metricsInterval = null;
    
    // Initialize circuit breaker for database operations
    this.dbCircuitBreaker = CircuitBreakerRegistry.get('database', {
      failureThreshold: 3,
      resetTimeout: 30000, // 30 seconds
      expectedErrorRate: 0.5,
    });
  }

  /**
   * Initialize metrics collection
   */
  static initializeMetrics() {
    if (process.env.NODE_ENV === 'test') {
      console.log('[MONITORING] Metrics collection skipped in test mode');
      return;
    }
    
    const instance = new MonitoringService();
    instance.startMetricsCollection();
    MonitoringService.instance = instance;
    return instance;
  }

  /**
   * Start collecting metrics periodically
   */
  startMetricsCollection() {
    if (process.env.NODE_ENV === 'test') {
      console.log('[MONITORING] Metrics collection skipped in test mode');
      return;
    }

    if (this._metricsInterval) {
      clearInterval(this._metricsInterval);
    }

    this._metricsInterval = setInterval(async () => {
      try {
        await this.collectSystemMetrics();
        await this.cleanupOldAlerts();
      } catch (error) {
        logger.error('Error collecting metrics:', error);
      }
    }, 30000); // Every 30 seconds

    logger.info('Metrics collection started');
  }

  /**
   * Stop metrics collection
   */
  stopMetricsCollection() {
    if (this._metricsInterval) {
      clearInterval(this._metricsInterval);
      this._metricsInterval = null;
    }
    logger.info('Metrics collection stopped');
  }

  /**
   * Record request metrics
   */
  recordRequestMetrics(data) {
    this.metrics.requests.total++;
    
    if (data.statusCode >= 200 && data.statusCode < 400) {
      this.metrics.requests.successful++;
    } else {
      this.metrics.requests.failed++;
    }

    // Update average response time
    const totalResponseTime = this.metrics.requests.avgResponseTime * (this.metrics.requests.total - 1) + data.responseTime;
    this.metrics.requests.avgResponseTime = totalResponseTime / this.metrics.requests.total;

    // Check for slow queries
    if (data.responseTime > 1000) { // > 1 second
      this.metrics.database.slowQueries++;
      this.triggerAlert('SLOW_QUERY', 'warning', `Slow query detected: ${data.responseTime}ms`, {
        endpoint: data.endpoint,
        responseTime: data.responseTime,
      });
    }

    // Record in panic monitor
    SystemPanicMonitor.recordRequest(data.responseTime, data.statusCode >= 400);
  }

  /**
   * Record authentication metrics
   */
  recordAuthMetrics(data) {
    if (data.action === 'login') {
      if (data.success) {
        this.metrics.auth.logins++;
      } else {
        this.metrics.auth.failedLogins++;
        
        // Check for brute force
        if (this.metrics.auth.failedLogins > 10) {
          this.triggerAlert('BRUTE_FORCE', 'high', 'Multiple failed login attempts detected', {
            failedAttempts: this.metrics.auth.failedLogins,
            userId: data.userId,
            ip: data.ip,
          });
        }
      }
    } else if (data.action === 'register') {
      this.metrics.auth.registrations++;
    }
  }

  /**
   * Record security metrics
   */
  recordSecurityMetrics(data) {
    switch (data.event) {
      case 'UNAUTHORIZED_ACCESS':
        this.metrics.security.unauthorizedAttempts++;
        break;
      case 'REQUEST_BLOCKED':
        this.metrics.security.blockedRequests++;
        break;
      case 'SUSPICIOUS_ACTIVITY':
        this.metrics.security.suspiciousActivities++;
        this.triggerAlert('SUSPICIOUS_ACTIVITY', 'medium', 'Suspicious activity detected', data);
        break;
    }
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      alerts: this.getAlerts(),
      circuitBreakers: CircuitBreakerRegistry.getAllStats(),
    };
  }

  /**
   * Get health status
   */
  async getHealthStatus() {
    const health = {
      status: 'healthy',
      checks: {
        database: { status: 'healthy', message: 'Connected' },
        memory: { status: 'healthy', message: 'Normal' },
        circuitBreakers: { status: 'healthy', message: 'All closed' },
      },
      issues: [],
    };

    // Check database connection with circuit breaker
    try {
      await this.dbCircuitBreaker.execute(async () => {
        await this.prisma.$queryRaw`SELECT 1`;
      });
    } catch (error) {
      health.checks.database.status = 'unhealthy';
      health.checks.database.message = error.message;
      health.issues.push('Database connection failed');
      health.status = 'degraded';
    }

    // Check memory usage
    const memUsage = process.memoryUsage();
    const heapUsed = memUsage.heapUsed / memUsage.heapTotal;
    if (heapUsed > 0.9) {
      health.checks.memory.status = 'unhealthy';
      health.checks.memory.message = `High memory usage: ${(heapUsed * 100).toFixed(2)}%`;
      health.issues.push('High memory usage');
      health.status = 'degraded';
    }

    // Check circuit breakers
    if (CircuitBreakerRegistry.hasOpenCircuits()) {
      health.checks.circuitBreakers.status = 'unhealthy';
      health.checks.circuitBreakers.message = 'Some circuits are open';
      health.issues.push('Circuit breakers open');
      health.status = 'degraded';
    }

    if (health.issues.length > 0) {
      health.status = health.issues.length > 2 ? 'unhealthy' : 'degraded';
    }

    return health;
  }

  /**
   * Trigger an alert
   */
  triggerAlert(type, severity, message, details) {
    const alert = {
      id: Date.now().toString(),
      type,
      severity,
      message,
      details,
      timestamp: new Date(),
      acknowledged: false,
    };

    this.alerts.push(alert);
    logger.warn(`Alert triggered: ${type} - ${message}`, details);

    // Store in database with circuit breaker
    this.dbCircuitBreaker.execute(async () => {
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
      } catch (error) {
        logger.error('Failed to store alert in database:', error);
      }
    }).catch(error => {
      logger.error('Circuit breaker prevented alert storage:', error);
    });
  }

  /**
   * Get alerts
   */
  getAlerts(filters = {}) {
    let filtered = this.alerts;

    if (filters.severity) {
      filtered = filtered.filter(alert => alert.severity === filters.severity);
    }

    if (filters.type) {
      filtered = filtered.filter(alert => alert.type === filters.type);
    }

    if (filters.acknowledged !== undefined) {
      filtered = filtered.filter(alert => alert.acknowledged === filters.acknowledged);
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  /**
   * Collect system metrics
   */
  async collectSystemMetrics() {
    const memUsage = process.memoryUsage();
    this.metrics.system.memoryUsage = memUsage.heapUsed;
    this.metrics.system.uptime = process.uptime();

    // Check for memory leaks
    if (memUsage.heapUsed > 500 * 1024 * 1024) { // > 500MB
      this.triggerAlert('HIGH_MEMORY', 'warning', 'High memory usage detected', memUsage);
    }
  }

  /**
   * Cleanup old alerts
   */
  async cleanupOldAlerts() {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);

    // Remove old alerts from memory
    this.alerts = this.alerts.filter(alert => alert.timestamp.getTime() > oneHourAgo);

    // Clean up database with circuit breaker
    this.dbCircuitBreaker.execute(async () => {
      try {
        await this.prisma.alert.deleteMany({
          where: {
            timestamp: {
              lt: new Date(oneHourAgo),
            },
          },
        });
      } catch (error) {
        logger.error('Failed to cleanup old alerts from database:', error);
      }
    }).catch(error => {
      logger.error('Circuit breaker prevented alert cleanup:', error);
    });
  }

  /**
   * Get performance report
   */
  async getPerformanceReport(period = { hours: 24 }) {
    const now = new Date();
    const startTime = new Date(now.getTime() - (period.hours * 60 * 60 * 1000));

    const report = {
      period,
      metrics: this.getMetrics(),
      alerts: this.getAlerts(),
      health: await this.getHealthStatus(),
      recommendations: this.generateRecommendations(),
    };

    return report;
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations() {
    const recommendations = [];

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

    // Check error rate
    const errorRate = this.metrics.requests.failed / this.metrics.requests.total;
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
    if (this.metrics.auth.failedLogins > this.metrics.auth.logins * 0.3) {
      recommendations.push({
        type: 'SECURITY',
        priority: 'high',
        message: 'High rate of failed logins. Consider implementing rate limiting.',
        metric: 'failedLoginRate',
        value: this.metrics.auth.failedLogins / this.metrics.auth.logins,
      });
    }

    return recommendations;
  }

  /**
   * Cleanup resources
   */
  static cleanup() {
    if (MonitoringService.instance) {
      MonitoringService.instance.stopMetricsCollection();
      MonitoringService.instance = null;
    }
  }
}

// Static properties
MonitoringService.instance = null;

module.exports = MonitoringService;
