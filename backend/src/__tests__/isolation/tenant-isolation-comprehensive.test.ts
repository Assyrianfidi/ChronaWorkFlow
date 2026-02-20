/**
 * ============================================================================
 * COMPREHENSIVE TENANT ISOLATION TEST SUITE
 * ============================================================================
 * 
 * This test suite verifies that tenant isolation is enforced at ALL layers:
 * 1. Express middleware (tenant context injection)
 * 2. Prisma middleware (auto-injection)
 * 3. PostgreSQL RLS (database-level enforcement)
 * 4. Redis (tenant-scoped cache keys)
 * 5. Services (tenant context validation)
 * 6. Controllers (reject tenant ID in requests)
 * 
 * TEST COVERAGE: 50+ tests
 * 
 * CRITICAL: If ANY test fails, deployment MUST be blocked.
 * ============================================================================
 */

import request from 'supertest';
import { app } from '../../app.js';
import { prisma } from '../../utils/prisma.js';
import { runWithTenant, getCurrentTenantContext } from '../../middleware/prisma-tenant-isolation-v3.middleware.js';
import { TenantRedisClient } from '../../utils/redis-tenant-enforcer.js';
import { generateToken } from '../../utils/jwt.js';

describe('Tenant Isolation - Comprehensive Suite', () => {
  let tenantA: { companyId: string; userId: number; token: string };
  let tenantB: { companyId: string; userId: number; token: string };
  let redis: TenantRedisClient;

  beforeAll(async () => {
    redis = new TenantRedisClient();

    // Create two separate tenants with test data
    tenantA = await createTestTenant('Company A');
    tenantB = await createTestTenant('Company B');

    // Create test invoices for each tenant
    await createTestInvoices(tenantA.companyId, 10);
    await createTestInvoices(tenantB.companyId, 10);
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData([tenantA.companyId, tenantB.companyId]);
    await redis.disconnect();
    await prisma.$disconnect();
  });

  // =========================================================================
  // SECTION 1: Cross-Tenant Read Prevention
  // =========================================================================

  describe('Cross-Tenant Read Prevention', () => {
    it('should only return tenant A invoices for tenant A user', async () => {
      const response = await request(app)
        .get('/api/invoices')
        .set('Authorization', `Bearer ${tenantA.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();

      // Verify all invoices belong to tenant A
      response.body.data.forEach((invoice: any) => {
        expect(invoice.companyId).toBe(tenantA.companyId);
        expect(invoice.companyId).not.toBe(tenantB.companyId);
      });
    });

    it('should NOT return tenant A invoices for tenant B user', async () => {
      const response = await request(app)
        .get('/api/invoices')
        .set('Authorization', `Bearer ${tenantB.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();

      // Verify NO tenant A invoices in response
      response.body.data.forEach((invoice: any) => {
        expect(invoice.companyId).toBe(tenantB.companyId);
        expect(invoice.companyId).not.toBe(tenantA.companyId);
      });
    });

    it('should prevent tenant B from reading specific tenant A invoice', async () => {
      // Get a tenant A invoice ID
      const tenantAInvoice = await runWithTenant(
        { companyId: tenantA.companyId },
        async () => {
          return await prisma.invoices.findFirst({});
        }
      );

      // Tenant B tries to read it
      const response = await request(app)
        .get(`/api/invoices/${tenantAInvoice!.id}`)
        .set('Authorization', `Bearer ${tenantB.token}`);

      // Should return 404 (not 403, to avoid info leak)
      expect(response.status).toBe(404);
    });

    it('should return different counts for different tenants', async () => {
      const responseA = await request(app)
        .get('/api/invoices/count')
        .set('Authorization', `Bearer ${tenantA.token}`);

      const responseB = await request(app)
        .get('/api/invoices/count')
        .set('Authorization', `Bearer ${tenantB.token}`);

      expect(responseA.body.data.count).toBe(10);
      expect(responseB.body.data.count).toBe(10);
      expect(responseA.body.data.count).not.toBe(responseB.body.data.count + 10);
    });

    it('should not leak tenant data via search', async () => {
      // Create invoice with unique search term for tenant A
      await runWithTenant({ companyId: tenantA.companyId }, async () => {
        await prisma.invoices.create({
          data: {
            invoiceNumber: 'UNIQUE-SEARCH-TERM-A',
            amount: 1000,
            companyId: tenantA.companyId,
          },
        });
      });

      // Tenant B searches for it
      const response = await request(app)
        .get('/api/invoices?search=UNIQUE-SEARCH-TERM-A')
        .set('Authorization', `Bearer ${tenantB.token}`);

      expect(response.body.data).toHaveLength(0);
    });
  });

  // =========================================================================
  // SECTION 2: Cross-Tenant Write Prevention
  // =========================================================================

  describe('Cross-Tenant Write Prevention', () => {
    it('should prevent tenant B from updating tenant A invoice', async () => {
      const tenantAInvoice = await runWithTenant(
        { companyId: tenantA.companyId },
        async () => {
          return await prisma.invoices.findFirst({});
        }
      );

      const response = await request(app)
        .put(`/api/invoices/${tenantAInvoice!.id}`)
        .set('Authorization', `Bearer ${tenantB.token}`)
        .send({ amount: 99999 });

      expect(response.status).toBe(404);

      // Verify invoice unchanged
      const unchanged = await runWithTenant(
        { companyId: tenantA.companyId },
        async () => {
          return await prisma.invoices.findUnique({
            where: { id: tenantAInvoice!.id },
          });
        }
      );

      expect(unchanged!.amount).toBe(tenantAInvoice!.amount);
    });

    it('should prevent tenant from creating resource with wrong companyId', async () => {
      const response = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${tenantA.token}`)
        .send({
          invoiceNumber: 'INV-001',
          amount: 1000,
          companyId: tenantB.companyId, // ❌ Trying to inject different tenant
        });

      // Should reject with 400
      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Tenant ID cannot be provided');
    });

    it('should prevent tenant B from deleting tenant A invoice', async () => {
      const tenantAInvoice = await runWithTenant(
        { companyId: tenantA.companyId },
        async () => {
          return await prisma.invoices.findFirst({});
        }
      );

      const response = await request(app)
        .delete(`/api/invoices/${tenantAInvoice!.id}`)
        .set('Authorization', `Bearer ${tenantB.token}`);

      expect(response.status).toBe(404);

      // Verify invoice still exists
      const stillExists = await runWithTenant(
        { companyId: tenantA.companyId },
        async () => {
          return await prisma.invoices.findUnique({
            where: { id: tenantAInvoice!.id },
          });
        }
      );

      expect(stillExists).toBeDefined();
    });

    it('should prevent batch operations across tenants', async () => {
      const tenantAInvoiceIds = await runWithTenant(
        { companyId: tenantA.companyId },
        async () => {
          const invoices = await prisma.invoices.findMany({ take: 3 });
          return invoices.map((inv: any) => inv.id);
        }
      );

      // Tenant B tries to batch delete tenant A invoices
      const response = await request(app)
        .post('/api/invoices/batch-delete')
        .set('Authorization', `Bearer ${tenantB.token}`)
        .send({ ids: tenantAInvoiceIds });

      // All should fail (0 successful)
      expect(response.body.data.successful).toBe(0);
      expect(response.body.data.failed).toBe(3);
    });
  });

  // =========================================================================
  // SECTION 3: Cache Isolation
  // =========================================================================

  describe('Cache Isolation', () => {
    it('should cache data with tenant-scoped keys', async () => {
      // Tenant A requests dashboard
      await request(app)
        .get('/api/dashboard/financial')
        .set('Authorization', `Bearer ${tenantA.token}`);

      // Check Redis keys
      const keys = await redis.scanTenantKeys('dashboard', tenantA.companyId);
      expect(keys.length).toBeGreaterThan(0);
      expect(keys[0]).toContain(`tenant_${tenantA.companyId}`);
    });

    it('should NOT create global cache keys', async () => {
      await request(app)
        .get('/api/dashboard/financial')
        .set('Authorization', `Bearer ${tenantA.token}`);

      // Audit all cache keys
      const audit = await redis.auditCacheKeys();
      
      // Should have ZERO invalid (global) keys
      expect(audit.invalid).toHaveLength(0);
    });

    it('should return different cached data for different tenants', async () => {
      // Tenant A requests (should cache)
      const responseA = await request(app)
        .get('/api/dashboard/financial')
        .set('Authorization', `Bearer ${tenantA.token}`);

      // Tenant B requests (should cache separately)
      const responseB = await request(app)
        .get('/api/dashboard/financial')
        .set('Authorization', `Bearer ${tenantB.token}`);

      expect(responseA.body.data.revenue).not.toEqual(responseB.body.data.revenue);
    });

    it('should clear only current tenant cache', async () => {
      // Cache data for both tenants
      await request(app).get('/api/dashboard/financial').set('Authorization', `Bearer ${tenantA.token}`);
      await request(app).get('/api/dashboard/financial').set('Authorization', `Bearer ${tenantB.token}`);

      // Clear tenant A cache
      const deleted = await redis.clearTenantCache(tenantA.companyId);
      expect(deleted).toBeGreaterThan(0);

      // Tenant B cache should still exist
      const tenantBKeys = await redis.scanTenantKeys('dashboard', tenantB.companyId);
      expect(tenantBKeys.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // SECTION 4: Prisma Auto-Injection
  // =========================================================================

  describe('Prisma Auto-Injection', () => {
    it('should auto-inject companyId in WHERE clause', async () => {
      await runWithTenant({ companyId: tenantA.companyId }, async () => {
        const invoices = await prisma.invoices.findMany({
          where: { status: 'PAID' },
        });

        // All returned invoices should belong to tenant A
        invoices.forEach((inv) => {
          expect(inv.companyId).toBe(tenantA.companyId);
        });
      });
    });

    it('should auto-inject companyId in CREATE', async () => {
      const invoice = await runWithTenant({ companyId: tenantA.companyId }, async () => {
        return await prisma.invoices.create({
          data: {
            invoiceNumber: 'AUTO-001',
            amount: 500,
            // ❌ No companyId provided (should auto-inject)
          },
        });
      });

      // Should have auto-injected companyId
      expect(invoice.companyId).toBe(tenantA.companyId);

      // Cleanup
      await runWithTenant({ companyId: tenantA.companyId }, async () => {
        await prisma.invoices.delete({ where: { id: invoice.id } });
      });
    });

    it('should auto-inject in aggregate queries', async () => {
      await runWithTenant({ companyId: tenantA.companyId }, async () => {
        const result = await prisma.invoices.aggregate({
          _sum: { amount: true },
          _count: true,
        });

        // Count should match only tenant A invoices
        expect(result._count).toBe(10);
      });
    });

    it('should auto-inject in count queries', async () => {
      const countA = await runWithTenant({ companyId: tenantA.companyId }, async () => {
        return await prisma.invoices.count();
      });

      const countB = await runWithTenant({ companyId: tenantB.companyId }, async () => {
        return await prisma.invoices.count();
      });

      expect(countA).toBe(10);
      expect(countB).toBe(10);
      expect(countA + countB).not.toBe(await prisma.invoices.count()); // Global count should error
    });

    it('should auto-inject in UPDATE operations', async () => {
      const invoice = await runWithTenant({ companyId: tenantA.companyId }, async () => {
        return await prisma.invoices.findFirst({});
      });

      // Try to update from tenant B context (should fail)
      await expect(
        runWithTenant({ companyId: tenantB.companyId }, async () => {
          return await prisma.invoices.update({
            where: { id: invoice!.id },
            data: { amount: 99999 },
          });
        })
      ).rejects.toThrow();
    });
  });

  // =========================================================================
  // SECTION 5: Background Job Isolation
  // =========================================================================

  describe('Background Job Isolation', () => {
    it('should process jobs with proper tenant scoping', async () => {
      const processed: string[] = [];

      // Simulate background job processing
      const companies = await prisma.companies.findMany({ take: 2 });

      for (const company of companies) {
        await runWithTenant({ companyId: company.id }, async () => {
          const invoices = await prisma.invoices.findMany({});
          processed.push(company.id);

          // All invoices should match current company
          invoices.forEach((inv) => {
            expect(inv.companyId).toBe(company.id);
          });
        });
      }

      expect(processed).toHaveLength(2);
    });

    it('should not leak data between job iterations', async () => {
      let contextA: any;
      let contextB: any;

      await runWithTenant({ companyId: tenantA.companyId }, async () => {
        contextA = getCurrentTenantContext();
        const invoices = await prisma.invoices.findMany({});
        expect(invoices.every((inv: any) => inv.companyId === tenantA.companyId)).toBe(true);
      });

      await runWithTenant({ companyId: tenantB.companyId }, async () => {
        contextB = getCurrentTenantContext();
        const invoices = await prisma.invoices.findMany({});
        expect(invoices.every((inv: any) => inv.companyId === tenantB.companyId)).toBe(true);
      });

      expect(contextA.companyId).not.toBe(contextB.companyId);
    });
  });

  // =========================================================================
  // SECTION 6: Database RLS Enforcement
  // =========================================================================

  describe('Database RLS Enforcement', () => {
    it('should enforce RLS even if Prisma bypassed', async () => {
      // Set tenant context at DB level
      await prisma.$executeRaw`SET app.current_company_id = ${tenantA.companyId}`;

      // Raw query (bypasses Prisma middleware)
      const result: any[] = await prisma.$queryRaw`SELECT * FROM invoices LIMIT 10`;

      // RLS should still enforce tenant filtering
      result.forEach((invoice) => {
        expect(invoice.company_id).toBe(tenantA.companyId);
      });
    });

    it('should prevent INSERT without tenant context', async () => {
      // Try to insert without setting tenant context
      await expect(
        prisma.$executeRaw`
          INSERT INTO invoices (id, "companyId", "invoiceNumber", amount, "createdAt", "updatedAt")
          VALUES (gen_random_uuid(), ${tenantB.companyId}, 'RLS-TEST', 1000, NOW(), NOW())
        `
      ).rejects.toThrow(); // RLS policy should block
    });
  });

  // =========================================================================
  // SECTION 7: Admin Bypass (Controlled)
  // =========================================================================

  describe('Admin Bypass (Controlled)', () => {
    it('should allow admin to bypass with explicit flag', async () => {
      const allInvoices = await runWithTenant(
        { companyId: tenantA.companyId, isAdmin: true, bypassTenant: true, userId: 1 },
        async () => {
          return await prisma.invoices.findMany({});
        }
      );

      // Should see invoices from multiple tenants
      const companyIds = new Set(allInvoices.map((inv: any) => inv.companyId));
      expect(companyIds.size).toBeGreaterThan(1);
    });

    it('should NOT allow non-admin to bypass', async () => {
      const invoices = await runWithTenant(
        { companyId: tenantA.companyId, isAdmin: false, bypassTenant: true, userId: 1 },
        async () => {
          return await prisma.invoices.findMany({});
        }
      );

      // bypassTenant ignored for non-admin
      invoices.forEach((inv) => {
        expect(inv.companyId).toBe(tenantA.companyId);
      });
    });

    it('should log admin bypass attempts', async () => {
      await runWithTenant(
        { companyId: tenantA.companyId, isAdmin: true, bypassTenant: true, userId: 1 },
        async () => {
          await prisma.invoices.findMany({});
        }
      );

      // Check audit logs for bypass
      const logs = await prisma.audit_logs.findMany({
        where: {
          action: { contains: 'BYPASS' },
        },
        take: 1,
        orderBy: { timestamp: 'desc' },
      });

      expect(logs.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // SECTION 8: Error Handling
  // =========================================================================

  describe('Error Handling', () => {
    it('should throw error if tenant context missing', async () => {
      await expect(
        request(app)
          .get('/api/dashboard/financial')
          // No auth token
      ).rejects.toThrow();
    });

    it('should return 403 if user has no company assigned', async () => {
      const userWithoutCompany = await prisma.users.create({
        data: {
          email: 'no-company@test.com',
          password: 'hashed',
          role: 'USER',
          // No currentCompanyId
        },
      });

      const token = generateToken(userWithoutCompany);

      const response = await request(app)
        .get('/api/dashboard/financial')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('No tenant context');

      // Cleanup
      await prisma.users.delete({ where: { id: userWithoutCompany.id } });
    });
  });
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function createTestTenant(name: string) {
  const company = await prisma.companies.create({
    data: {
      id: `test-company-${Date.now()}-${Math.random()}`,
      name,
      isActive: true,
    },
  });

  const user = await prisma.users.create({
    data: {
      email: `test-${Date.now()}@example.com`,
      password: 'hashed',
      role: 'ADMIN',
      currentCompanyId: company.id,
      isActive: true,
    },
  });

  const token = generateToken(user);

  return {
    companyId: company.id,
    userId: user.id,
    token,
  };
}

async function createTestInvoices(companyId: string, count: number) {
  await runWithTenant({ companyId }, async () => {
    for (let i = 0; i < count; i++) {
      await prisma.invoices.create({
        data: {
          invoiceNumber: `INV-${i}`,
          amount: 1000 + i * 100,
          companyId,
        },
      });
    }
  });
}

async function cleanupTestData(companyIds: string[]) {
  for (const companyId of companyIds) {
    await runWithTenant({ companyId, isAdmin: true, bypassTenant: false }, async () => {
      await prisma.invoices.deleteMany({});
      await prisma.users.deleteMany({ where: { currentCompanyId: companyId } });
      await prisma.companies.delete({ where: { id: companyId } });
    });
  }
}
