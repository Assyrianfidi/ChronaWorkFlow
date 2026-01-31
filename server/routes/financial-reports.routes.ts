/**
 * Financial Reports API Routes with RBAC Enforcement
 * 
 * WHY: Demonstrates how to apply authorization middleware to protect endpoints.
 * Each route explicitly declares required permissions.
 */

import { Router } from 'express';
import {
  requireAuth,
  requirePermission,
  requireAllPermissions,
  AuthenticatedRequest,
} from '../auth/rbac/middleware';
import { Permission } from '../auth/rbac/permissions';
import { filterResourceFields } from '../auth/rbac/permissions';

const router = Router();

/**
 * GET /api/reports/profit-loss
 * 
 * Authorization: Requires VIEW_PROFIT_LOSS permission
 * Roles: Owner, Admin, Manager, Accountant, Auditor
 */
router.get(
  '/profit-loss',
  requireAuth,
  requirePermission(Permission.VIEW_PROFIT_LOSS),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { period = 'current-month' } = req.query;
      const { tenantId, role } = req.user!;

      // Fetch data from database (tenant-isolated)
      const profitLossData = await fetchProfitLossData(tenantId, period as string);

      // Filter fields based on role permissions
      const filteredData = filterResourceFields(
        profitLossData,
        'profitLoss',
        role
      );

      res.json({
        success: true,
        data: filteredData,
      });
    } catch (error) {
      console.error('[ERROR] Profit & Loss fetch failed:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch profit & loss data',
      });
    }
  }
);

/**
 * GET /api/reports/cash-flow
 * 
 * Authorization: Requires VIEW_CASH_FLOW permission
 * Roles: Owner, Admin, Manager, Accountant, Auditor
 */
router.get(
  '/cash-flow',
  requireAuth,
  requirePermission(Permission.VIEW_CASH_FLOW),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { months = 6 } = req.query;
      const { tenantId, role } = req.user!;

      const cashFlowData = await fetchCashFlowData(
        tenantId,
        parseInt(months as string, 10)
      );

      const filteredData = filterResourceFields(
        cashFlowData,
        'cashFlow',
        role
      );

      res.json({
        success: true,
        data: filteredData,
      });
    } catch (error) {
      console.error('[ERROR] Cash flow fetch failed:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch cash flow data',
      });
    }
  }
);

/**
 * POST /api/reports/export
 * 
 * Authorization: Requires BOTH view and export permissions
 * Roles: Owner, Admin, Manager, Accountant, Auditor
 */
router.post(
  '/export',
  requireAuth,
  requireAllPermissions([
    Permission.VIEW_PROFIT_LOSS,
    Permission.EXPORT_FINANCIAL_REPORTS,
  ]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { reportType, format, period } = req.body;
      const { tenantId, userId } = req.user!;

      // Validate input
      if (!reportType || !format) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'reportType and format are required',
        });
        return;
      }

      // Generate export (async job)
      const exportJob = await createExportJob({
        tenantId,
        userId,
        reportType,
        format,
        period,
      });

      res.json({
        success: true,
        data: {
          jobId: exportJob.id,
          status: 'processing',
          message: 'Export job created. You will be notified when ready.',
        },
      });
    } catch (error) {
      console.error('[ERROR] Report export failed:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create export job',
      });
    }
  }
);

/**
 * GET /api/reports/top-expenses
 * 
 * Authorization: Requires VIEW_EXPENSES permission
 * Roles: Owner, Admin, Manager, Accountant, Auditor
 */
router.get(
  '/top-expenses',
  requireAuth,
  requirePermission(Permission.VIEW_EXPENSES),
  async (req: AuthenticatedRequest, res) => {
    try {
      const { period = 'current-month', limit = 10 } = req.query;
      const { tenantId, role } = req.user!;

      const expensesData = await fetchTopExpenses(
        tenantId,
        period as string,
        parseInt(limit as string, 10)
      );

      const filteredData = expensesData.map((expense) =>
        filterResourceFields(expense, 'expense', role)
      );

      res.json({
        success: true,
        data: filteredData,
      });
    } catch (error) {
      console.error('[ERROR] Top expenses fetch failed:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch top expenses',
      });
    }
  }
);

// ============================================================================
// MOCK DATA FUNCTIONS (Replace with actual database queries)
// ============================================================================

async function fetchProfitLossData(tenantId: string, period: string) {
  // TODO: Replace with actual database query
  return {
    tenantId,
    period,
    netProfit: 45280,
    revenue: 128450,
    expenses: 83170,
    profitMargin: 35.2,
    trend: 12.5,
    previousPeriod: {
      netProfit: 40250,
      revenue: 114200,
      expenses: 73950,
    },
  };
}

async function fetchCashFlowData(tenantId: string, months: number) {
  // TODO: Replace with actual database query
  return [
    { period: 'Aug', inflow: 95000, outflow: 72000, net: 23000 },
    { period: 'Sep', inflow: 108000, outflow: 78000, net: 30000 },
    { period: 'Oct', inflow: 112000, outflow: 82000, net: 30000 },
    { period: 'Nov', inflow: 118000, outflow: 85000, net: 33000 },
    { period: 'Dec', inflow: 125000, outflow: 88000, net: 37000 },
    { period: 'Jan', inflow: 128000, outflow: 83000, net: 45000 },
  ];
}

async function fetchTopExpenses(tenantId: string, period: string, limit: number) {
  // TODO: Replace with actual database query
  return [
    { category: 'Payroll', amount: 45000, percentage: 54.1, change: 2.3 },
    { category: 'Rent & Utilities', amount: 12000, percentage: 14.4, change: 0 },
    { category: 'Marketing', amount: 8500, percentage: 10.2, change: 15.8 },
    { category: 'Software & Tools', amount: 6200, percentage: 7.5, change: -5.2 },
    { category: 'Office Supplies', amount: 4800, percentage: 5.8, change: 8.1 },
  ].slice(0, limit);
}

async function createExportJob(params: {
  tenantId: string;
  userId: string;
  reportType: string;
  format: string;
  period: string;
}) {
  // TODO: Replace with actual job queue
  return {
    id: `export-${Date.now()}`,
    status: 'processing',
    createdAt: new Date().toISOString(),
  };
}

export default router;
