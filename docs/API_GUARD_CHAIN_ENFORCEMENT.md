# /api Route Coverage & Guard-Chain Enforcement (Phase 2)

## Canonical API Entry

- The canonical server entrypoint is `server/index.ts`.
- The Express application instance is constructed by `createApp()` in `server/app.ts`.
- All API routes are registered via `registerAllRoutes(app)`.

## Where /api Is Mounted

- `/api` is mounted exactly once in `server/app.ts` using:
  - `app.use("/api", authenticate(), enforceCompanyIsolation(), authorizeRequest(), enforceBillingStatus(), enforcePlanLimits())`

## Why Only One Mount Is Allowed

- A second `/api` mount point creates an alternate path for requests to reach `/api/*` handlers with a different (or missing) middleware chain.
- CI enforces a single mount to prevent bypass paths and middleware-order drift.

## Guard-Chain Contract

### Middleware Order

All `/api/*` requests execute the following middleware chain in this exact order:

1. `authenticate()`
2. `enforceCompanyIsolation()`
3. `authorizeRequest()`
4. `enforceBillingStatus()`
5. `enforcePlanLimits()`

### Fail-Closed Semantics

- Requests to `/api/*` without valid authentication context are rejected.
- Requests to `/api/*` that do not map to an authorized action are rejected.
- Billing/plan enforcement rejects write operations when enforcement rules deny the request.

## Tenant & Billing Guarantees

### Company Isolation Rules

- `enforceCompanyIsolation()` runs for `/api/*` requests and blocks cross-tenant access.
- OWNER bypass is privileged and recorded via audit logging.

### Billing/Plan Enforcement Scope

- `enforceBillingStatus()` and `enforcePlanLimits()` execute on `/api/*` requests.
- Public endpoints are explicitly allowlisted and remain reachable through the guard chain.

## Drift Prevention

### Runtime Invariant Test

- Test file: `server/observability/__tests__/api-guard-chain.test.ts`
- Enforced properties:
  - Enumerates `/api/*` routes at runtime for evidence.
  - Asserts exactly one guard-chain start.
  - Asserts no `/api` layers are mounted before the guard chain.
  - Asserts middleware order: `authenticate` → `enforceCompanyIsolation` → `authorizeRequest` → `enforceBillingStatus` → `enforcePlanLimits`.

### Static CI Invariant

- Script: `scripts/verify-runtime-invariants.mjs`
- Enforced properties:
  - Exactly one unconditional `/api` mount exists in `server/app.ts`.
  - The `/api` mount includes the required guard chain in the required order.
  - No `/api` routes or middleware are registered before the `/api` guard chain in `createApp()`.
  - No other `server/**/*.ts` file mounts `/api`.

### What Causes CI to Fail

CI fails if any of the following occur:

- A second `/api` mount is introduced.
- The `/api` mount is moved under conditional control flow.
- The guard-chain middleware list changes length.
- The guard-chain middleware order changes.
- Any `/api` route or middleware is registered before the guard chain.
