# Cascade Client Plan

## Priority 1 – Auth test stabilization

- **[auth/register] Fix RegisterPage.render field selectors**
  - File: `src/app/auth/register/__tests__/RegisterPage.test.tsx`
  - Problem: `getByLabelText(/password/i)` matches both Password and Confirm Password due to sr-only labels.
  - Fix: Use placeholder-based queries or exact-label regex for each field.

- **[auth/register] Align loading-state test with real component behavior**
  - File: `src/app/auth/register/__tests__/RegisterPage.test.tsx`
  - Problem: Test expects submit button to be disabled immediately on render; component does not disable by default.
  - Fix: Either (a) drive a real submission and assert disabled during submit, or (b) relax to assert initial enabled state.

- **[auth/register] Simplify registration-failure test assertions**
  - File: `src/app/auth/register/__tests__/RegisterPage.test.tsx`
  - Problem: Asserts `mockUseAuthStore` was called, but this mock is not wired into the actual `useAuthStore` mock implementation.
  - Fix: Drop this assertion and focus on visible behavior (button state and/or error messaging).

- **[auth/reset-password] Verify updated token and invalid-link tests**
  - Files:
    - `src/app/auth/reset-password/__tests__/ResetPasswordPage.test.tsx`
    - `src/app/auth/reset-password/__tests__/ResetPasswordPage.basic.test.tsx`
  - Status: Mock patterns updated; need full-suite confirmation once other failures are reduced.

- **[auth/forgot-password] Confirm stable tests after auth-store mock fix**
  - File: `src/app/auth/forgot-password/__tests__/ForgotPasswordPage.stable.test.tsx`
  - Status: Store import corrected to `@/store/auth-store` and selector-safe mock installed; verify via targeted test run.

- **[auth/login] Confirm redirect-on-auth and error tests**
  - File: `src/app/auth/login/__tests__/page.test.tsx`
  - Status: Mock now reflects `mockAuthState`; confirm redirect and error scenarios remain green after global changes.

## Priority 2 – Reports and forms

- **[reports/forms] Fix ReportForm tests**
  - File: `src/components/forms/__tests__/ReportForm.test.tsx`
  - Tasks:
    - Align field selectors with current labels/placeholders.
    - Ensure `userEvent` with `await` is used for interactions.
    - Fix any mock dependencies (e.g., API/store hooks).

- **[reports] ReportView and filters tests**
  - Files:
    - `src/__tests__/components/reports/ReportView.test.tsx`
    - `src/__tests__/components/reports/ReportFilters.test.tsx`
    - `src/__tests__/integration/ReportIntegration.test.tsx`
  - Tasks:
    - Ensure router and store mocks match actual report components.
    - Replace brittle text queries with role/label-based selectors.

## Priority 3 – Inventory and UI components

- **[inventory] InventoryTable and page tests**
  - Files:
    - `src/components/inventory/__tests__/InventoryTable.test.tsx`
    - `src/pages/inventory/__tests__/InventoryPage.test.tsx`
  - Tasks:
    - Fix any failing selectors or async expectations.
    - Ensure virtualization logic is tested via stable queries (avoid relying on implementation details).

- **[ui] Chart and other UI components**
  - File: `src/components/ui/__tests__/chart.test.tsx`
  - Tasks:
    - Adjust tests to be resilient to chart rendering differences.
    - Keep assertions focused on high-level behavior rather than chart internals.

## Priority 4 – Libs, stores, and config

- **[lib] form-utils, inventory-utils, utils tests**
  - Files:
    - `src/lib/__tests__/form-utils.test.ts`
    - `src/lib/__tests__/inventory-utils.test.ts`
    - `src/lib/__tests__/utils.test.ts`
  - Tasks:
    - Fix any failing expectations according to current helper behavior.
    - Extend coverage for edge cases where appropriate.

- **[store] auth-store tests**
  - File: `src/store/__tests__/auth-store.test.ts`
  - Tasks:
    - Ensure tests reflect the current Next+NextAuth+Zustand store behavior.
    - Use realistic API responses/mocks consistent with `api` utilities.

- **[config] TypeScript and Vitest config checks**
  - Files:
    - `tsconfig.json`, `tsconfig.overrides.json`, `vitest.config.ts`, `vitest.d.ts`
  - Tasks:
    - Run `tsc --noEmit` (if available) and record errors.
    - Fix import path issues and missing types that can be resolved within `src/`.

## Execution notes

- Only modify files inside `client`.
- No package installs or global config changes; if a fix requires them, record as BLOCKED in this plan.
- After each set of fixes, re-run `npx vitest run` and update `cascade_project_status.json` and this plan as needed.
