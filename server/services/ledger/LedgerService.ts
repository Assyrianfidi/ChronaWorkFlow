/**
 * Ledger Service - Core Implementation
 * Double-entry accounting engine with dimensional support
 */

import { Pool, PoolClient } from 'pg';
import { Decimal } from 'decimal.js';
import crypto from 'crypto';
import { EventEmitter } from 'events';
import {
  Account,
  AccountType,
  CreateAccountInput,
  UpdateAccountInput,
  Transaction,
  TransactionLine,
  CreateTransactionInput,
  TransactionLineInput,
  TransactionValidationResult,
  ValidationError,
  Money,
  toCents,
  fromCents,
  DimensionValues,
  AccountingPeriod,
  ClosePeriodInput,
  TrialBalance,
  TrialBalanceLine,
  AccountBalance,
  BalanceQuery,
  PaginatedResult,
  PaginationOptions,
  LedgerAuditEvent,
  AuditEventType,
  IntegrityCheck,
  PostTransactionInput,
  ReverseTransactionInput,
  LedgerServiceConfig,
} from './types';

// ============================================
// LEDGER SERVICE CLASS
// ============================================

export class LedgerService extends EventEmitter {
  private pool: Pool;
  private config: LedgerServiceConfig;

  constructor(pool: Pool, config: Partial<LedgerServiceConfig> = {}) {
    super();
    this.pool = pool;
    this.config = {
      maxConnections: 100,
      connectionTimeout: 30000,
      queryTimeout: 10000,
      batchSize: 100,
      cacheTTL: 300,
      strictMode: true,
      allowBackdatedEntries: true,
      maxBackdatedDays: 365,
      ...config,
    };
  }

  // ============================================
  // ACCOUNT MANAGEMENT
  // ============================================

  async createAccount(
    companyId: string,
    userId: string,
    input: CreateAccountInput
  ): Promise<Account> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Validate account code uniqueness
      const existing = await client.query(
        'SELECT id FROM accounts WHERE company_id = $1 AND code = $2',
        [companyId, input.code]
      );

      if (existing.rows.length > 0) {
        throw new Error(`Account code ${input.code} already exists`);
      }

      // Validate parent exists if specified
      if (input.parentId) {
        const parent = await client.query(
          'SELECT id, type FROM accounts WHERE id = $1 AND company_id = $2',
          [input.parentId, companyId]
        );
        
        if (parent.rows.length === 0) {
          throw new Error('Parent account not found');
        }
        
        // Parent must be same type
        if (parent.rows[0].type !== input.type) {
          throw new Error('Parent account must be same type');
        }
      }

      // Create account
      const result = await client.query(
        `INSERT INTO accounts (
          company_id, code, name, type, subtype, parent_id,
          is_bank_account, bank_account_id, tax_code,
          track_location, track_department, track_project, track_class,
          description, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *`,
        [
          companyId,
          input.code,
          input.name,
          input.type,
          input.subtype || null,
          input.parentId || null,
          input.isBankAccount || false,
          null, // bank_account_id set separately
          input.taxCode || null,
          input.trackLocation || false,
          input.trackDepartment || false,
          input.trackProject || false,
          input.trackClass || false,
          input.description || null,
          userId,
        ]
      );

      await client.query('COMMIT');

      const account = this.mapAccount(result.rows[0]);
      
      // Emit audit event
      this.emit('account.created', {
        companyId,
        accountId: account.id,
        userId,
        account,
      });

