/**
 * Ledger Service - TypeScript Models and Types
 * Domain models for double-entry accounting with dimensional support
 */

import { Decimal } from 'decimal.js';

// ============================================
// ENUMS AND TYPE DEFINITIONS
// ============================================

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
export type AccountSubtype = 
  | 'current_asset' | 'long_term_asset' | 'contra_asset'
  | 'current_liability' | 'long_term_liability'
  | 'equity' | 'contra_equity'
  | 'operating_revenue' | 'non_operating_revenue'
  | 'cogs' | 'operating_expense' | 'non_operating_expense';

export type DimensionType = 'location' | 'department' | 'project' | 'class';

export type TransactionType = 
  | 'manual' 
  | 'invoice' 
  | 'payment' 
  | 'bill' 
  | 'bank_import' 
  | 'adjustment' 
  | 'closing' 
  | 'opening';

export type TransactionStatus = 'draft' | 'posted' | 'reversed' | 'pending';

export type PeriodType = 'month' | 'quarter' | 'year';

// ============================================
// MONEY HANDLING (No floating point)
// ============================================

export interface Money {
  cents: bigint;
  currency: string;
}

export const toCents = (amount: number | string | Decimal): bigint => {
  const decimal = new Decimal(amount);
  return BigInt(decimal.times(100).toFixed(0));
};

export const fromCents = (cents: bigint, decimals = 2): string => {
  const str = cents.toString().padStart(decimals + 1, '0');
  const integerPart = str.slice(0, -decimals);
  const decimalPart = str.slice(-decimals);
  return `${integerPart}.${decimalPart}`;
};

// ============================================
// ACCOUNT MODELS
// ============================================

export interface Account {
  id: string;
  companyId: string;
  code: string;
  name: string;
  type: AccountType;
  subtype: AccountSubtype | null;
  parentId: string | null;
  
  // Configuration
  isBankAccount: boolean;
  bankAccountId: string | null;
  
  // Tax and compliance
  taxCode: string | null;
  
  // Dimensional tracking
  trackLocation: boolean;
  trackDepartment: boolean;
  trackProject: boolean;
  trackClass: boolean;
  
  // Status
  isActive: boolean;
  isSystem: boolean;
  
  // Metadata
  description: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Computed (not stored)
  balance?: Money;
  fullName?: string;  // "Assets:Current:Cash" format
  level?: number;     // Hierarchy depth
  children?: Account[];
}

export interface CreateAccountInput {
  code: string;
  name: string;
  type: AccountType;
  subtype?: string;
  parentId?: string;
  isBankAccount?: boolean;
  taxCode?: string;
  trackLocation?: boolean;
  trackDepartment?: boolean;
  trackProject?: boolean;
  trackClass?: boolean;
  description?: string;
}

export interface UpdateAccountInput {
  name?: string;
  subtype?: string;
  parentId?: string;
  isActive?: boolean;
  taxCode?: string;
  trackLocation?: boolean;
  trackDepartment?: boolean;
  trackProject?: boolean;
  trackClass?: boolean;
  description?: string;
}

// ============================================
// DIMENSION MODELS
// ============================================

export interface Dimension {
  id: string;
  companyId: string;
  name: string;
  code: string;
  type: DimensionType;
  isActive: boolean;
  createdAt: Date;
}

export interface DimensionValue {
  id: string;
  dimensionId: string;
  companyId: string;
  code: string;
  name: string;
  parentId: string | null;
  isActive: boolean;
  createdAt: Date;
  
  // Hierarchy
  children?: DimensionValue[];
  level?: number;
}

export interface DimensionValues {
  locationId?: string;
  departmentId?: string;
  projectId?: string;
  classId?: string;
}

// ============================================
// ACCOUNTING PERIOD MODELS
// ============================================

export interface AccountingPeriod {
  id: string;
  companyId: string;
  name: string;
  periodType: PeriodType;
  startDate: Date;
  endDate: Date;
  
  // Status
  isClosed: boolean;
  closedAt: Date | null;
  closedBy: string | null;
  
  // Close adjustments
  adjustmentTransactionId: string | null;
  
  createdAt: Date;
}

export interface ClosePeriodInput {
  periodId: string;
  adjustments?: AdjustmentEntry[];
  closingEntries?: boolean;
}

export interface AdjustmentEntry {
  accountId: string;
  description: string;
  debit?: Money;
  credit?: Money;
  dimensions?: DimensionValues;
}

// ============================================
// TRANSACTION MODELS
// ============================================

export interface TransactionLine {
  id: string;
  transactionId: string;
  companyId: string;
  
  accountId: string;
  account?: Account;  // Populated on fetch
  
  debit: Money;
  credit: Money;
  
  description: string | null;
  
  // Dimensional values (override transaction-level)
  locationId: string | null;
  departmentId: string | null;
  projectId: string | null;
  classId: string | null;
  
  // Source reference
  sourceType: string | null;
  sourceId: string | null;
  
