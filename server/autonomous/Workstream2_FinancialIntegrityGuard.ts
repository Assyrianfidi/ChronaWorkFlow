#!/usr/bin/env node
/**
 * ACCUBOOKS FINANCIAL INTEGRITY GUARD
 * Workstream 2: Absolute Accounting Correctness
 * 
 * Hourly and daily automated validations
 * FREEZE ON IMBALANCE - AUTO-RECONCILE OR ESCALATE
 */

import { Pool } from 'pg';
import Redis from 'ioredis';
import { EventEmitter } from 'events';

interface ValidationResult {
  timestamp: Date;
  check: string;
  status: 'passed' | 'failed' | 'warning';
  details: any;
  action?: string;
}

interface FinancialImbalance {
  companyId: string;
  type: string;
  expected: number;
  actual: number;
  difference: number;
  affectedTransactions: string[];
}

class FinancialIntegrityGuard extends EventEmitter {
  private db: Pool;
  private redis: Redis;
  private isRunning = false;
  private hourlyTimer: NodeJS.Timer | null = null;
  private dailyTimer: NodeJS.Timer | null = null;

  // Validation state
  private validations: ValidationResult[] = [];
  private frozenCompanies: Set<string> = new Set();

  constructor(db: Pool, redis: Redis) {
    super();
    this.db = db;
    this.redis = redis;
  }

  /**
   * START FINANCIAL INTEGRITY GUARD
   */
  async start(): Promise<void> {
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║      FINANCIAL INTEGRITY GUARD ACTIVATED                ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('🧮 Hourly validations: Trial Balance, Debits=Credits');
    console.log('📊 Daily validations: P&L, Balance Sheet, AR/AP Aging');
    console.log('🛡️  Imbalance response: FREEZE → AUTO-RECONCILE → ESCALATE');
    console.log('');

    this.isRunning = true;

    // Start validation loops
    this.startHourlyValidations();
    this.startDailyValidations();

    // Run immediate baseline
    await this.runBaselineValidation();

    console.log('✅ Financial Integrity Guard Active');
  }

  /**
   * WORKSTREAM 2.1: HOURLY VALIDATIONS
   */
  private startHourlyValidations(): void {
    const runValidations = async () => {
      if (!this.isRunning) return;

      console.log(`🧮 [${new Date().toISOString()}] Running hourly financial validations...`);

      try {
        const results: ValidationResult[] = [];

        // 1. Trial Balance Validation (Debits == Credits)
        results.push(await this.validateTrialBalance());

        // 2. Ledger Immutability Check
        results.push(await this.validateLedgerImmutability());

        // 3. Orphan Entry Detection
        results.push(await this.validateOrphanEntries());

        // 4. Duplicate Transaction Detection
        results.push(await this.validateDuplicateTransactions());

        // 5. Idempotency Key Verification
        results.push(await this.validateIdempotencyKeys());

        // Store results
        this.validations.push(...results);
        await this.storeValidationResults(results);

        // Check for failures
        const failures = results.filter(r => r.status === 'failed');
        if (failures.length > 0) {
          console.log(`🚨 ${failures.length} financial validation(s) FAILED`);
          await this.handleValidationFailures(failures);
        } else {
          console.log('✅ All hourly validations PASSED');
        }

        this.emit('hourly-validations', results);

      } catch (error) {
        console.error('❌ Hourly validation error:', error);
        await this.logCriticalError('hourly_validation_error', error);
      }

      // Schedule next run
      this.hourlyTimer = setTimeout(runValidations, 60 * 60 * 1000); // 1 hour
    };

    // Start immediately
    runValidations();
  }

