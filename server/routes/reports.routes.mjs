/**
 * Reports Engine Routes
 * Enterprise-grade reporting system with modular report generation
 */

import express from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/error.middleware.mjs';
import {
  requirePermission,
  requireSubscription,
  requireCompanyAccess,
  auditLog,
  userRateLimit
} from '../middleware/auth.middleware.mjs';

const router = express.Router();

const getPrisma = () => global.prisma;

// Report generation schemas
const generateReportSchema = z.object({
  reportType: z.enum([
    'BALANCE_SHEET',
    'INCOME_STATEMENT',
    'CASH_FLOW',
    'TRIAL_BALANCE',
    'GENERAL_LEDGER',
    'ACCOUNTS_RECEIVABLE_AGING',
    'ACCOUNTS_PAYABLE_AGING',
    'PROFIT_LOSS_TRENDS',
    'EXPENSE_ANALYSIS',
    'REVENUE_ANALYSIS',
    'CUSTOMER_STATEMENT',
    'VENDOR_STATEMENT',
  ]),
  dateFrom: z.string().transform(val => new Date(val)),
  dateTo: z.string().transform(val => new Date(val)),
  accountIds: z.array(z.string()).optional(),
  customerId: z.string().optional(),
  format: z.enum(['JSON', 'PDF', 'EXCEL', 'CSV']).default('JSON'),
});

const scheduleReportSchema = z.object({
  name: z.string().min(1).max(100),
  reportType: z.string(),
  schedule: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY']),
  recipients: z.array(z.string().email()),
  parameters: z.record(z.any()).optional(),
});

// Apply rate limiting to report operations
router.use(userRateLimit({ max: 30 })); // 30 requests per 15 minutes for reports

// GET /api/reports/types
router.get('/types', asyncHandler(async (req, res) => {
  const reportTypes = [
    {
      id: 'BALANCE_SHEET',
      name: 'Balance Sheet',
      description: 'Assets, liabilities, and equity snapshot',
      category: 'Financial',
      requiredSubscription: 'STARTER',
    },
    {
      id: 'INCOME_STATEMENT',
      name: 'Income Statement',
      description: 'Revenue and expenses over a period',
      category: 'Financial',
      requiredSubscription: 'STARTER',
    },
    {
      id: 'CASH_FLOW',
      name: 'Cash Flow Statement',
      description: 'Cash inflows and outflows',
      category: 'Financial',
      requiredSubscription: 'STARTER',
    },
    {
      id: 'TRIAL_BALANCE',
      name: 'Trial Balance',
      description: 'Account balances verification',
      category: 'Accounting',
      requiredSubscription: 'STARTER',
    },
    {
      id: 'GENERAL_LEDGER',
      name: 'General Ledger',
      description: 'Complete transaction history by account',
      category: 'Accounting',
      requiredSubscription: 'STARTER',
    },
    {
      id: 'ACCOUNTS_RECEIVABLE_AGING',
      name: 'AR Aging Report',
      description: 'Outstanding receivables by age',
      category: 'Business Intelligence',
      requiredSubscription: 'GROWTH',
    },
    {
      id: 'ACCOUNTS_PAYABLE_AGING',
      name: 'AP Aging Report',
      description: 'Outstanding payables by age',
      category: 'Business Intelligence',
      requiredSubscription: 'GROWTH',
    },
    {
      id: 'PROFIT_LOSS_TRENDS',
      name: 'P&L Trends',
      description: 'Monthly profit and loss analysis',
      category: 'Business Intelligence',
      requiredSubscription: 'GROWTH',
    },
    {
      id: 'EXPENSE_ANALYSIS',
      name: 'Expense Analysis',
      description: 'Spending patterns and insights',
      category: 'Business Intelligence',
      requiredSubscription: 'GROWTH',
    },
    {
      id: 'REVENUE_ANALYSIS',
      name: 'Revenue Analysis',
      description: 'Income trends and forecasting',
      category: 'Business Intelligence',
      requiredSubscription: 'ENTERPRISE',
    },
    {
      id: 'CUSTOMER_STATEMENT',
      name: 'Customer Statement',
      description: 'Detailed customer transaction history',
      category: 'Customer',
      requiredSubscription: 'GROWTH',
    },
    {
      id: 'VENDOR_STATEMENT',
      name: 'Vendor Statement',
      description: 'Detailed vendor transaction history',
      category: 'Vendor',
      requiredSubscription: 'GROWTH',
    },
  ];

  res.json({
    success: true,
    data: { reportTypes },
  });
}));

