// CRITICAL: Comprehensive Resilience Tests
// MANDATORY: Complete resilience testing suite with fault injection and validation

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { recoveryStrategyManager } from '../recovery-strategy.js';
import { auditImmutabilityManager } from '../audit-immutability.js';
import { chaosEngineeringManager } from '../chaos-hooks.js';
import { logger } from '../../utils/structured-logger.js';

describe('Resilience System Tests', () => {
  beforeEach(() => {
    // Reset all managers before each test
    vi.clearAllMocks();

    (auditImmutabilityManager as any).resetForTests?.();
    (recoveryStrategyManager as any).resetForTests?.();
    (chaosEngineeringManager as any).resetForTests?.();
  });

  afterEach(() => {
    // Cleanup after each test
    vi.restoreAllMocks();
  });

  describe('Recovery Strategy Tests', () => {
    it('should create recovery point successfully', async () => {
      const recoveryPoint = await recoveryStrategyManager.createRecoveryPoint(
        'DATABASE',
        'test-tenant',
        'Test recovery point',
        { test: true }
      );

      expect(recoveryPoint).toBeDefined();
      expect(recoveryPoint.type).toBe('DATABASE');
      expect(recoveryPoint.tenantId).toBe('test-tenant');
      expect(recoveryPoint.description).toBe('Test recovery point');
      expect(recoveryPoint.checksum).toBeDefined();
      expect(recoveryPoint.size).toBeGreaterThan(0);
    });

    it('should start recovery operation successfully', async () => {
      // First create a recovery point
      const recoveryPoint = await recoveryStrategyManager.createRecoveryPoint(
        'DATABASE',
        'test-tenant',
        'Test recovery point'
      );

      // Start recovery
      const operation = await recoveryStrategyManager.startRecovery(
        'DATABASE',
        recoveryPoint.id,
        'test-tenant'
      );

      expect(operation).toBeDefined();
      expect(operation.type).toBe('DATABASE');
      expect(operation.tenantId).toBe('test-tenant');
      expect(operation.recoveryPointId).toBe(recoveryPoint.id);
      expect(operation.status).toBe('PENDING');
      expect(operation.estimatedDuration).toBeGreaterThan(0);
    });

    it('should validate RPO/RTO compliance', async () => {
      const compliance = await recoveryStrategyManager.validateRPORTOCompliance();

      expect(compliance).toBeDefined();
      expect(typeof compliance.compliant).toBe('boolean');
      expect(Array.isArray(compliance.violations)).toBe(true);
    });

    it('should handle concurrent recovery operations', async () => {
      // Create multiple recovery points
      const recoveryPoints = await Promise.all([
        recoveryStrategyManager.createRecoveryPoint('DATABASE', 'tenant1', 'DB backup 1'),
        recoveryStrategyManager.createRecoveryPoint('AUDIT', 'tenant1', 'Audit backup 1'),
        recoveryStrategyManager.createRecoveryPoint('TENANT', 'tenant2', 'Tenant backup 1')
      ]);

      // Start concurrent recovery operations
      const operations = await Promise.all([
        recoveryStrategyManager.startRecovery('DATABASE', recoveryPoints[0].id, 'tenant1'),
        recoveryStrategyManager.startRecovery('AUDIT', recoveryPoints[1].id, 'tenant1'),
        recoveryStrategyManager.startRecovery('TENANT', recoveryPoints[2].id, 'tenant2')
      ]);

      expect(operations).toHaveLength(3);
      operations.forEach(op => {
        expect(op.status).toBe('PENDING');
        expect(op.estimatedDuration).toBeGreaterThan(0);
      });
    });

    it('should handle recovery point expiration', async () => {
      // Create recovery point with short retention
      const recoveryPoint = await recoveryStrategyManager.createRecoveryPoint(
        'CONFIG',
        'test-tenant',
        'Test config backup'
      );

      // Simulate expiration
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 1);
      (recoveryPoint as any).expiresAt = expiredDate;
      
      // This should fail when trying to recover from expired point
      await expect(
        recoveryStrategyManager.startRecovery('CONFIG', recoveryPoint.id, 'test-tenant')
      ).rejects.toThrow();
    });
  });

  describe('Audit Immutability Tests', () => {
    it('should add audit event with immutability protection', async () => {
      const event = await auditImmutabilityManager.addAuditEvent({
        tenantId: 'test-tenant',
        actorId: 'test-user',
        action: 'TEST_ACTION',
        resourceType: 'TEST_RESOURCE',
        resourceId: 'test-id',
        outcome: 'SUCCESS',
        timestamp: new Date(),
        correlationId: 'test-correlation',
        severity: 'MEDIUM',
        metadata: { test: true }
      });

      expect(event).toBeDefined();
      expect(event.id).toBeDefined();
      expect(event.sequence).toBe(1);
      expect(event.currentHash).toBeDefined();
      expect(event.immutable).toBe(true);
    });

    it('should verify audit chain integrity', async () => {
      // Add multiple audit events
      const events = await Promise.all([
        auditImmutabilityManager.addAuditEvent({
          tenantId: 'test-tenant',
          actorId: 'user1',
          action: 'ACTION1',
          resourceType: 'RESOURCE1',
          resourceId: 'id1',
          outcome: 'SUCCESS',
          timestamp: new Date(),
          correlationId: 'corr1',
          severity: 'LOW',
          metadata: {}
        }),
        auditImmutabilityManager.addAuditEvent({
          tenantId: 'test-tenant',
          actorId: 'user2',
          action: 'ACTION2',
          resourceType: 'RESOURCE2',
          resourceId: 'id2',
          outcome: 'FAILURE',
          timestamp: new Date(),
          correlationId: 'corr2',
          severity: 'HIGH',
          metadata: {}
        })
      ]);

      // Verify chain integrity
      const verification = await auditImmutabilityManager.verifyAuditChainIntegrity('test-tenant');

      expect(verification.valid).toBe(true);
      expect(verification.violations).toHaveLength(0);
      expect(verification.chainHash).toBeDefined();
      expect(verification.verifiedAt).toBeDefined();
    });

    it('should detect audit chain violations', async () => {
      // Add audit event
      await auditImmutabilityManager.addAuditEvent({
        tenantId: 'test-tenant',
        actorId: 'test-user',
        action: 'TEST_ACTION',
        resourceType: 'TEST_RESOURCE',
        resourceId: 'test-id',
        outcome: 'SUCCESS',
        timestamp: new Date(),
        correlationId: 'test-correlation',
        severity: 'MEDIUM',
        metadata: {}
      });

      // Simulate chain violation by modifying event
      const chain = auditImmutabilityManager.getAuditChain('test-tenant');
      if (chain && chain.events.length > 0) {
        // This would be detected as a violation in real implementation
        chain.events[0].currentHash = 'invalid-hash';
      }

      // Verify should detect violation
      const verification = await auditImmutabilityManager.verifyAuditChainIntegrity('test-tenant');
      
      expect(verification.valid).toBe(false);
      expect(verification.violations.length).toBeGreaterThan(0);
    });

    it('should maintain tenant isolation', async () => {
      // Add events for different tenants
      await auditImmutabilityManager.addAuditEvent({
        tenantId: 'tenant1',
        actorId: 'user1',
        action: 'ACTION1',
        resourceType: 'RESOURCE1',
        resourceId: 'id1',
        outcome: 'SUCCESS',
        timestamp: new Date(),
        correlationId: 'corr1',
        severity: 'LOW',
        metadata: {}
      });

      await auditImmutabilityManager.addAuditEvent({
        tenantId: 'tenant2',
        actorId: 'user2',
        action: 'ACTION2',
        resourceType: 'RESOURCE2',
        resourceId: 'id2',
        outcome: 'SUCCESS',
        timestamp: new Date(),
        correlationId: 'corr2',
        severity: 'LOW',
        metadata: {}
      });

      // Get events for each tenant
      const tenant1Events = auditImmutabilityManager.getAuditEvents('tenant1');
      const tenant2Events = auditImmutabilityManager.getAuditEvents('tenant2');

      expect(tenant1Events).toHaveLength(1);
      expect(tenant2Events).toHaveLength(1);
      expect(tenant1Events[0].tenantId).toBe('tenant1');
      expect(tenant2Events[0].tenantId).toBe('tenant2');
    });
  });

  describe('Chaos Engineering Tests', () => {
    it('should inject fault successfully', async () => {
      const faultId = await chaosEngineeringManager.injectFault(
        'DATABASE_DOWN',
        'database-service',
        'MEDIUM',
        'Test database failure',
        { timeout: 5000 }
      );

      expect(faultId).toBeDefined();
      expect(faultId).toMatch(/^fault_[a-f0-9]+$/);

      // Check if fault is active
      const activeFaults = chaosEngineeringManager.getActiveFaults();
      const injectedFault = activeFaults.find(f => f.id === faultId);
      
      expect(injectedFault).toBeDefined();
      expect(injectedFault?.type).toBe('DATABASE_DOWN');
      expect(injectedFault?.component).toBe('database-service');
      expect(injectedFault?.severity).toBe('MEDIUM');
      expect(injectedFault?.active).toBe(true);
    });

    it('should stop fault successfully', async () => {
      // Inject fault
      const faultId = await chaosEngineeringManager.injectFault(
        'QUEUE_LAG',
        'queue-service',
        'LOW',
        'Test queue lag'
      );

      // Stop fault
      chaosEngineeringManager.stopFault(faultId);

      // Check if fault is stopped
      const activeFaults = chaosEngineeringManager.getActiveFaults();
      const stoppedFault = activeFaults.find(f => f.id === faultId);
      
      expect(stoppedFault).toBeUndefined();
    });

    it('should create and execute resilience test', async () => {
      // Create resilience test
      const testId = chaosEngineeringManager.createResilienceTest(
        'Database Resilience Test',
        'Test database resilience under load',
        'DATABASE_FAILURE_SCENARIO',
        ['System load < 80%', 'Database service healthy'],
        [
          {
            step: 1,
            description: 'Inject database failure',
            action: 'inject_fault',
            expectedOutcome: 'fault_injected',
            timeout: 5000
          },
          {
            step: 2,
            description: 'Verify system response',
            action: 'verify_response',
            expectedOutcome: 'system_responding',
            timeout: 10000
          }
        ],
        [
          {
            step: 1,
            description: 'Verify data integrity',
            action: 'verify_integrity',
            expectedOutcome: 'integrity_maintained',
            timeout: 5000
          }
        ]
      );

      expect(testId).toBeDefined();
      expect(testId).toMatch(/^test_[a-f0-9]+$/);

      // Execute test
      const result = await chaosEngineeringManager.executeResilienceTest(testId);

      expect(result).toBeDefined();
      expect(result.testId).toBe(testId);
      expect(result.testName).toBe('Database Resilience Test');
      expect(result.scenario).toBe('DATABASE_FAILURE_SCENARIO');
      expect(typeof result.success).toBe('boolean');
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should handle multiple concurrent faults', async () => {
      // Inject multiple faults
      const faultIds = await Promise.all([
        chaosEngineeringManager.injectFault('DATABASE_DOWN', 'db1', 'LOW', 'DB1 down'),
        chaosEngineeringManager.injectFault('QUEUE_LAG', 'queue1', 'MEDIUM', 'Queue1 lag'),
        chaosEngineeringManager.injectFault('CACHE_LOSS', 'cache1', 'HIGH', 'Cache1 loss')
      ]);

      expect(faultIds).toHaveLength(3);

      // Check all faults are active
      const activeFaults = chaosEngineeringManager.getActiveFaults();
      expect(activeFaults).toHaveLength(3);

      // Stop all faults
      faultIds.forEach(faultId => {
        chaosEngineeringManager.stopFault(faultId);
      });

      // Verify all faults are stopped
      const remainingFaults = chaosEngineeringManager.getActiveFaults();
      expect(remainingFaults).toHaveLength(0);
    });

    it('should validate fault injection preconditions', async () => {
      // Try to inject critical fault at high system load
      vi.spyOn(chaosEngineeringManager as any, 'getSystemLoad').mockResolvedValue(90);

      await expect(
        chaosEngineeringManager.injectFault(
          'SERVICE_CRASH',
          'critical-service',
          'CRITICAL',
          'Critical service failure'
        )
      ).rejects.toThrow();
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete resilience workflow', async () => {
      // 1. Create recovery point
      const recoveryPoint = await recoveryStrategyManager.createRecoveryPoint(
        'DATABASE',
        'integration-tenant',
        'Integration test recovery point'
      );

      // 2. Add audit events
      await auditImmutabilityManager.addAuditEvent({
        tenantId: 'integration-tenant',
        actorId: 'integration-user',
        action: 'INTEGRATION_TEST',
        resourceType: 'TEST_RESOURCE',
        resourceId: 'test-id',
        outcome: 'SUCCESS',
        timestamp: new Date(),
        correlationId: 'integration-correlation',
        severity: 'MEDIUM',
        metadata: { test: 'integration' }
      });

      // 3. Inject fault
      const faultId = await chaosEngineeringManager.injectFault(
        'DATABASE_DOWN',
        'database-service',
        'MEDIUM',
        'Integration test fault'
      );

      // 4. Create resilience test
      const testId = chaosEngineeringManager.createResilienceTest(
        'Integration Resilience Test',
        'Complete integration resilience test',
        'INTEGRATION_SCENARIO',
        ['All systems healthy'],
        [
          {
            step: 1,
            description: 'Verify fault injection',
            action: 'verify_fault',
            expectedOutcome: 'fault_active',
            timeout: 5000
          }
        ],
        [
          {
            step: 1,
            description: 'Verify system recovery',
            action: 'verify_recovery',
            expectedOutcome: 'system_recovered',
            timeout: 10000
          }
        ]
      );

      // 5. Execute resilience test
      const testResult = await chaosEngineeringManager.executeResilienceTest(testId);

      // 6. Start recovery
      const recoveryOperation = await recoveryStrategyManager.startRecovery(
        'DATABASE',
        recoveryPoint.id,
        'integration-tenant'
      );

      // 7. Stop fault
      chaosEngineeringManager.stopFault(faultId);

      // 8. Verify audit chain integrity
      const auditVerification = await auditImmutabilityManager.verifyAuditChainIntegrity('integration-tenant');

      // Verify all components worked together
      expect(recoveryPoint.id).toBeDefined();
      expect(faultId).toBeDefined();
      expect(testId).toBeDefined();
      expect(testResult.testId).toBe(testId);
      expect(recoveryOperation.id).toBeDefined();
      expect(auditVerification.valid).toBe(true);
    });

    it('should handle tenant isolation across all components', async () => {
      const tenants = ['tenant1', 'tenant2', 'tenant3'];

      // Create recovery points for each tenant
      const recoveryPoints = await Promise.all(
        tenants.map(tenant => 
          recoveryStrategyManager.createRecoveryPoint('TENANT', tenant, `${tenant} backup`)
        )
      );

      // Add audit events for each tenant
      await Promise.all(
        tenants.map(tenant =>
          auditImmutabilityManager.addAuditEvent({
            tenantId: tenant,
            actorId: `${tenant}-user`,
            action: 'TENANT_ACTION',
            resourceType: 'TENANT_RESOURCE',
            resourceId: `${tenant}-id`,
            outcome: 'SUCCESS',
            timestamp: new Date(),
            correlationId: `${tenant}-correlation`,
            severity: 'LOW',
            metadata: {}
          })
        )
      );

      // Inject faults for different components
      const faultIds = await Promise.all([
        chaosEngineeringManager.injectFault('DATABASE_DOWN', 'db-service', 'LOW', 'DB fault'),
        chaosEngineeringManager.injectFault('QUEUE_LAG', 'queue-service', 'MEDIUM', 'Queue fault')
      ]);

      // Verify tenant isolation
      tenants.forEach(tenant => {
        const tenantRecoveryPoints = recoveryStrategyManager.getRecoveryPoints('TENANT', tenant);
        const tenantAuditEvents = auditImmutabilityManager.getAuditEvents(tenant);
        
        expect(tenantRecoveryPoints).toHaveLength(1);
        expect(tenantAuditEvents).toHaveLength(1);
        expect(tenantRecoveryPoints[0].tenantId).toBe(tenant);
        expect(tenantAuditEvents[0].tenantId).toBe(tenant);
      });

      // Cleanup
      faultIds.forEach(faultId => chaosEngineeringManager.stopFault(faultId));
    });

    it('should handle system-wide stress scenarios', async () => {
      // Simulate system-wide stress
      const stressFaults = await Promise.all([
        chaosEngineeringManager.injectFault('DATABASE_DOWN', 'primary-db', 'HIGH', 'Primary DB down'),
        chaosEngineeringManager.injectFault('QUEUE_LAG', 'message-queue', 'HIGH', 'Queue lag'),
        chaosEngineeringManager.injectFault('CACHE_LOSS', 'redis-cache', 'MEDIUM', 'Cache loss')
      ]);

      // Create comprehensive resilience test
      const stressTestId = chaosEngineeringManager.createResilienceTest(
        'System Stress Test',
        'Test system resilience under multiple failures',
        'MULTIPLE_FAILURES',
        ['System load < 90%'],
        [
          {
            step: 1,
            description: 'Verify system response to multiple failures',
            action: 'verify_multiple_failures',
            expectedOutcome: 'system_degraded',
            timeout: 15000
          },
          {
            step: 2,
            description: 'Verify core services still operational',
            action: 'verify_core_services',
            expectedOutcome: 'core_services_operational',
            timeout: 10000
          }
        ],
        [
          {
            step: 1,
            description: 'Verify data integrity maintained',
            action: 'verify_data_integrity',
            expectedOutcome: 'integrity_maintained',
            timeout: 5000
          },
          {
            step: 2,
            description: 'Verify audit trail intact',
            action: 'verify_audit_trail',
            expectedOutcome: 'audit_trail_intact',
            timeout: 5000
          }
        ]
      );

      // Execute stress test
      const stressTestResult = await chaosEngineeringManager.executeResilienceTest(stressTestId);

      // Verify system handled stress appropriately
      expect(stressTestResult.testId).toBe(stressTestId);
      expect(stressTestResult.duration).toBeGreaterThan(0);
      expect(typeof stressTestResult.success).toBe('boolean');

      // Cleanup stress faults
      stressFaults.forEach(faultId => chaosEngineeringManager.stopFault(faultId));
    });
  });

  describe('Performance Tests', () => {
    it('should handle high-volume audit events', async () => {
      const eventCount = 1000;
      const startTime = Date.now();

      // Add high volume of audit events
      await Promise.all(
        Array.from({ length: eventCount }, (_, i) =>
          auditImmutabilityManager.addAuditEvent({
            tenantId: 'performance-tenant',
            actorId: `user${i}`,
            action: `ACTION_${i}`,
            resourceType: 'RESOURCE',
            resourceId: `id${i}`,
            outcome: 'SUCCESS',
            timestamp: new Date(),
            correlationId: `corr${i}`,
            severity: 'LOW',
            metadata: { index: i }
          })
        )
      );

      const duration = Date.now() - startTime;
      const eventsPerSecond = eventCount / (duration / 1000);

      // Should handle at least 100 events per second
      expect(eventsPerSecond).toBeGreaterThan(100);

      // Verify all events were added
      const events = auditImmutabilityManager.getAuditEvents('performance-tenant');
      expect(events).toHaveLength(eventCount);
    });

    it('should handle concurrent recovery operations', async () => {
      const operationCount = 10;
      
      // Create recovery points
      const recoveryPoints = await Promise.all(
        Array.from({ length: operationCount }, (_, i) =>
          recoveryStrategyManager.createRecoveryPoint(
            'DATABASE',
            `tenant${i}`,
            `Recovery point ${i}`
          )
        )
      );

      // Start concurrent recovery operations
      const startTime = Date.now();
      const operations = await Promise.all(
        recoveryPoints.map((point, i) =>
          recoveryStrategyManager.startRecovery('DATABASE', point.id, `tenant${i}`)
        )
      );
      const duration = Date.now() - startTime;

      // Should handle concurrent operations efficiently
      expect(duration).toBeLessThan(5000); // 5 seconds max
      expect(operations).toHaveLength(operationCount);

      // Verify all operations started successfully
      operations.forEach(op => {
        expect(op.status).toBe('PENDING');
        expect(op.estimatedDuration).toBeGreaterThan(0);
      });
    });

    it('should handle rapid fault injection and recovery', async () => {
      const faultCount = 20;
      const faultIds: string[] = [];

      // Rapidly inject faults
      for (let i = 0; i < faultCount; i++) {
        const faultId = await chaosEngineeringManager.injectFault(
          'DATABASE_DOWN',
          `db-service-${i}`,
          'LOW',
          `Fault ${i}`
        );
        faultIds.push(faultId);
      }

      // Verify all faults are active
      const activeFaults = chaosEngineeringManager.getActiveFaults();
      expect(activeFaults).toHaveLength(faultCount);

      // Rapidly stop all faults
      const startTime = Date.now();
      faultIds.forEach(faultId => chaosEngineeringManager.stopFault(faultId));
      const stopDuration = Date.now() - startTime;

      // Should stop all faults quickly
      expect(stopDuration).toBeLessThan(1000); // 1 second max

      // Verify all faults are stopped
      const remainingFaults = chaosEngineeringManager.getActiveFaults();
      expect(remainingFaults).toHaveLength(0);
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle invalid recovery point gracefully', async () => {
      await expect(
        recoveryStrategyManager.startRecovery('DATABASE', 'invalid-point-id', 'test-tenant')
      ).rejects.toThrow('Recovery point invalid-point-id not found');
    });

    it('should handle invalid audit event gracefully', async () => {
      // This should handle missing required fields gracefully
      await expect(
        auditImmutabilityManager.addAuditEvent({
          tenantId: '',
          actorId: 'test-user',
          action: 'TEST_ACTION',
          resourceType: 'TEST_RESOURCE',
          resourceId: 'test-id',
          outcome: 'SUCCESS',
          timestamp: new Date(),
          correlationId: 'test-correlation',
          severity: 'MEDIUM',
          metadata: {}
        })
      ).rejects.toThrow();
    });

    it('should handle fault injection errors gracefully', async () => {
      // Try to inject fault with invalid parameters
      await expect(
        chaosEngineeringManager.injectFault(
          'INVALID_FAULT' as any,
          'invalid-component',
          'INVALID_SEVERITY' as any,
          'Invalid fault test'
        )
      ).rejects.toThrow();
    });

    it('should handle resilience test execution errors gracefully', async () => {
      // Try to execute non-existent test
      await expect(
        chaosEngineeringManager.executeResilienceTest('invalid-test-id')
      ).rejects.toThrow('Resilience test invalid-test-id not found');
    });
  });
});

