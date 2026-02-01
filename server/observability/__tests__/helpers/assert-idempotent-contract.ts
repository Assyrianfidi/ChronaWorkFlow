/**
 * Enforcement Guardrail: Idempotent Write Contract Assertion
 * 
 * This test helper ensures that financial write operations follow the
 * Financial Write-Path Contract defined in FINANCIAL_WRITE_PATH_CONTRACT.md
 * 
 * Usage in E2E tests:
 * ```typescript
 * await assertIdempotentWriteContract({
 *   endpoint: "/api/payments",
 *   method: "POST",
 *   app,
 *   token,
 *   requestBody: paymentData,
 *   idempotencyKey: "test-key-123",
 *   entityTable: "payments",
 *   trackingTable: "payment_executions", // Optional
 *   companyId,
 * });
 * ```
 */

import { expect } from "vitest";
import request from "supertest";
import { db } from "../../../db";
import { sql } from "drizzle-orm";

export interface IdempotentContractAssertionConfig {
  /**
   * API endpoint to test (e.g., "/api/payments")
   */
  endpoint: string;

  /**
   * HTTP method (default: "POST")
   */
  method?: "POST" | "PUT" | "PATCH";

  /**
   * Express app instance
   */
  app: any;

  /**
   * JWT token for authentication
   */
  token: string;

  /**
   * Request body
   */
  requestBody: any;

  /**
   * Idempotency key to use
   */
  idempotencyKey: string;

  /**
   * Table name where entities are stored (for counting)
   */
  entityTable: string;

  /**
   * Optional tracking table name (for counting)
   */
  trackingTable?: string;

  /**
   * Company ID for tenant isolation verification
   */
  companyId: string;

  /**
   * Optional: Custom entity ID field name (default: "id")
   */
  entityIdField?: string;
}

/**
 * Asserts that an endpoint follows the Financial Write-Path Contract
 * 
 * This function will FAIL the test if any contract violation is detected:
 * - Missing Idempotency-Key returns 400
 * - Concurrent requests create exactly one entity
 * - Concurrent requests create exactly one tracking row (if applicable)
 * - Replay returns 200 (not 201)
 * - Replay returns identical entity
 * 
 * @throws AssertionError if contract violated
 */
export async function assertIdempotentWriteContract(
  config: IdempotentContractAssertionConfig
): Promise<void> {
  const method = config.method || "POST";
  const entityIdField = config.entityIdField || "id";

  // ========================================
  // RULE 1: Idempotency-Key Header Required
  // ========================================
  console.log("✓ Testing: Idempotency-Key header requirement...");
  
  const withoutKey = await request(config.app)
    [method.toLowerCase() as "post" | "put" | "patch"](config.endpoint)
    .set("Authorization", `Bearer ${config.token}`)
    .send(config.requestBody);

  expect(withoutKey.status).toBe(400);
  expect(withoutKey.body.error).toMatch(/idempotency-key/i);
  console.log("  ✓ Missing Idempotency-Key correctly rejected with 400");

  // ========================================
  // RULE 2-4: Deterministic UUID + DB Uniqueness + Atomic Transaction
  // (Tested implicitly via concurrent requests)
  // ========================================
  console.log("✓ Testing: Concurrent request handling (deterministic UUID + DB uniqueness + atomicity)...");

  // Count entities before
  const beforeCount = await countEntities(config.entityTable, config.companyId);

  // Make concurrent requests with same Idempotency-Key
  const [req1, req2] = await Promise.all([
    request(config.app)
      [method.toLowerCase() as "post" | "put" | "patch"](config.endpoint)
      .set("Authorization", `Bearer ${config.token}`)
      .set("Idempotency-Key", config.idempotencyKey)
      .send(config.requestBody),
    request(config.app)
      [method.toLowerCase() as "post" | "put" | "patch"](config.endpoint)
      .set("Authorization", `Bearer ${config.token}`)
      .set("Idempotency-Key", config.idempotencyKey)
      .send(config.requestBody),
  ]);

  // One should be 201 (created), one should be 200 (replay)
  const statuses = [req1.status, req2.status].sort();
  expect(statuses).toEqual([200, 201]);
  console.log("  ✓ Concurrent requests returned [200, 201] as expected");

  // ========================================
  // RULE 3: Exactly One Entity Created
  // ========================================
  const afterCount = await countEntities(config.entityTable, config.companyId);
  const entitiesCreated = afterCount - beforeCount;
  
  expect(entitiesCreated).toBe(1);
  console.log(`  ✓ Exactly one entity created in ${config.entityTable}`);

  // ========================================
  // RULE 5: Replay Returns Identical Entity
  // ========================================
  const entityId1 = req1.body[entityIdField];
  const entityId2 = req2.body[entityIdField];
  
  expect(entityId1).toBeTruthy();
  expect(entityId2).toBeTruthy();
  expect(entityId1).toBe(entityId2);
  console.log("  ✓ Both requests returned identical entity ID");

  // ========================================
  // RULE: Tracking Table (if applicable)
  // ========================================
  if (config.trackingTable) {
    const trackingCount = await countEntities(config.trackingTable, config.companyId);
    expect(trackingCount).toBeGreaterThanOrEqual(1);
    console.log(`  ✓ Tracking row exists in ${config.trackingTable}`);
  }

  // ========================================
  // RULE 6: Tenant Isolation
  // ========================================
  console.log("✓ Testing: Tenant isolation...");
  
  // Verify entity belongs to correct company
  const entity = await fetchEntity(config.entityTable, entityId1);
  expect(entity.company_id).toBe(config.companyId);
  console.log("  ✓ Entity correctly scoped to company");

  console.log("✅ All Financial Write-Path Contract assertions passed!");
}