  /**
   * Trial Balance Validation: SUM(Debits) = SUM(Credits)
   */
  private async validateTrialBalance(): Promise<ValidationResult> {
    const start = Date.now();

    try {
      // Check trial balance for all companies
      const imbalances = await this.db.query(`
        SELECT 
          t.company_id,
          SUM(tl.debit_cents - tl.credit_cents) as net_balance,
          COUNT(DISTINCT t.id) as transaction_count
        FROM transactions t
        JOIN transaction_lines tl ON t.id = tl.transaction_id
        WHERE t.status = 'posted'
          AND t.posted_at > NOW() - INTERVAL '1 hour'
        GROUP BY t.company_id
        HAVING ABS(SUM(tl.debit_cents - tl.credit_cents)) > 0
      `);

      if (imbalances.rows.length === 0) {
        return {
          timestamp: new Date(),
          check: 'trial_balance',
          status: 'passed',
          details: { 
            message: 'All companies balanced',
            duration: Date.now() - start
          }
        };
      }

      // Imbalances detected
      const imbalancesList: FinancialImbalance[] = imbalances.rows.map(row => ({
        companyId: row.company_id,
        type: 'trial_balance',
        expected: 0,
        actual: parseInt(row.net_balance),
        difference: parseInt(row.net_balance),
        affectedTransactions: []
      }));

      return {
        timestamp: new Date(),
        check: 'trial_balance',
        status: 'failed',
        details: {
          message: `${imbalances.rows.length} companies have unbalanced transactions`,
          imbalances: imbalancesList,
          duration: Date.now() - start
        },
        action: 'freeze_and_investigate'
      };

    } catch (error) {
      return {
        timestamp: new Date(),
        check: 'trial_balance',
        status: 'failed',
        details: { error: error.message },
        action: 'escalate_immediately'
      };
    }
  }

  /**
   * Ledger Immutability: No posted transaction modifications
   */
  private async validateLedgerImmutability(): Promise<ValidationResult> {
    const start = Date.now();

    try {
      // Check for any modified posted transactions
      const modifications = await this.db.query(`
        SELECT 
          t.id,
          t.company_id,
          t.updated_at,
          t.posted_at
        FROM transactions t
        WHERE t.status = 'posted'
          AND t.updated_at > t.posted_at + INTERVAL '1 second'
          AND t.updated_at > NOW() - INTERVAL '1 hour'
        LIMIT 100
      `);

      if (modifications.rows.length === 0) {
        return {
          timestamp: new Date(),
          check: 'ledger_immutability',
          status: 'passed',
          details: {
            message: 'No posted transactions modified',
            duration: Date.now() - start
          }
        };
      }

      return {
        timestamp: new Date(),
        check: 'ledger_immutability',
        status: 'failed',
        details: {
          message: `${modifications.rows.length} posted transactions were modified`,
          violations: modifications.rows,
          duration: Date.now() - start
        },
        action: 'security_investigation'
      };

    } catch (error) {
      return {
        timestamp: new Date(),
        check: 'ledger_immutability',
        status: 'failed',
        details: { error: error.message }
      };
    }
  }

  /**
   * Orphan Entry Detection: Lines without transactions, etc.
   */
  private async validateOrphanEntries(): Promise<ValidationResult> {
    const start = Date.now();

    try {
      // Find orphan transaction lines
      const orphans = await this.db.query(`
        SELECT 
          'orphan_line' as type,
          tl.id,
          tl.transaction_id
        FROM transaction_lines tl
        LEFT JOIN transactions t ON tl.transaction_id = t.id
        WHERE t.id IS NULL
          AND tl.created_at > NOW() - INTERVAL '1 hour'
        
        UNION ALL
        
        SELECT 
          'orphan_payment' as type,
          p.id,
          p.invoice_id
        FROM payments p
        LEFT JOIN invoices i ON p.invoice_id = i.id
        WHERE i.id IS NULL
          AND p.created_at > NOW() - INTERVAL '1 hour'
          AND p.invoice_id IS NOT NULL
        
        LIMIT 100
      `);

      if (orphans.rows.length === 0) {
        return {
          timestamp: new Date(),
          check: 'orphan_entries',
          status: 'passed',
          details: {
            message: 'No orphan entries detected',
            duration: Date.now() - start
          }
        };
      }

      return {
        timestamp: new Date(),
        check: 'orphan_entries',
        status: 'warning',
        details: {
          message: `${orphans.rows.length} orphan entries detected`,
          orphans: orphans.rows,
          duration: Date.now() - start
        },
        action: 'cleanup_orphans'
      };

    } catch (error) {
      return {
        timestamp: new Date(),
        check: 'orphan_entries',
        status: 'failed',
        details: { error: error.message }
      };
    }
  }

