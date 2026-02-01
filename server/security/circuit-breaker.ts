// Circuit Breaker Pattern Implementation
// Provides fault tolerance and graceful degradation

export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening
  resetTimeout: number; // Time to wait before attempting reset (ms)
  monitoringPeriod: number; // Time window for failure counting (ms)
  halfOpenMaxCalls: number; // Max calls in half-open state
  name: string; // Circuit breaker name for monitoring
}

export enum CircuitState {
  CLOSED = 'CLOSED', // Normal operation
  OPEN = 'OPEN', // Circuit is open, calls fail fast
  HALF_OPEN = 'HALF_OPEN' // Testing if service has recovered
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime?: number;
  lastSuccessTime?: number;
  nextAttemptTime?: number;
}

export class CircuitBreaker {
  private config: CircuitBreakerConfig;
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime?: number;
  private lastSuccessTime?: number;
  private nextAttemptTime?: number;
  private halfOpenCalls: number = 0;
  private failures: number[] = []; // Timestamps of recent failures

  constructor(config: CircuitBreakerConfig) {
    this.config = config;
  }

  private isFailureThresholdReached(): boolean {
    const now = Date.now();
    const recentFailures = this.failures.filter(time => now - time < this.config.monitoringPeriod);
    this.failures = recentFailures;
    return recentFailures.length >= this.config.failureThreshold;
  }

  private shouldAttemptReset(): boolean {
    return this.nextAttemptTime ? Date.now() >= this.nextAttemptTime : false;
  }

  private recordFailure(): void {
    const now = Date.now();
    this.failureCount++;
    this.lastFailureTime = now;
    this.failures.push(now);
    
    // Keep only failures within monitoring period
    this.failures = this.failures.filter(time => now - time < this.config.monitoringPeriod);
    
    if (this.isFailureThresholdReached()) {
      this.open();
    }
  }

  private recordSuccess(): void {
    const now = Date.now();
    this.successCount++;
    this.lastSuccessTime = now;
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.halfOpenCalls++;
      if (this.halfOpenCalls >= this.config.halfOpenMaxCalls) {
        this.close();
      }
    }
  }

  private open(): void {
    this.state = CircuitState.OPEN;
    this.nextAttemptTime = Date.now() + this.config.resetTimeout;
    this.halfOpenCalls = 0;
    
    console.warn(`Circuit breaker ${this.config.name} opened due to failures`, {
      failureCount: this.failureCount,
      nextAttempt: new Date(this.nextAttemptTime).toISOString()
    });
  }

  private close(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.halfOpenCalls = 0;
    this.failures = [];
    
    console.info(`Circuit breaker ${this.config.name} closed`, {
      successCount: this.successCount
    });
  }

  private halfOpen(): void {
    this.state = CircuitState.HALF_OPEN;
    this.halfOpenCalls = 0;
    
    console.info(`Circuit breaker ${this.config.name} half-open`, {
      nextAttempt: new Date(this.nextAttemptTime!).toISOString()
    });
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.halfOpen();
      } else {
        throw new Error(`Circuit breaker ${this.config.name} is open`);
      }
    }

    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      nextAttemptTime: this.nextAttemptTime
    };
  }

  forceOpen(): void {
    this.open();
  }

  forceClose(): void {
    this.close();
  }

  reset(): void {
    this.close();
  }
}

// Request Timeout and Retry Logic
export interface RetryConfig {
  maxRetries: number;
  initialDelay: number; // Initial delay in ms
  maxDelay: number; // Maximum delay in ms
  backoffMultiplier: number; // Delay multiplier for exponential backoff
  retryableErrors: string[]; // Error types that are retryable
  onRetry?: (error: Error, attempt: number) => void; // Callback on retry
}

export class RequestHandler {
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();

  constructor() {
    // Initialize default circuit breakers
    this.createCircuitBreaker('database', {
      failureThreshold: 5,
      resetTimeout: 60000, // 1 minute
      monitoringPeriod: 300000, // 5 minutes
      halfOpenMaxCalls: 3,
      name: 'database'
    });

    this.createCircuitBreaker('external-api', {
      failureThreshold: 3,
      resetTimeout: 30000, // 30 seconds
      monitoringPeriod: 120000, // 2 minutes
      halfOpenMaxCalls: 2,
      name: 'external-api'
    });
  }

  private createCircuitBreaker(key: string, config: CircuitBreakerConfig): void {
    this.circuitBreakers.set(key, new CircuitBreaker(config));
  }