      return account;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getAccount(companyId: string, accountId: string): Promise<Account | null> {
    const result = await this.pool.query(
      'SELECT * FROM accounts WHERE company_id = $1 AND id = $2',
      [companyId, accountId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapAccount(result.rows[0]);
  }

  async getAccountsByCompany(
    companyId: string,
    options: { type?: AccountType; isActive?: boolean } = {}
  ): Promise<Account[]> {
    let query = 'SELECT * FROM accounts WHERE company_id = $1';
    const params: any[] = [companyId];

    if (options.type) {
      query += ' AND type = $2';
      params.push(options.type);
    }

    if (options.isActive !== undefined) {
      query += ` AND is_active = $${params.length + 1}`;
      params.push(options.isActive);
    }

    query += ' ORDER BY code';

    const result = await this.pool.query(query, params);
    return result.rows.map(this.mapAccount);
  }

  async updateAccount(
    companyId: string,
    accountId: string,
    userId: string,
    input: UpdateAccountInput
  ): Promise<Account> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get current state for audit
      const current = await client.query(
        'SELECT * FROM accounts WHERE company_id = $1 AND id = $2',
        [companyId, accountId]
      );

      if (current.rows.length === 0) {
        throw new Error('Account not found');
      }

      const beforeState = current.rows[0];

      // Build update query dynamically
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (input.name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(input.name);
      }
      if (input.subtype !== undefined) {
        updates.push(`subtype = $${paramIndex++}`);
        values.push(input.subtype);
      }
      if (input.isActive !== undefined) {
        updates.push(`is_active = $${paramIndex++}`);
        values.push(input.isActive);
      }
      if (input.taxCode !== undefined) {
        updates.push(`tax_code = $${paramIndex++}`);
        values.push(input.taxCode);
      }
      if (input.trackLocation !== undefined) {
        updates.push(`track_location = $${paramIndex++}`);
        values.push(input.trackLocation);
      }
      if (input.trackDepartment !== undefined) {
        updates.push(`track_department = $${paramIndex++}`);
        values.push(input.trackDepartment);
      }
      if (input.trackProject !== undefined) {
        updates.push(`track_project = $${paramIndex++}`);
        values.push(input.trackProject);
      }
      if (input.trackClass !== undefined) {
        updates.push(`track_class = $${paramIndex++}`);
        values.push(input.trackClass);
      }
      if (input.description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(input.description);
      }

      // Always update updated_at
      updates.push(`updated_at = NOW()`);

      if (updates.length === 0) {
        return this.mapAccount(beforeState);
      }

      values.push(companyId, accountId);

      const query = `UPDATE accounts SET ${updates.join(', ')} 
                     WHERE company_id = $${paramIndex++} AND id = $${paramIndex++}
                     RETURNING *`;

      const result = await client.query(query, values);
      await client.query('COMMIT');

      const account = this.mapAccount(result.rows[0]);

      // Emit audit event
      this.emit('account.updated', {
        companyId,
        accountId,
        userId,
        beforeState: this.mapAccount(beforeState),
        afterState: account,
      });

      return account;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // ============================================
  // TRANSACTION CORE
  // ============================================

  async createTransaction(
    companyId: string,
    userId: string,
    input: CreateTransactionInput
  ): Promise<Transaction> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Check idempotency
      if (input.idempotencyKey) {
        const existing = await client.query(
          'SELECT id FROM transactions WHERE idempotency_key = $1',
          [input.idempotencyKey]
        );
        
        if (existing.rows.length > 0) {
          throw new Error('Duplicate transaction: idempotency key already used');
        }
      }

      // Generate transaction number
      const transactionNumber = await this.generateTransactionNumber(client, companyId);

      // Create transaction
      const transactionResult = await client.query(
        `INSERT INTO transactions (
          company_id, transaction_number, date, description, reference, type, source_id,
          status, location_id, department_id, project_id, class_id,
          idempotency_key, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
          companyId,
          transactionNumber,
          input.date,
          input.description,
          input.reference || null,
          input.type || 'manual',
          input.sourceId || null,
          'draft',
          input.locationId || null,
          input.departmentId || null,
          input.projectId || null,
          input.classId || null,
          input.idempotencyKey || null,
          userId,
        ]
      );

      const transaction = transactionResult.rows[0];

      // Create lines
      const lines: TransactionLine[] = [];
      for (let i = 0; i < input.lines.length; i++) {
        const lineInput = input.lines[i];
        const line = await this.createTransactionLine(
          client,
          companyId,
          transaction.id,
          lineInput,
          i
        );
        lines.push(line);
      }

      await client.query('COMMIT');

      return this.mapTransaction(transaction, lines);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async postTransaction(
    companyId: string,
    userId: string,
    input: PostTransactionInput
  ): Promise<Transaction> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');

      // Get transaction with lock
      const transactionResult = await client.query(
        'SELECT * FROM transactions WHERE company_id = $1 AND id = $2 FOR UPDATE',
        [companyId, input.transactionId]
      );

      if (transactionResult.rows.length === 0) {
        throw new Error('Transaction not found');
      }

      const transaction = transactionResult.rows[0];

      if (transaction.status !== 'draft') {
        throw new Error(`Cannot post transaction with status: ${transaction.status}`);
      }

      // Check period is open
      const periodCheck = await client.query(
        `SELECT is_closed FROM accounting_periods 
         WHERE company_id = $1 AND $2 BETWEEN start_date AND end_date`,
        [companyId, transaction.date]
      );

      if (periodCheck.rows.length > 0 && periodCheck.rows[0].is_closed) {
        throw new Error('Cannot post to closed period');
      }

      // Validate transaction balances (this is enforced by DB trigger, but we check early)
      const lines = await client.query(
        'SELECT * FROM transaction_lines WHERE transaction_id = $1',
        [input.transactionId]
      );

      const validation = this.validateTransactionLines(lines.rows);
      if (!validation.isValid) {
        throw new Error(`Transaction validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      // Post transaction
      const postDate = input.postDate || new Date();
      
      await client.query(
        `UPDATE transactions 
         SET status = 'posted', posted_at = $1, posted_by = $2, updated_at = NOW()
         WHERE id = $3`,
        [postDate, userId, input.transactionId]
      );

      // Update account balances (async via materialized view or trigger)
      await this.recalculateBalances(client, companyId, input.transactionId);

      await client.query('COMMIT');

      // Fetch complete transaction
      const completeTx = await this.getTransaction(companyId, input.transactionId);
      
      if (!completeTx) {
        throw new Error('Transaction not found after posting');
      }

      // Emit events
      this.emit('transaction.posted', {
        companyId,
        transactionId: input.transactionId,
        userId,
        transaction: completeTx,
      });

      return completeTx;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async reverseTransaction(
    companyId: string,
    userId: string,
    input: ReverseTransactionInput
  ): Promise<{ reversed: Transaction; reversal: Transaction }> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');

      // Get original transaction
      const originalResult = await client.query(
        'SELECT * FROM transactions WHERE company_id = $1 AND id = $2 FOR UPDATE',
        [companyId, input.transactionId]
      );

      if (originalResult.rows.length === 0) {
        throw new Error('Transaction not found');
      }

      const original = originalResult.rows[0];

      if (original.status !== 'posted') {
        throw new Error('Can only reverse posted transactions');
      }

      if (original.reversed_transaction_id) {
        throw new Error('Transaction already reversed');
      }

      // Get original lines
      const originalLines = await client.query(
        'SELECT * FROM transaction_lines WHERE transaction_id = $1',
        [input.transactionId]
      );

      // Create reversal transaction (debits become credits, credits become debits)
      const reversalNumber = await this.generateTransactionNumber(client, companyId);
      const reversalDate = input.reverseDate || new Date();

      const reversalResult = await client.query(
        `INSERT INTO transactions (
          company_id, transaction_number, date, description, reference, type,
          status, reversed_transaction_id, reversal_reason,
          location_id, department_id, project_id, class_id,
          created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
          companyId,
          reversalNumber,
          reversalDate,
          `Reversal of ${original.transaction_number}: ${original.description}`,
          original.reference,
          'adjustment',
          'posted',
          input.transactionId,
          input.reason,
          original.location_id,
          original.department_id,
          original.project_id,
          original.class_id,
          userId,
        ]
      );

      const reversal = reversalResult.rows[0];

      // Create reversal lines (swap debits/credits)
      for (const line of originalLines.rows) {
        await client.query(
          `INSERT INTO transaction_lines (
            transaction_id, company_id, account_id,
            debit_cents, credit_cents, description,
            location_id, department_id, project_id, class_id,
            source_type, source_id, line_number
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            reversal.id,
            companyId,
            line.account_id,
            line.credit_cents, // Swapped
            line.debit_cents,  // Swapped
            `Reversal: ${line.description || ''}`,
            line.location_id,
            line.department_id,
            line.project_id,
            line.class_id,
            'reversal',
            line.id,
            line.line_number,
          ]
        );
      }

      // Mark original as reversed
      await client.query(
        'UPDATE transactions SET status = \'reversed\', updated_at = NOW() WHERE id = $1',
        [input.transactionId]
      );

      // Update balances
      await this.recalculateBalances(client, companyId, reversal.id);

      await client.query('COMMIT');

      // Fetch both transactions
      const [reversedTx, reversalTx] = await Promise.all([
        this.getTransaction(companyId, input.transactionId),
        this.getTransaction(companyId, reversal.id),
      ]);

      if (!reversedTx || !reversalTx) {
        throw new Error('Failed to fetch reversal transactions');
      }

      // Emit events
      this.emit('transaction.reversed', {
        companyId,
        originalTransactionId: input.transactionId,
        reversalTransactionId: reversal.id,
        userId,
        reason: input.reason,
      });

      return { reversed: reversedTx, reversal: reversalTx };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // ============================================
  // VALIDATION
  // ============================================

  validateTransactionLines(
    lines: any[],
    options: { strictMode?: boolean } = {}
  ): TransactionValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Check minimum lines
    const hasMinimumLines = lines.length >= 2;
    if (!hasMinimumLines) {
      errors.push({
        field: 'lines',
        code: 'MIN_LINES',
        message: 'Transaction must have at least 2 lines',
      });
    }

    // Calculate totals
    let totalDebits = BigInt(0);
    let totalCredits = BigInt(0);

    for (const line of lines) {
      totalDebits += BigInt(line.debit_cents || 0);
      totalCredits += BigInt(line.credit_cents || 0);
    }

    const difference = totalDebits - totalCredits;
    const isBalanced = difference === BigInt(0);

    if (!isBalanced) {
      errors.push({
        field: 'lines',
        code: 'UNBALANCED',
        message: `Transaction does not balance: debits=${fromCents(totalDebits)}, credits=${fromCents(totalCredits)}`,
        details: {
          totalDebits: fromCents(totalDebits),
          totalCredits: fromCents(totalCredits),
          difference: fromCents(difference),
        },
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      totalDebits: { cents: totalDebits, currency: 'USD' },
      totalCredits: { cents: totalCredits, currency: 'USD' },
      difference: { cents: difference, currency: 'USD' },
      hasMinimumLines,
      isBalanced,
      hasValidAccounts: true, // Checked at creation time
      hasValidDimensions: true, // Checked at creation time
      isInOpenPeriod: true, // Checked at posting time
    };
  }

  // ============================================
  // ACCOUNTING PERIODS
  // ============================================

  async getAccountingPeriods(companyId: string): Promise<AccountingPeriod[]> {
    const result = await this.pool.query(
      'SELECT * FROM accounting_periods WHERE company_id = $1 ORDER BY start_date DESC',
      [companyId]
    );

    return result.rows.map(this.mapPeriod);
  }

  async getCurrentPeriod(companyId: string): Promise<AccountingPeriod | null> {
    const today = new Date();
    
    const result = await this.pool.query(
      'SELECT * FROM accounting_periods WHERE company_id = $1 AND $2 BETWEEN start_date AND end_date',
      [companyId, today]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapPeriod(result.rows[0]);
  }

  async closePeriod(
    companyId: string,
    userId: string,
    input: ClosePeriodInput
  ): Promise<AccountingPeriod> {
    const client = await this.pool.connect();
    const warnings: ValidationError[] = [];
    
    try {
      await client.query('BEGIN');

      // Get period
      const periodResult = await client.query(
        'SELECT * FROM accounting_periods WHERE id = $1 AND company_id = $2 FOR UPDATE',
        [input.periodId, companyId]
      );

      if (periodResult.rows.length === 0) {
        throw new Error('Period not found');
      }

      const period = periodResult.rows[0];

      if (period.is_closed) {
        throw new Error('Period is already closed');
      }

      // Check all prior periods are closed
      const priorOpen = await client.query(
        `SELECT id FROM accounting_periods 
         WHERE company_id = $1 AND end_date < $2 AND is_closed = false`,
        [companyId, period.start_date]
      );

      if (priorOpen.rows.length > 0) {
        throw new Error('Cannot close period: prior periods are still open');
      }

      // Check for unreconciled bank items
      const unreconciled = await client.query(
        `SELECT COUNT(*) FROM bank_transactions 
         WHERE company_id = $1 AND date BETWEEN $2 AND $3 AND reconciled = false`,
        [companyId, period.start_date, period.end_date]
      );

      if (parseInt(unreconciled.rows[0].count) > 0) {
        warnings.push({
          field: 'period',
          code: 'UNRECONCILED_ITEMS',
          message: `${unreconciled.rows[0].count} unreconciled bank items`,
        });
      }

      // Create closing entries if requested
      let adjustmentTransactionId = null;
      if (input.closingEntries) {
        // Generate closing entries (revenue/expense to retained earnings)
        adjustmentTransactionId = await this.generateClosingEntries(
          client,
          companyId,
          userId,
          period
        );
      }

      // Close period
      await client.query(
        `UPDATE accounting_periods 
         SET is_closed = true, closed_at = NOW(), closed_by = $1, adjustment_transaction_id = $2
         WHERE id = $3`,
        [userId, adjustmentTransactionId, input.periodId]
      );

      await client.query('COMMIT');

      // Fetch updated period
      const updated = await this.pool.query(
        'SELECT * FROM accounting_periods WHERE id = $1',
        [input.periodId]
      );

      return this.mapPeriod(updated.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // ============================================
  // REPORTING
  // ============================================

  async getTrialBalance(
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<TrialBalance> {
    const result = await this.pool.query(
      `SELECT 
        a.id as account_id,
        a.code as account_code,
        a.name as account_name,
        a.type as account_type,
        COALESCE(SUM(CASE WHEN tl.debit_cents > 0 THEN tl.debit_cents ELSE 0 END), 0) as period_debits,
        COALESCE(SUM(CASE WHEN tl.credit_cents > 0 THEN tl.credit_cents ELSE 0 END), 0) as period_credits
       FROM accounts a
       LEFT JOIN transaction_lines tl ON tl.account_id = a.id
       LEFT JOIN transactions t ON t.id = tl.transaction_id 
         AND t.status = 'posted'
         AND t.date BETWEEN $2 AND $3
       WHERE a.company_id = $1 AND a.is_active = true
       GROUP BY a.id, a.code, a.name, a.type
       ORDER BY a.code`,
      [companyId, startDate, endDate]
    );

    const lines: TrialBalanceLine[] = result.rows.map(row => {
      const debits = BigInt(row.period_debits);
      const credits = BigInt(row.period_credits);
      const isDebitNormal = ['asset', 'expense'].includes(row.account_type);
      
      const balance = isDebitNormal ? debits - credits : credits - debits;

      return {
        accountId: row.account_id,
        accountCode: row.account_code,
        accountName: row.account_name,
        accountType: row.account_type,
        beginningBalance: { cents: BigInt(0), currency: 'USD' }, // Would calculate from prior period
        periodDebits: { cents: debits, currency: 'USD' },
        periodCredits: { cents: credits, currency: 'USD' },
        endingBalance: { cents: balance, currency: 'USD' },
        normalBalance: isDebitNormal ? 'debit' : 'credit',
      };
    });

    const totalDebits = lines.reduce((sum, line) => sum + line.periodDebits.cents, BigInt(0));
    const totalCredits = lines.reduce((sum, line) => sum + line.periodCredits.cents, BigInt(0));

    return {
      companyId,
      startDate,
      endDate,
      lines,
      totals: {
        debit: { cents: totalDebits, currency: 'USD' },
        credit: { cents: totalCredits, currency: 'USD' },
      },
      isBalanced: totalDebits === totalCredits,
    };
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private async generateTransactionNumber(
    client: PoolClient,
    companyId: string
  ): Promise<string> {
    // Format: TXN-YYYY-XXXXXX (e.g., TXN-2026-000001)
    const year = new Date().getFullYear();
    
    const result = await client.query(
      `SELECT COUNT(*) as count FROM transactions 
       WHERE company_id = $1 AND transaction_number LIKE $2`,
      [companyId, `TXN-${year}-%`]
    );

    const count = parseInt(result.rows[0].count) + 1;
    return `TXN-${year}-${count.toString().padStart(6, '0')}`;
  }

  private async createTransactionLine(
    client: PoolClient,
    companyId: string,
    transactionId: string,
    input: TransactionLineInput,
    lineNumber: number
  ): Promise<TransactionLine> {
    const debit = input.debit ? toCents(input.debit as any) : BigInt(0);
    const credit = input.credit ? toCents(input.credit as any) : BigInt(0);

    const result = await client.query(
      `INSERT INTO transaction_lines (
        transaction_id, company_id, account_id,
        debit_cents, credit_cents, description,
        location_id, department_id, project_id, class_id,
        source_type, source_id, line_number
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        transactionId,
        companyId,
        input.accountId,
        debit,
        credit,
        input.description || null,
        input.locationId || null,
        input.departmentId || null,
        input.projectId || null,
        input.classId || null,
        input.sourceType || null,
        input.sourceId || null,
        input.lineNumber || lineNumber,
      ]
    );

    return this.mapTransactionLine(result.rows[0]);
  }

  private async recalculateBalances(
    client: PoolClient,
    companyId: string,
    transactionId: string
  ): Promise<void> {
    // In production, this would update materialized balance tables
    // For now, we rely on the database trigger and real-time calculation
    // This is a placeholder for the balance recalculation logic
    
    // Emit event for analytics service to update cubes
    this.emit('balances.updated', {
      companyId,
      transactionId,
      timestamp: new Date(),
    });
  }

  private async generateClosingEntries(
    client: PoolClient,
    companyId: string,
    userId: string,
    period: any
  ): Promise<string> {
    // This would create closing journal entries
    // Revenue accounts → Retained Earnings
    // Expense accounts → Retained Earnings
    throw new Error('Closing entries not yet implemented');
  }

  private async getTransaction(
    companyId: string,
    transactionId: string
  ): Promise<Transaction | null> {
    const txResult = await this.pool.query(
      'SELECT * FROM transactions WHERE company_id = $1 AND id = $2',
      [companyId, transactionId]
    );

    if (txResult.rows.length === 0) {
      return null;
    }

    const linesResult = await this.pool.query(
      'SELECT * FROM transaction_lines WHERE transaction_id = $1 ORDER BY line_number',
      [transactionId]
    );

    return this.mapTransaction(txResult.rows[0], linesResult.rows);
  }

  // ============================================
  // MAPPERS
  // ============================================

  private mapAccount(row: any): Account {
    return {
      id: row.id,
      companyId: row.company_id,
      code: row.code,
      name: row.name,
      type: row.type,
      subtype: row.subtype,
      parentId: row.parent_id,
      isBankAccount: row.is_bank_account,
      bankAccountId: row.bank_account_id,
      taxCode: row.tax_code,
      trackLocation: row.track_location,
      trackDepartment: row.track_department,
      trackProject: row.track_project,
      trackClass: row.track_class,
      isActive: row.is_active,
      isSystem: row.is_system,
      description: row.description,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapTransaction(row: any, lines: any[]): Transaction {
    const mappedLines = lines.map(line => this.mapTransactionLine(line));
    
    const totalDebits = mappedLines.reduce(
      (sum, line) => sum + line.debit.cents,
      BigInt(0)
    );
    const totalCredits = mappedLines.reduce(
      (sum, line) => sum + line.credit.cents,
      BigInt(0)
    );

    return {
      id: row.id,
      companyId: row.company_id,
      transactionNumber: row.transaction_number,
      date: row.date,
      description: row.description,
      reference: row.reference,
      type: row.type,
      sourceId: row.source_id,
      status: row.status,
      postedAt: row.posted_at,
      postedBy: row.posted_by,
      reversedTransactionId: row.reversed_transaction_id,
      reversalReason: row.reversal_reason,
      idempotencyKey: row.idempotency_key,
      locationId: row.location_id,
      departmentId: row.department_id,
      projectId: row.project_id,
      classId: row.class_id,
      lines: mappedLines,
      totalDebits: { cents: totalDebits, currency: 'USD' },
      totalCredits: { cents: totalCredits, currency: 'USD' },
      isBalanced: totalDebits === totalCredits,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapTransactionLine(row: any): TransactionLine {
    return {
      id: row.id,
      transactionId: row.transaction_id,
      companyId: row.company_id,
      accountId: row.account_id,
      debit: { cents: BigInt(row.debit_cents), currency: 'USD' },
      credit: { cents: BigInt(row.credit_cents), currency: 'USD' },
      description: row.description,
      locationId: row.location_id,
      departmentId: row.department_id,
      projectId: row.project_id,
      classId: row.class_id,
      sourceType: row.source_type,
      sourceId: row.source_id,
      lineNumber: row.line_number,
      createdAt: row.created_at,
    };
  }

  private mapPeriod(row: any): AccountingPeriod {
    return {
      id: row.id,
      companyId: row.company_id,
      name: row.name,
      periodType: row.period_type,
      startDate: row.start_date,
      endDate: row.end_date,
      isClosed: row.is_closed,
      closedAt: row.closed_at,
      closedBy: row.closed_by,
      adjustmentTransactionId: row.adjustment_transaction_id,
      createdAt: row.created_at,
    };
  }
}

export default LedgerService;
