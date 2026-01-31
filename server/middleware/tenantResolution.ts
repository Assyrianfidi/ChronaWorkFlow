/**
 * Multi-Tenant Resolution Middleware
 * 
 * WHY: Enables one codebase to serve multiple branded tenants.
 * Resolves tenant from subdomain, header, or JWT claim.
 */

import { Request, Response, NextFunction } from 'express';

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  customDomain?: string;
  branding: TenantBranding;
  featureFlags: Record<string, boolean>;
  settings: TenantSettings;
  plan: SubscriptionPlan;
  status: TenantStatus;
}

export interface TenantBranding {
  logo: {
    light: string;
    dark: string;
  };
  favicon: string;
  theme: {
    name: string;
    colors: Record<string, string>;
  };
  typography?: {
    fontFamily: string;
    fontFamilyHeading: string;
  };
  customCss?: string;
}

export interface TenantSettings {
  defaultThemeMode: 'light' | 'dark' | 'system';
  allowUserThemeChange: boolean;
  defaultLanguage: string;
  timezone: string;
  dateFormat: string;
  currencyFormat: string;
  enforceSSO: boolean;
  allowedEmailDomains?: string[];
  sessionTimeout: number;
  enabledModules: string[];
}

export enum SubscriptionPlan {
  FREE = 'FREE',
  STARTER = 'STARTER',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE',
}

export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  TRIAL = 'TRIAL',
  CANCELLED = 'CANCELLED',
}

export interface TenantRequest extends Request {
  tenant?: Tenant;
}

/**
 * Tenant Resolution Middleware
 * 
 * Strategies (in order of precedence):
 * 1. Subdomain (acme.accubooks.com → tenant: "acme")
 * 2. X-Tenant-ID header
 * 3. JWT claim (tenantId)
 */
export async function resolveTenant(
  req: TenantRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let tenantIdentifier: string | null = null;

    // Strategy 1: Extract from subdomain
    const subdomain = extractSubdomain(req.hostname);
    if (subdomain && !['www', 'api', 'app', 'admin'].includes(subdomain)) {
      tenantIdentifier = subdomain;
    }

    // Strategy 2: Extract from header
    if (!tenantIdentifier) {
      tenantIdentifier = req.headers['x-tenant-id'] as string;
    }

    // Strategy 3: Extract from JWT (if authenticated)
    if (!tenantIdentifier && (req as any).user) {
      tenantIdentifier = (req as any).user.tenantId;
    }

    if (!tenantIdentifier) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Tenant identifier is required',
        code: 'MISSING_TENANT',
        hint: 'Use subdomain (tenant.accubooks.com) or X-Tenant-ID header',
      });
      return;
    }

    // Load tenant from database/cache
    const tenant = await loadTenant(tenantIdentifier);

    if (!tenant) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Tenant not found',
        code: 'TENANT_NOT_FOUND',
        tenantIdentifier,
      });
      return;
    }

    // Check tenant status
    if (tenant.status !== TenantStatus.ACTIVE && tenant.status !== TenantStatus.TRIAL) {
      res.status(403).json({
        error: 'Forbidden',
        message: getTenantStatusMessage(tenant.status),
        code: 'TENANT_INACTIVE',
        status: tenant.status,
      });
      return;
    }

    // Attach tenant to request
    req.tenant = tenant;

    // Inject tenant metadata into response headers
    res.setHeader('X-Tenant-ID', tenant.id);
    res.setHeader('X-Tenant-Name', tenant.name);
    res.setHeader('X-Tenant-Plan', tenant.plan);

    next();
  } catch (error) {
    console.error('[ERROR] Tenant resolution failed:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to resolve tenant',
      code: 'TENANT_RESOLUTION_ERROR',
    });
  }
}

/**
 * Extract subdomain from hostname
 * 
 * Examples:
 * - acme.accubooks.com → "acme"
 * - api.accubooks.com → "api"
 * - localhost → null
 */
function extractSubdomain(hostname: string): string | null {
  // Handle localhost
  if (hostname === 'localhost' || hostname.startsWith('127.0.0.1')) {
    return null;
  }

  const parts = hostname.split('.');
  
  // Need at least 3 parts for subdomain (subdomain.domain.tld)
  if (parts.length >= 3) {
    return parts[0];
  }

  return null;
}

/**
 * Load tenant from database with caching
 * 
 * WHY: Cache tenant data to reduce database load.
 * Tenants rarely change, so aggressive caching is safe.
 */
const tenantCache = new Map<string, { tenant: Tenant; expiresAt: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function loadTenant(identifier: string): Promise<Tenant | null> {
  // Check cache first
  const cached = tenantCache.get(identifier);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.tenant;
  }

  // Load from database
  // TODO: Replace with actual database query
  const tenant = await fetchTenantFromDatabase(identifier);

  if (tenant) {
    // Cache for future requests
    tenantCache.set(identifier, {
      tenant,
      expiresAt: Date.now() + CACHE_TTL,
    });
  }

  return tenant;
}

/**
 * Mock database fetch (replace with actual implementation)
 */
async function fetchTenantFromDatabase(identifier: string): Promise<Tenant | null> {
  // TODO: Implement actual database query
  // Example using Prisma:
  // return await prisma.tenant.findUnique({
  //   where: { subdomain: identifier },
  //   include: { branding: true, settings: true },
  // });

  // Mock data for development
  if (identifier === 'demo' || identifier === 'localhost') {
    return {
      id: 'tenant-demo',
      name: 'Demo Company',
      subdomain: 'demo',
      branding: {
        logo: {
          light: '/logos/demo-light.svg',
          dark: '/logos/demo-dark.svg',
        },
        favicon: '/favicons/demo.ico',
        theme: {
          name: 'default',
          colors: {
            primary: '#22c55e',
            primaryHover: '#16a34a',
          },
        },
      },
      featureFlags: {
        FINANCIAL_DASHBOARD: true,
        DARK_MODE: true,
        MULTI_THEME: true,
      },
      settings: {
        defaultThemeMode: 'system',
        allowUserThemeChange: true,
        defaultLanguage: 'en',
        timezone: 'America/New_York',
        dateFormat: 'MM/DD/YYYY',
        currencyFormat: 'USD',
        enforceSSO: false,
        sessionTimeout: 60,
        enabledModules: ['invoicing', 'expenses', 'reports'],
      },
      plan: SubscriptionPlan.PROFESSIONAL,
      status: TenantStatus.ACTIVE,
    };
  }

  return null;
}

/**
 * Get user-friendly status message
 */
function getTenantStatusMessage(status: TenantStatus): string {
  switch (status) {
    case TenantStatus.SUSPENDED:
      return 'Your account has been suspended. Please contact support.';
    case TenantStatus.CANCELLED:
      return 'Your account has been cancelled. Please contact support to reactivate.';
    default:
      return 'Your account is not active.';
  }
}

/**
 * Clear tenant cache (call when tenant is updated)
 */
export function clearTenantCache(identifier: string): void {
  tenantCache.delete(identifier);
}

/**
 * Clear all tenant cache
 */
export function clearAllTenantCache(): void {
  tenantCache.clear();
}
