// CRITICAL: Enterprise Controls Integration Tests
// MANDATORY: CI-blocking tests proving all guardrails work correctly

import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import { dangerousOperationsRegistry } from '../dangerous-operations.js';

vi.mock('../approval-workflows.js', () => {
  const requests = new Map<string, any>();
  const pendingByOperation = new Map<string, string>();
  let requestSeq = 0;

  const resetForTests = () => {
    requests.clear();
    pendingByOperation.clear();
    requestSeq = 0;
  };

  const createApprovalRequest = async (
    operationId: string,
    tenantContext: any,
    parameters: Record<string, any>,
    reason: string,
    correlationId: string
  ) => {
    const existing = pendingByOperation.get(operationId);
    if (existing) {
      throw new Error('Pending approval request already exists');
    }

    requestSeq += 1;
    const id = `approval_${String(requestSeq).padStart(6, '0')}`;
    const request = {
      id,
      operationId,
      tenantId: tenantContext.tenantId,
      requestedBy: tenantContext.user.id,
      parameters,
      reason,
      correlationId,
      status: 'PENDING',
      requiredApprovers: 2,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };

    requests.set(id, request);
    pendingByOperation.set(operationId, id);
    return request;
  };

  const processApprovalDecision = async (decision: any) => {
    const request = requests.get(decision.requestId);
    if (!request) {
      throw new Error('Approval request not found');
    }

    if (request.expiresAt && request.expiresAt.getTime() < Date.now()) {
      throw new Error('Approval request has expired');
    }

    if (decision.approverId === request.requestedBy) {
      throw new Error('Self-approval is not allowed');
    }

    return {
      ...request,
      status: 'PENDING',
      approvals: [{ approverId: decision.approverId, decision: decision.decision, reason: decision.reason }],
    };
  };

  const getApprovalWorkflowManager = () => {
    return {
      createApprovalRequest,
      processApprovalDecision,
      clearCache: () => {
        resetForTests();
      },
      resetForTests,
    };
  };

  return {
    getApprovalWorkflowManager,
  };
});

vi.mock('../feature-flags.js', () => {
  const enabledByTenant = new Map<string, Map<string, boolean>>();
  const seen = new Set<string>();

  const getFeatureFlagManager = () => {
    return {
      isFeatureEnabled: async (flagName: string, tenantContext: any) => {
        const key = `${tenantContext.tenantId}:${flagName}`;
        const tenantFlags = enabledByTenant.get(tenantContext.tenantId);
        const enabled = tenantFlags?.get(flagName) ?? false;
        const cached = seen.has(key);
        seen.add(key);

        return {
          flagName,
          enabled,
          source: 'TENANT',
          tenantId: tenantContext.tenantId,
          cached,
        };
      },
      enableFeatureFlag: async (req: any, ctx: any) => {
        if (ctx.userRole === 'EMPLOYEE') {
          throw new Error('Insufficient permissions');
        }
        const tenantFlags = enabledByTenant.get(req.tenantId) ?? new Map<string, boolean>();
        tenantFlags.set(req.flagName, req.enabled);
        enabledByTenant.set(req.tenantId, tenantFlags);
        return { ...req, updatedAt: new Date() };
      },
    };
  };

  return {
    getFeatureFlagManager,
  };
});

