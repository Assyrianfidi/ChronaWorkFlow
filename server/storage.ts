// Storage layer implementing database operations
import { db } from "./db";
import { eq, and, desc, sql, sum } from "drizzle-orm";
import * as schema from "../shared/schema";

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

export interface IStorage {
  // Companies
  getCompany(id: string): Promise<Company | undefined>;
  getCompanies(): Promise<Company[]>;
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
  createInvoice(invoice: InsertInvoice, items: InsertInvoiceItem[]): Promise<Invoice>;
  updateInvoice(id: string, updates: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  updateInvoiceStatus(id: string, status: string): Promise<void>;

  // Payments
  getPaymentsByInvoice(invoiceId: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;

  // Bank Transactions
  getBankTransactionsByCompany(companyId: string): Promise<BankTransaction[]>;
  createBankTransaction(transaction: InsertBankTransaction): Promise<BankTransaction>;
  reconcileBankTransaction(id: string, matchedTransactionId: string): Promise<void>;

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
  getDeductionsByCompany(companyId: string): Promise<Deduction[]>;
  createDeduction(deduction: InsertDeduction): Promise<Deduction>;
  getEmployeeDeductionsByEmployee(employeeId: string): Promise<EmployeeDeduction[]>;
  createEmployeeDeduction(deduction: InsertEmployeeDeduction): Promise<EmployeeDeduction>;
  getPayrollPeriodsByCompany(companyId: string): Promise<PayrollPeriod[]>;
  createPayrollPeriod(period: InsertPayrollPeriod): Promise<PayrollPeriod>;
  getTimeEntriesByEmployee(employeeId: string): Promise<TimeEntry[]>;
  getTimeEntriesByPayrollPeriod(payrollPeriodId: string): Promise<TimeEntry[]>;
  createTimeEntry(entry: InsertTimeEntry): Promise<TimeEntry>;
  approveTimeEntry(id: string, approvedBy: string): Promise<void>;
  getPayRunsByCompany(companyId: string): Promise<PayRun[]>;
  getPayRunWithDetails(id: string): Promise<{ payRun: PayRun; details: PayRunDetail[] } | undefined>;
  createPayRun(payRun: InsertPayRun, details: InsertPayRunDetail[]): Promise<PayRun>;
  updatePayRunStatus(id: string, status: string): Promise<void>;
  getTaxFormsByCompany(companyId: string): Promise<TaxForm[]>;
  createTaxForm(form: InsertTaxForm): Promise<TaxForm>;
  createPayrollTransaction(transaction: InsertPayrollTransaction): Promise<PayrollTransaction>;

  // Inventory Module
  getInventoryItemsByCompany(companyId: string): Promise<InventoryItem[]>;
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryItem(id: string, updates: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined>;
  updateInventoryQuantity(id: string, quantityChange: string, reason: string): Promise<void>;
  getInventoryItem(id: string): Promise<InventoryItem | undefined>;
  getPurchaseOrdersByCompany(companyId: string): Promise<PurchaseOrder[]>;
  getPurchaseOrderWithItems(id: string): Promise<{ purchaseOrder: PurchaseOrder; items: PurchaseOrderItem[] } | undefined>;
  getPurchaseOrder(id: string): Promise<PurchaseOrder | undefined>;
  createPurchaseOrder(order: InsertPurchaseOrder, items: InsertPurchaseOrderItem[]): Promise<PurchaseOrder>;
  updatePurchaseOrderStatus(id: string, status: string): Promise<void>;
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

  async createCompany(company: InsertCompany): Promise<Company> {
    const [newCompany] = await db.insert(companies).values(company).returning();
    return newCompany;
  }

  async updateCompany(id: string, updates: Partial<InsertCompany>): Promise<Company | undefined> {
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
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
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
    const [newAccount] = await db.insert(accounts).values(account).returning();
    return newAccount;
  }

  async updateAccount(id: string, updates: Partial<InsertAccount>): Promise<Account | undefined> {
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
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }

  async updateCustomer(id: string, updates: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [updatedCustomer] = await db
      .update(customers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(customers.id, id))
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
    const [newVendor] = await db.insert(vendors).values(vendor).returning();
    return newVendor;
  }

  async updateVendor(id: string, updates: Partial<InsertVendor>): Promise<Vendor | undefined> {
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
    return db.transaction(async (tx) => {
      // Insert the transaction
      const inserted = (await tx
        .insert(transactions)
        .values(transaction)
        .returning()) as any[];

      const newTransaction = inserted[0] as any;

      // Insert all transaction lines
      if (lines.length > 0) {
        await tx
          .insert(transactionLines)
          .values(lines.map(line => ({
            ...line,
            transactionId: newTransaction.id
          })));
      }

      return newTransaction;
    });
  }

  async voidTransaction(id: string, voidedBy: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Mark transaction as voided
      await tx
        .update(transactions)
        .set({
          isVoid: true,
          voidedBy,
          voidedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(transactions.id, id));

      // TODO: Reverse any account balances affected by this transaction
      // This would depend on your specific accounting logic
    });
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
    const [newItem] = await db.insert(inventoryItems).values(item).returning();
    return newItem;
  }

  async updateInventoryItem(
    id: string,
    updates: Partial<InsertInventoryItem>
  ): Promise<InventoryItem | undefined> {
    const [updatedItem] = await db
      .update(inventoryItems)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(inventoryItems.id, id))
      .returning();
    return updatedItem;
  }

  async updateInventoryQuantity(
    id: string,
    quantityChange: string,
    reason: string
  ): Promise<void> {
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
    await db
      .update(purchaseOrders)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(purchaseOrders.id, id));
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
    const [newEmployee] = await db.insert(employees).values(employee).returning();
    return newEmployee;
  }