  lineNumber: number;
  
  createdAt: Date;
}

export interface TransactionLineInput {
  accountId: string;
  debit?: Money | number | string;
  credit?: Money | number | string;
  description?: string;
  locationId?: string;
  departmentId?: string;
  projectId?: string;
  classId?: string;
  sourceType?: string;
  sourceId?: string;
  lineNumber?: number;
}

export interface Transaction {
  id: string;
  companyId: string;
  
  transactionNumber: string;
  date: Date;
  description: string;
  reference: string | null;
  
  type: TransactionType;
  sourceId: string | null;
  
  status: TransactionStatus;
  
  postedAt: Date | null;
  postedBy: string | null;
  
  // Reversal tracking
  reversedTransactionId: string | null;
  reversalReason: string | null;
  
  // Idempotency
  idempotencyKey: string | null;
  
  // Dimensional defaults
  locationId: string | null;
  departmentId: string | null;
  projectId: string | null;
  classId: string | null;
  
  // Lines
  lines: TransactionLine[];
  
  // Computed
  totalDebits: Money;
  totalCredits: Money;
  isBalanced: boolean;
  
  // Audit
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTransactionInput {
  date: Date;
  description: string;
  reference?: string;
  type?: TransactionType;
  sourceId?: string;
  idempotencyKey?: string;
  
  // Dimensional defaults
  locationId?: string;
  departmentId?: string;
  projectId?: string;
  classId?: string;
  
  lines: TransactionLineInput[];
}

export interface PostTransactionInput {
  transactionId: string;
  postDate?: Date;
}

export interface ReverseTransactionInput {
  transactionId: string;
  reason: string;
  reverseDate?: Date;
}

// ============================================
// VALIDATION RESULTS
// ============================================

export interface ValidationError {
  field: string;
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface TransactionValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  
  // Computed totals
  totalDebits: Money;
  totalCredits: Money;
  difference: Money;
  
  // Checks
  hasMinimumLines: boolean;
  isBalanced: boolean;
  hasValidAccounts: boolean;
  hasValidDimensions: boolean;
  isInOpenPeriod: boolean;
}

// ============================================
// BALANCE AND REPORTING
// ============================================

export interface AccountBalance {
  id: string;
  companyId: string;
  accountId: string;
  account?: Account;
  
  locationId: string | null;
  departmentId: string | null;
  projectId: string | null;
  classId: string | null;
  
  asOfDate: Date;
  
  debitTotal: Money;
  creditTotal: Money;
  balance: Money;
  
  // Normal balance determines if positive is debit or credit
  normalBalance: 'debit' | 'credit';
}

export interface BalanceQuery {
  companyId: string;
  asOfDate: Date;
  accountIds?: string[];
  locationId?: string;
  departmentId?: string;
  projectId?: string;
  classId?: string;
  
  // Aggregation
  groupBy?: ('account' | 'location' | 'department' | 'project' | 'class')[];
}

export interface TrialBalanceLine {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  
  beginningBalance: Money;
  periodDebits: Money;
  periodCredits: Money;
  endingBalance: Money;
  
  // Normal balance
  normalBalance: 'debit' | 'credit';
}

export interface TrialBalance {
  companyId: string;
  startDate: Date;
  endDate: Date;
  lines: TrialBalanceLine[];
  
  totals: {
    debit: Money;
    credit: Money;
  };
  
  isBalanced: boolean;
}

// ============================================
// LEDGER INTEGRITY
// ============================================

export interface IntegrityCheck {
  checkName: string;
  isValid: boolean;
  details: string;
}

export interface LedgerIntegrityReport {
  companyId: string;
  checkedAt: Date;
  checks: IntegrityCheck[];
  overallValid: boolean;
}

// ============================================
// AUDIT LOG
// ============================================

export type AuditEventType = 
  | 'transaction_posted' 
  | 'transaction_reversed' 
  | 'transaction_updated'
  | 'period_closed' 
  | 'period_reopened'
  | 'account_created'
  | 'account_updated';

export interface LedgerAuditEvent {
  id: string;
  companyId: string;
  
  eventType: AuditEventType;
  entityType: 'transaction' | 'account' | 'period' | 'dimension';
  entityId: string;
  
  // Actor
  userId: string;
  userEmail: string;
  ipAddress: string;
  userAgent: string;
  
  // Change tracking
  beforeState: object;
  afterState: object;
  changeSummary: object;
  
  // Tamper chain
  previousHash: string;
  eventHash: string;
  
  // Timing
  occurredAt: Date;
  
  // Tracing
  correlationId: string;
  requestId: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface LedgerServiceConfig {
  // Database
  maxConnections: number;
  connectionTimeout: number;
  queryTimeout: number;
  
  // Performance
  batchSize: number;
  cacheTTL: number;
  
  // Validation
  strictMode: boolean;
  allowBackdatedEntries: boolean;
  maxBackdatedDays: number;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}
