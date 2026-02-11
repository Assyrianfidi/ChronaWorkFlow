/**
 * Ledger Service - API Routes
 * REST API endpoints for double-entry accounting operations
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import LedgerService from './LedgerService';
import { requireAuth, requirePermission } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { rateLimit } from '../middleware/rateLimit';

// ============================================
// VALIDATION SCHEMAS
// ============================================

const createAccountSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(255),
  type: z.enum(['asset', 'liability', 'equity', 'revenue', 'expense']),
  subtype: z.string().optional(),
  parentId: z.string().uuid().optional(),
  isBankAccount: z.boolean().optional(),
  taxCode: z.string().optional(),
  trackLocation: z.boolean().optional(),
  trackDepartment: z.boolean().optional(),
  trackProject: z.boolean().optional(),
  trackClass: z.boolean().optional(),
  description: z.string().optional(),
});

const updateAccountSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  subtype: z.string().optional(),
  parentId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
  taxCode: z.string().optional(),
  trackLocation: z.boolean().optional(),
  trackDepartment: z.boolean().optional(),
  trackProject: z.boolean().optional(),
  trackClass: z.boolean().optional(),
  description: z.string().optional(),
});

const moneySchema = z.union([
  z.object({ cents: z.bigint(), currency: z.string() }),
  z.number(),
  z.string(),
]);

const transactionLineSchema = z.object({
  accountId: z.string().uuid(),
  debit: moneySchema.optional(),
  credit: moneySchema.optional(),
  description: z.string().optional(),
  locationId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  classId: z.string().uuid().optional(),
  sourceType: z.string().optional(),
  sourceId: z.string().uuid().optional(),
  lineNumber: z.number().int().min(0).optional(),
}).refine(
  (data) => {
    const hasDebit = data.debit !== undefined && 
      (typeof data.debit === 'number' ? data.debit > 0 : 
       typeof data.debit === 'string' ? parseFloat(data.debit) > 0 :
       data.debit.cents > BigInt(0));
    const hasCredit = data.credit !== undefined &&
      (typeof data.credit === 'number' ? data.credit > 0 :
       typeof data.credit === 'string' ? parseFloat(data.credit) > 0 :
       data.credit.cents > BigInt(0));
    return hasDebit || hasCredit;
  },
  { message: 'Line must have either debit or credit amount' }
);

const createTransactionSchema = z.object({
  date: z.coerce.date(),
  description: z.string().min(1).max(1000),
  reference: z.string().optional(),
  type: z.enum(['manual', 'invoice', 'payment', 'bill', 'bank_import', 'adjustment']).optional(),
  sourceId: z.string().uuid().optional(),
  idempotencyKey: z.string().optional(),
  locationId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  classId: z.string().uuid().optional(),
  lines: z.array(transactionLineSchema).min(2),
});

const postTransactionSchema = z.object({
  postDate: z.coerce.date().optional(),
});

const reverseTransactionSchema = z.object({
  reason: z.string().min(1).max(1000),
  reverseDate: z.coerce.date().optional(),
});

const closePeriodSchema = z.object({
  adjustments: z.array(z.object({
    accountId: z.string().uuid(),
    description: z.string(),
    debit: moneySchema.optional(),
    credit: moneySchema.optional(),
    locationId: z.string().uuid().optional(),
    departmentId: z.string().uuid().optional(),
    projectId: z.string().uuid().optional(),
    classId: z.string().uuid().optional(),
  })).optional(),
  closingEntries: z.boolean().optional(),
});

// ============================================
// ROUTER FACTORY
// ============================================

export function createLedgerRoutes(ledgerService: LedgerService): Router {
  const router = Router();

  // Rate limiting for ledger operations
  const ledgerRateLimit = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    keyPrefix: 'ledger',
  });

  // ============================================
  // ACCOUNT ENDPOINTS
  // ============================================

  /**
   * GET /api/v1/ledger/accounts
   * List all accounts for company
   */
  router.get(
    '/accounts',
    requireAuth,
    requirePermission('ledger:read'),
    ledgerRateLimit,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const companyId = req.user!.companyId;
        const { type, isActive } = req.query;

        const accounts = await ledgerService.getAccountsByCompany(companyId, {
          type: type as any,
          isActive: isActive !== undefined ? isActive === 'true' : undefined,
        });

        res.json({
          success: true,
          data: accounts,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * GET /api/v1/ledger/accounts/:id
   * Get single account
   */
  router.get(
    '/accounts/:id',
    requireAuth,
    requirePermission('ledger:read'),
    ledgerRateLimit,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const companyId = req.user!.companyId;
        const accountId = req.params.id;

        const account = await ledgerService.getAccount(companyId, accountId);

        if (!account) {
          return res.status(404).json({
            success: false,
            error: {
              code: 'ACCOUNT_NOT_FOUND',
              message: 'Account not found',
            },
          });
        }

        res.json({
          success: true,
          data: account,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * POST /api/v1/ledger/accounts
   * Create new account
   */
  router.post(
    '/accounts',
    requireAuth,
    requirePermission('ledger:write'),
    ledgerRateLimit,
    validateRequest(createAccountSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const companyId = req.user!.companyId;
        const userId = req.user!.id;

        const account = await ledgerService.createAccount(companyId, userId, req.body);

        res.status(201).json({
          success: true,
          data: account,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * PATCH /api/v1/ledger/accounts/:id
   * Update account
   */
  router.patch(
    '/accounts/:id',
    requireAuth,
    requirePermission('ledger:write'),
    ledgerRateLimit,
    validateRequest(updateAccountSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const companyId = req.user!.companyId;
        const userId = req.user!.id;
        const accountId = req.params.id;

        const account = await ledgerService.updateAccount(companyId, accountId, userId, req.body);

        res.json({
          success: true,
          data: account,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // ============================================
  // TRANSACTION ENDPOINTS
  // ============================================

  /**
   * POST /api/v1/ledger/transactions
   * Create draft transaction
   */
  router.post(
    '/transactions',
    requireAuth,
    requirePermission('ledger:write'),
    ledgerRateLimit,
    validateRequest(createTransactionSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const companyId = req.user!.companyId;
        const userId = req.user!.id;

        // Validate transaction balances before creation
        const validation = ledgerService.validateTransactionLines(
          req.body.lines.map((line: any) => ({
            account_id: line.accountId,
            debit_cents: line.debit ? (typeof line.debit === 'number' ? line.debit * 100 : line.debit) : 0,
            credit_cents: line.credit ? (typeof line.credit === 'number' ? line.credit * 100 : line.credit) : 0,
          }))
        );

        if (!validation.isValid) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Transaction validation failed',
              details: validation.errors,
            },
          });
        }

        const transaction = await ledgerService.createTransaction(companyId, userId, req.body);

        res.status(201).json({
          success: true,
          data: transaction,
          validation: {
            isBalanced: validation.isBalanced,
            totalDebits: validation.totalDebits,
            totalCredits: validation.totalCredits,
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * POST /api/v1/ledger/transactions/:id/post
   * Post (finalize) a draft transaction
   */
  router.post(
    '/transactions/:id/post',
    requireAuth,
    requirePermission('ledger:post'),
    ledgerRateLimit,
    validateRequest(postTransactionSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const companyId = req.user!.companyId;
        const userId = req.user!.id;
        const transactionId = req.params.id;

        const transaction = await ledgerService.postTransaction(companyId, userId, {
          transactionId,
          postDate: req.body.postDate,
        });

        res.json({
          success: true,
          data: transaction,
        });
      } catch (error: any) {
        // Handle specific errors
        if (error.message.includes('closed period')) {
          return res.status(409).json({
            success: false,
            error: {
              code: 'CLOSED_PERIOD',
              message: error.message,
            },
          });
        }
        if (error.message.includes('does not balance')) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'UNBALANCED_TRANSACTION',
              message: error.message,
            },
          });
        }
        next(error);
      }
    }
  );

  /**
   * POST /api/v1/ledger/transactions/:id/reverse
   * Reverse a posted transaction
   */
  router.post(
    '/transactions/:id/reverse',
    requireAuth,
    requirePermission('ledger:reverse'),
    ledgerRateLimit,
    validateRequest(reverseTransactionSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const companyId = req.user!.companyId;
        const userId = req.user!.id;
        const transactionId = req.params.id;

        const result = await ledgerService.reverseTransaction(companyId, userId, {
          transactionId,
          reason: req.body.reason,
          reverseDate: req.body.reverseDate,
        });

        res.json({
          success: true,
          data: {
            reversed: result.reversed,
            reversal: result.reversal,
          },
        });
      } catch (error: any) {
        if (error.message.includes('already reversed')) {
          return res.status(409).json({
            success: false,
            error: {
              code: 'ALREADY_REVERSED',
              message: error.message,
            },
          });
        }
        next(error);
      }
    }
  );

  /**
   * GET /api/v1/ledger/transactions/:id
   * Get transaction details
   */
  router.get(
    '/transactions/:id',
    requireAuth,
    requirePermission('ledger:read'),
    ledgerRateLimit,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const companyId = req.user!.companyId;
        const transactionId = req.params.id;

        // Reuse internal method
        const transaction = await (ledgerService as any).getTransaction(companyId, transactionId);

        if (!transaction) {
          return res.status(404).json({
            success: false,
            error: {
              code: 'TRANSACTION_NOT_FOUND',
              message: 'Transaction not found',
            },
          });
        }

        res.json({
          success: true,
          data: transaction,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // ============================================
  // ACCOUNTING PERIOD ENDPOINTS
  // ============================================

  /**
   * GET /api/v1/ledger/periods
   * List accounting periods
   */
  router.get(
    '/periods',
    requireAuth,
    requirePermission('ledger:read'),
    ledgerRateLimit,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const companyId = req.user!.companyId;

        const periods = await ledgerService.getAccountingPeriods(companyId);

        res.json({
          success: true,
          data: periods,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * GET /api/v1/ledger/periods/current
   * Get current accounting period
   */
  router.get(
    '/periods/current',
    requireAuth,
    requirePermission('ledger:read'),
    ledgerRateLimit,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const companyId = req.user!.companyId;

        const period = await ledgerService.getCurrentPeriod(companyId);

        res.json({
          success: true,
          data: period,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * POST /api/v1/ledger/periods/:id/close
   * Close an accounting period
   */
  router.post(
    '/periods/:id/close',
    requireAuth,
    requirePermission('ledger:close_period'),
    ledgerRateLimit,
    validateRequest(closePeriodSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const companyId = req.user!.companyId;
        const userId = req.user!.id;
        const periodId = req.params.id;

        const period = await ledgerService.closePeriod(companyId, userId, {
          periodId,
          adjustments: req.body.adjustjustments,
          closingEntries: req.body.closingEntries,
        });

        res.json({
          success: true,
          data: period,
        });
      } catch (error: any) {
        if (error.message.includes('prior periods')) {
          return res.status(409).json({
            success: false,
            error: {
              code: 'PRIOR_PERIODS_OPEN',
              message: error.message,
            },
          });
        }
        next(error);
      }
    }
  );

  // ============================================
  // REPORTING ENDPOINTS
  // ============================================

  /**
   * GET /api/v1/ledger/reports/trial-balance
   * Generate trial balance report
   */
  router.get(
    '/reports/trial-balance',
    requireAuth,
    requirePermission('reports:read'),
    ledgerRateLimit,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const companyId = req.user!.companyId;
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'MISSING_PARAMETERS',
              message: 'startDate and endDate are required',
            },
          });
        }

        const trialBalance = await ledgerService.getTrialBalance(
          companyId,
          new Date(startDate as string),
          new Date(endDate as string)
        );

        res.json({
          success: true,
          data: trialBalance,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * GET /api/v1/ledger/integrity-check
   * Run ledger integrity checks
   */
  router.get(
    '/integrity-check',
    requireAuth,
    requirePermission('ledger:admin'),
    ledgerRateLimit,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const companyId = req.user!.companyId;

        // This would call the database function
        const result = await (ledgerService as any).pool.query(
          'SELECT * FROM verify_ledger_integrity($1)',
          [companyId]
        );

        const checks = result.rows.map((row: any) => ({
          checkName: row.check_name,
          isValid: row.is_valid,
          details: row.details,
        }));

        res.json({
          success: true,
          data: {
            companyId,
            checkedAt: new Date(),
            checks,
            overallValid: checks.every((c: any) => c.isValid),
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}

export default createLedgerRoutes;
