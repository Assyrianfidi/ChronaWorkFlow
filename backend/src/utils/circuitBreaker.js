import { LoggingBridge } from './loggingBridge.js';
import { ApiError, ErrorCodes } from './errorHandler.js';

/**
 * Circuit breaker implementation for external services
 */
export class CircuitBreaker {
  private static circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  
  /**
   * Circuit breaker state
   */
  static interface CircuitBreakerState {
    failures: number;
    lastFailureTime: number;
    state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
    timeout: number;
    threshold: number;
    monitoringPeriod: number;
  }

  /**
   * Execute operation with circuit breaker protection
   */
  static async execute<T>(
    serviceName: string,
    operation: () => Promise<T>,
    options: {
      threshold?: number;
      timeout?: number;
      monitoringPeriod?: number;
    } = {}
  ): Promise<T> {
    const {
      threshold = 5,
      timeout = 60000, // 1 minute
      monitoringPeriod = 300000 // 5 minutes
    } = options;

    // Get or create circuit breaker state
    let state = this.circuitBreakers.get(serviceName);
    if (!state) {
      state = {
        failures: 0,
        lastFailureTime: 0,
        state: 'CLOSED',
        timeout,
        threshold,
        monitoringPeriod
      };
      this.circuitBreakers.set(serviceName, state);
    }

    // Check if circuit is open
    if (state.state === 'OPEN') {
      if (Date.now() - state.lastFailureTime > state.timeout) {
        // Try to close circuit (half-open state)
        state.state = 'HALF_OPEN';
        await LoggingBridge.logSystemEvent({
          type: 'INFO',
          message: 'Circuit breaker transitioning to half-open',
          details: { serviceName }
        });
      } else {
        throw new ApiError(
          `Service ${serviceName} is temporarily unavailable`,
          503,
          ErrorCodes.SERVICE_UNAVAILABLE
        );
      }
    }

    try {
      // Execute the operation with timeout
      const result = await this.withTimeout(operation, state.timeout);
      
      // Success - reset failures and close circuit
      if (state.state === 'HALF_OPEN') {
        state.state = 'CLOSED';
        state.failures = 0;
        await LoggingBridge.logSystemEvent({
          type: 'INFO',
          message: 'Circuit breaker closed after successful operation',
          details: { serviceName }
        });
      }
      
      return result;
    } catch (error) {
      // Increment failures
      state.failures++;
      state.lastFailureTime = Date.now();
      
      await LoggingBridge.logSystemEvent({
        type: 'ERROR',
        message: 'Circuit breaker operation failed',
        details: {
          serviceName,
          failures: state.failures,
          threshold: state.threshold,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      
      // Check if threshold exceeded
      if (state.failures >= state.threshold) {
        state.state = 'OPEN';
        await LoggingBridge.logSystemEvent({
          type: 'WARNING',
          message: 'Circuit breaker opened',
          details: {
            serviceName,
            failures: state.failures,
            threshold: state.threshold,
            timeout: state.timeout
          }
        });
      }
      
      throw error;
    }
  }

  /**
   * Execute operation with timeout
   */
  private static async withTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Operation timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      })
    ]);
  }

  /**
   * Get circuit breaker status
   */
  static getStatus(serviceName: string): CircuitBreakerState | undefined {
    return this.circuitBreakers.get(serviceName);
  }

  /**
   * Get all circuit breaker statuses
   */
  static getAllStatuses(): Record<string, CircuitBreakerState> {
    const statuses: Record<string, CircuitBreakerState> = {};
    for (const [name, state] of this.circuitBreakers) {
      statuses[name] = { ...state };
    }
    return statuses;
  }

  /**
   * Reset circuit breaker
   */
  static reset(serviceName: string): void {
    const state = this.circuitBreakers.get(serviceName);
    if (state) {
      state.failures = 0;
      state.state = 'CLOSED';
      state.lastFailureTime = 0;
      
      LoggingBridge.logSystemEvent({
        type: 'INFO',
        message: 'Circuit breaker manually reset',
        details: { serviceName }
      });
    }
  }

  /**
   * Reset all circuit breakers
   */
  static resetAll(): void {
    for (const [serviceName, state] of this.circuitBreakers) {
      state.failures = 0;
      state.state = 'CLOSED';
      state.lastFailureTime = 0;
    }
    
    LoggingBridge.logSystemEvent({
      type: 'INFO',
      message: 'All circuit breakers manually reset',
      details: { count: this.circuitBreakers.size }
    });
  }
}

/**
 * Database circuit breaker with connection pooling
 */
export class DatabaseCircuitBreaker {
  private static breaker = new CircuitBreaker('database', {
    threshold: 3,
    timeout: 30000,
    monitoringPeriod: 120000
  });

  /**
   * Execute database operation with circuit breaker
   */
  static async execute<T>(operation: () => Promise<T>): Promise<T> {
    return CircuitBreaker.execute('database', operation, {
      threshold: 3,
      timeout: 30000
    });
  }

  /**
   * Health check for database
   */
  static async healthCheck(): Promise<{ status: string; latency?: number }> {
    const startTime = Date.now();
    
    try {
      await this.execute(async () => {
        // Simple query to check connection
        await prisma.$queryRaw`SELECT 1`;
      });
      
      return {
        status: 'healthy',
        latency: Date.now() - startTime
      };
    } catch (error) {
      return {
        status: 'unhealthy'
      };
    }
  }
}

/**
 * External API circuit breaker
 */
export class ExternalAPICircuitBreaker {
  /**
   * Execute external API call with circuit breaker
   */
  static async execute<T>(
    apiName: string,
    operation: () => Promise<T>,
    options?: {
      threshold?: number;
      timeout?: number;
    }
  ): Promise<T> {
    return CircuitBreaker.execute(apiName, operation, {
      threshold: options?.threshold || 5,
      timeout: options?.timeout || 10000
    });
  }
}

/**
 * Cache circuit breaker
 */
export class CacheCircuitBreaker {
  /**
   * Execute cache operation with circuit breaker
   */
  static async execute<T>(operation: () => Promise<T>): Promise<T> {
    return CircuitBreaker.execute('cache', operation, {
      threshold: 10,
      timeout: 5000
    });
  }
}
