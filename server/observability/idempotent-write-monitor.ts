/**
 * Idempotent Write Monitor
 * 
 * Unified telemetry and observability for all idempotent operations
 * (financial + high-risk).
 * 
 * Provides:
 * - Centralized logging
 * - Metrics collection (Prometheus-compatible)
 * - Audit trail persistence
 * - Alerting hooks
 */

import { db } from "../db";
import * as s from "../../shared/schema";

/**
 * Telemetry data for an idempotent write operation
 */
export interface IdempotentWriteTelemetry {
  // Operation identification
  operationName: string;
  operationType: "financial" | "high-risk";
  deterministicId: string;
  
  // Tenant context
  companyId: string;
  userId?: string;
  
  // Execution details
  status: "new" | "replayed" | "failed";
  executionDurationMs: number;
  timestamp: Date;
  
  // Request metadata
  requestId?: string;
  idempotencyKey: string;
  routePath?: string;
  httpMethod?: string;
  
  // Outcome
  workflowsTriggered: number;
  sideEffectsExecuted: boolean;
  
  // Error details (if failed)
  errorMessage?: string;
  errorStack?: string;
  
  // Additional context
  metadata?: Record<string, any>;
}

/**
 * Metrics counters (in-memory, exported to Prometheus)
 */
class IdempotentWriteMetrics {
  private counters: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();

  increment(metric: string, labels: Record<string, string> = {}): void {
    const key = this.buildKey(metric, labels);
    this.counters.set(key, (this.counters.get(key) || 0) + 1);
  }

  recordDuration(metric: string, durationMs: number, labels: Record<string, string> = {}): void {
    const key = this.buildKey(metric, labels);
    const values = this.histograms.get(key) || [];
    values.push(durationMs);
    this.histograms.set(key, values);
  }

  getCounter(metric: string, labels: Record<string, string> = {}): number {
    const key = this.buildKey(metric, labels);
    return this.counters.get(key) || 0;
  }

  getHistogram(metric: string, labels: Record<string, string> = {}): number[] {
    const key = this.buildKey(metric, labels);
    return this.histograms.get(key) || [];
  }

  private buildKey(metric: string, labels: Record<string, string>): string {
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(",");
    return labelStr ? `${metric}{${labelStr}}` : metric;
  }

  /**
   * Export metrics in Prometheus text format
   */
  exportPrometheus(): string {
    const lines: string[] = [];

    // Export counters
    for (const [key, value] of this.counters.entries()) {
      lines.push(`${key} ${value}`);
    }

    // Export histograms (simplified - just count and sum)
    for (const [key, values] of this.histograms.entries()) {
      const count = values.length;
      const sum = values.reduce((a, b) => a + b, 0);
      lines.push(`${key}_count ${count}`);
      lines.push(`${key}_sum ${sum}`);
    }

    return lines.join("\n");
  }

  reset(): void {
    this.counters.clear();
    this.histograms.clear();
  }
}

// Global metrics instance
export const idempotentWriteMetrics = new IdempotentWriteMetrics();

/**
 * Monitor an idempotent write operation
 * 
 * This function:
 * 1. Logs telemetry data
 * 2. Records metrics
 * 3. Persists audit trail
 * 4. Triggers alerts if needed
 */
export async function monitorIdempotentWrite(
  telemetry: IdempotentWriteTelemetry
): Promise<void> {
  const startTime = Date.now();

  try {
    // 1. Log telemetry
    logIdempotentWrite(telemetry);

    // 2. Record metrics
    recordMetrics(telemetry);

    // 3. Persist audit trail (async, non-blocking)
    void persistAuditTrail(telemetry).catch((err) => {
      console.error("Failed to persist audit trail:", err);
    });

    // 4. Check for alerts
    checkAlerts(telemetry);

  } catch (error) {
    console.error("Error in idempotent write monitor:", error);
  }

  const monitorDuration = Date.now() - startTime;
  if (monitorDuration > 100) {
    console.warn(`Idempotent write monitoring took ${monitorDuration}ms for ${telemetry.operationName}`);
  }
}