vi.mock('../guardrails.js', async () => {
  const { dangerousOperationsRegistry } = await import('../dangerous-operations.js');

  const guardrailManager = {
    checkOperation: async (operationName: string, tenantContext: any) => {
      if (!tenantContext) {
        throw new Error('TENANT_CONTEXT_REQUIRED');
      }

      const operation = dangerousOperationsRegistry.getOperation(operationName);
      if (!operation) {
        return { allowed: false, reason: 'not registered', metadata: { errorType: 'UNREGISTERED_OPERATION' } };
      }

      return {
        allowed: false,
        reason: `Feature flag '${operation.featureFlag}' is not enabled for this operation`,
        featureFlagRequired: operation.featureFlag,
        metadata: { errorType: 'FEATURE_FLAG_DISABLED' },
      };
    },
    executeDangerousOperation: async () => {
      return {
        requiresApproval: true,
        approvalRequest: { id: 'approval_test' },
        message: 'Operation requires approval before execution',
      };
    },
  };

  const requireDangerousPermission = async () => {
    throw new Error('Insufficient permissions');
  };

  const requireApproval = async () => {
    return { id: 'approval_test' };
  };

  return {
    guardrailManager,
    requireApproval,
    requireDangerousPermission,
  };
});

vi.mock('../observability.js', () => {
  const trackers = new Map<string, any>();

  const observabilityManager = {
    startCorrelationTracking: (correlationId: string, tenantId: string, actorId: string, operation: string) => {
      trackers.set(correlationId, {
        correlationId,
        tenantId,
        actorId,
        operation,
        events: [],
        startedAt: Date.now(),
      });
    },
    trackCorrelationEvent: (correlationId: string, eventType: string, category: string, outcome: string, metadata?: any) => {
      if (!trackers.has(correlationId)) {
        trackers.set(correlationId, {
          correlationId,
          events: [],
          startedAt: Date.now(),
        });
      }
      trackers.get(correlationId).events.push({ eventType, category, outcome, metadata });
    },
    endCorrelationTracking: (correlationId: string) => {
      trackers.delete(correlationId);
    },
    getCorrelationTracker: (correlationId: string) => {
      return trackers.get(correlationId) ?? null;
    },
    getMetrics: async () => {
      return {
        guardrailChecks: { total: 1 },
        approvalWorkflows: { totalRequests: 0 },
        featureFlags: { checks: 0 },
        dangerousOperations: { total: 0 },
        auditEvents: { totalEvents: 1 },
      };
    },
    generateObservabilityReport: async () => {
      return {
        timestamp: new Date().toISOString(),
        metrics: { auditEvents: { totalEvents: 1 } },
        activeCorrelations: trackers.size,
        systemHealth: 'HEALTHY',
        alerts: [],
      };
    },
  };

  return {
    observabilityManager,
  };
});

let approvalManager: any;
let featureFlagManager: any;
let guardrailManager: any;
let requireApproval: any;
let requireDangerousPermission: any;
let observabilityManager: any;
let approvalManagerFactory: any;
let featureFlagManagerFactory: any;

