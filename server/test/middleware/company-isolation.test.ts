import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

const { storageMock } = vi.hoisted(() => {
  const storageMock = {
    createAuditLog: vi.fn().mockResolvedValue(undefined),
    hasUserCompanyAccess: vi.fn().mockResolvedValue(true),
  };

  return { storageMock };
});

vi.mock('../../storage', () => ({
  storage: storageMock,
}));

describe('company isolation middleware', () => {
  beforeEach(() => {
    storageMock.createAuditLog.mockClear();
    storageMock.hasUserCompanyAccess.mockClear();
  });

  it('denies when query companyId mismatches token currentCompanyId', async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

    const app = express();
    app.use(express.json());

    const { authenticate } = await import('../../middleware/authenticate');
    const { enforceCompanyIsolation } = await import('../../middleware/authorize');

    app.use('/api', authenticate(), enforceCompanyIsolation());
    app.get('/api/accounts', (_req, res) => res.status(200).json({ ok: true }));

    const token = jwt.sign(
      { id: 'test-user-123', email: 'test@example.com', role: 'admin', currentCompanyId: 'company1' },
      process.env.JWT_SECRET,
      { algorithm: 'HS256' },
    );

    const res = await request(app)
      .get('/api/accounts?companyId=company2')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('denies when user lacks membership in requested company', async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

    storageMock.hasUserCompanyAccess.mockResolvedValueOnce(false);

    const app = express();
    app.use(express.json());

    const { authenticate } = await import('../../middleware/authenticate');
    const { enforceCompanyIsolation } = await import('../../middleware/authorize');

    app.use('/api', authenticate(), enforceCompanyIsolation());
    app.get('/api/accounts', (_req, res) => res.status(200).json({ ok: true }));

    const token = jwt.sign(
      { id: 'test-user-123', email: 'test@example.com', role: 'admin', currentCompanyId: 'company1' },
      process.env.JWT_SECRET,
      { algorithm: 'HS256' },
    );

    const res = await request(app)
      .get('/api/accounts?companyId=company1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('allows when companyId matches token and membership exists', async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

    storageMock.hasUserCompanyAccess.mockResolvedValueOnce(true);

    const app = express();
    app.use(express.json());

    const { authenticate } = await import('../../middleware/authenticate');
    const { enforceCompanyIsolation } = await import('../../middleware/authorize');

    app.use('/api', authenticate(), enforceCompanyIsolation());
    app.get('/api/accounts', (_req, res) => res.status(200).json({ ok: true }));

    const token = jwt.sign(
      { id: 'test-user-123', email: 'test@example.com', role: 'admin', currentCompanyId: 'company1' },
      process.env.JWT_SECRET,
      { algorithm: 'HS256' },
    );

    const res = await request(app)
      .get('/api/accounts?companyId=company1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
