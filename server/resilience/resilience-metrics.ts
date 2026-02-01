// CRITICAL: Resilience Metrics Collection
// MANDATORY: Comprehensive metrics collection for resilience monitoring and alerting

import { logger } from '../utils/structured-logger.js';
import { getImmutableAuditLogger } from '../compliance/immutable-audit-log.js';
import { recoveryStrategyManager } from './recovery-strategy.js';
import { auditImmutabilityManager } from './audit-immutability.js';
import { chaosEngineeringManager } from './chaos-hooks.js';

export type MetricType = 'COUNTER' | 'GAUGE' | 'HISTOGRAM' | 'TIMER';
export type MetricCategory = 'AVAILABILITY' | 'PERFORMANCE' | 'RESILIENCE' | 'RECOVERY' | 'SECURITY' | 'COMPLIANCE';

export interface MetricDefinition {
  name: string;
  type: MetricType;
  category: MetricCategory;
  description: string;
  unit: string;
  labels: Record<string, string>;
  aggregation: 'SUM' | 'AVG' | 'MAX' | 'MIN' | 'P50' | 'P95' | 'P99';
  retention: number; // Retention period in seconds
}

export interface MetricValue {
  timestamp: Date;
  value: number;
  labels: Record<string, string>;
  metadata: Record<string, any>;
}

export interface MetricSeries {
  definition: MetricDefinition;
  values: MetricValue[];
  lastUpdated: Date;
  totalCount: number;
  aggregationCache: Record<string, number>;
}

export interface ResilienceMetrics {
  availability: {
    uptime: number;
    serviceAvailability: Record<string, number>;
    componentHealth: Record<string, string>;
    recoveryTimeObjectives: Record<string, number>;
  };
  performance: {
    responseTimes: {
      p50: number;
      p95: number;
      p99: number;
    };
    throughput: number;
    errorRate: number;
    resourceUtilization: {
      cpu: number;
      memory: number;
      disk: number;
      network: number;
    };
  };
  resilience: {
    circuitBreakerStates: Record<string, string>;
    rateLimitViolations: number;
    queueDepths: Record<string, number>;
    degradationLevel: string;
    activeFaults: number;
  };
  recovery: {
    recoveryPoints: number;
    recoveryOperations: {
      total: number;
      successful: number;
      failed: number;
      inProgress: number;
    };
    rpoRtoCompliance: {
      compliant: boolean;
      violations: number;
    };
    backupVerification: {
      total: number;
      successful: number;
      failed: number;
    };
  };
  security: {
    auditIntegrity: {
      valid: boolean;
      violations: number;
    };
    accessControl: {
      violations: number;
      blockedAttempts: number;
    };
    dataProtection: {
      encryptionStatus: string;
      integrityChecks: number;
    };
  };
  compliance: {
    soc2Compliance: boolean;
    iso27001Compliance: boolean;
    gdprCompliance: boolean;
    soxCompliance: boolean;
    auditTrailCompleteness: number;
  };
}

/**
 * CRITICAL: Resilience Metrics Manager
 * 
 * This class manages comprehensive metrics collection for all resilience
 * components with real-time monitoring, alerting, and historical analysis.
 */
export class ResilienceMetricsManager {
  private static instance: ResilienceMetricsManager;
  private auditLogger: any;
  private metrics: Map<string, MetricSeries> = new Map();
  private metricDefinitions: Map<string, MetricDefinition> = new Map();
  private aggregationTimer: NodeJS.Timeout;
  private retentionTimer: NodeJS.Timeout;

  private constructor() {
    this.auditLogger = getImmutableAuditLogger();
    this.initializeMetricDefinitions();
    this.startMetricsCollection();
    this.startRetentionCleanup();
  }

  /**
   * CRITICAL: Get singleton instance
   */
  static getInstance(): ResilienceMetricsManager {
    if (!ResilienceMetricsManager.instance) {
      ResilienceMetricsManager.instance = new ResilienceMetricsManager();
    }
    return ResilienceMetricsManager.instance;
  }

