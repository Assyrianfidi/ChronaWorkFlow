import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, numeric, integer, boolean, pgEnum, uniqueIndex, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ========================================
// MAIN SCHEMA
// ========================================

// Enums
export const employeeStatusEnum = pgEnum('employee_status', ['active', 'on_leave', 'terminated', 'retired']);
export const payFrequencyEnum = pgEnum('pay_frequency', ['weekly', 'bi-weekly', 'semi-monthly', 'monthly']);
export const payRunStatusEnum = pgEnum('pay_run_status', ['draft', 'pending_approval', 'approved', 'processing', 'completed', 'cancelled']);
export const taxFormStatusEnum = pgEnum('tax_form_status', ['draft', 'generated', 'filed', 'accepted', 'rejected', 'amended']);
export const roleEnum = pgEnum('role', ['owner', 'admin', 'manager', 'accountant', 'auditor', 'inventory_manager', 'employee', 'customer', 'user']);
export const accountTypeEnum = pgEnum('account_type', ['asset', 'liability', 'equity', 'revenue', 'expense']);
export const transactionTypeEnum = pgEnum('transaction_type', ['invoice', 'payment', 'expense', 'transfer', 'adjustment', 'journal_entry']);
export const invoiceStatusEnum = pgEnum('invoice_status', ['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled']);
export const paymentMethodEnum = pgEnum('payment_method', ['cash', 'check', 'credit_card', 'bank_transfer', 'other']);
export const planIntervalEnum = pgEnum('plan_interval', ['month', 'year']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['trialing', 'active', 'past_due', 'canceled', 'paused']);
export const billingInvoiceStatusEnum = pgEnum('billing_invoice_status', ['draft', 'open', 'paid', 'uncollectible', 'void']);
export const billingPaymentStatusEnum = pgEnum('billing_payment_status', ['requires_payment_method', 'requires_action', 'processing', 'succeeded', 'failed', 'canceled']);
export const usageMetricTypeEnum = pgEnum('usage_metric_type', ['api_calls', 'ai_tokens', 'invoices_created', 'users_count']);
export const decisionTypeEnum = pgEnum('decision_type', ['scenario_execution', 'override', 'strategic_choice', 'risk_acknowledgement', 'policy_change', 'budget_approval']);
export const decisionStatusEnum = pgEnum('decision_status', ['proposed', 'approved', 'executed', 'monitoring', 'completed', 'failed']);
export const riskSignalTypeEnum = pgEnum('risk_signal_type', ['unusual_transaction', 'cash_runway_critical', 'negative_balance', 'expense_spike', 'margin_erosion', 'revenue_decline', 'duplicate_transaction', 'missing_expected_entry', 'policy_violation', 'approval_anomaly', 'account_anomaly', 'variance_threshold']);
export const riskSeverityEnum = pgEnum('risk_severity', ['critical', 'warning', 'info']);
export const riskStatusEnum = pgEnum('risk_status', ['active', 'acknowledged', 'mitigated', 'resolved', 'dismissed']);

// Employees table
export const employees = pgTable("employees", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).notNull().references(() => companies.id),
  employeeNumber: text("employee_number").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  socialSecurityNumber: text("social_security_number"),
  dateOfBirth: timestamp("date_of_birth"),
  hireDate: timestamp("hire_date").notNull(),
  terminationDate: timestamp("termination_date"),
  status: employeeStatusEnum("status").default("active").notNull(),
  jobTitle: text("job_title"),
  department: text("department"),
  managerId: varchar("manager_id", { length: 36 }),
  payRate: numeric("pay_rate", { precision: 10, scale: 2 }),
  payFrequency: payFrequencyEnum("pay_frequency").default("bi-weekly").notNull(),
  hourlyRate: numeric("hourly_rate", { precision: 10, scale: 2 }),
  overtimeRate: numeric("overtime_rate", { precision: 10, scale: 2 }),
  isExempt: boolean("is_exempt").default(false).notNull(),
  federalTaxId: text("federal_tax_id"),
  stateTaxId: text("state_tax_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueCompanyEmployeeNumber: uniqueIndex("unique_company_employee_number").on(table.companyId, table.employeeNumber),
}));

// Deductions/Benefits table
export const deductions = pgTable("deductions", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).notNull().references(() => companies.id),
  name: text("name").notNull(),
  type: text("type").notNull(), // "tax", "benefit", "deduction", "garnishment"
  category: text("category"), // "federal", "state", "fica", "medicare", "health", "retirement", etc.
  isPreTax: boolean("is_pre_tax").default(false).notNull(),
  calculationMethod: text("calculation_method").notNull(), // "percentage", "fixed", "tiered"
  rate: numeric("rate", { precision: 10, scale: 4 }), // percentage or fixed amount
  maxAmount: numeric("max_amount", { precision: 15, scale: 2 }), // annual max for some deductions
  isActive: boolean("is_active").default(true).notNull(),
  effectiveDate: timestamp("effective_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Employee Deductions table (many-to-many with custom amounts)
export const employeeDeductions = pgTable("employee_deductions", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id", { length: 36 }).notNull().references(() => employees.id),
  deductionId: varchar("deduction_id", { length: 36 }).notNull().references(() => deductions.id),
  customRate: numeric("custom_rate", { precision: 10, scale: 4 }), // override default rate
  customAmount: numeric("custom_amount", { precision: 15, scale: 2 }), // fixed amount override
  effectiveDate: timestamp("effective_date").notNull(),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Payroll Periods table
export const payrollPeriods = pgTable("payroll_periods", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).notNull().references(() => companies.id),
  name: text("name").notNull(), // "Pay Period 1 - Jan 2024", etc.
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  payDate: timestamp("pay_date").notNull(),
  payFrequency: payFrequencyEnum("pay_frequency").notNull(),
  isLocked: boolean("is_locked").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Time Entries table (for hourly employees)
export const timeEntries = pgTable("time_entries", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id", { length: 36 }).notNull().references(() => employees.id),
  payrollPeriodId: varchar("payroll_period_id", { length: 36 }).notNull().references(() => payrollPeriods.id),
  date: timestamp("date").notNull(),
  hoursWorked: numeric("hours_worked", { precision: 8, scale: 2 }).default("0").notNull(),
  overtimeHours: numeric("overtime_hours", { precision: 8, scale: 2 }).default("0").notNull(),
  doubleTimeHours: numeric("double_time_hours", { precision: 8, scale: 2 }).default("0").notNull(),
  breakHours: numeric("break_hours", { precision: 8, scale: 2 }).default("0").notNull(),
  description: text("description"),
  approvedBy: varchar("approved_by", { length: 36 }).references(() => users.id),
  approvedAt: timestamp("approved_at"),
  isApproved: boolean("is_approved").default(false).notNull(),
  createdBy: varchar("created_by", { length: 36 }).notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Pay Runs table
export const payRuns = pgTable("pay_runs", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).notNull().references(() => companies.id),
  payrollPeriodId: varchar("payroll_period_id", { length: 36 }).notNull().references(() => payrollPeriods.id),
  runNumber: text("run_number").notNull(),
  payDate: timestamp("pay_date").notNull(),
  status: payRunStatusEnum("status").default("draft").notNull(),
  totalGrossPay: numeric("total_gross_pay", { precision: 15, scale: 2 }).default("0").notNull(),
  totalNetPay: numeric("total_net_pay", { precision: 15, scale: 2 }).default("0").notNull(),
  totalDeductions: numeric("total_deductions", { precision: 15, scale: 2 }).default("0").notNull(),
  totalTaxes: numeric("total_taxes", { precision: 15, scale: 2 }).default("0").notNull(),
  employeeCount: integer("employee_count").default(0).notNull(),
  notes: text("notes"),
  processedBy: varchar("processed_by", { length: 36 }).references(() => users.id),
  processedAt: timestamp("processed_at"),
  createdBy: varchar("created_by", { length: 36 }).notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueCompanyRunNumber: uniqueIndex("unique_company_run_number").on(table.companyId, table.runNumber),
}));

// Pay Run Details table
export const payRunDetails = pgTable("pay_run_details", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  payRunId: varchar("pay_run_id", { length: 36 }).notNull().references(() => payRuns.id),
  employeeId: varchar("employee_id", { length: 36 }).notNull().references(() => employees.id),
  grossPay: numeric("gross_pay", { precision: 15, scale: 2 }).default("0").notNull(),
  regularPay: numeric("regular_pay", { precision: 15, scale: 2 }).default("0").notNull(),
  overtimePay: numeric("overtime_pay", { precision: 15, scale: 2 }).default("0").notNull(),
  doubleTimePay: numeric("double_time_pay", { precision: 15, scale: 2 }).default("0").notNull(),
  bonusPay: numeric("bonus_pay", { precision: 15, scale: 2 }).default("0").notNull(),
  totalDeductions: numeric("total_deductions", { precision: 15, scale: 2 }).default("0").notNull(),
  totalTaxes: numeric("total_taxes", { precision: 15, scale: 2 }).default("0").notNull(),
  netPay: numeric("net_pay", { precision: 15, scale: 2 }).default("0").notNull(),
  hoursWorked: numeric("hours_worked", { precision: 8, scale: 2 }).default("0").notNull(),
  overtimeHours: numeric("overtime_hours", { precision: 8, scale: 2 }).default("0").notNull(),
  payRate: numeric("pay_rate", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Pay Run Deductions table
export const payRunDeductions = pgTable("pay_run_deductions", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  payRunDetailId: varchar("pay_run_detail_id", { length: 36 }).notNull().references(() => payRunDetails.id),
  deductionId: varchar("deduction_id", { length: 36 }).notNull().references(() => deductions.id),
  employeeId: varchar("employee_id", { length: 36 }).notNull().references(() => employees.id),
  amount: numeric("amount", { precision: 15, scale: 2 }).default("0").notNull(),
  taxableAmount: numeric("taxable_amount", { precision: 15, scale: 2 }).default("0").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tax Forms table
export const taxForms = pgTable("tax_forms", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).notNull().references(() => companies.id),
  employeeId: varchar("employee_id", { length: 36 }).notNull().references(() => employees.id),
  formType: text("form_type").notNull(), // "W2", "1099", "941", etc.
  taxYear: integer("tax_year").notNull(),
  formNumber: text("form_number"), // sequential number per form type per year
  status: taxFormStatusEnum("status").default("draft").notNull(),
  data: text("data"), // JSON string with form data
  submittedDate: timestamp("submitted_date"),
  acceptedDate: timestamp("accepted_date"),
  rejectedDate: timestamp("rejected_date"),
  rejectionReason: text("rejection_reason"),
  filedBy: varchar("filed_by", { length: 36 }).references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueCompanyFormNumber: uniqueIndex("unique_company_form_number").on(table.companyId, table.formType, table.taxYear, table.formNumber),
}));

// Payroll Transactions table (links pay runs to accounting transactions)
export const payrollTransactions = pgTable("payroll_transactions", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).notNull().references(() => companies.id),
  payRunId: varchar("pay_run_id", { length: 36 }).notNull().references(() => payRuns.id),
  transactionId: varchar("transaction_id", { length: 36 }).notNull().references(() => transactions.id),
  type: text("type").notNull(), // "payroll_expense", "tax_liability", "net_pay", "deduction"
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Payroll Executions (idempotency tracking)
export const payrollExecutions = pgTable("payroll_executions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  companyId: varchar("company_id", { length: 36 }).notNull().references(() => companies.id),
  payRunId: varchar("pay_run_id", { length: 36 }).notNull().references(() => payRuns.id),
  targetStatus: text("target_status").notNull(),
  executedAt: timestamp("executed_at").defaultNow().notNull(),
  executedBy: varchar("executed_by", { length: 36 }).notNull().references(() => users.id),
});

