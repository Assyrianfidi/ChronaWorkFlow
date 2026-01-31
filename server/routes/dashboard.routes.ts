/**
 * Dashboard Composition API Routes
 * 
 * Handles dashboard layout persistence and retrieval
 */

import { Router } from 'express';
import { requireAuth, AuthenticatedRequest } from '../auth/rbac/middleware';
import { PrismaClient } from '../../generated/prisma';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/dashboard/layout
 * 
 * Get user's dashboard layout with fallback to role default
 */
router.get('/layout', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id: userId, role, tenantId } = req.user!;

    // Try to find user-specific layout
    let layout = await prisma.dashboardLayout.findUnique({
      where: {
        userId_tenantId: {
          userId,
          tenantId,
        },
      },
    });

    // Fallback to role default layout
    if (!layout) {
      layout = await prisma.dashboardLayout.findFirst({
        where: {
          role,
          tenantId,
          isDefault: true,
        },
      });
    }

    // Fallback to system default if no role default exists
    if (!layout) {
      layout = {
        id: 'default',
        userId: null,
        role: null,
        tenantId,
        name: 'Default Dashboard',
        isDefault: true,
        layout: getDefaultLayout(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    res.json({
      success: true,
      data: layout,
    });
  } catch (error) {
    console.error('[ERROR] Failed to fetch dashboard layout:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch dashboard layout',
    });
  }
});

/**
 * POST /api/dashboard/layout
 * 
 * Save user's dashboard layout
 */
router.post('/layout', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id: userId, tenantId } = req.user!;
    const { layout, name } = req.body;

    if (!layout) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Layout is required',
      });
      return;
    }

    // Validate layout structure
    if (!layout.desktop || !Array.isArray(layout.desktop)) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid layout structure',
      });
      return;
    }

    // Upsert user layout
    const savedLayout = await prisma.dashboardLayout.upsert({
      where: {
        userId_tenantId: {
          userId,
          tenantId,
        },
      },
      update: {
        layout,
        name: name || 'My Dashboard',
        updatedAt: new Date(),
      },
      create: {
        userId,
        tenantId,
        name: name || 'My Dashboard',
        layout,
        isDefault: false,
      },
    });

    res.json({
      success: true,
      data: {
        id: savedLayout.id,
        message: 'Dashboard layout saved successfully',
      },
    });
  } catch (error) {
    console.error('[ERROR] Failed to save dashboard layout:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to save dashboard layout',
    });
  }
});

/**
 * GET /api/dashboard/widgets
 * 
 * Get available widgets for current user (filtered by permissions and feature flags)
 */
router.get('/widgets', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { role, tenantId } = req.user!;

    // Load tenant feature flags
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { featureFlags: true, plan: true },
    });

    const featureFlags = (tenant?.featureFlags as Record<string, boolean>) || {};
    const plan = tenant?.plan || 'FREE';

    // Get available widgets based on role and feature flags
    const widgets = getAvailableWidgets(role, featureFlags, plan);

    res.json({
      success: true,
      data: widgets,
    });
  } catch (error) {
    console.error('[ERROR] Failed to fetch available widgets:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch available widgets',
    });
  }
});

/**
 * Default dashboard layout
 */
function getDefaultLayout() {
  return {
    desktop: [
      { widgetId: 'profit-loss', x: 0, y: 0, w: 6, h: 4 },
      { widgetId: 'cash-flow', x: 6, y: 0, w: 6, h: 4 },
      { widgetId: 'bank-accounts', x: 0, y: 4, w: 6, h: 4 },
      { widgetId: 'invoices', x: 6, y: 4, w: 6, h: 4 },
    ],
    tablet: [
      { widgetId: 'profit-loss', x: 0, y: 0, w: 6, h: 4 },
      { widgetId: 'cash-flow', x: 0, y: 4, w: 6, h: 4 },
      { widgetId: 'bank-accounts', x: 0, y: 8, w: 6, h: 4 },
      { widgetId: 'invoices', x: 0, y: 12, w: 6, h: 4 },
    ],
    mobile: [
      { widgetId: 'profit-loss', x: 0, y: 0, w: 4, h: 4 },
      { widgetId: 'cash-flow', x: 0, y: 4, w: 4, h: 4 },
      { widgetId: 'bank-accounts', x: 0, y: 8, w: 4, h: 4 },
      { widgetId: 'invoices', x: 0, y: 12, w: 4, h: 4 },
    ],
  };
}

/**
 * Get available widgets based on role, feature flags, and plan
 */
function getAvailableWidgets(
  role: string,
  featureFlags: Record<string, boolean>,
  plan: string
) {
  const allWidgets = [
    {
      id: 'profit-loss',
      name: 'Profit & Loss',
      description: 'View revenue, expenses, and net profit',
      category: 'FINANCIAL',
      icon: 'TrendingUp',
      defaultSize: { w: 6, h: 4 },
      minSize: { w: 4, h: 3 },
      requiredRoles: ['OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT', 'AUDITOR'],
      featureFlag: 'PROFIT_LOSS_WIDGET',
    },
    {
      id: 'cash-flow',
      name: 'Cash Flow',
      description: 'Visualize inflow and outflow trends',
      category: 'FINANCIAL',
      icon: 'BarChart',
      defaultSize: { w: 12, h: 6 },
      minSize: { w: 6, h: 4 },
      requiredRoles: ['OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT', 'AUDITOR'],
      featureFlag: 'FINANCIAL_DASHBOARD_CHARTS',
    },
    {
      id: 'bank-accounts',
      name: 'Bank Accounts',
      description: 'Monitor account balances and transactions',
      category: 'FINANCIAL',
      icon: 'Landmark',
      defaultSize: { w: 6, h: 4 },
      minSize: { w: 4, h: 3 },
      requiredRoles: ['OWNER', 'ADMIN', 'MANAGER'],
      featureFlag: 'BANK_ACCOUNTS_WIDGET',
    },
    {
      id: 'invoices',
      name: 'Invoices',
      description: 'Track invoice status and payments',
      category: 'OPERATIONS',
      icon: 'FileText',
      defaultSize: { w: 6, h: 4 },
      minSize: { w: 4, h: 3 },
      requiredRoles: ['OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT'],
      featureFlag: 'INVOICES_WIDGET',
    },
    {
      id: 'top-expenses',
      name: 'Top Expenses',
      description: 'View highest expense categories',
      category: 'ANALYTICS',
      icon: 'PieChart',
      defaultSize: { w: 6, h: 4 },
      minSize: { w: 4, h: 3 },
      requiredRoles: ['OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT', 'AUDITOR'],
      featureFlag: 'FINANCIAL_DASHBOARD_CHARTS',
    },
    {
      id: 'inventory',
      name: 'Inventory Overview',
      description: 'Monitor stock levels and alerts',
      category: 'OPERATIONS',
      icon: 'Package',
      defaultSize: { w: 6, h: 4 },
      minSize: { w: 4, h: 3 },
      requiredRoles: ['OWNER', 'ADMIN', 'INVENTORY_MANAGER'],
      featureFlag: 'INVENTORY_WIDGET',
      requiredPlan: ['PROFESSIONAL', 'ENTERPRISE'],
    },
  ];

  return allWidgets.filter((widget) => {
    // Check role permission
    if (!widget.requiredRoles.includes(role)) {
      return false;
    }

    // Check feature flag
    if (widget.featureFlag && !featureFlags[widget.featureFlag]) {
      return false;
    }

    // Check plan requirement
    if (widget.requiredPlan && !widget.requiredPlan.includes(plan)) {
      return false;
    }

    return true;
  });
}

export default router;