describe('Resilience System Integration', () => {
  it('should maintain system integrity under stress', async () => {
    // This is a comprehensive integration test that simulates real-world stress scenarios
    
    // 1. Create multiple recovery points
    const recoveryPoints = await Promise.all([
      recoveryStrategyManager.createRecoveryPoint('DATABASE', 'tenant1', 'DB backup 1'),
      recoveryStrategyManager.createRecoveryPoint('AUDIT', 'tenant1', 'Audit backup 1'),
      recoveryStrategyManager.createRecoveryPoint('TENANT', 'tenant2', 'Tenant backup 1')
    ]);

    // 2. Add audit events
    await Promise.all([
      auditImmutabilityManager.addAuditEvent({
        tenantId: 'tenant1',
        actorId: 'user1',
        action: 'CRITICAL_ACTION',
        resourceType: 'CRITICAL_RESOURCE',
        resourceId: 'critical-id',
        outcome: 'SUCCESS',
        timestamp: new Date(),
        correlationId: 'critical-correlation',
        severity: 'CRITICAL',
        metadata: { critical: true }
      }),
      auditImmutabilityManager.addAuditEvent({
        tenantId: 'tenant2',
        actorId: 'user2',
        action: 'NORMAL_ACTION',
        resourceType: 'NORMAL_RESOURCE',
        resourceId: 'normal-id',
        outcome: 'SUCCESS',
        timestamp: new Date(),
        correlationId: 'normal-correlation',
        severity: 'LOW',
        metadata: {}
      })
    ]);

    // 3. Inject multiple faults
    const faultIds = await Promise.all([
      chaosEngineeringManager.injectFault('DATABASE_DOWN', 'primary-db', 'HIGH', 'Primary DB failure'),
      chaosEngineeringManager.injectFault('QUEUE_LAG', 'message-queue', 'MEDIUM', 'Queue lag'),
      chaosEngineeringManager.injectFault('CACHE_LOSS', 'redis-cache', 'LOW', 'Cache loss')
    ]);

    // 4. Execute comprehensive resilience test
    const comprehensiveTestId = chaosEngineeringManager.createResilienceTest(
      'Comprehensive Resilience Test',
      'Test complete system resilience under multiple stressors',
      'COMPREHENSIVE_STRESS_TEST',
      ['System load < 95%', 'Core services operational'],
      [
        {
          step: 1,
          description: 'Verify system responds to multiple failures',
          action: 'verify_multiple_failures',
          expectedOutcome: 'system_degraded_but_operational',
          timeout: 20000
        },
        {
          step: 2,
          description: 'Verify critical services remain available',
          action: 'verify_critical_services',
          expectedOutcome: 'critical_services_available',
          timeout: 15000
        },
        {
          step: 3,
          description: 'Verify tenant isolation maintained',
          action: 'verify_tenant_isolation',
          expectedOutcome: 'tenant_isolation_maintained',
          timeout: 10000
        }
      ],
      [
        {
          step: 1,
          description: 'Verify data integrity across all tenants',
          action: 'verify_data_integrity',
          expectedOutcome: 'data_integrity_maintained',
          timeout: 10000
        },
        {
          step: 2,
          description: 'Verify audit trail continuity',
          action: 'verify_audit_continuity',
          expectedOutcome: 'audit_trail_continuous',
          timeout: 5000
        },
        {
          step: 3,
          description: 'Verify recovery capabilities',
          action: 'verify_recovery_capabilities',
          expectedOutcome: 'recovery_capabilities_intact',
          timeout: 15000
        }
      ]
    );

    // 5. Execute the comprehensive test
    const comprehensiveResult = await chaosEngineeringManager.executeResilienceTest(comprehensiveTestId);

    // 6. Verify system maintained integrity
    const auditVerification1 = await auditImmutabilityManager.verifyAuditChainIntegrity('tenant1');
    const auditVerification2 = await auditImmutabilityManager.verifyAuditChainIntegrity('tenant2');
    const rpoRtoCompliance = await recoveryStrategyManager.validateRPORTOCompliance();

    // 7. Cleanup
    faultIds.forEach(faultId => chaosEngineeringManager.stopFault(faultId));

    // Verify comprehensive test results
    expect(comprehensiveResult.testId).toBe(comprehensiveTestId);
    expect(comprehensiveResult.testName).toBe('Comprehensive Resilience Test');
    expect(comprehensiveResult.scenario).toBe('COMPREHENSIVE_STRESS_TEST');
    expect(typeof comprehensiveResult.success).toBe('boolean');
    expect(comprehensiveResult.duration).toBeGreaterThan(0);

    // Verify system maintained integrity
    expect(auditVerification1.valid).toBe(true);
    expect(auditVerification2.valid).toBe(true);
    expect(typeof rpoRtoCompliance.compliant).toBe('boolean');

    // Verify all components are still functional
    expect(recoveryPoints).toHaveLength(3);
    expect(recoveryPoints.every(rp => rp.id)).toBe(true);
  });
});
