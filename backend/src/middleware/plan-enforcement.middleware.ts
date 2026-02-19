import { prisma } from '../utils/prisma.js';
import logger from '../config/logger.js';

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

export const enforcePlanLimits = async (req: any, res: any, next: any) => {
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

    if (billingStatus.billingStatus === 'TRIAL') {
      return next();
    }

    if (!['ACTIVE', 'TRIAL'].includes(billingStatus.billingStatus)) {
      return res.status(402).json({
        success: false,
        message: 'Subscription inactive. Please update your billing information.',
        code: 'SUBSCRIPTION_INACTIVE',
        status: billingStatus.billingStatus,
      });
    }

    const planType = billingStatus.planType?.toUpperCase() || 'STARTER';
    const plan = PLANS[planType as keyof typeof PLANS];
    if (!plan) {
      return next();
    }

    if (req.path.includes('/users') && req.method === 'POST') {
      const userCount = await prisma.company_members.count({
        where: { companyId: req.user.currentCompanyId, isActive: true },
      });

      if (plan.maxUsers !== -1 && userCount >= plan.maxUsers) {
        return res.status(402).json({
          success: false,
          message: `User limit reached. Your ${planType} plan allows ${plan.maxUsers} users. Please upgrade to add more.`,
          code: 'USER_LIMIT_REACHED',
          limit: plan.maxUsers,
          current: userCount,
          plan: planType,
        });
      }
    }

    if (req.path.includes('/companies') && req.method === 'POST') {
      const companyCount = await prisma.company_members.count({
        where: { userId: req.user.id, isActive: true },
      });

      if (plan.maxCompanies !== -1 && companyCount >= plan.maxCompanies) {
        return res.status(402).json({
          success: false,
          message: `Company limit reached. Your ${planType} plan allows ${plan.maxCompanies} companies. Please upgrade to add more.`,
          code: 'COMPANY_LIMIT_REACHED',
          limit: plan.maxCompanies,
          current: companyCount,
          plan: planType,
        });
      }
    }

    next();
  } catch (error: any) {
    logger.error('Plan enforcement error', { error: (error as Error).message });
    next();
  }
};

export default enforcePlanLimits;
