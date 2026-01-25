import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, numeric, integer, boolean, pgEnum, uniqueIndex, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const employeeStatusEnum = pgEnum('employee_status', ['active', 'on_leave', 'terminated', 'retired']);
export const payFrequencyEnum = pgEnum('pay_frequency', ['weekly', 'bi-weekly', 'semi-monthly', 'monthly']);
export const payRunStatusEnum = pgEnum('pay_run_status', ['draft', 'pending_approval', 'approved', 'processing', 'completed', 'cancelled']);
export const taxFormStatusEnum = pgEnum('tax_form_status', ['draft', 'generated', 'filed', 'accepted', 'rejected', 'amended']);
export const roleEnum = pgEnum('role', ['owner', 'admin', 'user', 'accountant', 'manager']);
export const accountTypeEnum = pgEnum('account_type', ['asset', 'liability', 'equity', 'revenue', 'expense']);
export const transactionTypeEnum = pgEnum('transaction_type', ['invoice', 'payment', 'expense', 'transfer', 'adjustment', 'journal_entry']);
export const invoiceStatusEnum = pgEnum('invoice_status', ['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled']);
export const paymentMethodEnum = pgEnum('payment_method', ['cash', 'check', 'credit_card', 'bank_transfer', 'other']);
export const planIntervalEnum = pgEnum('plan_interval', ['month', 'year']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['trialing', 'active', 'past_due', 'canceled', 'paused']);
export const billingInvoiceStatusEnum = pgEnum('billing_invoice_status', ['draft', 'open', 'paid', 'uncollectible', 'void']);
export const billingPaymentStatusEnum = pgEnum('billing_payment_status', ['requires_payment_method', 'requires_action', 'processing', 'succeeded', 'failed', 'canceled']);
export const usageMetricTypeEnum = pgEnum('usage_metric_type', ['api_calls', 'ai_tokens', 'invoices_created', 'users_count']);

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

export type WorkflowEventLog = typeof workflowEventLog.$inferSelect;
export type InsertWorkflowEventLog = z.infer<typeof insertWorkflowEventLogSchema>;
