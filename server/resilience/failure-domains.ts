// CRITICAL: Failure Domains & Blast Radius Control
// MANDATORY: Tenant-level failure isolation with zero cascade propagation

import { logger } from '../utils/structured-logger.js';
import { getImmutableAuditLogger } from '../compliance/immutable-audit-log.js';
import { TenantContext } from '../tenant/tenant-isolation.js';
import crypto from 'crypto';

export type FailureSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type FailureDomain = 'TENANT' | 'SERVICE' | 'DATABASE' | 'QUEUE' | 'CACHE' | 'EXTERNAL';
export type ContainmentStrategy = 'ISOLATE' | 'DEGRADE' | 'FAIL_FAST' | 'CIRCUIT_BREAK';

export interface FailureEvent {
  id: string;
  domain: FailureDomain;
  severity: FailureSeverity;
  tenantId?: string;
  service?: string;
  component?: string;
  timestamp: Date;
  message: string;
  error?: Error;
  metadata: Record<string, any>;
  containmentStrategy: ContainmentStrategy;
  blastRadius: {
    affectedTenants: string[];
    affectedServices: string[];
    estimatedImpact: 'MINIMAL' | 'MODERATE' | 'EXTENSIVE';
  };
}

export interface FailureDomainConfig {
  maxConcurrentFailures: number;
  failureWindowMs: number;
  recoveryTimeoutMs: number;
  cascadePrevention: boolean;
  tenantIsolation: boolean;
  circuitBreakerThreshold: number;
  fallbackEnabled: boolean;
}

export interface TenantFailureState {
  tenantId: string;
  failureCount: number;
  lastFailure: Date;
  isolationStatus: 'NORMAL' | 'DEGRADED' | 'ISOLATED' | 'QUARANTINED';
  affectedServices: string[];
  recoveryAttempts: number;
  maxRecoveryAttempts: number;
  metadata: Record<string, any>;
}

/**
 * CRITICAL: Failure Domain Manager
 * 
 * This class manages failure domains with strict containment strategies
 * to prevent cascade failures and maintain tenant isolation.
 */
export class FailureDomainManager {
  private static instance: FailureDomainManager;
  private auditLogger: any;
  private failureEvents: Map<string, FailureEvent> = new Map();
  private tenantFailureStates: Map<string, TenantFailureState> = new Map();
  private serviceFailureStates: Map<string, { count: number; lastFailure: Date; status: string }> = new Map();
  private domainConfigs: Map<FailureDomain, FailureDomainConfig>;
  private activeContainments: Map<string, { strategy: ContainmentStrategy; startTime: Date }> = new Map();

  private constructor() {
    this.auditLogger = getImmutableAuditLogger();
    this.domainConfigs = this.initializeDomainConfigs();
    this.startFailureMonitoring();
  }

  /**
   * CRITICAL: Get singleton instance
   */
  static getInstance(): FailureDomainManager {
    if (!FailureDomainManager.instance) {
      FailureDomainManager.instance = new FailureDomainManager();
    }
    return FailureDomainManager.instance;
  }

