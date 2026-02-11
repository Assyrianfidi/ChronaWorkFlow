import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const enforceTenancy = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (req.user.role === 'OWNER' || req.user.role === 'FOUNDER') {
      return next();
    }

    const companyId = req.params.companyId || req.body.companyId || req.query.companyId || req.user.currentCompanyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company context is required.',
      });
    }

    const membership = await prisma.companyMember.findFirst({
      where: {
        userId: req.user.id,
        companyId,
      },
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not belong to this company.',
      });
    }

    req.tenantId = companyId;
    req.tenantRole = membership.role;
    next();
  } catch (error) {
    console.error('Tenancy enforcement error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify tenant access.',
      error: error.message,
    });
  }
};

export const injectCompanyContext = (req, res, next) => {
  if (req.user && req.user.currentCompanyId) {
    req.companyId = req.user.currentCompanyId;
  }
  next();
};

export const validateCompanyOwnership = async (req, res, next) => {
  try {
    const companyId = req.params.companyId || req.body.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required.',
      });
    }

    const membership = await prisma.companyMember.findFirst({
      where: {
        userId: req.user.id,
        companyId,
        role: 'OWNER',
      },
    });

    if (!membership && req.user.role !== 'OWNER' && req.user.role !== 'FOUNDER') {
      return res.status(403).json({
        success: false,
        message: 'Only company owners can perform this action.',
      });
    }

    next();
  } catch (error) {
    console.error('Ownership validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to validate ownership.',
      error: error.message,
    });
  }
};

export const scopeQueryToTenant = (prismaQuery, tenantId) => {
  return {
    ...prismaQuery,
    where: {
      ...prismaQuery.where,
      companyId: tenantId,
    },
  };
};
