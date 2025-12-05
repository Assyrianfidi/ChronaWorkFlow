import { 
  CircuitBreaker, 
  CircuitBreakerRegistry, 
  CircuitState,
  withCircuitBreaker 
} from '../../utils/circuitBreaker';

describe('Circuit Breaker', () => {
  beforeEach(() => {
    // Clear all circuit breakers
    CircuitBreakerRegistry.resetAll();
  });

  describe('CircuitBreaker Class', () => {
    let circuitBreaker: CircuitBreaker;

    beforeEach(() => {
      circuitBreaker = new CircuitBreaker('test-service', {
        failureThreshold: 3,
        resetTimeout: 1000, // 1 second for testing
        monitoringPeriod: 500, // 0.5 seconds
        expectedErrorRate: 0.5,
        halfOpenMaxCalls: 2,
      });
    });

    it('should start in CLOSED state', () => {
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should execute successful calls', async () => {
      const successFn = jest.fn().mockResolvedValue('success');
      
      const result = await circuitBreaker.execute(successFn);
      
      expect(result).toBe('success');
      expect(successFn).toHaveBeenCalled();
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should open circuit after failure threshold', async () => {
      const failureFn = jest.fn().mockRejectedValue(new Error('failure'));
      
      // Execute failures to reach threshold
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failureFn);
        } catch (error) {
          // Expected to fail
        }
      }
      
      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
    });

    it('should reject calls when circuit is OPEN', async () => {
      const failureFn = jest.fn().mockRejectedValue(new Error('failure'));
      
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failureFn);
        } catch (error) {
          // Expected to fail
        }
      }
      
      // Try to execute another call
      const anotherFn = jest.fn().mockResolvedValue('success');
      
      await expect(circuitBreaker.execute(anotherFn)).rejects.toThrow(
        'Circuit breaker OPEN for test-service'
      );
      expect(anotherFn).not.toHaveBeenCalled();
    });

    it('should transition to HALF_OPEN after reset timeout', async () => {
      const failureFn = jest.fn().mockRejectedValue(new Error('failure'));
      
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failureFn);
        } catch (error) {
          // Expected to fail
        }
      }
      
      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
      
      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Next call should transition to HALF_OPEN
      const successFn = jest.fn().mockResolvedValue('success');
      await circuitBreaker.execute(successFn);
      
      expect(circuitBreaker.getState()).toBe(CircuitState.HALF_OPEN);
      expect(successFn).toHaveBeenCalled();
    });

    it('should close circuit after successful calls in HALF_OPEN', async () => {
      const failureFn = jest.fn().mockRejectedValue(new Error('failure'));
      const successFn = jest.fn().mockResolvedValue('success');
      
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failureFn);
        } catch (error) {
          // Expected to fail
        }
      }
      
      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Execute successful calls to close circuit
      for (let i = 0; i < 2; i++) {
        await circuitBreaker.execute(successFn);
      }
      
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should open circuit again on failure in HALF_OPEN', async () => {
      const failureFn = jest.fn().mockRejectedValue(new Error('failure'));
      
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failureFn);
        } catch (error) {
          // Expected to fail
        }
      }
      
      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Fail in HALF_OPEN state
      try {
        await circuitBreaker.execute(failureFn);
      } catch (error) {
        // Expected to fail
      }
      
      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
    });

    it('should provide correct statistics', async () => {
      const successFn = jest.fn().mockResolvedValue('success');
      const failureFn = jest.fn().mockRejectedValue(new Error('failure'));
      
      // Execute some calls
      await circuitBreaker.execute(successFn);
      
      // Get stats before failure
      let stats = circuitBreaker.getStats();
      expect(stats.state).toBe(CircuitState.CLOSED);
      expect(stats.successes).toBe(1);
      expect(stats.failures).toBe(0);
      
      try {
        await circuitBreaker.execute(failureFn);
      } catch (error) {
        // Expected to fail
      }
      
      stats = circuitBreaker.getStats();
      // After one failure with 50% error rate threshold, circuit might open
      expect(stats.successes).toBe(1);
      expect(stats.failures).toBe(1);
      expect(stats.errorRate).toBe(0.5);
    });

    it('should reset manually', async () => {
      const failureFn = jest.fn().mockRejectedValue(new Error('failure'));
      
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failureFn);
        } catch (error) {
          // Expected to fail
        }
      }
      
      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
      
      // Reset manually
      circuitBreaker.reset();
      
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
      expect(circuitBreaker.getStats().failures).toBe(0);
      expect(circuitBreaker.getStats().successes).toBe(0);
    });

    it('should open manually', () => {
      circuitBreaker.open();
      
      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
    });
  });

  describe('CircuitBreakerRegistry', () => {
    it('should create and retrieve circuit breakers', () => {
      const breaker1 = CircuitBreakerRegistry.get('service1');
      const breaker2 = CircuitBreakerRegistry.get('service2');
      const breaker1Again = CircuitBreakerRegistry.get('service1');
      
      expect(breaker1).toBe(breaker1Again);
      expect(breaker2).not.toBe(breaker1);
    });

    it('should get all circuit breakers', () => {
      CircuitBreakerRegistry.get('service1');
      CircuitBreakerRegistry.get('service2');
      
      const all = CircuitBreakerRegistry.getAll();
      
      expect(all.size).toBe(2);
      expect(all.has('service1')).toBe(true);
      expect(all.has('service2')).toBe(true);
    });

    it('should get all stats', () => {
      CircuitBreakerRegistry.get('service1');
      CircuitBreakerRegistry.get('service2');
      
      const stats = CircuitBreakerRegistry.getAllStats();
      
      expect(stats).toHaveProperty('service1');
      expect(stats).toHaveProperty('service2');
    });

    it('should check for open circuits', () => {
      const breaker1 = CircuitBreakerRegistry.get('service1');
      const breaker2 = CircuitBreakerRegistry.get('service2');
      
      expect(CircuitBreakerRegistry.hasOpenCircuits()).toBe(false);
      
      breaker1.open();
      
      expect(CircuitBreakerRegistry.hasOpenCircuits()).toBe(true);
      
      breaker2.open();
      
      expect(CircuitBreakerRegistry.hasOpenCircuits()).toBe(true);
      
      breaker1.reset();
      breaker2.reset();
      
      expect(CircuitBreakerRegistry.hasOpenCircuits()).toBe(false);
    });

    it('should reset all circuit breakers', () => {
      const breaker1 = CircuitBreakerRegistry.get('service1');
      const breaker2 = CircuitBreakerRegistry.get('service2');
      
      breaker1.open();
      breaker2.open();
      
      expect(CircuitBreakerRegistry.hasOpenCircuits()).toBe(true);
      
      CircuitBreakerRegistry.resetAll();
      
      expect(CircuitBreakerRegistry.hasOpenCircuits()).toBe(false);
    });
  });

  describe('withCircuitBreaker decorator', () => {
    // Skip decorator tests as they require experimental decorators
    it.skip('should wrap methods with circuit breaker', () => {
      // Test skipped - requires TypeScript experimental decorators
    });

    it.skip('should execute wrapped methods through circuit breaker', async () => {
      // Test skipped - requires TypeScript experimental decorators
    });
  });
});
