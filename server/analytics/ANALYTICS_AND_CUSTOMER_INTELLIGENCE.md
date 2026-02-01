# STEP 8: Analytics & Customer Intelligence (AccuBooks-Chronawflow)

This document describes the STEP 8 analytics layer for AccuBooks-Chronawflow, including tenant-safe insights, recommendations, customer segmentation, and observability.

## Architecture Overview

STEP 8 adds a **tenant-isolated** intelligence layer on top of the analytics foundation:

- `analytics-engine.ts`
  - Core analytics primitives (queries, dashboards, metrics, alerts)
  - Provides tenant-scoped retrieval APIs used by Step 8 modules

- `insights-engine.ts`
  - Tenant-wide insights and user recommendations
  - Deterministic fallback rules today, ML placeholders for later

- `customer-segmentation.ts`
  - Deterministic tenant-isolated customer segmentation
  - Produces segments like high-value and at-risk

- `observability.ts`
  - Tenant-scoped event and latency tracking
  - Generates a read-only summary for reporting/auditing

## Multi-Tenant Isolation

All STEP 8 modules enforce tenant isolation in two layers:

1. **Runtime tenant context**
   - Uses `AsyncLocalStorage<TenantContext>` to store a request-scoped tenant context.
   - Exposes `runWithTenantContext(tenantContext, fn)` wrappers.

2. **Hard tenant checks**
   - Exported APIs reject any request where `tenantContext.tenantId !== requestedTenantId`.
   - Customer segmentation additionally enforces tenant isolation inside SQL by joining `companies` and filtering by `companies.tenant_id`.

### Expected calling pattern

All exported APIs are designed to be called *inside* a tenant context:

```ts
import { runWithTenantContext } from './insights-engine.js';

await runWithTenantContext(req.tenantContext, async () => {
  const insights = await getTenantInsights(req.tenantContext.tenantId);
  // ...
});
```

## RBAC Enforcement

STEP 8 uses existing RBAC components:

- `AuthorizationEngine`
- `ServiceAuthorizationGuard`

Default permission requirement (where applicable):
- `reports:read`

If the current tenant context does not include the required permission, operations fail with:
- `PERMISSION_DENIED`

## Immutable Audit Logging

Every STEP 8 module integrates immutable audit logging via:

- `getImmutableAuditLogger(prisma).logAuthorizationDecision(...)`

Each audited operation records:
- **who**: actor id
- **what**: operation name
- **when**: ISO timestamp
- **why**: intent string
- **requestId** / correlation id

### Cryptographic integrity placeholders

Audit events include a deterministic hash placeholder (sha256 hex) under `metadata.integrityHash`.

This is designed for later integration with an immutable audit chain / vault.

## Deterministic ML Placeholders

Until real ML models are integrated, STEP 8 uses deterministic rules to guarantee:

- Stable output for the same inputs
- Testability in CI
- No dependency on external model services

### Where to integrate ML later

- `insights-engine.ts`
  - Replace or augment deterministic outputs with `mlModel.predictTenantInsights(...)`
  - Replace or augment deterministic outputs with `mlModel.predictUserRecommendations(...)`

- `customer-segmentation.ts`
  - Replace deterministic heuristics with clustering or embeddings (future)

## Observability & Metrics

`observability.ts` maintains a tenant-scoped in-memory store:

- Events: `recordObservabilityEvent(type, metadata)`
- Latencies: `recordObservabilityLatency(operation, durationMs)`
- Summary: `getTenantObservabilitySummary(tenantId)`

The summary call is RBAC guarded (`reports:read`) and audit logged.

## Module Usage Examples

### Tenant insights

```ts
import {
  initializeInsightsEngine,
  runWithTenantContext,
  getTenantInsights
} from './insights-engine.js';

initializeInsightsEngine(prisma);

await runWithTenantContext(tenantContext, async () => {
  const insights = await getTenantInsights(tenantContext.tenantId);
  console.log(insights.kpis);
});
```

### User recommendations

```ts
import {
  initializeInsightsEngine,
  runWithTenantContext,
  getUserRecommendations
} from './insights-engine.js';

initializeInsightsEngine(prisma);

await runWithTenantContext(tenantContext, async () => {
  const recs = await getUserRecommendations('user_123');
  console.log(recs.recommendations);
});
```

### Customer segmentation

```ts
import {
  initializeCustomerSegmentationEngine,
  runWithTenantContext,
  getTenantCustomerSegmentation
} from './customer-segmentation.js';

initializeCustomerSegmentationEngine(prisma);

await runWithTenantContext(tenantContext, async () => {
  const report = await getTenantCustomerSegmentation(tenantContext.tenantId);
  console.log(report.counts);
});
```

### Observability events + summary

```ts
import {
  initializeAnalyticsObservability,
  runWithTenantContext,
  recordObservabilityEvent,
  recordObservabilityLatency,
  getTenantObservabilitySummary
} from './observability.js';

initializeAnalyticsObservability(prisma);

await runWithTenantContext(tenantContext, async () => {
  recordObservabilityEvent('INSIGHTS_REQUESTED', { route: '/api/insights' });
  recordObservabilityLatency('getTenantInsights', 42);

  const summary = await getTenantObservabilitySummary(tenantContext.tenantId);
  console.log(summary.counters);
});
```

## CI Validation Process

### Files

- `server/analytics/analytics.test.ts`
  - Integration-style tests using **Vitest**
  - Verifies:
    - tenant isolation rejections
    - RBAC enforcement
    - audit log events contain `integrityHash`

- `server/analytics/ci-analytics-validation.sh`
  - Runs the STEP 8 server test suite and prints a summary

### Recommended CI step

```bash
bash server/analytics/ci-analytics-validation.sh
```

## Notes / Security Considerations

- STEP 8 modules intentionally return tenant-safe error codes (avoid leaking internal details).
- Cross-tenant requests are rejected explicitly.
- RBAC is enforced server-side only (deny-by-default).
- Audit logging is append-only and designed for immutable storage.
