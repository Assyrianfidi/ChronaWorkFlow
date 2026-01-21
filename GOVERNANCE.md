# Governance (AccuBooks)

This repository enforces **immutable** quality, observability, and release governance.

The goal is that no future change can silently:
- Introduce skipped/focused tests
- Degrade performance or memory unnoticed
- Bypass observability
- Disable safety guards
- Drift CI from repo reality

## Non-bypassable gates (required)

These run in CI on `pull_request` and `push` (main/develop), and are treated as hard requirements:

- `npm run verify:workflow-scripts`
  - Ensures workflows only reference scripts that actually exist.
  - Ensures `.github/workflows/ci-cd.yml` contains the required governance gates.

- `npm run verify:env`
  - Blocks production relaxations (e.g. `ALLOW_DEV_RELAXATIONS=true`).
  - Ensures safe defaults exist for observability/perf thresholds.

- `npm run verify:observability-invariants`
  - Ensures request correlation and global client error capture cannot be removed without failing CI.

- `npm run verify:release-guard`
  - Blocks `describe/it/test.only`, `fdescribe/fit`, `describe/it/test.skip`, `xdescribe/xit`.

- `npm run verify:test-metrics`
  - Runs the **client Vitest project** once and checks runtime + memory regression.
  - Writes a snapshot to `governance/test-performance-snapshot.json`.

## Test performance baseline policy

`governance/test-performance-baseline.json` is a governed artifact.

- It is **never** created or overwritten implicitly.
- Updating the baseline requires explicit intent.

### Update procedure (explicit)

1. Run:

   `npm run relock:test-metrics-baseline`

2. Review the diff of `governance/test-performance-baseline.json`.

3. Commit with a message that explains why the baseline moved.

## How to evolve safely

- Add/rename npm scripts:
  - Update `package.json` first.
  - Then update workflows.
  - `verify:workflow-scripts` will fail CI on drift.

- Change observability:
  - Changes must preserve request IDs and global error capture.
  - If you intentionally change the mechanism, update `scripts/verify-observability-invariants.mjs` in the same PR.

- If a guard must change:
  - Change the guard and documentation in the same PR.
  - The system should still be deterministic and fail closed.
