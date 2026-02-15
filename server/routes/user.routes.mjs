/**
 * User Management Routes
 * Production-grade user management with role-based access control
 */

import express from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { asyncHandler } from '../middleware/error.middleware.mjs';
import { requireRole } from '../middleware/auth.middleware.mjs';
import { requireQuota } from '../middleware/entitlements.middleware.mjs';

const router = express.Router();
const getPrisma = () => global.prisma;

// Validation schemas
const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  companyName: z.string().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

const inviteUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['ADMIN', 'ACCOUNTANT', 'MANAGER', 'STAFF', 'VIEWER']),
});

// GET /api/users/profile
router.get('/profile', asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  if (!prisma) {
    res.json({
      success: true,
      data: {
        user: {
          id: req.user.id,
          name: req.user.name || 'Demo User',
          email: req.user.email,
          role: req.user.role,
          subscriptionPlan: req.user.subscriptionPlan || 'ENTERPRISE',
          companyName: req.user.companyName || 'Demo Company',
          isActive: true,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        },
      },
    });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      subscriptionPlan: true,
      companyName: true,
      isActive: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });

  res.json({
    success: true,
    data: { user },
  });
}));

// PUT /api/users/profile
router.put('/profile', asyncHandler(async (req, res) => {
  const validatedData = updateProfileSchema.parse(req.body);

  const prisma = getPrisma();
  if (!prisma) {
    return res.status(503).json({
      success: false,
      error: 'Service Unavailable',
      message: 'Database is not available',
    });
  }
  
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: validatedData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      subscriptionPlan: true,
      companyName: true,
      isActive: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });

  res.json({
    success: true,
    data: { user },
  });
}));

// PUT /api/users/password
router.put('/password', asyncHandler(async (req, res) => {
  const validatedData = changePasswordSchema.parse(req.body);

  const prisma = getPrisma();
  if (!prisma) {
    return res.status(503).json({
      success: false,
      error: 'Service Unavailable',
      message: 'Database is not available',
    });
  }
  
  // Get current user with password
  const currentUser = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { password: true },
  });

  // Verify current password
  const isValidPassword = await bcrypt.compare(validatedData.currentPassword, currentUser.password);
  
  if (!isValidPassword) {
    return res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: 'Current password is incorrect',
    });
  }

  // Hash new password
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(validatedData.newPassword, saltRounds);

  // Update password
  await prisma.user.update({
    where: { id: req.user.id },
    data: { 
      password: hashedPassword,
      tokenVersion: { increment: 1 }, // Invalidate all refresh tokens
    },
  });

  res.json({
    success: true,
    message: 'Password updated successfully',
  });
}));

// GET /api/users/team (Owner/Admin only)
router.get('/team', requireRole(['OWNER', 'ADMIN']), asyncHandler(async (req, res) => {
  const prisma = getPrisma();
  if (!prisma) {
    return res.status(503).json({
      success: false,
      error: 'Service Unavailable',
      message: 'Database is not available',
    });
  }
  const team = await prisma.user.findMany({
    where: { 
      // For non-owners, only show users from their organization
      ...(req.user.role !== 'OWNER' && { companyId: req.user.companyId })
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      lastLoginAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    success: true,
    data: { team },
  });
}));

// POST /api/users/invite (Owner/Admin only)
router.post('/invite', requireRole(['OWNER', 'ADMIN']), requireQuota({ type: 'users' }), asyncHandler(async (req, res) => {
  const validatedData = inviteUserSchema.parse(req.body);
  const prisma = getPrisma();

  if (!prisma) {
    return res.status(503).json({
      success: false,
      error: 'Service Unavailable',
      message: 'Database is not available',
    });
  }
  
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: validatedData.email },
  });

  if (existingUser) {
    return res.status(409).json({
      success: false,
      error: 'Conflict',
      message: 'User with this email already exists',
    });
  }

  // Generate temporary password
  const tempPassword = Math.random().toString(36).slice(-8);
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(tempPassword, saltRounds);

  // Create invited user
  const user = await prisma.user.create({
    data: {
      name: validatedData.name,
      email: validatedData.email,
      password: hashedPassword,
      role: validatedData.role,
      subscriptionPlan: req.user.subscriptionPlan, // Inherit plan from inviter
      isActive: true,
      companyId: req.user.companyId || req.user.id, // Set company relationship
      tokenVersion: 0,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  // In production, send email with temp password
  console.log(`📧 Invitation sent to ${validatedData.email} with temp password: ${tempPassword}`);

  res.status(201).json({
    success: true,
    data: { user },
    message: 'User invited successfully',
  });
}));

// PUT /api/users/:userId/deactivate (Owner/Admin only)
router.put('/:userId/deactivate', requireRole(['OWNER', 'ADMIN']), asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const prisma = getPrisma();
  if (!prisma) {
    return res.status(503).json({
      success: false,
      error: 'Service Unavailable',
      message: 'Database is not available',
    });
  }
  
  // Prevent deactivating yourself
  if (userId === req.user.id) {
    return res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: 'You cannot deactivate yourself',
    });
  }

  // Prevent deactivating owners (unless you're the owner)
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (targetUser.role === 'OWNER' && req.user.role !== 'OWNER') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Only owners can deactivate other owners',
    });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { 
      isActive: false,
      tokenVersion: { increment: 1 }, // Invalidate all refresh tokens
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  res.json({
    success: true,
    data: { user },
    message: 'User deactivated successfully',
  });
}));

// PUT /api/users/:userId/activate (Owner/Admin only)
router.put('/:userId/activate', requireRole(['OWNER', 'ADMIN']), asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  const user = await prisma.user.update({
    where: { id: userId },
    data: { isActive: true },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  res.json({
    success: true,
    data: { user },
    message: 'User activated successfully',
  });
}));

export default router;