  private getCircuitBreaker(key: string): CircuitBreaker {
    const breaker = this.circuitBreakers.get(key);
    if (!breaker) {
      throw new Error(`Circuit breaker not found for key: ${key}`);
    }
    return breaker;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private calculateDelay(attempt: number, config: RetryConfig): number {
    const delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt - 1);
    return Math.min(delay, config.maxDelay);
  }

  private isRetryableError(error: Error, config: RetryConfig): boolean {
    return config.retryableErrors.some(retryableError => 
      error.message.includes(retryableError) || 
      error.constructor.name.includes(retryableError)
    );
  }

  async executeWithRetry<T>(
    fn: () => Promise<T>,
    config: RetryConfig,
    circuitBreakerKey?: string
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
      try {
        if (circuitBreakerKey) {
          const breaker = this.getCircuitBreaker(circuitBreakerKey);
          return await breaker.execute(fn);
        } else {
          return await fn();
        }
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on last attempt
        if (attempt > config.maxRetries) {
          break;
        }
        
        // Check if error is retryable
        if (!this.isRetryableError(lastError, config)) {
          break;
        }
        
        // Calculate delay and wait
        const delay = this.calculateDelay(attempt, config);
        
        if (config.onRetry) {
          config.onRetry(lastError, attempt);
        }
        
        console.warn(`Request failed, retrying in ${delay}ms`, {
          attempt,
          error: lastError.message,
          nextRetryIn: delay
        });
        
        await this.delay(delay);
      }
    }
    
    throw lastError!;
  }

  async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number,
    timeoutMessage: string = 'Request timeout'
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
      })
    ]);
  }

  async executeWithRetryAndTimeout<T>(
    fn: () => Promise<T>,
    retryConfig: RetryConfig,
    timeoutMs: number,
    circuitBreakerKey?: string
  ): Promise<T> {
    const timeoutFn = () => this.executeWithTimeout(fn, timeoutMs);
    return this.executeWithRetry(timeoutFn, retryConfig, circuitBreakerKey);
  }

  getCircuitBreakerStats(key: string): CircuitBreakerStats | undefined {
    const breaker = this.circuitBreakers.get(key);
    return breaker?.getStats();
  }

  getAllCircuitBreakerStats(): Map<string, CircuitBreakerStats> {
    const stats = new Map<string, CircuitBreakerStats>();
    for (const [key, breaker] of this.circuitBreakers.entries()) {
      stats.set(key, breaker.getStats());
    }
    return stats;
  }

  // Graceful degradation methods
  async executeWithFallback<T>(
    primaryFn: () => Promise<T>,
    fallbackFn: () => Promise<T>,
    config: RetryConfig,
    circuitBreakerKey?: string
  ): Promise<T> {
    try {
      return await this.executeWithRetry(primaryFn, config, circuitBreakerKey);
    } catch (primaryError) {
      const primaryErr = primaryError as Error;
      console.warn('Primary function failed, using fallback', {
        error: primaryErr.message,
        circuitBreakerKey
      });
      
      try {
        return await fallbackFn();
      } catch (fallbackError) {
        const fallbackErr = fallbackError as Error;
        console.error('Both primary and fallback functions failed', {
          primaryError: primaryErr.message,
          fallbackError: fallbackErr.message
        });
        
        throw new Error(`All execution paths failed. Primary: ${primaryErr.message}. Fallback: ${fallbackErr.message}`);
      }
    }
  }

  async executeWithCache<T>(
    key: string,
    fn: () => Promise<T>,
    cacheTtlMs: number = 300000, // 5 minutes default
    config?: RetryConfig,
    circuitBreakerKey?: string
  ): Promise<T> {
    // Simple in-memory cache (in production, use Redis)
    const globalCache = (global as any)._cache || ((global as any)._cache = new Map());
    const cached = globalCache.get(key);
    
    if (cached && cached.timestamp && Date.now() - cached.timestamp < cacheTtlMs) {
      console.debug(`Cache hit for key: ${key}`);
      return cached.data;
    }
    
    const data = config && circuitBreakerKey
      ? await this.executeWithRetryAndTimeout(fn, config, 30000, circuitBreakerKey)
      : await fn();
    
    globalCache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    return data;
  }
}

// Default configurations
export const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'Network Error', 'Timeout']
};

export const defaultTimeoutConfig = {
  database: 30000, // 30 seconds
  externalApi: 15000, // 15 seconds
  internal: 10000 // 10 seconds
};

// Global request handler instance
export const requestHandler = new RequestHandler();
