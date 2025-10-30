import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '../db';
import { tenants, users, subscriptions } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { sendEmail } from '../services/email';
import { stripeService } from '../integrations/stripe';
import { logger } from '../utils/logger';
import { cacheService } from '../services/cache';

// Validation schemas
const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  companyName: z.string().min(1),
  companySlug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms of service'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  rememberMe: z.boolean().optional(),
});

const verifyEmailSchema = z.object({
  token: z.string(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
});

// Types
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    role: string;
    email: string;
  };
}

// Auth middleware
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
}

// Admin middleware
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: any) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// Public signup endpoint
export async function signup(req: Request, res: Response) {
  try {
    const validatedData = signupSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.email))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Check if company slug is available
    const existingTenant = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, validatedData.companySlug))
      .limit(1);

    if (existingTenant.length > 0) {
      return res.status(409).json({ error: 'Company URL already taken' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validatedData.password, 12);

    // Create tenant and user
    const tenantResult = await db.insert(tenants).values({
      name: validatedData.companyName,
      slug: validatedData.companySlug,
      subscriptionTier: 'free',
      subscriptionStatus: 'trial',
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    }).returning();

    const tenantId = tenantResult[0].id;

    // Create Stripe customer
    const stripeCustomer = await stripeService.createCustomer({
      email: validatedData.email,
      name: `${validatedData.firstName} ${validatedData.lastName}`,
      metadata: {
        tenant_id: tenantId,
        company_slug: validatedData.companySlug,
      },
    });

    // Update tenant with Stripe customer ID
    await db
      .update(tenants)
      .set({ stripeCustomerId: stripeCustomer.id })
      .where(eq(tenants.id, tenantId));

    // Create user
    const userResult = await db.insert(users).values({
      tenantId,
      email: validatedData.email,
      passwordHash,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      role: 'admin',
      emailVerified: false,
      emailVerificationToken: crypto.randomUUID(),
    }).returning();

    const userId = userResult[0].id;

    // Create subscription record
    await db.insert(subscriptions).values({
      tenantId,
      stripeCustomerId: stripeCustomer.id,
      status: 'trialing',
      trialStart: new Date(),
      trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    });

    // Send welcome email
    await sendEmail({
      to: validatedData.email,
      template: 'welcome',
      data: {
        firstName: validatedData.firstName,
        companyName: validatedData.companyName,
        loginUrl: `${process.env.FRONTEND_URL}/login`,
        verifyEmailUrl: `${process.env.FRONTEND_URL}/verify-email?token=${userResult[0].emailVerificationToken}`,
      },
    });

    // Log signup event
    logger.info('New user signed up', {
      userId,
      tenantId,
      email: validatedData.email,
      companySlug: validatedData.companySlug,
    });

    res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: userId,
        email: validatedData.email,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
      },
      tenant: {
        id: tenantId,
        name: validatedData.companyName,
        slug: validatedData.companySlug,
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }

    logger.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Login endpoint
export async function login(req: Request, res: Response) {
  try {
    const validatedData = loginSchema.parse(req.body);

    // Find user
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.email))
      .limit(1);

    if (user.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const userData = user[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(validatedData.password, userData.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is active
    if (!userData.isActive) {
      return res.status(401).json({ error: 'Account is disabled' });
    }

    // Update last login
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, userData.id));

    // Generate JWT token
    const token = jwt.sign(
      {
        id: userData.id,
        tenantId: userData.tenantId,
        role: userData.role,
        email: userData.email,
      },
      process.env.JWT_SECRET!,
      { expiresIn: validatedData.rememberMe ? '30d' : '7d' }
    );

    // Log login event
    logger.info('User logged in', {
      userId: userData.id,
      tenantId: userData.tenantId,
      email: userData.email,
    });

    res.json({
      token,
      user: {
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        emailVerified: userData.emailVerified,
      },
      tenant: {
        id: userData.tenantId,
        name: userData.tenantId, // This should be fetched from tenants table
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }

    logger.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Email verification
export async function verifyEmail(req: Request, res: Response) {
  try {
    const { token } = verifyEmailSchema.parse(req.body);

    // Find user with token
    const user = await db
      .select()
      .from(users)
      .where(eq(users.emailVerificationToken, token))
      .limit(1);

    if (user.length === 0) {
      return res.status(400).json({ error: 'Invalid verification token' });
    }

    const userData = user[0];

    // Update user as verified
    await db
      .update(users)
      .set({
        emailVerified: true,
        emailVerificationToken: null,
      })
      .where(eq(users.id, userData.id));

    // Log verification event
    logger.info('Email verified', {
      userId: userData.id,
      tenantId: userData.tenantId,
      email: userData.email,
    });

    res.json({ message: 'Email verified successfully' });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }

    logger.error('Email verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Forgot password
export async function forgotPassword(req: Request, res: Response) {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);

    // Find user
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (user.length === 0) {
      // Don't reveal if email exists
      return res.json({ message: 'If an account with that email exists, a password reset link has been sent' });
    }

    const userData = user[0];

    // Generate reset token
    const resetToken = crypto.randomUUID();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Update user with reset token
    await db
      .update(users)
      .set({
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      })
      .where(eq(users.id, userData.id));

    // Send password reset email
    await sendEmail({
      to: email,
      template: 'password-reset',
      data: {
        firstName: userData.firstName,
        resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`,
      },
    });

    // Log password reset request
    logger.info('Password reset requested', {
      userId: userData.id,
      tenantId: userData.tenantId,
      email: userData.email,
    });

    res.json({ message: 'If an account with that email exists, a password reset link has been sent' });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }

    logger.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Reset password
export async function resetPassword(req: Request, res: Response) {
  try {
    const { token, password } = resetPasswordSchema.parse(req.body);

    // Find user with valid token
    const user = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.passwordResetToken, token),
          gt(users.passwordResetExpires, new Date())
        )
      )
      .limit(1);

    if (user.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const userData = user[0];

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 12);

    // Update user
    await db
      .update(users)
      .set({
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      })
      .where(eq(users.id, userData.id));

    // Log password reset
    logger.info('Password reset completed', {
      userId: userData.id,
      tenantId: userData.tenantId,
      email: userData.email,
    });

    res.json({ message: 'Password reset successfully' });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }

    logger.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get current user profile
export async function getProfile(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, req.user.id))
      .limit(1);

    if (user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = user[0];

    res.json({
      id: userData.id,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      emailVerified: userData.emailVerified,
      lastLoginAt: userData.lastLoginAt,
      createdAt: userData.createdAt,
    });

  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Update user profile
export async function updateProfile(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { firstName, lastName } = req.body;

    await db
      .update(users)
      .set({
        firstName,
        lastName,
        updatedAt: new Date(),
      })
      .where(eq(users.id, req.user.id));

    res.json({ message: 'Profile updated successfully' });

  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Change password
export async function changePassword(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    // Get current user
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, req.user.id))
      .limit(1);

    if (user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = user[0];

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, userData.passwordHash);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await db
      .update(users)
      .set({
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, req.user.id));

    res.json({ message: 'Password changed successfully' });

  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Logout (client-side should remove token)
export async function logout(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Log logout event
    logger.info('User logged out', {
      userId: req.user.id,
      tenantId: req.user.tenantId,
      email: req.user.email,
    });

    res.json({ message: 'Logged out successfully' });

  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Check authentication status
export async function checkAuth(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Get fresh user data
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, req.user.id))
      .limit(1);

    if (user.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const userData = user[0];

    res.json({
      authenticated: true,
      user: {
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        emailVerified: userData.emailVerified,
      },
    });

  } catch (error) {
    logger.error('Check auth error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