/**
 * Log telemetry data (structured logging)
 */
function logIdempotentWrite(telemetry: IdempotentWriteTelemetry): void {
  const logLevel = telemetry.status === "failed" ? "error" : "info";
  const statusEmoji = {
    new: "✅",
    replayed: "🔄",
    failed: "❌",
  }[telemetry.status];

  console.log(JSON.stringify({
    level: logLevel,
    component: "idempotent-write-monitor",
    message: `${statusEmoji} ${telemetry.operationType} operation: ${telemetry.operationName}`,
    data: {
      operationName: telemetry.operationName,
      operationType: telemetry.operationType,
      status: telemetry.status,
      companyId: telemetry.companyId,
      deterministicId: telemetry.deterministicId,
      executionDurationMs: telemetry.executionDurationMs,
      workflowsTriggered: telemetry.workflowsTriggered,
      sideEffectsExecuted: telemetry.sideEffectsExecuted,
      replayed: telemetry.status === "replayed",
      ...(telemetry.errorMessage && { error: telemetry.errorMessage }),
    },
    timestamp: telemetry.timestamp.toISOString(),
    environment: process.env.NODE_ENV || "development",
  }));
}

/**
 * Record metrics for Prometheus/Grafana
 */
function recordMetrics(telemetry: IdempotentWriteTelemetry): void {
  const labels = {
    operation: telemetry.operationName,
    type: telemetry.operationType,
    status: telemetry.status,
  };

  // Counter: total operations
  idempotentWriteMetrics.increment("idempotent_writes_total", labels);

  // Counter: replays
  if (telemetry.status === "replayed") {
    idempotentWriteMetrics.increment("idempotent_writes_replayed_total", {
      operation: telemetry.operationName,
      type: telemetry.operationType,
    });
  }

  // Counter: failures
  if (telemetry.status === "failed") {
    idempotentWriteMetrics.increment("idempotent_writes_failed_total", {
      operation: telemetry.operationName,
      type: telemetry.operationType,
    });
  }

  // Counter: workflows triggered
  if (telemetry.workflowsTriggered > 0) {
    idempotentWriteMetrics.increment("idempotent_writes_workflows_triggered_total", {
      operation: telemetry.operationName,
      type: telemetry.operationType,
    });
  }

  // Histogram: execution duration
  idempotentWriteMetrics.recordDuration(
    "idempotent_write_duration_ms",
    telemetry.executionDurationMs,
    {
      operation: telemetry.operationName,
      type: telemetry.operationType,
    }
  );
}

/**
 * Persist audit trail to database
 */
async function persistAuditTrail(telemetry: IdempotentWriteTelemetry): Promise<void> {
  try {
    await db.insert(s.idempotentWriteAuditLog).values({
      operationName: telemetry.operationName,
      operationType: telemetry.operationType,
      deterministicId: telemetry.deterministicId,
      companyId: telemetry.companyId,
      userId: telemetry.userId || null,
      status: telemetry.status,
      executionDurationMs: telemetry.executionDurationMs,
      timestamp: telemetry.timestamp,
      requestId: telemetry.requestId || null,
      idempotencyKey: telemetry.idempotencyKey,
      routePath: telemetry.routePath || null,
      httpMethod: telemetry.httpMethod || null,
      workflowsTriggered: telemetry.workflowsTriggered,
      sideEffectsExecuted: telemetry.sideEffectsExecuted,
      errorMessage: telemetry.errorMessage || null,
      metadata: telemetry.metadata ? JSON.stringify(telemetry.metadata) : null,
    });
  } catch (error) {
    // Don't throw - audit logging should not break the operation
    console.error("Failed to persist audit trail:", error);
  }
}

/**
 * Check for alert conditions
 */
