# Chaos Scenarios & Failure Recovery Playbook

**Version:** 1.0  
**Last Updated:** 2026-01-30  
**Status:** Production

---

## Purpose

This document provides operational guidance for handling failure scenarios in the idempotent write system. It covers chaos testing scenarios, failure modes, recovery procedures, and mitigation strategies.

---

## Chaos Testing Scenarios

### Scenario 1: Database Transaction Rollback

**Description:** Database transaction fails mid-execution and rolls back.

**Simulation:**
```typescript
// Simulate DB rollback during payment creation
try {
  await db.transaction(async (tx) => {
    await tx.insert(payments).values({...});
    // Simulate error that triggers rollback
    throw new Error("Simulated DB error");
  });
} catch (error) {
  // Transaction automatically rolled back
}
```

**Expected Behavior:**
- ✅ No partial writes to database
- ✅ Deterministic UUID not consumed
- ✅ Client receives error response
- ✅ Retry with same idempotency key succeeds
- ✅ Audit log records failed attempt
- ✅ Metrics increment failure counter

**Validation:**
```sql
-- Verify no orphaned records
SELECT COUNT(*) FROM payments 
WHERE id = 'deterministic-uuid-here'; -- Should be 0

-- Verify audit log
SELECT * FROM idempotent_write_audit_log
WHERE deterministic_id = 'deterministic-uuid-here'
  AND status = 'failed';
```

**Recovery:**
- Client retries with same idempotency key
- System treats as new operation (no replay)
- Operation succeeds on retry

---

### Scenario 2: Workflow Trigger Failure

**Description:** Primary operation succeeds but workflow trigger fails.

**Simulation:**
```typescript
const { payment, replayed } = await storage.createPayment(...);

if (!replayed) {
  // Simulate workflow trigger failure
  throw new Error("Workflow service unavailable");
}
```

**Expected Behavior:**
- ✅ Payment is created (transaction committed)
- ✅ Workflow trigger failure does NOT rollback payment
- ✅ Error logged but payment persists
- ✅ Retry with same idempotency key returns existing payment (replay)
- ✅ Workflow NOT triggered on replay (side effects skipped)

**Validation:**
```sql
-- Payment should exist
SELECT * FROM payments WHERE id = 'deterministic-uuid-here';

-- Workflow may or may not exist (depending on failure timing)
SELECT * FROM workflow_instances 
WHERE trigger_entity_id = 'deterministic-uuid-here';
```

**Recovery:**
- Manual workflow trigger via admin UI
- OR automated retry job for failed workflows
- OR workflow reconciliation batch process

**Mitigation:**
- Implement workflow trigger retry queue
- Separate workflow failures from core operation
- Monitor workflow trigger failure rate

---

### Scenario 3: Network Timeout / Request Timeout

**Description:** Client request times out before receiving response.

**Simulation:**
```typescript
// Client side
const controller = new AbortController();
setTimeout(() => controller.abort(), 1000); // 1 second timeout

try {
  await fetch('/api/payments', {
    signal: controller.signal,
    headers: { 'Idempotency-Key': 'timeout-test-key' },
    body: JSON.stringify(paymentData),
  });
} catch (error) {
  // Timeout - client doesn't know if operation succeeded
}
```

**Expected Behavior:**
- ✅ Server continues processing after client timeout
- ✅ Operation completes successfully on server
- ✅ Client retries with same idempotency key
- ✅ Server returns existing result (replay)
- ✅ No duplicate payment created

**Validation:**
```sql
-- Exactly one payment should exist
SELECT COUNT(*) FROM payments 
WHERE idempotency_key = 'timeout-test-key'; -- Should be 1

-- Audit log shows new + replayed
SELECT status, COUNT(*) FROM idempotent_write_audit_log
WHERE idempotency_key = 'timeout-test-key'
GROUP BY status;
-- Expected: new=1, replayed=1+
```

**Recovery:**
- Client implements retry with exponential backoff
- Same idempotency key ensures safety
- Server returns 200 (replay) instead of 201 (new)

**Mitigation:**
- Increase client timeout for slow operations
- Optimize server-side performance
- Monitor P95/P99 latencies

---

### Scenario 4: Database Deadlock / Lock Contention

**Description:** Multiple concurrent requests cause database deadlock.

**Simulation:**
```typescript
// Simulate 100 concurrent requests with same idempotency key
const requests = Array.from({ length: 100 }, () =>
  fetch('/api/payments', {
    headers: { 'Idempotency-Key': 'deadlock-test-key' },
    body: JSON.stringify(paymentData),
  })
);

await Promise.all(requests);
```

