/**
 * PRODUCTION HARDENING: Circuit Breaker Wrapper Utility
 * Simplified circuit breaker for external service calls (Stripe, email, APIs)
 * Prevents cascading failures when external services are unavailable
 */

import { logger } from './logger.js';

interface CircuitBreakerConfig {
  failureThreshold: number;     // Number of failures before opening circuit
  resetTimeout: number;          // Time in ms before attempting to close circuit
  monitoringPeriod: number;      // Time window for counting failures
}

enum CircuitState {
  CLOSED = 'CLOSED',      // Normal operation
  OPEN = 'OPEN',          // Failures exceeded threshold, rejecting calls
  HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime = 0;
  private nextAttemptTime = 0;

  constructor(
    private readonly name: string,
    private readonly config: CircuitBreakerConfig
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      // Check if we should attempt to close circuit
      if (Date.now() >= this.nextAttemptTime) {
        this.state = CircuitState.HALF_OPEN;
        logger.info(`Circuit breaker ${this.name} entering HALF_OPEN state`);
      } else {
        throw new Error(
          `Circuit breaker ${this.name} is OPEN - service temporarily unavailable`
        );
      }
    }

    try {
      const result = await fn();
      
      // Success - reset failure count if in HALF_OPEN or CLOSED
      if (this.state === CircuitState.HALF_OPEN) {
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        logger.info(`Circuit breaker ${this.name} closed - service recovered`);
      } else if (this.state === CircuitState.CLOSED) {
        // Reset failure count after monitoring period
        if (Date.now() - this.lastFailureTime > this.config.monitoringPeriod) {
          this.failureCount = 0;
        }
      }
      
      return result;
    } catch (error: any) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.nextAttemptTime = Date.now() + this.config.resetTimeout;
      
      logger.error(
        `Circuit breaker ${this.name} OPENED after ${this.failureCount} failures. ` +
        `Will retry after ${this.config.resetTimeout}ms`
      );
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  getFailureCount(): number {
    return this.failureCount;
  }

  /**
   * Manually reset the circuit breaker
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.lastFailureTime = 0;
    this.nextAttemptTime = 0;
    logger.info(`Circuit breaker ${this.name} manually reset`);
  }
}

// Circuit breaker registry
const breakers = new Map<string, CircuitBreaker>();

/**
 * Gets or creates a circuit breaker for a service
 * @param name Service name
 * @param config Circuit breaker configuration
 * @returns CircuitBreaker instance
 */
export function getCircuitBreaker(
  name: string,
  config: Partial<CircuitBreakerConfig> = {}
): CircuitBreaker {
  if (!breakers.has(name)) {
    const defaultConfig: CircuitBreakerConfig = {
      failureThreshold: 5,        // Open after 5 failures
      resetTimeout: 60000,        // Try again after 60 seconds
      monitoringPeriod: 30000,    // Count failures over 30 seconds
      ...config
    };
    
    breakers.set(name, new CircuitBreaker(name, defaultConfig));
    logger.info(`Circuit breaker created for service: ${name}`);
  }
  
  return breakers.get(name)!;
}

/**
 * Wraps an async function with circuit breaker protection
 * @param serviceName Name of the external service
 * @param fn Function to execute
 * @param config Optional circuit breaker configuration
 * @returns Wrapped function with circuit breaker
 */
export function withCircuitBreaker<T>(
  serviceName: string,
  fn: () => Promise<T>,
  config?: Partial<CircuitBreakerConfig>
): Promise<T> {
  const breaker = getCircuitBreaker(serviceName, config);
  return breaker.execute(fn);
}

/**
 * Resets a circuit breaker (useful for testing or manual recovery)
 * @param name Service name
 */
export function resetCircuitBreaker(name: string): void {
  const breaker = breakers.get(name);
  if (breaker) {
    breaker.reset();
  }
}

/**
 * Gets all circuit breaker states (for monitoring/health checks)
 * @returns Map of service names to their states
 */
export function getAllCircuitBreakerStates(): Record<string, {
  state: string;
  failureCount: number;
}> {
  const states: Record<string, { state: string; failureCount: number }> = {};
  
  breakers.forEach((breaker, name) => {
    states[name] = {
      state: breaker.getState(),
      failureCount: breaker.getFailureCount()
    };
  });
  
  return states;
}