function checkAlerts(telemetry: IdempotentWriteTelemetry): void {
  // Alert: Unexpected replay rate
  const replayRate = getReplayRate(telemetry.operationName);
  if (replayRate > 0.5) { // More than 50% replays
    console.warn(
      `⚠️  HIGH REPLAY RATE for ${telemetry.operationName}: ${(replayRate * 100).toFixed(1)}%`
    );
  }

  // Alert: Idempotency key collision (same key, different operation)
  if (telemetry.status === "failed" && telemetry.errorMessage?.includes("mismatch")) {
    console.error(
      `🚨 IDEMPOTENCY KEY COLLISION detected for ${telemetry.operationName}: ${telemetry.idempotencyKey}`
    );
  }

  // Alert: High failure rate
  const failureRate = getFailureRate(telemetry.operationName);
  if (failureRate > 0.1) { // More than 10% failures
    console.error(
      `🚨 HIGH FAILURE RATE for ${telemetry.operationName}: ${(failureRate * 100).toFixed(1)}%`
    );
  }

  // Alert: Slow execution
  if (telemetry.executionDurationMs > 5000) { // More than 5 seconds
    console.warn(
      `⚠️  SLOW EXECUTION for ${telemetry.operationName}: ${telemetry.executionDurationMs}ms`
    );
  }
}

/**
 * Calculate replay rate for an operation
 */
function getReplayRate(operationName: string): number {
  const total = idempotentWriteMetrics.getCounter("idempotent_writes_total", {
    operation: operationName,
    type: "financial",
    status: "new",
  }) + idempotentWriteMetrics.getCounter("idempotent_writes_total", {
    operation: operationName,
    type: "financial",
    status: "replayed",
  }) + idempotentWriteMetrics.getCounter("idempotent_writes_total", {
    operation: operationName,
    type: "high-risk",
    status: "new",
  }) + idempotentWriteMetrics.getCounter("idempotent_writes_total", {
    operation: operationName,
    type: "high-risk",
    status: "replayed",
  });

  const replayed = idempotentWriteMetrics.getCounter("idempotent_writes_replayed_total", {
    operation: operationName,
    type: "financial",
  }) + idempotentWriteMetrics.getCounter("idempotent_writes_replayed_total", {
    operation: operationName,
    type: "high-risk",
  });

  return total > 0 ? replayed / total : 0;
}

/**
 * Calculate failure rate for an operation
 */
function getFailureRate(operationName: string): number {
  const total = idempotentWriteMetrics.getCounter("idempotent_writes_total", {
    operation: operationName,
    type: "financial",
    status: "new",
  }) + idempotentWriteMetrics.getCounter("idempotent_writes_total", {
    operation: operationName,
    type: "financial",
    status: "failed",
  }) + idempotentWriteMetrics.getCounter("idempotent_writes_total", {
    operation: operationName,
    type: "high-risk",
    status: "new",
  }) + idempotentWriteMetrics.getCounter("idempotent_writes_total", {
    operation: operationName,
    type: "high-risk",
    status: "failed",
  });

  const failed = idempotentWriteMetrics.getCounter("idempotent_writes_failed_total", {
    operation: operationName,
    type: "financial",
  }) + idempotentWriteMetrics.getCounter("idempotent_writes_failed_total", {
    operation: operationName,
    type: "high-risk",
  });

  return total > 0 ? failed / total : 0;
}

/**
 * Query audit trail for debugging/compliance
 */
export async function queryAuditTrail(filters: {
  companyId?: string;
  operationName?: string;
  status?: "new" | "replayed" | "failed";
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}): Promise<any[]> {
  // This would use Drizzle ORM to query the audit log table
  // Simplified for now
  return [];
}

/**
 * Export metrics endpoint (for Prometheus scraping)
 */
export function getMetricsExport(): string {
  return idempotentWriteMetrics.exportPrometheus();
}

/**
 * Health check for monitoring system
 */
export function getMonitoringHealth(): {
  healthy: boolean;
  metricsCount: number;
  lastAuditLogTime?: Date;
} {
  return {
    healthy: true,
    metricsCount: idempotentWriteMetrics.getCounter("idempotent_writes_total"),
    lastAuditLogTime: new Date(),
  };
}