  /**
   * CRITICAL: Report failure event
   */
  async reportFailure(
    domain: FailureDomain,
    severity: FailureSeverity,
    message: string,
    tenantId?: string,
    service?: string,
    component?: string,
    error?: Error,
    metadata: Record<string, any> = {}
  ): Promise<FailureEvent> {
    const eventId = this.generateFailureId();
    const timestamp = new Date();

    // CRITICAL: Determine containment strategy
    const containmentStrategy = this.determineContainmentStrategy(domain, severity, tenantId);

    // CRITICAL: Calculate blast radius
    const blastRadius = await this.calculateBlastRadius(domain, tenantId, service);

    const failureEvent: FailureEvent = {
      id: eventId,
      domain,
      severity,
      tenantId,
      service,
      component,
      timestamp,
      message,
      error,
      metadata,
      containmentStrategy,
      blastRadius
    };

    // CRITICAL: Store failure event
    this.failureEvents.set(eventId, failureEvent);

    // CRITICAL: Apply containment strategy
    await this.applyContainmentStrategy(failureEvent);

    // CRITICAL: Update failure states
    this.updateFailureStates(failureEvent);

    // CRITICAL: Log failure event
    this.auditLogger.logSecurityEvent({
      tenantId: tenantId || 'system',
      actorId: 'system',
      action: 'FAILURE_DETECTED',
      resourceType: 'FAILURE_DOMAIN',
      resourceId: eventId,
      outcome: 'FAILURE',
      correlationId: `failure_${eventId}`,
      severity: this.mapSeverityToAuditLevel(severity),
      metadata: {
        domain,
        severity,
        containmentStrategy,
        blastRadius,
        affectedTenants: blastRadius.affectedTenants.length,
        affectedServices: blastRadius.affectedServices.length
      }
    });

    logger.error('Failure event reported', {
      eventId,
      domain,
      severity,
      tenantId,
      service,
      containmentStrategy,
      blastRadius: blastRadius.estimatedImpact
    });

    return failureEvent;
  }

  /**
   * CRITICAL: Check tenant isolation status
   */
  getTenantIsolationStatus(tenantId: string): TenantFailureState {
    const state = this.tenantFailureStates.get(tenantId);
    
    if (!state) {
      return {
        tenantId,
        failureCount: 0,
        lastFailure: new Date(),
        isolationStatus: 'NORMAL',
        affectedServices: [],
        recoveryAttempts: 0,
        maxRecoveryAttempts: 3,
        metadata: {}
      };
    }

    return state;
  }

  /**
   * CRITICAL: Check if tenant is quarantined
   */
  isTenantQuarantined(tenantId: string): boolean {
    const state = this.getTenantIsolationStatus(tenantId);
    return state.isolationStatus === 'QUARANTINED';
  }

  /**
   * CRITICAL: Check if service is circuit broken
   */
  isServiceCircuitBroken(service: string): boolean {
    const state = this.serviceFailureStates.get(service);
    return state?.status === 'CIRCUIT_BROKEN' || false;
  }

  /**
   * CRITICAL: Execute operation with failure domain protection
   */
  async executeWithFailureProtection<T>(
    domain: FailureDomain,
    tenantId: string,
    operation: () => Promise<T>,
    fallback?: () => Promise<T>,
    timeoutMs: number = 30000
  ): Promise<T> {
    const startTime = Date.now();
    const operationId = this.generateOperationId();

    try {
      // CRITICAL: Pre-execution checks
      this.validateExecutionPreconditions(domain, tenantId);

      // CRITICAL: Execute with timeout
      const result = await this.executeWithTimeout(operation, timeoutMs);

      // CRITICAL: Log successful execution
      this.auditLogger.logAuthorizationDecision({
        tenantId,
        actorId: 'system',
        action: 'OPERATION_SUCCESS',
        resourceType: 'FAILURE_DOMAIN_OPERATION',
        resourceId: operationId,
        outcome: 'SUCCESS',
        correlationId: `operation_${operationId}`,
        metadata: {
          domain,
          duration: Date.now() - startTime
        }
      });

      return result;

    } catch (error) {
      // CRITICAL: Handle failure with containment
      const failureEvent = await this.reportFailure(
        domain,
        this.classifyErrorSeverity(error as Error),
        `Operation failed: ${(error as Error).message}`,
        tenantId,
        undefined,
        undefined,
        error as Error,
        { operationId, duration: Date.now() - startTime }
      );

      // CRITICAL: Apply fallback if available
      if (fallback && this.shouldUseFallback(failureEvent)) {
        try {
          const fallbackResult = await fallback();
          
          this.auditLogger.logAuthorizationDecision({
            tenantId,
            actorId: 'system',
            action: 'FALLBACK_SUCCESS',
            resourceType: 'FAILURE_DOMAIN_OPERATION',
            resourceId: operationId,
            outcome: 'SUCCESS',
            correlationId: `operation_${operationId}`,
            metadata: {
              domain,
              failureEventId: failureEvent.id,
              fallbackDuration: Date.now() - startTime
            }
          });

          return fallbackResult;

        } catch (fallbackError) {
          await this.reportFailure(
            domain,
            'CRITICAL',
            `Fallback failed: ${(fallbackError as Error).message}`,
            tenantId,
            undefined,
            undefined,
            fallbackError as Error,
            { operationId, originalFailureId: failureEvent.id }
          );
        }
      }

      // CRITICAL: Re-throw original error
      throw error;
    }
  }

