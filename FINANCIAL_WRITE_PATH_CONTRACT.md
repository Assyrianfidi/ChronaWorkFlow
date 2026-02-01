# Financial Write-Path Contract

**Version:** 1.0  
**Status:** MANDATORY  
**Enforcement:** Active

---

## Purpose

This document defines the **canonical, non-negotiable contract** for all financial write operations in the AccuBooks (ChronaWorkflow) codebase.

Any code that mutates:
- Money or balances
- Invoice, payment, or transaction status
- Payroll state
- Inventory quantities
- Bank reconciliation status
- Accounting ledger entries

**MUST** follow this contract without exception.

---

## The Contract

### 1. Idempotency-Key Header (REQUIRED)

**Rule:** Every financial write endpoint MUST require an `Idempotency-Key` header.

**Implementation:**
```typescript
const idempotencyKey = String(req.header("Idempotency-Key") ?? "").trim();
if (!idempotencyKey) {
  return res.status(400).json({ error: "Idempotency-Key header is required" });
}
```

**Why:** HTTP is unreliable. Clients may retry requests due to network failures, timeouts, or user actions (double-clicks). Without idempotency keys, retries cause duplicate financial records, incorrect balances, and data corruption.

---

### 2. Deterministic UUID Generation (REQUIRED)

**Rule:** All financial entities MUST use a deterministic UUID derived from:
```
company:${companyId}:op:${operationName}:key:${idempotencyKey}
```

**Implementation:**
```typescript
import { deterministicUuidV4 } from "./utils/deterministic-uuid";

const deterministicId = deterministicUuidV4(
  `company:${companyId}:op:createPayment:key:${idempotencyKey}`
);
```

**Why:** Deterministic UUIDs ensure that identical requests produce identical entity IDs, enabling database-level uniqueness enforcement and replay detection.

---

### 3. Database-Level Uniqueness (REQUIRED)

**Rule:** The deterministic UUID MUST be enforced as unique at the database level via:
- Primary key constraint, OR
- Unique index

**Implementation:**
```sql
CREATE TABLE payments (
  id VARCHAR(36) PRIMARY KEY,  -- Deterministic UUID
  ...
);

-- OR for tracking tables:
CREATE TABLE invoice_finalizations (
  id VARCHAR(36) PRIMARY KEY,  -- Deterministic UUID
  ...
);
```

**Why:** Application-level uniqueness checks are vulnerable to race conditions. Only database constraints provide true exactly-once guarantees under concurrent requests.

---

### 4. Atomic Transaction Boundary (REQUIRED)

**Rule:** ALL mutations for a single financial operation MUST occur within ONE database transaction.

**Implementation:**
```typescript
const result = await db.transaction(async (tx) => {
  // 1. Insert/update primary entity
  const [entity] = await tx.insert(payments).values({...}).returning();
  
  // 2. Update related entities (e.g., invoice.amountPaid)
  await tx.update(invoices).set({...}).where(...);
  
  // 3. Insert tracking row
  await tx.insert(trackingTable).values({...}).onConflictDoNothing();
  
  return entity;
});
```

**Why:** Partial writes corrupt financial state. If any step fails, the entire operation must roll back atomically.

---

### 5. Replay Detection and Validation (REQUIRED)

**Rule:** When a unique constraint violation occurs, the operation MUST:
1. Detect the replay
2. Fetch the existing entity
3. Validate replay compatibility
4. Return the existing result

**Implementation:**
```typescript
try {
  // Attempt write
  return await executeWrite();
} catch (err) {
  if (isUniqueViolation(err)) {
    const existing = await fetchExisting();
    validateReplay(existing, incomingRequest);
    return { entity: existing, replayed: true };
  }
  throw err;
}
```

**Replay Validation Example:**
```typescript
if (existing.amount !== incoming.amount) {
  throw new Error("Idempotency-Key replay mismatch: amount differs");
}
```

**Why:** Replays with different data indicate either key reuse (client bug) or malicious activity. Both must be rejected.

---

### 6. Tenant Isolation (REQUIRED)

**Rule:** Every financial write MUST enforce tenant (company) scope at:
- Route level: `requireCompanyId()`
- Storage level: `enforceWriteCompanyScope(companyId, operationName)`
- Query level: `WHERE company_id = $companyId`

