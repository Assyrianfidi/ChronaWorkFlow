import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();
const prisma = new PrismaClient();

// All admin routes require OWNER or FOUNDER role
router.use(authenticate);
router.use(authorize('OWNER', 'FOUNDER'));

// GET /api/admin/global-stats
router.get('/global-stats', async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalCompanies,
      activeCompanies,
      totalTransactions,
      totalInvoices,
      subscriptionStats,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.company.count(),
      prisma.company.count({ where: { isActive: true } }),
      prisma.transaction.count(),
      prisma.invoice.count(),
      prisma.billing_status.groupBy({
        by: ['subscriptionPlan', 'subscriptionStatus'],
        _count: true,
      }),
    ]);

    const userGrowth = await prisma.user.groupBy({
      by: ['createdAt'],
      _count: true,
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    const companyGrowth = await prisma.company.groupBy({
      by: ['createdAt'],
      _count: true,
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers,
          growth: userGrowth,
        },
        companies: {
          total: totalCompanies,
          active: activeCompanies,
          inactive: totalCompanies - activeCompanies,
          growth: companyGrowth,
        },
        transactions: {
          total: totalTransactions,
        },
        invoices: {
          total: totalInvoices,
        },
        subscriptions: subscriptionStats,
      },
    });
  } catch (error) {
    console.error('Global stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch global statistics.',
      error: error.message,
    });
  }
});

// GET /api/admin/revenue-metrics
router.get('/revenue-metrics', async (req, res) => {
  try {
    const billingStatuses = await prisma.billing_status.findMany({
      where: {
        subscriptionStatus: { in: ['ACTIVE', 'TRIALING'] },
      },
      select: {
        subscriptionPlan: true,
        subscriptionStatus: true,
        lastPaymentAmount: true,
        lastPaymentDate: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
      },
    });

    const PLAN_PRICES = {
      STARTER: 29,
      PRO: 79,
      ENTERPRISE: 199,
    };

    let mrr = 0;
    const revenueByPlan = {
      STARTER: { count: 0, revenue: 0 },
      PRO: { count: 0, revenue: 0 },
      ENTERPRISE: { count: 0, revenue: 0 },
    };

    billingStatuses.forEach((status) => {
      const plan = status.subscriptionPlan;
      const price = PLAN_PRICES[plan] || 0;
      
      if (status.subscriptionStatus === 'ACTIVE') {
        mrr += price;
        revenueByPlan[plan].count += 1;
        revenueByPlan[plan].revenue += price;
      }
    });

    const arr = mrr * 12;

    const totalRevenue = await prisma.billing_status.aggregate({
      _sum: { lastPaymentAmount: true },
      where: {
        lastPaymentDate: { not: null },
      },
    });

    const churnedCompanies = await prisma.billing_status.count({
      where: {
        subscriptionStatus: 'CANCELLED',
        cancelledAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    });

    const activeSubscriptions = await prisma.billing_status.count({
      where: {
        subscriptionStatus: { in: ['ACTIVE', 'TRIALING'] },
      },
    });

    const churnRate = activeSubscriptions > 0 
      ? ((churnedCompanies / (activeSubscriptions + churnedCompanies)) * 100).toFixed(2)
      : 0;

    res.json({
      success: true,
      data: {
        mrr,
        arr,
        totalRevenue: totalRevenue._sum.lastPaymentAmount || 0,
        activeSubscriptions,
        churnedLast30Days: churnedCompanies,
        churnRate: parseFloat(churnRate),
        revenueByPlan,
      },
    });
  } catch (error) {
    console.error('Revenue metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue metrics.',
      error: error.message,
    });
  }
});

// GET /api/admin/system-health
router.get('/system-health', async (req, res) => {
  try {
    const [
      databaseStatus,
      recentErrors,
      suspiciousActivities,
      activeSessionsCount,
      apiUsageToday,
    ] = await Promise.all([
      prisma.$queryRaw`SELECT 1 as status`.then(() => 'healthy').catch(() => 'unhealthy'),
      prisma.auditLog.count({
        where: {
          action: { contains: 'ERROR' },
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.suspicious_activities.count({
        where: {
          detectedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.user_sessions.count({
        where: {
          expiresAt: { gt: new Date() },
        },
      }),
      prisma.api_usage_records.count({
        where: {
          timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }).catch(() => 0),
    ]);

    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    res.json({
      success: true,
      data: {
        database: databaseStatus,
        server: {
          uptime: Math.floor(uptime),
          memoryUsage: {
            heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
            heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
            external: Math.round(memoryUsage.external / 1024 / 1024),
          },
        },
        metrics: {
          recentErrors: recentErrors,
          suspiciousActivities: suspiciousActivities,
          activeSessions: activeSessionsCount,
          apiCallsToday: apiUsageToday,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('System health error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system health.',
      error: error.message,
    });
  }
});

// GET /api/admin/audit-trail
router.get('/audit-trail', async (req, res) => {
  try {
    const { page = 1, limit = 50, userId, action, startDate, endDate } = req.query;
    
    const where = {};
    if (userId) where.userId = parseInt(userId);
    if (action) where.action = { contains: action };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Audit trail error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit trail.',
      error: error.message,
    });
  }
});

// GET /api/admin/feature-usage
router.get('/feature-usage', async (req, res) => {
  try {
    const featureUsage = await prisma.feature_usage.groupBy({
      by: ['featureName'],
      _count: true,
      _sum: { usageCount: true },
      orderBy: { _sum: { usageCount: 'desc' } },
      take: 20,
    });

    const usageByCompany = await prisma.feature_usage.groupBy({
      by: ['companyId'],
      _sum: { usageCount: true },
      orderBy: { _sum: { usageCount: 'desc' } },
      take: 10,
    });

    res.json({
      success: true,
      data: {
        topFeatures: featureUsage.map(f => ({
          feature: f.featureName,
          totalUses: f._sum.usageCount,
          uniqueUsers: f._count,
        })),
        topCompanies: usageByCompany.map(c => ({
          companyId: c.companyId,
          totalUsage: c._sum.usageCount,
        })),
      },
    });
  } catch (error) {
    console.error('Feature usage error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feature usage.',
      error: error.message,
    });
  }
});

// GET /api/admin/companies
router.get('/companies', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    
    const where = search ? {
      name: { contains: search, mode: 'insensitive' },
    } : {};

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        include: {
          billing_status: true,
          _count: {
            select: {
              members: true,
              transactions: true,
              invoices: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.company.count({ where }),
    ]);

    res.json({
      success: true,
      data: companies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch companies.',
      error: error.message,
    });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    
    const where = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role) where.role = role;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          _count: {
            select: {
              companies: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users.',
      error: error.message,
    });
  }
});

// POST /api/admin/impersonate
router.post('/impersonate', async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    await prisma.founder_audit_logs.create({
      data: {
        founderId: req.user.id,
        action: 'IMPERSONATE_USER',
        targetUserId: userId,
        details: JSON.stringify({ targetEmail: user.email }),
      },
    });

    res.json({
      success: true,
      message: 'Impersonation logged. Implement token generation as needed.',
      data: {
        userId: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Impersonate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to impersonate user.',
      error: error.message,
    });
  }
});

export default router;
