# STEP 14: Revenue Recognition, Period Close & Financial Reporting

## 1) Principles (Non-Negotiable)

- Append-only ledger is the source of truth.
- Period locks are fail-closed.
- HARD_LOCKED is irreversible.
- Revenue recognition is deterministic and replay-safe.
- Financial statements are derived ONLY from ledger replay / trial balance.
- Multi-tenant isolation is enforced.
- Immutable audit events are emitted for every sensitive action.
- Deterministic CI mode is supported via `DETERMINISTIC_TEST_IDS=true`.

## 2) Accounting Period Lifecycle

### States

- `OPEN`
- `SOFT_CLOSED`
- `HARD_LOCKED`

### Enforcement

- **Posting is allowed** in `OPEN` and `SOFT_CLOSED`.
- **Posting is forbidden** in `HARD_LOCKED`.
- Enforcement is performed at the **ledger boundary** (`ledgerEngine.post()`), so no caller can bypass it.

### Irreversibility

- `HARD_LOCKED` cannot transition back to any other state.
- Only `SOFT_CLOSED` may be reopened to `OPEN`.

### Audit

Period transitions emit immutable audit events with:

- `tenantId`
- `periodId`
- `correlationId`
- `integrityHash`

## 3) Revenue Recognition

### Supported models

- Cash accounting (schedule definition supported; postings should be tied to cash events)
- Accrual accounting
- Deferred revenue with earned recognition

### Schedules

- Straight-line recognition
- Milestone-based recognition

### Recognition postings

- Recognition is executed by `RevenueRecognitionEngine`.
- Recognition postings use `ledgerEngine.post()` exclusively.
- Period hard locks are enforced automatically by the ledger boundary.
- Recognition is idempotent via deterministic `idempotencyKey` and transaction numbering when `DETERMINISTIC_TEST_IDS=true`.

### Audit

Immutable audit events are emitted for:

- schedule creation
- recognition execution
- recognition failure

## 4) Trial Balance

`buildTrialBalance()` replays the posted ledger lines and produces:

- opening balances
- period activity
- closing balances

Outputs include a deterministic `integrityHash` for CI verification.

## 5) Financial Statements

Statements are derived strictly from:

- trial balance
- ledger replay

### Income Statement

- Revenue and expenses are derived using account types.

### Balance Sheet

- Assets / liabilities / equity are derived using account types.
- If revenue/expense accounts are not explicitly closed, the engine includes an implied net income equity line so the balance sheet deterministically balances.

### Cash Flow

- Direct cash flow is computed from postings affecting configured cash accounts.
- Indirect cash flow is derived from net income as a deterministic approximation.

### Audit

Statement generation emits immutable audit events including `integrityHash`.

## 6) CI Enforcement

CI gate scripts:

- `scripts/ci-financial-reporting-validation.sh` (Linux CI)
- `scripts/ci-financial-reporting-validation.ps1` (Windows local)

Both produce machine-readable JSON reports under:

- `reports/ci/financial-reporting-tests.json`
- `reports/ci/financial-reporting-gate.json`

The production pipeline blocks on the `financial-reporting` gate.
