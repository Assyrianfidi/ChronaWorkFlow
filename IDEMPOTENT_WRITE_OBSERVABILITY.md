# Idempotent Write Observability & Operations Guide

**Version:** 1.0  
**Last Updated:** 2026-01-30  
**Status:** Production

---

## Purpose

This document provides operational guidance for monitoring, debugging, and maintaining the idempotent write system in AccuBooks (ChronaWorkflow).

All financial and high-risk write operations are instrumented with comprehensive telemetry, logging, and metrics to ensure:
- **Exactly-once execution** is maintained
- **Replays are detected and handled correctly**
- **Failures are caught and alerted**
- **Compliance audits can be performed**
- **Performance is monitored**

---

## Architecture Overview

### Components

1. **Idempotent Write Monitor** (`server/observability/idempotent-write-monitor.ts`)
   - Centralized telemetry collection
   - Metrics recording (Prometheus-compatible)
   - Audit trail persistence
   - Alert triggering

2. **Audit Log Table** (`idempotent_write_audit_log`)
   - Append-only storage for all idempotent operations
   - Queryable for compliance and debugging
   - Indexed by company, operation, timestamp

3. **Metrics System** (Prometheus/Grafana)
   - Real-time counters and histograms
   - Dashboards for operations, replays, failures
   - Alerting rules for anomalies

4. **Structured Logging** (JSON format)
   - All operations logged with full context
   - Searchable via log aggregation tools
   - Includes request metadata, execution details, outcomes

---

## Monitored Operations

### Financial Mutations (5 operations)
1. **createPayment** - Record payment against invoice
2. **createInvoice** - Create invoice with line items
3. **finalizeInvoice** - Transition invoice to final status
4. **executePayroll** - Execute payroll run
5. **reconcileLedger** - Mark bank transaction as reconciled

### High-Risk Mutations (6 operations)
1. **adjustInventory** - Adjust inventory quantity
2. **createCustomer** - Create customer record
3. **createEmployee** - Create employee record
4. **triggerWorkflow** - Manually trigger workflow
5. **updateCompanySettings** - Update company settings
6. **grantUserAccess** - Grant user access to company

**Total:** 11 monitored operations

---

## Telemetry Data Collected

For every idempotent write operation, the following data is collected:

### Operation Identification
- `operationName` - Name of the operation (e.g., "createPayment")
- `operationType` - "financial" or "high-risk"
- `deterministicId` - Deterministic UUID for the operation

### Tenant Context
- `companyId` - Company/tenant ID
- `userId` - User who initiated the operation

### Execution Details
- `status` - "new", "replayed", or "failed"
- `executionDurationMs` - Time taken to execute (milliseconds)
- `timestamp` - When the operation occurred

### Request Metadata
- `requestId` - Unique request identifier
- `idempotencyKey` - Idempotency key from header
- `routePath` - API route path
- `httpMethod` - HTTP method (POST, PUT, PATCH)

### Outcome
- `workflowsTriggered` - Number of workflows triggered
- `sideEffectsExecuted` - Whether side effects were executed
- `errorMessage` - Error message if failed
- `metadata` - Additional context (JSON)

---

## Tracing an Idempotent Operation

### End-to-End Flow

```
1. Client Request
   ↓
2. Route Handler (registerFinancialRoute / registerHighRiskRoute)
   ↓ [Idempotency-Key validation]
3. Storage Layer (withIdempotentWrite)
   ↓ [Deterministic UUID generation]
4. Database Transaction
   ↓ [Insert/Update with uniqueness check]
5. Monitoring (monitorIdempotentWrite)
   ↓ [Telemetry collection]
6. Audit Log Persistence
   ↓ [Append-only storage]
7. Metrics Recording
   ↓ [Prometheus counters/histograms]
8. Workflow Triggers (if !replayed)
   ↓
9. Response to Client (201 or 200)
```

### Example: Tracing a Payment

**Step 1: Find the request in logs**
```bash
# Search for payment by idempotency key
grep "idempotency-key-abc123" /var/log/accubooks/app.log

# Or search by deterministic ID
grep "company:comp-123:op:createPayment:key:idempotency-key-abc123" /var/log/accubooks/app.log
```

**Step 2: Check audit log table**
```sql
SELECT *
FROM idempotent_write_audit_log
WHERE operation_name = 'createPayment'
  AND idempotency_key = 'idempotency-key-abc123'
  AND company_id = 'comp-123'
ORDER BY timestamp DESC;
```

**Step 3: Verify in payments table**
```sql
SELECT *
FROM payments
WHERE id = 'company:comp-123:op:createPayment:key:idempotency-key-abc123';
```

**Step 4: Check workflow triggers**
```sql
SELECT *
FROM workflow_instances
WHERE trigger_entity_type = 'payment'
  AND trigger_entity_id = 'company:comp-123:op:createPayment:key:idempotency-key-abc123';
```

---

