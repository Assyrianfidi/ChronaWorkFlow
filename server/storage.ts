// Storage layer implementing database operations using javascript_database blueprint
import { db } from "./db";
import { eq, and, desc, sql, sum } from "drizzle-orm";
import {
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
  // Types
  type Employee,
  type InsertEmployee,
  type Deduction,
  type InsertDeduction,
  type EmployeeDeduction,
  type InsertEmployeeDeduction,
  type PayrollPeriod,
  type InsertPayrollPeriod,
  type TimeEntry,
  type InsertTimeEntry,
  type PayRun,
  type InsertPayRun,
  type PayRunDetail,
  type InsertPayRunDetail,
  type PayRunDeduction,
  type InsertPayRunDeduction,
  type TaxForm,
  type InsertTaxForm,
  type PayrollTransaction,
  type InsertPayrollTransaction,
  type InventoryItem,
  type InsertInventoryItem,
  type PurchaseOrder,
  type InsertPurchaseOrder,
  type PurchaseOrderItem,
  type InsertPurchaseOrderItem,
  type InventoryAdjustment,
  type InsertInventoryAdjustment,
  type Company,
  type InsertCompany,
  type User,
  type InsertUser,
  type Account,
  type InsertAccount,
  type Customer,
  type InsertCustomer,
  type Vendor,
  type InsertVendor,
  type Transaction,
  type InsertTransaction,
  type TransactionLine,
  type InsertTransactionLine,
  type Invoice,
  type InsertInvoice,
  type InvoiceItem,
  type InsertInvoiceItem,
  type Payment,
  type InsertPayment,
  type BankTransaction,
  type InsertBankTransaction,
  type AuditLog,
} from "../shared/schema";

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
    companyId: string;
    userId: string;
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
  getPurchaseOrdersByCompany(companyId: string): Promise<PurchaseOrder[]>;
  getPurchaseOrderWithItems(id: string): Promise<{ purchaseOrder: PurchaseOrder; items: PurchaseOrderItem[] } | undefined>;
  createPurchaseOrder(order: InsertPurchaseOrder, items: InsertPurchaseOrderItem[]): Promise<PurchaseOrder>;
  updatePurchaseOrderStatus(id: string, status: string): Promise<void>;
  getInventoryAdjustmentsByCompany(companyId: string): Promise<InventoryAdjustment[]>;
  createInventoryAdjustment(adjustment: InsertInventoryAdjustment): Promise<InventoryAdjustment>;
}

export class DatabaseStorage implements IStorage {
  // Companies
  async getCompany(id: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company || undefined;
  }

  async getCompanies(): Promise<Company[]> {
    return db.select().from(companies);
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const [company] = await db.insert(companies).values(insertCompany).returning();
    return company;
  }

  async updateCompany(id: string, updates: Partial<InsertCompany>): Promise<Company | undefined> {
    const [company] = await db
      .update(companies)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();
    return company || undefined;
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  // Accounts
  async getAccount(id: string): Promise<Account | undefined> {
    const [account] = await db.select().from(accounts).where(eq(accounts.id, id));
    return account || undefined;
  }

  async getAccountsByCompany(companyId: string): Promise<Account[]> {
    return db.select().from(accounts).where(eq(accounts.companyId, companyId));
  }

  async createAccount(insertAccount: InsertAccount): Promise<Account> {
    const [account] = await db.insert(accounts).values(insertAccount).returning();
    return account;
  }

  async updateAccount(id: string, updates: Partial<InsertAccount>): Promise<Account | undefined> {
    const [account] = await db
      .update(accounts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(accounts.id, id))
      .returning();
    return account || undefined;
  }

  async updateAccountBalance(id: string, amount: string): Promise<void> {
    await db
      .update(accounts)
      .set({ balance: sql`${accounts.balance} + ${amount}` })
      .where(eq(accounts.id, id));
  }

  // Customers
  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async getCustomersByCompany(companyId: string): Promise<Customer[]> {
    return db.select().from(customers).where(eq(customers.companyId, companyId));
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const [customer] = await db.insert(customers).values(insertCustomer).returning();
    return customer;
  }

  async updateCustomer(id: string, updates: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [customer] = await db
      .update(customers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return customer || undefined;
  }

  async updateCustomerBalance(id: string, amount: string): Promise<void> {
    await db
      .update(customers)
      .set({ balance: sql`${customers.balance} + ${amount}` })
      .where(eq(customers.id, id));
  }

  // Vendors
  async getVendor(id: string): Promise<Vendor | undefined> {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, id));
    return vendor || undefined;
  }

