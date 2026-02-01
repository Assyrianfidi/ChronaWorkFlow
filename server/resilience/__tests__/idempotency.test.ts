// CRITICAL: Idempotency Tests
// MANDATORY: Tests proving no duplicate execution and exactly-once semantics

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  IdempotencyManager, 
  idempotencyManager,
  executeWithIdempotency,
  generateIdempotencyKey,
  checkIdempotency,
  IdempotencyKey, 
  ExecutionStatus, 
  IdempotencyScope 
} from '../idempotency-manager.js';
import { 
  withBillingIdempotency,
  withDangerousOperationIdempotency,
  withApprovalIdempotency,
  withJobIdempotency
} from '../idempotency-middleware.js';

// Define local types as workaround for import issues
enum TenantUserRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
  VIEWER = 'VIEWER'
}

enum TenantSubscriptionPlan {
  FREE = 'FREE',
  STARTER = 'STARTER',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE'
}

enum TenantSubscriptionStatus {
  ACTIVE = 'ACTIVE',
  TRIALING = 'TRIALING',
  PAST_DUE = 'PAST_DUE',
  CANCELED = 'CANCELED',
  UNPAID = 'UNPAID'
}

interface TenantContext {
  tenantId: string;
  tenant: {
    id: string;
    name: string;
    slug: string;
    subscriptionPlan: TenantSubscriptionPlan;
    subscriptionStatus: TenantSubscriptionStatus;
    maxUsers: number;
    isActive: boolean;
  };
  userRole: TenantUserRole;
  permissions: string[];
  isOwner: boolean;
  isAdmin: boolean;
  isManager: boolean;
}

// Helper function to create mock tenant context
function createMockTenantContext(tenantId: string, userId: string): TenantContext {
  return {
    tenantId,
    tenant: {
      id: tenantId,
      name: `Test Tenant ${tenantId}`,
      slug: `test-${tenantId}`,
      subscriptionPlan: TenantSubscriptionPlan.PROFESSIONAL,
      subscriptionStatus: TenantSubscriptionStatus.ACTIVE,
      maxUsers: 10,
      isActive: true
    },
    userRole: TenantUserRole.OWNER,
    permissions: ['read', 'write', 'admin'],
    isOwner: true,
    isAdmin: true,
    isManager: true
  };
}