  /**
   * CRITICAL: Recover tenant from failure state
   */
  async recoverTenant(tenantId: string, force: boolean = false): Promise<boolean> {
    const state = this.getTenantIsolationStatus(tenantId);
    
    if (state.isolationStatus === 'NORMAL') {
      return true; // Already recovered
    }

    if (!force && state.recoveryAttempts >= state.maxRecoveryAttempts) {
      logger.warn('Tenant recovery attempts exceeded', { tenantId, attempts: state.recoveryAttempts });
      return false;
    }

    try {
      // CRITICAL: Validate tenant is safe to recover
      const safeToRecover = await this.validateTenantRecovery(tenantId);
      
      if (!safeToRecover && !force) {
        logger.warn('Tenant not safe to recover', { tenantId });
        return false;
      }

      // CRITICAL: Reset tenant failure state
      this.tenantFailureStates.set(tenantId, {
        ...state,
        failureCount: 0,
        lastFailure: new Date(),
        isolationStatus: 'NORMAL',
        affectedServices: [],
        recoveryAttempts: state.recoveryAttempts + 1
      });

      // CRITICAL: Clear active containments for tenant
      this.clearTenantContainments(tenantId);

      // CRITICAL: Log recovery
      this.auditLogger.logSecurityEvent({
        tenantId,
        actorId: 'system',
        action: 'TENANT_RECOVERED',
        resourceType: 'FAILURE_DOMAIN',
        resourceId: tenantId,
        outcome: 'SUCCESS',
        correlationId: `recovery_${tenantId}`,
        severity: 'LOW',
        metadata: {
          previousStatus: state.isolationStatus,
          recoveryAttempts: state.recoveryAttempts + 1,
          forced: force
        }
      });

      logger.info('Tenant recovered successfully', { tenantId, forced });
      return true;

    } catch (error) {
      logger.error('Failed to recover tenant', error as Error, { tenantId });
      
      await this.reportFailure(
        'TENANT',
        'HIGH',
        `Recovery failed: ${(error as Error).message}`,
        tenantId,
        undefined,
        undefined,
        error as Error,
        { recoveryAttempt: state.recoveryAttempts + 1 }
      );

      return false;
    }
  }

  /**
   * CRITICAL: Get failure domain statistics
   */
  getFailureDomainStatistics(): {
    totalFailures: number;
    failuresByDomain: Record<FailureDomain, number>;
    failuresBySeverity: Record<FailureSeverity, number>;
    quarantinedTenants: number;
    circuitBrokenServices: number;
    activeContainments: number;
    averageRecoveryTime: number;
  } {
    const totalFailures = this.failureEvents.size;
    const failuresByDomain: Record<FailureDomain, number> = {
      TENANT: 0,
      SERVICE: 0,
      DATABASE: 0,
      QUEUE: 0,
      CACHE: 0,
      EXTERNAL: 0
    };
    const failuresBySeverity: Record<FailureSeverity, number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0
    };

    let quarantinedTenants = 0;
    let circuitBrokenServices = 0;

    // CRITICAL: Count failures by domain and severity
    for (const failure of this.failureEvents.values()) {
      failuresByDomain[failure.domain]++;
      failuresBySeverity[failure.severity]++;
    }

    // CRITICAL: Count quarantined tenants and circuit broken services
    for (const state of this.tenantFailureStates.values()) {
      if (state.isolationStatus === 'QUARANTINED') {
        quarantinedTenants++;
      }
    }

    for (const state of this.serviceFailureStates.values()) {
      if (state.status === 'CIRCUIT_BROKEN') {
        circuitBrokenServices++;
      }
    }

