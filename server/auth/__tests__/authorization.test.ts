// Authorization Tests
// Comprehensive test suite for RBAC and authorization middleware

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { rbacService, UserRole, Permission, User } from '../rbac.js';
import { 
  requireAuthorization, 
  requireAdmin, 
  requireUserManagement,
  requireFinancialAccess,
  requireMinimumRole,
  requireSelfAccessOrPermission,
  requireApiKey
} from '../authorization.js';

describe('RBAC Service', () => {
  let testUser: User;
  let adminUser: User;
  let superAdminUser: User;

  beforeEach(() => {
    vi.clearAllMocks();
    testUser = {
      id: 'user-1',
      email: 'user@test.com',
      role: UserRole.EMPLOYEE,
      companyId: 'company-1',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    adminUser = {
      id: 'admin-1',
      email: 'admin@test.com',
      role: UserRole.ADMIN,
      companyId: 'company-1',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    superAdminUser = {
      id: 'super-admin-1',
      email: 'super@test.com',
      role: UserRole.SUPER_ADMIN,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  });

  describe('Permission Management', () => {
    it('should return correct permissions for roles', () => {
      const employeePerms = rbacService.getRolePermissions(UserRole.EMPLOYEE);
      expect(employeePerms).toContain(Permission.USER_READ);
      expect(employeePerms).toContain(Permission.FINANCIAL_READ);
      expect(employeePerms).not.toContain(Permission.USER_DELETE);

      const adminPerms = rbacService.getRolePermissions(UserRole.ADMIN);
      expect(adminPerms).toContain(Permission.USER_DELETE);
      expect(adminPerms).toContain(Permission.SYSTEM_WRITE);
    });

    it('should check user permissions correctly', () => {
      expect(rbacService.hasPermission(testUser, Permission.USER_READ)).toBe(true);
      expect(rbacService.hasPermission(testUser, Permission.USER_DELETE)).toBe(false);
      expect(rbacService.hasPermission(adminUser, Permission.USER_DELETE)).toBe(true);
    });

    it('should handle inactive users', () => {
      const inactiveUser = { ...testUser, isActive: false };
      expect(rbacService.hasPermission(inactiveUser, Permission.USER_READ)).toBe(false);
    });

    it('should check company access correctly', () => {
      expect(rbacService.canAccessCompany(testUser, 'company-1')).toBe(true);
      expect(rbacService.canAccessCompany(testUser, 'company-2')).toBe(false);
      expect(rbacService.canAccessCompany(superAdminUser, 'any-company')).toBe(true);
    });

    it('should validate role hierarchy', () => {
      expect(rbacService.canManageRole(adminUser, UserRole.EMPLOYEE)).toBe(true);
      expect(rbacService.canManageRole(adminUser, UserRole.ADMIN)).toBe(false);
      expect(rbacService.canManageRole(superAdminUser, UserRole.ADMIN)).toBe(true);
    });
  });

  describe('Data Filtering', () => {
    it('should filter sensitive data for non-admin users', () => {
      const sensitiveData = {
        id: '1',
        name: 'Test',
        salary: 50000,
        ssn: '123-45-6789'
      };

      const filtered = rbacService.filterSensitiveData(testUser, sensitiveData, ['salary', 'ssn']);
      expect(filtered).toEqual({ id: '1', name: 'Test' });

      const adminFiltered = rbacService.filterSensitiveData(adminUser, sensitiveData, ['salary', 'ssn']);
      expect(adminFiltered).toEqual(sensitiveData);
    });
  });
});

describe('Authorization Middleware', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('requireAuthorization', () => {
    it('should deny access without authentication', async () => {
      app.get('/protected', requireAuthorization(), (req, res) => {
        res.json({ message: 'success' });
      });

      const response = await request(app).get('/protected');
      expect(response.status).toBe(401);
      expect(response.body.code).toBe('AUTH_REQUIRED');
    });

    it('should deny access with insufficient permissions', async () => {
      const mockUser = {
        id: 'user-1',
        role: UserRole.EMPLOYEE,
        isActive: true,
        permissions: [Permission.USER_READ]
      };

      app.get('/protected', requireAuthorization({
        permissions: [Permission.USER_DELETE]
      }), (req, res) => {
        res.json({ message: 'success' });
      });

      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer token');

      // Mock the auth context
      const originalGetAuthContext = rbacService.getAuthContext;
      rbacService.getAuthContext = jest.fn().mockReturnValue({
        user: mockUser,
        permissions: [Permission.USER_READ]
      });

      const response2 = await request(app).get('/protected');
      expect(response2.status).toBe(403);
      expect(response2.body.code).toBe('INSUFFICIENT_PERMISSIONS');

      // Restore original method
      rbacService.getAuthContext = originalGetAuthContext;
    });
  });

  describe('Fail-Closed Behavior', () => {
    it('should fail closed when authorization engine throws', async () => {
      const prismaStub = {} as any;
      const { AuthorizationEngine } = await import('../../auth/authorization-engine.js');
      const { ApiAuthorizationGuard } = await import('../../auth/authorization-guards.js');

      const engine = new AuthorizationEngine(prismaStub as any);
      (engine as any).authorize = vi.fn().mockRejectedValue(new Error('boom'));
      const guard = new ApiAuthorizationGuard(engine);

      app.get(
        '/guarded',
        (req: any, _res, next) => {
          req.tenantContext = {
            tenantId: 'tn_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
            tenant: { id: 'tn_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', name: 't', slug: 't', subscriptionPlan: 'x', subscriptionStatus: 'y', maxUsers: 1, isActive: true },
            userRole: 'OWNER',
            permissions: ['users:read'],
            isOwner: true,
            isAdmin: false,
            isManager: false,
          };
          next();
        },
        guard.requirePermission({ permission: 'users:read' }),
        (_req, res) => res.json({ ok: true }),
      );

      const resp = await request(app).get('/guarded');
      expect(resp.status).toBe(500);
      expect(resp.body.code).toBe('AUTHORIZATION_ERROR');
    });
  });

  describe('requireMinimumRole', () => {
    it('should allow access with sufficient role', async () => {
      const mockUser = {
        id: 'admin-1',
        role: UserRole.ADMIN,
        isActive: true,
        permissions: []
      };

      app.get('/admin-only', requireMinimumRole(UserRole.MANAGER), (req, res) => {
        res.json({ message: 'success' });
      });

      const originalGetAuthContext = rbacService.getAuthContext;
      rbacService.getAuthContext = jest.fn().mockReturnValue({
        user: mockUser,
        permissions: []
      });

      const response = await request(app).get('/admin-only');
      expect(response.status).toBe(200);

      rbacService.getAuthContext = originalGetAuthContext;
    });

    it('should deny access with insufficient role', async () => {
      const mockUser = {
        id: 'user-1',
        role: UserRole.EMPLOYEE,
        isActive: true,
        permissions: []
      };

      app.get('/manager-only', requireMinimumRole(UserRole.MANAGER), (req, res) => {
        res.json({ message: 'success' });
      });

      const originalGetAuthContext = rbacService.getAuthContext;
      rbacService.getAuthContext = jest.fn().mockReturnValue({
        user: mockUser,
        permissions: []
      });

      const response = await request(app).get('/manager-only');
      expect(response.status).toBe(403);
      expect(response.body.code).toBe('INSUFFICIENT_ROLE_LEVEL');

      rbacService.getAuthContext = originalGetAuthContext;
    });
  });

  describe('requireApiKey', () => {
    it('should allow access with valid API key', async () => {
      process.env.API_KEY = 'test-api-key';

      app.get('/api-endpoint', requireApiKey, (req, res) => {
        res.json({ message: 'success' });
      });

      const response = await request(app)
        .get('/api-endpoint')
        .set('X-API-Key', 'test-api-key');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('success');

      delete process.env.API_KEY;
    });

    it('should deny access without API key', async () => {
      app.get('/api-endpoint', requireApiKey, (req, res) => {
        res.json({ message: 'success' });
      });

      const response = await request(app).get('/api-endpoint');
      expect(response.status).toBe(401);
      expect(response.body.code).toBe('API_KEY_REQUIRED');
    });

    it('should deny access with invalid API key', async () => {
      process.env.API_KEY = 'correct-key';

      app.get('/api-endpoint', requireApiKey, (req, res) => {
        res.json({ message: 'success' });
      });

      const response = await request(app)
        .get('/api-endpoint')
        .set('X-API-Key', 'wrong-key');

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('INVALID_API_KEY');

      delete process.env.API_KEY;
    });
  });

  describe('Self-Access', () => {
    it('should allow users to access their own resources', async () => {
      const mockUser = {
        id: 'user-123',
        role: UserRole.EMPLOYEE,
        isActive: true,
        permissions: []
      };

      app.get('/users/:userId', 
        requireSelfAccessOrPermission('userId', [Permission.USER_READ]),
        (req, res) => {
          res.json({ message: 'success' });
        }
      );

      const originalGetAuthContext = rbacService.getAuthContext;
      rbacService.getAuthContext = jest.fn().mockReturnValue({
        user: mockUser,
        permissions: []
      });

      const response = await request(app).get('/users/user-123');
      expect(response.status).toBe(200);

      rbacService.getAuthContext = originalGetAuthContext;
    });

    it('should deny access to other users resources without permission', async () => {
      const testApp = express();
      testApp.use(express.json());
      
      const mockUser = {
        id: 'user-123',
        role: UserRole.EMPLOYEE,
        isActive: true,
        permissions: []
      };

      // Mock getUserPermissions to return no permissions
      const originalGetUserPermissions = rbacService.getUserPermissions;
      rbacService.getUserPermissions = jest.fn().mockReturnValue([]);

      // Set up authentication middleware first
      testApp.use((req, res, next) => {
        (req as any).user = mockUser;
        next();
      });

      testApp.get('/users/:userId', 
        requireSelfAccessOrPermission('userId', [Permission.USER_READ]),
        (req, res) => {
          res.json({ message: 'success' });
        }
      );

      const response = await request(testApp).get('/users/other-user');
      expect(response.status).toBe(403);
      expect(response.body.code).toBe('SELF_ACCESS_DENIED');

      // Restore original method
      rbacService.getUserPermissions = originalGetUserPermissions;
    });
  });
});

describe('Integration Tests', () => {
  it('should handle complex authorization scenarios', async () => {
    const app = express();
    app.use(express.json());

    const mockAdmin = {
      id: 'admin-1',
      role: UserRole.ADMIN,
      companyId: 'company-1',
      isActive: true,
      permissions: [Permission.USER_ADMIN, Permission.FINANCIAL_READ]
    };

    const originalGetAuthContext = rbacService.getAuthContext;
    rbacService.getAuthContext = jest.fn().mockReturnValue({
      user: mockAdmin,
      permissions: [Permission.USER_ADMIN, Permission.FINANCIAL_READ]
    });

    // Route requiring user admin permission
    app.get('/admin/users', requireUserManagement, (req, res) => {
      res.json({ message: 'users list' });
    });

    // Route requiring financial access
    app.get('/financial/data', requireFinancialAccess, (req, res) => {
      res.json({ message: 'financial data' });
    });

    // Route requiring specific company access
    app.get('/companies/:companyId/data', 
      requireAuthorization({ 
        permissions: [Permission.COMPANY_READ],
        requireCompany: true 
      }), 
      (req, res) => {
        res.json({ message: 'company data' });
      }
    );

    // Test successful access
    const usersResponse = await request(app).get('/admin/users');
    expect(usersResponse.status).toBe(200);

    const financialResponse = await request(app).get('/financial/data');
    expect(financialResponse.status).toBe(200);

    const companyResponse = await request(app).get('/companies/company-1/data');
    expect(companyResponse.status).toBe(200);

    // Test company access denial
    const otherCompanyResponse = await request(app).get('/companies/company-2/data');
    expect(otherCompanyResponse.status).toBe(403);

    rbacService.getAuthContext = originalGetAuthContext;
  });
});
