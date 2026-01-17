# Observability

## CI/CD enforcement

All CI paths must run, in order:

1. `npm ci`
2. `npm run verify:type-lock`
3. `npm run lint`
4. `npm run typecheck`

Tests and coverage must run after gates.

## Logging standards

- Use structured logging (JSON) for events.
- Never log secrets, tokens, payment identifiers, or PII.
- Include:
  - timestamp
  - component
  - environment (`NODE_ENV`)
  - API version when applicable

Implementation lives in `shared/logging.ts`:

- `logEvent(...)`
- `logError(...)`

## Metrics hooks

Lightweight in-memory hooks exist in `shared/logging.ts`:

- `recordRequest(key)`
- `recordError(key)`
- `getMetricsSnapshot()`

These are intentionally minimal scaffolding for future integration (Prometheus/StatsD/etc.).

## Server usage

Controllers may call:

- `recordRequest('controller.action')` at handler start
- `recordError('controller.action')` on catch/error paths

This must not change API routes, payload shapes, or behavior.

## How to extend safely

- Keep all cross-layer contracts in `shared/`.
- Add only additive observability (headers, logs, metrics) that does not affect business logic.
- Keep `npm run lint` and `npm run typecheck` green.
