# Phase 7: Enterprise Control & Monetization Layer — Implementation Plan

## Backend Contracts Audit

### RBAC (Roles & Permissions)
- **Roles:** OWNER, ADMIN, MANAGER, ACCOUNTANT, AUDITOR, INVENTORY_MANAGER, EMPLOYEE
- **Permissions:** Defined in `client/src/contexts/AuthContext.tsx` (frontend) and enforced via `authenticateToken` + role checks in `server/routes.ts`.
- **Gaps:** No backend endpoint to fetch current user’s permissions dynamically; frontend relies on static mapping.

### Billing & Plans
- **Tables:** `plans`, `subscriptions`, `billingInvoices`, `billingPayments` (shared/schema.ts)
- **Middleware:** `billing-enforcement.ts` provides modes: ok, warn_past_due, read_only, suspended.
- **Headers:** `x-billing-status` set for warn_past_due; read_only/suspended block writes.
- **Gaps:** Frontend does not consume billing status headers; no UI for upgrade prompts or grace periods.

### Workflow & Accounting
- **Workflow:** `startWorkflowInstance` in routes; workflow tables exist but no UI.
- **Accounting:** `accounting.service.ts` enforces invariants, period locks, void-as-reversal.
- **Gaps:** Frontend does not yet display workflow/approval UI or accounting period locks.

### Dashboards
- **State:** Multiple dashboard components exist; potential duplication.
- **Gaps:** No single source of truth KPI service; role-based dashboards not enforced.

### Error Handling
- **Current:** `handleApiError` in api-client.ts shows generic toasts.
- **Gaps:** No user-safe messaging for 402 (billing) or 403 (permissions); no internal logging hooks.

## Implementation Steps

### 1) RBAC UI Gating
- Create `usePermissions` hook that reads backend permissions (add `/api/me/permissions` endpoint if needed).
- Add `<ProtectedComponent>` wrapper to hide/disable UI by permission with tooltip.
- Update all major UI actions (create invoice, delete, settings) to use permission gates.
- Ensure role switching immediately updates UI affordances.

### 2) Billing-Aware UX States
- Add `useBillingStatus` hook to read `x-billing-status` header or a dedicated `/api/billing/status` endpoint.
- Implement global `<BillingBanner>` for past_due (upgrade CTA) and read_only (warning).
- Disable mutations in read_only; lock views in suspended except for OWNER (with logging).
- Show upgrade prompts with enterprise-grade tone; link to billing page.

### 3) Workflow & Accounting Alignment
- Add workflow UI components: definitions list, instances, approvals, timers.
- Ensure every workflow action creates an accounting transaction via `accounting.service.ts`.
- Display accounting period locks on transaction forms; prevent posting/void in closed periods.
- Show voids as reversals in transaction lists.

### 4) Dashboard Deduplication
- Create a single `DashboardService` that fetches KPIs from `/api/dashboard/kpis`.
- Implement role-based dashboard components that filter data by permissions.
- Remove duplicate dashboard pages; route by role to single dashboard with conditional sections.

### 5) Standardized Error Handling
- Extend `handleApiError` to treat 401 (redirect to login), 402 (billing upgrade CTA), 403 (permission message), 400 (validation feedback).
- Add internal error logging hook (send to `/api/logs/error` if user opts in).
- Ensure no raw stack traces are shown to users.

### 6) Missing Backend Contracts (if any)
- `GET /api/me/permissions` – return current user’s permissions and role.
- `GET /api/billing/status` – return billing mode, plan limits, grace period.
- `GET /api/workflow/definitions` – list available workflows.
- `GET /api/workflow/instances` – list user’s workflow instances.
- `POST /api/logs/error` – client-side error reporting (optional).

## Validation Criteria
- All UI actions respect RBAC; unauthorized actions are disabled with tooltips.
- Billing states immediately affect UI; upgrade prompts are enterprise-grade.
- Workflow actions are traceable to accounting records; period locks are respected.
- Dashboards show single source of truth KPIs; role-based sections work.
- Errors are user-safe; 401/402/403/400 have distinct flows.
- No demo/mock logic; enterprise-first, audit-ready.

---
