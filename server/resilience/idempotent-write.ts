/**
 * Financial Write-Path Idempotency Framework
 * 
 * This module provides the canonical implementation of exactly-once financial mutations
 * following the proven pattern from Phases 3.3-3.4.4.
 * 
 * ALL financial write operations MUST use this framework.
 */

import { db } from "../db";
import crypto from "crypto";

/**
 * Generate a deterministic UUID v4 from a seed string
 * This ensures identical inputs produce identical UUIDs
 */
function deterministicUuidV4(seed: string): string {
  const bytes = crypto.createHash("sha256").update(seed).digest().subarray(0, 16);

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

/**
 * Configuration for an idempotent financial write operation
 */
export interface IdempotentWriteConfig<TEntity, TTrackingRow> {
  /**
   * Company ID for tenant isolation (REQUIRED)
   */
  companyId: string;

  /**
   * Operation name for deterministic UUID generation (e.g., "createPayment", "finalizeInvoice")
   */
  operationName: string;

  /**
   * Idempotency key from request header (REQUIRED)
   */
  idempotencyKey: string;

  /**
   * Primary entity ID (e.g., invoiceId, payRunId) for validation
   */
  entityId: string;

  /**
   * Function to check if the operation has already been performed
   * Should return the existing entity if found, null otherwise
   */
  checkExisting: (tx: any) => Promise<TEntity | null>;

  /**
   * Function to perform the actual write operation
   * Must return the created/updated entity
   */
  executeWrite: (tx: any) => Promise<TEntity>;

  /**
   * Function to insert the idempotency tracking row
   * Must use the deterministic UUID as primary key
   */
  insertTracking: (tx: any, deterministicId: string) => Promise<void>;

  /**
   * Function to validate replay compatibility
   * Should throw if the replay request doesn't match the original
   */
  validateReplay?: (existing: TEntity) => void;
}

/**
 * Result of an idempotent write operation
 */
export interface IdempotentWriteResult<TEntity> {
  /**
   * The entity (created or replayed)
   */
  entity: TEntity;

  /**
   * Whether this was a replay (true) or new write (false)
   */
  replayed: boolean;

  /**
   * The deterministic UUID used for this operation
   */
  deterministicId: string;
}

/**
 * Executes a financial write operation with exactly-once semantics
 * 
 * This is the CANONICAL implementation of idempotent financial writes.
 * 
 * Guarantees:
 * - Deterministic UUID generation
 * - DB-level uniqueness enforcement
 * - Atomic transaction boundary
 * - Replay detection and validation
 * - Tenant isolation
 * 
 * @example
 * ```typescript
 * const result = await withIdempotentWrite({
 *   companyId: "company-123",
 *   operationName: "createPayment",
 *   idempotencyKey: "idem-key-abc",
 *   entityId: invoiceId,
 *   checkExisting: async (tx) => {
 *     const [existing] = await tx.select().from(payments)
 *       .where(eq(payments.id, deterministicId)).limit(1);
 *     return existing || null;
 *   },
 *   executeWrite: async (tx) => {
 *     const [payment] = await tx.insert(payments)
 *       .values({ ...paymentData, id: deterministicId })
 *       .returning();
 *     return payment;
 *   },
 *   insertTracking: async (tx, deterministicId) => {
 *     await tx.insert(paymentExecutions)
 *       .values({ id: deterministicId, ... })
 *       .onConflictDoNothing();
 *   },
 *   validateReplay: (existing) => {
 *     if (existing.amount !== expectedAmount) {
 *       throw new Error("Replay mismatch: amount differs");
 *     }
 *   }
 * });
 * 
 * if (!result.replayed) {
 *   // Trigger workflows only on first execution
 *   await startWorkflowInstance(...);
 * }
 * ```
 */
export async function withIdempotentWrite<TEntity>(
  config: IdempotentWriteConfig<TEntity, any>
): Promise<IdempotentWriteResult<TEntity>> {
  // Validate required parameters
  if (!config.companyId) {
    throw new Error("companyId is required for idempotent write");
  }

  if (!config.operationName) {
    throw new Error("operationName is required for idempotent write");
  }

  const key = typeof config.idempotencyKey === "string" ? config.idempotencyKey.trim() : "";
  if (!key) {
    throw new Error(`Idempotency-Key is required for ${config.operationName}`);
  }

  // Note: Tenant isolation is enforced by the storage layer (enforceWriteCompanyScope)
  // before calling this helper. This helper focuses on idempotency mechanics.

  // Generate deterministic UUID
  const deterministicId = deterministicUuidV4(
    `company:${config.companyId}:op:${config.operationName}:key:${key}`
  );

  try {
    // Execute within atomic transaction
    const result = await db.transaction(async (tx) => {
      // Check if operation already performed
      const existing = await config.checkExisting(tx);

      if (existing) {
        // Replay detected - validate if provided
        if (config.validateReplay) {
          config.validateReplay(existing);
        }
        return { entity: existing, replayed: true };
      }

      // Execute the write operation
      const entity = await config.executeWrite(tx);

      // Insert idempotency tracking row
      await config.insertTracking(tx, deterministicId);

      return { entity, replayed: false };
    });

    return {
      ...result,
      deterministicId,
    };
  } catch (err) {
    // If unique violation, attempt replay recovery
    if (isUniqueViolation(err)) {
      const existing = await config.checkExisting(db as any);

      if (existing) {
        if (config.validateReplay) {
          config.validateReplay(existing);
        }
        return {
          entity: existing,
          replayed: true,
          deterministicId,
        };
      }
    }

    // Re-throw if not a recoverable unique violation
    throw err;
  }
}

/**
 * Detects if an error is a unique constraint violation
 */
function isUniqueViolation(err: any): boolean {
  if (!err) return false;
  const code = String(err?.code ?? "");
  const message = String(err?.message ?? "").toLowerCase();
  return code === "23505" || message.includes("unique") || message.includes("duplicate");
}

/**
 * Type guard to ensure idempotency key is present
 * Use this in route handlers before calling idempotent operations
 */
export function requireIdempotencyKey(key: string | undefined): asserts key is string {
  const trimmed = typeof key === "string" ? key.trim() : "";
  if (!trimmed) {
    throw new Error("Idempotency-Key header is required for financial write operations");
  }
}

/**
 * Validates that a financial write operation follows the contract
 * This is used by enforcement guardrails
 */
export interface FinancialWriteContract {
  requiresIdempotencyKey: true;
  usesDeterministicUuid: true;
  enforcesDbUniqueness: true;
  usesAtomicTransaction: true;
  detectsReplays: true;
  enforceTenantIsolation: true;
  hasE2ETest: true;
}

/**
 * Marker type for financial write operations
 * Use this to document that an operation follows the contract
 */
export type IdempotentFinancialWrite<T> = T & {
  __idempotentWriteContract: FinancialWriteContract;
};