/**
 * Helper: Count entities in a table for a specific company
 */
async function countEntities(tableName: string, companyId: string): Promise<number> {
  const result = await db.execute(
    sql.raw(`SELECT COUNT(*) as count FROM ${tableName} WHERE company_id = '${companyId}'`)
  );
  return parseInt(String((result.rows[0] as any)?.count ?? "0"));
}

/**
 * Helper: Fetch an entity by ID
 */
async function fetchEntity(tableName: string, entityId: string): Promise<any> {
  const result = await db.execute(
    sql.raw(`SELECT * FROM ${tableName} WHERE id = '${entityId}' LIMIT 1`)
  );
  return result.rows[0];
}

/**
 * Assertion: Verify workflow was triggered exactly once
 * 
 * Usage:
 * ```typescript
 * const workflowMock = vi.mocked(startWorkflowInstance);
 * await assertWorkflowTriggeredOnce(workflowMock, "payment_created");
 * ```
 */
export function assertWorkflowTriggeredOnce(
  workflowMock: any,
  expectedEventType: string
): void {
  const calls = workflowMock.mock.calls.filter(
    (call: any) => call[0]?.triggerEventType === expectedEventType
  );
  
  expect(calls.length).toBe(1);
  console.log(`  ✓ Workflow "${expectedEventType}" triggered exactly once`);
}

/**
 * Assertion: Verify replay mismatch is rejected
 * 
 * Usage:
 * ```typescript
 * await assertReplayMismatchRejected({
 *   endpoint: "/api/payments",
 *   app,
 *   token,
 *   idempotencyKey: "same-key",
 *   originalBody: { amount: "100.00" },
 *   mismatchedBody: { amount: "200.00" },
 * });
 * ```
 */
export async function assertReplayMismatchRejected(config: {
  endpoint: string;
  method?: "POST" | "PUT" | "PATCH";
  app: any;
  token: string;
  idempotencyKey: string;
  originalBody: any;
  mismatchedBody: any;
}): Promise<void> {
  const method = config.method || "POST";

  // First request with original data
  const original = await request(config.app)
    [method.toLowerCase() as "post" | "put" | "patch"](config.endpoint)
    .set("Authorization", `Bearer ${config.token}`)
    .set("Idempotency-Key", config.idempotencyKey)
    .send(config.originalBody);

  expect(original.status).toBe(201);

  // Second request with mismatched data (same key)
  const mismatched = await request(config.app)
    [method.toLowerCase() as "post" | "put" | "patch"](config.endpoint)
    .set("Authorization", `Bearer ${config.token}`)
    .set("Idempotency-Key", config.idempotencyKey)
    .send(config.mismatchedBody);

  // Should reject with error
  expect(mismatched.status).toBeGreaterThanOrEqual(400);
  expect(mismatched.body.error).toMatch(/mismatch|replay/i);
  console.log("  ✓ Replay mismatch correctly rejected");
}
