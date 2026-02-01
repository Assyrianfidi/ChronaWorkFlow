/**
 * Financial Mutation Registry
 * 
 * This module provides the CANONICAL, machine-enforceable definition of what
 * constitutes a financial mutation in the AccuBooks system.
 * 
 * ANY operation that mutates financial state MUST be registered here.
 */

/**
 * Canonical list of database tables that contain financial state.
 * 
 * Writes to these tables MUST use idempotent operations.
 */
export const FINANCIAL_TABLES = [
  // Core financial entities
  "payments",
  "invoices",
  "invoice_items",
  "transactions",
  "transaction_lines",
  
  // Payroll
  "pay_runs",
  "pay_run_details",
  "pay_run_deductions",
  "payroll_transactions",
  
  // Banking & Reconciliation
  "bank_transactions",
  "ledger_reconciliations",
  
  // Inventory (affects COGS and asset values)
  "inventory_items",
  "inventory_adjustments",
  
  // Accounts (balance changes)
  "accounts", // Only when balance is updated
  
  // Credits & Refunds
  "credits",
  "refunds",
  
  // Idempotency tracking tables
  "invoice_finalizations",
  "payroll_executions",
] as const;

export type FinancialTable = typeof FINANCIAL_TABLES[number];

/**
 * Registry of all financial mutation operations.
 * 
 * Each entry defines:
 * - operationName: Unique identifier for the operation
 * - description: What the operation does
 * - affectedTables: Which financial tables are mutated
 * - requiresIdempotency: Must be true (enforced)
 * - storageMethod: Name of the storage method that implements this
 */
export interface FinancialMutationDefinition {
  operationName: string;
  description: string;
  affectedTables: readonly FinancialTable[];
  requiresIdempotency: true; // Always true - no exceptions
  storageMethod: string;
  routePath: string;
  httpMethod: "POST" | "PUT" | "PATCH" | "DELETE";
}

/**
 * CANONICAL REGISTRY of all financial mutations.
 * 
 * This is the single source of truth.
 * Adding a new financial mutation requires:
 * 1. Adding an entry here
 * 2. Implementing with withIdempotentWrite
 * 3. Using registerFinancialRoute
 * 4. Adding E2E test
 */
export const FINANCIAL_MUTATIONS: readonly FinancialMutationDefinition[] = [
  {
    operationName: "createPayment",
    description: "Record a payment against an invoice",
    affectedTables: ["payments", "invoices"],
    requiresIdempotency: true,
    storageMethod: "createPayment",
    routePath: "/api/payments",
    httpMethod: "POST",
  },
  {
    operationName: "createInvoice",
    description: "Create a new invoice with line items",
    affectedTables: ["invoices", "invoice_items"],
    requiresIdempotency: true,
    storageMethod: "createInvoice",
    routePath: "/api/invoices",
    httpMethod: "POST",
  },
  {
    operationName: "finalizeInvoice",
    description: "Transition invoice to final status (sent/issued/approved)",
    affectedTables: ["invoices", "invoice_finalizations"],
    requiresIdempotency: true,
    storageMethod: "finalizeInvoice",
    routePath: "/api/invoices/:invoiceId/finalize",
    httpMethod: "POST",
  },
  {
    operationName: "executePayroll",
    description: "Execute payroll run (approve/process/complete)",
    affectedTables: ["pay_runs", "payroll_executions", "payroll_transactions"],
    requiresIdempotency: true,
    storageMethod: "executePayrollRun",
    routePath: "/api/payroll/pay-runs/:payRunId/execute",
    httpMethod: "POST",
  },
  {
    operationName: "reconcileLedger",
    description: "Mark bank transaction as reconciled",
    affectedTables: ["bank_transactions", "ledger_reconciliations"],
    requiresIdempotency: true,
    storageMethod: "reconcileLedger",
    routePath: "/api/ledger/reconcile/:bankTransactionId",
    httpMethod: "POST",
  },
  {
    operationName: "importBankTransactions",
    description: "Import bank transactions in bulk",
    affectedTables: ["bank_transactions"],
    requiresIdempotency: true,
    storageMethod: "createBankTransaction",
    routePath: "/api/bank-transactions/import",
    httpMethod: "POST",
  },
  {
    operationName: "reconcileBankTransaction",
    description: "Reconcile a bank transaction",
    affectedTables: ["bank_transactions"],
    requiresIdempotency: true,
    storageMethod: "reconcileBankTransactionByCompany",
    routePath: "/api/bank-transactions/:id/reconcile",
    httpMethod: "POST",
  },
  {
    operationName: "updateEmployee",
    description: "Update employee information",
    affectedTables: ["pay_runs"],
    requiresIdempotency: true,
    storageMethod: "updateEmployeeByCompany",
    routePath: "/api/payroll/employees/:id",
    httpMethod: "PATCH",
  },
  {
    operationName: "createDeduction",
    description: "Create payroll deduction",
    affectedTables: ["pay_run_deductions"],
    requiresIdempotency: true,
    storageMethod: "createDeduction",
    routePath: "/api/payroll/deductions",
    httpMethod: "POST",
  },
  {
    operationName: "createEmployeeDeduction",
    description: "Create employee-specific deduction",
    affectedTables: ["pay_run_deductions"],
    requiresIdempotency: true,
    storageMethod: "createEmployeeDeductionByCompany",
    routePath: "/api/payroll/employee-deductions",
    httpMethod: "POST",
  },
  {
    operationName: "createPayrollPeriod",
    description: "Create payroll period",
    affectedTables: ["pay_runs"],
    requiresIdempotency: true,
    storageMethod: "createPayrollPeriod",
    routePath: "/api/payroll/periods",
    httpMethod: "POST",
  },
  {
    operationName: "createTimeEntry",
    description: "Create time entry for payroll",
    affectedTables: ["pay_runs"],
    requiresIdempotency: true,
    storageMethod: "createTimeEntryByCompany",
    routePath: "/api/payroll/time-entries",
    httpMethod: "POST",
  },
  {
    operationName: "approveTimeEntry",
    description: "Approve time entry",
    affectedTables: ["pay_runs"],
    requiresIdempotency: true,
    storageMethod: "approveTimeEntryByCompany",
    routePath: "/api/payroll/time-entries/:id/approve",
    httpMethod: "POST",
  },
  {
    operationName: "createPayRun",
    description: "Create payroll run",
    affectedTables: ["pay_runs", "pay_run_details"],
    requiresIdempotency: true,
    storageMethod: "createPayRun",
    routePath: "/api/payroll/pay-runs",
    httpMethod: "POST",
  },
  {
    operationName: "updatePayRunStatus",
    description: "Update payroll run status",
    affectedTables: ["pay_runs"],
    requiresIdempotency: true,
    storageMethod: "updatePayRunStatusByCompany",
    routePath: "/api/payroll/pay-runs/:id/status",
    httpMethod: "PATCH",
  },
  {
    operationName: "createTaxForm",
    description: "Create tax form",
    affectedTables: ["payroll_transactions"],
    requiresIdempotency: true,
    storageMethod: "createTaxForm",
    routePath: "/api/payroll/tax-forms",
    httpMethod: "POST",
  },
  {
    operationName: "updateInventoryQuantity",
    description: "Update inventory item quantity",
    affectedTables: ["inventory_items", "inventory_adjustments"],
    requiresIdempotency: true,
    storageMethod: "updateInventoryQuantityByCompany",
    routePath: "/api/inventory/items/:id/quantity",
    httpMethod: "PATCH",
  },
  {
    operationName: "createPurchaseOrder",
    description: "Create purchase order",
    affectedTables: ["inventory_items"],
    requiresIdempotency: true,
    storageMethod: "createPurchaseOrder",
    routePath: "/api/inventory/purchase-orders",
    httpMethod: "POST",
  },
  {
    operationName: "updatePurchaseOrderStatus",
    description: "Update purchase order status",
    affectedTables: ["inventory_items"],
    requiresIdempotency: true,
    storageMethod: "updatePurchaseOrderStatusByCompany",
    routePath: "/api/inventory/purchase-orders/:id/status",
    httpMethod: "PATCH",
  },
  {
    operationName: "createInventoryAdjustment",
    description: "Create inventory adjustment",
    affectedTables: ["inventory_adjustments", "inventory_items"],
    requiresIdempotency: true,
    storageMethod: "createInventoryAdjustment",
    routePath: "/api/inventory/adjustments",
    httpMethod: "POST",
  },
] as const;

