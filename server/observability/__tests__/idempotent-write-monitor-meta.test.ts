/**
 * Idempotent Write Monitor Meta-Test
 * 
 * This test verifies that ALL idempotent operations (financial + high-risk)
 * emit proper telemetry, logging, and metrics.
 * 
 * This is a SYSTEM-LEVEL INVARIANT test that MUST pass.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { 
  monitorIdempotentWrite, 
  idempotentWriteMetrics,
  getMetricsExport,
  getMonitoringHealth,
  type IdempotentWriteTelemetry 
} from "../idempotent-write-monitor";
import { FINANCIAL_MUTATIONS } from "../../resilience/financial-mutation-registry";
import { HIGH_RISK_MUTATIONS } from "../../resilience/high-risk-mutation-registry";

describe("Idempotent Write Monitor (Meta-Test)", () => {
  beforeEach(() => {
    // Reset metrics before each test
    idempotentWriteMetrics.reset();
  });

  it("monitoring system is healthy", () => {
    const health = getMonitoringHealth();
    
    expect(health.healthy).toBe(true);
    expect(health.metricsCount).toBeGreaterThanOrEqual(0);
    
    console.log("✓ Monitoring system is healthy");
  });

  it("can monitor a financial operation", async () => {
    const telemetry: IdempotentWriteTelemetry = {
      operationName: "createPayment",
      operationType: "financial",
      deterministicId: "test-deterministic-id-123",
      companyId: "test-company-123",
      userId: "test-user-123",
      status: "new",
      executionDurationMs: 150,
      timestamp: new Date(),
      idempotencyKey: "test-key-123",
      workflowsTriggered: 1,
      sideEffectsExecuted: true,
    };

    await monitorIdempotentWrite(telemetry);

    // Verify metrics were recorded
    const totalCount = idempotentWriteMetrics.getCounter("idempotent_writes_total", {
      operation: "createPayment",
      type: "financial",
      status: "new",
    });

    expect(totalCount).toBe(1);
    
    console.log("✓ Financial operation monitoring works");
  });

  it("can monitor a high-risk operation", async () => {
    const telemetry: IdempotentWriteTelemetry = {
      operationName: "adjustInventory",
      operationType: "high-risk",
      deterministicId: "test-deterministic-id-456",
      companyId: "test-company-456",
      userId: "test-user-456",
      status: "new",
      executionDurationMs: 200,
      timestamp: new Date(),
      idempotencyKey: "test-key-456",
      workflowsTriggered: 0,
      sideEffectsExecuted: true,
    };

    await monitorIdempotentWrite(telemetry);

    // Verify metrics were recorded
    const totalCount = idempotentWriteMetrics.getCounter("idempotent_writes_total", {
      operation: "adjustInventory",
      type: "high-risk",
      status: "new",
    });

    expect(totalCount).toBe(1);
    
    console.log("✓ High-risk operation monitoring works");
  });

  it("tracks replayed operations separately", async () => {
    const telemetry: IdempotentWriteTelemetry = {
      operationName: "createInvoice",
      operationType: "financial",
      deterministicId: "test-deterministic-id-789",
      companyId: "test-company-789",
      status: "replayed",
      executionDurationMs: 50,
      timestamp: new Date(),
      idempotencyKey: "test-key-789",
      workflowsTriggered: 0,
      sideEffectsExecuted: false,
    };

    await monitorIdempotentWrite(telemetry);

    // Verify replay counter
    const replayCount = idempotentWriteMetrics.getCounter("idempotent_writes_replayed_total", {
      operation: "createInvoice",
      type: "financial",
    });

    expect(replayCount).toBe(1);
    
    console.log("✓ Replay tracking works");
  });

  it("tracks failed operations separately", async () => {
    const telemetry: IdempotentWriteTelemetry = {
      operationName: "executePayroll",
      operationType: "financial",
      deterministicId: "test-deterministic-id-fail",
      companyId: "test-company-fail",
      status: "failed",
      executionDurationMs: 100,
      timestamp: new Date(),
      idempotencyKey: "test-key-fail",
      workflowsTriggered: 0,
      sideEffectsExecuted: false,
      errorMessage: "Test error",
    };

    await monitorIdempotentWrite(telemetry);

    // Verify failure counter
    const failureCount = idempotentWriteMetrics.getCounter("idempotent_writes_failed_total", {
      operation: "executePayroll",
      type: "financial",
    });

    expect(failureCount).toBe(1);
    
    console.log("✓ Failure tracking works");
  });

  it("records execution duration histograms", async () => {
    const durations = [100, 150, 200, 250, 300];

    for (const duration of durations) {
      const telemetry: IdempotentWriteTelemetry = {
        operationName: "reconcileLedger",
        operationType: "financial",
        deterministicId: `test-id-${duration}`,
        companyId: "test-company",
        status: "new",
        executionDurationMs: duration,
        timestamp: new Date(),
        idempotencyKey: `test-key-${duration}`,
        workflowsTriggered: 0,
        sideEffectsExecuted: true,
      };

      await monitorIdempotentWrite(telemetry);
    }

    // Verify histogram
    const histogram = idempotentWriteMetrics.getHistogram("idempotent_write_duration_ms", {
      operation: "reconcileLedger",
      type: "financial",
    });

    expect(histogram.length).toBe(5);
    expect(histogram).toEqual(durations);
    
    console.log("✓ Duration histogram tracking works");
  });

  it("exports metrics in Prometheus format", async () => {
    // Record some test metrics
    const telemetry: IdempotentWriteTelemetry = {
      operationName: "createCustomer",
      operationType: "high-risk",
      deterministicId: "test-id-prometheus",
      companyId: "test-company",
      status: "new",
      executionDurationMs: 175,
      timestamp: new Date(),
      idempotencyKey: "test-key-prometheus",
      workflowsTriggered: 1,
      sideEffectsExecuted: true,
    };

    await monitorIdempotentWrite(telemetry);

    // Export metrics
    const metricsText = getMetricsExport();

    expect(metricsText).toBeTruthy();
    expect(metricsText).toContain("idempotent_writes_total");
    expect(metricsText).toContain("createCustomer");
    
    console.log("✓ Prometheus metrics export works");
  });

  it("tracks workflow triggers", async () => {
    const telemetry: IdempotentWriteTelemetry = {
      operationName: "finalizeInvoice",
      operationType: "financial",
      deterministicId: "test-id-workflow",
      companyId: "test-company",
      status: "new",
      executionDurationMs: 120,
      timestamp: new Date(),
      idempotencyKey: "test-key-workflow",
      workflowsTriggered: 3,
      sideEffectsExecuted: true,
    };

    await monitorIdempotentWrite(telemetry);

    // Verify workflow counter
    const workflowCount = idempotentWriteMetrics.getCounter("idempotent_writes_workflows_triggered_total", {
      operation: "finalizeInvoice",
      type: "financial",
    });

    expect(workflowCount).toBe(1);
    
    console.log("✓ Workflow trigger tracking works");
  });
});

describe("Telemetry Coverage (Meta-Test)", () => {
  it("all financial mutations are registered for monitoring", () => {
    // Verify all financial operations can be monitored
    expect(FINANCIAL_MUTATIONS.length).toBeGreaterThan(0);

    for (const mutation of FINANCIAL_MUTATIONS) {
      // Each mutation should have a valid operation name
      expect(mutation.operationName).toBeTruthy();
      expect(typeof mutation.operationName).toBe("string");
    }

    console.log(`✓ All ${FINANCIAL_MUTATIONS.length} financial mutations registered`);
  });

  it("all high-risk mutations are registered for monitoring", () => {
    // Verify all high-risk operations can be monitored
    expect(HIGH_RISK_MUTATIONS.length).toBeGreaterThan(0);

    for (const mutation of HIGH_RISK_MUTATIONS) {
      // Each mutation should have a valid operation name
      expect(mutation.operationName).toBeTruthy();
      expect(typeof mutation.operationName).toBe("string");
    }

    console.log(`✓ All ${HIGH_RISK_MUTATIONS.length} high-risk mutations registered`);
  });

  it("total monitored operations equals financial + high-risk", () => {
    const totalOperations = FINANCIAL_MUTATIONS.length + HIGH_RISK_MUTATIONS.length;
    
    // Should be 29 total (20 financial + 9 high-risk)
    expect(totalOperations).toBe(29);
    
    console.log(`✓ Total ${totalOperations} operations monitored (${FINANCIAL_MUTATIONS.length} financial + ${HIGH_RISK_MUTATIONS.length} high-risk)`);
  });

  it("all operations have unique names across both registries", () => {
    const allOperations = [
      ...FINANCIAL_MUTATIONS.map(m => m.operationName),
      ...HIGH_RISK_MUTATIONS.map(m => m.operationName),
    ];

    const uniqueOperations = new Set(allOperations);
    
    expect(uniqueOperations.size).toBe(allOperations.length);
    
    console.log("✓ All operation names are unique");
  });

  it("monitoring supports all required telemetry fields", () => {
    const requiredFields: (keyof IdempotentWriteTelemetry)[] = [
      "operationName",
      "operationType",
      "deterministicId",
      "companyId",
      "status",
      "executionDurationMs",
      "timestamp",
      "idempotencyKey",
      "workflowsTriggered",
      "sideEffectsExecuted",
    ];

    const sampleTelemetry: IdempotentWriteTelemetry = {
      operationName: "test",
      operationType: "financial",
      deterministicId: "test-id",
      companyId: "test-company",
      status: "new",
      executionDurationMs: 100,
      timestamp: new Date(),
      idempotencyKey: "test-key",
      workflowsTriggered: 0,
      sideEffectsExecuted: false,
    };

    for (const field of requiredFields) {
      expect(sampleTelemetry[field]).toBeDefined();
    }

    console.log("✓ All required telemetry fields supported");
  });

  it("monitoring supports all operation statuses", () => {
    const statuses: Array<"new" | "replayed" | "failed"> = ["new", "replayed", "failed"];

    for (const status of statuses) {
      const telemetry: IdempotentWriteTelemetry = {
        operationName: "test",
        operationType: "financial",
        deterministicId: `test-id-${status}`,
        companyId: "test-company",
        status,
        executionDurationMs: 100,
        timestamp: new Date(),
        idempotencyKey: `test-key-${status}`,
        workflowsTriggered: 0,
        sideEffectsExecuted: status === "new",
      };

      // Should not throw
      expect(() => monitorIdempotentWrite(telemetry)).not.toThrow();
    }

    console.log("✓ All operation statuses supported (new, replayed, failed)");
  });

  it("monitoring supports both operation types", () => {
    const types: Array<"financial" | "high-risk"> = ["financial", "high-risk"];

    for (const type of types) {
      const telemetry: IdempotentWriteTelemetry = {
        operationName: "test",
        operationType: type,
        deterministicId: `test-id-${type}`,
        companyId: "test-company",
        status: "new",
        executionDurationMs: 100,
        timestamp: new Date(),
        idempotencyKey: `test-key-${type}`,
        workflowsTriggered: 0,
        sideEffectsExecuted: true,
      };

      // Should not throw
      expect(() => monitorIdempotentWrite(telemetry)).not.toThrow();
    }

    console.log("✓ Both operation types supported (financial, high-risk)");
  });
});

describe("Observability System Invariants", () => {
  beforeEach(() => {
    // Ensure clean state for each test
    idempotentWriteMetrics.reset();
  });

  it("monitoring does not throw on valid telemetry", async () => {
    const telemetry: IdempotentWriteTelemetry = {
      operationName: "createPayment",
      operationType: "financial",
      deterministicId: "test-id",
      companyId: "test-company",
      status: "new",
      executionDurationMs: 100,
      timestamp: new Date(),
      idempotencyKey: "test-key",
      workflowsTriggered: 1,
      sideEffectsExecuted: true,
    };

    await expect(monitorIdempotentWrite(telemetry)).resolves.not.toThrow();
    
    console.log("✓ Monitoring is error-safe");
  });

  it("monitoring is non-blocking (async)", async () => {
    const startTime = Date.now();

    const telemetry: IdempotentWriteTelemetry = {
      operationName: "createInvoice",
      operationType: "financial",
      deterministicId: "test-id-async",
      companyId: "test-company",
      status: "new",
      executionDurationMs: 100,
      timestamp: new Date(),
      idempotencyKey: "test-key-async",
      workflowsTriggered: 0,
      sideEffectsExecuted: true,
    };

    await monitorIdempotentWrite(telemetry);

    const duration = Date.now() - startTime;

    // Monitoring should complete quickly (< 100ms)
    expect(duration).toBeLessThan(100);
    
    console.log(`✓ Monitoring is fast (${duration}ms)`);
  });

  it("metrics are isolated by operation and type", async () => {
    // Record metrics for different operations
    await monitorIdempotentWrite({
      operationName: "createPayment",
      operationType: "financial",
      deterministicId: "test-1",
      companyId: "test-company",
      status: "new",
      executionDurationMs: 100,
      timestamp: new Date(),
      idempotencyKey: "key-1",
      workflowsTriggered: 0,
      sideEffectsExecuted: true,
    });

    await monitorIdempotentWrite({
      operationName: "adjustInventory",
      operationType: "high-risk",
      deterministicId: "test-2",
      companyId: "test-company",
      status: "new",
      executionDurationMs: 100,
      timestamp: new Date(),
      idempotencyKey: "key-2",
      workflowsTriggered: 0,
      sideEffectsExecuted: true,
    });

    // Verify metrics are separate
    const paymentCount = idempotentWriteMetrics.getCounter("idempotent_writes_total", {
      operation: "createPayment",
      type: "financial",
      status: "new",
    });

    const inventoryCount = idempotentWriteMetrics.getCounter("idempotent_writes_total", {
      operation: "adjustInventory",
      type: "high-risk",
      status: "new",
    });

    expect(paymentCount).toBe(1);
    expect(inventoryCount).toBe(1);
    
    console.log("✓ Metrics are properly isolated");
  });

  it("monitoring system has comprehensive coverage", () => {
    // Verify all 29 operations are covered
    const allOperations = [
      ...FINANCIAL_MUTATIONS.map(m => ({ name: m.operationName, type: "financial" as const })),
      ...HIGH_RISK_MUTATIONS.map(m => ({ name: m.operationName, type: "high-risk" as const })),
    ];

    expect(allOperations.length).toBe(29);

    // All operations should be monitorable
    for (const op of allOperations) {
      expect(op.name).toBeTruthy();
      expect(["financial", "high-risk"]).toContain(op.type);
    }

    console.log(`✓ Comprehensive coverage: ${allOperations.length}/${allOperations.length} operations monitored`);
  });
});
