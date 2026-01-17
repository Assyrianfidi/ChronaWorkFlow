# API Versioning

## Goals

- Make API contract evolution explicit and reviewable.
- Prevent accidental breaking changes from silently reaching clients.
- Keep versioning at the **contract level** (not routing).

## Version model

- The authoritative API version is defined in `shared/contracts.ts` as `ApiVersion`.
- The current version is exposed as `CURRENT_API_VERSION`.

## How version is carried

- Version is carried via the HTTP response header `x-api-version`.
- Existing contracts are considered **v1**.

## Non-breaking vs breaking changes

- **Non-breaking (allowed within v1)**
  - Adding new fields only if they are **optional**.
  - Widening unions (e.g. `"A" | "B"` -> `"A" | "B" | "C"`).

- **Breaking (must require v2)**
  - Removing fields.
  - Making optional fields required.
  - Narrowing types/unions.
  - Changing semantics of existing fields.

## Guardrails

- **Type-level**: `AssertBackwardCompatible<Prev, Next>` ensures `Next` is assignable to `Prev` (no narrowing/removals).
- **Runtime**:
  - Server tags responses with `x-api-version: CURRENT_API_VERSION`.
  - Client asserts the received header matches `CURRENT_API_VERSION` when present.

## Adding v2 safely (checklist)

- Add `v2` to `ApiVersion` and set up new schemas/types alongside v1.
- Ensure v1 schemas remain unchanged (except additive optional fields).
- Add explicit mapping/translation logic if server serves multiple versions.
- Update clients to explicitly consume v2 contracts.
