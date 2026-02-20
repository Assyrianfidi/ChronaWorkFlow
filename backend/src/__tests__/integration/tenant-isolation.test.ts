import request from 'supertest';
// Jest globals: describe, it, expect, beforeAll are available globally
import { PrismaClient, Role } from '@prisma/client';

import app from '../../../server.js';
import { generateAccessToken } from '../../middleware/auth.middleware.js';

const prisma = new PrismaClient();

type IsolationFixture = {
  userAId: number;
  userAEmail: string;
  companyAId: string;
  companyBId: string;
  invoiceBId?: string;
};

async function findIsolationFixture(): Promise<IsolationFixture | null> {
  const usersList = await prisma.users.findMany({
    take: 5,
    where: { isActive: true },
    include: {
      company_members: {
        where: { isActive: true },
        include: { companies: true }
      }
    }
  });

  if (usersList.length < 2) return null;

  // Find two users from different "tenants" (different sets of companies)
  for (let i = 0; i < usersList.length; i++) {
    for (let j = 0; j < usersList.length; j++) {
      if (i === j) continue;

      const userA = usersList[i];
      const userB = usersList[j];

      const companyA = userA.company_members[0]?.companies;
      const companyB = userB.company_members[0]?.companies;

      if (!companyA || !companyB || companyA.id === companyB.id) continue;

      const invoiceB = await prisma.invoices.findFirst({
        where: { 
          companyId: companyB.id,
          isActive: true
        },
        select: { id: true }
      });

      return {
        userAId: userA.id,
        userAEmail: userA.email,
        companyAId: companyA.id,
        companyBId: companyB.id,
        invoiceBId: invoiceB?.id
      };
    }
  }

  return null;
}

describe('Tenant isolation (Real DB Schema)', () => {
  let fixture: IsolationFixture | null = null;
  let tokenForUserA: string;

  beforeAll(async () => {
    fixture = await findIsolationFixture();
    if (!fixture) {
      console.warn('Could not find suitable multi-tenant fixture in database');
      return;
    }

    tokenForUserA = generateAccessToken(fixture.userAId, fixture.userAEmail, Role.USER);
  }, 60_000);

  it('rejects cross-tenant company access', async () => {
    if (!fixture) return;

    const res = await request(app)
      .get(`/api/companies/${fixture.companyBId}`)
      .set('Authorization', `Bearer ${tokenForUserA}`);

    expect([403, 404]).toContain(res.status);
  });

  it('scopes company list to own tenant', async () => {
    if (!fixture) return;

    const res = await request(app)
      .get('/api/companies')
      .set('Authorization', `Bearer ${tokenForUserA}`);

    expect(res.status).toBe(200);
    const companies = res.body.data || res.body;
    const ids = Array.isArray(companies) ? companies.map((c: any) => c.id) : [];
    
    expect(ids).toContain(fixture.companyAId);
    expect(ids).not.toContain(fixture.companyBId);
  });

  it('rejects cross-tenant invoice access', async () => {
    if (!fixture?.invoiceBId) return;

    const res = await request(app)
      .get(`/api/invoices/${fixture.invoiceBId}`)
      .set('Authorization', `Bearer ${tokenForUserA}`);

    expect([403, 404]).toContain(res.status);
  });
});
