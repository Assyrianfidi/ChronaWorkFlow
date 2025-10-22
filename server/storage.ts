// Storage layer implementing database operations using javascript_database blueprint
import { db } from "./db";
import { eq, and, desc, sql, sum } from "drizzle-orm";
import {
  companies,
  users,
  userCompanyAccess,
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
} from "@shared/schema";

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

    const lines = await db
      .select()
      .from(transactionLines)
      .where(eq(transactionLines.transactionId, id));

    return { transaction, lines };
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
}

export const storage = new DatabaseStorage();
