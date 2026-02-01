import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

import * as idempotencyModule from '../idempotency-manager.js';
import { idempotencyMiddleware } from '../idempotency-middleware.js';

describe('Idempotency middleware fail-closed', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 401 when tenant context is required but missing', async () => {
    const app = express();
    app.use(express.json());

    app.post(
      '/t',
      idempotencyMiddleware({ operationType: 'TEST', scope: 'TENANT' }),
      (_req, res) => res.json({ ok: true }),
    );

    const resp = await request(app).post('/t').send({ a: 1 });
    expect(resp.status).toBe(401);
    expect(resp.body.error).toBe('Unauthorized');
  });

  it('returns 500 when idempotency check throws (fail-closed)', async () => {
    vi.spyOn(idempotencyModule, 'checkIdempotency').mockRejectedValue(new Error('idempo_down'));

    const app = express();
    app.use(express.json());

    app.post(
      '/t',
      (req: any, _res, next) => {
        req.tenantContext = {
          tenantId: 'tn_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          tenant: {
            id: 'tn_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
            name: 't',
            slug: 't',
            subscriptionPlan: 'x',
            subscriptionStatus: 'y',
            maxUsers: 1,
            isActive: true,
          },
          userRole: 'OWNER',
          permissions: ['users:read'],
          isOwner: true,
          isAdmin: false,
          isManager: false,
        };
        req.user = { id: 'user-1' };
        next();
      },
      idempotencyMiddleware({ operationType: 'TEST', scope: 'TENANT' }),
      (_req, res) => res.json({ ok: true }),
    );

    const resp = await request(app).post('/t').send({ a: 1 });
    expect(resp.status).toBe(500);
    expect(resp.body.error).toBe('Internal Server Error');
    expect(resp.body.message).toBe('Idempotency check failed');
  });
});