  async getVendorsByCompany(companyId: string): Promise<Vendor[]> {
    return db.select().from(vendors).where(eq(vendors.companyId, companyId));
  }

  async createVendor(insertVendor: InsertVendor): Promise<Vendor> {
    const [vendor] = await db.insert(vendors).values(insertVendor).returning();
    return vendor;
  }

  async updateVendor(id: string, updates: Partial<InsertVendor>): Promise<Vendor | undefined> {
    const [vendor] = await db
      .update(vendors)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(vendors.id, id))
      .returning();
    return vendor || undefined;
  }

  // Transactions
  async getTransaction(id: string): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction || undefined;
  }

  async getTransactionsByCompany(companyId: string, limit: number = 50): Promise<Transaction[]> {
    return db
      .select()
      .from(transactions)
      .where(eq(transactions.companyId, companyId))
      .orderBy(desc(transactions.date))
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
    return db.select().from(transactionLines).where(eq(transactionLines.transactionId, transactionId));
  }

  async createTransaction(
    insertTransaction: InsertTransaction,
    insertLines: InsertTransactionLine[]
  ): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values(insertTransaction)
      .returning();

    // Insert transaction lines
    const lines = insertLines.map((line) => ({
      ...line,
      transactionId: transaction.id,
    }));

    await db.insert(transactionLines).values(lines);

    // Update account balances
    for (const line of lines) {
      const debitAmount = line.debit || "0";
      const creditAmount = line.credit || "0";
      const netAmount = parseFloat(debitAmount) - parseFloat(creditAmount);

      if (netAmount !== 0) {
        await this.updateAccountBalance(line.accountId, netAmount.toString());
      }
    }

    return transaction;
  }

  async voidTransaction(id: string, voidedBy: string): Promise<void> {
    await db
      .update(transactions)
      .set({
        isVoid: true,
        voidedAt: new Date(),
        voidedBy,
        updatedAt: new Date(),
      })
      .where(eq(transactions.id, id));
  }

  // Invoices
  async getInvoice(id: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice || undefined;
  }

  async getInvoicesByCompany(companyId: string): Promise<Invoice[]> {
    return db
      .select()
      .from(invoices)
      .where(eq(invoices.companyId, companyId))
      .orderBy(desc(invoices.date));
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
    insertInvoice: InsertInvoice,
    insertItems: InsertInvoiceItem[]
  ): Promise<Invoice> {
    const [invoice] = await db.insert(invoices).values(insertInvoice).returning();

    const items = insertItems.map((item) => ({
      ...item,
      invoiceId: invoice.id,
    }));

    await db.insert(invoiceItems).values(items);

    return invoice;
  }

  async updateInvoice(id: string, updates: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const [invoice] = await db
      .update(invoices)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    return invoice || undefined;
  }

  async updateInvoiceStatus(id: string, status: string): Promise<void> {
    await db
      .update(invoices)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(invoices.id, id));
  }

  // Payments
  async getPaymentsByInvoice(invoiceId: string): Promise<Payment[]> {
    return db.select().from(payments).where(eq(payments.invoiceId, invoiceId));
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const [payment] = await db.insert(payments).values(insertPayment).returning();

    // Update invoice amountPaid
    await db
      .update(invoices)
      .set({
        amountPaid: sql`${invoices.amountPaid} + ${payment.amount}`,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, payment.invoiceId));

    // Check if invoice is fully paid
    const invoice = await this.getInvoice(payment.invoiceId);
    if (invoice) {
      const totalPaid = parseFloat(invoice.amountPaid) + parseFloat(payment.amount);
      if (totalPaid >= parseFloat(invoice.total)) {
        await this.updateInvoiceStatus(payment.invoiceId, "paid");
      }
    }

    return payment;
  }

  // Bank Transactions
  async getBankTransactionsByCompany(companyId: string): Promise<BankTransaction[]> {
    return db
      .select()
      .from(bankTransactions)
      .where(eq(bankTransactions.companyId, companyId))
      .orderBy(desc(bankTransactions.date));
  }

  async createBankTransaction(insertTransaction: InsertBankTransaction): Promise<BankTransaction> {
    const [transaction] = await db
      .insert(bankTransactions)
      .values(insertTransaction)
      .returning();
    return transaction;
  }

  async reconcileBankTransaction(id: string, matchedTransactionId: string): Promise<void> {
    await db
      .update(bankTransactions)
      .set({
        isReconciled: true,
        reconciledAt: new Date(),
        matchedTransactionId,
      })
      .where(eq(bankTransactions.id, id));
  }

  // Audit Logs
  async createAuditLog(log: {
    companyId: string;
    userId: string;
    action: string;
    entityType: string;
    entityId: string;
    changes?: string;
  }): Promise<void> {
    await db.insert(auditLogs).values(log);
  }

  // Payroll Module
  async getEmployee(id: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee || undefined;
  }

  async getEmployeesByCompany(companyId: string): Promise<Employee[]> {
    return db.select().from(employees).where(eq(employees.companyId, companyId));
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const [employee] = await db.insert(employees).values(insertEmployee).returning();
    return employee;
  }

  async updateEmployee(id: string, updates: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const [employee] = await db
      .update(employees)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(employees.id, id))
      .returning();
    return employee || undefined;
  }

  async getDeductionsByCompany(companyId: string): Promise<Deduction[]> {
    return db.select().from(deductions).where(eq(deductions.companyId, companyId));
  }

  async createDeduction(insertDeduction: InsertDeduction): Promise<Deduction> {
    const [deduction] = await db.insert(deductions).values(insertDeduction).returning();
    return deduction;
  }

  async getEmployeeDeductionsByEmployee(employeeId: string): Promise<EmployeeDeduction[]> {
    return db.select().from(employeeDeductions).where(eq(employeeDeductions.employeeId, employeeId));
  }

  async createEmployeeDeduction(insertDeduction: InsertEmployeeDeduction): Promise<EmployeeDeduction> {
    const [deduction] = await db.insert(employeeDeductions).values(insertDeduction).returning();
    return deduction;
  }

  async getPayrollPeriodsByCompany(companyId: string): Promise<PayrollPeriod[]> {
    return db.select().from(payrollPeriods).where(eq(payrollPeriods.companyId, companyId));
  }

  async createPayrollPeriod(insertPeriod: InsertPayrollPeriod): Promise<PayrollPeriod> {
    const [period] = await db.insert(payrollPeriods).values(insertPeriod).returning();
    return period;
  }

  async getTimeEntriesByEmployee(employeeId: string): Promise<TimeEntry[]> {
    return db.select().from(timeEntries).where(eq(timeEntries.employeeId, employeeId));
  }

  async getTimeEntriesByPayrollPeriod(payrollPeriodId: string): Promise<TimeEntry[]> {
    return db.select().from(timeEntries).where(eq(timeEntries.payrollPeriodId, payrollPeriodId));
  }

  async createTimeEntry(insertEntry: InsertTimeEntry): Promise<TimeEntry> {
    const [entry] = await db.insert(timeEntries).values(insertEntry).returning();
    return entry;
  }

  async approveTimeEntry(id: string, approvedBy: string): Promise<void> {
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
    return db.select().from(payRuns).where(eq(payRuns.companyId, companyId));
  }

  async getPayRunWithDetails(id: string): Promise<{ payRun: PayRun; details: PayRunDetail[] } | undefined> {
    const payRun = await this.getPayRun(id);
    if (!payRun) return undefined;

    const details = await db.select().from(payRunDetails).where(eq(payRunDetails.payRunId, id));
    return { payRun, details };
  }

  async getPayRun(id: string): Promise<PayRun | undefined> {
    const [payRun] = await db.select().from(payRuns).where(eq(payRuns.id, id));
    return payRun || undefined;
  }

  async createPayRun(insertPayRun: InsertPayRun, insertDetails: InsertPayRunDetail[]): Promise<PayRun> {
    const [payRun] = await db.insert(payRuns).values(insertPayRun).returning();

    const details = insertDetails.map((detail) => ({
      ...detail,
      payRunId: payRun.id,
    }));

    await db.insert(payRunDetails).values(details);
    return payRun;
  }

  async updatePayRunStatus(id: string, status: string): Promise<void> {
    await db
      .update(payRuns)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(payRuns.id, id));
  }

  async getTaxFormsByCompany(companyId: string): Promise<TaxForm[]> {
    return db.select().from(taxForms).where(eq(taxForms.companyId, companyId));
  }

  async createTaxForm(insertForm: InsertTaxForm): Promise<TaxForm> {
    const [form] = await db.insert(taxForms).values(insertForm).returning();
    return form;
  }

  async createPayrollTransaction(insertTransaction: InsertPayrollTransaction): Promise<PayrollTransaction> {
    const [transaction] = await db.insert(payrollTransactions).values(insertTransaction).returning();
    return transaction;
  }

  // Inventory Module
  async getInventoryItemsByCompany(companyId: string): Promise<InventoryItem[]> {
    return db.select().from(inventoryItems).where(eq(inventoryItems.companyId, companyId));
  }

  async createInventoryItem(insertItem: InsertInventoryItem): Promise<InventoryItem> {
    const [item] = await db.insert(inventoryItems).values(insertItem).returning();
    return item;
  }

  async updateInventoryItem(id: string, updates: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined> {
    const [item] = await db
      .update(inventoryItems)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(inventoryItems.id, id))
      .returning();
    return item || undefined;
  }

  async updateInventoryQuantity(id: string, quantityChange: string, reason: string): Promise<void> {
    const item = await this.getInventoryItem(id);
    if (!item) throw new Error("Inventory item not found");

    const currentQuantity = parseFloat(item.quantityOnHand);
    const change = parseFloat(quantityChange);
    const newQuantity = (currentQuantity + change).toString();

    await db
      .update(inventoryItems)
      .set({
        quantityOnHand: newQuantity,
        quantityAvailable: newQuantity, // Simplified - would need to account for reserved
        updatedAt: new Date(),
      })
      .where(eq(inventoryItems.id, id));
  }

  async getInventoryItem(id: string): Promise<InventoryItem | undefined> {
    const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, id));
    return item || undefined;
  }

  async getPurchaseOrdersByCompany(companyId: string): Promise<PurchaseOrder[]> {
    return db.select().from(purchaseOrders).where(eq(purchaseOrders.companyId, companyId));
  }

  async getPurchaseOrderWithItems(id: string): Promise<{ purchaseOrder: PurchaseOrder; items: PurchaseOrderItem[] } | undefined> {
    const purchaseOrder = await this.getPurchaseOrder(id);
    if (!purchaseOrder) return undefined;

    const items = await db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, id));
    return { purchaseOrder, items };
  }

  async getPurchaseOrder(id: string): Promise<PurchaseOrder | undefined> {
    const [order] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id));
    return order || undefined;
  }

  async createPurchaseOrder(insertOrder: InsertPurchaseOrder, insertItems: InsertPurchaseOrderItem[]): Promise<PurchaseOrder> {
    const [order] = await db.insert(purchaseOrders).values(insertOrder).returning();

    const items = insertItems.map((item) => ({
      ...item,
      purchaseOrderId: order.id,
    }));

    await db.insert(purchaseOrderItems).values(items);
    return order;
  }

  async updatePurchaseOrderStatus(id: string, status: string): Promise<void> {
    await db
      .update(purchaseOrders)
      .set({ status, updatedAt: new Date() })
      .where(eq(purchaseOrders.id, id));
  }

  async getInventoryAdjustmentsByCompany(companyId: string): Promise<InventoryAdjustment[]> {
    return db.select().from(inventoryAdjustments).where(eq(inventoryAdjustments.companyId, companyId));
  }

  async createInventoryAdjustment(insertAdjustment: InsertInventoryAdjustment): Promise<InventoryAdjustment> {
    const [adjustment] = await db.insert(inventoryAdjustments).values(insertAdjustment).returning();
    return adjustment;
  }
}

export const storage = new DatabaseStorage();