/**
 * Check if a table is a financial table
 */
export function isFinancialTable(tableName: string): tableName is FinancialTable {
  return (FINANCIAL_TABLES as readonly string[]).includes(tableName);
}

/**
 * Check if a route path is a financial mutation route
 */
export function isFinancialMutationRoute(path: string, method: string): boolean {
  return FINANCIAL_MUTATIONS.some(
    (mutation) => {
      // Normalize paths for comparison (handle route parameters)
      const normalizedMutationPath = mutation.routePath.replace(/:[^/]+/g, "[^/]+");
      const pathRegex = new RegExp(`^${normalizedMutationPath}$`);
      return pathRegex.test(path) && mutation.httpMethod === method;
    }
  );
}

/**
 * Get financial mutation definition by operation name
 */
export function getFinancialMutation(operationName: string): FinancialMutationDefinition | undefined {
  return FINANCIAL_MUTATIONS.find((m) => m.operationName === operationName);
}

/**
 * Get all registered financial mutation operation names
 */
export function getAllFinancialOperations(): readonly string[] {
  return FINANCIAL_MUTATIONS.map((m) => m.operationName);
}

/**
 * Validate that a financial mutation is properly configured
 * 
 * @throws Error if validation fails
 */
export function validateFinancialMutation(config: {
  operationName: string;
  hasIdempotencyKey: boolean;
  usesDeterministicUuid: boolean;
  usesAtomicTransaction: boolean;
}): void {
  const mutation = getFinancialMutation(config.operationName);
  
  if (!mutation) {
    throw new Error(
      `Financial mutation "${config.operationName}" is not registered in FINANCIAL_MUTATIONS. ` +
      `All financial operations must be explicitly registered.`
    );
  }

  if (!config.hasIdempotencyKey) {
    throw new Error(
      `Financial mutation "${config.operationName}" does not require Idempotency-Key header. ` +
      `This violates the Financial Write-Path Contract.`
    );
  }

  if (!config.usesDeterministicUuid) {
    throw new Error(
      `Financial mutation "${config.operationName}" does not use deterministic UUID. ` +
      `This violates the Financial Write-Path Contract.`
    );
  }

  if (!config.usesAtomicTransaction) {
    throw new Error(
      `Financial mutation "${config.operationName}" does not use atomic transaction. ` +
      `This violates the Financial Write-Path Contract.`
    );
  }
}

/**
 * Type guard for financial mutation operation names
 */
export type FinancialOperationName = typeof FINANCIAL_MUTATIONS[number]["operationName"];

/**
 * Assert that an operation is a registered financial mutation
 */
export function assertFinancialOperation(
  operationName: string
): asserts operationName is FinancialOperationName {
  if (!getFinancialMutation(operationName)) {
    throw new Error(
      `Operation "${operationName}" is not a registered financial mutation. ` +
      `Add it to FINANCIAL_MUTATIONS in financial-mutation-registry.ts`
    );
  }
}
