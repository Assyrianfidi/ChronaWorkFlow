// CRITICAL: Circuit Breaker Implementation
// MANDATORY: Service circuit breakers with trip thresholds and automatic recovery

import { logger } from '../utils/structured-logger.js';
import { getImmutableAuditLogger } from '../compliance/immutable-audit-log.js';
import crypto from 'crypto';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';
export type TripStrategy = 'FAILURE_COUNT' | 'FAILURE_RATE' | 'RESPONSE_TIME';

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number; // Time in OPEN state before attempting HALF_OPEN
  monitoringPeriod: number; // Time window for failure counting
  halfOpenMaxCalls: number; // Max calls in HALF_OPEN state
  tripStrategy: TripStrategy;
  failureRateThreshold: number; // Percentage (0-100)
  responseTimeThreshold: number; // Milliseconds
  minimumThroughput: number; // Minimum calls to consider for rate-based tripping
}

export interface CircuitBreakerMetrics {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  currentFailureRate: number;
  averageResponseTime: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  stateTransitions: Array<{
    from: CircuitState;
    to: CircuitState;
    timestamp: Date;
    reason: string;
  }>;
}

export interface CircuitBreakerEvent {
  id: string;
  serviceName: string;
  timestamp: Date;
  state: CircuitState;
  eventType: 'STATE_CHANGE' | 'CALL_SUCCESS' | 'CALL_FAILURE' | 'TRIP' | 'RESET';
  metadata: Record<string, any>;
}

/**
 * CRITICAL: Circuit Breaker Implementation
 * 
 * This class implements circuit breakers with configurable trip strategies
 * and automatic recovery to prevent cascade failures.
 */
export class CircuitBreaker {
  private serviceName: string;
  private config: CircuitBreakerConfig;
  private state: CircuitState = 'CLOSED';
  private metrics: CircuitBreakerMetrics;
  private failureWindow: Array<{ timestamp: Date; success: boolean; responseTime: number }> = [];
  private lastStateChange: Date = new Date();
  private halfOpenCalls: number = 0;
  private auditLogger: any;
  private events: CircuitBreakerEvent[] = [];
  private deterministicCounter: number = 0;

  constructor(serviceName: string, config: Partial<CircuitBreakerConfig> = {}) {
    this.serviceName = serviceName;
    this.config = this.mergeConfig(config);
    this.metrics = this.initializeMetrics();
    this.auditLogger = getImmutableAuditLogger();
  }

  /**
   * CRITICAL: Execute operation with circuit breaker protection
   */
  async execute<T>(operation: () => Promise<T>, fallback?: () => Promise<T>): Promise<T> {
    const callId = this.generateCallId();
    const startTime = Date.now();

    try {
      // CRITICAL: Check if circuit is open
      if (this.state === 'OPEN') {
        if (this.shouldAttemptReset()) {
          this.transitionTo('HALF_OPEN', 'Reset timeout elapsed');
        } else {
          throw new Error(`Circuit breaker OPEN for ${this.serviceName}`);
        }
      }

      // CRITICAL: Check half-open call limit
      if (this.state === 'HALF_OPEN' && this.halfOpenCalls >= this.config.halfOpenMaxCalls) {
        throw new Error(`Circuit breaker HALF_OPEN call limit exceeded for ${this.serviceName}`);
      }

      // CRITICAL: Execute the operation
      const result = await operation();
      const responseTime = Date.now() - startTime;

      // CRITICAL: Record successful call
      this.recordSuccess(responseTime, callId);

      return result;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // CRITICAL: Record failed call
      this.recordFailure(error as Error, responseTime, callId);

      // CRITICAL: Use fallback if available
      if (fallback && this.state === 'OPEN') {
        try {
          const fallbackResult = await fallback();
          
          this.auditLogger.logAuthorizationDecision({
            tenantId: 'system',
            actorId: 'circuit-breaker',
            action: 'FALLBACK_SUCCESS',
            resourceType: 'CIRCUIT_BREAKER',
            resourceId: this.serviceName,
            outcome: 'SUCCESS',
            correlationId: `cb_fallback_${callId}`,
            metadata: {
              serviceName: this.serviceName,
              state: this.state,
              originalError: (error as Error).message,
              fallbackResponseTime: Date.now() - startTime
            }
          });

          return fallbackResult;

        } catch (fallbackError) {
          this.auditLogger.logAuthorizationDecision({
            tenantId: 'system',
            actorId: 'circuit-breaker',
            action: 'FALLBACK_FAILURE',
            resourceType: 'CIRCUIT_BREAKER',
            resourceId: this.serviceName,
            outcome: 'FAILURE',
            correlationId: `cb_fallback_${callId}`,
            metadata: {
              serviceName: this.serviceName,
              state: this.state,
              originalError: (error as Error).message,
              fallbackError: (fallbackError as Error).message
            }
          });

          throw fallbackError;
        }
      }

      throw error;
    }
  }