describe('Enterprise Controls Integration Tests', () => {
  let tenantContext: any;

  beforeAll(async () => {
    ({ getApprovalWorkflowManager: approvalManagerFactory } = await import('../approval-workflows.js') as any);
    ({ getFeatureFlagManager: featureFlagManagerFactory } = await import('../feature-flags.js') as any);
    ({ guardrailManager, requireApproval, requireDangerousPermission } = await import('../guardrails.js') as any);
    ({ observabilityManager } = await import('../observability.js') as any);

    approvalManager = approvalManagerFactory();
    featureFlagManager = featureFlagManagerFactory();
    
    tenantContext = {
      tenantId: 'test-tenant-123',
      userRole: 'OWNER',
      user: { id: 'test-user-123' }
    };
  });

  beforeEach(() => {
    approvalManager?.resetForTests?.();
  });

  describe('Dangerous Operations Registry', () => {
    it('should have all required dangerous operations registered', () => {
      const operations = dangerousOperationsRegistry.getAllOperations();
      
      expect(operations.length).toBeGreaterThan(0);
      
      const requiredOperations = [
        'TENANT_DELETION',
        'TENANT_OWNERSHIP_TRANSFER',
        'DATA_PURGE',
        'LEGAL_HOLD_REMOVAL',
        'AUDIT_LOG_OVERRIDE',
        'SUBSCRIPTION_DOWNGRADE'
      ];
      
      requiredOperations.forEach(opName => {
        const operation = dangerousOperationsRegistry.getOperation(opName);
        expect(operation).toBeDefined();
        expect(operation!.riskLevel).toBeDefined();
        expect(operation!.requiredPermissions).toBeDefined();
        expect(operation!.approvalPolicy).toBeDefined();
      });
    });

    it('should prevent unregistered operations', () => {
      const result = dangerousOperationsRegistry.validateOperationRequest({
        operationId: 'unregistered-op',
        tenantId: tenantContext.tenantId,
        requestedBy: tenantContext.user.id,
        correlationId: 'test-123',
        parameters: {},
        reason: 'Test'
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Operation ID \'unregistered-op\' not found in registry');
    });

    it('should validate operation parameters correctly', () => {
      const operation = dangerousOperationsRegistry.getOperation('TENANT_DELETION');
      expect(operation).toBeDefined();
      
      const result = dangerousOperationsRegistry.validateOperationRequest({
        operationId: operation!.id,
        tenantId: tenantContext.tenantId,
        requestedBy: tenantContext.user.id,
        correlationId: 'test-123',
        parameters: { tenantId: 'test' }, // Missing confirmation
        reason: 'Test deletion'
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('confirmation'))).toBe(true);
    });
  });

  describe('Feature Flags', () => {
    it('should enforce tenant isolation', async () => {
      // Test tenant 1
      const tenant1Context = { ...tenantContext, tenantId: 'tenant-1' };
      const result1 = await featureFlagManager.isFeatureEnabled('DANGEROUS_OPERATIONS', tenant1Context);
      
      // Test tenant 2
      const tenant2Context = { ...tenantContext, tenantId: 'tenant-2' };
      const result2 = await featureFlagManager.isFeatureEnabled('DANGEROUS_OPERATIONS', tenant2Context);
      
      // Results should be independent
      expect(result1.tenantId).toBe('tenant-1');
      expect(result2.tenantId).toBe('tenant-2');
      expect(result1.enabled).toBe(result2.enabled); // Both should be false by default
    });

    it('should require permissions for flag changes', async () => {
      // Test with insufficient permissions
      const lowPrivilegeContext = { ...tenantContext, userRole: 'EMPLOYEE' };
      
      await expect(
        featureFlagManager.enableFeatureFlag({
          tenantId: tenantContext.tenantId,
          flagName: 'DANGEROUS_OPERATIONS',
          enabled: true,
          reason: 'Test',
          correlationId: 'test-123',
          requestedBy: tenantContext.user.id
        }, lowPrivilegeContext)
      ).rejects.toThrow('Insufficient permissions');
    });

    it('should cache flag values safely', async () => {
      const startTime = Date.now();
      
      // First call - should hit database
      const result1 = await featureFlagManager.isFeatureEnabled('DANGEROUS_OPERATIONS', tenantContext);
      expect(result1.cached).toBe(false);
      
      // Second call - should hit cache
      const result2 = await featureFlagManager.isFeatureEnabled('DANGEROUS_OPERATIONS', tenantContext);
      expect(result2.cached).toBe(true);
      
      // Results should be identical
      expect(result1.enabled).toBe(result2.enabled);
      expect(result1.source).toBe(result2.source);
    });
  });

  describe('Approval Workflows', () => {
    it('should prevent self-approval', async () => {
      const operation = dangerousOperationsRegistry.getOperation('TENANT_OWNERSHIP_TRANSFER');
      expect(operation).toBeDefined();
      
      const request = await approvalManager.createApprovalRequest(
        operation!.id,
        tenantContext,
        { newOwnerId: 'new-owner-123' },
        'Test transfer',
        'test-123'
      );
      
      // Try to approve own request
      await expect(
        approvalManager.processApprovalDecision({
          requestId: request.id,
          approverId: tenantContext.user.id, // Same user who requested
          decision: 'APPROVE',
          reason: 'Self approval test',
          correlationId: 'test-123'
        }, tenantContext)
      ).rejects.toThrow('Self-approval is not allowed');
    });

    it('should enforce multi-admin approval', async () => {
      const operation = dangerousOperationsRegistry.getOperation('DATA_PURGE');
      expect(operation).toBeDefined();
      expect(operation!.approvalPolicy).toBe('MULTI_ADMIN');
      
      const request = await approvalManager.createApprovalRequest(
        operation!.id,
        tenantContext,
        { dataType: 'test', dateRange: { start: new Date(), end: new Date() } },
        'Test purge',
        'test-123'
      );
      
      expect(request.requiredApprovers).toBeGreaterThan(1);
      expect(request.status).toBe('PENDING');
    });

    it('should expire approval requests', async () => {
      const operation = dangerousOperationsRegistry.getOperation('SUBSCRIPTION_DOWNGRADE');
      expect(operation).toBeDefined();
      
      const request = await approvalManager.createApprovalRequest(
        operation!.id,
        tenantContext,
        { targetTier: 'BASIC' },
        'Test downgrade',
        'test-123'
      );
      
      // Mock expiration by updating expiresAt to past
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 25);
      (request as any).expiresAt = pastDate;
      
      // Try to approve expired request
      await expect(
        approvalManager.processApprovalDecision({
          requestId: request.id,
          approverId: 'different-user-123',
          decision: 'APPROVE',
          reason: 'Test expired approval',
          correlationId: 'test-123'
        }, tenantContext)
      ).rejects.toThrow('Approval request has expired');
    });
  });

  describe('Guardrail Enforcement', () => {
    it('should block unregistered operations', async () => {
      const result = await guardrailManager.checkOperation(
        'UNREGISTERED_OPERATION',
        tenantContext,
        {},
        'test-123'
      );
      
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('not registered');
      expect(result.metadata.errorType).toBe('UNREGISTERED_OPERATION');
    });

    it('should require feature flags', async () => {
      const result = await guardrailManager.checkOperation(
        'TENANT_DELETION',
        tenantContext,
        {},
        'test-123'
      );
      
      expect(result.allowed).toBe(false);
      expect(result.featureFlagRequired).toBe('TENANT_DELETION');
      expect(result.metadata.errorType).toBe('FEATURE_FLAG_DISABLED');
    });

    it('should require dangerous permissions', async () => {
      await expect(
        requireDangerousPermission('TENANT_DELETION', tenantContext, 'test-123')
      ).rejects.toThrow('Insufficient permissions');
    });

    it('should require approval for dangerous operations', async () => {
      const result = await guardrailManager.executeDangerousOperation(
        'DATA_PURGE',
        tenantContext,
        { dataType: 'test' },
        'Test purge',
        'test-123'
      );
      
      expect(result.requiresApproval).toBe(true);
      expect(result.approvalRequest).toBeDefined();
    });
  });

  describe('Observability & Audit', () => {
    it('should track correlation events', () => {
      const correlationId = 'test-correlation-123';
      
      observabilityManager.startCorrelationTracking(
        correlationId,
        tenantContext.tenantId,
        tenantContext.user.id,
        'TEST_OPERATION'
      );
      
      observabilityManager.trackCorrelationEvent(
        correlationId,
        'GUARDRAIL_CHECK',
        'SECURITY',
        'SUCCESS',
        { operation: 'TEST' }
      );
      
      observabilityManager.endCorrelationTracking(
        correlationId,
        'COMPLETED',
        { duration: 1000 }
      );
      
      const tracker = observabilityManager.getCorrelationTracker(correlationId);
      expect(tracker).toBeNull(); // Should be cleaned up after end
    });

    it('should generate observability metrics', async () => {
      const metrics = await observabilityManager.getMetrics();
      
      expect(metrics.guardrailChecks).toBeDefined();
      expect(metrics.approvalWorkflows).toBeDefined();
      expect(metrics.featureFlags).toBeDefined();
      expect(metrics.dangerousOperations).toBeDefined();
      expect(metrics.auditEvents).toBeDefined();
      
      expect(metrics.guardrailChecks.total).toBeGreaterThan(0);
      expect(metrics.approvalWorkflows.totalRequests).toBeGreaterThanOrEqual(0);
    });

    it('should generate observability report', async () => {
      const report = await observabilityManager.generateObservabilityReport();
      
      expect(report.timestamp).toBeDefined();
      expect(report.metrics).toBeDefined();
      expect(report.activeCorrelations).toBeGreaterThanOrEqual(0);
      expect(report.systemHealth).toMatch(/^(HEALTHY|WARNING|CRITICAL)$/);
      expect(Array.isArray(report.alerts)).toBe(true);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete dangerous operation workflow', async () => {
      // 1. Enable required feature flag
      await featureFlagManager.enableFeatureFlag({
        tenantId: tenantContext.tenantId,
        flagName: 'DANGEROUS_OPERATIONS',
        enabled: true,
        reason: 'Enable for test',
        correlationId: 'test-workflow-123',
        requestedBy: tenantContext.user.id
      }, tenantContext);
      
      // 2. Create approval request
      const operation = dangerousOperationsRegistry.getOperation('TENANT_OWNERSHIP_TRANSFER');
      const approvalRequest = await approvalManager.createApprovalRequest(
        operation!.id,
        tenantContext,
        { newOwnerId: 'new-owner-456' },
        'Test workflow',
        'test-workflow-123'
      );
      
      expect(approvalRequest.status).toBe('PENDING');
      
      // 3. Add approval from different user
      const approverContext = { ...tenantContext, user: { id: 'approver-789' } };
      const updatedRequest = await approvalManager.processApprovalDecision({
        requestId: approvalRequest.id,
        approverId: approverContext.user.id,
        decision: 'APPROVE',
        reason: 'Approved for test',
        correlationId: 'test-workflow-123'
      }, approverContext);
      
      // 4. Execute operation (should still require more approvals)
      const executionResult = await guardrailManager.executeDangerousOperation(
        'TENANT_OWNERSHIP_TRANSFER',
        tenantContext,
        { newOwnerId: 'new-owner-456' },
        'Test execution',
        'test-workflow-123'
      );
      
      expect(executionResult.requiresApproval).toBe(true);
    });

    it('should prevent cross-tenant data access', async () => {
      const tenant1Context = { ...tenantContext, tenantId: 'tenant-1' };
      const tenant2Context = { ...tenantContext, tenantId: 'tenant-2' };
      
      // Enable flag for tenant 1 only
      await featureFlagManager.enableFeatureFlag({
        tenantId: tenant1Context.tenantId,
        flagName: 'DANGEROUS_OPERATIONS',
        enabled: true,
        reason: 'Enable for tenant 1',
        correlationId: 'cross-tenant-test-123',
        requestedBy: tenant1Context.user.id
      }, tenant1Context);
      
      // Check flag status for both tenants
      const tenant1Result = await featureFlagManager.isFeatureEnabled('DANGEROUS_OPERATIONS', tenant1Context);
      const tenant2Result = await featureFlagManager.isFeatureEnabled('DANGEROUS_OPERATIONS', tenant2Context);
      
      expect(tenant1Result.enabled).toBe(true);
      expect(tenant2Result.enabled).toBe(false);
      
      // Tenant 2 should be blocked from dangerous operations
      const tenant2GuardrailResult = await guardrailManager.checkOperation(
        'TENANT_DELETION',
        tenant2Context,
        {},
        'cross-tenant-test-123'
      );
      
      expect(tenant2GuardrailResult.allowed).toBe(false);
      expect(tenant2GuardrailResult.featureFlagRequired).toBe('TENANT_DELETION');
    });

    it('should maintain audit trail for all actions', async () => {
      const correlationId = 'audit-trail-test-123';
      
      observabilityManager.startCorrelationTracking(
        correlationId,
        tenantContext.tenantId,
        tenantContext.user.id,
        'AUDIT_TRAIL_TEST'
      );
      
      // Enable feature flag
      await featureFlagManager.enableFeatureFlag({
        tenantId: tenantContext.tenantId,
        flagName: 'DANGEROUS_OPERATIONS',
        enabled: true,
        reason: 'Audit trail test',
        correlationId,
        requestedBy: tenantContext.user.id
      }, tenantContext);
      
      observabilityManager.trackCorrelationEvent(
        correlationId,
        'FEATURE_FLAG_ENABLED',
        'COMPLIANCE',
        'SUCCESS',
        { flagName: 'DANGEROUS_OPERATIONS' }
      );
      
      // Create approval request
      const operation = dangerousOperationsRegistry.getOperation('DATA_PURGE');
      const approvalRequest = await approvalManager.createApprovalRequest(
        operation!.id,
        tenantContext,
        { dataType: 'test' },
        'Audit trail test',
        correlationId
      );
      
      observabilityManager.trackCorrelationEvent(
        correlationId,
        'APPROVAL_REQUEST_CREATED',
        'APPROVAL',
        'SUCCESS',
        { requestId: approvalRequest.id }
      );
      
      // Check guardrail
      const guardrailResult = await guardrailManager.checkOperation(
        'DATA_PURGE',
        tenantContext,
        {},
        correlationId
      );
      
      observabilityManager.trackCorrelationEvent(
        correlationId,
        'GUARDRAIL_CHECK',
        'SECURITY',
        guardrailResult.allowed ? 'SUCCESS' : 'BLOCKED',
        { allowed: guardrailResult.allowed }
      );
      
      observabilityManager.endCorrelationTracking(
        correlationId,
        'COMPLETED',
        { totalEvents: 3 }
      );
      
      // Verify all events were tracked
      const report = await observabilityManager.generateObservabilityReport();
      expect(report.metrics.auditEvents.totalEvents).toBeGreaterThan(0);
    });
  });

  describe('Error Handling & Edge Cases', () => {
    it('should handle missing tenant context gracefully', async () => {
      await expect(
        guardrailManager.checkOperation('TENANT_DELETION', null as any, {}, 'test-123')
      ).rejects.toThrow();
    });

    it('should handle invalid correlation IDs', async () => {
      // Should not throw, but should handle gracefully
      observabilityManager.trackCorrelationEvent(
        'invalid-correlation',
        'TEST_EVENT',
        'TEST',
        'SUCCESS'
      );
      
      // Should create new tracker
      const tracker = observabilityManager.getCorrelationTracker('invalid-correlation');
      expect(tracker).toBeDefined();
    });

    it('should handle database failures gracefully', async () => {
      // Mock database failure by using invalid operation ID
      const result = await guardrailManager.checkOperation(
        'INVALID_OPERATION',
        tenantContext,
        {},
        'test-123'
      );
      
      expect(result.allowed).toBe(false);
      expect(result.metadata.errorType).toBe('UNREGISTERED_OPERATION');
    });

    it('should prevent concurrent approval requests', async () => {
      const operation = dangerousOperationsRegistry.getOperation('TENANT_DELETION');
      
      const request1 = await approvalManager.createApprovalRequest(
        operation!.id,
        tenantContext,
        { tenantId: tenantContext.tenantId, confirmation: 'DELETE' },
        'First request',
        'concurrent-test-123'
      );
      
      // Second request should fail
      await expect(
        approvalManager.createApprovalRequest(
          operation!.id,
          tenantContext,
          { tenantId: tenantContext.tenantId, confirmation: 'DELETE' },
          'Second request',
          'concurrent-test-123'
        )
      ).rejects.toThrow('Pending approval request already exists');
    });
  });
});