**Expected Behavior:**
- ✅ Database detects deadlock and aborts one transaction
- ✅ Aborted transaction retries automatically (if configured)
- ✅ Eventually one request succeeds, others replay
- ✅ Exactly one payment created
- ✅ All clients receive valid response (201 or 200)

**Validation:**
```sql
-- Exactly one payment
SELECT COUNT(*) FROM payments 
WHERE idempotency_key = 'deadlock-test-key'; -- Should be 1

-- Check for deadlock errors in logs
SELECT * FROM idempotent_write_audit_log
WHERE idempotency_key = 'deadlock-test-key'
  AND error_message LIKE '%deadlock%';
```

**Recovery:**
- Database automatically retries deadlocked transaction
- Application-level retry if needed
- Deterministic UUID ensures no duplicates

**Mitigation:**
- Use row-level locking instead of table locks
- Optimize transaction duration (keep short)
- Add database connection pooling
- Scale database read replicas

---

### Scenario 5: Partial Workflow Execution

**Description:** Workflow starts but fails midway through execution.

**Simulation:**
```typescript
const { payment, replayed } = await storage.createPayment(...);

if (!replayed) {
  await startWorkflowInstance({
    triggerEventType: "payment_received",
    // Workflow executes but fails at step 3 of 5
  });
}
```

**Expected Behavior:**
- ✅ Payment created successfully
- ✅ Workflow instance created
- ✅ Workflow marked as failed
- ✅ Retry with same idempotency key does NOT restart workflow
- ✅ Workflow must be manually resumed or restarted

**Validation:**
```sql
-- Payment exists
SELECT * FROM payments WHERE id = 'deterministic-uuid-here';

-- Workflow exists but may be in failed state
SELECT * FROM workflow_instances 
WHERE trigger_entity_id = 'deterministic-uuid-here'
  AND status = 'failed';
```

**Recovery:**
- Workflow retry mechanism (if implemented)
- Manual workflow restart via admin UI
- Workflow compensation/rollback (if needed)

**Mitigation:**
- Implement workflow checkpointing
- Design workflows to be resumable
- Monitor workflow failure rates
- Implement workflow retry policies

---

### Scenario 6: Idempotency Key Collision (Replay Mismatch)

**Description:** Client reuses idempotency key with different data.

**Simulation:**
```typescript
// First request
await fetch('/api/payments', {
  headers: { 'Idempotency-Key': 'collision-key' },
  body: JSON.stringify({ amount: 100.00 }),
});

// Second request - SAME KEY, DIFFERENT DATA
await fetch('/api/payments', {
  headers: { 'Idempotency-Key': 'collision-key' },
  body: JSON.stringify({ amount: 200.00 }), // Different amount!
});
```

**Expected Behavior:**
- ✅ First request succeeds (201)
- ✅ Second request fails with 409 Conflict or 400 Bad Request
- ✅ Error message: "Idempotency-Key replay mismatch"
- ✅ No payment created for second request
- ✅ Audit log records mismatch error
- ✅ Alert triggered for collision

**Validation:**
```sql
-- Only one payment exists
SELECT COUNT(*) FROM payments 
WHERE idempotency_key = 'collision-key'; -- Should be 1

-- Audit log shows mismatch
SELECT * FROM idempotent_write_audit_log
WHERE idempotency_key = 'collision-key'
  AND error_message LIKE '%mismatch%';
```

**Recovery:**
- Client must use different idempotency key
- Investigate why client is reusing keys incorrectly
- Document proper idempotency key generation

**Mitigation:**
- Client-side key generation best practices
- Key expiration policy (optional)
- Monitor collision rate
- Alert on high collision rates

---

### Scenario 7: Multi-Tenant Request Storm

**Description:** Multiple tenants simultaneously issue high volumes of requests.

**Simulation:**
```typescript
const tenants = 100;
const requestsPerTenant = 50;

const allRequests = [];
for (let t = 0; t < tenants; t++) {
  for (let r = 0; r < requestsPerTenant; r++) {
    allRequests.push(
      fetch('/api/payments', {
        headers: { 
          'Authorization': `Bearer ${tenantTokens[t]}`,
          'Idempotency-Key': `tenant-${t}-req-${r}`,
        },
        body: JSON.stringify(paymentData),
      })
    );
  }
}

await Promise.all(allRequests);
```

**Expected Behavior:**
- ✅ All requests processed successfully
- ✅ Tenant isolation maintained
- ✅ No cross-tenant data leakage
- ✅ Each tenant's operations independent
- ✅ Database handles concurrent load
- ✅ Metrics track per-tenant activity

