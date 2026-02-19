import { prisma } from '../utils/prisma.js';
import logger from '../config/logger.js';

export const enforceTenancy = async (req: any, res: any, next: any) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    const companyId = req.params.companyId || req.body.companyId || req.query.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company context is required.',
      });
    }

    // In the new schema, we verify company membership
    const membership = await prisma.company_members.findFirst({
      where: {
        companyId: companyId,
        userId: req.user.id,
        isActive: true,
      },
    });

    if (!membership && req.user.role !== 'FOUNDER' && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have access to this company.',
      });
    }

    // Verify company exists and is active
    const company = await prisma.companies.findFirst({
      where: {
        id: companyId,
        isActive: true,
      },
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found or inactive.',
      });
    }

    req.tenantId = companyId; // Keeping the property name for compatibility if needed
    next();
  } catch (error: any) {
    logger.error('Tenancy enforcement error', { error: (error as Error).message });
    return res.status(500).json({
      success: false,
      message: 'Failed to verify tenant access.',
      error: error.message,
    });
  }
};

export const injectCompanyContext = (req: any, res: any, next: any) => {
  if (req.user && req.user.currentCompanyId) {
    req.companyId = req.user.currentCompanyId;
  }
  next();
};

export const validateCompanyOwnership = async (req: any, res: any, next: any) => {
  try {
    const companyId = req.params.companyId || req.body.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required.',
      });
    }

    // Role-based check against user object instead of membership table
    if (req.user.role !== 'OWNER' && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only company owners or admins can perform this action.',
      });
    }

    next();
  } catch (error: any) {
    logger.error('Ownership validation error', { error: (error as Error).message });
    return res.status(500).json({
      success: false,
      message: 'Failed to validate ownership.',
      error: error.message,
    });
  }
};

export const scopeQueryToTenant = (prismaQuery: any, tenantId: any) => {
  return {
    ...prismaQuery,
    where: {
      ...prismaQuery.where,
      companyId: tenantId,
      isActive: true,
    },
  };
};