// POST /api/reports/generate
router.post('/generate',
  requirePermission('reports:read'),
  requireCompanyAccess('reports'),
  auditLog('generated', 'report'),
  asyncHandler(async (req, res) => {
    const validatedData = generateReportSchema.parse(req.body);

    // Check subscription requirements for advanced reports
    const advancedReports = [
      'ACCOUNTS_RECEIVABLE_AGING',
      'ACCOUNTS_PAYABLE_AGING',
      'PROFIT_LOSS_TRENDS',
      'EXPENSE_ANALYSIS',
      'REVENUE_ANALYSIS',
      'CUSTOMER_STATEMENT',
      'VENDOR_STATEMENT',
    ];

    if (advancedReports.includes(validatedData.reportType)) {
      if (!['GROWTH', 'ENTERPRISE'].includes(req.user.company?.subscriptionPlan || req.user.subscriptionPlan)) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'This report requires a Growth or Enterprise subscription',
        });
      }
    }

    const reportData = await generateReport(validatedData, req.user, req.companyFilter);

    // Log report generation
    console.log(`📊 Report generated: ${validatedData.reportType} for user ${req.user.email}`);

    res.json({
      success: true,
      data: {
        report: reportData,
        metadata: {
          generatedAt: new Date().toISOString(),
          generatedBy: req.user.email,
          companyId: req.user.companyId,
          dateRange: {
            from: validatedData.dateFrom.toISOString(),
            to: validatedData.dateTo.toISOString(),
          },
          format: validatedData.format,
        },
      },
    });
  })
);

// GET /api/reports/history
router.get('/history',
  requirePermission('reports:read'),
  requireCompanyAccess('reports'),
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 50, reportType } = req.query;
    const skip = (page - 1) * limit;

    const prisma = getPrisma();

    if (prisma && prisma.reportHistory) {
      // Database mode
      const where = {
        ...req.companyFilter,
        ...(reportType && { reportType }),
      };

      const [reports, total] = await Promise.all([
        prisma.reportHistory.findMany({
          where,
          include: {
            generatedBy: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { generatedAt: 'desc' },
          skip,
          take: parseInt(limit),
        }),
        prisma.reportHistory.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          reports,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } else if (prisma && !prisma.reportHistory) {
      res.status(501).json({
        success: false,
        error: 'Not Implemented',
        message: 'Report history persistence is not implemented (missing Prisma model reportHistory)',
      });
    } else {
      // Mock mode
      const mockReports = [
        {
          id: 'rpt-1',
          reportType: 'BALANCE_SHEET',
          generatedAt: '2024-02-13T10:30:00Z',
          generatedBy: { name: req.user.name, email: req.user.email },
          parameters: { dateFrom: '2024-01-01', dateTo: '2024-01-31' },
          downloadUrl: '#',
        },
      ];

      res.json({
        success: true,
        data: {
          reports: mockReports,
          pagination: {
            page: 1,
            limit: mockReports.length,
            total: mockReports.length,
            pages: 1,
          },
        },
      });
    }
  })
);

// POST /api/reports/schedule
router.post('/schedule',
  requirePermission('reports:write'),
  requireSubscription('ENTERPRISE'),
  requireCompanyAccess('reports'),
  auditLog('scheduled', 'report'),
  asyncHandler(async (req, res) => {
    const validatedData = scheduleReportSchema.parse(req.body);

    if (prisma && prisma.scheduledReport) {
      // Database mode
      const scheduledReport = await prisma.scheduledReport.create({
        data: {
          name: validatedData.name,
          reportType: validatedData.reportType,
          schedule: validatedData.schedule,
          recipients: validatedData.recipients,
          parameters: validatedData.parameters || {},
          companyId: req.user.companyId,
          createdById: req.user.id,
          isActive: true,
        },
      });

      res.status(201).json({
        success: true,
        data: { scheduledReport },
      });
    } else if (prisma && !prisma.scheduledReport) {
      res.status(501).json({
        success: false,
        error: 'Not Implemented',
        message: 'Report scheduling is not implemented (missing Prisma model scheduledReport)',
      });
    } else {
      // Mock mode
      const scheduledReport = {
        id: `sched-${Date.now()}`,
        ...validatedData,
        companyId: req.user.companyId,
        createdById: req.user.id,
        isActive: true,
        createdAt: new Date(),
      };

      res.status(201).json({
        success: true,
        data: { scheduledReport },
      });
    }
  })
);