## Querying Replayed vs New Operations

### Find All Replays for a Company
```sql
SELECT 
  operation_name,
  COUNT(*) as replay_count,
  AVG(execution_duration_ms) as avg_duration_ms
FROM idempotent_write_audit_log
WHERE company_id = 'comp-123'
  AND status = 'replayed'
  AND timestamp >= NOW() - INTERVAL '7 days'
GROUP BY operation_name
ORDER BY replay_count DESC;
```

### Find High Replay Rate Operations
```sql
WITH stats AS (
  SELECT 
    operation_name,
    COUNT(*) FILTER (WHERE status = 'new') as new_count,
    COUNT(*) FILTER (WHERE status = 'replayed') as replay_count,
    COUNT(*) as total_count
  FROM idempotent_write_audit_log
  WHERE timestamp >= NOW() - INTERVAL '24 hours'
  GROUP BY operation_name
)
SELECT 
  operation_name,
  new_count,
  replay_count,
  total_count,
  ROUND(100.0 * replay_count / NULLIF(total_count, 0), 2) as replay_rate_pct
FROM stats
WHERE replay_count > 0
ORDER BY replay_rate_pct DESC;
```

### Find Failed Operations
```sql
SELECT 
  operation_name,
  company_id,
  error_message,
  timestamp,
  idempotency_key
FROM idempotent_write_audit_log
WHERE status = 'failed'
  AND timestamp >= NOW() - INTERVAL '1 hour'
ORDER BY timestamp DESC;
```

### Find Slow Operations
```sql
SELECT 
  operation_name,
  operation_type,
  execution_duration_ms,
  company_id,
  timestamp
FROM idempotent_write_audit_log
WHERE execution_duration_ms > 5000  -- More than 5 seconds
  AND timestamp >= NOW() - INTERVAL '24 hours'
ORDER BY execution_duration_ms DESC
LIMIT 50;
```

---

## Metrics & Dashboards

### Prometheus Metrics

All metrics are exposed at `/metrics` endpoint in Prometheus text format.

#### Counters

**`idempotent_writes_total{operation, type, status}`**
- Total number of idempotent write operations
- Labels:
  - `operation`: Operation name (e.g., "createPayment")
  - `type`: "financial" or "high-risk"
  - `status`: "new", "replayed", or "failed"

**`idempotent_writes_replayed_total{operation, type}`**
- Total number of replayed operations
- Labels:
  - `operation`: Operation name
  - `type`: "financial" or "high-risk"

**`idempotent_writes_failed_total{operation, type}`**
- Total number of failed operations
- Labels:
  - `operation`: Operation name
  - `type`: "financial" or "high-risk"

**`idempotent_writes_workflows_triggered_total{operation, type}`**
- Total number of workflow triggers
- Labels:
  - `operation`: Operation name
  - `type`: "financial" or "high-risk"

#### Histograms

**`idempotent_write_duration_ms{operation, type}`**
- Execution duration in milliseconds
- Labels:
  - `operation`: Operation name
  - `type`: "financial" or "high-risk"

### Grafana Dashboard Queries

**Operations per Minute**
```promql
rate(idempotent_writes_total[5m]) * 60
```

**Replay Rate**
```promql
rate(idempotent_writes_replayed_total[5m]) 
/ 
rate(idempotent_writes_total[5m])
```

**Failure Rate**
```promql
rate(idempotent_writes_failed_total[5m]) 
/ 
rate(idempotent_writes_total[5m])
```

**P95 Execution Duration**
```promql
histogram_quantile(0.95, rate(idempotent_write_duration_ms_bucket[5m]))
```

**Workflows Triggered per Minute**
```promql
rate(idempotent_writes_workflows_triggered_total[5m]) * 60
```

---

## Alerting Rules

### High Replay Rate Alert
```yaml
- alert: HighIdempotentWriteReplayRate
  expr: |
    (
      rate(idempotent_writes_replayed_total[5m]) 
      / 
      rate(idempotent_writes_total[5m])
    ) > 0.5
  for: 10m
  labels:
    severity: warning
  annotations:
    summary: "High replay rate for {{ $labels.operation }}"
    description: "Replay rate is {{ $value | humanizePercentage }} for operation {{ $labels.operation }}"
```

### High Failure Rate Alert
```yaml
- alert: HighIdempotentWriteFailureRate
  expr: |
    (
      rate(idempotent_writes_failed_total[5m]) 
      / 
      rate(idempotent_writes_total[5m])
    ) > 0.1
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "High failure rate for {{ $labels.operation }}"
    description: "Failure rate is {{ $value | humanizePercentage }} for operation {{ $labels.operation }}"
```

### Slow Execution Alert
```yaml
- alert: SlowIdempotentWriteExecution
  expr: |
    histogram_quantile(0.95, rate(idempotent_write_duration_ms_bucket[5m])) > 5000
  for: 10m
  labels:
    severity: warning
  annotations:
    summary: "Slow execution for {{ $labels.operation }}"
    description: "P95 duration is {{ $value }}ms for operation {{ $labels.operation }}"
```

