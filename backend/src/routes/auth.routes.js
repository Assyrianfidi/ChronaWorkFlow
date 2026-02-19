import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyRefreshToken,
  authenticate 
} from '../middleware/auth.middleware.js';
import logger from '../config/logger.js';

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, companyName } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and name are required.',
      });
    }

    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.users.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: companyName ? 'OWNER' : 'USER',
      },
    });

    let company = null;
    if (companyName) {
      company = await prisma.company.create({
        data: {
          name: companyName,
          members: {
            create: {
              userId: user.id,
              role: 'OWNER',
            },
          },
        },
      });

      await prisma.users.update({
        where: { id: user.id },
        data: { currentCompanyId: company.id },
      });
    }

    await prisma.audit_logs.create({
      data: {
        userId: user.id,
        action: 'USER_REGISTERED',
        details: JSON.stringify({ email, companyName }),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    const accessToken = generateAccessToken(user.id, user.email, user.role);
    const refreshToken = generateRefreshToken(user.id);

    await prisma.users.sessions.create({
      data: {
        userId: user.id,
        sessionToken: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        company,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed.',
      error: error.message,
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const user = await prisma.users.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      await prisma.suspicious_activities.create({
        data: {
          userId: user?.id,
          activityType: 'MULTIPLE_FAILED_LOGINS',
          description: `Failed login attempt for email: ${email}`,
          detectedAt: new Date(),
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      }).catch(() => {});

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      await prisma.suspicious_activities.create({
        data: {
          userId: user.id,
          activityType: 'MULTIPLE_FAILED_LOGINS',
          description: `Failed login attempt for user: ${user.email}`,
          detectedAt: new Date(),
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact support.',
      });
    }

    await prisma.users.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    await prisma.audit_logs.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN',
        details: JSON.stringify({ email }),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    const accessToken = generateAccessToken(user.id, user.email, user.role);
    const refreshToken = generateRefreshToken(user.id);

    await prisma.users.sessions.create({
      data: {
        userId: user.id,
        sessionToken: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          currentCompanyId: user.currentCompanyId,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed.',
      error: error.message,
    });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required.',
      });
    }

    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token.',
      });
    }

    const session = await prisma.users.sessions.findFirst({
      where: {
        userId: decoded.userId,
        sessionToken: refreshToken,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Session not found or expired.',
      });
    }

    const user = await prisma.users.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive.',
      });
    }

    const newAccessToken = generateAccessToken(user.id, user.email, user.role);

    res.json({
      success: true,
      message: 'Token refreshed successfully.',
      data: {
        accessToken: newAccessToken,
      },
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Token refresh failed.',
      error: error.message,
    });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req, res) => {
  try {
    // Delete ALL sessions for this user for security
    await prisma.users.sessions.deleteMany({
      where: {
        userId: req.user.id,
      },
    });

    await prisma.audit_logs.create({
      data: {
        userId: req.user.id,
        action: 'USER_LOGOUT',
        details: JSON.stringify({ email: req.user.email }),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    logger.info('User logged out', { userId: req.user.id, email: req.user.email });

    res.json({
      success: true,
      message: 'Logout successful. All sessions terminated.',
    });
  } catch (error) {
    logger.error('Logout error', { error: error.message, userId: req.user?.id });
    res.status(500).json({
      success: false,
      message: 'Logout failed.',
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
    });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required.',
      });
    }

    const user = await prisma.users.findUnique({
      where: { email },
    });

    if (!user) {
      return res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent.',
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    await prisma.users.update({
      where: { id: user.id },
      data: {
        password: hashedToken,
      },
    });

    await prisma.audit_logs.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_RESET_REQUESTED',
        details: JSON.stringify({ email }),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    console.log(`Password reset token for ${email}: ${resetToken}`);

    res.json({
      success: true,
      message: 'If the email exists, a password reset link has been sent.',
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Password reset request failed.',
      error: error.message,
    });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required.',
      });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await prisma.users.findFirst({
      where: {
        password: hashedToken,
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token.',
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.users.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
      },
    });

    await prisma.users.sessions.deleteMany({
      where: { userId: user.id },
    });

    await prisma.audit_logs.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_RESET_COMPLETED',
        details: JSON.stringify({ email: user.email }),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    res.json({
      success: true,
      message: 'Password reset successful. Please login with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Password reset failed.',
      error: error.message,
    });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        currentCompanyId: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user information.',
      error: error.message,
    });
  }
});

export default router;
