/**
 * Accounting Routes
 * Enterprise-grade accounting module with multi-tenant support
 */

import express from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/error.middleware.mjs';
import {
  requireRole,
  requirePermission,
  requireSubscription,
  requireCompanyAccess,
  auditLog,
  userRateLimit
} from '../middleware/auth.middleware.mjs';
import { requireQuota } from '../middleware/entitlements.middleware.mjs';

const router = express.Router();

const getPrisma = () => global.prisma;

// Enhanced validation schemas with enterprise constraints
const createAccountSchema = z.object({
  code: z.string().min(1, 'Account code is required').max(20, 'Account code too long'),
  name: z.string().min(1, 'Account name is required').max(100, 'Account name too long'),
  type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']),
  description: z.string().max(500, 'Description too long').optional(),
  parentId: z.string().optional(),
});

const createTransactionSchema = z.object({
  date: z.string().transform(val => new Date(val)).refine(date => date <= new Date(), 'Date cannot be in the future'),
  description: z.string().min(1, 'Description is required').max(255, 'Description too long'),
  lines: z.array(z.object({
    accountId: z.string(),
    debit: z.number().min(0).max(999999999.99),
    credit: z.number().min(0).max(999999999.99),
  })).min(2, 'At least 2 line items required').max(50, 'Too many line items'),
});

const createInvoiceSchema = z.object({
  customerId: z.string(),
  invoiceNumber: z.string().max(50, 'Invoice number too long').optional(),
  issueDate: z.string().transform(val => new Date(val)),
  dueDate: z.string().transform(val => new Date(val)).refine((date, ctx) => {
    if (date <= ctx.parent.issueDate) return false;
    return date <= new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // Max 1 year in future
  }, 'Due date must be after issue date and within 1 year'),
  lines: z.array(z.object({
    description: z.string().min(1).max(255),
    quantity: z.number().min(0.01).max(999999),
    unitPrice: z.number().min(0).max(999999999.99),
    taxRate: z.number().min(0).max(100).default(0),
  })).min(1, 'At least one line item required').max(100, 'Too many line items'),
});

// Apply rate limiting to accounting operations
router.use(userRateLimit({ max: 50 })); // 50 requests per 15 minutes for accounting

// Chart of Accounts Routes

// GET /api/accounting/accounts
router.get('/accounts',
  requirePermission('accounting:read'),
  requireCompanyAccess('accounts'),
  auditLog('viewed', 'accounts'),
  asyncHandler(async (req, res) => {
    const prisma = getPrisma();
    const {
      type,
      isActive = 'true',
      search,
      page = 1,
      limit = 50
    } = req.query;

    const skip = (page - 1) * limit;
    const where = {
      ...req.companyFilter, // Company isolation
      ...(type && { type }),
      isActive: isActive === 'true',
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search } },
          { description: { contains: search, mode: 'insensitive' } },
        ]
      }),
    };

    if (prisma) {
      // Database mode
      const [accounts, total] = await Promise.all([
        prisma.account.findMany({
          where,
          include: {
            parent: {
              select: { id: true, name: true, code: true },
            },
            children: {
              select: { id: true, name: true, code: true },
            },
          },
          orderBy: [
            { code: 'asc' },
            { name: 'asc' },
          ],
          skip,
          take: parseInt(limit),
        }),
        prisma.account.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          accounts,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } else {
      // Mock mode
      const mockAccounts = [
        { id: 'acc-1', code: '1000', name: 'Cash', type: 'ASSET', balance: 127450.00, isActive: true },
        { id: 'acc-2', code: '1100', name: 'Accounts Receivable', type: 'ASSET', balance: 24750.00, isActive: true },
        { id: 'acc-3', code: '1200', name: 'Inventory', type: 'ASSET', balance: 15600.00, isActive: true },
      ];

      const filtered = mockAccounts.filter(acc =>
        (!type || acc.type === type) &&
        (!search || acc.name.toLowerCase().includes(search.toLowerCase()) || acc.code.includes(search))
      );

      res.json({
        success: true,
        data: {
          accounts: filtered,
          pagination: {
            page: 1,
            limit: filtered.length,
            total: filtered.length,
            pages: 1,
          },
        },
      });
    }
  })
);