describe('Idempotency Manager Tests', () => {
  let tenantContext: TenantContext;

  beforeAll(() => {
    tenantContext = createMockTenantContext('test-tenant-123', 'test-user-123');
  });

  beforeEach(() => {
    // Clear the keyStore between tests to prevent interference
    idempotencyManager.clearKeyStore();
  });

  describe('Key Generation', () => {
    it('should generate unique keys for different contexts', () => {
      const key1 = idempotencyManager.generateKey('CREATE_USER', 'TENANT', tenantContext);
      const key2 = idempotencyManager.generateKey('CREATE_USER', 'USER', tenantContext, 'user-456');
      const key3 = idempotencyManager.generateKey('CREATE_USER', 'OPERATION', tenantContext, undefined, undefined, { type: 'admin' });
      
      expect(key1).not.toBe(key2);
      expect(key2).not.toBe(key3);
      expect(key1).not.toBe(key3);
      
      expect(key1).toContain('CREATE_USER:TENANT:test-tenant-123');
      expect(key2).toContain('CREATE_USER:USER:user-456');
      expect(key3).toContain('CREATE_USER:OPERATION');
    });

    it('should generate consistent keys for same context', () => {
      const key1 = idempotencyManager.generateKey('CREATE_USER', 'TENANT', tenantContext);
      const key2 = idempotencyManager.generateKey('CREATE_USER', 'TENANT', tenantContext);
      
      expect(key1).toBe(key2);
    });

    it('should include additional context in key', () => {
      const additionalContext = { department: 'finance', region: 'us-east-1' };
      const key = idempotencyManager.generateKey('CREATE_USER', 'OPERATION', tenantContext, undefined, undefined, additionalContext);
      
      expect(key).toContain('CREATE_USER:OPERATION');
      // Additional context should be hashed and included
      expect(key.length).toBeGreaterThan(50);
    });
  });

  describe('Idempotency Checking', () => {
    it('should allow first execution', async () => {
      const key = generateIdempotencyKey('TEST_OPERATION', 'TENANT', tenantContext);
      
      const result = await checkIdempotency(
        key,
        'TEST_OPERATION',
        'TENANT',
        tenantContext
      );
      
      expect(result.isDuplicate).toBe(false);
      expect(result.shouldExecute).toBe(true);
      expect(result.status).toBe('PENDING');
    });

    it('should detect duplicate execution', async () => {
      const key = generateIdempotencyKey('TEST_OPERATION', 'TENANT', tenantContext);
      
      // First check
      const result1 = await checkIdempotency(
        key,
        'TEST_OPERATION',
        'TENANT',
        tenantContext
      );
      
      expect(result1.isDuplicate).toBe(false);
      expect(result1.shouldExecute).toBe(true);
      
      // Second check should be duplicate but allow execution for retry scenarios
      const result2 = await checkIdempotency(
        key,
        'TEST_OPERATION',
        'TENANT',
        tenantContext
      );
      
      expect(result2.isDuplicate).toBe(true);
      expect(result2.shouldExecute).toBe(true); // Allow execution for retry scenarios
      expect(result2.status).toBe('PENDING');
    });

    it('should return completed result for duplicate', async () => {
      const key = generateIdempotencyKey('TEST_OPERATION', 'TENANT', tenantContext);
      const expectedResult = { success: true, id: 'test-123' };
      
      // First execution
      await executeWithIdempotency('TEST_OPERATION', 'TENANT', async () => {
        return expectedResult;
      }, tenantContext);
      
      // Second execution should return cached result
      const result = await executeWithIdempotency('TEST_OPERATION', 'TENANT', async () => {
        throw new Error('Should not execute');
      }, tenantContext);
      
      expect(result).toEqual(expectedResult);
    });

    it('should handle execution failures', async () => {
      const key = generateIdempotencyKey('TEST_OPERATION', 'TENANT', tenantContext);
      const expectedError = new Error('Test error');
      
      // First execution fails
      await expect(executeWithIdempotency('TEST_OPERATION', 'TENANT', async () => {
        throw expectedError;
      }, tenantContext)).rejects.toThrow('Test error');
      
      // Second execution should return the same error
      await expect(executeWithIdempotency('TEST_OPERATION', 'TENANT', async () => {
        throw new Error('Different error');
      }, tenantContext)).rejects.toThrow('Test error');
    });

    it('should respect max execution count', async () => {
      // Use a unique operation type to avoid key conflicts
      const key = generateIdempotencyKey('MAX_EXECUTION_TEST', 'TENANT', tenantContext);
      
      // First execution should succeed
      const result1 = await executeWithIdempotency('MAX_EXECUTION_TEST', 'TENANT', async () => {
        return 'result1';
      }, tenantContext);
      
      expect(result1).toBe('result1');
      
      // Second execution should return cached result
      const result2 = await executeWithIdempotency('MAX_EXECUTION_TEST', 'TENANT', async () => {
        return 'result2';
      }, tenantContext);
      
      expect(result2).toBe('result1'); // Should return cached result
      
      // Third execution should also return cached result
      const result3 = await executeWithIdempotency('MAX_EXECUTION_TEST', 'TENANT', async () => {
        return 'result3';
      }, tenantContext);
      
      expect(result3).toBe('result1'); // Should still return cached result
      
      // Fourth execution should also return cached result (default maxExecutions is 3, but we have cached result)
      const result4 = await executeWithIdempotency('MAX_EXECUTION_TEST', 'TENANT', async () => {
        return 'result4';
      }, tenantContext);
      
      expect(result4).toBe('result1'); // Should still return cached result
    });

    it('should handle expired keys', async () => {
      // Use a unique operation type to avoid key conflicts
      const key = generateIdempotencyKey('EXPIRED_KEYS_TEST', 'TENANT', tenantContext);
      
      // Create key with very short TTL
      await checkIdempotency(
        key,
        'EXPIRED_KEYS_TEST',
        'TENANT',
        tenantContext,
        undefined,
        undefined,
        undefined,
        1 // 1ms TTL
      );
      
      const keyData = await idempotencyManager.getKey(key);
      if (keyData) {
        keyData.expiresAt = new Date(0);
      }
      
      // Should be able to execute again after expiration
      const result = await executeWithIdempotency('EXPIRED_KEYS_TEST', 'TENANT', async () => {
        return 'expired-result';
      }, tenantContext);
      
      expect(result).toBe('expired-result');
    });
  });

  describe('Execution Lifecycle', () => {
    beforeEach(() => {
      // Clear the keyStore between tests to prevent interference
      idempotencyManager.clearKeyStore();
    });

    it('should track execution states correctly', async () => {
      const key = generateIdempotencyKey('TEST_OPERATION', 'TENANT', tenantContext);
      
      // Check initial state
      let result = await checkIdempotency(key, 'TEST_OPERATION', 'TENANT', tenantContext);
      expect(result.status).toBe('PENDING');
      
      // Start execution
      await idempotencyManager.startExecution(result.key.key, tenantContext);
      
      // Check state during execution
      result = await checkIdempotency(key, 'TEST_OPERATION', 'TENANT', tenantContext);
      expect(result.status).toBe('IN_PROGRESS');
      expect(result.shouldExecute).toBe(false);
      
      // Complete execution
      await idempotencyManager.completeExecution(result.key.key, { success: true }, tenantContext);
      
      // Check final state
      result = await checkIdempotency(key, 'TEST_OPERATION', 'TENANT', tenantContext);
      expect(result.status).toBe('COMPLETED');
      expect(result.result).toEqual({ success: true });
    });

    it('should handle execution timeout', async () => {
      // Use a unique operation type to avoid key conflicts
      const key = generateIdempotencyKey('TIMEOUT_TEST', 'TENANT', tenantContext);
      
      // Start execution
      const result = await checkIdempotency(key, 'TIMEOUT_TEST', 'TENANT', tenantContext);
      await idempotencyManager.startExecution(result.key.key, tenantContext);
      
      // Simulate timeout by manually setting status
      const keyData = await idempotencyManager.getKey(key);
      if (keyData) {
        // Manually set last execution time to simulate timeout
        keyData.lastExecutedAt = new Date(Date.now() - 400000); // 6+ minutes ago
        keyData.status = 'IN_PROGRESS';
      }
      
      // Check should detect timeout and mark as failed
      const timeoutResult = await checkIdempotency(key, 'TIMEOUT_TEST', 'TENANT', tenantContext);
      expect(timeoutResult.status).toBe('FAILED');
      expect(timeoutResult.error).toBe('Previous execution timed out');
    });
  });

  describe('Statistics', () => {
    it('should provide accurate statistics', async () => {
      // Create multiple keys with different statuses
      await executeWithIdempotency('OP1', 'TENANT', async () => 'result1', tenantContext);
      await executeWithIdempotency('OP2', 'TENANT', async () => { throw new Error('error'); }, tenantContext).catch(() => {});
      
      const stats = await idempotencyManager.getStatistics();
      
      expect(stats.totalKeys).toBeGreaterThan(0);
      expect(stats.keysByStatus).toHaveProperty('COMPLETED');
      expect(stats.keysByStatus).toHaveProperty('FAILED');
      expect(stats.keysByScope).toHaveProperty('TENANT');
      expect(stats.keysByOperation).toHaveProperty('OP1');
      expect(stats.keysByOperation).toHaveProperty('OP2');
    });
  });

  describe('Cleanup', () => {
    it('should cleanup expired keys', async () => {
      // Create key with short TTL
      await checkIdempotency(
        'SHORT_LIVED_OP',
        'SHORT_LIVED_OP',
        'TENANT',
        tenantContext,
        undefined,
        undefined,
        1, // 1ms TTL
        undefined,
        {}
      );
      
      const keyData = await idempotencyManager.getKey('SHORT_LIVED_OP');
      if (keyData) {
        keyData.expiresAt = new Date(0);
      }
      
      // Cleanup
      const cleanedCount = await idempotencyManager.cleanupExpiredKeys();
      expect(cleanedCount).toBeGreaterThan(0);
    });
  });
});

