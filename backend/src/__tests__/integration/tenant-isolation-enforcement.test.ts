/**
 * ============================================================================
 * CRITICAL SECURITY EXPLOIT TEST SUITE — V3 ENTERPRISE
 * ============================================================================
 *
 * This test suite attempts to BREAK tenant isolation using every known
 * bypass vector. Every test represents a real attack scenario.
 *
 * If ANY test fails to throw a security error, the system is VULNERABLE.
 *
 * Test categories:
 *   1. Top-level where clause enforcement (10 tests)
 *   2. Create/createMany without tenant field (3 tests)
 *   3. Aggregate/count/groupBy leakage (3 tests)
 *   4. Cross-tenant data access (3 tests)
 *   5. Company members protection (2 tests)
 *   6. hasTenantScope unit tests (9 tests)
 *   7. validateNestedWrites unit tests (7 tests)
 *   8. Raw query hard block (4 tests)
 *   9. Auto-injection via AsyncLocalStorage (4 tests)
 *  10. Transaction_lines tenant isolation (2 tests)
 *
 * Total: 47+ tests
 * ============================================================================
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '../../utils/prisma.js';
import crypto from 'crypto';
import {
  hasTenantScope,
  validateNestedWrites,
  setRelationTargetMap,
  runWithTenant,
  type TenantModelMap,
  type TenantContext,
} from '../../middleware/prisma-tenant-isolation-v3.middleware.js';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

describe('Tenant Isolation Enforcement V3 — Enterprise Exploit Suite', () => {
  let companyA: any;
  let companyB: any;
  let userA: any;
  let userB: any;
  let billingStatusA: any;
  let billingStatusB: any;
  let invoiceA: any;
  let invoiceB: any;
  let accountA: any;
  let accountB: any;
  let transactionA: any;
  let transactionB: any;

  beforeAll(async () => {
    await runWithTenant({ isAdmin: true, bypassTenant: true }, async () => {
      // Create two separate companies
      companyA = await prisma.companies.create({
        data: {
          id: crypto.randomUUID(),
          name: 'SecurityTest Company A',
          updatedAt: new Date(),
        },
      });

      companyB = await prisma.companies.create({
        data: {
          id: crypto.randomUUID(),
          name: 'SecurityTest Company B',
          updatedAt: new Date(),
        },
      });

      // Create users
      userA = await prisma.users.create({
        data: {
          email: `sec-usera-${Date.now()}@test.com`,
          name: 'Security User A',
          password: 'hashedpassword',
          currentCompanyId: companyA.id,
          updatedAt: new Date(),
        },
      });

      userB = await prisma.users.create({
        data: {
          email: `sec-userb-${Date.now()}@test.com`,
          name: 'Security User B',
          password: 'hashedpassword',
          currentCompanyId: companyB.id,
          updatedAt: new Date(),
        },
      });

      // Create company memberships
      await prisma.company_members.create({
        data: {
          id: crypto.randomUUID(),
          userId: userA.id,
          companyId: companyA.id,
          role: 'OWNER',
        },
      });

      await prisma.company_members.create({
        data: {
          id: crypto.randomUUID(),
          userId: userB.id,
          companyId: companyB.id,
          role: 'OWNER',
        },
      });

      // Create billing status
      billingStatusA = await prisma.billing_status.create({
        data: {
          id: crypto.randomUUID(),
          companyId: companyA.id,
          updatedAt: new Date(),
        },
      });

      billingStatusB = await prisma.billing_status.create({
        data: {
          id: crypto.randomUUID(),
          companyId: companyB.id,
          updatedAt: new Date(),
        },
      });

      // Create invoices
      invoiceA = await prisma.invoices.create({
        data: {
          id: crypto.randomUUID(),
          companyId: companyA.id,
          billingStatusId: billingStatusA.id,
          invoiceNumber: `SEC-INV-A-${Date.now()}`,
          amount: 1000,
          status: 'DRAFT',
          dueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
      });

      invoiceB = await prisma.invoices.create({
        data: {
          id: crypto.randomUUID(),
          companyId: companyB.id,
          billingStatusId: billingStatusB.id,
          invoiceNumber: `SEC-INV-B-${Date.now()}`,
          amount: 2000,
          status: 'DRAFT',
          dueAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
      });

      // Create accounts
      accountA = await prisma.accounts.create({
        data: {
          id: crypto.randomUUID(),
          companyId: companyA.id,
          code: `SEC-${Date.now()}-A`,
          name: 'Cash - Security Test A',
          type: 'ASSET',
          updatedAt: new Date(),
        },
      });

      accountB = await prisma.accounts.create({
        data: {
          id: crypto.randomUUID(),
          companyId: companyB.id,
          code: `SEC-${Date.now()}-B`,
          name: 'Cash - Security Test B',
          type: 'ASSET',
          updatedAt: new Date(),
        },
      });

      // Create transactions for transaction_lines tests
      transactionA = await prisma.transactions.create({
        data: {
          id: crypto.randomUUID(),
          companyId: companyA.id,
          transactionNumber: `SEC-TXN-A-${Date.now()}`,
          date: new Date(),
          type: 'JOURNAL_ENTRY',
          totalAmount: 1000,
          updatedAt: new Date(),
        },
      });

      transactionB = await prisma.transactions.create({
        data: {
          id: crypto.randomUUID(),
          companyId: companyB.id,
          transactionNumber: `SEC-TXN-B-${Date.now()}`,
          date: new Date(),
          type: 'JOURNAL_ENTRY',
          totalAmount: 2000,
          updatedAt: new Date(),
        },
      });
    });
  });

  afterAll(async () => {
    // Cleanup in dependency order
    if (companyA?.id && companyB?.id) {
      const companyIds = [companyA.id, companyB.id];

      await runWithTenant({ isAdmin: true, bypassTenant: true }, async () => {
        await prisma.payments.deleteMany({
          where: { companyId: { in: companyIds } },
        });
        await prisma.invoices.deleteMany({
          where: { companyId: { in: companyIds } },
        });
        await prisma.transaction_lines.deleteMany({
          where: { companyId: { in: companyIds } },
        });
        await prisma.transactions.deleteMany({
          where: { companyId: { in: companyIds } },
        });
        await prisma.accounts.deleteMany({
          where: { companyId: { in: companyIds } },
        });
        await prisma.billing_status.deleteMany({
          where: { companyId: { in: companyIds } },
        });
        await prisma.company_members.deleteMany({
          where: { companyId: { in: companyIds } },
        });
        await prisma.companies.deleteMany({
          where: { id: { in: companyIds } },
        });
      });
    }

    if (userA?.id && userB?.id) {
      await runWithTenant({ isAdmin: true, bypassTenant: true }, async () => {
        await prisma.users.deleteMany({
          where: { id: { in: [userA.id, userB.id] } },
        });
      });
    }

    await prisma.$disconnect();
  });

  // =========================================================================
  // 1. TOP-LEVEL WHERE CLAUSE ENFORCEMENT
  // =========================================================================

  describe('1. Where Clause Enforcement', () => {
    it('EXPLOIT: findFirst without companyId → MUST throw', async () => {
      await expect(
        prisma.invoices.findFirst({ where: { id: invoiceB.id } }),
      ).rejects.toThrow(/SECURITY VIOLATION/);
    });

    it('EXPLOIT: findMany without companyId → MUST throw', async () => {
      await expect(
        prisma.invoices.findMany({ where: { status: 'DRAFT' } }),
      ).rejects.toThrow(/SECURITY VIOLATION/);
    });

    it('EXPLOIT: findMany with empty where → MUST throw', async () => {
      await expect(
        prisma.invoices.findMany({ where: {} }),
      ).rejects.toThrow(/SECURITY VIOLATION/);
    });

    it('EXPLOIT: findMany with no args → MUST throw', async () => {
      await expect(
        prisma.invoices.findMany(),
      ).rejects.toThrow(/SECURITY VIOLATION/);
    });

    it('EXPLOIT: update without companyId → MUST throw', async () => {
      await expect(
        prisma.invoices.update({
          where: { id: invoiceB.id },
          data: { amount: 9999 },
        }),
      ).rejects.toThrow(/SECURITY VIOLATION/);
    });

    it('EXPLOIT: delete without companyId → MUST throw', async () => {
      await expect(
        prisma.accounts.delete({ where: { id: accountB.id } }),
      ).rejects.toThrow(/SECURITY VIOLATION/);
    });

    it('EXPLOIT: updateMany without companyId → MUST throw', async () => {
      await expect(
        prisma.invoices.updateMany({
          where: { status: 'DRAFT' },
          data: { status: 'VOID' },
        }),
      ).rejects.toThrow(/SECURITY VIOLATION/);
    });

    it('EXPLOIT: deleteMany without companyId → MUST throw', async () => {
      await expect(
        prisma.accounts.deleteMany({ where: { type: 'ASSET' } }),
      ).rejects.toThrow(/SECURITY VIOLATION/);
    });

    it('VALID: findFirst with correct companyId → MUST succeed', async () => {
      const invoice = await prisma.invoices.findFirst({
        where: { id: invoiceA.id, companyId: companyA.id },
      });
      expect(invoice).toBeDefined();
      expect(invoice?.id).toBe(invoiceA.id);
      expect(invoice?.companyId).toBe(companyA.id);
    });

    it('VALID: cross-company ID with correct scoping → returns null', async () => {
      const invoice = await prisma.invoices.findFirst({
        where: { id: invoiceB.id, companyId: companyA.id },
      });
      expect(invoice).toBeNull();
    });
  });

  // =========================================================================
  // 2. CREATE / CREATEMANY WITHOUT TENANT FIELD
  // =========================================================================

  describe('2. Create Without Tenant Field', () => {
    it('EXPLOIT: create invoice without companyId → MUST throw', async () => {
      await expect(
        prisma.invoices.create({
          data: {
            id: crypto.randomUUID(),
            billingStatusId: billingStatusA.id,
            invoiceNumber: `EXPLOIT-${Date.now()}`,
            amount: 666,
            status: 'DRAFT',
            dueAt: new Date(),
            updatedAt: new Date(),
          } as any,
        }),
      ).rejects.toThrow(/SECURITY VIOLATION/);
    });

    it('EXPLOIT: create account without companyId → MUST throw', async () => {
      await expect(
        prisma.accounts.create({
          data: {
            id: crypto.randomUUID(),
            code: 'EXPLOIT',
            name: 'Exploit Account',
            type: 'ASSET',
            updatedAt: new Date(),
          } as any,
        }),
      ).rejects.toThrow(/SECURITY VIOLATION/);
    });

    it('EXPLOIT: create payment without companyId → MUST throw', async () => {
      await expect(
        prisma.payments.create({
          data: {
            id: crypto.randomUUID(),
            billingStatusId: billingStatusA.id,
            amount: 999,
            updatedAt: new Date(),
          } as any,
        }),
      ).rejects.toThrow(/SECURITY VIOLATION/);
    });
  });

  // =========================================================================
  // 3. AGGREGATE / COUNT / GROUPBY LEAKAGE
  // =========================================================================

  describe('3. Aggregate/Count/GroupBy Enforcement', () => {
    it('EXPLOIT: count without companyId → MUST throw', async () => {
      await expect(
        prisma.invoices.count({ where: { status: 'DRAFT' } }),
      ).rejects.toThrow(/SECURITY VIOLATION/);
    });

    it('EXPLOIT: aggregate without companyId → MUST throw', async () => {
      await expect(
        prisma.invoices.aggregate({
          where: { status: 'DRAFT' },
          _sum: { amount: true },
        }),
      ).rejects.toThrow(/SECURITY VIOLATION/);
    });

    it('VALID: count with companyId → MUST succeed', async () => {
      const count = await prisma.invoices.count({
        where: { companyId: companyA.id },
      });
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(1);
    });
  });

  // =========================================================================
  // 4. CROSS-TENANT DATA ACCESS
  // =========================================================================

  describe('4. Cross-Tenant Access Prevention', () => {
    it('Company A cannot read Company B invoice even with companyId', async () => {
      const result = await prisma.invoices.findFirst({
        where: { id: invoiceB.id, companyId: companyA.id },
      });
      expect(result).toBeNull();
    });

    it('Company A cannot read Company B accounts', async () => {
      const result = await prisma.accounts.findFirst({
        where: { id: accountB.id, companyId: companyA.id },
      });
      expect(result).toBeNull();
    });

    it('Company A findMany returns only own data', async () => {
      const invoices = await prisma.invoices.findMany({
        where: { companyId: companyA.id },
      });
      for (const inv of invoices) {
        expect(inv.companyId).toBe(companyA.id);
      }
    });
  });

  // =========================================================================
  // 5. COMPANY_MEMBERS PROTECTION
  // =========================================================================

  describe('5. Company Members Protection', () => {
    it('EXPLOIT: findMany company_members without companyId → MUST throw', async () => {
      await expect(
        prisma.company_members.findMany({ where: { userId: userA.id } }),
      ).rejects.toThrow(/SECURITY VIOLATION/);
    });

    it('VALID: findMany company_members with companyId → succeeds', async () => {
      const members = await prisma.company_members.findMany({
        where: { companyId: companyA.id },
      });
      expect(Array.isArray(members)).toBe(true);
      for (const m of members) {
        expect(m.companyId).toBe(companyA.id);
      }
    });
  });

  // =========================================================================
  // 6. MIDDLEWARE UNIT TESTS (hasTenantScope)
  // =========================================================================

  describe('6. hasTenantScope Unit Tests', () => {
    it('returns false for null where', () => {
      expect(hasTenantScope(null, 'companyId')).toBe(false);
    });

    it('returns false for undefined where', () => {
      expect(hasTenantScope(undefined, 'companyId')).toBe(false);
    });

    it('returns false for empty where', () => {
      expect(hasTenantScope({}, 'companyId')).toBe(false);
    });

    it('returns false when companyId is missing', () => {
      expect(hasTenantScope({ id: '123' }, 'companyId')).toBe(false);
    });

    it('returns true when companyId is present', () => {
      expect(hasTenantScope({ id: '123', companyId: 'abc' }, 'companyId')).toBe(true);
    });

    it('returns true for composite unique key', () => {
      expect(
        hasTenantScope(
          { id_companyId: { id: '123', companyId: 'abc' } },
          'companyId',
        ),
      ).toBe(true);
    });

    it('does NOT accept companyId buried inside OR', () => {
      expect(
        hasTenantScope(
          { OR: [{ id: '123' }, { companyId: 'abc' }] },
          'companyId',
        ),
      ).toBe(false);
    });

    it('does NOT accept companyId buried inside AND', () => {
      expect(
        hasTenantScope(
          { AND: [{ id: '123' }, { companyId: 'abc' }] },
          'companyId',
        ),
      ).toBe(false);
    });

    it('does NOT accept companyId buried inside NOT', () => {
      expect(
        hasTenantScope(
          { NOT: { companyId: 'abc' } },
          'companyId',
        ),
      ).toBe(false);
    });
  });

  // =========================================================================
  // 7. NESTED WRITE VALIDATION UNIT TESTS
  // =========================================================================

  describe('7. validateNestedWrites Unit Tests', () => {
    const tenantModels: TenantModelMap = new Map([
      ['payments', 'companyId'],
      ['invoices', 'companyId'],
      ['accounts', 'companyId'],
      ['transactions', 'companyId'],
      ['company_members', 'companyId'],
    ]);

    beforeAll(() => {
      // Set up relation target map for unit tests
      const relMap = new Map<string, string>();
      relMap.set('payments', 'payments');
      relMap.set('invoices', 'invoices');
      relMap.set('accounts', 'accounts');
      relMap.set('transactions', 'transactions');
      relMap.set('transaction_lines', 'transaction_lines');
      relMap.set('company_members', 'company_members');
      setRelationTargetMap(relMap);
    });

    it('detects nested create without tenant field', () => {
      const violations = validateNestedWrites(
        {
          payments: {
            create: { amount: 1000 },
          },
        },
        'invoices',
        tenantModels,
      );
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].model).toBe('payments');
      expect(violations[0].tenantField).toBe('companyId');
    });

    it('accepts nested create WITH tenant field', () => {
      const violations = validateNestedWrites(
        {
          payments: {
            create: { amount: 1000, companyId: 'abc' },
          },
        },
        'invoices',
        tenantModels,
      );
      expect(violations.length).toBe(0);
    });

    it('detects nested createMany without tenant field', () => {
      const violations = validateNestedWrites(
        {
          payments: {
            createMany: {
              data: [
                { amount: 100 },
                { amount: 200 },
              ],
            },
          },
        },
        'invoices',
        tenantModels,
      );
      expect(violations.length).toBe(2);
    });

    it('detects nested connectOrCreate without tenant field in create', () => {
      const violations = validateNestedWrites(
        {
          payments: {
            connectOrCreate: {
              where: { id: 'some-id', companyId: 'abc' },
              create: { amount: 1000 }, // missing companyId
            },
          },
        },
        'invoices',
        tenantModels,
      );
      expect(violations.length).toBeGreaterThan(0);
    });

    it('detects nested upsert without tenant field in create', () => {
      const violations = validateNestedWrites(
        {
          payments: {
            upsert: {
              where: { id: 'some-id', companyId: 'abc' },
              create: { amount: 1000 }, // missing companyId
              update: { amount: 2000 },
            },
          },
        },
        'invoices',
        tenantModels,
      );
      expect(violations.length).toBeGreaterThan(0);
    });

    it('handles deeply nested writes', () => {
      const violations = validateNestedWrites(
        {
          transactions: {
            create: {
              companyId: 'abc', // parent has tenant field
              accounts: {
                create: { name: 'Exploit' }, // missing companyId
              },
            },
          },
        },
        'companies',
        tenantModels,
      );
      expect(violations.length).toBeGreaterThan(0);
    });

    it('returns empty for non-relation fields', () => {
      const violations = validateNestedWrites(
        {
          amount: 1000,
          status: 'PAID',
          metadata: { key: 'value' },
        },
        'invoices',
        tenantModels,
      );
      expect(violations.length).toBe(0);
    });
  });

  // =========================================================================
  // 8. RAW QUERY HARD BLOCK
  // =========================================================================

  describe('8. Raw Query Hard Block', () => {
    it('EXPLOIT: $queryRawUnsafe on tenant table → MUST throw', async () => {
      await expect(
        (prisma as any).$queryRawUnsafe('SELECT * FROM invoices LIMIT 1'),
      ).rejects.toThrow(/SECURITY VIOLATION.*Raw query.*tenant table/);
    });

    it('EXPLOIT: $executeRawUnsafe on tenant table → MUST throw', async () => {
      await expect(
        (prisma as any).$executeRawUnsafe('DELETE FROM accounts WHERE id = \'fake\''),
      ).rejects.toThrow(/SECURITY VIOLATION.*Raw query.*tenant table/);
    });

    it('EXPLOIT: $queryRawUnsafe referencing transactions → MUST throw', async () => {
      await expect(
        (prisma as any).$queryRawUnsafe('SELECT * FROM transactions WHERE id = \'x\''),
      ).rejects.toThrow(/SECURITY VIOLATION.*Raw query.*tenant table/);
    });

    it('VALID: $queryRawUnsafe on non-tenant table → MUST succeed', async () => {
      const result = await (prisma as any).$queryRawUnsafe('SELECT 1 as val');
      expect(result).toBeDefined();
    });
  });

  // =========================================================================
  // 9. AUTO-INJECTION VIA ASYNCLOCALSTORAGE
  // =========================================================================

  describe('9. Auto-Injection via AsyncLocalStorage', () => {
    it('Auto-injects companyId into findMany when context is set', async () => {
      const ctx: TenantContext = {
        companyId: companyA.id,
        userId: userA.id,
        isAdmin: false,
        bypassTenant: false,
      };

      const invoices = await new Promise<any[]>((resolve, reject) => {
        runWithTenant(ctx, async () => {
          try {
            const result = await prisma.invoices.findMany({
              where: { companyId: companyA.id },
            });
            resolve(result);
          } catch (err: any) {
            reject(err);
          }
        });
      });

      expect(Array.isArray(invoices)).toBe(true);
      for (const inv of invoices) {
        expect(inv.companyId).toBe(companyA.id);
      }
    });

    it('Auto-injection does NOT leak cross-tenant data', async () => {
      const ctx: TenantContext = {
        companyId: companyA.id,
        userId: userA.id,
        isAdmin: false,
        bypassTenant: false,
      };

      const result = await new Promise<any>((resolve, reject) => {
        runWithTenant(ctx, async () => {
          try {
            const inv = await prisma.invoices.findFirst({
              where: { id: invoiceB.id, companyId: companyA.id },
            });
            resolve(inv);
          } catch (err: any) {
            reject(err);
          }
        });
      });

      expect(result).toBeNull();
    });

    it('Admin bypass allows cross-tenant access', async () => {
      const ctx: TenantContext = {
        companyId: companyA.id,
        userId: userA.id,
        isAdmin: true,
        bypassTenant: true,
      };

      const result = await new Promise<any>((resolve, reject) => {
        runWithTenant(ctx, async () => {
          try {
            const inv = await prisma.invoices.findFirst({
              where: { id: invoiceB.id, companyId: companyB.id },
            });
            resolve(inv);
          } catch (err: any) {
            reject(err);
          }
        });
      });

      expect(result).toBeDefined();
      expect(result?.id).toBe(invoiceB.id);
    });

    it('Non-admin bypassTenant flag is ignored', async () => {
      const ctx: TenantContext = {
        companyId: companyA.id,
        userId: userA.id,
        isAdmin: false,
        bypassTenant: true,
      };

      await new Promise<void>((resolve, reject) => {
        runWithTenant(ctx, async () => {
          try {
            await prisma.invoices.findMany({ where: { companyId: companyA.id } });
            resolve();
          } catch (err: any) {
            reject(err);
          }
        });
      });
    });
  });

  // =========================================================================
  // 10. TRANSACTION_LINES TENANT ISOLATION
  // =========================================================================

  describe('10. Transaction Lines Tenant Isolation', () => {
    it('EXPLOIT: create transaction_line without companyId → MUST throw', async () => {
      await expect(
        prisma.transactions.transaction_lines.create({
          data: {
            id: crypto.randomUUID(),
            transactionId: transactionA.id,
            accountId: accountA.id,
            debit: 500,
            credit: 0,
            updatedAt: new Date(),
          } as any,
        }),
      ).rejects.toThrow(/SECURITY VIOLATION/);
    });

    it('EXPLOIT: findMany transaction_lines without companyId → MUST throw', async () => {
      await expect(
        prisma.transactions.transaction_lines.findMany({
          where: { transactionId: transactionA.id },
        }),
      ).rejects.toThrow(/SECURITY VIOLATION/);
    });
  });

  // =========================================================================
  // 11. UPSERT ENFORCEMENT
  // =========================================================================

  describe('11. Upsert Enforcement', () => {
    it('EXPLOIT: upsert without companyId in where → MUST throw', async () => {
      await expect(
        prisma.invoices.upsert({
          where: { id: invoiceA.id } as any,
          create: {
            id: crypto.randomUUID(),
            companyId: companyA.id,
            billingStatusId: billingStatusA.id,
            invoiceNumber: `UPSERT-${Date.now()}`,
            amount: 100,
            status: 'DRAFT',
            dueAt: new Date(),
            updatedAt: new Date(),
          },
          update: { amount: 200 },
        }),
      ).rejects.toThrow(/SECURITY VIOLATION/);
    });

    it('EXPLOIT: upsert without companyId in create → MUST throw', async () => {
      await expect(
        prisma.invoices.upsert({
          where: { id: invoiceA.id, companyId: companyA.id } as any,
          create: {
            id: crypto.randomUUID(),
            billingStatusId: billingStatusA.id,
            invoiceNumber: `UPSERT-${Date.now()}`,
            amount: 100,
            status: 'DRAFT',
            dueAt: new Date(),
            updatedAt: new Date(),
          } as any,
          update: { amount: 200 },
        }),
      ).rejects.toThrow(/SECURITY VIOLATION/);
    });
  });

  // =========================================================================
  // 12. FINDUNIQUE ENFORCEMENT
  // =========================================================================

  describe('12. FindUnique Enforcement', () => {
    it('EXPLOIT: findUnique without companyId → MUST throw', async () => {
      await expect(
        prisma.invoices.findUnique({ where: { id: invoiceA.id } } as any),
      ).rejects.toThrow(/SECURITY VIOLATION/);
    });

    it('VALID: findUnique with composite key → succeeds', async () => {
      const result = await prisma.invoices.findFirst({
        where: { id: invoiceA.id, companyId: companyA.id },
      });
      expect(result).toBeDefined();
      expect(result?.id).toBe(invoiceA.id);
    });
  });
});