// GET /api/reports/scheduled
router.get('/scheduled',
  requirePermission('reports:read'),
  requireSubscription('ENTERPRISE'),
  requireCompanyAccess('reports'),
  asyncHandler(async (req, res) => {
    if (prisma && prisma.scheduledReport) {
      // Database mode
      const scheduledReports = await prisma.scheduledReport.findMany({
        where: {
          companyId: req.user.companyId,
          isActive: true,
        },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        data: { scheduledReports },
      });
    } else if (prisma && !prisma.scheduledReport) {
      res.status(501).json({
        success: false,
        error: 'Not Implemented',
        message: 'Report scheduling is not implemented (missing Prisma model scheduledReport)',
      });
    } else {
      // Mock mode
      const mockScheduledReports = [
        {
          id: 'sched-1',
          name: 'Monthly Balance Sheet',
          reportType: 'BALANCE_SHEET',
          schedule: 'MONTHLY',
          recipients: ['ceo@chronaworkflow.com'],
          isActive: true,
          createdAt: '2024-02-01T00:00:00Z',
          createdBy: { name: req.user.name, email: req.user.email },
        },
      ];

      res.json({
        success: true,
        data: { scheduledReports: mockScheduledReports },
      });
    }
  })
);

// Report generation helper function
async function generateReport(params, user, companyFilter) {
  const { reportType, dateFrom, dateTo, accountIds, customerId } = params;

  switch (reportType) {
    case 'BALANCE_SHEET':
      return await generateBalanceSheet(dateTo, companyFilter);
    case 'INCOME_STATEMENT':
      return await generateIncomeStatement(dateFrom, dateTo, companyFilter);
    case 'CASH_FLOW':
      return await generateCashFlowStatement(dateFrom, dateTo, companyFilter);
    case 'TRIAL_BALANCE':
      return await generateTrialBalance(dateTo, companyFilter);
    case 'GENERAL_LEDGER':
      return await generateGeneralLedger(dateFrom, dateTo, accountIds, companyFilter);
    case 'ACCOUNTS_RECEIVABLE_AGING':
      return await generateARAging(dateTo, companyFilter);
    case 'ACCOUNTS_PAYABLE_AGING':
      return await generateAPAging(dateTo, companyFilter);
    case 'PROFIT_LOSS_TRENDS':
      return await generatePLTrends(dateFrom, dateTo, companyFilter);
    case 'CUSTOMER_STATEMENT':
      return await generateCustomerStatement(customerId, dateFrom, dateTo, companyFilter);
    default:
      throw new Error(`Unsupported report type: ${reportType}`);
  }
}

// Balance Sheet Report
async function generateBalanceSheet(asOfDate, companyFilter) {
  if (prisma) {
    const [assets, liabilities, equity] = await Promise.all([
      // Assets
      prisma.account.groupBy({
        by: ['type'],
        where: {
          type: 'ASSET',
          ...companyFilter,
          isActive: true,
        },
        _sum: { balance: true },
      }),
      // Liabilities
      prisma.account.groupBy({
        by: ['type'],
        where: {
          type: 'LIABILITY',
          ...companyFilter,
          isActive: true,
        },
        _sum: { balance: true },
      }),
      // Equity
      prisma.account.groupBy({
        by: ['type'],
        where: {
          type: 'EQUITY',
          ...companyFilter,
          isActive: true,
        },
        _sum: { balance: true },
      }),
    ]);

    return {
      reportType: 'BALANCE_SHEET',
      asOfDate: asOfDate.toISOString(),
      assets: assets.reduce((sum, acc) => sum + (acc._sum.balance || 0), 0),
      liabilities: liabilities.reduce((sum, acc) => sum + (acc._sum.balance || 0), 0),
      equity: equity.reduce((sum, acc) => sum + (acc._sum.balance || 0), 0),
      totalLiabilitiesAndEquity: liabilities.reduce((sum, acc) => sum + (acc._sum.balance || 0), 0) +
                                 equity.reduce((sum, acc) => sum + (acc._sum.balance || 0), 0),
    };
  }

  // Mock data
  return {
    reportType: 'BALANCE_SHEET',
    asOfDate: asOfDate.toISOString(),
    assets: 169800.00,
    liabilities: 8320.00,
    equity: 161480.00,
    totalLiabilitiesAndEquity: 169800.00,
  };
}