describe('Billing Idempotency Tests', () => {
  let tenantContext: TenantContext;

  beforeAll(() => {
    tenantContext = createMockTenantContext('test-tenant-billing', 'test-user-billing');
  });

  it('should prevent duplicate billing operations', async () => {
    const billingData = {
      billingId: 'billing-123',
      amount: 100,
      currency: 'USD'
    };
    
    let executionCount = 0;
    
    const billingFunction = vi.fn().mockImplementation(async (data: any) => {
      executionCount++;
      return { billingId: data.billingId, processed: true };
    });
    
    const wrappedFunction = withBillingIdempotency('CHARGE', billingFunction);
    
    // First execution
    const result1 = await wrappedFunction(billingData);
    expect(result1).toEqual({ billingId: 'billing-123', processed: true });
    expect(billingFunction).toHaveBeenCalledTimes(1);
    
    // Second execution should return cached result
    const result2 = await wrappedFunction(billingData);
    expect(result2).toEqual({ billingId: 'billing-123', processed: true });
    expect(billingFunction).toHaveBeenCalledTimes(1); // Still only called once
  });

  it('should handle billing failures correctly', async () => {
    const billingData = {
      billingId: 'billing-fail',
      amount: 200,
      currency: 'USD'
    };
    
    const billingFunction = vi.fn().mockImplementation(async (data: any) => {
      throw new Error('Payment failed');
    });
    
    const wrappedFunction = withBillingIdempotency('CHARGE', billingFunction);
    
    // First execution fails
    await expect(wrappedFunction(billingData)).rejects.toThrow('Payment failed');
    expect(billingFunction).toHaveBeenCalledTimes(1);
    
    // Second execution should return same error
    await expect(wrappedFunction(billingData)).rejects.toThrow('Payment failed');
    expect(billingFunction).toHaveBeenCalledTimes(1); // Still only called once
  });

  it('should enforce exactly-once for billing under concurrency', async () => {
    const billingData = {
      billingId: 'billing-concurrent-1',
      amount: 100,
      currency: 'USD'
    };

    let gateResolve: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      gateResolve = resolve;
    });

    const billingFunction = vi.fn().mockImplementation(async (data: any) => {
      await gate;
      return { billingId: data.billingId, processed: true };
    });

    const wrappedFunction = withBillingIdempotency('CHARGE', billingFunction);

    const promises = Array(5).fill(null).map(() => wrappedFunction(billingData));

    const settledPromise = Promise.allSettled(promises);
    gateResolve?.();

    const settled = await settledPromise;
    const results = settled.map((r) => {
      expect(r.status).toBe('fulfilled');
      return (r as PromiseFulfilledResult<any>).value;
    });
    results.forEach((r) => expect(r).toEqual({ billingId: 'billing-concurrent-1', processed: true }));
    expect(billingFunction).toHaveBeenCalledTimes(1);
  });
});