  /**
   * CRITICAL: Get current circuit state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * CRITICAL: Get circuit metrics
   */
  getMetrics(): CircuitBreakerMetrics {
    return { ...this.metrics };
  }

  /**
   * CRITICAL: Get circuit configuration
   */
  getConfig(): CircuitBreakerConfig {
    return { ...this.config };
  }

  /**
   * CRITICAL: Force circuit state (for testing/admin)
   */
  forceState(state: CircuitState, reason: string = 'Manual override'): void {
    this.transitionTo(state, reason);
  }

  /**
   * CRITICAL: Reset circuit breaker
   */
  reset(): void {
    this.transitionTo('CLOSED', 'Manual reset');
    this.halfOpenCalls = 0;
    this.failureWindow = [];
  }

  /**
   * CRITICAL: Record successful call
   */
  private recordSuccess(responseTime: number, callId: string): void {
    const now = new Date();
    
    // CRITICAL: Update metrics
    this.metrics.totalCalls++;
    this.metrics.successfulCalls++;
    this.metrics.lastSuccessTime = now;

    // CRITICAL: Add to failure window
    this.failureWindow.push({
      timestamp: now,
      success: true,
      responseTime
    });

    // CRITICAL: Log event
    this.logEvent('CALL_SUCCESS', {
      callId,
      responseTime,
      totalCalls: this.metrics.totalCalls
    });

    // CRITICAL: Handle half-open state
    if (this.state === 'HALF_OPEN') {
      this.halfOpenCalls++;
      
      // CRITICAL: If enough successful calls in half-open, close the circuit
      if (this.halfOpenCalls >= this.config.halfOpenMaxCalls) {
        this.transitionTo('CLOSED', 'Half-open calls succeeded');
      }
    }

    // CRITICAL: Cleanup old failures
    this.cleanupFailureWindow();
  }

  /**
   * CRITICAL: Record failed call
   */
  private recordFailure(error: Error, responseTime: number, callId: string): void {
    const now = new Date();
    
    // CRITICAL: Update metrics
    this.metrics.totalCalls++;
    this.metrics.failedCalls++;
    this.metrics.lastFailureTime = now;

    // CRITICAL: Add to failure window
    this.failureWindow.push({
      timestamp: now,
      success: false,
      responseTime
    });

    // CRITICAL: Log event
    this.logEvent('CALL_FAILURE', {
      callId,
      responseTime,
      error: error.message,
      totalCalls: this.metrics.totalCalls
    });

    // CRITICAL: Check if circuit should trip
    if (this.shouldTrip()) {
      this.transitionTo('OPEN', 'Failure threshold exceeded');
    }

    // CRITICAL: Cleanup old failures
    this.cleanupFailureWindow();
  }

  /**
   * CRITICAL: Check if circuit should trip
   */
  private shouldTrip(): boolean {
    if (this.state === 'OPEN') {
      return false;
    }

    const recentCalls = this.getRecentCalls();
    
    // CRITICAL: Check minimum throughput
    if (recentCalls.length < this.config.minimumThroughput) {
      return false;
    }

    switch (this.config.tripStrategy) {
      case 'FAILURE_COUNT':
        return this.shouldTripByCount(recentCalls);
      case 'FAILURE_RATE':
        return this.shouldTripByRate(recentCalls);
      case 'RESPONSE_TIME':
        return this.shouldTripByResponseTime(recentCalls);
      default:
        return false;
    }
  }