**Validation:**
```sql
-- Verify tenant isolation
SELECT company_id, COUNT(*) 
FROM payments 
GROUP BY company_id;

-- Verify no cross-tenant contamination
SELECT COUNT(*) FROM payments p1
JOIN payments p2 ON p1.id = p2.id
WHERE p1.company_id != p2.company_id; -- Should be 0
```

**Recovery:**
- System should handle automatically
- Scale database if needed
- Add rate limiting per tenant if needed

**Mitigation:**
- Database connection pooling
- Horizontal scaling (read replicas)
- Per-tenant rate limiting
- Load balancing
- Caching for read-heavy operations

---

### Scenario 8: Database Connection Pool Exhaustion

**Description:** All database connections in pool are in use.

**Simulation:**
```typescript
// Simulate long-running transactions that hold connections
const longRunningOps = Array.from({ length: 100 }, () =>
  db.transaction(async (tx) => {
    await tx.insert(payments).values({...});
    await new Promise(resolve => setTimeout(resolve, 10000)); // Hold for 10s
  })
);

// Try to execute new operation
await storage.createPayment(...); // Should queue or fail
```

**Expected Behavior:**
- ✅ New requests queue waiting for available connection
- ✅ OR requests fail with connection timeout error
- ✅ No data corruption
- ✅ Retry succeeds when connection available
- ✅ Metrics show connection pool saturation

**Validation:**
```typescript
// Monitor connection pool metrics
const poolStats = await db.getPoolStats();
console.log({
  total: poolStats.totalConnections,
  idle: poolStats.idleConnections,
  active: poolStats.activeConnections,
  waiting: poolStats.waitingRequests,
});
```

**Recovery:**
- Wait for connections to be released
- Retry failed requests
- Scale database connection pool

**Mitigation:**
- Increase connection pool size
- Optimize transaction duration
- Implement connection timeout
- Monitor pool utilization
- Add connection pool alerts

---

## Automated Recovery Strategies

### 1. Exponential Backoff Retry

```typescript
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error("Max retries exceeded");
}
```

### 2. Circuit Breaker Pattern

```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > 60000) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }
  
  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.failures >= 5) {
      this.state = 'open';
    }
  }
}
```

### 3. Workflow Reconciliation Job

```typescript
// Periodic job to reconcile failed workflows
async function reconcileFailedWorkflows() {
  const failedWorkflows = await db.select()
    .from(workflowInstances)
    .where(eq(workflowInstances.status, 'failed'))
    .where(gt(workflowInstances.createdAt, new Date(Date.now() - 86400000))); // Last 24 hours
  
  for (const workflow of failedWorkflows) {
    try {
      await retryWorkflow(workflow.id);
    } catch (error) {
      console.error(`Failed to retry workflow ${workflow.id}:`, error);
    }
  }
}
```

---

## Monitoring & Alerting

### Key Metrics to Monitor

1. **Failure Rate**
   - Alert if > 10% of operations fail
   - Track by operation type

2. **Replay Rate**
   - Alert if > 50% of operations are replays
   - May indicate client retry issues

3. **Execution Duration**
   - Alert if P95 > 5 seconds
   - May indicate performance degradation

4. **Connection Pool Utilization**
   - Alert if > 80% utilized
   - May indicate need to scale

5. **Workflow Failure Rate**
   - Alert if > 5% of workflows fail
   - May indicate integration issues

### Alert Response Procedures

**High Failure Rate Alert:**
1. Check database connectivity
2. Review recent deployments
3. Check error logs for patterns
4. Scale resources if needed

**High Replay Rate Alert:**
1. Check for client-side issues
2. Review network stability
3. Check for timeout configuration issues
4. Verify idempotency key generation

**Slow Execution Alert:**
1. Check database query performance
2. Review slow query logs
3. Check for lock contention
4. Optimize or add indexes

---

## Testing Checklist

Before deploying to production:

- [ ] Run stress tests (500+ concurrent requests per operation)
- [ ] Test database rollback scenarios
- [ ] Test workflow failure scenarios
- [ ] Test network timeout scenarios
- [ ] Test deadlock scenarios
- [ ] Test multi-tenant isolation
- [ ] Test connection pool exhaustion
- [ ] Verify all failures logged in audit trail
- [ ] Verify metrics accuracy under load
- [ ] Verify alerts trigger correctly

---

## References

- Idempotent Write Observability: `IDEMPOTENT_WRITE_OBSERVABILITY.md`
- Stress Tests: `server/observability/__tests__/stress-tests/idempotent-write-stress.test.ts`
- Monitoring System: `server/observability/idempotent-write-monitor.ts`
