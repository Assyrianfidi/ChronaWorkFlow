import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-change-in-production';

export const generateAccessToken = (userId, email, role) => {
  return jwt.sign(
    { userId, email, role },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
};

export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    return null;
  }
};

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please provide a valid token.',
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please login again.',
      });
    }

    const user = await prisma.users.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        currentCompanyId: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact support.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed.',
      error: error.message,
    });
  }
};

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions. Access denied.',
        requiredRoles: allowedRoles,
        userRole: req.user.role,
      });
    }

    next();
  };
};

export const requireCompanyAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    const companyId = req.params.companyId || req.body.companyId || req.user.currentCompanyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID is required.',
      });
    }

    if (req.user.role === 'OWNER' || req.user.role === 'FOUNDER') {
      req.companyId = companyId;
      return next();
    }

    const membership = await prisma.company_members.findFirst({
      where: {
        userId: req.user.id,
        companyId: companyId,
      },
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this company.',
      });
    }

    req.companyId = companyId;
    req.companyRole = membership.role;
    next();
  } catch (error) {
    console.error('Company access check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify company access.',
      error: error.message,
    });
  }
};

export const logActivity = async (req, res, next) => {
  try {
    if (req.user) {
      await prisma.audit_logs.create({
        data: {
          userId: req.user.id,
          action: `${req.method} ${req.path}`,
          details: JSON.stringify({
            method: req.method,
            path: req.path,
            query: req.query,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
          }),
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });
    }
    next();
  } catch (error) {
    console.error('Activity logging error:', error);
    next();
  }
};
