# Performance and Capacity (STEP 12)

## Goals

- Prevent overload before outages.
- Enforce tenant-fair capacity usage.
- Apply backpressure instead of cascading failures.
- Make performance regressions CI-blocking.
- Keep behavior deterministic in CI (`DETERMINISTIC_TEST_IDS=true`).

## Architecture overview

STEP 12 introduces an explicit **admission control plane** for request load-safety:

- `server/performance/capacity-config.ts`
  - Central capacity definitions (global + per-tenant concurrency, queues, timeouts)
  - Environment-aware defaults (prod/staging/dev/CI)

- `server/performance/request-priority.ts`
  - Pure request priority classification
  - Priority classes: `CRITICAL | HIGH | NORMAL | LOW | BACKGROUND`

- `server/performance/concurrency-limiter.ts`
  - Global + per-tenant concurrency caps
  - FIFO queue with max depth + acquire timeouts
  - Hard fail-closed bounds
  - Immutable audit events emitted on saturation

- `server/performance/load-shedder.ts`
  - Load shedding decisions based on:
    - readiness status
    - degradation modes
    - SLO health status (provided by caller)
    - tenant priority tier
  - Immutable audit event on every shed decision

- `server/performance/admission-controller.ts`
  - Central gate for requests, ordered evaluation:
    1) readiness
    2) kill switch
    3) concurrency
    4) load shedding
    5) rate limiting
  - Deterministic correlation IDs in CI
  - Immutable audit event for every rejection

## Capacity philosophy

- **Fail closed** by default:
  - Missing tenant context rejects non-critical traffic.
  - Unhealthy dependencies trigger readiness rejection.
  - Rate limiter errors reject non-critical traffic.

- **Tenant fairness**:
  - Each tenant has a capped concurrency slice.
  - Higher tiers can receive larger slices via tier multipliers.

- **Backpressure first**:
  - `DEFER` is used to signal temporary overload and encourage retry.

## Load shedding strategy

- Not-ready: allow only `CRITICAL`.
- Emergency degradation: allow `CRITICAL` and some `HIGH` for prioritized tiers.
- SLO FAIL: reject non-critical first.

## How STEP 12 interacts with STEP 11

- STEP 11 provides:
  - readiness gates
  - kill switches
  - degradation modes
  - deterministic CI behavior
  - immutable audit logging

- STEP 12 composes them into a single admission decision.

## Operational playbook under load

- If overload observed:
  - Enable `GLOBAL_WRITE` kill switch to reduce write load.
  - Verify readiness gates and dependency health.
  - Move system into degradation mode if needed.

- If a single tenant dominates:
  - Tenant concurrency caps enforce fairness.

## CI enforcement

- Tests: `server/performance/__tests__/performance-safety.test.ts`
- Gate: `scripts/ci-performance-validation.sh`
- Wired into `scripts/ci-production-validation.sh` as a CI-blocking step.