// POST /api/accounting/accounts
router.post('/accounts',
  requirePermission('accounting:write'),
  requireRole('OWNER', 'ADMIN', 'ACCOUNTANT'),
  requireCompanyAccess('accounts'),
  auditLog('created', 'account'),
  asyncHandler(async (req, res) => {
    const validatedData = createAccountSchema.parse(req.body);

    const prisma = getPrisma();

    if (prisma) {
      // Database mode
      const existingAccount = await prisma.account.findFirst({
        where: {
          code: validatedData.code,
          ...req.companyFilter,
        },
      });

      if (existingAccount) {
        return res.status(409).json({
          success: false,
          error: 'Conflict',
          message: 'Account with this code already exists in your company',
        });
      }

      // Validate parent account if provided
      if (validatedData.parentId) {
        const parentAccount = await prisma.account.findFirst({
          where: {
            id: validatedData.parentId,
            ...req.companyFilter,
          },
        });

        if (!parentAccount) {
          return res.status(400).json({
            success: false,
            error: 'Bad Request',
            message: 'Parent account not found',
          });
        }
      }

      const account = await prisma.account.create({
        data: {
          ...validatedData,
          companyId: req.user.companyId,
        },
        include: {
          parent: {
            select: { id: true, name: true, code: true },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: { account },
      });
    } else {
      // Mock mode
      const account = {
        id: `acc-${Date.now()}`,
        ...validatedData,
        balance: 0,
        isActive: true,
        createdAt: new Date(),
      };

      res.status(201).json({
        success: true,
        data: { account },
      });
    }
  })
);

// PUT /api/accounting/accounts/:accountId
router.put('/accounts/:accountId',
  requirePermission('accounting:write'),
  requireRole('OWNER', 'ADMIN', 'ACCOUNTANT'),
  requireCompanyAccess('accounts'),
  auditLog('updated', 'account'),
  asyncHandler(async (req, res) => {
    const { accountId } = req.params;
    const validatedData = createAccountSchema.partial().parse(req.body);

    const prisma = getPrisma();

    if (prisma) {
      // Database mode
      const existingAccount = await prisma.account.findFirst({
        where: {
          id: accountId,
          ...req.companyFilter,
        },
      });

      if (!existingAccount) {
        return res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Account not found',
        });
      }

      // If updating code, check for duplicates
      if (validatedData.code && validatedData.code !== existingAccount.code) {
        const duplicateAccount = await prisma.account.findFirst({
          where: {
            code: validatedData.code,
            ...req.companyFilter,
            NOT: { id: accountId },
          },
        });

        if (duplicateAccount) {
          return res.status(409).json({
            success: false,
            error: 'Conflict',
            message: 'Account with this code already exists in your company',
          });
        }
      }

      const account = await prisma.account.update({
        where: { id: accountId },
        data: validatedData,
        include: {
          parent: {
            select: { id: true, name: true, code: true },
          },
        },
      });

      res.json({
        success: true,
        data: { account },
      });
    } else {
      // Mock mode
      const account = {
        id: accountId,
        ...validatedData,
        balance: 0,
        isActive: true,
        updatedAt: new Date(),
      };

      res.json({
        success: true,
        data: { account },
      });
    }
  })
);

// Transaction Routes

// GET /api/accounting/transactions
router.get('/transactions',
  requirePermission('accounting:read'),
  requireCompanyAccess('transactions'),
  auditLog('viewed', 'transactions'),
  asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 50,
      accountId,
      fromDate,
      toDate,
      type,
      search,
    } = req.query;

    const skip = (page - 1) * limit;
    const dateFilter = {
      ...(fromDate && { gte: new Date(fromDate) }),
      ...(toDate && { lte: new Date(toDate) }),
    };

    const where = {
      ...req.companyFilter,
      ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
      ...(accountId && { lines: { some: { accountId } } }),
      ...(search && { description: { contains: search, mode: 'insensitive' } }),
    };

    if (prisma) {
      // Database mode
      const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
          where,
          include: {
            lines: {
              include: {
                account: {
                  select: { id: true, name: true, code: true, type: true },
                },
              },
            },
          },
          orderBy: { date: 'desc' },
          skip,
          take: parseInt(limit),
        }),
        prisma.transaction.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          transactions,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } else {
      // Mock mode
      const mockTransactions = [
        {
          id: 'txn-1',
          date: '2024-02-13',
          description: 'Client Payment - ABC Corp',
          lines: [
            { accountId: 'acc-1', debit: 2500, credit: 0, account: { name: 'Cash', code: '1000' } },
            { accountId: 'acc-2', debit: 0, credit: 2500, account: { name: 'Accounts Receivable', code: '1100' } },
          ],
        },
      ];

      res.json({
        success: true,
        data: {
          transactions: mockTransactions,
          pagination: {
            page: 1,
            limit: mockTransactions.length,
            total: mockTransactions.length,
            pages: 1,
          },
        },
      });
    }
  })
);