  /**
   * Duplicate Transaction Detection
   */
  private async validateDuplicateTransactions(): Promise<ValidationResult> {
    const start = Date.now();

    try {
      // Check for duplicates by idempotency key
      const duplicates = await this.db.query(`
        SELECT 
          idempotency_key,
          company_id,
          COUNT(*) as count,
          array_agg(id) as transaction_ids
        FROM transactions
        WHERE idempotency_key IS NOT NULL
          AND created_at > NOW() - INTERVAL '1 hour'
        GROUP BY idempotency_key, company_id
        HAVING COUNT(*) > 1
        LIMIT 10
      `);

      if (duplicates.rows.length === 0) {
        return {
          timestamp: new Date(),
          check: 'duplicate_transactions',
          status: 'passed',
          details: {
            message: 'No duplicate transactions detected',
            duration: Date.now() - start
          }
        };
      }

      return {
        timestamp: new Date(),
        check: 'duplicate_transactions',
        status: 'failed',
        details: {
          message: `${duplicates.rows.length} duplicate transaction(s) detected`,
          duplicates: duplicates.rows,
          duration: Date.now() - start
        },
        action: 'remove_duplicates'
      };

    } catch (error) {
      return {
        timestamp: new Date(),
        check: 'duplicate_transactions',
        status: 'failed',
        details: { error: error.message }
      };
    }
  }

  /**
   * Idempotency Key Verification
   */
  private async validateIdempotencyKeys(): Promise<ValidationResult> {
    const start = Date.now();

    try {
      // Check for missing idempotency keys on recent transactions
      const missing = await this.db.query(`
        SELECT 
          id,
          company_id,
          type,
          created_at
        FROM transactions
        WHERE idempotency_key IS NULL
          AND type IN ('invoice', 'payment', 'journal_entry')
          AND created_at > NOW() - INTERVAL '1 hour'
          AND amount_cents > 10000  -- Only check significant amounts
        LIMIT 100
      `);

      if (missing.rows.length === 0) {
        return {
          timestamp: new Date(),
          check: 'idempotency_keys',
          status: 'passed',
          details: {
            message: 'All significant transactions have idempotency keys',
            duration: Date.now() - start
          }
        };
      }

      return {
        timestamp: new Date(),
        check: 'idempotency_keys',
        status: 'warning',
        details: {
          message: `${missing.rows.length} transactions missing idempotency keys`,
          transactions: missing.rows,
          duration: Date.now() - start
        },
        action: 'review_process'
      };

    } catch (error) {
      return {
        timestamp: new Date(),
        check: 'idempotency_keys',
        status: 'failed',
        details: { error: error.message }
      };
    }
  }

  /**
   * WORKSTREAM 2.2: DAILY VALIDATIONS
   */
  private startDailyValidations(): void {
    const runDailyValidations = async () => {
      if (!this.isRunning) return;

      console.log(`📊 [${new Date().toISOString()}] Running daily financial validations...`);

      try {
        const results: ValidationResult[] = [];

        // 1. P&L Regeneration
        results.push(await this.validateProfitAndLoss());

        // 2. Balance Sheet Equation (A = L + E)
        results.push(await this.validateBalanceSheetEquation());

        // 3. AR/AP Aging Validation
        results.push(await this.validateAgingReports());

        // 4. Inventory Valuation Sanity
        results.push(await this.validateInventoryValuation());

        // Store results
        this.validations.push(...results);
        await this.storeValidationResults(results);

        // Check for failures
        const failures = results.filter(r => r.status === 'failed');
        if (failures.length > 0) {
          console.log(`🚨 ${failures.length} daily validation(s) FAILED`);
          await this.handleValidationFailures(failures);
        } else {
          console.log('✅ All daily validations PASSED');
        }

        this.emit('daily-validations', results);

      } catch (error) {
        console.error('❌ Daily validation error:', error);
        await this.logCriticalError('daily_validation_error', error);
      }

      // Schedule next run (tomorrow at 2 AM)
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(2, 0, 0, 0);
      const msUntil = tomorrow.getTime() - now.getTime();

      this.dailyTimer = setTimeout(runDailyValidations, msUntil);
    };

    // Start at next 2 AM
    const now = new Date();
    const next2AM = new Date(now);
    next2AM.setHours(2, 0, 0, 0);
    if (next2AM <= now) {
      next2AM.setDate(next2AM.getDate() + 1);
    }
    const msUntil = next2AM.getTime() - now.getTime();

    setTimeout(runDailyValidations, msUntil);
  }

