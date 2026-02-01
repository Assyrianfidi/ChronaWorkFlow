/**
 * High-Risk Non-Financial Mutation Registry
 * 
 * This module defines the CANONICAL, machine-enforceable classification of
 * high-risk write operations that are NOT financial mutations but still require
 * exactly-once semantics, tenant isolation, and idempotency.
 * 
 * High-risk operations include:
 * - Inventory changes (stock levels, COGS impact)
 * - Customer/employee sensitive data
 * - Workflow triggers with side effects
 * - Audit-sensitive state changes
 * - Tenant-shared resources
 */

/**
 * Canonical list of high-risk database tables (non-financial).
 * 
 * Writes to these tables MUST use idempotent operations.
 */
export const HIGH_RISK_TABLES = [
  // Inventory (affects COGS, stock levels, asset values)
  "inventory_items",
  "inventory_adjustments",
  "inventory_transfers",
  
  // Customer & Employee sensitive data
  "customers",
  "vendors",
  "employees",
  "users",
  "user_company_access",
  
  // Workflow & Automation (side effects)
  "workflow_instances",
  "workflow_executions",
  "workflow_triggers",
  
  // Audit & Compliance
  "audit_logs",
  "compliance_records",
  
  // Company & Tenant management
  "companies",
  "company_settings",
  
  // Projects (budget, billing impact)
  "projects",
  "project_tasks",
  "time_entries",
  
  // Tax & Regulatory
  "tax_rates",
  "tax_filings",
] as const;

export type HighRiskTable = typeof HIGH_RISK_TABLES[number];

/**
 * Registry of all high-risk non-financial mutation operations.
 * 
 * Each entry defines:
 * - operationName: Unique identifier for the operation
 * - description: What the operation does
 * - affectedTables: Which high-risk tables are mutated
 * - requiresIdempotency: Must be true (enforced)
 * - storageMethod: Name of the storage method that implements this
 * - riskLevel: Severity of impact if duplicated
 */
export interface HighRiskMutationDefinition {
  operationName: string;
  description: string;
  affectedTables: readonly HighRiskTable[];
  requiresIdempotency: true; // Always true - no exceptions
  storageMethod: string;
  routePath: string;
  httpMethod: "POST" | "PUT" | "PATCH" | "DELETE";
  riskLevel: "HIGH" | "CRITICAL";
  riskReason: string; // Why this operation is high-risk
}

/**
 * CANONICAL REGISTRY of all high-risk non-financial mutations.
 * 
 * This is the single source of truth for non-financial high-risk operations.
 * Adding a new high-risk mutation requires:
 * 1. Adding an entry here
 * 2. Implementing with withIdempotentWrite
 * 3. Using registerHighRiskRoute
 * 4. Adding E2E test
 */
export const HIGH_RISK_MUTATIONS: readonly HighRiskMutationDefinition[] = [
  {
    operationName: "adjustInventory",
    description: "Adjust inventory quantity (stock level change)",
    affectedTables: ["inventory_items", "inventory_adjustments"],
    requiresIdempotency: true,
    storageMethod: "adjustInventoryQuantity",
    routePath: "/api/inventory/:itemId/adjust",
    httpMethod: "POST",
    riskLevel: "HIGH",
    riskReason: "Duplicate adjustments corrupt stock levels and COGS calculations",
  },
  {
    operationName: "createCustomer",
    description: "Create new customer record",
    affectedTables: ["customers"],
    requiresIdempotency: true,
    storageMethod: "createCustomer",
    routePath: "/api/customers",
    httpMethod: "POST",
    riskLevel: "HIGH",
    riskReason: "Duplicate customers cause billing errors and data integrity issues",
  },
  {
    operationName: "updateCustomer",
    description: "Update customer record",
    affectedTables: ["customers"],
    requiresIdempotency: true,
    storageMethod: "updateCustomerByCompany",
    routePath: "/api/customers/:id",
    httpMethod: "PATCH",
    riskLevel: "HIGH",
    riskReason: "Duplicate updates cause data inconsistency and billing errors",
  },
  {
    operationName: "createEmployee",
    description: "Create new employee record",
    affectedTables: ["employees"],
    requiresIdempotency: true,
    storageMethod: "createEmployee",
    routePath: "/api/payroll/employees",
    httpMethod: "POST",
    riskLevel: "CRITICAL",
    riskReason: "Duplicate employees cause payroll errors and compliance violations",
  },
  {
    operationName: "createInventoryItem",
    description: "Create new inventory item",
    affectedTables: ["inventory_items"],
    requiresIdempotency: true,
    storageMethod: "createInventoryItem",
    routePath: "/api/inventory/items",
    httpMethod: "POST",
    riskLevel: "HIGH",
    riskReason: "Duplicate items corrupt inventory tracking and COGS",
  },
  {
    operationName: "updateInventoryItem",
    description: "Update inventory item details",
    affectedTables: ["inventory_items"],
    requiresIdempotency: true,
    storageMethod: "updateInventoryItemByCompany",
    routePath: "/api/inventory/items/:id",
    httpMethod: "PATCH",
    riskLevel: "HIGH",
    riskReason: "Duplicate updates cause inventory data inconsistency",
  },
  {
    operationName: "triggerWorkflow",
    description: "Manually trigger workflow instance",
    affectedTables: ["workflow_instances", "workflow_executions"],
    requiresIdempotency: true,
    storageMethod: "triggerWorkflowInstance",
    routePath: "/api/workflows/:workflowId/trigger",
    httpMethod: "POST",
    riskLevel: "HIGH",
    riskReason: "Duplicate workflow triggers cause duplicate notifications and actions",
  },
  {
    operationName: "updateCompanySettings",
    description: "Update critical company settings",
    affectedTables: ["company_settings", "companies"],
    requiresIdempotency: true,
    storageMethod: "updateCompanySettings",
    routePath: "/api/companies/:companyId/settings",
    httpMethod: "PATCH",
    riskLevel: "CRITICAL",
    riskReason: "Settings changes affect all users; duplicates cause inconsistent state",
  },
  {
    operationName: "grantUserAccess",
    description: "Grant user access to company",
    affectedTables: ["user_company_access"],
    requiresIdempotency: true,
    storageMethod: "grantUserCompanyAccess",
    routePath: "/api/companies/:companyId/users/:userId/grant",
    httpMethod: "POST",
    riskLevel: "CRITICAL",
    riskReason: "Duplicate access grants cause RBAC violations and audit failures",
  },
] as const;

