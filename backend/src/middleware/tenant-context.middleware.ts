/**
 * ============================================================================
 * EXPRESS MIDDLEWARE: Tenant Context Injection via AsyncLocalStorage
 * ============================================================================
 *
 * This middleware MUST be mounted BEFORE any route handlers. It extracts the
 * tenant context from the authenticated user and wraps the entire request
 * lifecycle in AsyncLocalStorage so the Prisma tenant isolation middleware
 * can auto-inject tenant filters.
 *
 * Usage in app.ts:
 *   app.use(tenantContextMiddleware);
 *
 * ============================================================================
 */

import { Request, Response, NextFunction } from 'express';
import { runWithTenant, TenantContext } from './prisma-tenant-isolation-v3.middleware.js';

export function tenantContextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const user = (req as any).user;

  if (!user) {
    next();
    return;
  }

  const isAdmin = user.role === 'ADMIN' || user.role === 'FOUNDER';

  const ctx: TenantContext = {
    companyId: user.currentCompanyId ?? undefined,
    userId: user.id,
    isAdmin,
    bypassTenant: false,
  };

  runWithTenant(ctx, () => {
    next();
  });
}