**Implementation:**
```typescript
// Route
const companyId = requireCompanyId();

// Storage
enforceWriteCompanyScope(companyId, "createPayment");

// Query
await tx.insert(payments).values({ companyId, ... });
await tx.select().from(payments).where(eq(payments.companyId, companyId));
```

**Why:** Multi-tenant systems MUST prevent cross-tenant data leakage. Financial data is especially sensitive.

---

### 7. Exactly-Once Side Effects (REQUIRED)

**Rule:** Workflows, notifications, exports, and other side effects MUST fire ONLY on first execution.

**Implementation:**
```typescript
const { entity, replayed } = await createPayment(...);

if (!replayed) {
  // Trigger workflows only on first execution
  await startWorkflowInstance({
    triggerEventType: "payment_created",
    ...
  });
}

// Return status: 201 for new, 200 for replay
res.status(replayed ? 200 : 201).json(entity);
```

**Why:** Duplicate workflow executions cause duplicate emails, duplicate accounting entries, and incorrect audit trails.

---

### 8. Real-Auth E2E Testing (REQUIRED)

**Rule:** Every financial write operation MUST have an E2E test that:
- Creates real user + company + userCompanyAccess rows
- Issues a valid JWT with proper claims
- Makes concurrent requests with the same Idempotency-Key
- Asserts exactly one entity created
- Asserts exactly one tracking row exists
- Asserts workflows fire exactly once
- Uses full middleware chain (no mocks except Redis/jobs)

**Example Test Structure:**
```typescript
it("concurrent replay: one write, consistent responses, workflow fires once", async () => {
  // Setup: Create user, company, userCompanyAccess
  const token = jwt.sign({ id: userId, currentCompanyId: companyId, ... });
  
  // Execute: Concurrent requests with same Idempotency-Key
  const [a, b] = await Promise.all([
    request(app).post("/api/payments").set("Idempotency-Key", key).send(data),
    request(app).post("/api/payments").set("Idempotency-Key", key).send(data),
  ]);
  
  // Assert: One 201, one 200
  expect([a.status, b.status].sort()).toEqual([200, 201]);
  
  // Assert: Exactly one entity
  const entities = await db.select().from(payments).where(...);
  expect(entities.length).toBe(1);
});
```

**Why:** Unit tests cannot prove concurrency safety. Only real database transactions under concurrent load prove exactly-once semantics.

---

## Canonical Implementation Pattern

### Using the Shared Helper (RECOMMENDED)

```typescript
import { withIdempotentWrite } from "./resilience/idempotent-write";

async function createPayment(payment: InsertPayment, idempotencyKey: string) {
  const companyId = payment.companyId;
  
  const result = await withIdempotentWrite<Payment>({
    companyId,
    operationName: "createPayment",
    idempotencyKey,
    entityId: payment.invoiceId,
    
    checkExisting: async (tx) => {
      const deterministicId = deterministicUuidV4(`company:${companyId}:op:createPayment:key:${idempotencyKey.trim()}`);
      const [existing] = await tx.select().from(payments)
        .where(and(eq(payments.id, deterministicId), eq(payments.companyId, companyId)))
        .limit(1);
      return existing || null;
    },
    
    executeWrite: async (tx) => {
      const deterministicId = deterministicUuidV4(`company:${companyId}:op:createPayment:key:${idempotencyKey.trim()}`);
      const [payment] = await tx.insert(payments)
        .values({ ...paymentData, id: deterministicId })
        .returning();
      
      // Update related entities atomically
      await tx.update(invoices).set({ amountPaid: sql`${invoices.amountPaid} + ${payment.amount}` })
        .where(eq(invoices.id, payment.invoiceId));
      
      return payment;
    },
    
    insertTracking: async (tx, deterministicId) => {
      // Insert tracking row if using separate tracking table
      await tx.insert(paymentExecutions).values({ id: deterministicId, ... })
        .onConflictDoNothing();
    },
    
    validateReplay: (existing) => {
      if (existing.amount !== paymentData.amount) {
        throw new Error("Replay mismatch: amount differs");
      }
    },
  });
  
  return { payment: result.entity, replayed: result.replayed };
}
```

---

## Proven Examples

### Phase 3.3: Payment Posting
- **File:** `server/storage.ts` → `createPayment()`
- **Deterministic UUID:** `company:${companyId}:op:createPayment:key:${key}`
- **Tracking:** Payment row itself (deterministic ID as primary key)
- **Side Effects:** Invoice `amountPaid` update (atomic)
- **Test:** `server/observability/__tests__/payment-idempotency.e2e.test.ts`

