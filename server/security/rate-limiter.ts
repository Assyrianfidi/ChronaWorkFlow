import type { Request, Response, NextFunction } from 'express';

import { createRateLimitMiddleware, type RateLimitConfig, type RateLimitScope } from '../resilience/rate-limiter.js';

export type RateLimitProfile = 'public' | 'auth' | 'billing' | 'analytics' | 'admin';

export interface RateLimiterOptions {
  profile: RateLimitProfile;
  scope?: RateLimitScope;
  config?: Partial<RateLimitConfig>;
  skipPaths?: string[];
}

function getTenantId(req: any): string | undefined {
  return req?.tenantContext?.tenantId;
}

function getUserId(req: any): string | undefined {
  return req?.user?.id;
}

function getIp(req: any): string {
  return (req?.ip || req?.connection?.remoteAddress || 'unknown') as string;
}

function getProfileDefaultConfig(profile: RateLimitProfile): Partial<RateLimitConfig> {
  switch (profile) {
    case 'auth':
      return {
        strategy: 'TOKEN_BUCKET',
        scope: 'IP',
        windowMs: 60_000,
        maxRequests: 60,
        burstCapacity: 20,
        refillRate: 1,
        adaptiveMultiplier: 0.5,
        penaltyMultiplier: 2,
        recoveryRate: 1.1,
      };
    case 'billing':
      return {
        strategy: 'TOKEN_BUCKET',
        scope: 'USER',
        windowMs: 60_000,
        maxRequests: 120,
        burstCapacity: 30,
        refillRate: 2,
        adaptiveMultiplier: 0.5,
        penaltyMultiplier: 2,
        recoveryRate: 1.1,
      };
    case 'analytics':
      return {
        strategy: 'ADAPTIVE',
        scope: 'TENANT',
        windowMs: 60_000,
        maxRequests: 600,
        burstCapacity: 100,
        refillRate: 10,
        adaptiveMultiplier: 0.3,
        penaltyMultiplier: 2,
        recoveryRate: 1.1,
      };
    case 'admin':
      return {
        strategy: 'FIXED',
        scope: 'TENANT',
        windowMs: 60_000,
        maxRequests: 300,
        burstCapacity: 50,
        refillRate: 5,
        adaptiveMultiplier: 0.5,
        penaltyMultiplier: 2,
        recoveryRate: 1.1,
      };
    case 'public':
    default:
      return {
        strategy: 'SLIDING_WINDOW',
        scope: 'IP',
        windowMs: 60_000,
        maxRequests: 120,
        burstCapacity: 50,
        refillRate: 2,
        adaptiveMultiplier: 0.5,
        penaltyMultiplier: 2,
        recoveryRate: 1.1,
      };
  }
}

function buildKey(req: any, profile: RateLimitProfile): string {
  const tenantId = getTenantId(req);
  const userId = getUserId(req);
  const ip = getIp(req);
  const endpoint = `${req.method}:${req.path}`;

  if (tenantId && userId) {
    return `tenant:${tenantId}:user:${userId}:profile:${profile}:endpoint:${endpoint}`;
  }

  if (tenantId) {
    return `tenant:${tenantId}:profile:${profile}:endpoint:${endpoint}`;
  }

  return `ip:${ip}:profile:${profile}:endpoint:${endpoint}`;
}

export function createProfiledRateLimiter(options: RateLimiterOptions) {
  const { profile, scope, config, skipPaths = [] } = options;
  const defaultCfg = getProfileDefaultConfig(profile);
  const effectiveScope: RateLimitScope = scope || (defaultCfg.scope as RateLimitScope);

  return createRateLimitMiddleware({
    scope: effectiveScope,
    skipPaths,
    keyGenerator: (req: any) => buildKey(req, profile),
    config: {
      ...defaultCfg,
      ...config,
      scope: effectiveScope,
    },
  });
}

export function rateLimiterMiddleware(profile: RateLimitProfile, config?: Partial<RateLimitConfig>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const middleware = createProfiledRateLimiter({ profile, config });
    return middleware(req as any, res as any, next as any);
  };
}
