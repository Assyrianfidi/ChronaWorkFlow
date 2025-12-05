/**
 * Circuit Breaker Pattern Implementation
 * Provides fault tolerance for external service calls
 */

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerOptions {
  failureThreshold?: number;      // Number of failures before opening
  resetTimeout?: number;          // Milliseconds to wait before trying again
  monitoringPeriod?: number;      // Milliseconds to monitor for failures
  expectedErrorRate?: number;      // Error rate threshold (0-1)
  halfOpenMaxCalls?: number;       // Max calls in half-open state
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private successes: number = 0;
  private nextAttempt: number = Date.now();
  private lastFailureTime: number = 0;
  private halfOpenCalls: number = 0;

  constructor(
    private service: string,
    private options: CircuitBreakerOptions = {}
  ) {
    // Default options
    this.options = {
      failureThreshold: options.failureThreshold || 5,
      resetTimeout: options.resetTimeout || 60000, // 1 minute
      monitoringPeriod: options.monitoringPeriod || 10000, // 10 seconds
      expectedErrorRate: options.expectedErrorRate || 0.5, // 50%
      halfOpenMaxCalls: options.halfOpenMaxCalls || 3,
      ...options,
    };
  }

  /**
   * Execute a function through the circuit breaker
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const now = Date.now();

    // Check if circuit should reset
    if (this.state === CircuitState.OPEN && now >= this.nextAttempt) {
      this.state = CircuitState.HALF_OPEN;
      this.halfOpenCalls = 0;
      console.log(`[CIRCUIT_BREAKER] ${this.service}: Opening to HALF_OPEN state`);
    }

    // Reject calls if circuit is open
    if (this.state === CircuitState.OPEN) {
      throw new Error(`Circuit breaker OPEN for ${this.service}. Next attempt at ${new Date(this.nextAttempt).toISOString()}`);
    }

    // Limit calls in half-open state
    if (this.state === CircuitState.HALF_OPEN && this.halfOpenCalls >= this.options.halfOpenMaxCalls!) {
      throw new Error(`Circuit breaker HALF_OPEN for ${this.service}. Max calls exceeded.`);
    }

    try {
      // Execute the function
      const result = await fn();
      
      // Record success
      this.onSuccess(now);
      
      return result;
    } catch (error) {
      // Record failure
      this.onFailure(now);
      
      // Re-throw the error
      throw error;
    }
  }

  /**
   * Handle successful execution
   */
  private onSuccess(now: number): void {
    this.successes++;
    this.failures = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.halfOpenCalls++;
      
      // If enough successful calls in half-open, close the circuit
      if (this.halfOpenCalls >= this.options.halfOpenMaxCalls!) {
        this.state = CircuitState.CLOSED;
        console.log(`[CIRCUIT_BREAKER] ${this.service}: Circuit CLOSED after successful half-open period`);
      }
    }

    console.log(`[CIRCUIT_BREAKER] ${this.service}: Success recorded. State: ${this.state}`);
  }

  /**
   * Handle failed execution
   */
  private onFailure(now: number): void {
    this.failures++;
    this.lastFailureTime = now;

    if (this.state === CircuitState.HALF_OPEN) {
      // Any failure in half-open opens the circuit again
      this.state = CircuitState.OPEN;
      this.nextAttempt = now + this.options.resetTimeout!;
      console.log(`[CIRCUIT_BREAKER] ${this.service}: Circuit OPEN after failure in half-open state`);
    } else if (this.state === CircuitState.CLOSED) {
      // Check if we should open the circuit
      const errorRate = this.getErrorRate(now);
      
      if (this.failures >= this.options.failureThreshold! || 
          errorRate >= this.options.expectedErrorRate!) {
        this.state = CircuitState.OPEN;
        this.nextAttempt = now + this.options.resetTimeout!;
        console.log(`[CIRCUIT_BREAKER] ${this.service}: Circuit OPEN. Failures: ${this.failures}, Error Rate: ${(errorRate * 100).toFixed(2)}%`);
      }
    }

    console.log(`[CIRCUIT_BREAKER] ${this.service}: Failure recorded. State: ${this.state}, Total Failures: ${this.failures}`);
  }

  /**
   * Calculate error rate for the monitoring period
   */
  private getErrorRate(now: number): number {
    const period = this.options.monitoringPeriod!;
    const totalCalls = this.successes + this.failures;
    
    if (totalCalls === 0) return 0;
    
    // Only consider failures within the monitoring period
    if (now - this.lastFailureTime > period) {
      return 0;
    }
    
    return this.failures / totalCalls;
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get circuit statistics
   */
  getStats(): {
    state: CircuitState;
    failures: number;
    successes: number;
    nextAttempt: Date | null;
    errorRate: number;
  } {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      nextAttempt: this.state === CircuitState.OPEN ? new Date(this.nextAttempt) : null,
      errorRate: this.getErrorRate(Date.now()),
    };
  }

  /**
   * Manually reset the circuit
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.nextAttempt = Date.now();
    this.lastFailureTime = 0;
    this.halfOpenCalls = 0;
    console.log(`[CIRCUIT_BREAKER] ${this.service}: Circuit manually reset to CLOSED`);
  }

  /**
   * Manually open the circuit
   */
  open(): void {
    this.state = CircuitState.OPEN;
    this.nextAttempt = Date.now() + this.options.resetTimeout!;
    console.log(`[CIRCUIT_BREAKER] ${this.service}: Circuit manually OPENED`);
  }
}

/**
 * Circuit Breaker Registry
 * Manages multiple circuit breakers
 */
export class CircuitBreakerRegistry {
  private static breakers: Map<string, CircuitBreaker> = new Map();

  /**
   * Get or create a circuit breaker for a service
   */
  static get(service: string, options?: CircuitBreakerOptions): CircuitBreaker {
    if (!this.breakers.has(service)) {
      this.breakers.set(service, new CircuitBreaker(service, options));
    }
    return this.breakers.get(service)!;
  }

  /**
   * Get all circuit breakers
   */
  static getAll(): Map<string, CircuitBreaker> {
    return this.breakers;
  }

  /**
   * Get all statuses for circuit breakers
   */
  static getAllStatuses(): Record<string, any> {
    const statuses: Record<string, any> = {};
    
    for (const [service, breaker] of this.breakers) {
      statuses[service] = {
        state: breaker.getState(),
        stats: breaker.getStats()
      };
    }
    
    return statuses;
  }

  /**
   * Get statistics for all circuit breakers
   */
  static getAllStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    for (const [service, breaker] of this.breakers) {
      stats[service] = breaker.getStats();
    }
    
    return stats;
  }

  /**
   * Reset all circuit breakers
   */
  static resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }

  /**
   * Check if any circuit breakers are open
   */
  static hasOpenCircuits(): boolean {
    for (const breaker of this.breakers.values()) {
      if (breaker.getState() === CircuitState.OPEN) {
        return true;
      }
    }
    return false;
  }
}

/**
 * Decorator to apply circuit breaker to a method
 */
export function withCircuitBreaker(service: string, options?: CircuitBreakerOptions) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const breaker = CircuitBreakerRegistry.get(service, options);
      return breaker.execute(() => originalMethod.apply(this, args));
    };

    return descriptor;
  };
}