  /**
   * CRITICAL: Check if should trip by failure count
   */
  private shouldTripByCount(recentCalls: Array<{ success: boolean; responseTime: number }>): boolean {
    const failures = recentCalls.filter(call => !call.success);
    return failures.length >= this.config.failureThreshold;
  }

  /**
   * CRITICAL: Check if should trip by failure rate
   */
  private shouldTripByRate(recentCalls: Array<{ success: boolean; responseTime: number }>): boolean {
    const failures = recentCalls.filter(call => !call.success);
    const failureRate = (failures.length / recentCalls.length) * 100;
    
    this.metrics.currentFailureRate = failureRate;
    
    return failureRate >= this.config.failureRateThreshold;
  }

  /**
   * CRITICAL: Check if should trip by response time
   */
  private shouldTripByResponseTime(recentCalls: Array<{ success: boolean; responseTime: number }>): boolean {
    const averageResponseTime = recentCalls.reduce((sum, call) => sum + call.responseTime, 0) / recentCalls.length;
    
    this.metrics.averageResponseTime = averageResponseTime;
    
    return averageResponseTime >= this.config.responseTimeThreshold;
  }

  /**
   * CRITICAL: Check if should attempt reset
   */
  private shouldAttemptReset(): boolean {
    return Date.now() - this.lastStateChange.getTime() >= this.config.resetTimeout;
  }

  /**
   * CRITICAL: Transition to new state
   */
  private transitionTo(newState: CircuitState, reason: string): void {
    const oldState = this.state;
    const timestamp = new Date();

    // CRITICAL: Record state transition
    this.metrics.stateTransitions.push({
      from: oldState,
      to: newState,
      timestamp,
      reason
    });

    // CRITICAL: Update state
    this.state = newState;
    this.lastStateChange = timestamp;

    // CRITICAL: Reset half-open calls if leaving half-open
    if (oldState === 'HALF_OPEN') {
      this.halfOpenCalls = 0;
    }

    // CRITICAL: Log event
    this.logEvent('STATE_CHANGE', {
      from: oldState,
      to: newState,
      reason
    });

    // CRITICAL: Log audit event
    this.auditLogger.logAuthorizationDecision({
      tenantId: 'system',
      actorId: 'circuit-breaker',
      action: 'CIRCUIT_STATE_CHANGE',
      resourceType: 'CIRCUIT_BREAKER',
      resourceId: this.serviceName,
      outcome: 'SUCCESS',
      correlationId: `cb_state_${timestamp.getTime()}`,
      metadata: {
        serviceName: this.serviceName,
        from: oldState,
        to: newState,
        reason,
        totalCalls: this.metrics.totalCalls,
        failureRate: this.metrics.currentFailureRate
      }
    });

    logger.warn('Circuit breaker state changed', {
      serviceName: this.serviceName,
      from: oldState,
      to: newState,
      reason
    });

    // CRITICAL: Log trip event specifically
    if (newState === 'OPEN') {
      this.logEvent('TRIP', {
        reason,
        failureRate: this.metrics.currentFailureRate,
        totalFailures: this.metrics.failedCalls
      });
    }

    // CRITICAL: Log reset event specifically
    if (newState === 'CLOSED' && oldState !== 'HALF_OPEN') {
      this.logEvent('RESET', {
        reason,
        totalCalls: this.metrics.totalCalls
      });
    }
  }

  /**
   * CRITICAL: Get recent calls within monitoring period
   */
  private getRecentCalls(): Array<{ success: boolean; responseTime: number }> {
    const cutoffTime = new Date();
    cutoffTime.setMilliseconds(cutoffTime.getMilliseconds() - this.config.monitoringPeriod);

    return this.failureWindow
      .filter(call => call.timestamp >= cutoffTime)
      .map(call => ({ success: call.success, responseTime: call.responseTime }));
  }

  /**
   * CRITICAL: Cleanup old failure window entries
   */
  private cleanupFailureWindow(): void {
    const cutoffTime = new Date();
    cutoffTime.setMilliseconds(cutoffTime.getMilliseconds() - this.config.monitoringPeriod);

    this.failureWindow = this.failureWindow.filter(call => call.timestamp >= cutoffTime);
  }

