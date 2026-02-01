# Regression Lock — Invariants & Guarantees (Developer Snapshot)

This document is a **snapshot** of the backend’s enforced invariants and fail-closed guarantees. It is intended to match the current code behavior.

## CI / Regression Gates (Mandatory)

- **Type checks must pass**: `npm run verify:types`
- **Backend tests must pass**: `npm run test:backend`
- Workflows that run on pull requests must include these gates and must fail when either gate fails.

## Runtime Invariants (Dev/Test Only)

The following invariants are asserted only when `NODE_ENV !== 'production'`.

### Idempotency lifecycle

- **Idempotency keys must be non-empty strings**.
- Allowed lifecycle progression:
  - `PENDING -> IN_PROGRESS -> COMPLETED` OR
  - `PENDING -> IN_PROGRESS -> FAILED`
- Concurrency is expected:
  - Multiple callers may race; the system must still enforce exactly-once semantics.

### Tenant isolation

- Tenant context must be internally consistent:
  - `tenantContext.tenantId === tenantContext.tenant.id`
  - `tenantContext.permissions` must be an array
  - Role flags match role values:
    - `isOwner` ↔ `userRole === OWNER`
    - `isAdmin` ↔ `userRole === ADMIN`
    - `isManager` ↔ `userRole === MANAGER`

### RBAC assumptions

- Authorization decisions require a tenant context and a user identifier.
- Role permissions must resolve to valid permission strings.

## Fail-Closed Guarantees (Security-Critical)

### Authentication

- Missing/invalid authentication must deny access.

### Authorization (RBAC)

- Authorization failures must deny access.
- Authorization errors (engine/guard exceptions) must fail closed and return an error response (no silent allow).

### Idempotency

- When tenant context is required but missing, the middleware must deny (401).
- When idempotency check fails unexpectedly, the middleware must fail closed (500).

### Rate limiting

- When the rate-limit backend fails (cache error), requests must not be silently allowed.

## Privileged / Irreversible Operations — Immutability

For operations wrapped with strict idempotency controls:
- **Exactly-once** execution is enforced under retries.
- Under concurrency, duplicate requests must not cause double execution.
- Under failure, repeated attempts return the same failure result without re-executing the privileged action.

## Notes

- This document is descriptive, not aspirational. If behavior changes, update this snapshot accordingly.