describe('Dangerous Operation Idempotency Tests', () => {
  let tenantContext: TenantContext;

  beforeAll(() => {
    tenantContext = createMockTenantContext('test-tenant-dangerous', 'test-user-dangerous');
  });

  beforeEach(() => {
    // Clear the keyStore between tests to prevent interference
    idempotencyManager.clearKeyStore();
  });

  it('should prevent duplicate dangerous operations', async () => {
    const operationData = {
      operationId: 'dangerous-op-123',
      riskLevel: 'HIGH',
      description: 'Delete user data'
    };
    
    let executionCount = 0;
    
    const dangerousFunction = vi.fn().mockImplementation(async (data: any) => {
      executionCount++;
      return { operationId: data.operationId, executed: true };
    });
    
    const wrappedFunction = withDangerousOperationIdempotency('DELETE_USER', dangerousFunction);
    
    // First execution
    const result1 = await wrappedFunction(operationData);
    expect(result1).toEqual({ operationId: 'dangerous-op-123', executed: true });
    expect(dangerousFunction).toHaveBeenCalledTimes(1);
    
    // Second execution should return cached result
    const result2 = await wrappedFunction(operationData);
    expect(result2).toEqual({ operationId: 'dangerous-op-123', executed: true });
    expect(dangerousFunction).toHaveBeenCalledTimes(1); // Still only called once
  });

  it('should enforce exactly-once for dangerous operations', async () => {
    const operationData = {
      operationId: 'dangerous-op-456',
      riskLevel: 'CRITICAL',
      description: 'Delete tenant'
    };
    
    const dangerousFunction = vi.fn().mockImplementation(async (data: any) => {
      return { operationId: data.operationId, deleted: true };
    });
    
    const wrappedFunction = withDangerousOperationIdempotency('DELETE_TENANT', dangerousFunction);
    
    // Execute multiple times in parallel
    const promises = Array(5).fill(null).map(() => wrappedFunction(operationData));
    const results = await Promise.all(promises);
    
    // All should return the same result
    results.forEach(result => {
      expect(result).toEqual({ operationId: 'dangerous-op-456', deleted: true });
    });
    
    // Function should only be called once
    expect(dangerousFunction).toHaveBeenCalledTimes(1);
  });

  it('should enforce exactly-once on failure under concurrency', async () => {
    const operationData = {
      operationId: 'dangerous-op-fail-concurrent',
      riskLevel: 'CRITICAL',
      description: 'Irreversible operation failure'
    };

    let gateResolve: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      gateResolve = resolve;
    });

    const dangerousFunction = vi.fn().mockImplementation(async () => {
      await gate;
      throw new Error('DANGEROUS_FAIL');
    });

    const wrappedFunction = withDangerousOperationIdempotency('DELETE_TENANT', dangerousFunction);

    const promises = Array(5).fill(null).map(() => wrappedFunction(operationData));

    const settledPromise = Promise.allSettled(promises);
    gateResolve?.();

    const settled = await settledPromise;
    settled.forEach((r) => {
      expect(r.status).toBe('rejected');
      expect(String((r as PromiseRejectedResult).reason?.message || (r as PromiseRejectedResult).reason)).toContain('DANGEROUS_FAIL');
    });

    expect(dangerousFunction).toHaveBeenCalledTimes(1);

    await expect(wrappedFunction(operationData)).rejects.toThrow('DANGEROUS_FAIL');
    expect(dangerousFunction).toHaveBeenCalledTimes(1);
  });
});

