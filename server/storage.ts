// Storage layer implementing database operations
import crypto from "node:crypto";
import { db } from "./db";
import { eq, and, desc, sql, sum, inArray } from "drizzle-orm";
import * as schema from "../shared/schema";
import { assertCompanyScope, getRequestContext } from "./runtime/request-context";

// Import only the schema object to access all tables
const s = schema;

// Derive types from the table schemas
type Account = typeof s.accounts.$inferSelect;
type InsertAccount = typeof s.accounts.$inferInsert;

type BankTransaction = typeof s.bankTransactions.$inferSelect;
type InsertBankTransaction = typeof s.bankTransactions.$inferInsert;

type Company = typeof s.companies.$inferSelect;
type InsertCompany = typeof s.companies.$inferInsert;

type Customer = typeof s.customers.$inferSelect;
type InsertCustomer = typeof s.customers.$inferInsert;

type Employee = typeof s.employees.$inferSelect;
type InsertEmployee = typeof s.employees.$inferInsert;

type Invoice = typeof s.invoices.$inferSelect;
type InsertInvoice = typeof s.invoices.$inferInsert;

type InvoiceItem = typeof s.invoiceItems.$inferSelect;
type InsertInvoiceItem = typeof s.invoiceItems.$inferInsert;

type Payment = typeof s.payments.$inferSelect;
type InsertPayment = typeof s.payments.$inferInsert;

type PayRun = typeof s.payRuns.$inferSelect;
type InsertPayRun = typeof s.payRuns.$inferInsert;

type PayRunDetail = typeof s.payRunDetails.$inferSelect;
type InsertPayRunDetail = typeof s.payRunDetails.$inferInsert;

type PayrollPeriod = typeof s.payrollPeriods.$inferSelect;
type InsertPayrollPeriod = typeof s.payrollPeriods.$inferInsert;

type PurchaseOrder = typeof s.purchaseOrders.$inferSelect;
type InsertPurchaseOrder = typeof s.purchaseOrders.$inferInsert;

type PurchaseOrderItem = typeof s.purchaseOrderItems.$inferSelect;
type InsertPurchaseOrderItem = typeof s.purchaseOrderItems.$inferInsert;

type Transaction = typeof s.transactions.$inferSelect;
type InsertTransaction = typeof s.transactions.$inferInsert;

type TransactionLine = typeof s.transactionLines.$inferSelect;
type InsertTransactionLine = typeof s.transactionLines.$inferInsert;

type User = typeof s.users.$inferSelect;
type InsertUser = typeof s.users.$inferInsert;

type Vendor = typeof s.vendors.$inferSelect;
type InsertVendor = typeof s.vendors.$inferInsert;

type Deduction = typeof s.deductions.$inferSelect;
type InsertDeduction = typeof s.deductions.$inferInsert;

type EmployeeDeduction = typeof s.employeeDeductions.$inferSelect;
type InsertEmployeeDeduction = typeof s.employeeDeductions.$inferInsert;

type TimeEntry = typeof s.timeEntries.$inferSelect;
type InsertTimeEntry = typeof s.timeEntries.$inferInsert;

type PayRunDeduction = typeof s.payRunDeductions.$inferSelect;
type InsertPayRunDeduction = typeof s.payRunDeductions.$inferInsert;

type TaxForm = typeof s.taxForms.$inferSelect;
type InsertTaxForm = typeof s.taxForms.$inferInsert;

type PayrollTransaction = typeof s.payrollTransactions.$inferSelect;
type InsertPayrollTransaction = typeof s.payrollTransactions.$inferInsert;

type InventoryItem = typeof s.inventoryItems.$inferSelect;
type InsertInventoryItem = typeof s.inventoryItems.$inferInsert;

type InventoryAdjustment = typeof s.inventoryAdjustments.$inferSelect;
type InsertInventoryAdjustment = typeof s.inventoryAdjustments.$inferInsert;

type AuditLog = typeof s.auditLogs.$inferSelect;
type InsertAuditLog = typeof s.auditLogs.$inferInsert;

// Export enums
type PayFrequency = 'weekly' | 'bi-weekly' | 'semi-monthly' | 'monthly';
type PayRunStatus = 'draft' | 'pending_approval' | 'approved' | 'processing' | 'completed' | 'cancelled';
type TransactionType = 'invoice' | 'payment' | 'expense' | 'transfer' | 'adjustment' | 'journal_entry';
type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';
type PaymentMethod = 'cash' | 'check' | 'credit_card' | 'bank_transfer' | 'other';

// Import schema objects for database operations
const {
  // Tables
  employees,
  deductions,
  employeeDeductions,
  payrollPeriods,
  timeEntries,
  payRuns,
  payRunDetails,
  payRunDeductions,
  taxForms,
  payrollTransactions,
  inventoryItems,
  purchaseOrders,
  purchaseOrderItems,
  inventoryAdjustments,
  companies,
  userCompanyAccess,
  users,
  accounts,
  customers,
  vendors,
  transactions,
  transactionLines,
  invoices,
  invoiceItems,
  payments,
  bankTransactions,
  auditLogs,

  // Insert schemas
  insertEmployeeSchema,
  insertDeductionSchema,
  insertEmployeeDeductionSchema,
  insertPayrollPeriodSchema,
  insertTimeEntrySchema,
  insertPayRunSchema,
  insertPayRunDetailSchema,
  insertPayRunDeductionSchema,
  insertTaxFormSchema,
  insertPayrollTransactionSchema,
  insertInventoryItemSchema,
  insertPurchaseOrderSchema,
  insertPurchaseOrderItemSchema,
  insertInventoryAdjustmentSchema,
  insertCompanySchema,
  insertUserSchema,
  insertAccountSchema,
  insertCustomerSchema,
  insertVendorSchema,
  insertTransactionSchema,
  insertTransactionLineSchema,
  insertInvoiceSchema,
  insertInvoiceItemSchema,
  insertPaymentSchema,
  insertBankTransactionSchema,
  insertAuditLogSchema
} = schema;

function forbidUnscopedWrite(operation: string): void {
  const ctx = getRequestContext();
  if (typeof ctx?.companyId === "string" && ctx.companyId) {
    throw new Error(
      `Tenant scope invariant violated: unscoped write (${operation}) while request context is tenant-scoped`,
    );
  }
}

function enforceWriteCompanyScope(companyId: string | null | undefined, operation: string): void {
  const ctx = getRequestContext();
  if (typeof ctx?.companyId === "string" && ctx.companyId) {
    if (typeof companyId !== "string" || !companyId) {
      throw new Error(
        `Tenant scope invariant violated: write (${operation}) missing explicit companyId while request context is tenant-scoped`,
      );
    }
    assertCompanyScope(companyId);
  }
}