  async updateEmployee(
    id: string,
    updates: Partial<InsertEmployee>
  ): Promise<Employee | undefined> {
    const [updatedEmployee] = await db
      .update(employees)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(employees.id, id))
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
    const [newEntry] = await db.insert(timeEntries).values(entry).returning();
    return newEntry;
  }

  async approveTimeEntry(id: string, approvedBy: string): Promise<void> {
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

  async updatePayRunStatus(id: string, status: "draft" | "pending_approval" | "approved" | "processing" | "completed" | "cancelled"): Promise<void> {
    await db
      .update(payRuns)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(payRuns.id, id));
  }

  async getTaxFormsByCompany(companyId: string): Promise<TaxForm[]> {
    return db
      .select()
      .from(taxForms)
      .where(eq(taxForms.companyId, companyId))
      .orderBy(desc(taxForms.taxYear), desc(taxForms.formNumber));
  }

  async createTaxForm(form: InsertTaxForm): Promise<TaxForm> {
    const [newTaxForm] = await db.insert(taxForms).values(form).returning();
    return newTaxForm;
  }

  async createPayrollTransaction(transaction: InsertPayrollTransaction): Promise<PayrollTransaction> {
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

  async createInvoice(
    invoice: InsertInvoice,
    items: InsertInvoiceItem[]
  ): Promise<Invoice> {
    return db.transaction(async (tx) => {
      // Insert the invoice
      const [newInvoice] = await tx
        .insert(invoices)
        .values(invoice)
        .returning();

      // Insert all invoice items
      if (items.length > 0) {
        await tx
          .insert(invoiceItems)
          .values(items.map(item => ({
            ...item,
            invoiceId: newInvoice.id
          })));
      }

      return newInvoice;
    });
  }

  async updateInvoice(id: string, updates: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const [updatedInvoice] = await db
      .update(invoices)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    return updatedInvoice;
  }

  async updateInvoiceStatus(id: string, status: "draft" | "sent" | "viewed" | "paid" | "overdue" | "cancelled"): Promise<void> {
    await db
      .update(invoices)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(invoices.id, id));
  }

  // ====================
  // Payment Operations
  // ====================
  async getPaymentsByInvoice(invoiceId: string): Promise<Payment[]> {
    return db
      .select()
      .from(payments)
      .where(eq(payments.invoiceId, invoiceId))
      .orderBy(desc(payments.date));
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    return db.transaction(async (tx) => {
      // Insert the payment
      const [newPayment] = await tx
        .insert(payments)
        .values(payment)
        .returning();

      // Update the invoice paid amount
      await tx
        .update(invoices)
        .set({
          amountPaid: sql`${invoices.amountPaid} + ${payment.amount}`,
          updatedAt: new Date()
        })
        .where(eq(invoices.id, payment.invoiceId));

      return newPayment;
    });
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
    const [newTransaction] = await db
      .insert(s.bankTransactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  async reconcileBankTransaction(id: string, matchedTransactionId: string): Promise<void> {
    await db
      .update(s.bankTransactions)
      .set({
        matchedTransactionId,
        isReconciled: true,
        reconciledAt: new Date()
      })
      .where(eq(s.bankTransactions.id, id));
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
    await db.insert(auditLogs).values({
      ...log,
      createdAt: new Date()
    });
  }
}

export const storage = new DatabaseStorage();
