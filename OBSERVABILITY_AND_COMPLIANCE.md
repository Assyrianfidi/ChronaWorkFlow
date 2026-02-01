# Observability & Compliance (STEP 16)

This document describes the STEP 16 implementation for AccuBooks:

- Observability core primitives (metrics + tracing + structured log context)
- Immutable audit retention eligibility computation (read-only)
- Compliance snapshot generation (read-only, integrity-hashed)
- Disaster recovery readiness validation (dry-run)
- CI enforcement gate

## Observability

### Modules

- `server/observability/observability-context.ts`
  - Defines `ObservabilityContext` with:
    - `correlationId`, `requestId`
    - `tenantId`, `actorId`
    - optional `admissionDecision`, `admissionReason`
  - Determinism:
    - When `DETERMINISTIC_TEST_IDS=true`, correlation IDs are stable (`${prefix}_${tenantId}_${requestId}`)

- `server/observability/metrics-engine.ts`
  - In-memory metrics backend used for CI validation and lightweight runtime instrumentation.
  - Exposes:
    - `increment()` counters
    - `setGauge()` gauges
    - `observe()` histograms (stored as a bounded list)
  - `snapshot()` emits:
    - raw counters
    - raw gauges
    - histogram derived samples (`*_p95`, `*_count`)

- `server/observability/tracing-engine.ts`
  - Minimal span store for request-level and internal operation tracing.
  - Ensures tenant + actor attributes are attached to spans.

- `server/observability/structured-logger.ts`
  - Thin wrapper over production `server/utils/structured-logger.ts`.
  - Guarantees that observability logs always include correlation + tenant context.

## Audit retention (read-only)

### `server/audit/audit-retention.ts`

- Computes retention eligibility only.
- Does not delete audit logs.
- Fail-safe behavior:
  - If legal hold status cannot be verified, treat as under legal hold (retain).

## Compliance evidence bundles

### `server/audit/audit-evidence.ts`

- Builds a deterministic evidence bundle containing:
  - trial balance integrity hash (`buildTrialBalance()`)
  - current accounting period lock state
  - admission decision context
  - retention evaluation summary
- Determinism:
  - uses a deterministic timestamp when `DETERMINISTIC_TEST_IDS=true`.

## Compliance snapshot

### `server/compliance/compliance-snapshot.ts`

Builds a read-only snapshot of:

- Environment and version metadata
- Permission registry counts (domains / permissions / roles)
- Capacity + load-shedding configuration (`getCapacityConfig()`)
- Kill switch state (`getKillSwitchState()`)
- Degradation level (`getCurrentDegradationLevel()`)
- Optional readiness gate status (`runReadinessGates()`)

The snapshot includes an `integrityHash` computed over a canonical JSON payload.

## Disaster recovery readiness (dry-run)

### `server/ops/disaster-recovery.ts`

- Validates backup artifacts without performing a restore:
  - delegates to `server/ops/restore-validation.ts` (file existence + checksum format)
- Optionally computes a trial balance integrity hash to provide an additional ledger consistency signal.
- Output includes an integrity hash for the full DR report.

## Tests

STEP 16 adds Vitest suites under the `server` project:

- `server/observability/__tests__/observability.test.ts`
- `server/audit/__tests__/audit-evidence.test.ts`
- `server/compliance/__tests__/compliance-snapshot.test.ts`
- `server/ops/__tests__/disaster-recovery.test.ts`

All tests enable deterministic mode and assert stable hashes.

## CI Gate

A new production validation gate is added:

- `scripts/ci-observability-and-compliance-validation.sh`
- `scripts/ci-observability-and-compliance-validation.ps1`

The gate is wired into:

- `scripts/ci-production-validation.sh` as `observability-and-compliance`

It produces a machine-readable JSON report:

- `reports/observability-and-compliance-validation-report.json`
