import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PLANS = {
  STARTER: {
    maxUsers: 3,
    maxCompanies: 1,
  },
  PRO: {
    maxUsers: 10,
    maxCompanies: 5,
  },
  ENTERPRISE: {
    maxUsers: -1,
    maxCompanies: -1,
  },
};

export const enforcePlanLimits = async (req, res, next) => {
  try {
    if (!req.user?.currentCompanyId) {
      return next();
    }

    const billingStatus = await prisma.billing_status.findUnique({
      where: { companyId: req.user.currentCompanyId },
    });

    if (!billingStatus) {
      return res.status(402).json({
        success: false,
        message: 'No subscription found. Please subscribe to continue.',
        code: 'NO_SUBSCRIPTION',
      });
    }

    if (billingStatus.subscriptionStatus === 'TRIALING') {
      return next();
    }

    if (!['ACTIVE', 'TRIALING'].includes(billingStatus.subscriptionStatus)) {
      return res.status(402).json({
        success: false,
        message: 'Subscription inactive. Please update your billing information.',
        code: 'SUBSCRIPTION_INACTIVE',
        status: billingStatus.subscriptionStatus,
      });
    }

    const plan = PLANS[billingStatus.subscriptionPlan];
    if (!plan) {
      return next();
    }

    if (req.path.includes('/users') && req.method === 'POST') {
      const userCount = await prisma.company_members.count({
        where: { companyId: req.user.currentCompanyId },
      });

      if (plan.maxUsers !== -1 && userCount >= plan.maxUsers) {
        return res.status(402).json({
          success: false,
          message: `User limit reached. Your ${billingStatus.subscriptionPlan} plan allows ${plan.maxUsers} users. Please upgrade to add more.`,
          code: 'USER_LIMIT_REACHED',
          limit: plan.maxUsers,
          current: userCount,
          plan: billingStatus.subscriptionPlan,
        });
      }
    }

    if (req.path.includes('/companies') && req.method === 'POST') {
      const companyCount = await prisma.company_members.count({
        where: { userId: req.user.id },
        distinct: ['companyId'],
      });

      if (plan.maxCompanies !== -1 && companyCount >= plan.maxCompanies) {
        return res.status(402).json({
          success: false,
          message: `Company limit reached. Your ${billingStatus.subscriptionPlan} plan allows ${plan.maxCompanies} companies. Please upgrade to add more.`,
          code: 'COMPANY_LIMIT_REACHED',
          limit: plan.maxCompanies,
          current: companyCount,
          plan: billingStatus.subscriptionPlan,
        });
      }
    }

    next();
  } catch (error) {
    console.error('Plan enforcement error:', error);
    next();
  }
};

export default enforcePlanLimits;