function deterministicUuidV4(seed: string): string {
  const bytes = crypto.createHash("sha256").update(seed).digest().subarray(0, 16);

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Buffer.from(bytes).toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function isUniqueViolation(err: unknown): boolean {
  if ((err as any)?.code === "23505") return true;
  if ((err as any)?.cause?.code === "23505") return true;
  const msg = String((err as any)?.message ?? "").toLowerCase();
  const causeMsg = String((err as any)?.cause?.message ?? "").toLowerCase();
  return msg.includes("duplicate key") || msg.includes("unique constraint") || causeMsg.includes("duplicate key") || causeMsg.includes("unique constraint");
}

export interface IStorage {
  // Companies
  getCompany(id: string): Promise<Company | undefined>;
  getCompanies(): Promise<Company[]>;
  hasUserCompanyAccess(userId: string, companyId: string): Promise<boolean>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: string, updates: Partial<InsertCompany>): Promise<Company | undefined>;

  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;

  // Accounts
  getAccount(id: string): Promise<Account | undefined>;
  getAccountsByCompany(companyId: string): Promise<Account[]>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: string, updates: Partial<InsertAccount>): Promise<Account | undefined>;
  updateAccountBalance(id: string, amount: string): Promise<void>;

  // Customers
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomersByCompany(companyId: string): Promise<Customer[]>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, updates: Partial<InsertCustomer>): Promise<Customer | undefined>;
  updateCustomerByCompany(companyId: string, id: string, updates: Partial<InsertCustomer>): Promise<Customer | undefined>;
  updateCustomerBalance(id: string, amount: string): Promise<void>;

  // Vendors
  getVendor(id: string): Promise<Vendor | undefined>;
  getVendorsByCompany(companyId: string): Promise<Vendor[]>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendor(id: string, updates: Partial<InsertVendor>): Promise<Vendor | undefined>;

  // Transactions
  getTransaction(id: string): Promise<Transaction | undefined>;
  getTransactionsByCompany(companyId: string, limit?: number): Promise<Transaction[]>;
  getTransactionWithLines(id: string): Promise<{ transaction: Transaction; lines: TransactionLine[] } | undefined>;
  getTransactionLinesByTransaction(transactionId: string): Promise<TransactionLine[]>;
  createTransaction(transaction: InsertTransaction, lines: InsertTransactionLine[]): Promise<Transaction>;
  voidTransaction(id: string, voidedBy: string): Promise<void>;

  // Invoices
  getInvoice(id: string): Promise<Invoice | undefined>;
  getInvoicesByCompany(companyId: string): Promise<Invoice[]>;
  getInvoiceWithItems(id: string): Promise<{ invoice: Invoice; items: InvoiceItem[] } | undefined>;
  getInvoiceWithItemsByCompany(companyId: string, id: string): Promise<{ invoice: Invoice; items: InvoiceItem[] } | undefined>;
  createInvoice(invoice: InsertInvoice, items: InsertInvoiceItem[]): Promise<Invoice>;
  updateInvoice(id: string, updates: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  updateInvoiceStatus(id: string, status: string): Promise<void>;

  // Payments
  getPaymentsByInvoice(invoiceId: string): Promise<Payment[]>;
  getPaymentsByInvoiceByCompany(companyId: string, invoiceId: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment, idempotencyKey: string): Promise<{ payment: Payment; replayed: boolean }>;

  // Bank Transactions
  getBankTransactionsByCompany(companyId: string): Promise<BankTransaction[]>;
  createBankTransaction(transaction: InsertBankTransaction): Promise<BankTransaction>;
  reconcileBankTransaction(id: string, matchedTransactionId: string): Promise<void>;
  reconcileBankTransactionByCompany(companyId: string, id: string, matchedTransactionId: string): Promise<void>;

  // Audit Logs
  createAuditLog(log: {
    companyId?: string | null;
    userId?: string | null;
    action: string;
    entityType: string;
    entityId: string;
    changes?: string;
  }): Promise<void>;

  // Payroll Module
  getEmployee(id: string): Promise<Employee | undefined>;
  getEmployeesByCompany(companyId: string): Promise<Employee[]>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, updates: Partial<InsertEmployee>): Promise<Employee | undefined>;
  updateEmployeeByCompany(companyId: string, id: string, updates: Partial<InsertEmployee>): Promise<Employee | undefined>;
  getDeductionsByCompany(companyId: string): Promise<Deduction[]>;
  createDeduction(deduction: InsertDeduction): Promise<Deduction>;
  getEmployeeDeductionsByEmployee(employeeId: string): Promise<EmployeeDeduction[]>;
  createEmployeeDeduction(deduction: InsertEmployeeDeduction): Promise<EmployeeDeduction>;
  createEmployeeDeductionByCompany(companyId: string, deduction: InsertEmployeeDeduction): Promise<EmployeeDeduction>;
  getPayrollPeriodsByCompany(companyId: string): Promise<PayrollPeriod[]>;
  createPayrollPeriod(period: InsertPayrollPeriod): Promise<PayrollPeriod>;
  getTimeEntriesByEmployee(employeeId: string): Promise<TimeEntry[]>;
  getTimeEntriesByPayrollPeriod(payrollPeriodId: string): Promise<TimeEntry[]>;
  createTimeEntry(entry: InsertTimeEntry): Promise<TimeEntry>;
  createTimeEntryByCompany(companyId: string, entry: InsertTimeEntry): Promise<TimeEntry>;
  approveTimeEntry(id: string, approvedBy: string): Promise<void>;
  approveTimeEntryByCompany(companyId: string, id: string, approvedBy: string): Promise<void>;
  getPayRunsByCompany(companyId: string): Promise<PayRun[]>;
  getPayRunWithDetails(id: string): Promise<{ payRun: PayRun; details: PayRunDetail[] } | undefined>;
  createPayRun(payRun: InsertPayRun, details: InsertPayRunDetail[]): Promise<PayRun>;
  updatePayRunStatus(id: string, status: string): Promise<void>;
  updatePayRunStatusByCompany(companyId: string, id: string, status: string): Promise<void>;
  getTaxFormsByCompany(companyId: string): Promise<TaxForm[]>;
  createTaxForm(form: InsertTaxForm): Promise<TaxForm>;
  createPayrollTransaction(transaction: InsertPayrollTransaction): Promise<PayrollTransaction>;

  // Inventory Module
  getInventoryItemsByCompany(companyId: string): Promise<InventoryItem[]>;
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryItem(id: string, updates: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined>;
  updateInventoryItemByCompany(companyId: string, id: string, updates: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined>;
  updateInventoryQuantity(id: string, quantityChange: string, reason: string): Promise<void>;
  updateInventoryQuantityByCompany(companyId: string, id: string, quantityChange: string, reason: string, createdBy: string): Promise<void>;
  getInventoryItem(id: string): Promise<InventoryItem | undefined>;
  getPurchaseOrdersByCompany(companyId: string): Promise<PurchaseOrder[]>;
  getPurchaseOrderWithItems(id: string): Promise<{ purchaseOrder: PurchaseOrder; items: PurchaseOrderItem[] } | undefined>;
  getPurchaseOrder(id: string): Promise<PurchaseOrder | undefined>;
  createPurchaseOrder(order: InsertPurchaseOrder, items: InsertPurchaseOrderItem[]): Promise<PurchaseOrder>;
  updatePurchaseOrderStatus(id: string, status: string): Promise<void>;
  updatePurchaseOrderStatusByCompany(companyId: string, id: string, status: string): Promise<void>;
  getInventoryAdjustmentsByCompany(companyId: string): Promise<any[]>;
  createInventoryAdjustment(adjustment: InsertInventoryAdjustment): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // ==================
  // Company Operations
  // ==================
  async getCompany(id: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }

  async getCompanies(): Promise<Company[]> {
    return db.select().from(companies).orderBy(companies.name);
  }

  async hasUserCompanyAccess(userId: string, companyId: string): Promise<boolean> {
    const [row] = await db
      .select({ id: userCompanyAccess.id })
      .from(userCompanyAccess)
      .where(and(eq(userCompanyAccess.userId, userId), eq(userCompanyAccess.companyId, companyId)))
      .limit(1);
    return !!row;
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    forbidUnscopedWrite("createCompany");
    const parsed = insertCompanySchema.parse(company);
    const [newCompany] = await db.insert(companies).values(company).returning();
    return newCompany;
  }

  async updateCompany(id: string, updates: Partial<InsertCompany>): Promise<Company | undefined> {
    enforceWriteCompanyScope(id, "updateCompany");
    const [updatedCompany] = await db
      .update(companies)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();
    return updatedCompany;
  }

  // ================
  // User Operations
  // ================
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    forbidUnscopedWrite("createUser");
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    forbidUnscopedWrite("updateUser");
    const [updatedUser] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // ==================
  // Account Operations
  // ==================
  async getAccount(id: string): Promise<Account | undefined> {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, id));
    return account;
  }

  async getAccountsByCompany(companyId: string): Promise<Account[]> {
    const rows = await db
      .select({
        account: accounts,
        computedBalance: sql<string>`coalesce(sum(${transactionLines.debit} - ${transactionLines.credit}), 0)`,
      })
      .from(accounts)
      .leftJoin(transactionLines, eq(transactionLines.accountId, accounts.id))
      .leftJoin(transactions, eq(transactions.id, transactionLines.transactionId))
      .where(
        and(
          eq(accounts.companyId, companyId),
          sql`(${transactions.id} is null) OR (${transactions.isVoid} = false)`,
        ),
      )
      .groupBy(accounts.id)
      .orderBy(accounts.name);

    return rows.map((r) => ({
      ...r.account,
      balance: r.computedBalance,
    }));
  }

  async createAccount(account: InsertAccount): Promise<Account> {
    enforceWriteCompanyScope((account as any)?.companyId, "createAccount");
    const [newAccount] = await db.insert(accounts).values(account).returning();
    return newAccount;
  }

  async updateAccount(id: string, updates: Partial<InsertAccount>): Promise<Account | undefined> {
    forbidUnscopedWrite("updateAccount");
    const [updatedAccount] = await db
      .update(accounts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(accounts.id, id))
      .returning();
    return updatedAccount;
  }

  async updateAccountBalance(id: string, amount: string): Promise<void> {
    void id;
    void amount;
    throw new Error("Direct account balance mutation is forbidden. Post a journal entry instead.");
  }

  // ===================
  // Customer Operations
  // ===================
  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async getCustomersByCompany(companyId: string): Promise<Customer[]> {
    return db
      .select()
      .from(customers)
      .where(eq(customers.companyId, companyId))
      .orderBy(customers.name);
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    enforceWriteCompanyScope((customer as any)?.companyId, "createCustomer");
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }

  async updateCustomer(id: string, updates: Partial<InsertCustomer>): Promise<Customer | undefined> {
    forbidUnscopedWrite("updateCustomer");
    const [updatedCustomer] = await db
      .update(customers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return updatedCustomer;
  }

  async updateCustomerByCompany(
    companyId: string,
    id: string,
    updates: Partial<InsertCustomer>,
  ): Promise<Customer | undefined> {
    enforceWriteCompanyScope(companyId, "updateCustomer");
    const [updatedCustomer] = await db
      .update(customers)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(customers.id, id), eq(customers.companyId, companyId)))
      .returning();
    return updatedCustomer;
  }

  async updateCustomerBalance(id: string, amount: string): Promise<void> {
    void id;
    void amount;
    throw new Error("Direct customer balance mutation is forbidden. Post a journal entry instead.");
  }

  // =================
  // Vendor Operations
  // =================
  async getVendor(id: string): Promise<Vendor | undefined> {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, id));
    return vendor;
  }

  async getVendorsByCompany(companyId: string): Promise<Vendor[]> {
    return db
      .select()
      .from(vendors)
      .where(eq(vendors.companyId, companyId))
      .orderBy(vendors.name);
  }

  async createVendor(vendor: InsertVendor): Promise<Vendor> {
    enforceWriteCompanyScope((vendor as any)?.companyId, "createVendor");
    const [newVendor] = await db.insert(vendors).values(vendor).returning();
    return newVendor;
  }

  async updateVendor(id: string, updates: Partial<InsertVendor>): Promise<Vendor | undefined> {
    forbidUnscopedWrite("updateVendor");
    const [updatedVendor] = await db
      .update(vendors)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(vendors.id, id))
      .returning();
    return updatedVendor;
  }

  // =====================
  // Transaction Operations
  // =====================
  async getTransaction(id: string): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction;
  }

  async getTransactionsByCompany(companyId: string, limit = 50): Promise<Transaction[]> {
    return db
      .select()
      .from(transactions)
      .where(eq(transactions.companyId, companyId))
      .orderBy(desc(transactions.date), desc(transactions.createdAt))
      .limit(limit);
  }

  async getTransactionWithLines(
    id: string
  ): Promise<{ transaction: Transaction; lines: TransactionLine[] } | undefined> {
    const transaction = await this.getTransaction(id);
    if (!transaction) return undefined;

    const lines = await this.getTransactionLinesByTransaction(id);
    return { transaction, lines };
  }

  async getTransactionLinesByTransaction(transactionId: string): Promise<TransactionLine[]> {
    return db
      .select()
      .from(transactionLines)
      .where(eq(transactionLines.transactionId, transactionId));
  }

  async createTransaction(
    transaction: InsertTransaction,
    lines: InsertTransactionLine[]
  ): Promise<Transaction> {
    void transaction;
    void lines;
    throw new Error('Direct transaction creation is forbidden. Post via the STEP 13 ledger engine (postJournalEntry/ledgerEngine).');
  }

  async voidTransaction(id: string, voidedBy: string): Promise<void> {
    void id;
    void voidedBy;
    throw new Error('Direct transaction void is forbidden. Void via reversal posting (voidByReversal/ledgerEngine).');
  }

  // ====================
  // Inventory Operations
  // ====================
  async getInventoryItem(id: string): Promise<InventoryItem | undefined> {
    const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, id));
    return item;
  }

  async getInventoryItemsByCompany(companyId: string): Promise<InventoryItem[]> {
    return db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.companyId, companyId))
      .orderBy(inventoryItems.name);
  }

  async createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem> {
    enforceWriteCompanyScope((item as any)?.companyId, "createInventoryItem");
    const [newItem] = await db.insert(inventoryItems).values(item).returning();
    return newItem;
  }

  async updateInventoryItem(
    id: string,
    updates: Partial<InsertInventoryItem>
  ): Promise<InventoryItem | undefined> {
    forbidUnscopedWrite("updateInventoryItem");
    const [updatedItem] = await db
      .update(inventoryItems)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(inventoryItems.id, id))
      .returning();
    return updatedItem;
  }

  async updateInventoryItemByCompany(
    companyId: string,
    id: string,
    updates: Partial<InsertInventoryItem>,
  ): Promise<InventoryItem | undefined> {
    enforceWriteCompanyScope(companyId, "updateInventoryItem");
    const [updatedItem] = await db
      .update(inventoryItems)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(inventoryItems.id, id), eq(inventoryItems.companyId, companyId)))
      .returning();
    return updatedItem;
  }

  async updateInventoryQuantity(
    id: string,
    quantityChange: string,
    reason: string
  ): Promise<void> {
    forbidUnscopedWrite("updateInventoryQuantity");
    await db.transaction(async (tx) => {
      // Update the inventory quantity
      await tx
        .update(inventoryItems)
        .set({
          quantityOnHand: sql`${inventoryItems.quantityOnHand} + ${quantityChange}`,
          updatedAt: new Date()
        })
        .where(eq(inventoryItems.id, id));

      // Record the adjustment
      await tx.insert(inventoryAdjustments).values({
        companyId: (await tx.select().from(inventoryItems).where(eq(inventoryItems.id, id)).limit(1))[0]?.companyId || '',
        inventoryItemId: id,
        adjustmentType: 'adjustment',
        quantityChange,
        previousQuantity: '0', // Would need to fetch current value
        newQuantity: '0', // Would need to calculate
        reason,
        createdBy: 'system' // Should be passed as parameter
      });
    });
  }

  async updateInventoryQuantityByCompany(
    companyId: string,
    id: string,
    quantityChange: string,
    reason: string,
    createdBy: string,
  ): Promise<void> {
    enforceWriteCompanyScope(companyId, "updateInventoryQuantity");
    await db.transaction(async (tx) => {
      const [itemRow] = await tx
        .select({ quantityOnHand: inventoryItems.quantityOnHand })
        .from(inventoryItems)
        .where(and(eq(inventoryItems.id, id), eq(inventoryItems.companyId, companyId)))
        .limit(1);

      if (!itemRow) {
        throw new Error("Tenant scope invariant violated: inventory item not found for company");
      }

      const previousQuantity = String(itemRow.quantityOnHand ?? "0");

      const [updated] = await tx
        .update(inventoryItems)
        .set({
          quantityOnHand: sql`${inventoryItems.quantityOnHand} + ${quantityChange}`,
          updatedAt: new Date(),
        })
        .where(and(eq(inventoryItems.id, id), eq(inventoryItems.companyId, companyId)))
        .returning({ quantityOnHand: inventoryItems.quantityOnHand });

      const newQuantity = String(updated?.quantityOnHand ?? "0");

      await tx.insert(inventoryAdjustments).values({
        companyId,
        inventoryItemId: id,
        adjustmentType: "adjustment",
        quantityChange,
        previousQuantity,
        newQuantity,
        reason,
        createdBy,
      } as any);
    });
  }

  // =======================
  // Purchase Order Operations
  // =======================
  async getPurchaseOrder(id: string): Promise<PurchaseOrder | undefined> {
    const [order] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id));
    return order;
  }

  async getPurchaseOrdersByCompany(companyId: string): Promise<PurchaseOrder[]> {
    return db
      .select()
      .from(purchaseOrders)
      .where(eq(purchaseOrders.companyId, companyId))
      .orderBy(desc(purchaseOrders.orderDate));
  }

  async getPurchaseOrderWithItems(
    id: string
  ): Promise<{ purchaseOrder: PurchaseOrder; items: PurchaseOrderItem[] } | undefined> {
    const order = await this.getPurchaseOrder(id);
    if (!order) return undefined;

    const items = await db
      .select()
      .from(purchaseOrderItems)
      .where(eq(purchaseOrderItems.purchaseOrderId, id));

    return { purchaseOrder: order, items };
  }

  async createPurchaseOrder(
    order: InsertPurchaseOrder,
    items: InsertPurchaseOrderItem[]
  ): Promise<PurchaseOrder> {
    enforceWriteCompanyScope((order as any)?.companyId, "createPurchaseOrder");
    return db.transaction(async (tx) => {
      // Insert the purchase order
      const [newOrder] = await tx
        .insert(purchaseOrders)
        .values(order)
        .returning();

      // Insert all order items
      if (items.length > 0) {
        await tx
          .insert(purchaseOrderItems)
          .values(items.map(item => ({
            ...item,
            purchaseOrderId: newOrder.id
          })));
      }

      return newOrder;
    });
  }

  async updatePurchaseOrderStatus(id: string, status: string): Promise<void> {
    forbidUnscopedWrite("updatePurchaseOrderStatus");
    await db
      .update(purchaseOrders)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(purchaseOrders.id, id));
  }

  async updatePurchaseOrderStatusByCompany(companyId: string, id: string, status: string): Promise<void> {
    enforceWriteCompanyScope(companyId, "updatePurchaseOrderStatus");
    await db
      .update(purchaseOrders)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(and(eq(purchaseOrders.id, id), eq(purchaseOrders.companyId, companyId)));
  }

  async getInventoryAdjustmentsByCompany(companyId: string): Promise<any[]> {
    return db
      .select()
      .from(inventoryAdjustments)
      .innerJoin(
        inventoryItems,
        eq(inventoryAdjustments.inventoryItemId, inventoryItems.id)
      )
      .where(eq(inventoryItems.companyId, companyId))
      .orderBy(desc(inventoryAdjustments.createdAt));
  }

  async createInventoryAdjustment(adjustment: InsertInventoryAdjustment): Promise<any> {
    enforceWriteCompanyScope((adjustment as any)?.companyId, "createInventoryAdjustment");
    const [newAdjustment] = await db
      .insert(inventoryAdjustments)
      .values(adjustment)
      .returning();
    return newAdjustment;
  }

  // ===================
  // Payroll Operations
  // ===================
  async getEmployee(id: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee;
  }

  async getEmployeesByCompany(companyId: string): Promise<Employee[]> {
    return db
      .select()
      .from(employees)
      .where(eq(employees.companyId, companyId))
      .orderBy(employees.lastName, employees.firstName);
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    enforceWriteCompanyScope((employee as any)?.companyId, "createEmployee");
    const [newEmployee] = await db.insert(employees).values(employee).returning();
    return newEmployee;
  }

  async updateEmployee(
    id: string,
    updates: Partial<InsertEmployee>
  ): Promise<Employee | undefined> {
    forbidUnscopedWrite("updateEmployee");
    const [updatedEmployee] = await db
      .update(employees)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(employees.id, id))
      .returning();
    return updatedEmployee;
  }

  async updateEmployeeByCompany(
    companyId: string,
    id: string,
    updates: Partial<InsertEmployee>,
  ): Promise<Employee | undefined> {
    enforceWriteCompanyScope(companyId, "updateEmployee");
    const [updatedEmployee] = await db
      .update(employees)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(employees.id, id), eq(employees.companyId, companyId)))
      .returning();
    return updatedEmployee;
  }

  async getDeductionsByCompany(companyId: string): Promise<Deduction[]> {
    return db
      .select()
      .from(deductions)
      .where(eq(deductions.companyId, companyId));
  }

  async createDeduction(deduction: InsertDeduction): Promise<Deduction> {
    enforceWriteCompanyScope((deduction as any)?.companyId, "createDeduction");
    const [newDeduction] = await db.insert(deductions).values(deduction).returning();
    return newDeduction;
  }

  async getEmployeeDeductionsByEmployee(employeeId: string): Promise<EmployeeDeduction[]> {
    return db
      .select()
      .from(employeeDeductions)
      .where(eq(employeeDeductions.employeeId, employeeId));
  }

  async createEmployeeDeduction(deduction: InsertEmployeeDeduction): Promise<EmployeeDeduction> {
    forbidUnscopedWrite("createEmployeeDeduction");
    const [newEmployeeDeduction] = await db
      .insert(employeeDeductions)
      .values(deduction)
      .returning();
    return newEmployeeDeduction;
  }

  async createEmployeeDeductionByCompany(
    companyId: string,
    deduction: InsertEmployeeDeduction,
  ): Promise<EmployeeDeduction> {
    enforceWriteCompanyScope(companyId, "createEmployeeDeduction");

    const [employeeRow] = await db
      .select({ id: employees.id })
      .from(employees)
      .where(and(eq(employees.id, (deduction as any).employeeId), eq(employees.companyId, companyId)))
      .limit(1);

    if (!employeeRow) {
      throw new Error("Tenant scope invariant violated: employee not found for company");
    }

    const [deductionRow] = await db
      .select({ id: deductions.id })
      .from(deductions)
      .where(and(eq(deductions.id, (deduction as any).deductionId), eq(deductions.companyId, companyId)))
      .limit(1);

    if (!deductionRow) {
      throw new Error("Tenant scope invariant violated: deduction not found for company");
    }

    const [newEmployeeDeduction] = await db
      .insert(employeeDeductions)
      .values(deduction)
      .returning();
    return newEmployeeDeduction;
  }

  async getPayrollPeriodsByCompany(companyId: string): Promise<PayrollPeriod[]> {
    return db
      .select()
      .from(payrollPeriods)
      .where(eq(payrollPeriods.companyId, companyId))
      .orderBy(desc(payrollPeriods.endDate));
  }

  async createPayrollPeriod(period: InsertPayrollPeriod): Promise<PayrollPeriod> {
    enforceWriteCompanyScope((period as any)?.companyId, "createPayrollPeriod");
    const [newPeriod] = await db.insert(payrollPeriods).values(period).returning();
    return newPeriod;
  }

  async getTimeEntriesByEmployee(employeeId: string): Promise<TimeEntry[]> {
    return db
      .select()
      .from(timeEntries)
      .where(eq(timeEntries.employeeId, employeeId))
      .orderBy(desc(timeEntries.date));
  }

  async getTimeEntriesByPayrollPeriod(payrollPeriodId: string): Promise<TimeEntry[]> {
    return db
      .select()
      .from(timeEntries)
      .where(eq(timeEntries.payrollPeriodId, payrollPeriodId));
  }

  async createTimeEntry(entry: InsertTimeEntry): Promise<TimeEntry> {
    forbidUnscopedWrite("createTimeEntry");
    const [newEntry] = await db.insert(timeEntries).values(entry).returning();
    return newEntry;
  }

  async createTimeEntryByCompany(companyId: string, entry: InsertTimeEntry): Promise<TimeEntry> {
    enforceWriteCompanyScope(companyId, "createTimeEntry");

    const [employeeRow] = await db
      .select({ id: employees.id })
      .from(employees)
      .where(and(eq(employees.id, (entry as any).employeeId), eq(employees.companyId, companyId)))
      .limit(1);

    if (!employeeRow) {
      throw new Error("Tenant scope invariant violated: employee not found for company");
    }

    const [periodRow] = await db
      .select({ id: payrollPeriods.id })
      .from(payrollPeriods)
      .where(and(eq(payrollPeriods.id, (entry as any).payrollPeriodId), eq(payrollPeriods.companyId, companyId)))
      .limit(1);

    if (!periodRow) {
      throw new Error("Tenant scope invariant violated: payroll period not found for company");
    }

    const [newEntry] = await db.insert(timeEntries).values(entry).returning();
    return newEntry;
  }

  async approveTimeEntry(id: string, approvedBy: string): Promise<void> {
    forbidUnscopedWrite("approveTimeEntry");
    await db
      .update(timeEntries)
      .set({
        isApproved: true,
        approvedBy,
        approvedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(timeEntries.id, id));
  }

  async approveTimeEntryByCompany(companyId: string, id: string, approvedBy: string): Promise<void> {
    enforceWriteCompanyScope(companyId, "approveTimeEntry");

    const [row] = await db
      .select({ id: timeEntries.id })
      .from(timeEntries)
      .innerJoin(employees, eq(timeEntries.employeeId, employees.id))
      .where(and(eq(timeEntries.id, id), eq(employees.companyId, companyId)))
      .limit(1);

    if (!row) {
      throw new Error("Tenant scope invariant violated: time entry not found for company");
    }

    await db
      .update(timeEntries)
      .set({
        isApproved: true,
        approvedBy,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(timeEntries.id, id));
  }

  async getPayRunsByCompany(companyId: string): Promise<PayRun[]> {
    return db
      .select()
      .from(payRuns)
      .where(eq(payRuns.companyId, companyId))
      .orderBy(desc(payRuns.payDate));
  }

  async getPayRunWithDetails(
    id: string
  ): Promise<{ payRun: PayRun; details: PayRunDetail[] } | undefined> {
    const [payRun] = await db.select().from(payRuns).where(eq(payRuns.id, id));
    if (!payRun) return undefined;

    const details = await db
      .select()
      .from(payRunDetails)
      .where(eq(payRunDetails.payRunId, id));

    return { payRun, details };
  }

  async createPayRun(
    payRun: InsertPayRun,
    details: InsertPayRunDetail[]
  ): Promise<PayRun> {
    enforceWriteCompanyScope((payRun as any)?.companyId, "createPayRun");
    return db.transaction(async (tx) => {
      // Insert the pay run
      const [newPayRun] = await tx
        .insert(payRuns)
        .values(payRun)
        .returning();

      // Insert all pay run details
      if (details.length > 0) {
        await tx
          .insert(payRunDetails)
          .values(details.map(detail => ({
            ...detail,
            payRunId: newPayRun.id
          })));
      }

      return newPayRun;
    });
  }

  async updatePayRunStatus(id: string, status: string): Promise<void> {
    forbidUnscopedWrite("updatePayRunStatus");
    await db
      .update(payRuns)
      .set({
        status: status as any,
        updatedAt: new Date()
      })
      .where(eq(payRuns.id, id));
  }

  async updatePayRunStatusByCompany(
    companyId: string,
    id: string,
    status: string,
  ): Promise<void> {
    enforceWriteCompanyScope(companyId, "updatePayRunStatus");
    await db
      .update(payRuns)
      .set({
        status: status as any,
        updatedAt: new Date(),
      })
      .where(and(eq(payRuns.id, id), eq(payRuns.companyId, companyId)));
  }

  async executePayrollRun(
    companyId: string,
    payRunId: string,
    targetStatus: "approved" | "processing" | "completed",
    idempotencyKey: string
  ): Promise<{ payRun: PayRun; replayed: boolean }> {
    enforceWriteCompanyScope(companyId, "executePayrollRun");

    const key = typeof idempotencyKey === "string" ? idempotencyKey.trim() : "";
    if (!key) {
      throw new Error("Idempotency-Key is required for executePayrollRun");
    }

    const deterministicId = deterministicUuidV4(`company:${companyId}:op:executePayroll:key:${key}`);

    try {
      const result = await db.transaction(async (tx) => {
        const [existingPayRun] = await tx
          .select()
          .from(payRuns)
          .where(and(eq(payRuns.id, payRunId), eq(payRuns.companyId, companyId)))
          .limit(1);

        if (!existingPayRun) {
          throw new Error("Pay run not found");
        }

        if (existingPayRun.status === targetStatus) {
          return { payRun: existingPayRun, replayed: true };
        }

        const [updatedPayRun] = await tx
          .update(payRuns)
          .set({
            status: targetStatus as any,
            processedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(and(eq(payRuns.id, payRunId), eq(payRuns.companyId, companyId)))
          .returning();

        await tx.insert(s.payrollExecutions).values({
          id: deterministicId,
          companyId,
          payRunId,
          targetStatus,
          executedBy: existingPayRun.processedBy || existingPayRun.createdBy,
        }).onConflictDoNothing();

        return { payRun: updatedPayRun, replayed: false };
      });

      return result;
    } catch (err) {
      if (!isUniqueViolation(err)) {
        throw err;
      }

      const [existing] = await db
        .select()
        .from(payRuns)
        .where(and(eq(payRuns.id, payRunId), eq(payRuns.companyId, companyId)))
        .limit(1);

      if (!existing) {
        throw err;
      }

      if (existing.status !== targetStatus) {
        throw new Error("Idempotency-Key replay mismatch: payroll status differs from target");
      }

      return { payRun: existing, replayed: true };
    }
  }

  async getTaxFormsByCompany(companyId: string): Promise<TaxForm[]> {
    return db
      .select()
      .from(taxForms)
      .where(eq(taxForms.companyId, companyId))
      .orderBy(desc(taxForms.taxYear), desc(taxForms.formNumber));
  }

  async createTaxForm(form: InsertTaxForm): Promise<TaxForm> {
    enforceWriteCompanyScope((form as any)?.companyId, "createTaxForm");
    const [newTaxForm] = await db.insert(taxForms).values(form).returning();
    return newTaxForm;
  }

  async createPayrollTransaction(transaction: InsertPayrollTransaction): Promise<PayrollTransaction> {
    enforceWriteCompanyScope((transaction as any)?.companyId, "createPayrollTransaction");
    const [newTransaction] = await db
      .insert(payrollTransactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  // ==================
  // Invoice Operations
  // ==================
  async getInvoice(id: string): Promise<Invoice | undefined> {
    const ctx = getRequestContext();
    if (typeof ctx?.companyId === "string" && ctx.companyId) {
      throw new Error("Tenant scope invariant violated: unscoped invoice read while request context is tenant-scoped");
    }
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice;
  }

  async getInvoicesByCompany(companyId: string): Promise<Invoice[]> {
    return db
      .select()
      .from(invoices)
      .where(eq(invoices.companyId, companyId))
      .orderBy(desc(invoices.date), desc(invoices.invoiceNumber));
  }

  async getInvoiceWithItems(
    id: string
  ): Promise<{ invoice: Invoice; items: InvoiceItem[] } | undefined> {
    const invoice = await this.getInvoice(id);
    if (!invoice) return undefined;

    const items = await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, id));

    return { invoice, items };
  }

  async getInvoiceWithItemsByCompany(
    companyId: string,
    id: string,
  ): Promise<{ invoice: Invoice; items: InvoiceItem[] } | undefined> {
    assertCompanyScope(companyId);

    const [invoice] = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.companyId, companyId)))
      .limit(1);

    if (!invoice) return undefined;

    const items = await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, id));

    return { invoice, items };
  }

  async createInvoice(
    invoice: InsertInvoice,
    items: InsertInvoiceItem[],
    idempotencyKey: string
  ): Promise<{ invoice: Invoice; replayed: boolean }> {
    const companyId = String((invoice as any)?.companyId ?? "");
    enforceWriteCompanyScope(companyId, "createInvoice");

    const key = typeof idempotencyKey === "string" ? idempotencyKey.trim() : "";
    if (!key) {
      throw new Error("Idempotency-Key is required for createInvoice");
    }

    const deterministicId = deterministicUuidV4(`company:${companyId}:op:createInvoice:key:${key}`);

    try {
      const result = await db.transaction(async (tx) => {
        const [newInvoice] = await tx
          .insert(invoices)
          .values({
            ...(invoice as any),
            id: deterministicId,
          })
          .returning();

        if (items.length > 0) {
          await tx
            .insert(invoiceItems)
            .values(items.map(item => ({
              ...item,
              invoiceId: newInvoice.id
            })));
        }

        return { invoice: newInvoice, replayed: false };
      });

      return result;
    } catch (err) {
      if (!isUniqueViolation(err)) {
        throw err;
      }

      const [existing] = await db
        .select()
        .from(invoices)
        .where(and(eq(invoices.id, deterministicId), eq(invoices.companyId, companyId)))
        .limit(1);

      if (!existing) {
        throw err;
      }

      const incomingCustomerId = String((invoice as any).customerId ?? "");
      const incomingTotal = parseFloat(String((invoice as any).total ?? "0"));
      const existingTotal = parseFloat(String((existing as any).total ?? "0"));
      
      const normalizeDateForComparison = (val: any): string => {
        if (val instanceof Date) return val.toISOString();
        if (typeof val === "string") return new Date(val).toISOString();
        return String(val ?? "");
      };
      
      const incomingDueDate = normalizeDateForComparison((invoice as any).dueDate);
      const existingDueDate = normalizeDateForComparison((existing as any).dueDate);

      if (String((existing as any).customerId ?? "") !== incomingCustomerId || existingTotal !== incomingTotal || existingDueDate !== incomingDueDate) {
        throw new Error("Idempotency-Key replay mismatch for createInvoice");
      }

      return { invoice: existing, replayed: true };
    }
  }

  async updateInvoice(id: string, updates: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    forbidUnscopedWrite("updateInvoice");
    const [updatedInvoice] = await db
      .update(invoices)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    return updatedInvoice;
  }

  async updateInvoiceStatus(id: string, status: "draft" | "sent" | "viewed" | "paid" | "overdue" | "cancelled"): Promise<void> {
    forbidUnscopedWrite("updateInvoiceStatus");
    await db
      .update(invoices)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(invoices.id, id));
  }

  async finalizeInvoice(
    companyId: string,
    invoiceId: string,
    targetStatus: "sent" | "issued" | "approved" | "finalized",
    idempotencyKey: string
  ): Promise<{ invoice: Invoice; replayed: boolean }> {
    enforceWriteCompanyScope(companyId, "finalizeInvoice");

    const key = typeof idempotencyKey === "string" ? idempotencyKey.trim() : "";
    if (!key) {
      throw new Error("Idempotency-Key is required for finalizeInvoice");
    }

    const deterministicId = deterministicUuidV4(`company:${companyId}:op:finalizeInvoice:key:${key}`);

    try {
      const result = await db.transaction(async (tx) => {
        const [existingInvoice] = await tx
          .select()
          .from(invoices)
          .where(and(eq(invoices.id, invoiceId), eq(invoices.companyId, companyId)))
          .limit(1);

        if (!existingInvoice) {
          throw new Error("Invoice not found");
        }

        if (existingInvoice.status === targetStatus) {
          return { invoice: existingInvoice, replayed: true };
        }

        const [updatedInvoice] = await tx
          .update(invoices)
          .set({
            status: targetStatus as any,
            updatedAt: new Date(),
          })
          .where(and(eq(invoices.id, invoiceId), eq(invoices.companyId, companyId)))
          .returning();

        await tx.insert(s.invoiceFinalizations).values({
          id: deterministicId,
          companyId,
          invoiceId,
          targetStatus,
          finalizedBy: existingInvoice.createdBy,
        }).onConflictDoNothing();

        return { invoice: updatedInvoice, replayed: false };
      });

      return result;
    } catch (err) {
      if (!isUniqueViolation(err)) {
        throw err;
      }

      const [existing] = await db
        .select()
        .from(invoices)
        .where(and(eq(invoices.id, invoiceId), eq(invoices.companyId, companyId)))
        .limit(1);

      if (!existing) {
        throw err;
      }

      if (existing.status !== targetStatus) {
        throw new Error("Idempotency-Key replay mismatch: invoice status differs from target");
      }

      return { invoice: existing, replayed: true };
    }
  }

  // ====================
  // Payment Operations
  // ====================
  async getPaymentsByInvoice(invoiceId: string): Promise<Payment[]> {
    const ctx = getRequestContext();
    if (typeof ctx?.companyId === "string" && ctx.companyId) {
      throw new Error("Tenant scope invariant violated: unscoped payments read while request context is tenant-scoped");
    }
    return db
      .select()
      .from(payments)
      .where(eq(payments.invoiceId, invoiceId))
      .orderBy(desc(payments.date));
  }

  async getPaymentsByInvoiceByCompany(companyId: string, invoiceId: string): Promise<Payment[]> {
    assertCompanyScope(companyId);
    return db
      .select()
      .from(payments)
      .where(and(eq(payments.companyId, companyId), eq(payments.invoiceId, invoiceId)))
      .orderBy(desc(payments.date));
  }

  async createPayment(payment: InsertPayment, idempotencyKey: string): Promise<{ payment: Payment; replayed: boolean }> {
    const companyId = String((payment as any)?.companyId ?? "");
    const invoiceId = String((payment as any)?.invoiceId ?? "");

    // Use the canonical idempotent write helper
    const { withIdempotentWrite } = await import("./resilience/idempotent-write");

    const result = await withIdempotentWrite<Payment>({
      companyId,
      operationName: "createPayment",
      idempotencyKey,
      entityId: invoiceId,

      checkExisting: async (tx) => {
        // Generate the same deterministic ID to check for existing payment
        const deterministicId = deterministicUuidV4(`company:${companyId}:op:createPayment:key:${idempotencyKey.trim()}`);
        const [existing] = await tx
          .select()
          .from(payments)
          .where(and(eq(payments.id, deterministicId), eq(payments.companyId, companyId)))
          .limit(1);
        return existing || null;
      },

      executeWrite: async (tx) => {
        const deterministicId = deterministicUuidV4(`company:${companyId}:op:createPayment:key:${idempotencyKey.trim()}`);
        
        const [newPayment] = await tx
          .insert(payments)
          .values({
            ...(payment as any),
            id: deterministicId,
          })
          .returning();

        // Update invoice amount paid atomically
        await tx
          .update(invoices)
          .set({
            amountPaid: sql`${invoices.amountPaid} + ${(payment as any).amount}`,
            updatedAt: new Date(),
          })
          .where(and(eq(invoices.id, invoiceId), eq(invoices.companyId, companyId)));

        return newPayment;
      },

      insertTracking: async (tx, deterministicId) => {
        // Payment uses the payment row itself as tracking (deterministic ID is the primary key)
        // No separate tracking table needed
      },

      validateReplay: (existing) => {
        const incomingInvoiceId = String((payment as any).invoiceId ?? "");
        const incomingAmount = String((payment as any).amount ?? "");
        const incomingDate = (payment as any).date instanceof Date ? (payment as any).date.toISOString() : String((payment as any).date ?? "");
        const existingDate = (existing as any).date instanceof Date ? (existing as any).date.toISOString() : String((existing as any).date ?? "");

        if (
          String((existing as any).invoiceId ?? "") !== incomingInvoiceId ||
          String((existing as any).amount ?? "") !== incomingAmount ||
          existingDate !== incomingDate
        ) {
          throw new Error("Idempotency-Key replay mismatch for createPayment");
        }
      },
    });

    return {
      payment: result.entity,
      replayed: result.replayed,
    };
  }

  // =========================
  // Bank Transaction Operations
  // =========================
  async getBankTransactionsByCompany(companyId: string): Promise<BankTransaction[]> {
    return db
      .select()
      .from(s.bankTransactions)
      .where(eq(s.bankTransactions.companyId, companyId))
      .orderBy(desc(s.bankTransactions.date));
  }

  async createBankTransaction(transaction: InsertBankTransaction): Promise<BankTransaction> {
    enforceWriteCompanyScope((transaction as any)?.companyId, "createBankTransaction");
    const [newTransaction] = await db
      .insert(s.bankTransactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  async reconcileBankTransaction(id: string, matchedTransactionId: string): Promise<void> {
    forbidUnscopedWrite("reconcileBankTransaction");
    await db
      .update(s.bankTransactions)
      .set({
        matchedTransactionId,
        isReconciled: true,
        reconciledAt: new Date()
      })
      .where(eq(s.bankTransactions.id, id));
  }

  async reconcileBankTransactionByCompany(companyId: string, id: string, matchedTransactionId: string): Promise<void> {
    enforceWriteCompanyScope(companyId, "reconcileBankTransaction");
    await db
      .update(s.bankTransactions)
      .set({
        matchedTransactionId,
        isReconciled: true,
        reconciledAt: new Date(),
      })
      .where(and(eq(s.bankTransactions.id, id), eq(s.bankTransactions.companyId, companyId)));
  }

  async reconcileLedger(
    companyId: string,
    bankTransactionId: string,
    matchedTransactionId: string,
    idempotencyKey: string,
    userId: string
  ): Promise<{ bankTransaction: BankTransaction; replayed: boolean }> {
    enforceWriteCompanyScope(companyId, "reconcileLedger");

    const key = typeof idempotencyKey === "string" ? idempotencyKey.trim() : "";
    if (!key) {
      throw new Error("Idempotency-Key is required for reconcileLedger");
    }

    const deterministicId = deterministicUuidV4(`company:${companyId}:op:reconcileLedger:key:${key}`);

    try {
      const result = await db.transaction(async (tx) => {
        const [existingBankTxn] = await tx
          .select()
          .from(s.bankTransactions)
          .where(and(eq(s.bankTransactions.id, bankTransactionId), eq(s.bankTransactions.companyId, companyId)))
          .limit(1);

        if (!existingBankTxn) {
          throw new Error("Bank transaction not found");
        }

        if (existingBankTxn.isReconciled) {
          return { bankTransaction: existingBankTxn, replayed: true };
        }

        const [updatedBankTxn] = await tx
          .update(s.bankTransactions)
          .set({
            matchedTransactionId,
            isReconciled: true,
            reconciledAt: new Date(),
          })
          .where(and(eq(s.bankTransactions.id, bankTransactionId), eq(s.bankTransactions.companyId, companyId)))
          .returning();

        await tx.insert(s.ledgerReconciliations).values({
          id: deterministicId,
          companyId,
          bankTransactionId,
          reconciledAmount: existingBankTxn.amount,
          reconciledBy: userId,
        }).onConflictDoNothing();

        return { bankTransaction: updatedBankTxn, replayed: false };
      });

      return result;
    } catch (err) {
      if (!isUniqueViolation(err)) {
        throw err;
      }

      const [existing] = await db
        .select()
        .from(s.bankTransactions)
        .where(and(eq(s.bankTransactions.id, bankTransactionId), eq(s.bankTransactions.companyId, companyId)))
        .limit(1);

      if (!existing) {
        throw err;
      }

      if (!existing.isReconciled) {
        throw new Error("Idempotency-Key replay mismatch: bank transaction not reconciled");
      }

      const existingAmount = parseFloat(String(existing.amount ?? "0"));
      const [reconciliation] = await db
        .select()
        .from(s.ledgerReconciliations)
        .where(eq(s.ledgerReconciliations.id, deterministicId))
        .limit(1);

      if (reconciliation) {
        const reconciledAmount = parseFloat(String(reconciliation.reconciledAmount ?? "0"));
        if (existingAmount !== reconciledAmount) {
          throw new Error("Idempotency-Key replay mismatch: reconciled amount differs");
        }
      }

      return { bankTransaction: existing, replayed: true };
    }
  }

  // ===================
  // Audit Log Operations
  // ===================
  async createAuditLog(log: {
    companyId?: string | null;
    userId?: string | null;
    action: string;
    entityType: string;
    entityId: string;
    changes?: string;
  }): Promise<void> {
    enforceWriteCompanyScope(log.companyId, "createAuditLog");
    await db.insert(auditLogs).values({
      ...log,
      createdAt: new Date()
    });
  }
}

export const storage = new DatabaseStorage();
