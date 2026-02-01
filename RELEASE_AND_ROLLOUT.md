# STEP 9: Integration, Release Orchestration & Production Rollout

This document defines the STEP 9 delivery process for AccuBooks-Chronawflow.

## Goals

- Deterministic CI/CD gates that fail on:
  - test failures
  - type errors
  - lint violations
  - audit/observability invariant violations
- Multi-tenant enforcement at all layers
- Canary release support with automated rollback hooks
- Immutable audit trail for rollout actions (hash chained)

## CI/CD Pipeline

The repo already includes `.github/workflows/ci-cd.yml` with strong governance gates.

STEP 9 extends the pipeline with:

- A dedicated production validation script:
  - `scripts/ci-production-validation.sh`
- A release orchestration script:
  - `scripts/release-orchestration.sh`

The CI workflow runs `scripts/ci-production-validation.sh` in:

- The main `test` job (after backend tests)
- The `production-readiness` job (after `ci:production-check`)

### Required gates

- `npm run verify:workflow-scripts`
- `npm run verify:test-stubs-tracked`
- `npm run verify:artifact-denylist`
- `npm run verify:env`
- `npm run verify:type-lock`
- `npm run verify:observability-invariants`
- `npm run lint`
- `npm run typecheck`
- `npm run test:backend`
- `tests/integration/e2e-integration.test.ts`

## Release Orchestration

Use `scripts/release-orchestration.sh`.

### Commands

- `verify`
- `migrate`
- `build`
- `canary`
- `promote`
- `rollback`
- `full-release`

### Audit trail

The script writes JSONL entries to `release-audit.log.jsonl` (default), where each line includes:

- `prevHash`
- `hash`

This provides a deterministic integrity placeholder for later immutable storage.

## Production Rollout

### Kubernetes

Apply:

- `k8s/deployment.yaml`

This includes:

- readiness & liveness probes (`/health`)
- ConfigMap-based feature defaults
- Secret-based secret injection (mounted as files under `/secrets`)
- Hardened pod/container security context (non-root, seccomp, no privilege escalation)
- Non-default namespace (`accubooks-prod`)
- NetworkPolicy restricting ingress/egress

Important:

- The manifest uses an image digest placeholder: `accubooks/accubooks@sha256:__REPLACE_WITH_IMAGE_DIGEST__`
  Replace this with the actual digest for an immutable deployment.

### Docker Compose

For compose-based production, use the existing `docker-compose.prod.yml` or adapt `docker-compose.yml`.

The root `docker-compose.yml` is intentionally production-safe:

- No hardcoded passwords
- Requires explicit environment variables for secrets (`POSTGRES_PASSWORD`, `DATABASE_URL`, `JWT_SECRET`, `SESSION_SECRET`, etc.)

### Secrets

Use:

- `env.example`
- `secrets-template.json`

Inject secrets via:

- GitHub Actions secrets
- Kubernetes Secrets
- Vault / cloud secret managers

## Integration Verification

### What is verified

- Tenant context enforcement (`TENANT_CONTEXT_REQUIRED`)
- Cross-tenant rejection (`TENANT_ISOLATION_VIOLATION`)
- RBAC enforcement (`PERMISSION_DENIED`)
- Feature flag gating behavior
- Audit integrity placeholders (`metadata.integrityHash`)

### How to run

```bash
bash scripts/ci-production-validation.sh
```

This writes:

- `reports/production-validation-report.json`

## Production-Readiness Metrics

The validation report includes deterministic metrics:

- `tenantIsolation`: enforced by tests
- `rbac`: enforced by tests
- `featureFlags`: enforced by tests
- `immutableAudit`: integrity placeholders verified
- `determinism`: deterministic mocks/rules
- `rollback`: scripted placeholder ready