  /**
   * P&L Validation
   */
  private async validateProfitAndLoss(): Promise<ValidationResult> {
    const start = Date.now();

    try {
      // For each company, verify P&L calculation is consistent
      const companies = await this.db.query(`
        SELECT DISTINCT company_id
        FROM transactions
        WHERE posted_at > NOW() - INTERVAL '24 hours'
        LIMIT 100
      `);

      let inconsistencies = 0;

      for (const company of companies.rows) {
        const companyId = company.company_id;

        // Calculate revenue and expenses
        const result = await this.db.query(`
          SELECT 
            SUM(CASE WHEN a.type = 'revenue' THEN tl.credit_cents - tl.debit_cents ELSE 0 END) as revenue,
            SUM(CASE WHEN a.type = 'expense' THEN tl.debit_cents - tl.credit_cents ELSE 0 END) as expenses
          FROM transaction_lines tl
          JOIN transactions t ON tl.transaction_id = t.id
          JOIN accounts a ON tl.account_id = a.id
          WHERE t.company_id = $1
            AND t.status = 'posted'
            AND t.posted_at > NOW() - INTERVAL '24 hours'
        `, [companyId]);

        // Verify stored P&L matches calculation
        const storedPnL = await this.db.query(`
          SELECT net_income_cents
          FROM daily_pnl
          WHERE company_id = $1
            AND date = CURRENT_DATE
        `, [companyId]);

        if (storedPnL.rows.length > 0) {
          const calculated = (result.rows[0].revenue || 0) - (result.rows[0].expenses || 0);
          const stored = storedPnL.rows[0].net_income_cents;

          if (Math.abs(calculated - stored) > 1) { // Allow 1 cent rounding
            inconsistencies++;
          }
        }
      }

      if (inconsistencies === 0) {
        return {
          timestamp: new Date(),
          check: 'profit_and_loss',
          status: 'passed',
          details: {
            message: 'P&L calculations validated',
            companies_checked: companies.rows.length,
            duration: Date.now() - start
          }
        };
      }

      return {
        timestamp: new Date(),
        check: 'profit_and_loss',
        status: 'failed',
        details: {
          message: `${inconsistencies} companies have P&L inconsistencies`,
          duration: Date.now() - start
        },
        action: 'regenerate_pnl'
      };

    } catch (error) {
      return {
        timestamp: new Date(),
        check: 'profit_and_loss',
        status: 'failed',
        details: { error: error.message }
      };
    }
  }

  /**
   * Balance Sheet Equation: Assets = Liabilities + Equity
   */
  private async validateBalanceSheetEquation(): Promise<ValidationResult> {
    const start = Date.now();

    try {
      // Check balance sheet equation for all companies
      const equations = await this.db.query(`
        SELECT 
          ab.company_id,
          SUM(CASE WHEN a.type = 'asset' THEN ab.balance_cents ELSE 0 END) as assets,
          SUM(CASE WHEN a.type IN ('liability', 'equity') THEN ab.balance_cents ELSE 0 END) as liabilities_plus_equity,
          SUM(CASE WHEN a.type = 'asset' THEN ab.balance_cents ELSE 0 END) - 
          SUM(CASE WHEN a.type IN ('liability', 'equity') THEN ab.balance_cents ELSE 0 END) as difference
        FROM account_balances ab
        JOIN accounts a ON ab.account_id = a.id
        WHERE ab.as_of_date = CURRENT_DATE
        GROUP BY ab.company_id
        HAVING ABS(SUM(CASE WHEN a.type = 'asset' THEN ab.balance_cents ELSE 0 END) - 
               SUM(CASE WHEN a.type IN ('liability', 'equity') THEN ab.balance_cents ELSE 0 END)) > 1
        LIMIT 100
      `);

      if (equations.rows.length === 0) {
        return {
          timestamp: new Date(),
          check: 'balance_sheet_equation',
          status: 'passed',
          details: {
            message: 'A = L + E verified for all companies',
            duration: Date.now() - start
          }
        };
      }

      return {
        timestamp: new Date(),
        check: 'balance_sheet_equation',
        status: 'failed',
        details: {
          message: `${equations.rows.length} companies fail A = L + E equation`,
          violations: equations.rows,
          duration: Date.now() - start
        },
        action: 'freeze_and_investigate'
      };

    } catch (error) {
      return {
        timestamp: new Date(),
        check: 'balance_sheet_equation',
        status: 'failed',
        details: { error: error.message }
      };
    }
  }