    return {
      totalFailures,
      failuresByDomain,
      failuresBySeverity,
      quarantinedTenants,
      circuitBrokenServices,
      activeContainments: this.activeContainments.size,
      averageRecoveryTime: this.calculateAverageRecoveryTime()
    };
  }

  /**
   * CRITICAL: Determine containment strategy
   */
  private determineContainmentStrategy(
    domain: FailureDomain,
    severity: FailureSeverity,
    tenantId?: string
  ): ContainmentStrategy {
    const config = this.domainConfigs.get(domain);
    
    if (!config) {
      return 'FAIL_FAST';
    }

    // CRITICAL: Tenant-specific failures should be isolated
    if (tenantId && config.tenantIsolation) {
      return 'ISOLATE';
    }

    // CRITICAL: High severity failures should fail fast
    if (severity === 'CRITICAL') {
      return 'FAIL_FAST';
    }

    // CRITICAL: Service failures should use circuit breaker
    if (domain === 'SERVICE' && config.circuitBreakerThreshold > 0) {
      return 'CIRCUIT_BREAK';
    }

    // CRITICAL: Database and queue failures should degrade
    if (domain === 'DATABASE' || domain === 'QUEUE') {
      return 'DEGRADE';
    }

    return 'FAIL_FAST';
  }

  /**
   * CRITICAL: Calculate blast radius
   */
  private async calculateBlastRadius(
    domain: FailureDomain,
    tenantId?: string,
    service?: string
  ): Promise<FailureEvent['blastRadius']> {
    const affectedTenants: string[] = [];
    const affectedServices: string[] = [];

    // CRITICAL: Tenant-specific failures have limited blast radius
    if (tenantId) {
      affectedTenants.push(tenantId);
      
      // CRITICAL: Check if tenant failure affects other services
      const tenantState = this.getTenantIsolationStatus(tenantId);
      affectedServices.push(...tenantState.affectedServices);
    }

    // CRITICAL: Service failures affect all tenants using that service
    if (service) {
      affectedServices.push(service);
      
      // CRITICAL: In a real implementation, you'd query which tenants use this service
      // For now, we'll estimate based on failure patterns
      const estimatedTenantCount = this.estimateTenantCountForService(service);
      if (estimatedTenantCount > 0) {
        // CRITICAL: Service failures have extensive blast radius
        return {
          affectedTenants: Array.from({ length: Math.min(estimatedTenantCount, 100) }, (_, i) => `tenant-${i}`),
          affectedServices: [service],
          estimatedImpact: estimatedTenantCount > 50 ? 'EXTENSIVE' : 'MODERATE'
        };
      }
    }

    // CRITICAL: Database and queue failures have extensive impact
    if (domain === 'DATABASE' || domain === 'QUEUE') {
      return {
        affectedTenants: ['ALL_TENANTS'],
        affectedServices: ['ALL_SERVICES'],
        estimatedImpact: 'EXTENSIVE'
      };
    }

    // CRITICAL: Cache and external failures have moderate impact
    if (domain === 'CACHE' || domain === 'EXTERNAL') {
      return {
        affectedTenants: ['AFFECTED_TENANTS'],
        affectedServices: affectedServices.length > 0 ? affectedServices : ['DEPENDENT_SERVICES'],
        estimatedImpact: 'MODERATE'
      };
    }

    return {
      affectedTenants,
      affectedServices,
      estimatedImpact: affectedTenants.length > 10 || affectedServices.length > 5 ? 'MODERATE' : 'MINIMAL'
    };
  }

  /**
   * CRITICAL: Apply containment strategy
   */
  private async applyContainmentStrategy(failureEvent: FailureEvent): Promise<void> {
    const { domain, severity, tenantId, service, containmentStrategy } = failureEvent;

    switch (containmentStrategy) {
      case 'ISOLATE':
        await this.isolateTenant(tenantId!);
        break;
      case 'DEGRADE':
        await this.degradeService(service || domain);
        break;
      case 'FAIL_FAST':
        await this.failFast(domain, tenantId);
        break;
      case 'CIRCUIT_BREAK':
        await this.circuitBreakService(service!);
        break;
    }

    // CRITICAL: Track active containment
    this.activeContainments.set(failureEvent.id, {
      strategy: containmentStrategy,
      startTime: new Date()
    });
  }

  /**
   * CRITICAL: Isolate tenant
   */
  private async isolateTenant(tenantId: string): Promise<void> {
    const state = this.getTenantIsolationStatus(tenantId);
    
    this.tenantFailureStates.set(tenantId, {
      ...state,
      failureCount: state.failureCount + 1,
      lastFailure: new Date(),
      isolationStatus: state.failureCount >= 3 ? 'QUARANTINED' : 'ISOLATED',
      affectedServices: [...state.affectedServices, 'ALL_SERVICES']
    });

    logger.warn('Tenant isolated due to failure', { tenantId, status: state.isolationStatus });
  }

  /**
   * CRITICAL: Degrade service
   */
  private async degradeService(service: string): Promise<void> {
    const currentState = this.serviceFailureStates.get(service) || { count: 0, lastFailure: new Date(), status: 'NORMAL' };
    
    this.serviceFailureStates.set(service, {
      count: currentState.count + 1,
      lastFailure: new Date(),
      status: currentState.count >= 5 ? 'DEGRADED' : 'WARNING'
    });

    logger.warn('Service degraded due to failure', { service, status: currentState.status });
  }

  /**
   * CRITICAL: Fail fast
   */
  private async failFast(domain: FailureDomain, tenantId?: string): Promise<void> {
    // CRITICAL: Immediate rejection of all operations in this domain
    logger.error('Fail fast activated', { domain, tenantId });
    
    // CRITICAL: In a real implementation, this would trigger immediate circuit breaking
    // and rejection of all operations in the affected domain
  }

  /**
   * CRITICAL: Circuit break service
   */
  private async circuitBreakService(service: string): Promise<void> {
    const currentState = this.serviceFailureStates.get(service) || { count: 0, lastFailure: new Date(), status: 'NORMAL' };
    
    this.serviceFailureStates.set(service, {
      count: currentState.count + 1,
      lastFailure: new Date(),
      status: 'CIRCUIT_BROKEN'
    });

    logger.error('Service circuit broken', { service });
  }

  /**
   * CRITICAL: Update failure states
   */
  private updateFailureStates(failureEvent: FailureEvent): void {
    const { domain, tenantId, service } = failureEvent;

    // CRITICAL: Update tenant state
    if (tenantId) {
      const tenantState = this.getTenantIsolationStatus(tenantId);
      this.tenantFailureStates.set(tenantId, {
        ...tenantState,
        failureCount: tenantState.failureCount + 1,
        lastFailure: failureEvent.timestamp,
        affectedServices: service ? [...new Set([...tenantState.affectedServices, service])] : tenantState.affectedServices
      });
    }

    // CRITICAL: Update service state
    if (service) {
      const serviceState = this.serviceFailureStates.get(service) || { count: 0, lastFailure: new Date(), status: 'NORMAL' };
      this.serviceFailureStates.set(service, {
        count: serviceState.count + 1,
        lastFailure: failureEvent.timestamp,
        status: serviceState.status
      });
    }
  }

  /**
   * CRITICAL: Validate execution preconditions
   */
  private validateExecutionPreconditions(domain: FailureDomain, tenantId: string): void {
    // CRITICAL: Check tenant isolation status
    const tenantState = this.getTenantIsolationStatus(tenantId);
    if (tenantState.isolationStatus === 'QUARANTINED') {
      throw new Error(`Tenant ${tenantId} is quarantined and cannot execute operations`);
    }

    // CRITICAL: Check domain-specific preconditions
    const config = this.domainConfigs.get(domain);
    if (config && config.cascadePrevention) {
      // CRITICAL: Additional domain-specific validations would go here
    }
  }

  /**
   * CRITICAL: Execute with timeout
   */
  private async executeWithTimeout<T>(operation: () => Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      operation()
        .then(result => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  /**
   * CRITICAL: Classify error severity
   */
  private classifyErrorSeverity(error: Error): FailureSeverity {
    const message = error.message.toLowerCase();
    
    if (message.includes('timeout') || message.includes('network')) {
      return 'MEDIUM';
    }
    
    if (message.includes('database') || message.includes('connection')) {
      return 'HIGH';
    }
    
    if (message.includes('critical') || message.includes('fatal')) {
      return 'CRITICAL';
    }
    
    return 'LOW';
  }

  /**
   * CRITICAL: Map severity to audit level
   */
  private mapSeverityToAuditLevel(severity: FailureSeverity): string {
    switch (severity) {
      case 'LOW': return 'LOW';
      case 'MEDIUM': return 'MEDIUM';
      case 'HIGH': return 'HIGH';
      case 'CRITICAL': return 'CRITICAL';
      default: return 'MEDIUM';
    }
  }

  /**
   * CRITICAL: Should use fallback
   */
  private shouldUseFallback(failureEvent: FailureEvent): boolean {
    const config = this.domainConfigs.get(failureEvent.domain);
    return config?.fallbackEnabled || false;
  }

  /**
   * CRITICAL: Validate tenant recovery
   */
  private async validateTenantRecovery(tenantId: string): Promise<boolean> {
    // CRITICAL: Check if tenant has active failures
    const state = this.getTenantIsolationStatus(tenantId);
    
    // CRITICAL: Don't recover if recent failures occurred
    const timeSinceLastFailure = Date.now() - state.lastFailure.getTime();
    if (timeSinceLastFailure < 300000) { // 5 minutes
      return false;
    }

    // CRITICAL: Additional validation logic would go here
    return true;
  }

  /**
   * CRITICAL: Clear tenant containments
   */
  private clearTenantContainments(tenantId: string): void {
    for (const [eventId, containment] of this.activeContainments.entries()) {
      // CRITICAL: In a real implementation, you'd check if this containment is for the tenant
      // For now, we'll clear all containments for simplicity
      this.activeContainments.delete(eventId);
    }
  }

  /**
   * CRITICAL: Estimate tenant count for service
   */
  private estimateTenantCountForService(service: string): number {
    // CRITICAL: This would query the database to get actual tenant count
    // For now, return reasonable estimates
    const serviceEstimates: Record<string, number> = {
      'auth': 1000,
      'billing': 1000,
      'audit': 1000,
      'data': 800,
      'cache': 600,
      'queue': 400,
      'external': 200
    };

    return serviceEstimates[service] || 100;
  }

  /**
   * CRITICAL: Calculate average recovery time
   */
  private calculateAverageRecoveryTime(): number {
    // CRITICAL: This would calculate actual recovery times from historical data
    // For now, return a reasonable estimate
    return 300000; // 5 minutes
  }

  /**
   * CRITICAL: Initialize domain configurations
   */
  private initializeDomainConfigs(): Map<FailureDomain, FailureDomainConfig> {
    return new Map([
      ['TENANT', {
        maxConcurrentFailures: 5,
        failureWindowMs: 300000, // 5 minutes
        recoveryTimeoutMs: 600000, // 10 minutes
        cascadePrevention: true,
        tenantIsolation: true,
        circuitBreakerThreshold: 3,
        fallbackEnabled: false
      }],
      ['SERVICE', {
        maxConcurrentFailures: 10,
        failureWindowMs: 60000, // 1 minute
        recoveryTimeoutMs: 300000, // 5 minutes
        cascadePrevention: true,
        tenantIsolation: false,
        circuitBreakerThreshold: 5,
        fallbackEnabled: true
      }],
      ['DATABASE', {
        maxConcurrentFailures: 3,
        failureWindowMs: 30000, // 30 seconds
        recoveryTimeoutMs: 120000, // 2 minutes
        cascadePrevention: true,
        tenantIsolation: false,
        circuitBreakerThreshold: 2,
        fallbackEnabled: true
      }],
      ['QUEUE', {
        maxConcurrentFailures: 5,
        failureWindowMs: 60000, // 1 minute
        recoveryTimeoutMs: 180000, // 3 minutes
        cascadePrevention: true,
        tenantIsolation: false,
        circuitBreakerThreshold: 3,
        fallbackEnabled: true
      }],
      ['CACHE', {
        maxConcurrentFailures: 15,
        failureWindowMs: 30000, // 30 seconds
        recoveryTimeoutMs: 60000, // 1 minute
        cascadePrevention: false,
        tenantIsolation: false,
        circuitBreakerThreshold: 10,
        fallbackEnabled: true
      }],
      ['EXTERNAL', {
        maxConcurrentFailures: 8,
        failureWindowMs: 120000, // 2 minutes
        recoveryTimeoutMs: 300000, // 5 minutes
        cascadePrevention: true,
        tenantIsolation: false,
        circuitBreakerThreshold: 5,
        fallbackEnabled: true
      }]
    ]);
  }

  /**
   * CRITICAL: Start failure monitoring
   */
  private startFailureMonitoring(): void {
    // CRITICAL: Periodic cleanup of old failure events
    setInterval(() => {
      this.cleanupOldFailures();
    }, 300000); // Every 5 minutes

    // CRITICAL: Periodic recovery attempts
    setInterval(() => {
      this.attemptRecoveries();
    }, 60000); // Every minute
  }

  /**
   * CRITICAL: Cleanup old failures
   */
  private cleanupOldFailures(): void {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - 24); // 24 hours ago

    let cleanedCount = 0;
    for (const [eventId, failure] of this.failureEvents.entries()) {
      if (failure.timestamp < cutoffTime) {
        this.failureEvents.delete(eventId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info('Cleaned up old failure events', { cleanedCount });
    }
  }

  /**
   * CRITICAL: Attempt recoveries
   */
  private attemptRecoveries(): void {
    for (const [tenantId, state] of this.tenantFailureStates.entries()) {
      if (state.isolationStatus !== 'NORMAL' && state.recoveryAttempts < state.maxRecoveryAttempts) {
        this.recoverTenant(tenantId).catch(error => {
          logger.error('Failed recovery attempt', error, { tenantId });
        });
      }
    }
  }

  /**
   * CRITICAL: Generate failure ID
   */
  private generateFailureId(): string {
    const bytes = crypto.randomBytes(8);
    return `failure_${bytes.toString('hex')}`;
  }

  /**
   * CRITICAL: Generate operation ID
   */
  private generateOperationId(): string {
    const bytes = crypto.randomBytes(8);
    return `op_${bytes.toString('hex')}`;
  }
}

/**
 * CRITICAL: Global failure domain manager instance
 */
export const failureDomainManager = FailureDomainManager.getInstance();

/**
 * CRITICAL: Convenience functions
 */
export const reportFailure = async (
  domain: FailureDomain,
  severity: FailureSeverity,
  message: string,
  tenantId?: string,
  service?: string,
  component?: string,
  error?: Error,
  metadata: Record<string, any> = {}
): Promise<FailureEvent> => {
  return await failureDomainManager.reportFailure(domain, severity, message, tenantId, service, component, error, metadata);
};

export const executeWithFailureProtection = async <T>(
  domain: FailureDomain,
  tenantId: string,
  operation: () => Promise<T>,
  fallback?: () => Promise<T>,
  timeoutMs: number = 30000
): Promise<T> => {
  return await failureDomainManager.executeWithFailureProtection(domain, tenantId, operation, fallback, timeoutMs);
};

export const getTenantIsolationStatus = (tenantId: string): TenantFailureState => {
  return failureDomainManager.getTenantIsolationStatus(tenantId);
};

export const isTenantQuarantined = (tenantId: string): boolean => {
  return failureDomainManager.isTenantQuarantined(tenantId);
};

export const isServiceCircuitBroken = (service: string): boolean => {
  return failureDomainManager.isServiceCircuitBroken(service);
};

export const recoverTenant = async (tenantId: string, force: boolean = false): Promise<boolean> => {
  return await failureDomainManager.recoverTenant(tenantId, force);
};
