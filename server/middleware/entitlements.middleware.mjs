import { asyncHandler } from './error.middleware.mjs';

const getPrisma = () => global.prisma;

const getPlanTier = (req) => {
  return req.user?.company?.subscriptionPlan || req.user?.subscriptionPlan || 'STARTER';
};

const PLAN_LIMITS = {
  STARTER: {
    users: 3,
    transactionsPerMonth: 1000,
    invoicesPerMonth: 50,
  },
  GROWTH: {
    users: Number.POSITIVE_INFINITY,
    transactionsPerMonth: 10000,
    invoicesPerMonth: 500,
  },
  ENTERPRISE: {
    users: Number.POSITIVE_INFINITY,
    transactionsPerMonth: Number.POSITIVE_INFINITY,
    invoicesPerMonth: Number.POSITIVE_INFINITY,
  },
};

const getMonthWindow = (now = new Date()) => {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start, end };
};

const quotaError = (res, message) => {
  return res.status(402).json({
    success: false,
    error: 'Payment Required',
    message,
  });
};

export const requireQuota = ({ type }) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    const prisma = getPrisma();
    if (!prisma) {
      return next();
    }

    const companyId = req.user.companyId || req.user.id;
    const planTier = getPlanTier(req);
    const limits = PLAN_LIMITS[planTier] || PLAN_LIMITS.STARTER;

    if (type === 'users') {
      if (!Number.isFinite(limits.users)) {
        return next();
      }

      const activeUsers = await prisma.user.count({
        where: {
          companyId,
          isActive: true,
        },
      });

      if (activeUsers + 1 > limits.users) {
        return quotaError(res, `User limit exceeded for ${planTier} plan (${limits.users} max). Upgrade to add more users.`);
      }

      return next();
    }

    const { start, end } = getMonthWindow();

    if (type === 'transactions') {
      if (!Number.isFinite(limits.transactionsPerMonth)) {
        return next();
      }

      const used = await prisma.transaction.count({
        where: {
          companyId,
          date: { gte: start, lt: end },
        },
      });

      if (used + 1 > limits.transactionsPerMonth) {
        return quotaError(
          res,
          `Monthly transaction limit exceeded for ${planTier} plan (${limits.transactionsPerMonth}/month). Upgrade to continue creating transactions.`
        );
      }

      return next();
    }

    if (type === 'invoices') {
      if (!Number.isFinite(limits.invoicesPerMonth)) {
        return next();
      }

      const used = await prisma.invoice.count({
        where: {
          companyId,
          issueDate: { gte: start, lt: end },
        },
      });

      if (used + 1 > limits.invoicesPerMonth) {
        return quotaError(
          res,
          `Monthly invoice limit exceeded for ${planTier} plan (${limits.invoicesPerMonth}/month). Upgrade to continue creating invoices.`
        );
      }

      return next();
    }

    return next();
  });
};
