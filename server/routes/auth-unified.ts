import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '../db';
import { prisma } from '../prisma';
import * as schema from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET;
const OWNER_EMAIL = process.env.OWNER_EMAIL?.toLowerCase();

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET or SESSION_SECRET must be set');
}

function isOwnerEmail(email?: string | null): boolean {
  if (!OWNER_EMAIL) return false;
  if (!email) return false;
  return email.toLowerCase() === OWNER_EMAIL;
}

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  username: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  companyName: z.string().min(1).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  rememberMe: z.boolean().optional(),
});

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    role: string;
    email: string;
  };
}

/**
 * POST /api/auth/register
 * Default customer registration
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const validatedData = registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, validatedData.email))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // Create tenant
    const companyName = validatedData.companyName || `${validatedData.firstName || validatedData.username || 'User'} Company`;
    const subdomainBase = validatedData.email.split('@')[0].toLowerCase().replace(/[^a-z0-9-]+/g, '-').slice(0, 30);
    const subdomain = `${subdomainBase}-${Date.now().toString(36)}`;

    const tenant = await prisma.tenant.create({
      data: {
        name: companyName,
        subdomain,
      },
    });

    // Create company
    const [company] = await db
      .insert(schema.companies)
      .values({
        name: companyName,
        email: validatedData.email,
        currency: 'USD',
      })
      .returning();

    // Create user with customer role by default
    const username = validatedData.username || validatedData.email.split('@')[0];
    const name = validatedData.name || `${validatedData.firstName || ''} ${validatedData.lastName || ''}`.trim() || username;

    const [user] = await db
      .insert(schema.users)
      .values({
        username,
        email: validatedData.email,
        password: hashedPassword,
        name,
        role: 'customer',
        currentCompanyId: company.id,
      })
      .returning();

    // Link user to tenant
    await db
      .insert(schema.userTenants)
      .values({
        userId: user.id,
        tenantId: tenant.id,
      })
      .onConflictDoNothing();

    // Link tenant to company
    await db
      .insert(schema.tenantCompanies)
      .values({
        tenantId: tenant.id,
        companyId: company.id,
      })
      .onConflictDoNothing();

    // Grant user access to company
    await db
      .insert(schema.userCompanyAccess)
      .values({
        userId: user.id,
        companyId: company.id,
        role: 'customer',
      })
      .onConflictDoNothing();

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        userId: user.id,
        email: user.email,
        role: 'customer',
        roles: ['CUSTOMER'],
        tenantId: tenant.id,
        companyId: company.id,
        currentTenantId: tenant.id,
        currentCompanyId: company.id,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    logger.info('Customer registered', {
      userId: user.id,
      email: user.email,
      tenantId: tenant.id,
    });

    res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: 'customer',
        currentCompanyId: company.id,
        tenantId: tenant.id,
      },
      token,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }

    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /api/auth/login
 * Standard login for all users
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    // Find user
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, validatedData.email))
      .limit(1);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(validatedData.password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get tenant and company
    const [tenantRow] = await db
      .select({ tenantId: schema.userTenants.tenantId })
      .from(schema.userTenants)
      .where(eq(schema.userTenants.userId, user.id))
      .limit(1);

    if (!tenantRow) {
      return res.status(403).json({ error: 'No tenant access' });
    }

    const companyId = user.currentCompanyId || '';

    // Determine effective role
    const effectiveRole = isOwnerEmail(user.email) ? 'owner' : user.role;
    const roles = isOwnerEmail(user.email) ? ['OWNER', 'ADMIN'] : [user.role?.toUpperCase()];

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        userId: user.id,
        email: user.email,
        role: effectiveRole,
        roles,
        ownerVerified: isOwnerEmail(user.email),
        tenantId: tenantRow.tenantId,
        companyId,
        currentTenantId: tenantRow.tenantId,
        currentCompanyId: companyId,
      },
      JWT_SECRET,
      { expiresIn: validatedData.rememberMe ? '30d' : '7d' }
    );

    logger.info('User logged in', {
      userId: user.id,
      email: user.email,
      role: effectiveRole,
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: effectiveRole,
        currentCompanyId: companyId,
        tenantId: tenantRow.tenantId,
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }

    logger.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * POST /api/auth/login/owner
 * Special owner login endpoint
 */
router.post('/login/owner', async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    // Verify this is the owner email
    if (!isOwnerEmail(validatedData.email)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Find user
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, validatedData.email))
      .limit(1);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(validatedData.password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get tenant
    const [tenantRow] = await db
      .select({ tenantId: schema.userTenants.tenantId })
      .from(schema.userTenants)
      .where(eq(schema.userTenants.userId, user.id))
      .limit(1);

    if (!tenantRow) {
      return res.status(403).json({ error: 'No tenant access' });
    }

    const companyId = user.currentCompanyId || '';

    // Generate token with owner privileges
    const token = jwt.sign(
      {
        id: user.id,
        userId: user.id,
        email: user.email,
        role: 'owner',
        roles: ['OWNER', 'ADMIN'],
        ownerVerified: true,
        tenantId: tenantRow.tenantId,
        companyId,
        currentTenantId: tenantRow.tenantId,
        currentCompanyId: companyId,
      },
      JWT_SECRET,
      { expiresIn: validatedData.rememberMe ? '30d' : '7d' }
    );

    logger.info('Owner logged in', {
      userId: user.id,
      email: user.email,
    });

    res.json({
      message: 'Owner login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: 'owner',
        currentCompanyId: companyId,
        tenantId: tenantRow.tenantId,
      },
      token,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }

    logger.error('Owner login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile (requires authentication middleware)
 */
router.get('/me', async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  try {
    if (!authReq.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, authReq.user.id))
      .limit(1);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: authReq.user.role,
      currentCompanyId: user.currentCompanyId,
    });

  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/auth/me/role
 * Get user role and permissions
 */
router.get('/me/role', async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  try {
    if (!authReq.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const isOwner = isOwnerEmail(authReq.user.email);
    const effectiveRole = isOwner ? 'owner' : authReq.user.role;
    const roles = isOwner ? ['OWNER', 'ADMIN'] : [authReq.user.role?.toUpperCase()];

    res.json({
      userId: authReq.user.id,
      email: authReq.user.email,
      role: effectiveRole,
      roles,
      isOwner,
      permissions: getPermissionsForRole(effectiveRole),
    });

  } catch (error) {
    logger.error('Get role error:', error);
    res.status(500).json({ error: 'Failed to get role' });
  }
});

/**
 * POST /api/auth/logout
 * Logout (client-side should remove token)
 */
router.post('/logout', async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  try {
    if (authReq.user) {
      logger.info('User logged out', {
        userId: authReq.user.id,
        email: authReq.user.email,
      });
    }

    res.json({ message: 'Logged out successfully' });

  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function getPermissionsForRole(role: string): string[] {
  const normalized = role.trim().toUpperCase();
  switch (normalized) {
    case 'OWNER':
      return ['*'];
    case 'ADMIN':
      return ['dashboard:*', 'users:*', 'reports:*', 'billing:*', 'settings:*'];
    case 'MANAGER':
      return ['dashboard:read', 'dashboard:write', 'invoices:*', 'reports:read', 'team:*'];
    case 'ACCOUNTANT':
      return ['dashboard:read', 'invoices:read', 'reports:read', 'ledger:*'];
    case 'CUSTOMER':
      return ['dashboard:read', 'profile:*', 'invoices:read', 'billing:read'];
    default:
      return ['dashboard:read', 'profile:read'];
  }
}

export default router;