// POST /api/accounting/transactions
router.post('/transactions',
  requirePermission('accounting:write'),
  requireRole('OWNER', 'ADMIN', 'ACCOUNTANT'),
  requireCompanyAccess('transactions'),
  requireQuota({ type: 'transactions' }),
  auditLog('created', 'transaction'),
  asyncHandler(async (req, res) => {
    const validatedData = createTransactionSchema.parse(req.body);

    // Validate debits equal credits
    const totalDebits = validatedData.lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredits = validatedData.lines.reduce((sum, line) => sum + line.credit, 0);

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: `Total debits ($${totalDebits.toFixed(2)}) must equal total credits ($${totalCredits.toFixed(2)})`,
      });
    }

    if (prisma) {
      // Database mode
      // Verify all accounts exist and belong to company
      const accountIds = validatedData.lines.map(line => line.accountId);
      const accounts = await prisma.account.findMany({
        where: {
          id: { in: accountIds },
          ...req.companyFilter,
        },
      });

      if (accounts.length !== accountIds.length) {
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'One or more accounts not found in your company',
        });
      }

      const transaction = await prisma.transaction.create({
        data: {
          date: validatedData.date,
          description: validatedData.description,
          companyId: req.user.companyId,
          lines: {
            create: validatedData.lines,
          },
        },
        include: {
          lines: {
            include: {
              account: {
                select: { id: true, name: true, code: true, type: true },
              },
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: { transaction },
      });
    } else {
      // Mock mode
      const transaction = {
        id: `txn-${Date.now()}`,
        ...validatedData,
        companyId: req.user.companyId,
        createdAt: new Date(),
      };

      res.status(201).json({
        success: true,
        data: { transaction },
      });
    }
  })
);

// Invoice Routes (Enterprise/Growth feature)

// GET /api/accounting/invoices
router.get('/invoices',
  requirePermission('invoices:read'),
  requireSubscription('GROWTH', 'ENTERPRISE'),
  requireCompanyAccess('invoices'),
  auditLog('viewed', 'invoices'),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 50, status, customerId, search } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      ...req.companyFilter,
      ...(status && { status }),
      ...(customerId && { customerId }),
      ...(search && {
        OR: [
          { invoiceNumber: { contains: search } },
          { customer: { name: { contains: search, mode: 'insensitive' } } },
        ]
      }),
    };

    if (prisma) {
      // Database mode
      const [invoices, total] = await Promise.all([
        prisma.invoice.findMany({
          where,
          include: {
            customer: {
              select: { id: true, name: true, email: true },
            },
            lines: true,
          },
          orderBy: { issueDate: 'desc' },
          skip,
          take: parseInt(limit),
        }),
        prisma.invoice.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          invoices,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } else {
      // Mock mode
      const mockInvoices = [
        {
          id: 'inv-1',
          invoiceNumber: 'INV-2024-001',
          issueDate: '2024-02-13',
          dueDate: '2024-03-15',
          status: 'SENT',
          customer: { id: 'cust-1', name: 'ABC Corp', email: 'billing@abc.com' },
          lines: [{ description: 'Consulting Services', quantity: 40, unitPrice: 150, amount: 6000 }],
        },
      ];

      res.json({
        success: true,
        data: {
          invoices: mockInvoices,
          pagination: {
            page: 1,
            limit: mockInvoices.length,
            total: mockInvoices.length,
            pages: 1,
          },
        },
      });
    }
  })
);