/**
 * Check if a table is a high-risk table
 */
export function isHighRiskTable(tableName: string): tableName is HighRiskTable {
  return (HIGH_RISK_TABLES as readonly string[]).includes(tableName);
}

/**
 * Check if a route path is a high-risk mutation route
 */
export function isHighRiskMutationRoute(path: string, method: string): boolean {
  return HIGH_RISK_MUTATIONS.some(
    (mutation) => {
      // Normalize paths for comparison (handle route parameters)
      const normalizedMutationPath = mutation.routePath.replace(/:[^/]+/g, "[^/]+");
      const pathRegex = new RegExp(`^${normalizedMutationPath}$`);
      return pathRegex.test(path) && mutation.httpMethod === method;
    }
  );
}

/**
 * Get high-risk mutation definition by operation name
 */
export function getHighRiskMutation(operationName: string): HighRiskMutationDefinition | undefined {
  return HIGH_RISK_MUTATIONS.find((m) => m.operationName === operationName);
}

/**
 * Get all registered high-risk mutation operation names
 */
export function getAllHighRiskOperations(): readonly string[] {
  return HIGH_RISK_MUTATIONS.map((m) => m.operationName);
}

/**
 * Validate that a high-risk mutation is properly configured
 * 
 * @throws Error if validation fails
 */
export function validateHighRiskMutation(config: {
  operationName: string;
  hasIdempotencyKey: boolean;
  usesDeterministicUuid: boolean;
  usesAtomicTransaction: boolean;
}): void {
  const mutation = getHighRiskMutation(config.operationName);
  
  if (!mutation) {
    throw new Error(
      `High-risk mutation "${config.operationName}" is not registered in HIGH_RISK_MUTATIONS. ` +
      `All high-risk operations must be explicitly registered.`
    );
  }

  if (!config.hasIdempotencyKey) {
    throw new Error(
      `High-risk mutation "${config.operationName}" does not require Idempotency-Key header. ` +
      `This violates the High-Risk Write-Path Contract.`
    );
  }

  if (!config.usesDeterministicUuid) {
    throw new Error(
      `High-risk mutation "${config.operationName}" does not use deterministic UUID. ` +
      `This violates the High-Risk Write-Path Contract.`
    );
  }

  if (!config.usesAtomicTransaction) {
    throw new Error(
      `High-risk mutation "${config.operationName}" does not use atomic transaction. ` +
      `This violates the High-Risk Write-Path Contract.`
    );
  }
}

/**
 * Type guard for high-risk mutation operation names
 */
export type HighRiskOperationName = typeof HIGH_RISK_MUTATIONS[number]["operationName"];

/**
 * Assert that an operation is a registered high-risk mutation
 */
export function assertHighRiskOperation(
  operationName: string
): asserts operationName is HighRiskOperationName {
  if (!getHighRiskMutation(operationName)) {
    throw new Error(
      `Operation "${operationName}" is not a registered high-risk mutation. ` +
      `Add it to HIGH_RISK_MUTATIONS in high-risk-mutation-registry.ts`
    );
  }
}

/**
 * Get risk level for an operation
 */
export function getRiskLevel(operationName: string): "HIGH" | "CRITICAL" | "UNKNOWN" {
  const mutation = getHighRiskMutation(operationName);
  return mutation?.riskLevel ?? "UNKNOWN";
}

/**
 * Check if an operation is critical risk
 */
export function isCriticalRisk(operationName: string): boolean {
  return getRiskLevel(operationName) === "CRITICAL";
}