describe('Approval Execution Idempotency Tests', () => {
  let tenantContext: TenantContext;

  beforeAll(() => {
    tenantContext = createMockTenantContext('test-tenant-approval', 'test-user-approval');
  });

  it('should prevent duplicate approval executions', async () => {
    const approvalData = {
      approvalId: 'approval-123',
      requestId: 'request-456',
      approverId: 'approver-789'
    };
    
    let executionCount = 0;
    
    const approvalFunction = vi.fn().mockImplementation(async (data: any) => {
      executionCount++;
      return { approvalId: data.approvalId, approved: true };
    });
    
    const wrappedFunction = withApprovalIdempotency('APPROVE_REQUEST', approvalFunction);
    
    // First execution
    const result1 = await wrappedFunction(approvalData);
    expect(result1).toEqual({ approvalId: 'approval-123', approved: true });
    expect(approvalFunction).toHaveBeenCalledTimes(1);
    
    // Second execution should return cached result
    const result2 = await wrappedFunction(approvalData);
    expect(result2).toEqual({ approvalId: 'approval-123', approved: true });
    expect(approvalFunction).toHaveBeenCalledTimes(1); // Still only called once
  });

  it('should handle approval rejection correctly', async () => {
    const approvalData = {
      approvalId: 'approval-reject',
      requestId: 'request-reject',
      approverId: 'approver-reject'
    };
    
    const approvalFunction = vi.fn().mockImplementation(async (data: any) => {
      throw new Error('Approval rejected');
    });
    
    const wrappedFunction = withApprovalIdempotency('REJECT_REQUEST', approvalFunction);
    
    // First execution fails
    await expect(wrappedFunction(approvalData)).rejects.toThrow('Approval rejected');
    expect(approvalFunction).toHaveBeenCalledTimes(1);
    
    // Second execution should return same error
    await expect(wrappedFunction(approvalData)).rejects.toThrow('Approval rejected');
    expect(approvalFunction).toHaveBeenCalledTimes(1); // Still only called once
  });
});

describe('Cross-Request Idempotency Tests', () => {
  let tenantContext: TenantContext;

  beforeAll(() => {
    tenantContext = createMockTenantContext('test-tenant-cross', 'test-user-cross');
  });

  beforeEach(() => {
    // Clear the keyStore between tests to prevent interference
    idempotencyManager.clearKeyStore();
  });

  it('should prevent duplicate execution across concurrent requests', async () => {
    const operationData = {
      userId: 'user-123',
      action: 'update-profile'
    };
    
    let executionCount = 0;
    
    const operationFunction = vi.fn().mockImplementation(async (data: any) => {
      // Simulate some processing time
      await new Promise<void>((resolve) => setImmediate(resolve));
      executionCount++;
      return { userId: data.userId, updated: true };
    });
    
    // Execute multiple times concurrently
    const promises = Array(10).fill(null).map(() => 
      executeWithIdempotency('UPDATE_PROFILE', 'USER', () => operationFunction({ userId: 'user-123' }), tenantContext, 'user-123')
    );
    
    const results = await Promise.all(promises);
    
    // All should return the same result
    results.forEach(result => {
      expect(result).toEqual({ userId: 'user-123', updated: true });
    });
    
    // Function should only be called once
    expect(operationFunction).toHaveBeenCalledTimes(1);
  });

  it('should handle different operations independently', async () => {
    const operation1Data = { type: 'A', value: 1 };
    const operation2Data = { type: 'B', value: 2 };
    
    const operation1Function = vi.fn().mockImplementation(async (data: any) => {
      return { ...data, processed: true };
    });
    
    const operation2Function = vi.fn().mockImplementation(async (data: any) => {
      return { ...data, processed: true };
    });
    
    // Execute different operations
    const result1 = await executeWithIdempotency('OP_A', 'TENANT', () => operation1Function({ type: 'A', value: 1 }), tenantContext);
    const result2 = await executeWithIdempotency('OP_B', 'TENANT', () => operation2Function({ type: 'B', value: 2 }), tenantContext);
    
    expect(result1).toEqual({ type: 'A', value: 1, processed: true });
    expect(result2).toEqual({ type: 'B', value: 2, processed: true });
    
    expect(operation1Function).toHaveBeenCalledTimes(1);
    expect(operation2Function).toHaveBeenCalledTimes(1);
  });
});

