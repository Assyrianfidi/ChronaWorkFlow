import type { Request } from 'express';

import type { PrismaClient } from '@prisma/client';

export type BillingContext = {
  prisma?: PrismaClient;
  companyId: string;
  actorUserId: string;
  requestId: string;
  ip?: string;
  userAgent?: string;
};

export function getBillingContextFromRequest(req: Request): BillingContext {
  const companyId = (req as any).user?.currentCompanyId as string | undefined;
  const actorUserId = (req as any).user?.id as string | undefined;
  const requestId = (req as any).id || (req.headers['x-request-id'] as string | undefined) || 'unknown';

  if (!companyId || !actorUserId) {
    throw new Error('BillingContext requires authenticated user with currentCompanyId');
  }

  return {
    companyId,
    actorUserId,
    requestId,
    ip: req.ip,
    userAgent: req.get('user-agent') ?? undefined,
  };
}
