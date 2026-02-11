/**
 * Core Type Definitions for ChronaWorkFlow
 */

// User & Authentication
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: UserRole;
  mfaEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'owner' | 'admin' | 'accountant' | 'viewer';

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
  mfaCode?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName: string;
}

// Company / Tenant
export interface Company {
  id: string;
  name: string;
  legalName?: string;
  taxId?: string;
  address?: Address;
  currency: string;
  fiscalYearEnd: string;
  industry?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo?: string;
  plan: SubscriptionPlan;
  status: CompanyStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export type SubscriptionPlan = 'free' | 'pro' | 'business' | 'enterprise';
export type CompanyStatus = 'active' | 'suspended' | 'cancelled';

// Accounting - Chart of Accounts
export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  subtype?: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
  isSystem: boolean;
  balance: number;
  currency: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export type AccountType = 
  | 'asset' 
  | 'liability' 
  | 'equity' 
  | 'revenue' 
  | 'expense';

// Journal Entries
export interface JournalEntry {
  id: string;
  entryNumber: string;
  date: string;
  description: string;
  reference?: string;
  lines: JournalEntryLine[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  status: JournalEntryStatus;
  postedAt?: string;
  postedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntryLine {
  id: string;
  accountId: string;
  account: Account;
  description?: string;
  debit: number;
  credit: number;
}

export type JournalEntryStatus = 'draft' | 'posted' | 'reversed';

// General Ledger
export interface GeneralLedgerEntry {
  id: string;
  date: string;
  journalEntryId: string;
  accountId: string;
  account: Account;
  description: string;
  reference?: string;
  debit: number;
  credit: number;
  balance: number;
}

// Trial Balance
export interface TrialBalanceItem {
  accountId: string;
  account: Account;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  openingBalance: number;
  debits: number;
  credits: number;
  netMovement: number;
  closingBalance: number;
}

export interface TrialBalance {
  asOfDate: string;
  items: TrialBalanceItem[];
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
  difference: number;
}

// Invoicing
export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customer: Customer;
  issueDate: string;
  dueDate: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  status: InvoiceStatus;
  paymentTerms: string;
  notes?: string;
  terms?: string;
  stripePaymentLink?: string;
  pdfUrl?: string;
  sentAt?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate?: number;
  taxAmount?: number;
  accountId: string;
}

export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: Address;
  taxId?: string;
  paymentTerms?: string;
  currency: string;
  notes?: string;
  isActive: boolean;
  balance: number;
  totalInvoiced: number;
  totalPaid: number;
  createdAt: string;
  updatedAt: string;
}

// Expenses & Bills
export interface Expense {
  id: string;
  expenseNumber: string;
  date: string;
  vendorId?: string;
  vendor?: Vendor;
  categoryId: string;
  category: Account;
  description: string;
  amount: number;
  taxAmount: number;
  total: number;
  currency: string;
  receiptUrl?: string;
  isReimbursable: boolean;
  isBillable: boolean;
  status: ExpenseStatus;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type ExpenseStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'reimbursed';

export interface Vendor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: Address;
  taxId?: string;
  paymentTerms?: string;
  currency: string;
  isActive: boolean;
  notes?: string;
  totalBilled: number;
  totalPaid: number;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export interface Bill {
  id: string;
  billNumber: string;
  vendorId: string;
  vendor: Vendor;
  billDate: string;
  dueDate: string;
  lineItems: BillLineItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  status: BillStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BillLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  accountId: string;
}

export type BillStatus = 'draft' | 'open' | 'partial' | 'paid' | 'overdue';

// Reports
export interface ProfitLossReport {
  startDate: string;
  endDate: string;
  revenue: PLCategory[];
  expenses: PLCategory[];
  grossProfit: number;
  operatingProfit: number;
  netProfit: number;
}

export interface PLCategory {
  accountId: string;
  accountName: string;
  amount: number;
  percentage: number;
}

export interface BalanceSheetReport {
  asOfDate: string;
  assets: BalanceSheetCategory[];
  liabilities: BalanceSheetCategory[];
  equity: BalanceSheetCategory[];
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
}

export interface BalanceSheetCategory {
  accountId: string;
  accountName: string;
  amount: number;
  subcategories?: BalanceSheetCategory[];
}

export interface CashFlowReport {
  startDate: string;
  endDate: string;
  operating: CashFlowCategory[];
  investing: CashFlowCategory[];
  financing: CashFlowCategory[];
  netCashFlow: number;
  beginningCash: number;
  endingCash: number;
}

export interface CashFlowCategory {
  description: string;
  amount: number;
}

export interface AgingReport {
  asOfDate: string;
  customers: AgingCustomer[];
}

export interface AgingCustomer {
  customerId: string;
  customerName: string;
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  over90: number;
  total: number;
}

// Dashboard
export interface DashboardMetrics {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  cashOnHand: number;
  accountsReceivable: number;
  accountsPayable: number;
  outstandingInvoices: number;
  overdueInvoices: number;
  revenueGrowth: number;
  expenseGrowth: number;
  period: string;
}

export interface DashboardSummary {
  metrics: DashboardMetrics;
  recentTransactions: RecentTransaction[];
  upcomingInvoices: Invoice[];
  alerts: Alert[];
}

export interface RecentTransaction {
  id: string;
  date: string;
  description: string;
  type: 'invoice' | 'expense' | 'payment' | 'journal';
  amount: number;
  status: string;
}

export interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  createdAt: string;
}

// Audit
export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

// Billing / Subscriptions
export interface Subscription {
  id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
}

export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'unpaid' | 'trialing';

export interface BillingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: 'month' | 'year';
  features: PlanFeature[];
  limits: PlanLimits;
}

export interface PlanFeature {
  name: string;
  included: boolean;
  limit?: number;
}

export interface PlanLimits {
  users: number;
  invoices: number;
  customers: number;
  storage: number; // in MB
  apiCalls: number;
}

// Feature Gating
export interface FeatureAccess {
  feature: string;
  enabled: boolean;
  currentUsage: number;
  limit: number;
  canUse: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, string[]>;
}

// Settings
export interface CompanySettings {
  company: Company;
  fiscalYear: {
    startMonth: number;
    startDay: number;
  };
  taxSettings: {
    taxId: string;
    defaultTaxRate: number;
    taxAgency?: string;
  };
  currencySettings: {
    baseCurrency: string;
    format: string;
    decimalPlaces: number;
  };
  invoiceSettings: {
    prefix: string;
    nextNumber: number;
    terms: string;
    notes: string;
  };
}
