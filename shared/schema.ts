import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, numeric, integer, boolean, pgEnum, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const roleEnum = pgEnum("role", ["admin", "accountant", "user"]);
export const accountTypeEnum = pgEnum("account_type", ["asset", "liability", "equity", "revenue", "expense"]);
export const invoiceStatusEnum = pgEnum("invoice_status", ["draft", "sent", "paid", "overdue", "void"]);
export const transactionTypeEnum = pgEnum("transaction_type", ["journal_entry", "invoice", "payment", "bank"]);

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

// Audit Logs (immutable)
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).notNull().references(() => companies.id),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: varchar("entity_id", { length: 36 }).notNull(),
  changes: text("changes"), // JSON string
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const companiesRelations = relations(companies, ({ many }) => ({
  accounts: many(accounts),
  customers: many(customers),
  vendors: many(vendors),
  transactions: many(transactions),
  invoices: many(invoices),
  userAccess: many(userCompanyAccess),
}));

export const usersRelations = relations(users, ({ many, one }) => ({
  companyAccess: many(userCompanyAccess),
  currentCompany: one(companies, {
    fields: [users.currentCompanyId],
    references: [companies.id],
  }),
  createdTransactions: many(transactions),
  createdInvoices: many(invoices),
  createdPayments: many(payments),
  auditLogs: many(auditLogs),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  company: one(companies, {
    fields: [accounts.companyId],
    references: [companies.id],
  }),
  parent: one(accounts, {
    fields: [accounts.parentId],
    references: [accounts.id],
  }),
  children: many(accounts),
  transactionLines: many(transactionLines),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  company: one(companies, {
    fields: [customers.companyId],
    references: [companies.id],
  }),
  invoices: many(invoices),
}));

export const vendorsRelations = relations(vendors, ({ one }) => ({
  company: one(companies, {
    fields: [vendors.companyId],
    references: [companies.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  company: one(companies, {
    fields: [transactions.companyId],
    references: [companies.id],
  }),
  createdBy: one(users, {
    fields: [transactions.createdBy],
    references: [users.id],
  }),
  lines: many(transactionLines),
}));

export const transactionLinesRelations = relations(transactionLines, ({ one }) => ({
  transaction: one(transactions, {
    fields: [transactionLines.transactionId],
    references: [transactions.id],
  }),
  account: one(accounts, {
    fields: [transactionLines.accountId],
    references: [accounts.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  company: one(companies, {
    fields: [invoices.companyId],
    references: [companies.id],
  }),
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
  createdBy: one(users, {
    fields: [invoices.createdBy],
    references: [users.id],
  }),
  items: many(invoiceItems),
  payments: many(payments),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
  account: one(accounts, {
    fields: [invoiceItems.accountId],
    references: [accounts.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  company: one(companies, {
    fields: [payments.companyId],
    references: [companies.id],
  }),
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
  createdBy: one(users, {
    fields: [payments.createdBy],
    references: [users.id],
  }),
}));

export const bankTransactionsRelations = relations(bankTransactions, ({ one }) => ({
  company: one(companies, {
    fields: [bankTransactions.companyId],
    references: [companies.id],
  }),
  account: one(accounts, {
    fields: [bankTransactions.accountId],
    references: [accounts.id],
  }),
}));

// Insert Schemas
export const insertCompanySchema = createInsertSchema(companies).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAccountSchema = createInsertSchema(accounts).omit({ id: true, createdAt: true, updatedAt: true, balance: true });
export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true, createdAt: true, updatedAt: true, balance: true });
export const insertVendorSchema = createInsertSchema(vendors).omit({ id: true, createdAt: true, updatedAt: true, balance: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTransactionLineSchema = createInsertSchema(transactionLines).omit({ id: true, createdAt: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true, updatedAt: true });
export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({ id: true, createdAt: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true });
export const insertBankTransactionSchema = createInsertSchema(bankTransactions).omit({ id: true, createdAt: true });

// Types
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type TransactionLine = typeof transactionLines.$inferSelect;
export type InsertTransactionLine = z.infer<typeof insertTransactionLineSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type BankTransaction = typeof bankTransactions.$inferSelect;
export type InsertBankTransaction = z.infer<typeof insertBankTransactionSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