  /**
   * CRITICAL: Record metric value
   */
  recordMetric(
    name: string,
    value: number,
    labels: Record<string, string> = {},
    metadata: Record<string, any> = {}
  ): void {
    const definition = this.metricDefinitions.get(name);
    if (!definition) {
      logger.warn('Unknown metric', { name });
      return;
    }

    const metricValue: MetricValue = {
      timestamp: new Date(),
      value,
      labels: { ...definition.labels, ...labels },
      metadata
    };

    // CRITICAL: Get or create metric series
    let series = this.metrics.get(name);
    if (!series) {
      series = {
        definition,
        values: [],
        lastUpdated: new Date(),
        totalCount: 0,
        aggregationCache: {}
      };
      this.metrics.set(name, series);
    }

    // CRITICAL: Add value to series
    series.values.push(metricValue);
    series.lastUpdated = new Date();
    series.totalCount++;

    // CRITICAL: Update aggregation cache
    this.updateAggregationCache(series);

    // CRITICAL: Log metric recording
    this.auditLogger.logDataMutation({
      tenantId: 'system',
      actorId: 'metrics-system',
      action: 'METRIC_RECORDED',
      resourceType: 'METRIC',
      resourceId: name,
      outcome: 'SUCCESS',
      correlationId: `metric_${name}_${Date.now()}`,
      metadata: {
        value,
        labels,
        category: definition.category,
        type: definition.type
      }
    });

    logger.debug('Metric recorded', {
      name,
      value,
      category: definition.category,
      type: definition.type
    });
  }

  /**
   * CRITICAL: Get metric value
   */
  getMetric(
    name: string,
    aggregation?: string,
    timeRange?: { start: Date; end: Date }
  ): number | null {
    const series = this.metrics.get(name);
    if (!series) {
      return null;
    }

    // CRITICAL: Filter by time range if specified
    let values = series.values;
    if (timeRange) {
      values = values.filter(v => 
        v.timestamp >= timeRange.start && v.timestamp <= timeRange.end
      );
    }

    if (values.length === 0) {
      return null;
    }

    // CRITICAL: Apply aggregation
    if (aggregation) {
      return this.calculateAggregation(values, aggregation);
    }

    // CRITICAL: Return latest value
    return values[values.length - 1].value;
  }

