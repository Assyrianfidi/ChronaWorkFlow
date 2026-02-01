# Reliability and Resilience (STEP 11)

## Completion status

- **Abuse protection**: Implemented (`server/security/abuse-protection.ts`)
- **Idempotency engine**: Implemented (`server/reliability/idempotency-engine.ts`)
- **Ops control plane**: Implemented (`server/ops/*`)
- **CI reliability gate**: Implemented (`scripts/ci-reliability-validation.sh`) and wired into `scripts/ci-production-validation.sh`

## Design goals

- **Fail closed**: Deny/stop operations when uncertain.
- **Tenant-scoped by default**: All enforcement and audit events are scoped to tenant context when available.
- **RBAC-enforced control plane**: Ops entry points are gated through the central authorization engine.
- **Immutable audit**: All security-critical actions emit immutable audit events.
- **Deterministic CI behavior**: Deterministic correlation IDs where required by CI (`DETERMINISTIC_TEST_IDS=true`).

## Security & abuse protection

### Module

- `server/security/abuse-protection.ts`

### Behaviors

- Detects:
  - Auth spam
  - Request burst
  - Scraping/path probing
- Enforces tiers:
  - `NORMAL`
  - `WARN`
  - `THROTTLE` (rate-limited)
  - `BLOCK` (fail-closed)

### Audit

- Emits immutable audit events on:
  - Tier escalation
  - Enforcement decisions (block/throttle)
  - Expiration of blocks

## Idempotency

### Module

- `server/reliability/idempotency-engine.ts`

### Behaviors

- Provides tenant-scoped, exactly-once execution helpers for:
  - Billing operations
  - Webhook handlers
  - Mutating API operations

### Audit

- Emits immutable audit events on:
  - Duplicate suppression
  - Replay detection

## Ops control plane

### Modules

- `server/ops/rbac.ts`
  - `requireOpsPermission(prisma, ctx, permission)`
  - Uses `AuthorizationEngine` and immutable audit logging.

- `server/ops/health-checks.ts`
  - `getHealthSnapshot(prisma)`
  - DB ping + basic process health signals.

- `server/ops/readiness-gates.ts`
  - `runReadinessGates(prisma)`
  - Hard readiness gates:
    - DB connectivity
    - `GLOBAL_WRITE` kill switch not enabled

- `server/ops/kill-switch.ts`
  - In-memory kill switches for emergency shutdown of high-risk subsystems.
  - Environment override supported via `OPS_KILL_SWITCH`.

- `server/ops/backup-engine.ts`
  - Thin wrapper over `DatabaseBackupService.createBackup()` with immutable audit events.

- `server/ops/restore-validation.ts`
  - Safe validation-only checks that do not execute restore.
  - Validates backup file existence and checksum file format.

- `server/ops/slo-engine.ts`
  - Pure function evaluation for SLO windows.

- `server/ops/degradation-wrapper.ts`
  - Maps system degradation mode into ops-friendly levels.

- `server/ops/chaos-engine.ts`
  - CI-only chaos injection toggled with `CHAOS_ENABLED=true` (disabled in production).

## CI enforcement

### Reliability gate script

- `scripts/ci-reliability-validation.sh`

Runs:

- `npx vitest run --project server server/ops/__tests__/ops-control-plane.test.ts`

Emits machine-readable report:

- `reports/reliability-validation-report.json`

### Wired into production validation

- `scripts/ci-production-validation.sh`
  - Added gate: `reliability`

## Testing

- `server/ops/__tests__/ops-control-plane.test.ts`
  - Unit-level tests for:
    - SLO evaluation
    - kill switch toggling
    - readiness gating
    - health snapshot structure
    - restore validation

## Operational playbooks

### Kill switch usage

- Use `GLOBAL_WRITE` to block write operations during incidents.
- Use `BILLING` / `WEBHOOKS` / `BACKGROUND_JOBS` / `EXTERNAL_INTEGRATIONS` for targeted isolation.

### Degradation

- Treat `EMERGENCY` as hard-stop for non-essential operations.

## Known limitations / follow-ups

- `server/ops/kill-switch.ts` is currently in-memory.
  - In a multi-instance deployment, you likely want to persist kill switches in DB or a shared cache.
- `restore-validation.ts` intentionally avoids executing a restore.
  - True restore tests should be performed in isolated infra (not CI shared runners).
