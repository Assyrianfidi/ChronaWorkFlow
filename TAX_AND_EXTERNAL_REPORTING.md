# STEP 15: Tax, External Reporting, and Regulatory Interfaces

## 1) Core Philosophy

- All external reporting is **ledger-derived**.
- All outputs are **deterministic**, **replayable**, and include an **integrity hash**.
- No export operation may mutate accounting state.
- Period lifecycle guarantees are respected:
  - Exports are fail-closed when the period is not finalized.
  - Draft exports may be restricted on `HARD_LOCKED` periods.
- All sensitive external interactions are **immutable-audit-logged**.

## 2) Tax & Regulatory Export Engine

### Files

- `server/finance/tax/tax-schemas.ts`
- `server/finance/tax/tax-engine.ts`
- `server/finance/tax/tax-export.ts`

### Derivation model

- Tax summaries are derived from:
  - Trial balance (`buildTrialBalance`) and
  - Period lock state (`PeriodLocks`).

### Jurisdiction grouping

Tax jurisdictions are configured by mapping relevant accounts:

- tax payable accounts (e.g., sales tax payable)
- optional tax receivable accounts (e.g., VAT input tax)

The tax engine groups and summarizes deterministically by `jurisdictionId`.

### Period locking guarantees

By default, `TaxEngine.exportTaxSummary()` requires the accounting period to be:

- `SOFT_CLOSED` or
- `HARD_LOCKED`

This prevents exporting partial or in-flight data.

In addition, tax export requests must include an explicit `periodId` and the engine will **fail closed** if:

- no `periodId` is provided
- the provided `periodId` does not match the period resolved by `PeriodLocks` for the export cutoff date

### Determinism

The export result includes:

- `trialBalanceHash`
- `integrityHash`

Both are stable under replay.

## 3) Accountant & Auditor Access Modes

### Files

- `server/access/accountant-access.ts`
- `server/access/auditor-access.ts`

### Model

- Time-scoped, signed access tokens (`HS256`).
- Explicit scope is restricted to:
  - `REPORTS_READ`
  - `EXPORTS_READ`
- Tokens are intended to be used only with read-only reporting endpoints.

### Audit logging

The following are audit logged (immutable):

- Access grant
- Access revoke
- Report read / token verification

### Tenant isolation

Tokens embed the target `companyId` and time window (`from`, `to`).
Callers must enforce tenant isolation at the service boundary.

Token validity windows are encoded as:

- `validFrom`
- `validTo`

## 4) Standardized Export Formats

### Files

- `server/finance/exports/export-engine.ts`
- `server/finance/exports/formats/csv.ts`
- `server/finance/exports/formats/json.ts`
- `server/finance/exports/formats/pdf-metadata.ts` (metadata only)
- `server/finance/exports/formats/xbrl.ts` (deterministic placeholder)

### Rules

- Exports are derived from **finalized report envelopes**.
- Each export includes its own `integrityHash` and references the report `sourceIntegrityHash`.
- Draft exports can be fail-closed in `HARD_LOCKED` contexts.

## 5) Tax Period Finalization & Attestation

### Files

- `server/finance/tax/tax-attestation.ts`

### Attestation contents

A tax attestation references:

- Period ID
- Trial balance hash
- Financial statement hashes
- Tax export hash

Attestations are immutable objects with their own integrity hash.

### RBAC

- Requires permission: `finance:attest`

## 6) CI Enforcement

### Tests

- `server/finance/__tests__/tax-and-exports.test.ts`

Covers:

- Period lock enforcement for exports
- Deterministic hashes
- Tenant isolation
- Audit emission
- External access token scope + logging

### CI gate scripts

- `scripts/ci-tax-and-exports-validation.sh`
- `scripts/ci-tax-and-exports-validation.ps1`

Both write machine-readable JSON to:

- `reports/ci/tax-and-exports-tests.json`
- `reports/ci/tax-and-exports-gate.json`

### Production pipeline

`scripts/ci-production-validation.sh` includes the blocking gate:

- `tax-and-exports`