export type PayrollExecution = typeof payrollExecutions.$inferSelect;
export type InsertPayrollExecution = typeof payrollExecutions.$inferInsert;

// Inventory Module Schemas

// Inventory Items
export const inventoryItems = pgTable("inventory_items", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).notNull().references(() => companies.id),
  sku: text("sku").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"),
  unitCost: numeric("unit_cost", { precision: 15, scale: 2 }).default("0").notNull(),
  unitPrice: numeric("unit_price", { precision: 15, scale: 2 }).default("0").notNull(),
  quantityOnHand: numeric("quantity_on_hand", { precision: 15, scale: 2 }).default("0").notNull(),
  quantityReserved: numeric("quantity_reserved", { precision: 15, scale: 2 }).default("0").notNull(),
  quantityAvailable: numeric("quantity_available", { precision: 15, scale: 2 }).default("0").notNull(),
  reorderPoint: numeric("reorder_point", { precision: 15, scale: 2 }).default("0").notNull(),
  reorderQuantity: numeric("reorder_quantity", { precision: 15, scale: 2 }).default("0").notNull(),
  maxStockLevel: numeric("max_stock_level", { precision: 15, scale: 2 }).default("0").notNull(),
  minStockLevel: numeric("min_stock_level", { precision: 15, scale: 2 }).default("0").notNull(),
  supplierId: varchar("supplier_id", { length: 36 }).references(() => vendors.id),
  costAccountId: varchar("cost_account_id", { length: 36 }).references(() => accounts.id),
  salesAccountId: varchar("sales_account_id", { length: 36 }).references(() => accounts.id),
  inventoryAccountId: varchar("inventory_account_id", { length: 36 }).references(() => accounts.id),
  isActive: boolean("is_active").default(true).notNull(),
  trackInventory: boolean("track_inventory").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueCompanySku: uniqueIndex("unique_company_sku").on(table.companyId, table.sku),
}));

// Inventory Transactions (missing - adding now)
export const inventoryTransactions = pgTable("inventory_transactions", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).notNull(),
  itemId: varchar("item_id", { length: 36 }).notNull().references(() => inventoryItems.id),
  locationId: varchar("location_id", { length: 36 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // purchase, sale, adjustment, transfer
  quantity: integer("quantity").notNull(),
  unitCost: numeric("unit_cost", { precision: 10, scale: 2 }),
  referenceId: varchar("reference_id", { length: 36 }),
  referenceType: varchar("reference_type", { length: 20 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Inventory Balances (missing - adding now)
export const inventoryBalances = pgTable("inventory_balances", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).notNull(),
  itemId: varchar("item_id", { length: 36 }).notNull().references(() => inventoryItems.id),
  locationId: varchar("location_id", { length: 36 }).notNull(),
  quantityOnHand: integer("quantity_on_hand").default(0).notNull(),
  unitCost: numeric("unit_cost", { precision: 10, scale: 2 }),
  totalValue: numeric("total_value", { precision: 15, scale: 2 }).default("0").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

// Inventory Locations (missing - adding now)
export const inventoryLocations = pgTable("inventory_locations", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Purchase Orders
export const purchaseOrders = pgTable("purchase_orders", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).notNull().references(() => companies.id),
  vendorId: varchar("vendor_id", { length: 36 }).notNull().references(() => vendors.id),
  poNumber: text("po_number").notNull(),
  orderDate: timestamp("order_date").notNull(),
  expectedDate: timestamp("expected_date"),
  status: text("status").default("draft").notNull(), // "draft", "sent", "partial", "received", "cancelled"
  subtotal: numeric("subtotal", { precision: 15, scale: 2 }).default("0").notNull(),
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default("0").notNull(),
  taxAmount: numeric("tax_amount", { precision: 15, scale: 2 }).default("0").notNull(),
  total: numeric("total", { precision: 15, scale: 2 }).default("0").notNull(),
  notes: text("notes"),
  createdBy: varchar("created_by", { length: 36 }).notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueCompanyPoNumber: uniqueIndex("unique_company_po_number").on(table.companyId, table.poNumber),
}));

// Credit Memos
export const creditMemos = pgTable("credit_memos", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).notNull(),
  customerId: varchar("customer_id", { length: 36 }).notNull().references(() => customers.id),
  number: varchar("number", { length: 50 }).notNull(),
  date: timestamp("date").notNull(),
  reason: text("reason").notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).default("draft").notNull(),
  createdBy: varchar("created_by", { length: 36 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Credit Memo Applications
export const creditMemoApplications = pgTable("credit_memo_applications", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  creditMemoId: varchar("credit_memo_id", { length: 36 }).notNull().references(() => creditMemos.id),
  invoiceId: varchar("invoice_id", { length: 36 }).notNull().references(() => invoices.id),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  appliedAt: timestamp("applied_at").defaultNow().notNull(),
});

// Write Offs
export const writeOffs = pgTable("write_offs", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).notNull(),
  customerId: varchar("customer_id", { length: 36 }).notNull().references(() => customers.id),
  invoiceId: varchar("invoice_id", { length: 36 }).references(() => invoices.id),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  reason: text("reason").notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  approvedBy: varchar("approved_by", { length: 36 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Vendor 1099 Payments
export const vendor1099Payments = pgTable("vendor_1099_payments", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  vendorId: varchar("vendor_id", { length: 36 }).notNull().references(() => vendors.id),
  year: integer("year").notNull(),
  box1: numeric("box1", { precision: 15, scale: 2 }).default("0"), // Nonemployee compensation
  box2: numeric("box2", { precision: 15, scale: 2 }).default("0"), // Services
  box3: numeric("box3", { precision: 15, scale: 2 }).default("0"), // Other income
  box4: numeric("box4", { precision: 15, scale: 2 }).default("0"), // Federal income tax withheld
  box5: numeric("box5", { precision: 15, scale: 2 }).default("0"), // Employer contributions
  box6: numeric("box6", { precision: 15, scale: 2 }).default("0"), // Medical and health care payments
  box7: numeric("box7", { precision: 15, scale: 2 }).default("0"), // Nonemployee compensation
  totalPayments: numeric("total_payments", { precision: 15, scale: 2 }).notNull(),
  taxYear: varchar("tax_year", { length: 4 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Purchase Order Items
export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  purchaseOrderId: varchar("purchase_order_id", { length: 36 }).notNull().references(() => purchaseOrders.id),
  inventoryItemId: varchar("inventory_item_id", { length: 36 }).notNull().references(() => inventoryItems.id),
  quantity: numeric("quantity", { precision: 15, scale: 2 }).notNull(),
  unitCost: numeric("unit_cost", { precision: 15, scale: 2 }).notNull(),
  totalCost: numeric("total_cost", { precision: 15, scale: 2 }).notNull(),
  receivedQuantity: numeric("received_quantity", { precision: 15, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Inventory Adjustments
export const inventoryAdjustments = pgTable("inventory_adjustments", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).notNull().references(() => companies.id),
  inventoryItemId: varchar("inventory_item_id", { length: 36 }).notNull().references(() => inventoryItems.id),
  adjustmentType: text("adjustment_type").notNull(), // "sale", "purchase", "return", "adjustment", "transfer"
  quantityChange: numeric("quantity_change", { precision: 15, scale: 2 }).notNull(),
  previousQuantity: numeric("previous_quantity", { precision: 15, scale: 2 }).notNull(),
  newQuantity: numeric("new_quantity", { precision: 15, scale: 2 }).notNull(),
  unitCost: numeric("unit_cost", { precision: 15, scale: 2 }),
  totalCost: numeric("total_cost", { precision: 15, scale: 2 }),
  reason: text("reason"),
  referenceType: text("reference_type"), // "invoice", "purchase_order", "manual"
  referenceId: varchar("reference_id", { length: 36 }),
  transactionId: varchar("transaction_id", { length: 36 }),
  createdBy: varchar("created_by", { length: 36 }).notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Companies table (multi-tenant)
export const companies = pgTable("companies", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  taxId: text("tax_id"),
  fiscalYearEnd: text("fiscal_year_end").default("12-31"),
  currency: text("currency").default("USD").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tenantCompanies = pgTable("tenant_companies", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id", { length: 36 }).notNull(),
  companyId: varchar("company_id", { length: 36 }).notNull().references(() => companies.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueTenantCompany: uniqueIndex("unique_tenant_company").on(table.tenantId, table.companyId),
  uniqueCompanyTenant: uniqueIndex("unique_company_tenant").on(table.companyId),
}));

// Users table
export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  role: roleEnum("role").default("user").notNull(),
  currentCompanyId: varchar("current_company_id", { length: 36 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userTenants = pgTable("user_tenants", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  tenantId: varchar("tenant_id", { length: 36 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserTenant: uniqueIndex("unique_user_tenant").on(table.userId),
  uniqueTenantUser: uniqueIndex("unique_tenant_user").on(table.tenantId, table.userId),
}));

// User Company Access (many-to-many)
export const userCompanyAccess = pgTable("user_company_access", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  companyId: varchar("company_id", { length: 36 }).notNull().references(() => companies.id),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserCompany: uniqueIndex("unique_user_company").on(table.userId, table.companyId),
}));

// Chart of Accounts
export const accounts = pgTable("accounts", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).notNull().references(() => companies.id),
  code: text("code").notNull(),
  name: text("name").notNull(),
  type: accountTypeEnum("type").notNull(),
  subtype: varchar("subtype", { length: 50 }), // Added missing subtype field
  parentId: varchar("parent_id", { length: 36 }),
  balance: numeric("balance", { precision: 15, scale: 2 }).default("0").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueCompanyCode: uniqueIndex("unique_company_code").on(table.companyId, table.code),
}));

// Customers
export const customers = pgTable("customers", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).notNull().references(() => companies.id),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  contactPerson: text("contact_person"),
  taxId: text("tax_id"),
  notes: text("notes"),
  balance: numeric("balance", { precision: 15, scale: 2 }).default("0").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Vendors
export const vendors = pgTable("vendors", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).notNull().references(() => companies.id),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  contactPerson: text("contact_person"),
  taxId: text("tax_id"),
  notes: text("notes"),
  balance: numeric("balance", { precision: 15, scale: 2 }).default("0").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Transactions (Journal Entries)
export const transactions = pgTable("transactions", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).notNull().references(() => companies.id),
  transactionNumber: text("transaction_number").notNull(),
  date: timestamp("date").notNull(),
  type: transactionTypeEnum("type").default("journal_entry").notNull(),
  description: text("description"),
  referenceNumber: text("reference_number"),
  totalAmount: numeric("total_amount", { precision: 15, scale: 2 }).notNull(),
  reversalOfTransactionId: varchar("reversal_of_transaction_id", { length: 36 }),
  isVoid: boolean("is_void").default(false).notNull(),
  voidedAt: timestamp("voided_at"),
  voidedBy: varchar("voided_by", { length: 36 }),
  createdBy: varchar("created_by", { length: 36 }).notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueCompanyTxnNumber: uniqueIndex("unique_company_txn_number").on(table.companyId, table.transactionNumber),
}));

// Transaction Lines (for double-entry)
export const transactionLines = pgTable("transaction_lines", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  transactionId: varchar("transaction_id", { length: 36 }).notNull().references(() => transactions.id),
  accountId: varchar("account_id", { length: 36 }).notNull().references(() => accounts.id),
  debit: numeric("debit", { precision: 15, scale: 2 }).default("0").notNull(),
  credit: numeric("credit", { precision: 15, scale: 2 }).default("0").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const accountingPeriods = pgTable("accounting_periods", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).notNull().references(() => companies.id),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueCompanyPeriod: uniqueIndex("unique_company_accounting_period").on(table.companyId, table.startDate, table.endDate),
}));

export const accountingPeriodLocks = pgTable("accounting_period_locks", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).notNull().references(() => companies.id),
  periodId: varchar("period_id", { length: 36 }).notNull().references(() => accountingPeriods.id),
  action: text("action").notNull(),
  reason: text("reason"),
  actorUserId: varchar("actor_user_id", { length: 36 }).references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Invoices
export const invoices = pgTable("invoices", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).notNull().references(() => companies.id),
  customerId: varchar("customer_id", { length: 36 }).notNull().references(() => customers.id),
  invoiceNumber: text("invoice_number").notNull(),
  date: timestamp("date").notNull(),
  dueDate: timestamp("due_date").notNull(),
  status: invoiceStatusEnum("status").default("draft").notNull(),
  subtotal: numeric("subtotal", { precision: 15, scale: 2 }).notNull(),
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default("0").notNull(),
  taxAmount: numeric("tax_amount", { precision: 15, scale: 2 }).default("0").notNull(),
  total: numeric("total", { precision: 15, scale: 2 }).notNull(),
  amountPaid: numeric("amount_paid", { precision: 15, scale: 2 }).default("0").notNull(),
  notes: text("notes"),
  terms: text("terms"),
  transactionId: varchar("transaction_id", { length: 36 }),
  createdBy: varchar("created_by", { length: 36 }).notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueCompanyInvoiceNumber: uniqueIndex("unique_company_invoice_number").on(table.companyId, table.invoiceNumber),
}));

