/**
 * Authentication Routes
 * Production-grade authentication with JWT and refresh tokens
 */

import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { asyncHandler } from '../middleware/error.middleware.mjs';
import { authMiddleware } from '../middleware/auth.middleware.mjs';
import { getCSRFToken } from '../middleware/csrf.middleware.mjs';

const router = express.Router();

const getPrisma = () => global.prisma;

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  companyName: z.string().optional(),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const REFRESH_COOKIE_NAME = 'refresh_token';

const getRefreshCookieOptions = () => {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieDomain = process.env.COOKIE_DOMAIN;
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    ...(cookieDomain ? { domain: cookieDomain } : {}),
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
};

// Generate JWT tokens
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { 
      userId: user.id, 
      email: user.email, 
      role: user.role,
      tokenVersion: user.tokenVersion || 0,
    },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { 
      userId: user.id, 
      tokenVersion: user.tokenVersion || 0 
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

// Mock user data for development when DB is not available
const mockUsers = [
  {
    id: 'owner-1',
    email: 'ceo@chronaworkflow.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8lZQKjvEy', // demo123
    name: 'SkyLabs Enterprise',
    role: 'OWNER',
    subscriptionPlan: 'ENTERPRISE',
    isActive: true,
    tokenVersion: 0,
  },
  {
    id: 'customer-1',
    email: 'customer@chronaworkflow.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8lZQKjvEy', // demo123
    name: 'Demo Customer',
    role: 'CUSTOMER',
    subscriptionPlan: 'STARTER',
    isActive: true,
    tokenVersion: 0,
  }
];

// POST /api/auth/register
router.post('/register', asyncHandler(async (req, res) => {
  const validatedData = registerSchema.parse(req.body);

  let user;

  const prisma = getPrisma();

  if (prisma) {
    // Database mode
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

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(validatedData.password, saltRounds);

    user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        companyName: validatedData.companyName,
        role: 'OWNER',
        subscriptionPlan: 'STARTER',
        isActive: true,
        tokenVersion: 0,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        subscriptionPlan: true,
        isActive: true,
        createdAt: true,
      },
    });
  } else {
    // Mock mode - check if user exists
    const existingUser = mockUsers.find(u => u.email === validatedData.email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Conflict',
        message: 'User with this email already exists',
      });
    }

    // Create mock user
    user = {
      id: `user-${Date.now()}`,
      name: validatedData.name,
      email: validatedData.email,
      role: 'OWNER',
      subscriptionPlan: 'STARTER',
      isActive: true,
      createdAt: new Date(),
    };

    // Add to mock users
    mockUsers.push({
      ...user,
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8lZQKjvEy', // demo123
      tokenVersion: 0,
    });
  }

  const { accessToken, refreshToken } = generateTokens(user);

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());

  res.status(201).json({
    success: true,
    data: {
      user,
      accessToken,
      refreshToken,
      expiresIn: '15m',
    },
  });
}));

// POST /api/auth/login
router.post('/login', asyncHandler(async (req, res) => {
  const validatedData = loginSchema.parse(req.body);

  let user;

  const prisma = getPrisma();

  if (prisma) {
    // Database mode
    user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
    }

    const isValidPassword = await bcrypt.compare(validatedData.password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const { password, ...userWithoutPassword } = user;
    user = userWithoutPassword;
  } else {
    // Mock mode
    user = mockUsers.find(u => u.email === validatedData.email);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
    }

    // In mock mode, accept any password for simplicity
    // In production, this would validate the hashed password
  }

  const { accessToken, refreshToken } = generateTokens(user);

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());

  res.json({
    success: true,
    data: {
      user,
      accessToken,
      refreshToken,
      expiresIn: '15m',
    },
  });
}));

// POST /api/auth/refresh
router.post('/refresh', asyncHandler(async (req, res) => {
  const candidate = req.body?.refreshToken || req.cookies?.[REFRESH_COOKIE_NAME];
  const validatedData = refreshTokenSchema.parse({ refreshToken: candidate });

  const prisma = getPrisma();

  try {
    const decoded = jwt.verify(validatedData.refreshToken, process.env.JWT_REFRESH_SECRET);

    let user;

    if (prisma) {
      // Database mode
      user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          subscriptionPlan: true,
          isActive: true,
          tokenVersion: true,
        },
      });

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Invalid refresh token',
        });
      }

      if (decoded.tokenVersion !== user.tokenVersion) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Refresh token has been revoked',
        });
      }
    } else {
      // Mock mode
      user = mockUsers.find(u => u.id === decoded.userId);

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Invalid refresh token',
        });
      }
    }

    const { accessToken, refreshToken } = generateTokens(user);

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        expiresIn: '15m',
      },
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid refresh token',
    });
  }
}));

// POST /api/auth/logout
router.post('/logout', asyncHandler(async (req, res) => {
  const candidate = req.body?.refreshToken || req.cookies?.[REFRESH_COOKIE_NAME];
  const validatedData = refreshTokenSchema.parse({ refreshToken: candidate });

  const prisma = getPrisma();

  try {
    const decoded = jwt.verify(validatedData.refreshToken, process.env.JWT_REFRESH_SECRET);

    if (prisma) {
      // Database mode - increment token version
      await prisma.user.update({
        where: { id: decoded.userId },
        data: { tokenVersion: { increment: 1 } },
      });
    }
    // Mock mode - no action needed

    res.clearCookie(REFRESH_COOKIE_NAME, { ...getRefreshCookieOptions(), maxAge: 0 });

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    res.clearCookie(REFRESH_COOKIE_NAME, { ...getRefreshCookieOptions(), maxAge: 0 });

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  }
}));

// GET /api/auth/csrf
router.get('/csrf', authMiddleware, getCSRFToken);

// GET /api/auth/me
router.get('/me', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Access token required',
    });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let user;

    if (prisma) {
      // Database mode
      user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          subscriptionPlan: true,
          isActive: true,
          companyName: true,
          createdAt: true,
          lastLoginAt: true,
        },
      });
    } else {
      // Mock mode
      user = mockUsers.find(u => u.id === decoded.userId);
    }

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid user',
      });
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid access token',
    });
  }
}));

export default router;