// POST /api/accounting/invoices
router.post('/invoices',
  requirePermission('invoices:write'),
  requireSubscription('GROWTH', 'ENTERPRISE'),
  requireRole('OWNER', 'ADMIN', 'ACCOUNTANT'),
  requireCompanyAccess('invoices'),
  requireQuota({ type: 'invoices' }),
  auditLog('created', 'invoice'),
  asyncHandler(async (req, res) => {
    const validatedData = createInvoiceSchema.parse(req.body);

    if (prisma) {
      // Database mode
      // Generate invoice number if not provided
      const invoiceNumber = validatedData.invoiceNumber || `INV-${Date.now()}`;

      // Check if invoice number already exists
      const existingInvoice = await prisma.invoice.findFirst({
        where: {
          invoiceNumber,
          ...req.companyFilter,
        },
      });

      if (existingInvoice) {
        return res.status(409).json({
          success: false,
          error: 'Conflict',
          message: 'Invoice with this number already exists',
        });
      }

      // Verify customer exists and belongs to company
      const customer = await prisma.customer.findFirst({
        where: {
          id: validatedData.customerId,
          ...req.companyFilter,
        },
      });

      if (!customer) {
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Customer not found in your company',
        });
      }

      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          issueDate: validatedData.issueDate,
          dueDate: validatedData.dueDate,
          customerId: validatedData.customerId,
          companyId: req.user.companyId,
          status: 'DRAFT',
          lines: {
            create: validatedData.lines.map(line => ({
              description: line.description,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              taxRate: line.taxRate,
              amount: line.quantity * line.unitPrice * (1 + line.taxRate / 100),
            })),
          },
        },
        include: {
          customer: {
            select: { id: true, name: true, email: true },
          },
          lines: true,
        },
      });

      res.status(201).json({
        success: true,
        data: { invoice },
      });
    } else {
      // Mock mode
      const invoice = {
        id: `inv-${Date.now()}`,
        invoiceNumber: validatedData.invoiceNumber || `INV-${Date.now()}`,
        ...validatedData,
        status: 'DRAFT',
        companyId: req.user.companyId,
        createdAt: new Date(),
      };

      res.status(201).json({
        success: true,
        data: { invoice },
      });
    }
  })
);

// GET /api/accounting/summary
router.get('/summary',
  requirePermission('accounting:read'),
  requireCompanyAccess('summary'),
  auditLog('viewed', 'accounting-summary'),
  asyncHandler(async (req, res) => {
    const { fromDate, toDate } = req.query;

    const dateFilter = {
      ...(fromDate && { gte: new Date(fromDate) }),
      ...(toDate && { lte: new Date(toDate) }),
    };

    if (prisma) {
      // Database mode - complex aggregations
      const [
        totalRevenue,
        totalExpenses,
        totalAssets,
        totalLiabilities,
        cashBalance,
        receivables,
        payables,
      ] = await Promise.all([
        // Total Revenue
        prisma.transactionLine.aggregate({
          _sum: { credit: true },
          where: {
            transaction: { date: dateFilter, ...req.companyFilter },
            account: { type: 'REVENUE' },
          },
        }),
        // Total Expenses
        prisma.transactionLine.aggregate({
          _sum: { debit: true },
          where: {
            transaction: { date: dateFilter, ...req.companyFilter },
            account: { type: 'EXPENSE' },
          },
        }),
        // Total Assets
        prisma.account.aggregate({
          _sum: { balance: true },
          where: {
            type: 'ASSET',
            ...req.companyFilter,
            isActive: true,
          },
        }),
        // And so on...
      ]);

      const summary = {
        totalRevenue: totalRevenue._sum.credit || 0,
        totalExpenses: totalExpenses._sum.debit || 0,
        netIncome: (totalRevenue._sum.credit || 0) - (totalExpenses._sum.debit || 0),
        totalAssets: totalAssets._sum.balance || 0,
        // ... calculate other metrics
      };

      res.json({
        success: true,
        data: { summary },
      });
    } else {
      // Mock mode
      const summary = {
        totalRevenue: 89560.00,
        totalExpenses: 45670.00,
        netIncome: 43890.00,
        totalAssets: 169800.00,
        totalLiabilities: 8320.00,
        totalEquity: 161480.00,
        cashBalance: 127450.00,
        receivables: 24750.00,
        payables: 8320.00,
      };

      res.json({
        success: true,
        data: { summary },
      });
    }
  })
);

export default router;