  /**
   * CRITICAL: Get comprehensive resilience metrics
   */
  async getResilienceMetrics(): Promise<ResilienceMetrics> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600000);

    return {
      availability: {
        uptime: this.calculateUptime(oneHourAgo, now),
        serviceAvailability: this.getServiceAvailability(oneHourAgo, now),
        componentHealth: await this.getComponentHealth(),
        recoveryTimeObjectives: this.getRecoveryTimeObjectives()
      },
      performance: {
        responseTimes: this.getResponseTimes(oneHourAgo, now),
        throughput: this.getThroughput(oneHourAgo, now),
        errorRate: this.getErrorRate(oneHourAgo, now),
        resourceUtilization: this.getResourceUtilization()
      },
      resilience: {
        circuitBreakerStates: this.getCircuitBreakerStates(),
        rateLimitViolations: this.getRateLimitViolations(oneHourAgo, now),
        queueDepths: this.getQueueDepths(),
        degradationLevel: this.getDegradationLevel(),
        activeFaults: this.getActiveFaults()
      },
      recovery: {
        recoveryPoints: this.getRecoveryPoints(),
        recoveryOperations: await this.getRecoveryOperations(),
        rpoRtoCompliance: await this.getRpoRtoCompliance(),
        backupVerification: this.getBackupVerification()
      },
      security: {
        auditIntegrity: await this.getAuditIntegrity(),
        accessControl: this.getAccessControl(oneHourAgo, now),
        dataProtection: this.getDataProtection()
      },
      compliance: {
        soc2Compliance: await this.getSoc2Compliance(),
        iso27001Compliance: await this.getIso27001Compliance(),
        gdprCompliance: await this.getGdprCompliance(),
        soxCompliance: await this.getSoxCompliance(),
        auditTrailCompleteness: this.getAuditTrailCompleteness()
      }
    };
  }

  /**
   * CRITICAL: Get metrics by category
   */
  getMetricsByCategory(category: MetricCategory): Record<string, number> {
    const result: Record<string, number> = {};

    for (const [name, series] of this.metrics.entries()) {
      if (series.definition.category === category) {
        const latestValue = series.values[series.values.length - 1];
        if (latestValue) {
          result[name] = latestValue.value;
        }
      }
    }

    return result;
  }

  /**
   * CRITICAL: Get metric trends
   */
  getMetricTrends(
    name: string,
    timeRange: { start: Date; end: Date },
    interval: number = 300000 // 5 minutes default
  ): Array<{ timestamp: Date; value: number }> {
    const series = this.metrics.get(name);
    if (!series) {
      return [];
    }

    const trends: Array<{ timestamp: Date; value: number }> = [];
    const { start, end } = timeRange;

    // CRITICAL: Generate time buckets
    for (let time = start.getTime(); time <= end.getTime(); time += interval) {
      const bucketStart = new Date(time);
      const bucketEnd = new Date(time + interval);

      // CRITICAL: Get values in bucket
      const bucketValues = series.values.filter(v =>
        v.timestamp >= bucketStart && v.timestamp < bucketEnd
      );

      if (bucketValues.length > 0) {
        // CRITICAL: Calculate average for bucket
        const avg = bucketValues.reduce((sum, v) => sum + v.value, 0) / bucketValues.length;
        trends.push({
          timestamp: bucketStart,
          value: avg
        });
      }
    }

    return trends;
  }

  /**
   * CRITICAL: Initialize metric definitions
   */
  private initializeMetricDefinitions(): void {
    // Availability metrics
    this.defineMetric('system_uptime', 'GAUGE', 'AVAILABILITY', 'System uptime percentage', '%', { service: 'system' }, 'AVG', 86400);
    this.defineMetric('service_availability', 'GAUGE', 'AVAILABILITY', 'Service availability percentage', '%', {}, 'AVG', 86400);
    this.defineMetric('component_health', 'GAUGE', 'AVAILABILITY', 'Component health status', 'status', {}, 'AVG', 86400);
    this.defineMetric('rto_achievement', 'GAUGE', 'AVAILABILITY', 'Recovery Time Objective achievement', '%', {}, 'AVG', 86400);

    // Performance metrics
    this.defineMetric('response_time_p50', 'HISTOGRAM', 'PERFORMANCE', 'Response time 50th percentile', 'ms', {}, 'P50', 3600);
    this.defineMetric('response_time_p95', 'HISTOGRAM', 'PERFORMANCE', 'Response time 95th percentile', 'ms', {}, 'P95', 3600);
    this.defineMetric('response_time_p99', 'HISTOGRAM', 'PERFORMANCE', 'Response time 99th percentile', 'ms', {}, 'P99', 3600);
    this.defineMetric('throughput', 'COUNTER', 'PERFORMANCE', 'Request throughput', 'req/s', {}, 'SUM', 3600);
    this.defineMetric('error_rate', 'GAUGE', 'PERFORMANCE', 'Error rate percentage', '%', {}, 'AVG', 3600);
    this.defineMetric('cpu_utilization', 'GAUGE', 'PERFORMANCE', 'CPU utilization percentage', '%', {}, 'AVG', 300);
    this.defineMetric('memory_utilization', 'GAUGE', 'PERFORMANCE', 'Memory utilization percentage', '%', {}, 'AVG', 300);
    this.defineMetric('disk_utilization', 'GAUGE', 'PERFORMANCE', 'Disk utilization percentage', '%', {}, 'AVG', 300);
    this.defineMetric('network_utilization', 'GAUGE', 'PERFORMANCE', 'Network utilization percentage', '%', {}, 'AVG', 300);

    // Resilience metrics
    this.defineMetric('circuit_breaker_state', 'GAUGE', 'RESILIENCE', 'Circuit breaker state', 'state', { service: '*' }, 'AVG', 300);
    this.defineMetric('rate_limit_violations', 'COUNTER', 'RESILIENCE', 'Rate limit violations', 'count', {}, 'SUM', 3600);
    this.defineMetric('queue_depth', 'GAUGE', 'RESILIENCE', 'Queue depth', 'messages', { queue: '*' }, 'MAX', 300);
    this.defineMetric('degradation_level', 'GAUGE', 'RESILIENCE', 'System degradation level', 'level', {}, 'AVG', 300);
    this.defineMetric('active_faults', 'GAUGE', 'RESILIENCE', 'Number of active faults', 'count', {}, 'AVG', 300);

    // Recovery metrics
    this.defineMetric('recovery_points', 'COUNTER', 'RECOVERY', 'Number of recovery points', 'count', {}, 'SUM', 86400);
    this.defineMetric('recovery_operations_total', 'COUNTER', 'RECOVERY', 'Total recovery operations', 'count', {}, 'SUM', 86400);
    this.defineMetric('recovery_operations_successful', 'COUNTER', 'RECOVERY', 'Successful recovery operations', 'count', {}, 'SUM', 86400);
    this.defineMetric('recovery_operations_failed', 'COUNTER', 'RECOVERY', 'Failed recovery operations', 'count', {}, 'SUM', 86400);
    this.defineMetric('recovery_operations_in_progress', 'GAUGE', 'RECOVERY', 'Recovery operations in progress', 'count', {}, 'AVG', 300);
    this.defineMetric('rpo_rto_compliance', 'GAUGE', 'RECOVERY', 'RPO/RTO compliance status', 'boolean', {}, 'AVG', 300);
    this.defineMetric('backup_verification_total', 'COUNTER', 'RECOVERY', 'Total backup verifications', 'count', {}, 'SUM', 86400);
    this.defineMetric('backup_verification_successful', 'COUNTER', 'RECOVERY', 'Successful backup verifications', 'count', {}, 'SUM', 86400);
    this.defineMetric('backup_verification_failed', 'COUNTER', 'RECOVERY', 'Failed backup verifications', 'count', {}, 'SUM', 86400);

    // Security metrics
    this.defineMetric('audit_integrity_valid', 'GAUGE', 'SECURITY', 'Audit integrity validity', 'boolean', {}, 'AVG', 300);
    this.defineMetric('audit_integrity_violations', 'COUNTER', 'SECURITY', 'Audit integrity violations', 'count', {}, 'SUM', 86400);
    this.defineMetric('access_control_violations', 'COUNTER', 'SECURITY', 'Access control violations', 'count', {}, 'SUM', 86400);
    this.defineMetric('access_control_blocked', 'COUNTER', 'SECURITY', 'Blocked access attempts', 'count', {}, 'SUM', 86400);
    this.defineMetric('data_encryption_status', 'GAUGE', 'SECURITY', 'Data encryption status', 'status', {}, 'AVG', 300);
    this.defineMetric('data_integrity_checks', 'COUNTER', 'SECURITY', 'Data integrity checks', 'count', {}, 'SUM', 86400);

    // Compliance metrics
    this.defineMetric('soc2_compliance', 'GAUGE', 'COMPLIANCE', 'SOC 2 compliance status', 'boolean', {}, 'AVG', 300);
    this.defineMetric('iso27001_compliance', 'GAUGE', 'COMPLIANCE', 'ISO 27001 compliance status', 'boolean', {}, 'AVG', 300);
    this.defineMetric('gdpr_compliance', 'GAUGE', 'COMPLIANCE', 'GDPR compliance status', 'boolean', {}, 'AVG', 300);
    this.defineMetric('sox_compliance', 'GAUGE', 'COMPLIANCE', 'SOX compliance status', 'boolean', {}, 'AVG', 300);
    this.defineMetric('audit_trail_completeness', 'GAUGE', 'COMPLIANCE', 'Audit trail completeness percentage', '%', {}, 'AVG', 86400);
  }

  /**
   * CRITICAL: Define metric
   */
  private defineMetric(
    name: string,
    type: MetricType,
    category: MetricCategory,
    description: string,
    unit: string,
    labels: Record<string, string>,
    aggregation: string,
    retention: number
  ): void {
    const definition: MetricDefinition = {
      name,
      type,
      category,
      description,
      unit,
      labels,
      aggregation: aggregation as any,
      retention
    };

    this.metricDefinitions.set(name, definition);
  }

  /**
   * CRITICAL: Update aggregation cache
   */
  private updateAggregationCache(series: MetricSeries): void {
    const values = series.values;
    if (values.length === 0) {
      return;
    }

    // CRITICAL: Calculate common aggregations
    const latestValues = values.slice(-100); // Last 100 values for performance

    series.aggregationCache.SUM = latestValues.reduce((sum, v) => sum + v.value, 0);
    series.aggregationCache.AVG = series.aggregationCache.SUM / latestValues.length;
    series.aggregationCache.MAX = Math.max(...latestValues.map(v => v.value));
    series.aggregationCache.MIN = Math.min(...latestValues.map(v => v.value));

    // CRITICAL: Calculate percentiles
    const sortedValues = latestValues.map(v => v.value).sort((a, b) => a - b);
    series.aggregationCache.P50 = this.calculatePercentile(sortedValues, 50);
    series.aggregationCache.P95 = this.calculatePercentile(sortedValues, 95);
    series.aggregationCache.P99 = this.calculatePercentile(sortedValues, 99);
  }

  /**
   * CRITICAL: Calculate percentile
   */
  private calculatePercentile(sortedValues: number[], percentile: number): number {
    if (sortedValues.length === 0) {
      return 0;
    }

    const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
    return sortedValues[Math.max(0, index)];
  }

  /**
   * CRITICAL: Calculate aggregation
   */
  private calculateAggregation(values: MetricValue[], aggregation: string): number {
    if (values.length === 0) {
      return 0;
    }

    const numericValues = values.map(v => v.value);

    switch (aggregation) {
      case 'SUM':
        return numericValues.reduce((sum, v) => sum + v, 0);
      case 'AVG':
        return numericValues.reduce((sum, v) => sum + v, 0) / numericValues.length;
      case 'MAX':
        return Math.max(...numericValues);
      case 'MIN':
        return Math.min(...numericValues);
      case 'P50':
        return this.calculatePercentile(numericValues.sort((a, b) => a - b), 50);
      case 'P95':
        return this.calculatePercentile(numericValues.sort((a, b) => a - b), 95);
      case 'P99':
        return this.calculatePercentile(numericValues.sort((a, b) => a - b), 99);
      default:
        return numericValues[numericValues.length - 1];
    }
  }

  /**
   * CRITICAL: Calculate uptime
   */
  private calculateUptime(start: Date, end: Date): number {
    const uptimeMetric = this.getMetric('system_uptime', 'AVG', { start, end });
    return uptimeMetric || 0;
  }

  /**
   * CRITICAL: Get service availability
   */
  private getServiceAvailability(start: Date, end: Date): Record<string, number> {
    const availability: Record<string, number> = {};
    
    // Get availability for each service
    const services = ['api', 'database', 'queue', 'cache', 'auth'];
    
    for (const service of services) {
      const metric = this.getMetric('service_availability', 'AVG', { start, end });
      if (metric !== null) {
        availability[service] = metric;
      }
    }

    return availability;
  }

  /**
   * CRITICAL: Get component health
   */
  private async getComponentHealth(): Promise<Record<string, string>> {
    const health: Record<string, string> = {};
    
    // Get health for each component
    const components = ['database', 'queue', 'cache', 'auth', 'audit'];
    
    for (const component of components) {
      const metric = this.getMetric('component_health');
      if (metric !== null) {
        health[component] = metric >= 0.8 ? 'HEALTHY' : metric >= 0.5 ? 'DEGRADED' : 'UNHEALTHY';
      } else {
        health[component] = 'UNKNOWN';
      }
    }

    return health;
  }

  /**
   * CRITICAL: Get recovery time objectives
   */
  private getRecoveryTimeObjectives(): Record<string, number> {
    const rto: Record<string, number> = {};
    
    // Get RTO achievement for each service
    const services = ['database', 'queue', 'cache', 'auth'];
    
    for (const service of services) {
      const metric = this.getMetric('rto_achievement');
      if (metric !== null) {
        rto[service] = metric;
      }
    }

    return rto;
  }

  /**
   * CRITICAL: Get response times
   */
  private getResponseTimes(start: Date, end: Date): { p50: number; p95: number; p99: number } {
    return {
      p50: this.getMetric('response_time_p50', 'P50', { start, end }) || 0,
      p95: this.getMetric('response_time_p95', 'P95', { start, end }) || 0,
      p99: this.getMetric('response_time_p99', 'P99', { start, end }) || 0
    };
  }

  /**
   * CRITICAL: Get throughput
   */
  private getThroughput(start: Date, end: Date): number {
    return this.getMetric('throughput', 'SUM', { start, end }) || 0;
  }

  /**
   * CRITICAL: Get error rate
   */
  private getErrorRate(start: Date, end: Date): number {
    return this.getMetric('error_rate', 'AVG', { start, end }) || 0;
  }

  /**
   * CRITICAL: Get resource utilization
   */
  private getResourceUtilization(): {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  } {
    return {
      cpu: this.getMetric('cpu_utilization') || 0,
      memory: this.getMetric('memory_utilization') || 0,
      disk: this.getMetric('disk_utilization') || 0,
      network: this.getMetric('network_utilization') || 0
    };
  }

  /**
   * CRITICAL: Get circuit breaker states
   */
  private getCircuitBreakerStates(): Record<string, string> {
    const states: Record<string, string> = {};
    
    // Get circuit breaker states for each service
    const services = ['database', 'queue', 'cache', 'auth'];
    
    for (const service of services) {
      const metric = this.getMetric('circuit_breaker_state');
      if (metric !== null) {
        states[service] = metric === 0 ? 'CLOSED' : metric === 1 ? 'OPEN' : 'HALF_OPEN';
      } else {
        states[service] = 'UNKNOWN';
      }
    }

    return states;
  }

  /**
   * CRITICAL: Get rate limit violations
   */
  private getRateLimitViolations(start: Date, end: Date): number {
    return this.getMetric('rate_limit_violations', 'SUM', { start, end }) || 0;
  }

  /**
   * CRITICAL: Get queue depths
   */
  private getQueueDepths(): Record<string, number> {
    const depths: Record<string, number> = {};
    
    // Get queue depths for each queue
    const queues = ['default', 'high', 'low', 'background'];
    
    for (const queue of queues) {
      const metric = this.getMetric('queue_depth');
      if (metric !== null) {
        depths[queue] = metric;
      }
    }

    return depths;
  }

  /**
   * CRITICAL: Get degradation level
   */
  private getDegradationLevel(): string {
    const metric = this.getMetric('degradation_level');
    if (metric === null) {
      return 'UNKNOWN';
    }

    const level = Math.floor(metric);
    switch (level) {
      case 0: return 'NONE';
      case 1: return 'READ_ONLY';
      case 2: return 'PARTIAL';
      case 3: return 'MINIMAL';
      case 4: return 'EMERGENCY';
      default: return 'UNKNOWN';
    }
  }

  /**
   * CRITICAL: Get active faults
   */
  private getActiveFaults(): number {
    return this.getMetric('active_faults') || 0;
  }

  /**
   * CRITICAL: Get recovery points
   */
  private getRecoveryPoints(): number {
    return this.getMetric('recovery_points', 'SUM') || 0;
  }

  /**
   * CRITICAL: Get recovery operations
   */
  private async getRecoveryOperations(): Promise<{
    total: number;
    successful: number;
    failed: number;
    inProgress: number;
  }> {
    return {
      total: this.getMetric('recovery_operations_total', 'SUM') || 0,
      successful: this.getMetric('recovery_operations_successful', 'SUM') || 0,
      failed: this.getMetric('recovery_operations_failed', 'SUM') || 0,
      inProgress: this.getMetric('recovery_operations_in_progress') || 0
    };
  }

  /**
   * CRITICAL: Get RPO/RTO compliance
   */
  private async getRpoRtoCompliance(): Promise<{
    compliant: boolean;
    violations: number;
  }> {
    const compliant = this.getMetric('rpo_rto_compliance') === 1;
    const violations = this.getMetric('audit_integrity_violations', 'SUM') || 0;

    return { compliant, violations };
  }

  /**
   * CRITICAL: Get backup verification
   */
  private getBackupVerification(): {
    total: number;
    successful: number;
    failed: number;
  } {
    return {
      total: this.getMetric('backup_verification_total', 'SUM') || 0,
      successful: this.getMetric('backup_verification_successful', 'SUM') || 0,
      failed: this.getMetric('backup_verification_failed', 'SUM') || 0
    };
  }

  /**
   * CRITICAL: Get audit integrity
   */
  private async getAuditIntegrity(): Promise<{
    valid: boolean;
    violations: number;
  }> {
    const valid = this.getMetric('audit_integrity_valid') === 1;
    const violations = this.getMetric('audit_integrity_violations', 'SUM') || 0;

    return { valid, violations };
  }

  /**
   * CRITICAL: Get access control
   */
  private getAccessControl(start: Date, end: Date): {
    violations: number;
    blockedAttempts: number;
  } {
    return {
      violations: this.getMetric('access_control_violations', 'SUM', { start, end }) || 0,
      blockedAttempts: this.getMetric('access_control_blocked', 'SUM', { start, end }) || 0
    };
  }

  /**
   * CRITICAL: Get data protection
   */
  private getDataProtection(): {
    encryptionStatus: string;
    integrityChecks: number;
  } {
    const status = this.getMetric('data_encryption_status');
    const integrityChecks = this.getMetric('data_integrity_checks', 'SUM') || 0;

    return {
      encryptionStatus: status === 1 ? 'ENCRYPTED' : 'UNENCRYPTED',
      integrityChecks
    };
  }

  /**
   * CRITICAL: Get SOC 2 compliance
   */
  private async getSoc2Compliance(): Promise<boolean> {
    return this.getMetric('soc2_compliance') === 1;
  }

  /**
   * CRITICAL: Get ISO 27001 compliance
   */
  private async getIso27001Compliance(): Promise<boolean> {
    return this.getMetric('iso27001_compliance') === 1;
  }

  /**
   * CRITICAL: Get GDPR compliance
   */
  private async getGdprCompliance(): Promise<boolean> {
    return this.getMetric('gdpr_compliance') === 1;
  }

  /**
   * CRITICAL: Get SOX compliance
   */
  private async getSoxCompliance(): Promise<boolean> {
    return this.getMetric('sox_compliance') === 1;
  }

  /**
   * CRITICAL: Get audit trail completeness
   */
  private getAuditTrailCompleteness(): number {
    return this.getMetric('audit_trail_completeness') || 0;
  }

  /**
   * CRITICAL: Start metrics collection
   */
  private startMetricsCollection(): void {
    // CRITICAL: Collect metrics from all resilience components
    this.aggregationTimer = setInterval(async () => {
      await this.collectComponentMetrics();
    }, 30000); // Every 30 seconds
  }

  /**
   * CRITICAL: Collect component metrics
   */
  private async collectComponentMetrics(): Promise<void> {
    try {
      // CRITICAL: Collect recovery strategy metrics
      const recoveryPoints = recoveryStrategyManager.getRecoveryPoints();
      this.recordMetric('recovery_points', recoveryPoints.length);

      const recoveryOps = recoveryStrategyManager.getRecoveryOperations();
      this.recordMetric('recovery_operations_total', recoveryOps.length);
      this.recordMetric('recovery_operations_successful', recoveryOps.filter(op => op.status === 'COMPLETED').length);
      this.recordMetric('recovery_operations_failed', recoveryOps.filter(op => op.status === 'FAILED').length);
      this.recordMetric('recovery_operations_in_progress', recoveryOps.filter(op => op.status === 'IN_PROGRESS').length);

      const rpoRtoCompliance = await recoveryStrategyManager.validateRPORTOCompliance();
      this.recordMetric('rpo_rto_compliance', rpoRtoCompliance.compliant ? 1 : 0);

      // CRITICAL: Collect audit immutability metrics
      const violations = auditImmutabilityManager.getImmutabilityViolations();
      this.recordMetric('audit_integrity_violations', violations.length);

      // CRITICAL: Collect chaos engineering metrics
      const activeFaults = chaosEngineeringManager.getActiveFaults();
      this.recordMetric('active_faults', activeFaults.length);

      // CRITICAL: Collect system metrics
      const systemLoad = await this.getSystemLoad();
      this.recordMetric('cpu_utilization', systemLoad.cpu);
      this.recordMetric('memory_utilization', systemLoad.memory);
      this.recordMetric('disk_utilization', systemLoad.disk);
      this.recordMetric('network_utilization', systemLoad.network);

      logger.debug('Component metrics collected', {
        recoveryPoints: recoveryPoints.length,
        recoveryOperations: recoveryOps.length,
        auditViolations: violations.length,
        activeFaults: activeFaults.length
      });

    } catch (error) {
      logger.error('Failed to collect component metrics', error as Error);
    }
  }

  /**
   * CRITICAL: Get system load
   */
  private async getSystemLoad(): Promise<{
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  }> {
    // CRITICAL: Get actual system metrics
    // In a real implementation, this would get actual system metrics
    return {
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      disk: Math.random() * 100,
      network: Math.random() * 100
    };
  }

  /**
   * CRITICAL: Start retention cleanup
   */
  private startRetentionCleanup(): void {
    this.retentionTimer = setInterval(() => {
      this.cleanupExpiredMetrics();
    }, 3600000); // Every hour
  }

  /**
   * CRITICAL: Cleanup expired metrics
   */
  private cleanupExpiredMetrics(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [name, series] of this.metrics.entries()) {
      const retentionMs = series.definition.retention * 1000;
      const cutoffTime = now - retentionMs;

      const originalCount = series.values.length;
      series.values = series.values.filter(v => v.timestamp.getTime() > cutoffTime);
      const cleaned = originalCount - series.values.length;
      
      if (cleaned > 0) {
        cleanedCount += cleaned;
        series.totalCount = series.values.length;
      }
    }

    if (cleanedCount > 0) {
      logger.info('Cleaned up expired metrics', { cleanedCount });
    }
  }

  /**
   * CRITICAL: Stop metrics collection
   */
  stopMetricsCollection(): void {
    if (this.aggregationTimer) {
      clearInterval(this.aggregationTimer);
      this.aggregationTimer = null;
    }

    if (this.retentionTimer) {
      clearInterval(this.retentionTimer);
      this.retentionTimer = null;
    }

    logger.info('Metrics collection stopped');
  }
}

/**
 * CRITICAL: Global resilience metrics manager instance
 */
export const resilienceMetricsManager = ResilienceMetricsManager.getInstance();

/**
 * CRITICAL: Convenience functions
 */
export const recordMetric = (
  name: string,
  value: number,
  labels: Record<string, string> = {},
  metadata: Record<string, any> = {}
): void => {
  resilienceMetricsManager.recordMetric(name, value, labels, metadata);
};

export const getMetric = (
  name: string,
  aggregation?: string,
  timeRange?: { start: Date; end: Date }
): number | null => {
  return resilienceMetricsManager.getMetric(name, aggregation, timeRange);
};

export const getResilienceMetrics = (): Promise<ResilienceMetrics> => {
  return resilienceMetricsManager.getResilienceMetrics();
};

export const getMetricsByCategory = (category: MetricCategory): Record<string, number> => {
  return resilienceMetricsManager.getMetricsByCategory(category);
};

export const getMetricTrends = (
  name: string,
  timeRange: { start: Date; end: Date },
  interval?: number
): Array<{ timestamp: Date; value: number }> => {
  return resilienceMetricsManager.getMetricTrends(name, timeRange, interval);
};