  /**
   * CRITICAL: Log circuit breaker event
   */
  private logEvent(eventType: CircuitBreakerEvent['eventType'], metadata: Record<string, any>): void {
    const event: CircuitBreakerEvent = {
      id: this.generateEventId(),
      serviceName: this.serviceName,
      timestamp: new Date(),
      state: this.state,
      eventType,
      metadata
    };

    this.events.push(event);

    // CRITICAL: Keep only recent events (last 1000)
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }
  }

  /**
   * CRITICAL: Merge configuration with defaults
   */
  private mergeConfig(config: Partial<CircuitBreakerConfig>): CircuitBreakerConfig {
    const defaults: CircuitBreakerConfig = {
      failureThreshold: 5,
      resetTimeout: 60000, // 1 minute
      monitoringPeriod: 10000, // 10 seconds
      halfOpenMaxCalls: 3,
      tripStrategy: 'FAILURE_COUNT',
      failureRateThreshold: 50, // 50%
      responseTimeThreshold: 1000, // 1 second
      minimumThroughput: 10
    };

    return { ...defaults, ...config };
  }

  /**
   * CRITICAL: Initialize metrics
   */
  private initializeMetrics(): CircuitBreakerMetrics {
    return {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      currentFailureRate: 0,
      averageResponseTime: 0,
      stateTransitions: []
    };
  }

  /**
   * CRITICAL: Generate call ID
   */
  private generateCallId(): string {
    if (process.env.DETERMINISTIC_TEST_IDS === 'true') {
      this.deterministicCounter += 1;
      return `call_${String(this.deterministicCounter).padStart(8, '0')}`;
    }
    const bytes = crypto.randomBytes(4);
    return `call_${bytes.toString('hex')}`;
  }

  /**
   * CRITICAL: Generate event ID
   */
  private generateEventId(): string {
    if (process.env.DETERMINISTIC_TEST_IDS === 'true') {
      this.deterministicCounter += 1;
      return `event_${String(this.deterministicCounter).padStart(8, '0')}`;
    }
    const bytes = crypto.randomBytes(4);
    return `event_${bytes.toString('hex')}`;
  }

  /**
   * CRITICAL: Get recent events
   */
  getRecentEvents(limit: number = 100): CircuitBreakerEvent[] {
    return this.events.slice(-limit);
  }
}

/**
 * CRITICAL: Circuit Breaker Registry
 * 
 * This class manages multiple circuit breakers and provides centralized monitoring.
 */
export class CircuitBreakerRegistry {
  private static instance: CircuitBreakerRegistry;
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private globalMetrics: {
    totalCircuits: number;
    openCircuits: number;
    halfOpenCircuits: number;
    closedCircuits: number;
    totalCalls: number;
    totalFailures: number;
  };

  private constructor() {
    this.globalMetrics = this.initializeGlobalMetrics();
    this.startMonitoring();
  }

  /**
   * CRITICAL: Get singleton instance
   */
  static getInstance(): CircuitBreakerRegistry {
    if (!CircuitBreakerRegistry.instance) {
      CircuitBreakerRegistry.instance = new CircuitBreakerRegistry();
    }
    return CircuitBreakerRegistry.instance;
  }

  /**
   * CRITICAL: Get or create circuit breaker
   */
  getCircuitBreaker(serviceName: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    let circuitBreaker = this.circuitBreakers.get(serviceName);
    
    if (!circuitBreaker) {
      circuitBreaker = new CircuitBreaker(serviceName, config);
      this.circuitBreakers.set(serviceName, circuitBreaker);
    }

    return circuitBreaker;
  }

  /**
   * CRITICAL: Get all circuit breakers
   */
  getAllCircuitBreakers(): Map<string, CircuitBreaker> {
    return new Map(this.circuitBreakers);
  }

  /**
   * CRITICAL: Get global metrics
   */
  getGlobalMetrics(): typeof this.globalMetrics {
    this.updateGlobalMetrics();
    return { ...this.globalMetrics };
  }