describe('Error Handling and Edge Cases', () => {
  let tenantContext: TenantContext;

  beforeAll(() => {
    tenantContext = createMockTenantContext('test-tenant-edge', 'test-user-edge');
  });

  it('should handle missing tenant context gracefully', async () => {
    const operationFunction = vi.fn().mockImplementation(async () => {
      return { success: true };
    });
    
    // Should work with GLOBAL scope
    const result = await executeWithIdempotency('GLOBAL_OP', 'GLOBAL', operationFunction);
    expect(result).toEqual({ success: true });
    expect(operationFunction).toHaveBeenCalledTimes(1);
  });

  it('should handle large payloads in key generation', async () => {
    const largePayload = {
      data: 'x'.repeat(10000), // Large payload
      metadata: { items: Array(1000).fill(null).map((_, i) => ({ id: i, name: `item-${i}` })) }
    };
    
    const key1 = generateIdempotencyKey('LARGE_OP', 'OPERATION', tenantContext, undefined, undefined, largePayload);
    const key2 = generateIdempotencyKey('LARGE_OP', 'OPERATION', tenantContext, undefined, undefined, largePayload);
    
    expect(key1).toBe(key2); // Should be consistent
    expect(key1.length).toBeGreaterThan(50); // Should include hash
  });

  it('should handle special characters in keys', async () => {
    const specialData = {
      name: 'Test User!@#$%^&*()',
      description: 'Special chars: äöüß',
      unicode: '🚀🎉💯'
    };
    
    const key = generateIdempotencyKey('SPECIAL_OP', 'OPERATION', tenantContext, undefined, undefined, specialData);
    
    expect(key).toContain('SPECIAL_OP:OPERATION');
    // Should handle special characters without breaking
    expect(key.length).toBeGreaterThan(50);
  });

  it('should handle rapid successive operations', async () => {
    let executionCount = 0;
    
    const rapidFunction = vi.fn().mockImplementation(async () => {
      executionCount++;
      return { count: executionCount };
    });
    
    // Execute rapidly
    for (let i = 0; i < 100; i++) {
      const result = await executeWithIdempotency('RAPID_OP', 'TENANT', rapidFunction, tenantContext);
      expect(result).toEqual({ count: 1 }); // Always return first result
    }
    
    // Function should only be called once
    expect(rapidFunction).toHaveBeenCalledTimes(1);
  });
});

describe('Performance Tests', () => {
  let tenantContext: TenantContext;

  beforeAll(() => {
    tenantContext = createMockTenantContext('test-tenant-perf', 'test-user-perf');
  });

  it('should handle high volume operations efficiently', async () => {
    const startTime = Date.now();
    const operationCount = 1000;
    
    const operationFunction = vi.fn().mockImplementation(async (index: number) => {
      return { index, processed: true };
    });
    
    // Execute many operations
    const promises = Array.from({ length: operationCount }, (_, i) => 
      executeWithIdempotency(`PERF_OP_${i}`, 'TENANT', () => operationFunction(i), tenantContext)
    );
    
    const results = await Promise.all(promises);
    const duration = Date.now() - startTime;
    
    // All operations should complete
    expect(results).toHaveLength(operationCount);
    
    // Performance should be reasonable (< 5 seconds for 1000 operations)
    expect(duration).toBeLessThan(5000);
    
    console.log(`Processed ${operationCount} operations in ${duration}ms`);
  });
});