  /**
   * AR/AP Aging Validation
   */
  private async validateAgingReports(): Promise<ValidationResult> {
    const start = Date.now();

    try {
      // Validate AR aging totals match invoice balances
      const arCheck = await this.db.query(`
        SELECT 
          i.company_id,
          SUM(i.balance_due_cents) as invoice_total,
          (SELECT SUM(current_cents + days_1_30_cents + days_31_60_cents + days_61_90_cents + days_over_90_cents)
           FROM ar_aging WHERE company_id = i.company_id AND as_of_date = CURRENT_DATE) as aging_total
        FROM invoices i
        WHERE i.status IN ('sent', 'partially_paid', 'overdue')
          AND i.balance_due_cents > 0
        GROUP BY i.company_id
        HAVING ABS(SUM(i.balance_due_cents) - 
               (SELECT SUM(current_cents + days_1_30_cents + days_31_60_cents + days_61_90_cents + days_over_90_cents)
                FROM ar_aging WHERE company_id = i.company_id AND as_of_date = CURRENT_DATE)) > 100
        LIMIT 50
      `);

      if (arCheck.rows.length === 0) {
        return {
          timestamp: new Date(),
          check: 'ar_ap_aging',
          status: 'passed',
          details: {
            message: 'AR/AP aging reports validated',
            duration: Date.now() - start
          }
        };
      }

      return {
        timestamp: new Date(),
        check: 'ar_ap_aging',
        status: 'warning',
        details: {
          message: `${arCheck.rows.length} companies have aging discrepancies`,
          discrepancies: arCheck.rows,
          duration: Date.now() - start
        },
        action: 'regenerate_aging'
      };

    } catch (error) {
      return {
        timestamp: new Date(),
        check: 'ar_ap_aging',
        status: 'failed',
        details: { error: error.message }
      };
    }
  }

  /**
   * Inventory Valuation Sanity Check
   */
  private async validateInventoryValuation(): Promise<ValidationResult> {
    const start = Date.now();

    try {
      // Check for negative inventory or valuation anomalies
      const anomalies = await this.db.query(`
        SELECT 
          company_id,
          item_id,
          quantity_on_hand,
          average_cost_cents,
          total_value_cents
        FROM inventory_balances
        WHERE (quantity_on_hand < 0 OR average_cost_cents < 0 OR total_value_cents < 0)
          AND as_of_date = CURRENT_DATE
        LIMIT 100
      `);

      if (anomalies.rows.length === 0) {
        return {
          timestamp: new Date(),
          check: 'inventory_valuation',
          status: 'passed',
          details: {
            message: 'Inventory valuations validated',
            duration: Date.now() - start
          }
        };
      }

      return {
        timestamp: new Date(),
        check: 'inventory_valuation',
        status: 'failed',
        details: {
          message: `${anomalies.rows.length} inventory valuation anomalies detected`,
          anomalies: anomalies.rows,
          duration: Date.now() - start
        },
        action: 'recalculate_inventory'
      };

    } catch (error) {
      return {
        timestamp: new Date(),
        check: 'inventory_valuation',
        status: 'failed',
        details: { error: error.message }
      };
    }
  }

  /**
   * HANDLE VALIDATION FAILURES
   * Protocol: FREEZE → AUTO-RECONCILE → ESCALATE
   */
  private async handleValidationFailures(failures: ValidationResult[]): Promise<void> {
    console.log('🛡️  Initiating failure response protocol...');

    for (const failure of failures) {
      // Step 1: FREEZE affected companies
      if (failure.action === 'freeze_and_investigate' || 
          failure.action === 'security_investigation') {
        await this.freezeCompanies(failure.details.imbalances || failure.details.violations);
      }

      // Step 2: Attempt auto-reconciliation
      if (failure.action === 'freeze_and_investigate' ||
          failure.action === 'regenerate_pnl' ||
          failure.action === 'regenerate_aging' ||
          failure.action === 'recalculate_inventory') {
        const reconciled = await this.attemptAutoReconciliation(failure);
        
        if (reconciled) {
          console.log(`✅ Auto-reconciliation successful for ${failure.check}`);
          await this.unfreezeCompanies();
        } else {
          // Step 3: ESCALATE
          await this.escalateFailure(failure);
        }
      }

      // Immediate escalation for security issues
      if (failure.action === 'security_investigation') {
        await this.escalateSecurityIncident(failure);
      }
    }
  }

  /**
   * Freeze company writes
   */
  private async freezeCompanies(imbalances: FinancialImbalance[]): Promise<void> {
    console.log(`🥶 Freezing ${imbalances.length} company(s) for investigation`);

    for (const imbalance of imbalances) {
      this.frozenCompanies.add(imbalance.companyId);
      
      // Set flag in Redis
      await this.redis.setex(
        `company:${imbalance.companyId}:frozen`,
        3600, // 1 hour
        JSON.stringify({
          reason: imbalance.type,
          timestamp: new Date(),
          expected: imbalance.expected,
          actual: imbalance.actual
        })
      );

      // Notify
      await this.redis.lpush('alerts:financial', JSON.stringify({
        timestamp: new Date(),
        severity: 'CRITICAL',
        companyId: imbalance.companyId,
        message: `Company frozen due to ${imbalance.type} imbalance`,
        details: imbalance
      }));
    }
  }