  /**
   * CRITICAL: Reset all circuit breakers
   */
  resetAll(): void {
    for (const circuitBreaker of this.circuitBreakers.values()) {
      circuitBreaker.reset();
    }
  }

  /**
   * CRITICAL: Get circuit breakers by state
   */
  getCircuitBreakersByState(state: CircuitState): CircuitBreaker[] {
    return Array.from(this.circuitBreakers.values())
      .filter(cb => cb.getState() === state);
  }

  /**
   * CRITICAL: Update global metrics
   */
  private updateGlobalMetrics(): void {
    let openCircuits = 0;
    let halfOpenCircuits = 0;
    let closedCircuits = 0;
    let totalCalls = 0;
    let totalFailures = 0;

    for (const circuitBreaker of this.circuitBreakers.values()) {
      const metrics = circuitBreaker.getMetrics();
      const state = circuitBreaker.getState();

      switch (state) {
        case 'OPEN':
          openCircuits++;
          break;
        case 'HALF_OPEN':
          halfOpenCircuits++;
          break;
        case 'CLOSED':
          closedCircuits++;
          break;
      }

      totalCalls += metrics.totalCalls;
      totalFailures += metrics.failedCalls;
    }

    this.globalMetrics = {
      totalCircuits: this.circuitBreakers.size,
      openCircuits,
      halfOpenCircuits,
      closedCircuits,
      totalCalls,
      totalFailures
    };
  }

  /**
   * CRITICAL: Initialize global metrics
   */
  private initializeGlobalMetrics(): typeof this.globalMetrics {
    return {
      totalCircuits: 0,
      openCircuits: 0,
      halfOpenCircuits: 0,
      closedCircuits: 0,
      totalCalls: 0,
      totalFailures: 0
    };
  }

  /**
   * CRITICAL: Start monitoring
   */
  private startMonitoring(): void {
    // CRITICAL: Periodic metrics update
    setInterval(() => {
      this.updateGlobalMetrics();
    }, 10000); // Every 10 seconds

    // CRITICAL: Periodic cleanup of old circuit breakers
    setInterval(() => {
      this.cleanupInactiveCircuits();
    }, 300000); // Every 5 minutes
  }

  /**
   * CRITICAL: Cleanup inactive circuit breakers
   */
  private cleanupInactiveCircuits(): void {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - 1); // 1 hour ago

    for (const [serviceName, circuitBreaker] of this.circuitBreakers.entries()) {
      const metrics = circuitBreaker.getMetrics();
      
      // CRITICAL: Remove circuit breakers that haven't been used recently
      if (metrics.totalCalls === 0 || 
          (metrics.lastSuccessTime && metrics.lastSuccessTime < cutoffTime && 
           metrics.lastFailureTime && metrics.lastFailureTime < cutoffTime)) {
        this.circuitBreakers.delete(serviceName);
        logger.info('Cleaned up inactive circuit breaker', { serviceName });
      }
    }
  }
}

/**
 * CRITICAL: Global circuit breaker registry instance
 */
export const circuitBreakerRegistry = CircuitBreakerRegistry.getInstance();

/**
 * CRITICAL: Convenience functions
 */
export const getCircuitBreaker = (serviceName: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker => {
  return circuitBreakerRegistry.getCircuitBreaker(serviceName, config);
};

export const executeWithCircuitBreaker = async <T>(
  serviceName: string,
  operation: () => Promise<T>,
  fallback?: () => Promise<T>,
  config?: Partial<CircuitBreakerConfig>
): Promise<T> => {
  const circuitBreaker = getCircuitBreaker(serviceName, config);
  return await circuitBreaker.execute(operation, fallback);
};

export const getCircuitBreakerMetrics = (serviceName: string): CircuitBreakerMetrics | null => {
  const circuitBreaker = circuitBreakerRegistry.getAllCircuitBreakers().get(serviceName);
  return circuitBreaker ? circuitBreaker.getMetrics() : null;
};

export const getAllCircuitBreakerMetrics = (): ReturnType<typeof circuitBreakerRegistry.getGlobalMetrics> => {
  return circuitBreakerRegistry.getGlobalMetrics();
};