### Phase 3.4.1: Invoice Creation
- **File:** `server/storage.ts` → `createInvoice()`
- **Deterministic UUID:** `company:${companyId}:op:createInvoice:key:${key}`
- **Tracking:** Invoice row + invoice items (atomic transaction)
- **Side Effects:** Workflow trigger on `!replayed`
- **Test:** `server/observability/__tests__/invoice-idempotency.e2e.test.ts`

### Phase 3.4.2: Invoice Finalization
- **File:** `server/storage.ts` → `finalizeInvoice()`
- **Deterministic UUID:** `company:${companyId}:op:finalizeInvoice:key:${key}`
- **Tracking:** `invoice_finalizations` table
- **Side Effects:** Status transition + workflow trigger
- **Test:** `server/observability/__tests__/invoice-finalization-idempotency.e2e.test.ts`

### Phase 3.4.3: Payroll Execution
- **File:** `server/storage.ts` → `executePayrollRun()`
- **Deterministic UUID:** `company:${companyId}:op:executePayroll:key:${key}`
- **Tracking:** `payroll_executions` table
- **Side Effects:** Payroll status transition + workflow trigger
- **Test:** `server/observability/__tests__/payroll-execution-idempotency.e2e.test.ts`

### Phase 3.4.4: Ledger Reconciliation
- **File:** `server/storage.ts` → `reconcileLedger()`
- **Deterministic UUID:** `company:${companyId}:op:reconcileLedger:key:${key}`
- **Tracking:** `ledger_reconciliations` table
- **Side Effects:** Bank transaction reconciliation + workflow trigger
- **Test:** `server/observability/__tests__/reconciliation-idempotency.e2e.test.ts`

---

## Checklist for Adding New Financial Endpoints

Before merging any PR that adds a financial write operation, verify:

- [ ] Route requires `Idempotency-Key` header
- [ ] Deterministic UUID follows format: `company:${companyId}:op:${operationName}:key:${key}`
- [ ] Database enforces uniqueness (primary key or unique index)
- [ ] All mutations wrapped in single `db.transaction()`
- [ ] Replay detection implemented with validation
- [ ] Tenant isolation enforced at route, storage, and query levels
- [ ] Side effects conditional on `!replayed`
- [ ] E2E test with real auth context exists
- [ ] E2E test proves concurrent requests → exactly one write
- [ ] E2E test proves workflows fire exactly once
- [ ] Code review confirms contract compliance

---

## Enforcement Mechanisms

### 1. Shared Helper (`withIdempotentWrite`)
- **Location:** `server/resilience/idempotent-write.ts`
- **Purpose:** Encapsulates the entire pattern, making it hard to deviate
- **Usage:** RECOMMENDED for all new financial writes

### 2. Test Helper (`assertIdempotentWriteContract`)
- **Location:** `server/observability/__tests__/helpers/assert-idempotent-contract.ts`
- **Purpose:** Fails tests if contract violated
- **Usage:** Include in all financial write E2E tests

### 3. Code Review Checklist
- **Location:** `.github/PULL_REQUEST_TEMPLATE.md`
- **Purpose:** Human verification before merge
- **Usage:** Required for all financial write PRs

---

## Consequences of Violation

Violating this contract will result in:

1. **Data Corruption:** Duplicate payments, incorrect balances, lost transactions
2. **Financial Loss:** Double-charging customers, incorrect payroll, audit failures
3. **Compliance Risk:** SOC 2, GDPR, financial regulations require exactly-once semantics
4. **Customer Trust:** Duplicate charges destroy user confidence
5. **Support Burden:** Manual reconciliation is expensive and error-prone

**This contract exists to prevent these outcomes. It is not optional.**

---

## Version History

- **v1.0 (2026-01-30):** Initial contract formalization based on Phases 3.3–3.4.4

---

## References

- Deterministic UUID Implementation: `server/utils/deterministic-uuid.ts`
- Shared Idempotent Write Helper: `server/resilience/idempotent-write.ts`
- Tenant Scope Enforcement: `server/middleware/tenant-scope.ts`
- E2E Test Examples: `server/observability/__tests__/*-idempotency.e2e.test.ts`

---

**This document is the law. Follow it.**