// Income Statement Report
async function generateIncomeStatement(dateFrom, dateTo, companyFilter) {
  if (prisma) {
    const [revenue, expenses] = await Promise.all([
      // Revenue
      prisma.transactionLine.aggregate({
        _sum: { credit: true },
        where: {
          transaction: {
            date: { gte: dateFrom, lte: dateTo },
            ...companyFilter,
          },
          account: { type: 'REVENUE' },
        },
      }),
      // Expenses
      prisma.transactionLine.aggregate({
        _sum: { debit: true },
        where: {
          transaction: {
            date: { gte: dateFrom, lte: dateTo },
            ...companyFilter,
          },
          account: { type: 'EXPENSE' },
        },
      }),
    ]);

    const totalRevenue = revenue._sum.credit || 0;
    const totalExpenses = expenses._sum.debit || 0;
    const netIncome = totalRevenue - totalExpenses;

    return {
      reportType: 'INCOME_STATEMENT',
      dateFrom: dateFrom.toISOString(),
      dateTo: dateTo.toISOString(),
      revenue: totalRevenue,
      expenses: totalExpenses,
      netIncome,
    };
  }

  // Mock data
  return {
    reportType: 'INCOME_STATEMENT',
    dateFrom: dateFrom.toISOString(),
    dateTo: dateTo.toISOString(),
    revenue: 89560.00,
    expenses: 45670.00,
    netIncome: 43890.00,
  };
}

async function generateCashFlowStatement(dateFrom, dateTo, companyFilter) {
  return {
    reportType: 'CASH_FLOW',
    dateFrom: dateFrom.toISOString(),
    dateTo: dateTo.toISOString(),
    message: 'Cash flow reporting is not implemented yet',
  };
}

async function generateTrialBalance(asOfDate, companyFilter) {
  return {
    reportType: 'TRIAL_BALANCE',
    asOfDate: asOfDate.toISOString(),
    message: 'Trial balance reporting is not implemented yet',
  };
}

async function generateGeneralLedger(dateFrom, dateTo, accountIds, companyFilter) {
  return {
    reportType: 'GENERAL_LEDGER',
    dateFrom: dateFrom.toISOString(),
    dateTo: dateTo.toISOString(),
    accountIds: accountIds || [],
    message: 'General ledger reporting is not implemented yet',
  };
}

async function generateARAging(asOfDate, companyFilter) {
  return {
    reportType: 'ACCOUNTS_RECEIVABLE_AGING',
    asOfDate: asOfDate.toISOString(),
    message: 'AR aging reporting is not implemented yet',
  };
}

async function generateAPAging(asOfDate, companyFilter) {
  return {
    reportType: 'ACCOUNTS_PAYABLE_AGING',
    asOfDate: asOfDate.toISOString(),
    message: 'AP aging reporting is not implemented yet',
  };
}

async function generatePLTrends(dateFrom, dateTo, companyFilter) {
  return {
    reportType: 'PROFIT_LOSS_TRENDS',
    dateFrom: dateFrom.toISOString(),
    dateTo: dateTo.toISOString(),
    message: 'P&L trends reporting is not implemented yet',
  };
}

async function generateCustomerStatement(customerId, dateFrom, dateTo, companyFilter) {
  return {
    reportType: 'CUSTOMER_STATEMENT',
    customerId,
    dateFrom: dateFrom.toISOString(),
    dateTo: dateTo.toISOString(),
    message: 'Customer statements are not implemented yet',
  };
}

// Additional report generators would follow similar patterns...

export default router;