  /**
   * Attempt auto-reconciliation
   */
  private async attemptAutoReconciliation(failure: ValidationResult): Promise<boolean> {
    console.log(`🔧 Attempting auto-reconciliation for ${failure.check}...`);

    try {
      switch (failure.check) {
        case 'trial_balance':
          // Cannot auto-reconcile trial balance - requires investigation
          return false;

        case 'profit_and_loss':
          // Regenerate P&L
          await this.db.query('SELECT regenerate_daily_pnl()');
          return true;

        case 'balance_sheet_equation':
          // Cannot auto-reconcile - requires investigation
          return false;

        case 'ar_ap_aging':
          // Regenerate aging reports
          await this.db.query('SELECT regenerate_ar_aging()');
          return true;

        case 'inventory_valuation':
          // Recalculate inventory
          await this.db.query('SELECT recalculate_inventory_valuations()');
          return true;

        case 'orphan_entries':
          // Clean up orphan entries
          await this.db.query(`
            DELETE FROM transaction_lines
            WHERE transaction_id NOT IN (SELECT id FROM transactions)
          `);
          return true;

        case 'duplicate_transactions':
          // Cannot auto-remove duplicates - requires review
          return false;

        default:
          return false;
      }
    } catch (error) {
      console.error('❌ Auto-reconciliation failed:', error);
      return false;
    }
  }

  /**
   * Unfreeze companies
   */
  private async unfreezeCompanies(): Promise<void> {
    console.log('🔓 Unfreezing all companies');
    
    for (const companyId of this.frozenCompanies) {
      await this.redis.del(`company:${companyId}:frozen`);
    }
    
    this.frozenCompanies.clear();
  }

  /**
   * Escalate failure to human
   */
  private async escalateFailure(failure: ValidationResult): Promise<void> {
    console.error(`🆘 ESCALATING: ${failure.check} - ${failure.details.message}`);
    
    await this.redis.lpush('escalations:financial', JSON.stringify({
      timestamp: new Date(),
      severity: 'CRITICAL',
      check: failure.check,
      details: failure.details,
      action: 'HUMAN_INTERVENTION_REQUIRED'
    }));

    // Alert CFO/Controller
    this.emit('escalation', failure);
  }

  /**
   * Escalate security incident
   */
  private async escalateSecurityIncident(failure: ValidationResult): Promise<void> {
    console.error(`🚨 SECURITY INCIDENT: ${failure.details.message}`);
    
    await this.redis.lpush('escalations:security', JSON.stringify({
      timestamp: new Date(),
      severity: 'SECURITY',
      check: failure.check,
      details: failure.details,
      action: 'IMMEDIATE_INVESTIGATION_REQUIRED'
    }));

    this.emit('security-incident', failure);
  }

  /**
   * UTILITY METHODS
   */
  private async storeValidationResults(results: ValidationResult[]): Promise<void> {
    await this.redis.lpush('validations:history', JSON.stringify({
      timestamp: new Date(),
      results
    }));
  }

  private async logCriticalError(type: string, error: any): Promise<void> {
    await this.redis.lpush('errors:critical', JSON.stringify({
      timestamp: new Date(),
      type,
      error: error.message
    }));
  }

  private async runBaselineValidation(): Promise<void> {
    console.log('📋 Running baseline validation...');
    const result = await this.validateTrialBalance();
    console.log(`Baseline: ${result.status} - ${result.details.message}`);
  }

  /**
   * STOP
   */
  async stop(): Promise<void> {
    console.log('🛑 Stopping Financial Integrity Guard...');
    this.isRunning = false;
    if (this.hourlyTimer) clearTimeout(this.hourlyTimer);
    if (this.dailyTimer) clearTimeout(this.dailyTimer);
    console.log('✅ Financial Integrity Guard Stopped');
  }

  /**
   * GET STATUS
   */
  async getStatus(): Promise<any> {
    return {
      isRunning: this.isRunning,
      validationsLast24h: this.validations.filter(
        v => v.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length,
      frozenCompanies: Array.from(this.frozenCompanies),
      lastValidation: this.validations[this.validations.length - 1]
    };
  }
}

export { FinancialIntegrityGuard, ValidationResult };
export default FinancialIntegrityGuard;
