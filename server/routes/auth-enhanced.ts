import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '../db';
import { prisma } from '../prisma';
import * as schema from '../../shared/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '../utils/logger';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET;
const OWNER_EMAIL = process.env.OWNER_EMAIL?.toLowerCase();

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET or SESSION_SECRET must be set');
}

// Validation schemas
const customerSignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  companyName: z.string().min(1).optional(),
});

const ownerLoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  rememberMe: z.boolean().optional(),
});

function isOwnerEmail(email?: string | null): boolean {
  if (!OWNER_EMAIL) return false;
  if (!email) return false;
  return email.toLowerCase() === OWNER_EMAIL;
}

/**
 * Customer Signup Endpoint
 * Creates a new customer account with limited permissions
 */
router.post('/register/customer', async (req: Request, res: Response) => {
  try {
    const validatedData = customerSignupSchema.parse(req.body);

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

    // Create tenant for customer
    const companyName = validatedData.companyName || `${validatedData.firstName} ${validatedData.lastName} Company`;
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

    // Create customer user
    const [user] = await db
      .insert(schema.users)
      .values({
        username: validatedData.email.split('@')[0],
        email: validatedData.email,
        password: hashedPassword,
        name: `${validatedData.firstName} ${validatedData.lastName}`,
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

    logger.info('Customer signed up', {
      userId: user.id,
      email: user.email,
      tenantId: tenant.id,
    });

    res.status(201).json({
      message: 'Customer account created successfully',
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

    logger.error('Customer signup error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * Owner Login Endpoint
 * Special login for owner with elevated privileges
 */
router.post('/login/owner', async (req: Request, res: Response) => {
  try {
    const validatedData = ownerLoginSchema.parse(req.body);

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
 * Check User Role Endpoint
 * Returns the current user's role and permissions
 */
router.get('/me/role', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const isOwner = isOwnerEmail(user.email);
    const effectiveRole = isOwner ? 'owner' : user.role;
    const roles = isOwner ? ['OWNER', 'ADMIN'] : [user.role?.toUpperCase()];

    res.json({
      userId: user.id,
      email: user.email,
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