// Invoice Items
export const invoiceItems = pgTable("invoice_items", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id", { length: 36 }).notNull().references(() => invoices.id),
  description: text("description").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: numeric("unit_price", { precision: 15, scale: 2 }).notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  accountId: varchar("account_id", { length: 36 }).references(() => accounts.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Invoice Finalizations (idempotency tracking)
export const invoiceFinalizations = pgTable("invoice_finalizations", {
  id: varchar("id", { length: 36 }).primaryKey(),
  companyId: varchar("company_id", { length: 36 }).notNull().references(() => companies.id),
  invoiceId: varchar("invoice_id", { length: 36 }).notNull().references(() => invoices.id),
  targetStatus: text("target_status").notNull(),
  finalizedAt: timestamp("finalized_at").defaultNow().notNull(),
  finalizedBy: varchar("finalized_by", { length: 36 }).notNull().references(() => users.id),
});

export type InvoiceFinalization = typeof invoiceFinalizations.$inferSelect;
export type InsertInvoiceFinalization = typeof invoiceFinalizations.$inferInsert;

// Payments
export const payments = pgTable("payments", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).notNull().references(() => companies.id),
  invoiceId: varchar("invoice_id", { length: 36 }).notNull().references(() => invoices.id),
  date: timestamp("date").notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  paymentMethod: text("payment_method"),
  referenceNumber: text("reference_number"),
  notes: text("notes"),
  transactionId: varchar("transaction_id", { length: 36 }),
  createdBy: varchar("created_by", { length: 36 }).notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Bank Transactions
export const bankTransactions = pgTable("bank_transactions", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).notNull().references(() => companies.id),
  accountId: varchar("account_id", { length: 36 }).notNull().references(() => accounts.id),
  date: timestamp("date").notNull(),
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  type: text("type").notNull(), // debit or credit
  referenceNumber: text("reference_number"),
  isReconciled: boolean("is_reconciled").default(false).notNull(),
  reconciledAt: timestamp("reconciled_at"),
  matchedTransactionId: varchar("matched_transaction_id", { length: 36 }),
  importBatchId: varchar("import_batch_id", { length: 36 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Ledger Reconciliations (idempotency tracking)
export const ledgerReconciliations = pgTable("ledger_reconciliations", {
  id: varchar("id", { length: 36 }).primaryKey(),
  companyId: varchar("company_id", { length: 36 }).notNull().references(() => companies.id),
  bankTransactionId: varchar("bank_transaction_id", { length: 36 }).notNull().references(() => bankTransactions.id),
  reconciledAmount: numeric("reconciled_amount", { precision: 15, scale: 2 }).notNull(),
  reconciledAt: timestamp("reconciled_at").defaultNow().notNull(),
  reconciledBy: varchar("reconciled_by", { length: 36 }).notNull().references(() => users.id),
});

export type LedgerReconciliation = typeof ledgerReconciliations.$inferSelect;
export type InsertLedgerReconciliation = typeof ledgerReconciliations.$inferInsert;

// Idempotent Write Audit Log (observability & compliance)
export const idempotentWriteAuditLog = pgTable("idempotent_write_audit_log", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  operationName: text("operation_name").notNull(),
  operationType: text("operation_type").notNull(), // 'financial' or 'high-risk'
  deterministicId: varchar("deterministic_id", { length: 36 }).notNull(),
  companyId: varchar("company_id", { length: 36 }).notNull(),
  userId: varchar("user_id", { length: 36 }),
  status: text("status").notNull(), // 'new', 'replayed', 'failed'
  executionDurationMs: integer("execution_duration_ms").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  requestId: varchar("request_id", { length: 36 }),
  idempotencyKey: text("idempotency_key").notNull(),
  routePath: text("route_path"),
  httpMethod: text("http_method"),
  workflowsTriggered: integer("workflows_triggered").default(0).notNull(),
  sideEffectsExecuted: boolean("side_effects_executed").default(false).notNull(),
  errorMessage: text("error_message"),
  metadata: text("metadata"), // JSON string
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type IdempotentWriteAuditLog = typeof idempotentWriteAuditLog.$inferSelect;
export type InsertIdempotentWriteAuditLog = typeof idempotentWriteAuditLog.$inferInsert;

// Projects table
export const projects = pgTable("projects", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).notNull().references(() => companies.id),
  name: text("name").notNull(),
  description: text("description"),
  clientId: varchar("client_id", { length: 36 }).references(() => customers.id),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  budget: numeric("budget", { precision: 15, scale: 2 }),
  status: text("status").default("active").notNull(), // active, completed, on_hold, cancelled
  projectManagerId: varchar("project_manager_id", { length: 36 }).references(() => users.id),
  color: text("color"), // hex color for UI
  isBillable: boolean("is_billable").default(true).notNull(),
  hourlyRate: numeric("hourly_rate", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Project Time Entries
export const projectTimeEntries = pgTable("project_time_entries", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id", { length: 36 }).notNull().references(() => projects.id),
  employeeId: varchar("employee_id", { length: 36 }).notNull().references(() => employees.id),
  date: timestamp("date").notNull(),
  hours: numeric("hours", { precision: 8, scale: 2 }).notNull(),
  description: text("description"),
  hourlyRate: numeric("hourly_rate", { precision: 10, scale: 2 }),
  isBillable: boolean("is_billable").default(true).notNull(),
  invoiceId: varchar("invoice_id", { length: 36 }).references(() => invoices.id),
  createdBy: varchar("created_by", { length: 36 }).notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Budgets table
export const budgets = pgTable("budgets", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).notNull().references(() => companies.id),
  name: text("name").notNull(),
  description: text("description"),
  budgetType: text("budget_type").notNull(), // annual, monthly, quarterly, project
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  totalBudget: numeric("total_budget", { precision: 15, scale: 2 }).notNull(),
  spent: numeric("spent", { precision: 15, scale: 2 }).default("0").notNull(),
  remaining: numeric("remaining", { precision: 15, scale: 2 }).notNull(),
  status: text("status").default("active").notNull(), // active, completed, exceeded, paused
  createdBy: varchar("created_by", { length: 36 }).notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Budget Categories (links budgets to accounts)
export const budgetCategories = pgTable("budget_categories", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  budgetId: varchar("budget_id", { length: 36 }).notNull().references(() => budgets.id),
  accountId: varchar("account_id", { length: 36 }).notNull().references(() => accounts.id),
  categoryName: text("category_name").notNull(),
  budgetedAmount: numeric("budgeted_amount", { precision: 15, scale: 2 }).notNull(),
  spentAmount: numeric("spent_amount", { precision: 15, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Mileage Tracking
export const mileageEntries = pgTable("mileage_entries", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).notNull().references(() => companies.id),
  employeeId: varchar("employee_id", { length: 36 }).notNull().references(() => employees.id),
  date: timestamp("date").notNull(),
  vehicleId: varchar("vehicle_id", { length: 36 }), // Optional vehicle reference
  startLocation: text("start_location"),
  endLocation: text("end_location"),
  startOdometer: numeric("start_odometer", { precision: 10, scale: 1 }),
  endOdometer: numeric("end_odometer", { precision: 10, scale: 1 }),
  totalMiles: numeric("total_miles", { precision: 10, scale: 1 }).notNull(),
  purpose: text("purpose").notNull(), // business, personal, commute
  notes: text("notes"),
  reimbursementRate: numeric("reimbursement_rate", { precision: 5, scale: 2 }), // per mile rate
  reimbursementAmount: numeric("reimbursement_amount", { precision: 10, scale: 2 }),
  isApproved: boolean("is_approved").default(false).notNull(),
  approvedBy: varchar("approved_by", { length: 36 }).references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdBy: varchar("created_by", { length: 36 }).notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Vehicles (for mileage tracking)
export const vehicles = pgTable("vehicles", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).notNull().references(() => companies.id),
  employeeId: varchar("employee_id", { length: 36 }).notNull().references(() => employees.id),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  licensePlate: text("license_plate"),
  vin: text("vin"),
  color: text("color"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Multi-Currency Support
export const currencies = pgTable("currencies", {
  id: varchar("id", { length: 3 }).primaryKey(), // USD, EUR, GBP, etc.
  name: text("name").notNull(),
  symbol: text("symbol").notNull(),
  decimalPlaces: integer("decimal_places").default(2).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Exchange Rates
export const exchangeRates = pgTable("exchange_rates", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  fromCurrency: varchar("from_currency", { length: 3 }).notNull(),
  toCurrency: varchar("to_currency", { length: 3 }).notNull(),
  rate: numeric("rate", { precision: 15, scale: 6 }).notNull(),
  effectiveDate: timestamp("effective_date").notNull(),
  source: text("source"), // API, manual, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Multi-currency transactions
export const multiCurrencyTransactions = pgTable("multi_currency_transactions", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  transactionId: varchar("transaction_id", { length: 36 }).notNull().references(() => transactions.id),
  originalCurrency: varchar("original_currency", { length: 3 }).notNull(),
  originalAmount: numeric("original_amount", { precision: 15, scale: 2 }).notNull(),
  exchangeRate: numeric("exchange_rate", { precision: 15, scale: 6 }).notNull(),
  baseCurrency: varchar("base_currency", { length: 3 }).default("USD").notNull(),
  baseAmount: numeric("base_amount", { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// E-commerce Integrations
export const ecommerceIntegrations = pgTable("ecommerce_integrations", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).notNull().references(() => companies.id),
  platform: text("platform").notNull(), // shopify, woocommerce, amazon, etc.
  platformId: text("platform_id"), // Store ID or similar
  accessToken: text("access_token"), // Encrypted
  refreshToken: text("refresh_token"), // Encrypted
  webhookSecret: text("webhook_secret"), // For webhook verification
  settings: text("settings"), // JSON configuration
  lastSyncAt: timestamp("last_sync_at"),
  status: text("status").default("active").notNull(), // active, paused, error
  createdBy: varchar("created_by", { length: 36 }).notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// E-commerce Orders (from integrated platforms)
export const ecommerceOrders = pgTable("ecommerce_orders", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  integrationId: varchar("integration_id", { length: 36 }).notNull().references(() => ecommerceIntegrations.id),
  platformOrderId: text("platform_order_id").notNull(),
  platformOrderNumber: text("platform_order_number"),
  customerEmail: text("customer_email"),
  customerName: text("customer_name"),
  orderDate: timestamp("order_date").notNull(),
  status: text("status").notNull(),
  subtotal: numeric("subtotal", { precision: 15, scale: 2 }),
  taxAmount: numeric("tax_amount", { precision: 15, scale: 2 }),
  shippingAmount: numeric("shipping_amount", { precision: 15, scale: 2 }),
  total: numeric("total", { precision: 15, scale: 2 }),
  currency: text("currency").default("USD"),
  items: text("items"), // JSON array of order items
  shippingAddress: text("shipping_address"), // JSON
  billingAddress: text("billing_address"), // JSON
  invoiceId: varchar("invoice_id", { length: 36 }).references(() => invoices.id),
  transactionId: varchar("transaction_id", { length: 36 }).references(() => transactions.id),
  syncedAt: timestamp("synced_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Automated Workflows
export const workflows = pgTable("workflows", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).notNull().references(() => companies.id),
  name: text("name").notNull(),
  description: text("description"),
  triggerType: text("trigger_type").notNull(), // invoice_created, payment_received, etc.
  triggerConfig: text("trigger_config"), // JSON configuration
  actions: text("actions"), // JSON array of actions to perform
  isActive: boolean("is_active").default(true).notNull(),
  createdBy: varchar("created_by", { length: 36 }).notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Workflow Executions
export const workflowExecutions = pgTable("workflow_executions", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  workflowId: varchar("workflow_id", { length: 36 }).notNull().references(() => workflows.id),
  triggerEntityType: text("trigger_entity_type"),
  triggerEntityId: varchar("trigger_entity_id", { length: 36 }),
  status: text("status").default("running").notNull(), // running, completed, failed
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  error: text("error"),
  result: text("result"), // JSON
});

export const workflowDefinitions = pgTable("workflow_definitions", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).notNull().references(() => companies.id),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdBy: varchar("created_by", { length: 36 }).notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const workflowDefinitionVersions = pgTable("workflow_definition_versions", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).notNull().references(() => companies.id),
  workflowDefinitionId: varchar("workflow_definition_id", { length: 36 }).notNull().references(() => workflowDefinitions.id),
  version: integer("version").notNull(),
  status: text("status").default("draft").notNull(),
  triggerEventType: text("trigger_event_type").notNull(),
  triggerEntityType: text("trigger_entity_type").notNull(),
  definitionJson: jsonb("definition_json").notNull(),
  metadataJson: jsonb("metadata_json"),
  createdBy: varchar("created_by", { length: 36 }).notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  publishedAt: timestamp("published_at"),
}, (table) => ({
  uniqueWorkflowDefinitionVersion: uniqueIndex("unique_workflow_definition_version").on(table.workflowDefinitionId, table.version),
}));

export const workflowInstances = pgTable("workflow_instances", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).notNull().references(() => companies.id),
  workflowDefinitionId: varchar("workflow_definition_id", { length: 36 }).notNull().references(() => workflowDefinitions.id),
  workflowDefinitionVersionId: varchar("workflow_definition_version_id", { length: 36 }).notNull().references(() => workflowDefinitionVersions.id),
  status: text("status").default("running").notNull(),
  currentStepKey: text("current_step_key"),
  currentStepIndex: integer("current_step_index").default(0).notNull(),
  triggerEventType: text("trigger_event_type").notNull(),
  triggerEntityType: text("trigger_entity_type").notNull(),
  triggerEntityId: varchar("trigger_entity_id", { length: 36 }),
  metadataJson: jsonb("metadata_json"),
  startedBy: varchar("started_by", { length: 36 }).references(() => users.id),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  canceledAt: timestamp("canceled_at"),
  error: text("error"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const workflowInstanceStepHistory = pgTable("workflow_instance_step_history", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).notNull().references(() => companies.id),
  workflowInstanceId: varchar("workflow_instance_id", { length: 36 }).notNull().references(() => workflowInstances.id),
  stepKey: text("step_key"),
  stepIndex: integer("step_index"),
  fromStatus: text("from_status"),
  toStatus: text("to_status"),
  eventType: text("event_type").notNull(),
  metadataJson: jsonb("metadata_json"),
  actorUserId: varchar("actor_user_id", { length: 36 }).references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workflowApprovals = pgTable("workflow_approvals", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).notNull().references(() => companies.id),
  workflowInstanceId: varchar("workflow_instance_id", { length: 36 }).notNull().references(() => workflowInstances.id),
  stepHistoryId: varchar("step_history_id", { length: 36 }).references(() => workflowInstanceStepHistory.id),
  requiredRole: text("required_role").notNull(),
  status: text("status").default("pending").notNull(),
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  requestedBy: varchar("requested_by", { length: 36 }).references(() => users.id),
  decidedAt: timestamp("decided_at"),
  decidedBy: varchar("decided_by", { length: 36 }).references(() => users.id),
  decisionReason: text("decision_reason"),
  metadataJson: jsonb("metadata_json"),
});

export const workflowTimers = pgTable("workflow_timers", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).notNull().references(() => companies.id),
  workflowInstanceId: varchar("workflow_instance_id", { length: 36 }).notNull().references(() => workflowInstances.id),
  timerKey: text("timer_key").notNull(),
  status: text("status").default("scheduled").notNull(),
  fireAt: timestamp("fire_at").notNull(),
  jobId: text("job_id"),
  firedAt: timestamp("fired_at"),
  canceledAt: timestamp("canceled_at"),
  metadataJson: jsonb("metadata_json"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workflowEventLog = pgTable("workflow_event_log", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).notNull().references(() => companies.id),
  eventType: text("event_type").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: varchar("entity_id", { length: 36 }),
  payloadJson: jsonb("payload_json"),
  source: text("source").default("system").notNull(),
  userId: varchar("user_id", { length: 36 }).references(() => users.id),
  correlationId: text("correlation_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Custom Reports
export const customReports = pgTable("custom_reports", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).notNull().references(() => companies.id),
  name: text("name").notNull(),
  description: text("description"),
  reportType: text("report_type").notNull(), // financial, operational, custom
  config: text("config"), // JSON report configuration
  columns: text("columns"), // JSON array of columns to display
  filters: text("filters"), // JSON filters configuration
  schedule: text("schedule"), // JSON scheduling configuration
  isPublic: boolean("is_public").default(false).notNull(),
  createdBy: varchar("created_by", { length: 36 }).notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Report Schedules
export const reportSchedules = pgTable("report_schedules", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  reportId: varchar("report_id", { length: 36 }).notNull().references(() => customReports.id),
  scheduleType: text("schedule_type").notNull(), // daily, weekly, monthly, quarterly
  scheduleConfig: text("schedule_config"), // JSON scheduling details
  recipients: text("recipients"), // JSON array of email addresses
  format: text("format").default("pdf").notNull(), // pdf, excel, csv
  isActive: boolean("is_active").default(true).notNull(),
  lastRunAt: timestamp("last_run_at"),
  nextRunAt: timestamp("next_run_at"),
  createdBy: varchar("created_by", { length: 36 }).notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Backup Jobs
export const backupJobs = pgTable("backup_jobs", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).notNull().references(() => companies.id),
  name: text("name").notNull(),
  backupType: text("backup_type").notNull(), // full, incremental, financial_only
  schedule: text("schedule"), // cron expression or interval
  destination: text("destination"), // local, s3, ftp, etc.
  config: text("config"), // JSON backup configuration
  lastRunAt: timestamp("last_run_at"),
  nextRunAt: timestamp("next_run_at"),
  status: text("status").default("scheduled").notNull(),
  createdBy: varchar("created_by", { length: 36 }).notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Audit Logs (immutable)
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).references(() => companies.id),
  userId: varchar("user_id", { length: 36 }).references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: varchar("entity_id", { length: 36 }).notNull(),
  changes: text("changes"), // JSON string
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const stripeWebhookEvents = pgTable("stripe_webhook_events", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  stripeEventId: text("stripe_event_id").notNull(),
  eventType: text("event_type").notNull(),
  receivedAt: timestamp("received_at").defaultNow().notNull(),
  status: text("status").default("processing").notNull(),
  processedAt: timestamp("processed_at"),
  error: text("error"),
}, (table) => ({
  uniqueStripeEventId: uniqueIndex("unique_stripe_event_id").on(table.stripeEventId),
}));

export const aiPricingConfig = pgTable("ai_pricing_config", {
  id: text("id").primaryKey(),
  pricePer1kTokensCents: integer("price_per_1k_tokens_cents").default(40).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const companyAiSettings = pgTable("company_ai_settings", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).notNull().references(() => companies.id),
  aiEnabled: boolean("ai_enabled").default(true).notNull(),
  bonusTokens: integer("bonus_tokens").default(0).notNull(),
  pricePer1kTokensCentsOverride: integer("price_per_1k_tokens_cents_override"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueCompanyAiSettings: uniqueIndex("unique_company_ai_settings").on(table.companyId),
}));

export const plans = pgTable("plans", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  priceCents: integer("price_cents").notNull(),
  currency: text("currency").default("USD").notNull(),
  billingInterval: planIntervalEnum("billing_interval").default("month").notNull(),
  stripeProductId: text("stripe_product_id"),
  stripePriceId: text("stripe_price_id"),
  includedUsers: integer("included_users").default(1).notNull(),
  includedInvoices: integer("included_invoices").default(50).notNull(),
  includedAiTokens: integer("included_ai_tokens").default(0).notNull(),
  includedApiCalls: integer("included_api_calls").default(0).notNull(),
  maxUsers: integer("max_users"),
  maxInvoices: integer("max_invoices"),
  maxAiTokens: integer("max_ai_tokens"),
  maxApiCalls: integer("max_api_calls"),
  allowApiAccess: boolean("allow_api_access").default(false).notNull(),
  allowAuditExports: boolean("allow_audit_exports").default(false).notNull(),
  allowAdvancedAnalytics: boolean("allow_advanced_analytics").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
}, (table) => ({
  uniquePlanCodeInterval: uniqueIndex("unique_plan_code_interval").on(table.code, table.billingInterval),
}));

export const subscriptions = pgTable("subscriptions", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).notNull().references(() => companies.id),
  planId: varchar("plan_id", { length: 36 }).notNull().references(() => plans.id),
  status: subscriptionStatusEnum("status").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  trialStart: timestamp("trial_start"),
  trialEnd: timestamp("trial_end"),
  canceledAt: timestamp("canceled_at"),
  pastDueSince: timestamp("past_due_since"),
  suspendedAt: timestamp("suspended_at"),
  ownerGrantedFree: boolean("owner_granted_free").default(false).notNull(),
  ownerNotes: text("owner_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
}, (table) => ({
  uniqueStripeSubscriptionId: uniqueIndex("unique_stripe_subscription_id").on(table.stripeSubscriptionId),
}));

export const billingInvoices = pgTable("billing_invoices", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).notNull().references(() => companies.id),
  subscriptionId: varchar("subscription_id", { length: 36 }).references(() => subscriptions.id),
  stripeInvoiceId: text("stripe_invoice_id"),
  status: billingInvoiceStatusEnum("status").notNull(),
  currency: text("currency").default("USD").notNull(),
  amountDueCents: integer("amount_due_cents").default(0).notNull(),
  amountPaidCents: integer("amount_paid_cents").default(0).notNull(),
  hostedInvoiceUrl: text("hosted_invoice_url"),
  invoicePdfUrl: text("invoice_pdf_url"),
  invoicePeriodStart: timestamp("invoice_period_start"),
  invoicePeriodEnd: timestamp("invoice_period_end"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
}, (table) => ({
  uniqueStripeInvoiceId: uniqueIndex("unique_stripe_invoice_id").on(table.stripeInvoiceId),
}));

export const billingPayments = pgTable("billing_payments", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).notNull().references(() => companies.id),
  billingInvoiceId: varchar("billing_invoice_id", { length: 36 }).references(() => billingInvoices.id),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeChargeId: text("stripe_charge_id"),
  status: billingPaymentStatusEnum("status").notNull(),
  amountCents: integer("amount_cents").default(0).notNull(),
  currency: text("currency").default("USD").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
}, (table) => ({
  uniqueStripePaymentIntentId: uniqueIndex("unique_stripe_payment_intent_id").on(table.stripePaymentIntentId),
}));

// Alias for billPayments to maintain compatibility with APService
export const billPayments = billingPayments;

export const usageMetrics = pgTable("usage_metrics", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).notNull().references(() => companies.id),
  subscriptionId: varchar("subscription_id", { length: 36 }).references(() => subscriptions.id),
  metricType: usageMetricTypeEnum("metric_type").notNull(),
  billingPeriodStart: timestamp("billing_period_start").notNull(),
  billingPeriodEnd: timestamp("billing_period_end").notNull(),
  quantity: numeric("quantity", { precision: 20, scale: 0 }).default("0").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueMetricPeriod: uniqueIndex("unique_usage_metric_period").on(
    table.companyId,
    table.metricType,
    table.billingPeriodStart,
    table.billingPeriodEnd,
  ),
}));

export const onboardingRuns = pgTable("onboarding_runs", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).notNull().references(() => companies.id),
  adminUserId: varchar("admin_user_id", { length: 36 }).notNull().references(() => users.id),
  steps: jsonb("steps").notNull(),
  status: text("status").default("in_progress").notNull(),
  integrityHash: text("integrity_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueCompanyOnboardingRun: uniqueIndex("unique_company_onboarding_run").on(table.companyId),
}));

export const aiUsageLogs = pgTable("ai_usage_logs", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).notNull().references(() => companies.id),
  userId: varchar("user_id", { length: 36 }).references(() => users.id),
  feature: text("feature").notNull(),
  model: text("model"),
  promptTokens: integer("prompt_tokens").default(0).notNull(),
  completionTokens: integer("completion_tokens").default(0).notNull(),
  totalTokens: integer("total_tokens").default(0).notNull(),
  providerCostCents: integer("provider_cost_cents").default(0).notNull(),
  billedCents: integer("billed_cents").default(0).notNull(),
  requestId: text("request_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueAiRequestId: uniqueIndex("unique_ai_usage_request_id").on(table.requestId),
}));

// Relations for Payroll Module
export const employeesRelations = relations(employees, ({ one, many }) => ({
  company: one(companies, {
    fields: [employees.companyId],
    references: [companies.id],
  }),
  manager: one(employees, {
    fields: [employees.managerId],
    references: [employees.id],
  }),
  deductions: many(employeeDeductions),
  timeEntries: many(timeEntries),
  payRunDetails: many(payRunDetails),
  taxForms: many(taxForms),
}));

export const deductionsRelations = relations(deductions, ({ one, many }) => ({
  company: one(companies, {
    fields: [deductions.companyId],
    references: [companies.id],
  }),
  employeeDeductions: many(employeeDeductions),
  payRunDeductions: many(payRunDeductions),
}));

export const employeeDeductionsRelations = relations(employeeDeductions, ({ one }) => ({
  employee: one(employees, {
    fields: [employeeDeductions.employeeId],
    references: [employees.id],
  }),
  deduction: one(deductions, {
    fields: [employeeDeductions.deductionId],
    references: [deductions.id],
  }),
}));

export const payrollPeriodsRelations = relations(payrollPeriods, ({ one, many }) => ({
  company: one(companies, {
    fields: [payrollPeriods.companyId],
    references: [companies.id],
  }),
  timeEntries: many(timeEntries),
  payRuns: many(payRuns),
}));

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  employee: one(employees, {
    fields: [timeEntries.employeeId],
    references: [employees.id],
  }),
  payrollPeriod: one(payrollPeriods, {
    fields: [timeEntries.payrollPeriodId],
    references: [payrollPeriods.id],
  }),
  approvedBy: one(users, {
    fields: [timeEntries.approvedBy],
    references: [users.id],
  }),
  createdBy: one(users, {
    fields: [timeEntries.createdBy],
    references: [users.id],
  }),
}));

export const payRunsRelations = relations(payRuns, ({ one, many }) => ({
  company: one(companies, {
    fields: [payRuns.companyId],
    references: [companies.id],
  }),
  payrollPeriod: one(payrollPeriods, {
    fields: [payRuns.payrollPeriodId],
    references: [payrollPeriods.id],
  }),
  processedBy: one(users, {
    fields: [payRuns.processedBy],
    references: [users.id],
  }),
  createdBy: one(users, {
    fields: [payRuns.createdBy],
    references: [users.id],
  }),
  details: many(payRunDetails),
  transactions: many(payrollTransactions),
}));

export const payRunDetailsRelations = relations(payRunDetails, ({ one, many }) => ({
  payRun: one(payRuns, {
    fields: [payRunDetails.payRunId],
    references: [payRuns.id],
  }),
  employee: one(employees, {
    fields: [payRunDetails.employeeId],
    references: [employees.id],
  }),
  deductions: many(payRunDeductions),
}));

export const payRunDeductionsRelations = relations(payRunDeductions, ({ one }) => ({
  payRunDetail: one(payRunDetails, {
    fields: [payRunDeductions.payRunDetailId],
    references: [payRunDetails.id],
  }),
  deduction: one(deductions, {
    fields: [payRunDeductions.deductionId],
    references: [deductions.id],
  }),
  employee: one(employees, {
    fields: [payRunDeductions.employeeId],
    references: [employees.id],
  }),
}));

export const taxFormsRelations = relations(taxForms, ({ one }) => ({
  company: one(companies, {
    fields: [taxForms.companyId],
    references: [companies.id],
  }),
  employee: one(employees, {
    fields: [taxForms.employeeId],
    references: [employees.id],
  }),
  filedBy: one(users, {
    fields: [taxForms.filedBy],
    references: [users.id],
  }),
}));

export const payrollTransactionsRelations = relations(payrollTransactions, ({ one }) => ({
  company: one(companies, {
    fields: [payrollTransactions.companyId],
    references: [companies.id],
  }),
  payRun: one(payRuns, {
    fields: [payrollTransactions.payRunId],
    references: [payRuns.id],
  }),
  transaction: one(transactions, {
    fields: [payrollTransactions.transactionId],
    references: [transactions.id],
  }),
}));

// Relations for Inventory Module
export const inventoryItemsRelations = relations(inventoryItems, ({ one, many }) => ({
  company: one(companies, {
    fields: [inventoryItems.companyId],
    references: [companies.id],
  }),
  supplier: one(vendors, {
    fields: [inventoryItems.supplierId],
    references: [vendors.id],
  }),
  costAccount: one(accounts, {
    fields: [inventoryItems.costAccountId],
    references: [accounts.id],
  }),
  salesAccount: one(accounts, {
    fields: [inventoryItems.salesAccountId],
    references: [accounts.id],
  }),
  inventoryAccount: one(accounts, {
    fields: [inventoryItems.inventoryAccountId],
    references: [accounts.id],
  }),
  purchaseOrderItems: many(purchaseOrderItems),
  adjustments: many(inventoryAdjustments),
  transactions: many(inventoryTransactions),
  balances: many(inventoryBalances),
}));

export const inventoryTransactionsRelations = relations(inventoryTransactions, ({ one }) => ({
  item: one(inventoryItems, {
    fields: [inventoryTransactions.itemId],
    references: [inventoryItems.id],
  }),
}));

export const inventoryBalancesRelations = relations(inventoryBalances, ({ one }) => ({
  item: one(inventoryItems, {
    fields: [inventoryBalances.itemId],
    references: [inventoryItems.id],
  }),
}));

export const inventoryLocationsRelations = relations(inventoryLocations, ({ one, many }) => ({
  company: one(companies, {
    fields: [inventoryLocations.companyId],
    references: [companies.id],
  }),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  company: one(companies, {
    fields: [purchaseOrders.companyId],
    references: [companies.id],
  }),
  vendor: one(vendors, {
    fields: [purchaseOrders.vendorId],
    references: [vendors.id],
  }),
  createdBy: one(users, {
    fields: [purchaseOrders.createdBy],
    references: [users.id],
  }),
  items: many(purchaseOrderItems),
}));

export const creditMemosRelations = relations(creditMemos, ({ one, many }) => ({
  company: one(companies, {
    fields: [creditMemos.companyId],
    references: [companies.id],
  }),
  customer: one(customers, {
    fields: [creditMemos.customerId],
    references: [customers.id],
  }),
  applications: many(creditMemoApplications),
}));

export const creditMemoApplicationsRelations = relations(creditMemoApplications, ({ one }) => ({
  creditMemo: one(creditMemos, {
    fields: [creditMemoApplications.creditMemoId],
    references: [creditMemos.id],
  }),
  invoice: one(invoices, {
    fields: [creditMemoApplications.invoiceId],
    references: [invoices.id],
  }),
}));

export const writeOffsRelations = relations(writeOffs, ({ one }) => ({
  company: one(companies, {
    fields: [writeOffs.companyId],
    references: [companies.id],
  }),
  customer: one(customers, {
    fields: [writeOffs.customerId],
    references: [customers.id],
  }),
  invoice: one(invoices, {
    fields: [writeOffs.invoiceId],
    references: [invoices.id],
  }),
}));

export const vendor1099PaymentsRelations = relations(vendor1099Payments, ({ one }) => ({
  vendor: one(vendors, {
    fields: [vendor1099Payments.vendorId],
    references: [vendors.id],
  }),
}));

export const purchaseOrderItemsRelations = relations(purchaseOrderItems, ({ one }) => ({
  purchaseOrder: one(purchaseOrders, {
    fields: [purchaseOrderItems.purchaseOrderId],
    references: [purchaseOrders.id],
  }),
  inventoryItem: one(inventoryItems, {
    fields: [purchaseOrderItems.inventoryItemId],
    references: [inventoryItems.id],
  }),
}));

export const inventoryAdjustmentsRelations = relations(inventoryAdjustments, ({ one }) => ({
  company: one(companies, {
    fields: [inventoryAdjustments.companyId],
    references: [companies.id],
  }),
  inventoryItem: one(inventoryItems, {
    fields: [inventoryAdjustments.inventoryItemId],
    references: [inventoryItems.id],
  }),
  createdBy: one(users, {
    fields: [inventoryAdjustments.createdBy],
    references: [users.id],
  }),
  transaction: one(transactions, {
    fields: [inventoryAdjustments.transactionId],
    references: [transactions.id],
  }),
}));

// Relations for Enterprise Features
export const projectsRelations = relations(projects, ({ one, many }) => ({
  company: one(companies, {
    fields: [projects.companyId],
    references: [companies.id],
  }),
  client: one(customers, {
    fields: [projects.clientId],
    references: [customers.id],
  }),
  projectManager: one(users, {
    fields: [projects.projectManagerId],
    references: [users.id],
  }),
  timeEntries: many(projectTimeEntries),
}));

export const projectTimeEntriesRelations = relations(projectTimeEntries, ({ one }) => ({
  project: one(projects, {
    fields: [projectTimeEntries.projectId],
    references: [projects.id],
  }),
  employee: one(employees, {
    fields: [projectTimeEntries.employeeId],
    references: [employees.id],
  }),
  invoice: one(invoices, {
    fields: [projectTimeEntries.invoiceId],
    references: [invoices.id],
  }),
  createdBy: one(users, {
    fields: [projectTimeEntries.createdBy],
    references: [users.id],
  }),
}));

export const budgetsRelations = relations(budgets, ({ one, many }) => ({
  company: one(companies, {
    fields: [budgets.companyId],
    references: [companies.id],
  }),
  createdBy: one(users, {
    fields: [budgets.createdBy],
    references: [users.id],
  }),
  categories: many(budgetCategories),
}));

export const budgetCategoriesRelations = relations(budgetCategories, ({ one }) => ({
  budget: one(budgets, {
    fields: [budgetCategories.budgetId],
    references: [budgets.id],
  }),
  account: one(accounts, {
    fields: [budgetCategories.accountId],
    references: [accounts.id],
  }),
}));

export const mileageEntriesRelations = relations(mileageEntries, ({ one }) => ({
  company: one(companies, {
    fields: [mileageEntries.companyId],
    references: [companies.id],
  }),
  employee: one(employees, {
    fields: [mileageEntries.employeeId],
    references: [employees.id],
  }),
  vehicle: one(vehicles, {
    fields: [mileageEntries.vehicleId],
    references: [vehicles.id],
  }),
  approvedBy: one(users, {
    fields: [mileageEntries.approvedBy],
    references: [users.id],
  }),
  createdBy: one(users, {
    fields: [mileageEntries.createdBy],
    references: [users.id],
  }),
}));

export const vehiclesRelations = relations(vehicles, ({ one }) => ({
  company: one(companies, {
    fields: [vehicles.companyId],
    references: [companies.id],
  }),
  employee: one(employees, {
    fields: [vehicles.employeeId],
    references: [employees.id],
  }),
}));

export const multiCurrencyTransactionsRelations = relations(multiCurrencyTransactions, ({ one }) => ({
  transaction: one(transactions, {
    fields: [multiCurrencyTransactions.transactionId],
    references: [transactions.id],
  }),
}));

export const ecommerceIntegrationsRelations = relations(ecommerceIntegrations, ({ one, many }) => ({
  company: one(companies, {
    fields: [ecommerceIntegrations.companyId],
    references: [companies.id],
  }),
  createdBy: one(users, {
    fields: [ecommerceIntegrations.createdBy],
    references: [users.id],
  }),
  orders: many(ecommerceOrders),
}));

export const ecommerceOrdersRelations = relations(ecommerceOrders, ({ one }) => ({
  integration: one(ecommerceIntegrations, {
    fields: [ecommerceOrders.integrationId],
    references: [ecommerceIntegrations.id],
  }),
  invoice: one(invoices, {
    fields: [ecommerceOrders.invoiceId],
    references: [invoices.id],
  }),
  transaction: one(transactions, {
    fields: [ecommerceOrders.transactionId],
    references: [transactions.id],
  }),
}));

export const workflowsRelations = relations(workflows, ({ one, many }) => ({
  company: one(companies, {
    fields: [workflows.companyId],
    references: [companies.id],
  }),
  createdBy: one(users, {
    fields: [workflows.createdBy],
    references: [users.id],
  }),
  executions: many(workflowExecutions),
}));

export const workflowExecutionsRelations = relations(workflowExecutions, ({ one }) => ({
  workflow: one(workflows, {
    fields: [workflowExecutions.workflowId],
    references: [workflows.id],
  }),
}));

export const customReportsRelations = relations(customReports, ({ one, many }) => ({
  company: one(companies, {
    fields: [customReports.companyId],
    references: [companies.id],
  }),
  createdBy: one(users, {
    fields: [customReports.createdBy],
    references: [users.id],
  }),
  schedules: many(reportSchedules),
}));

export const reportSchedulesRelations = relations(reportSchedules, ({ one }) => ({
  report: one(customReports, {
    fields: [reportSchedules.reportId],
    references: [customReports.id],
  }),
  createdBy: one(users, {
    fields: [reportSchedules.createdBy],
    references: [users.id],
  }),
}));

export const backupJobsRelations = relations(backupJobs, ({ one }) => ({
  company: one(companies, {
    fields: [backupJobs.companyId],
    references: [companies.id],
  }),
  createdBy: one(users, {
    fields: [backupJobs.createdBy],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  company: one(companies, {
    fields: [auditLogs.companyId],
    references: [companies.id],
  }),
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

// Insert Schemas
export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export const insertDeductionSchema = createInsertSchema(deductions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export const insertEmployeeDeductionSchema = createInsertSchema(employeeDeductions).omit({
  id: true,
  createdAt: true
});
export const insertPayrollPeriodSchema = createInsertSchema(payrollPeriods).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export const insertTimeEntrySchema = createInsertSchema(timeEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export const insertPayRunSchema = createInsertSchema(payRuns).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export const insertPayRunDetailSchema = createInsertSchema(payRunDetails).omit({
  id: true,
  createdAt: true
});
export const insertPayRunDeductionSchema = createInsertSchema(payRunDeductions).omit({
  id: true,
  createdAt: true
});
export const insertTaxFormSchema = createInsertSchema(taxForms).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export const insertPayrollTransactionSchema = createInsertSchema(payrollTransactions).omit({
  id: true,
  createdAt: true
});
export const insertInventoryItemSchema = createInsertSchema(inventoryItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export const insertPurchaseOrderItemSchema = createInsertSchema(purchaseOrderItems).omit({
  id: true,
  createdAt: true
});
export const insertInventoryAdjustmentSchema = createInsertSchema(inventoryAdjustments).omit({
  id: true,
  createdAt: true
});

// Insert schemas for new enterprise features
export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertProjectTimeEntrySchema = createInsertSchema(projectTimeEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertBudgetSchema = createInsertSchema(budgets).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertBudgetCategorySchema = createInsertSchema(budgetCategories).omit({
  id: true,
  createdAt: true
});

export const insertMileageEntrySchema = createInsertSchema(mileageEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertVehicleSchema = createInsertSchema(vehicles).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertCurrencySchema = createInsertSchema(currencies).omit({
  id: true,
  createdAt: true
});

export const insertExchangeRateSchema = createInsertSchema(exchangeRates).omit({
  id: true,
  createdAt: true
});

export const insertMultiCurrencyTransactionSchema = createInsertSchema(multiCurrencyTransactions).omit({
  id: true,
  createdAt: true
});

export const insertEcommerceIntegrationSchema = createInsertSchema(ecommerceIntegrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertEcommerceOrderSchema = createInsertSchema(ecommerceOrders).omit({
  id: true,
  createdAt: true
});

export const insertWorkflowSchema = createInsertSchema(workflows).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertWorkflowExecutionSchema = createInsertSchema(workflowExecutions).omit({
  id: true,
  startedAt: true
});

export const insertCustomReportSchema = createInsertSchema(customReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertReportScheduleSchema = createInsertSchema(reportSchedules).omit({
  id: true,
  createdAt: true
});

export const insertBackupJobSchema = createInsertSchema(backupJobs).omit({
  id: true,
  createdAt: true
});

// Insert schemas for all tables
export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Create a base user schema and then extend it
export const baseUserSchema = createInsertSchema(users);

export const insertUserSchema = baseUserSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  // Add any additional validation or transformation here
});

export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertVendorSchema = createInsertSchema(vendors).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertTransactionLineSchema = createInsertSchema(transactionLines).omit({
  id: true,
  createdAt: true,
  transactionId: true
});

export const insertAccountingPeriodSchema = createInsertSchema(accountingPeriods).omit({
  id: true,
  createdAt: true,
});

export const insertAccountingPeriodLockSchema = createInsertSchema(accountingPeriodLocks).omit({
  id: true,
  createdAt: true,
});

// Create a base invoice schema and then extend it
export const baseInvoiceSchema = createInsertSchema(invoices);

export const insertInvoiceSchema = baseInvoiceSchema.omit({
  id: true,
  invoiceNumber: true,
  createdAt: true,
  updatedAt: true
}).extend({
  // Add any additional validation or transformation here
});

export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({
  id: true,
  createdAt: true
});

// Create a base payment schema and then extend it
export const basePaymentSchema = createInsertSchema(payments);

export const insertPaymentSchema = basePaymentSchema.omit({
    id: true,
    createdAt: true
  }).extend({
    // Add any additional validation or transformation here
  });

export const insertBankTransactionSchema = createInsertSchema(bankTransactions).omit({
  id: true,
  isReconciled: true,
  reconciledAt: true,
  createdAt: true
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true
});

export const insertStripeWebhookEventSchema = createInsertSchema(stripeWebhookEvents).omit({
  id: true,
  receivedAt: true,
  processedAt: true
});

export const insertOnboardingRunSchema = createInsertSchema(onboardingRuns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiPricingConfigSchema = createInsertSchema(aiPricingConfig).omit({
  updatedAt: true
});

export const insertCompanyAiSettingsSchema = createInsertSchema(companyAiSettings).omit({
  id: true,
  updatedAt: true
});

export const insertPlanSchema = createInsertSchema(plans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true
});

export const insertBillingInvoiceSchema = createInsertSchema(billingInvoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true
});

export const insertBillingPaymentSchema = createInsertSchema(billingPayments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true
});

export const insertUsageMetricSchema = createInsertSchema(usageMetrics).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertAiUsageLogSchema = createInsertSchema(aiUsageLogs).omit({
  id: true,
  createdAt: true
});

export const insertWorkflowDefinitionSchema = createInsertSchema(workflowDefinitions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkflowDefinitionVersionSchema = createInsertSchema(workflowDefinitionVersions).omit({
  id: true,
  createdAt: true,
});

export const insertWorkflowInstanceSchema = createInsertSchema(workflowInstances).omit({
  id: true,
  startedAt: true,
  updatedAt: true,
});

export const insertWorkflowInstanceStepHistorySchema = createInsertSchema(workflowInstanceStepHistory).omit({
  id: true,
  createdAt: true,
});

export const insertWorkflowApprovalSchema = createInsertSchema(workflowApprovals).omit({
  id: true,
  requestedAt: true,
});

export const insertWorkflowTimerSchema = createInsertSchema(workflowTimers).omit({
  id: true,
  createdAt: true,
});

export const insertWorkflowEventLogSchema = createInsertSchema(workflowEventLog).omit({
  id: true,
  createdAt: true,
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

export type StripeWebhookEvent = typeof stripeWebhookEvents.$inferSelect;
export type InsertStripeWebhookEvent = z.infer<typeof insertStripeWebhookEventSchema>;

export type OnboardingRun = typeof onboardingRuns.$inferSelect;
export type InsertOnboardingRun = z.infer<typeof insertOnboardingRunSchema>;

export type AiPricingConfig = typeof aiPricingConfig.$inferSelect;
export type InsertAiPricingConfig = z.infer<typeof insertAiPricingConfigSchema>;

export type CompanyAiSettings = typeof companyAiSettings.$inferSelect;
export type InsertCompanyAiSettings = z.infer<typeof insertCompanyAiSettingsSchema>;

export type Plan = typeof plans.$inferSelect;
export type InsertPlan = z.infer<typeof insertPlanSchema>;

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

export type BillingInvoice = typeof billingInvoices.$inferSelect;
export type InsertBillingInvoice = z.infer<typeof insertBillingInvoiceSchema>;

export type BillingPayment = typeof billingPayments.$inferSelect;
export type InsertBillingPayment = z.infer<typeof insertBillingPaymentSchema>;

export type UsageMetric = typeof usageMetrics.$inferSelect;
export type InsertUsageMetric = z.infer<typeof insertUsageMetricSchema>;

export type AiUsageLog = typeof aiUsageLogs.$inferSelect;
export type InsertAiUsageLog = z.infer<typeof insertAiUsageLogSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type TransactionLine = typeof transactionLines.$inferSelect;
export type InsertTransactionLine = z.infer<typeof insertTransactionLineSchema>;

export type AccountingPeriod = typeof accountingPeriods.$inferSelect;
export type InsertAccountingPeriod = z.infer<typeof insertAccountingPeriodSchema>;

export type AccountingPeriodLock = typeof accountingPeriodLocks.$inferSelect;
export type InsertAccountingPeriodLock = z.infer<typeof insertAccountingPeriodLockSchema>;

export type WorkflowDefinition = typeof workflowDefinitions.$inferSelect;
export type InsertWorkflowDefinition = z.infer<typeof insertWorkflowDefinitionSchema>;

export type WorkflowDefinitionVersion = typeof workflowDefinitionVersions.$inferSelect;
export type InsertWorkflowDefinitionVersion = z.infer<typeof insertWorkflowDefinitionVersionSchema>;

export type WorkflowInstance = typeof workflowInstances.$inferSelect;
export type InsertWorkflowInstance = z.infer<typeof insertWorkflowInstanceSchema>;

export type WorkflowInstanceStepHistory = typeof workflowInstanceStepHistory.$inferSelect;
export type InsertWorkflowInstanceStepHistory = z.infer<typeof insertWorkflowInstanceStepHistorySchema>;

export type WorkflowApproval = typeof workflowApprovals.$inferSelect;
export type InsertWorkflowApproval = z.infer<typeof insertWorkflowApprovalSchema>;

export type WorkflowTimer = typeof workflowTimers.$inferSelect;
export type InsertWorkflowTimer = z.infer<typeof insertWorkflowTimerSchema>;

// Decision Memory tables
export const decisionMemory = pgTable("decision_memory", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id", { length: 36 }).notNull(),
  companyId: varchar("company_id", { length: 36 }).notNull().references(() => companies.id),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  userRole: roleEnum("user_role").notNull(),
  
  // Decision metadata
  decisionType: decisionTypeEnum("decision_type").notNull(),
  status: decisionStatusEnum("status").default("proposed").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  rationale: text("rationale"), // User-provided reasoning
  
  // Ledger linkage
  ledgerSnapshotHash: text("ledger_snapshot_hash").notNull(), // Hash of ledger state at decision time
  ledgerTransactionCount: integer("ledger_transaction_count").notNull(),
  ledgerDateRange: jsonb("ledger_date_range").notNull(), // { start, end }
  
  // Signal context
  triggeredBySignals: jsonb("triggered_by_signals"), // Array of signal IDs that triggered this decision
  signalSnapshot: jsonb("signal_snapshot"), // Full signal data at decision time
  
  // Scenario linkage (if applicable)
  scenarioId: text("scenario_id"), // Links to scenario execution
  scenarioAssumptions: jsonb("scenario_assumptions"), // Assumptions made
  scenarioProjections: jsonb("scenario_projections"), // Expected outcomes
  
  // Financial impact
  expectedImpact: jsonb("expected_impact"), // { revenue, expenses, margin, cashRunway }
  actualImpact: jsonb("actual_impact"), // Filled in after monitoring period
  variance: jsonb("variance"), // Expected vs actual
  
  // Approval workflow
  approvedBy: varchar("approved_by", { length: 36 }).references(() => users.id),
  approvedAt: timestamp("approved_at"),
  executedAt: timestamp("executed_at"),
  completedAt: timestamp("completed_at"),
  
  // Cryptographic verification
  decisionHash: text("decision_hash").notNull(), // SHA-256 of decision data
  previousDecisionHash: text("previous_decision_hash"), // Chain to previous decision
  
  // Metadata
  tags: jsonb("tags"), // Array of tags for categorization
  attachments: jsonb("attachments"), // Links to supporting documents
  
  // Immutability
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // No updatedAt - decisions are immutable once created
}, (table) => ({
  companyIdx: uniqueIndex("decision_memory_company_idx").on(table.companyId, table.createdAt),
  tenantIdx: uniqueIndex("decision_memory_tenant_idx").on(table.tenantId, table.createdAt),
  userIdx: uniqueIndex("decision_memory_user_idx").on(table.userId, table.createdAt),
}));

export const decisionMemoryUpdates = pgTable("decision_memory_updates", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  decisionId: varchar("decision_id", { length: 36 }).notNull().references(() => decisionMemory.id),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  updateType: text("update_type").notNull(), // "status_change", "variance_update", "outcome_recorded"
  previousValue: jsonb("previous_value"),
  newValue: jsonb("new_value"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const decisionMemoryAccess = pgTable("decision_memory_access", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  decisionId: varchar("decision_id", { length: 36 }).notNull().references(() => decisionMemory.id),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  accessType: text("access_type").notNull(), // "view", "export", "audit"
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  accessedAt: timestamp("accessed_at").defaultNow().notNull(),
});

export type WorkflowEventLog = typeof workflowEventLog.$inferSelect;
export type InsertWorkflowEventLog = z.infer<typeof insertWorkflowEventLogSchema>;

export const insertDecisionMemorySchema = createInsertSchema(decisionMemory).omit({
  id: true,
  createdAt: true,
});

export const insertDecisionMemoryUpdateSchema = createInsertSchema(decisionMemoryUpdates).omit({
  id: true,
  createdAt: true,
});

export const insertDecisionMemoryAccessSchema = createInsertSchema(decisionMemoryAccess).omit({
  id: true,
  accessedAt: true,
});

export type DecisionMemory = typeof decisionMemory.$inferSelect;
export type InsertDecisionMemory = z.infer<typeof insertDecisionMemorySchema>;

export type DecisionMemoryUpdate = typeof decisionMemoryUpdates.$inferSelect;
export type InsertDecisionMemoryUpdate = z.infer<typeof insertDecisionMemoryUpdateSchema>;

export type DecisionMemoryAccess = typeof decisionMemoryAccess.$inferSelect;
export type InsertDecisionMemoryAccess = z.infer<typeof insertDecisionMemoryAccessSchema>;

// Risk Radar tables
export const riskSignals = pgTable("risk_signals", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id", { length: 36 }).notNull(),
  companyId: varchar("company_id", { length: 36 }).notNull().references(() => companies.id),
  
  // Signal metadata
  signalType: riskSignalTypeEnum("signal_type").notNull(),
  severity: riskSeverityEnum("severity").notNull(),
  status: riskStatusEnum("status").default("active").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  
  // Detection context
  detectedAt: timestamp("detected_at").defaultNow().notNull(),
  detectionPeriod: jsonb("detection_period").notNull(), // { start, end }
  
  // Contributing data
  contributingTransactions: jsonb("contributing_transactions"), // Array of transaction IDs
  contributingAccounts: jsonb("contributing_accounts"), // Array of account IDs
  affectedMetrics: jsonb("affected_metrics"), // { metric, expected, actual, variance }
  
  // Root cause analysis
  rootCause: text("root_cause").notNull(), // Narrative explanation
  evidence: jsonb("evidence").notNull(), // Ledger proof
  
  // Thresholds and detection logic
  detectionThreshold: jsonb("detection_threshold"), // { metric, threshold, actual }
  historicalBaseline: jsonb("historical_baseline"), // { metric, average, stdDev }
  
  // Recommendations
  recommendedActions: jsonb("recommended_actions"), // Array of action objects
  mitigationScenarios: jsonb("mitigation_scenarios"), // Array of scenario IDs
  
  // Acknowledgment tracking
  acknowledgedBy: varchar("acknowledged_by", { length: 36 }).references(() => users.id),
  acknowledgedAt: timestamp("acknowledged_at"),
  acknowledgmentNotes: text("acknowledgment_notes"),
  
  // Resolution tracking
  resolvedBy: varchar("resolved_by", { length: 36 }).references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  resolutionNotes: text("resolution_notes"),
  resolutionDecisionId: varchar("resolution_decision_id", { length: 36 }).references(() => decisionMemory.id),
  
  // Cryptographic verification
  signalHash: text("signal_hash").notNull(), // SHA-256 of signal data
  ledgerSnapshotHash: text("ledger_snapshot_hash").notNull(), // Ledger state at detection
  
  // Metadata
  tags: jsonb("tags"),
  metadata: jsonb("metadata"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  companyIdx: uniqueIndex("risk_signals_company_idx").on(table.companyId, table.detectedAt),
  statusIdx: uniqueIndex("risk_signals_status_idx").on(table.status, table.severity),
  typeIdx: uniqueIndex("risk_signals_type_idx").on(table.signalType, table.companyId),
}));

export const riskSignalUpdates = pgTable("risk_signal_updates", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  signalId: varchar("signal_id", { length: 36 }).notNull().references(() => riskSignals.id),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  updateType: text("update_type").notNull(), // "status_change", "acknowledgment", "resolution", "escalation"
  previousValue: jsonb("previous_value"),
  newValue: jsonb("new_value"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const riskSignalAccess = pgTable("risk_signal_access", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  signalId: varchar("signal_id", { length: 36 }).notNull().references(() => riskSignals.id),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  accessType: text("access_type").notNull(), // "view", "acknowledge", "resolve", "export"
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  accessedAt: timestamp("accessed_at").defaultNow().notNull(),
});

export const insertRiskSignalSchema = createInsertSchema(riskSignals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRiskSignalUpdateSchema = createInsertSchema(riskSignalUpdates).omit({
  id: true,
  createdAt: true,
});

export const insertRiskSignalAccessSchema = createInsertSchema(riskSignalAccess).omit({
  id: true,
  accessedAt: true,
});

export type RiskSignal = typeof riskSignals.$inferSelect;
export type InsertRiskSignal = z.infer<typeof insertRiskSignalSchema>;

export type RiskSignalUpdate = typeof riskSignalUpdates.$inferSelect;
export type InsertRiskSignalUpdate = z.infer<typeof insertRiskSignalUpdateSchema>;

export type RiskSignalAccess = typeof riskSignalAccess.$inferSelect;
export type InsertRiskSignalAccess = z.infer<typeof insertRiskSignalAccessSchema>;

// ========================================
// BANK FEEDS & RECONCILIATION TABLES
// ========================================

export const bankFeedConnections = pgTable("bank_feed_connections", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).notNull().references(() => companies.id),
  accountId: varchar("account_id", { length: 36 }).notNull().references(() => accounts.id),
  bankName: text("bank_name").notNull(),
  accountNumberMask: text("account_number_mask").notNull(),
  status: text("status").default("active").notNull(), // active, disconnected, error
  lastSyncAt: timestamp("last_sync_at"),
  lastSyncStatus: text("last_sync_status"), // success, error
  errorMessage: text("error_message"),
  provider: text("provider").notNull(), // plaid, yodlee, finicity, manual
  providerAccessToken: text("provider_access_token"),
  providerItemId: text("provider_item_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const categorizationRules = pgTable("categorization_rules", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).notNull().references(() => companies.id),
  name: text("name").notNull(),
  descriptionPattern: text("description_pattern"), // regex pattern
  payeePattern: text("payee_pattern"), // regex pattern
  minAmount: numeric("min_amount", { precision: 15, scale: 2 }),
  maxAmount: numeric("max_amount", { precision: 15, scale: 2 }),
  accountId: varchar("account_id", { length: 36 }).notNull().references(() => accounts.id),
  priority: integer("priority").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations for Bank Feed tables
export const bankFeedConnectionsRelations = relations(bankFeedConnections, ({ one }) => ({
  company: one(companies, {
    fields: [bankFeedConnections.companyId],
    references: [companies.id],
  }),
  account: one(accounts, {
    fields: [bankFeedConnections.accountId],
    references: [accounts.id],
  }),
}));

export const categorizationRulesRelations = relations(categorizationRules, ({ one }) => ({
  company: one(companies, {
    fields: [categorizationRules.companyId],
    references: [companies.id],
  }),
  account: one(accounts, {
    fields: [categorizationRules.accountId],
    references: [accounts.id],
  }),
}));

// Insert schemas for bank feed tables
export const insertBankFeedConnectionSchema = createInsertSchema(bankFeedConnections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCategorizationRuleSchema = createInsertSchema(categorizationRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types for bank feed tables
export type BankFeedConnection = typeof bankFeedConnections.$inferSelect;
export type InsertBankFeedConnection = z.infer<typeof insertBankFeedConnectionSchema>;

export type CategorizationRule = typeof categorizationRules.$inferSelect;
export type InsertCategorizationRule = z.infer<typeof insertCategorizationRuleSchema>;

// ========================================
// RECURRING INVOICES (Phase 2 - AR System)
// ========================================

export const recurringInvoices = pgTable("recurring_invoices", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).notNull().references(() => companies.id),
  customerId: varchar("customer_id", { length: 36 }).notNull().references(() => customers.id),
  templateName: text("template_name").notNull(),
  description: text("description"),
  status: text("status").default("active").notNull(), // active, paused, cancelled
  
  // Schedule configuration
  frequency: text("frequency").notNull(), // daily, weekly, biweekly, monthly, quarterly, yearly
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  nextRunDate: timestamp("next_run_date").notNull(),
  lastRunDate: timestamp("last_run_date"),
  maxOccurrences: integer("max_occurrences"),
  occurrenceCount: integer("occurrence_count").default(0).notNull(),
  
  // Invoice template (stored as JSON)
  lineItems: jsonb("line_items").notNull().default("[]"),
  subtotal: numeric("subtotal", { precision: 15, scale: 2 }).notNull(),
  taxRate: numeric("tax_rate", { precision: 5, scale: 4 }).default("0"),
  taxAmount: numeric("tax_amount", { precision: 15, scale: 2 }).default("0"),
  total: numeric("total", { precision: 15, scale: 2 }).notNull(),
  currency: text("currency").default("USD").notNull(),
  
  // Settings
  autoSend: boolean("auto_send").default(false).notNull(),
  paymentTerms: text("payment_terms").default("Net 30"),
  dueDateOffset: integer("due_date_offset").default(30).notNull(),
  memo: text("memo"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const recurringInvoicesRelations = relations(recurringInvoices, ({ one }) => ({
  company: one(companies, {
    fields: [recurringInvoices.companyId],
    references: [companies.id],
  }),
  customer: one(customers, {
    fields: [recurringInvoices.customerId],
    references: [customers.id],
  }),
}));

export const insertRecurringInvoiceSchema = createInsertSchema(recurringInvoices).omit({
  id: true as const,
  createdAt: true as const,
  updatedAt: true as const,
  occurrenceCount: true as const,
  lastRunDate: true as const,
});

export type RecurringInvoice = typeof recurringInvoices.$inferSelect;
export type InsertRecurringInvoice = z.infer<typeof insertRecurringInvoiceSchema>;

// ========================================
// PAYMENT LINKS (Phase 2 - AR System)
// ========================================

export const paymentLinks = pgTable("payment_links", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).notNull().references(() => companies.id),
  invoiceId: varchar("invoice_id", { length: 36 }),
  customerId: varchar("customer_id", { length: 36 }),
  
  // Link configuration
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  currency: text("currency").default("USD").notNull(),
  description: text("description").notNull(),
  expiresAt: timestamp("expires_at"),
  maxPayments: integer("max_payments"),
  
  // Stripe integration
  stripePaymentLinkId: text("stripe_payment_link_id"),
  stripeCheckoutSessionId: text("stripe_checkout_session_id"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  
  // Status
  status: text("status").default("active").notNull(), // active, used, expired, cancelled
  usageCount: integer("usage_count").default(0).notNull(),
  
  // URL
  publicUrl: text("public_url").notNull(),
  internalReference: text("internal_reference").notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const paymentLinksRelations = relations(paymentLinks, ({ one }) => ({
  company: one(companies, {
    fields: [paymentLinks.companyId],
    references: [companies.id],
  }),
  invoice: one(invoices, {
    fields: [paymentLinks.invoiceId],
    references: [invoices.id],
  }),
  customer: one(customers, {
    fields: [paymentLinks.customerId],
    references: [customers.id],
  }),
}));

export const insertPaymentLinkSchema = createInsertSchema(paymentLinks).omit({
  id: true as const,
  createdAt: true as const,
  updatedAt: true as const,
  usageCount: true as const,
  stripePaymentLinkId: true as const,
  stripeCheckoutSessionId: true as const,
  stripePaymentIntentId: true as const,
});

export type PaymentLink = typeof paymentLinks.$inferSelect;
export type InsertPaymentLink = z.infer<typeof insertPaymentLinkSchema>;

// ========================================
// AP WORKFLOW TABLES (Phase 3 - AP System)
// ========================================

export const bills = pgTable("bills", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).notNull().references(() => companies.id),
  vendorId: varchar("vendor_id", { length: 36 }).notNull().references(() => vendors.id),
  billNumber: text("bill_number").notNull(),
  date: timestamp("date").notNull(),
  dueDate: timestamp("due_date").notNull(),
  status: text("status").default("draft").notNull(), // draft, pending_approval, approved, rejected, paid, partial
  subtotal: numeric("subtotal", { precision: 15, scale: 2 }).notNull(),
  taxRate: numeric("tax_rate", { precision: 5, scale: 4 }).default("0"),
  taxAmount: numeric("tax_amount", { precision: 15, scale: 2 }).default("0"),
  total: numeric("total", { precision: 15, scale: 2 }).notNull(),
  amountPaid: numeric("amount_paid", { precision: 15, scale: 2 }).default("0"),
  balanceDue: numeric("balance_due", { precision: 15, scale: 2 }).notNull(),
  currency: text("currency").default("USD").notNull(),
  memo: text("memo"),
  lineItems: jsonb("line_items").notNull().default("[]"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const billApprovalWorkflows = pgTable("bill_approval_workflows", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).notNull().references(() => companies.id),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  minAmount: numeric("min_amount", { precision: 15, scale: 2 }).notNull(),
  maxAmount: numeric("max_amount", { precision: 15, scale: 2 }),
  vendorIds: jsonb("vendor_ids"),
  expenseAccountIds: jsonb("expense_account_ids"),
  steps: jsonb("steps").notNull().default("[]"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const billApprovalRequests = pgTable("bill_approval_requests", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  billId: varchar("bill_id", { length: 36 }).notNull().references(() => bills.id),
  companyId: varchar("company_id", { length: 36 }).notNull().references(() => companies.id),
  workflowId: varchar("workflow_id", { length: 36 }).references(() => billApprovalWorkflows.id),
  status: text("status").default("pending").notNull(), // pending, approved, rejected, escalated
  currentStep: integer("current_step").default(0).notNull(),
  submissions: jsonb("submissions").notNull().default("[]"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const billsRelations = relations(bills, ({ one, many }) => ({
  company: one(companies, {
    fields: [bills.companyId],
    references: [companies.id],
  }),
  vendor: one(vendors, {
    fields: [bills.vendorId],
    references: [vendors.id],
  }),
}));

export const billApprovalWorkflowsRelations = relations(billApprovalWorkflows, ({ one }) => ({
  company: one(companies, {
    fields: [billApprovalWorkflows.companyId],
    references: [companies.id],
  }),
}));

export const billApprovalRequestsRelations = relations(billApprovalRequests, ({ one }) => ({
  bill: one(bills, {
    fields: [billApprovalRequests.billId],
    references: [bills.id],
  }),
  company: one(companies, {
    fields: [billApprovalRequests.companyId],
    references: [companies.id],
  }),
  workflow: one(billApprovalWorkflows, {
    fields: [billApprovalRequests.workflowId],
    references: [billApprovalWorkflows.id],
  }),
}));

export const insertBillSchema = createInsertSchema(bills).omit({
  id: true as const,
  createdAt: true as const,
  updatedAt: true as const,
  amountPaid: true as const,
});

export const insertBillApprovalWorkflowSchema = createInsertSchema(billApprovalWorkflows).omit({
  id: true as const,
  createdAt: true as const,
  updatedAt: true as const,
});

export const insertBillApprovalRequestSchema = createInsertSchema(billApprovalRequests).omit({
  id: true as const,
  createdAt: true as const,
  updatedAt: true as const,
  currentStep: true as const,
  submissions: true as const,
});

export type Bill = typeof bills.$inferSelect;
export type InsertBill = z.infer<typeof insertBillSchema>;

export type BillApprovalWorkflow = typeof billApprovalWorkflows.$inferSelect;
export type InsertBillApprovalWorkflow = z.infer<typeof insertBillApprovalWorkflowSchema>;

export type BillApprovalRequest = typeof billApprovalRequests.$inferSelect;
export type InsertBillApprovalRequest = z.infer<typeof insertBillApprovalRequestSchema>;

// ========================================
// VENDOR TAX INFO (Phase 3 - 1099 Tracking)
// ========================================

export const vendorTaxInfo = pgTable("vendor_tax_info", {
  id: text("id").primaryKey(), // companyId-vendorId
  companyId: varchar("company_id", { length: 36 }).notNull().references(() => companies.id),
  vendorId: varchar("vendor_id", { length: 36 }).notNull().references(() => vendors.id),
  taxIdType: text("tax_id_type"), // ein, ssn, tin
  taxIdNumber: text("tax_id_number"), // Last 4 digits only
  legalName: text("legal_name").notNull(),
  businessName: text("business_name"),
  addressLine1: text("address_line1").notNull(),
  addressLine2: text("address_line2"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  country: text("country").default("US").notNull(),
  isW9OnFile: boolean("is_w9_on_file").default(false).notNull(),
  w9ReceivedAt: timestamp("w9_received_at"),
  is1099Required: boolean("is_1099_required").default(false).notNull(),
  is1099Eligible: boolean("is_1099_eligible").default(false).notNull(),
  yearToDatePayments: numeric("year_to_date_payments", { precision: 15, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const vendorTaxInfoRelations = relations(vendorTaxInfo, ({ one }) => ({
  company: one(companies, {
    fields: [vendorTaxInfo.companyId],
    references: [companies.id],
  }),
  vendor: one(vendors, {
    fields: [vendorTaxInfo.vendorId],
    references: [vendors.id],
  }),
}));

export const insertVendorTaxInfoSchema = createInsertSchema(vendorTaxInfo).omit({
  id: true as const,
  createdAt: true as const,
  updatedAt: true as const,
  yearToDatePayments: true as const,
});

export type VendorTaxInfo = typeof vendorTaxInfo.$inferSelect;
export type InsertVendorTaxInfo = z.infer<typeof insertVendorTaxInfoSchema>;