### Idempotency Key Collision Alert
```yaml
- alert: IdempotencyKeyCollision
  expr: |
    increase(idempotent_writes_failed_total{error_type="mismatch"}[5m]) > 0
  labels:
    severity: critical
  annotations:
    summary: "Idempotency key collision detected"
    description: "Operation {{ $labels.operation }} has idempotency key mismatches"
```

---

## Incident Response Procedures

### Scenario 1: High Replay Rate

**Symptoms:**
- Replay rate > 50% for an operation
- Alert: `HighIdempotentWriteReplayRate`

**Investigation:**
1. Check if clients are retrying excessively
2. Look for network issues or timeouts
3. Verify client-side idempotency key generation

**Resolution:**
- If client bug: Fix client retry logic
- If network issue: Investigate infrastructure
- If legitimate retries: No action needed (system working as designed)

### Scenario 2: High Failure Rate

**Symptoms:**
- Failure rate > 10% for an operation
- Alert: `HighIdempotentWriteFailureRate`

**Investigation:**
1. Query audit log for error messages
2. Check database connectivity
3. Verify tenant scope enforcement
4. Look for data validation errors

**Resolution:**
- If DB issue: Investigate database health
- If validation error: Fix client data
- If bug: Deploy hotfix

### Scenario 3: Idempotency Key Collision

**Symptoms:**
- Replay mismatch errors
- Alert: `IdempotencyKeyCollision`

**Investigation:**
1. Find colliding requests in audit log
2. Compare request payloads
3. Identify if client is reusing keys incorrectly

**Resolution:**
- Contact client to fix key generation
- Document proper idempotency key usage
- Consider adding key expiration

### Scenario 4: Slow Execution

**Symptoms:**
- P95 duration > 5 seconds
- Alert: `SlowIdempotentWriteExecution`

**Investigation:**
1. Check database query performance
2. Look for lock contention
3. Verify workflow trigger performance

**Resolution:**
- Optimize slow queries
- Add database indexes
- Scale database resources

---

## Compliance & Audit

### Retention Policy

Audit logs are retained for:
- **90 days** in hot storage (queryable)
- **7 years** in cold storage (compliance archive)

### Audit Trail Queries

**All operations for a company (compliance report)**
```sql
SELECT 
  operation_name,
  operation_type,
  status,
  timestamp,
  user_id,
  idempotency_key,
  workflows_triggered,
  side_effects_executed
FROM idempotent_write_audit_log
WHERE company_id = 'comp-123'
  AND timestamp BETWEEN '2026-01-01' AND '2026-12-31'
ORDER BY timestamp;
```

**Verify exactly-once execution**
```sql
-- Should return 0 rows (no duplicates)
SELECT 
  deterministic_id,
  COUNT(*) as execution_count
FROM idempotent_write_audit_log
WHERE status = 'new'
  AND timestamp >= NOW() - INTERVAL '30 days'
GROUP BY deterministic_id
HAVING COUNT(*) > 1;
```

---

## Performance Considerations

### Monitoring Overhead

- **Logging:** ~1-2ms per operation (async, non-blocking)
- **Metrics:** <1ms per operation (in-memory counters)
- **Audit persistence:** ~5-10ms per operation (async, batched)

**Total overhead:** ~10-15ms per operation (acceptable for financial operations)

### Optimization Tips

1. **Batch audit log writes** - Buffer and write in batches
2. **Async persistence** - Never block the main operation
3. **Index audit log table** - On `company_id`, `operation_name`, `timestamp`
4. **Partition audit log** - By month for better query performance
5. **Archive old logs** - Move to cold storage after 90 days

---

## Developer Checklist

When adding a new idempotent operation:

- [ ] Register in `FINANCIAL_MUTATIONS` or `HIGH_RISK_MUTATIONS`
- [ ] Use `registerFinancialRoute` or `registerHighRiskRoute`
- [ ] Implement with `withIdempotentWrite`
- [ ] **Verify telemetry is emitted** (check logs/metrics)
- [ ] Add E2E test with real auth context
- [ ] Update this documentation with new operation
- [ ] Verify CI passes (telemetry coverage check)

---

## References

- Financial Write-Path Contract: `FINANCIAL_WRITE_PATH_CONTRACT.md`
- Financial Mutation Registry: `server/resilience/financial-mutation-registry.ts`
- High-Risk Mutation Registry: `server/resilience/high-risk-mutation-registry.ts`
- Idempotent Write Helper: `server/resilience/idempotent-write.ts`
- Monitoring System: `server/observability/idempotent-write-monitor.ts`
- Audit Log Schema: `shared/schema.ts` (idempotentWriteAuditLog)

---

**This document is maintained by the Platform Engineering team. For questions or updates, contact ops@accubooks.com**
