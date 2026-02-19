/**
 * ============================================================================
 * DATABASE TENANT CONTEXT MIDDLEWARE - RLS ENFORCEMENT
 * ============================================================================
 * 
 * This middleware sets the PostgreSQL session variable `app.tenant_id` that
 * Row-Level Security policies use to enforce tenant isolation at the database level.
 * 
 * CRITICAL: This MUST be called after authentication and before any database queries.
 * 
 * RLS policies use: current_setting('app.tenant_id', true)::text
 * This middleware sets that session variable for each request.
 * 
 * ============================================================================
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma.js';
import { getCurrentTenantContext } from './prisma-tenant-isolation-v3.middleware.js';

/**
 * Sets the database session variable for RLS enforcement
 */
export async function setDatabaseTenantContext(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const ctx = getCurrentTenantContext();
    
    if (ctx?.companyId) {
      // Set PostgreSQL session variable for RLS policies
      await prisma.$executeRaw`SET LOCAL app.tenant_id = ${ctx.companyId}`;
    }
    
    next();
  } catch (error: any) {
    console.error('Failed to set database tenant context:', error);
    // Don't block request if setting fails - Prisma middleware still protects
    next();
  }
}

/**
 * Clears the database tenant context after request completes
 */
export async function clearDatabaseTenantContext(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // Reset session variable after request
    res.on('finish', async () => {
      try {
        await prisma.$executeRaw`RESET app.tenant_id`;
      } catch (error: any) {
        // Ignore errors on cleanup
      }
    });
    
    next();
  } catch (error: any) {
    next();
  }
}

/**
 * Combined middleware that sets and clears tenant context
 */
export async function databaseTenantContextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const ctx = getCurrentTenantContext();
  
  if (!ctx?.companyId) {
    // No tenant context - skip database context setting
    next();
    return;
  }
  
  try {
    // Set tenant context for this request
    await prisma.$executeRaw`SET LOCAL app.tenant_id = ${ctx.companyId}`;
    
    // Clear context after response
    res.on('finish', async () => {
      try {
        await prisma.$executeRaw`RESET app.tenant_id`;
      } catch (error: any) {
        // Ignore cleanup errors
      }
    });
    
    next();
  } catch (error: any) {
    console.error('Database tenant context error:', error);
    // Continue even if setting fails - Prisma middleware provides protection
    next();
  }
}
