# STEP 13: Financial Correctness, Ledger Integrity & Audit-Grade Money Safety

## Ledger Model

AccuBooks uses an append-only double-entry ledger.

- All monetary mutations are represented as ledger transactions.
- Each transaction posts one or more ledger lines.
- Ledger writes are append-only: no updates or deletes of posted entries.

## Hard Invariants

Every posted ledger transaction must satisfy:

- Sum(debits) == Sum(credits)
- Single-currency per transaction (no cross-currency lines)
- Tenant/company isolation (all lines match the transaction company)
- No negative balances unless explicitly allowed
- Idempotency at the ledger boundary (replays must match byte-for-byte semantics)

Any invariant violation fails closed.

## Idempotency Guarantees

Posting is idempotent by transaction identity and content:

- If a transaction with the same `transactionNumber` already exists, a replay is only accepted if the existing posted transaction matches the proposed lines and totals.
- If it differs, the request is rejected and audited.

## Replay & Reconciliation

- Replay deterministically reconstructs balances from ledger history.
- Reconciliation detects:
  - duplicate transaction numbers
  - partial writes (missing lines)
  - unbalanced posted transactions

Any drift triggers a fail-closed error and an audit emission.

## Audit & Export

- Every post, rejection, and replay decision emits an immutable audit event.
- Exports support JSON and CSV.
- Export output is hash-chained for tamper detection.

## CI Enforcement

CI runs `scripts/ci-financial-validation.sh` as a blocking production gate.

CI fails if:

- Any invariant breaks
- Any replay mismatch occurs
- Any reconciliation drift is detected
