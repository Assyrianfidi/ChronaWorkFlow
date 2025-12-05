import request from 'supertest';
import express from 'express';
import DatabaseSecurityService from '../../services/databaseSecurity.service.js';
import { 
  requireDatabasePermission, 
  validateDatabaseConstraints, 
  validateSensitiveFieldAccess,
  filterSensitiveResponseData 
} from '../../middleware/security/databaseSecurity.middleware.js';

// Mock Prisma Client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn()
    },
    account: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn()
    },
    inventoryItem: {
      findFirst: jest.fn(),
      findUnique: jest.fn()
    },
    category: {
      findFirst: jest.fn(),
      findUnique: jest.fn()
    },
    companyMember: {
      findFirst: jest.fn(),
      findUnique: jest.fn()
    },
    reconciliationReport: {
      findFirst: jest.fn(),
      findUnique: jest.fn()
    },
    refreshToken: {
      count: jest.fn()
    },
    transaction: {
      count: jest.fn()
    }
  }))
}));

// Mock roles constants
jest.mock('../../constants/roles.js', () => ({
  ROLES: {
    ADMIN: 'admin',
    MANAGER: 'manager',
    USER: 'user',
    AUDITOR: 'auditor',
    INVENTORY_MANAGER: 'inventory_manager'
  },
  ROLES_HIERARCHY: {
    admin: 4,
    manager: 3,
    auditor: 2,
    inventory_manager: 2,
    user: 1
  }
}));

describe('Database Security Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear in-memory attempts
    DatabaseSecurityService._unauthorizedAttempts = [];
  });

  describe('Permission Checking', () => {
    it('should allow admin full access', () => {
      const adminUser = { id: 1, role: 'admin', currentCompanyId: 'company1' };
      
      expect(DatabaseSecurityService.hasPermission(adminUser, 'accounts', 'read')).toBe(true);
      expect(DatabaseSecurityService.hasPermission(adminUser, 'accounts', 'write')).toBe(true);
      expect(DatabaseSecurityService.hasPermission(adminUser, 'accounts', 'delete')).toBe(true);
      expect(DatabaseSecurityService.hasPermission(adminUser, 'users', 'write')).toBe(true);
    });

    it('should allow managers appropriate access', () => {
      const managerUser = { id: 2, role: 'manager', currentCompanyId: 'company1' };
      
      expect(DatabaseSecurityService.hasPermission(managerUser, 'accounts', 'read', { companyId: 'company1' })).toBe(true);
      expect(DatabaseSecurityService.hasPermission(managerUser, 'accounts', 'write', { companyId: 'company1' })).toBe(true);
      expect(DatabaseSecurityService.hasPermission(managerUser, 'accounts', 'delete', { companyId: 'company1' })).toBe(true);
      expect(DatabaseSecurityService.hasPermission(managerUser, 'users', 'write')).toBe(false);
      expect(DatabaseSecurityService.hasPermission(managerUser, 'users', 'read')).toBe(true);
    });

    it('should allow users limited access', () => {
      const regularUser = { id: 3, role: 'user', currentCompanyId: 'company1' };
      
      expect(DatabaseSecurityService.hasPermission(regularUser, 'accounts', 'read', { companyId: 'company1' })).toBe(true);
      expect(DatabaseSecurityService.hasPermission(regularUser, 'accounts', 'write')).toBe(false);
      expect(DatabaseSecurityService.hasPermission(regularUser, 'transactions', 'read', { companyId: 'company1' })).toBe(true);
      expect(DatabaseSecurityService.hasPermission(regularUser, 'transactions', 'write')).toBe(false);
    });

    it('should enforce company ownership for accounts', () => {
      const user = { id: 4, role: 'user', currentCompanyId: 'company1' };
      
      expect(DatabaseSecurityService.hasPermission(user, 'accounts', 'read', { companyId: 'company1' })).toBe(true);
      expect(DatabaseSecurityService.hasPermission(user, 'accounts', 'read', { companyId: 'company2' })).toBe(false);
    });

    it('should reject unauthenticated users', () => {
      expect(DatabaseSecurityService.hasPermission(null, 'accounts', 'read')).toBe(false);
      expect(DatabaseSecurityService.hasPermission(undefined, 'accounts', 'read')).toBe(false);
    });
  });

  describe('Unauthorized Access Logging', () => {
    it('should log unauthorized access attempts', () => {
      const attempt = {
        userId: 1,
        userRole: 'user',
        resource: 'accounts',
        action: 'write',
        ip: '127.0.0.1',
        userAgent: 'test-agent'
      };

      DatabaseSecurityService.logUnauthorizedAccess(attempt);
      
      const attempts = DatabaseSecurityService.getUnauthorizedAttempts();
      expect(attempts).toHaveLength(1);
      expect(attempts[0]).toMatchObject(attempt);
      expect(attempts[0].timestamp).toBeDefined();
    });

    it('should limit stored attempts to 100', () => {
      // Add 101 attempts
      for (let i = 0; i < 101; i++) {
        DatabaseSecurityService.logUnauthorizedAccess({
          userId: i,
          userRole: 'user',
          resource: 'accounts',
          action: 'write',
          ip: '127.0.0.1',
          userAgent: 'test-agent'
        });
      }

      const attempts = DatabaseSecurityService.getUnauthorizedAttempts();
      // Should keep only last 100 entries (removes first 1)
      expect(attempts).toHaveLength(100);
      // Should contain the last entry (userId = 100)
      expect(attempts[attempts.length - 1].userId).toBe(100);
    });

    it('should block users after too many attempts', () => {
      // Add 11 attempts from same user/IP
      for (let i = 0; i < 11; i++) {
        DatabaseSecurityService.logUnauthorizedAccess({
          userId: 1,
          userRole: 'user',
          resource: 'accounts',
          action: 'write',
          ip: '127.0.0.1',
          userAgent: 'test-agent',
          timestamp: new Date().toISOString()
        });
      }

      expect(DatabaseSecurityService.isBlocked(1, '127.0.0.1')).toBe(true);
      expect(DatabaseSecurityService.isBlocked(2, '127.0.0.2')).toBe(false);
    });
  });

  describe('Sensitive Field Access', () => {
    it('should allow admin access to all sensitive fields', () => {
      const admin = { role: 'admin' };
      
      expect(DatabaseSecurityService.canAccessSensitiveField(admin, 'password')).toBe(true);
      expect(DatabaseSecurityService.canAccessSensitiveField(admin, 'email')).toBe(true);
      expect(DatabaseSecurityService.canAccessSensitiveField(admin, 'salary')).toBe(true);
    });

    it('should restrict user access to sensitive fields', () => {
      const user = { role: 'user' };
      
      expect(DatabaseSecurityService.canAccessSensitiveField(user, 'password')).toBe(false);
      expect(DatabaseSecurityService.canAccessSensitiveField(user, 'email')).toBe(false);
      expect(DatabaseSecurityService.canAccessSensitiveField(user, 'salary')).toBe(false);
    });

    it('should allow managers access to some sensitive fields', () => {
      const manager = { role: 'manager' };
      
      expect(DatabaseSecurityService.canAccessSensitiveField(manager, 'password')).toBe(false);
      expect(DatabaseSecurityService.canAccessSensitiveField(manager, 'email')).toBe(true);
      expect(DatabaseSecurityService.canAccessSensitiveField(manager, 'salary')).toBe(true);
    });
  });

  describe('Row-Level Security Filters', () => {
    it('should return empty filter for admin', () => {
      const admin = { id: 1, role: 'admin', currentCompanyId: 'company1' };
      
      expect(DatabaseSecurityService.getRowLevelSecurityFilter(admin, 'Account')).toEqual({});
      expect(DatabaseSecurityService.getRowLevelSecurityFilter(admin, 'Transaction')).toEqual({});
    });

    it('should return company filter for non-admin users', () => {
      const user = { id: 2, role: 'user', currentCompanyId: 'company1', tenantId: 'tenant1' };
      
      expect(DatabaseSecurityService.getRowLevelSecurityFilter(user, 'Account')).toEqual({
        companyId: 'company1'
      });
      
      expect(DatabaseSecurityService.getRowLevelSecurityFilter(user, 'InventoryItem')).toEqual({
        tenantId: 'tenant1'
      });
    });

    it('should throw error for unauthenticated users', () => {
      expect(() => {
        DatabaseSecurityService.getRowLevelSecurityFilter(null, 'Account');
      }).toThrow('User authentication required');
    });
  });

  describe('Database Constraint Validation', () => {
    it('should validate email format', () => {
      const result = DatabaseSecurityService.validateConstraints('User', { email: 'invalid-email' }, 'create');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });

    it('should validate account code format', () => {
      const result = DatabaseSecurityService.validateConstraints('Account', { code: 'abc' }, 'create');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Account code must be 3-10 uppercase alphanumeric characters');
    });

    it('should validate SKU format', () => {
      const result = DatabaseSecurityService.validateConstraints('InventoryItem', { sku: 'invalid sku' }, 'create');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('SKU must be 3-20 uppercase alphanumeric characters with hyphens');
    });

    it('should prevent deletion of records with dependencies', () => {
      const userResult = DatabaseSecurityService.validateConstraints('User', {}, 'delete');
      expect(userResult.isValid).toBe(false);
      expect(userResult.errors).toContain('Cannot delete user with existing records');

      const accountResult = DatabaseSecurityService.validateConstraints('Account', {}, 'delete');
      expect(accountResult.isValid).toBe(false);
      expect(accountResult.errors).toContain('Cannot delete account with existing transactions');
    });
  });
});

describe('Database Security Middleware', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Mock authentication middleware
    const mockAuth = (req, res, next) => {
      if (req.headers.authorization) {
        req.user = { id: 1, role: 'admin', currentCompanyId: 'company1' };
      }
      next();
    };
    
    // Add test routes with security middleware
    app.get('/accounts', 
      mockAuth,
      requireDatabasePermission('accounts', 'read'),
      (req, res) => res.json({ message: 'accounts accessed' })
    );
    
    app.post('/accounts', 
      mockAuth,
      requireDatabasePermission('accounts', 'write'),
      validateDatabaseConstraints('Account', 'create'),
      (req, res) => res.json({ message: 'account created' })
    );
    
    app.post('/sensitive', 
      mockAuth,
      validateSensitiveFieldAccess,
      (req, res) => res.json({ message: 'sensitive data processed' })
    );
  });

  describe('Permission Middleware', () => {
    it('should allow access with proper permissions', async () => {
      const response = await request(app)
        .get('/accounts')
        .set('Authorization', 'Bearer token');
      
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('accounts accessed');
    });

    it('should reject access without authentication', async () => {
      const response = await request(app)
        .get('/accounts');
      
      expect(response.status).toBe(401);
    });
  });

  describe('Sensitive Field Validation', () => {
    it('should allow sensitive fields for admin users', async () => {
      const response = await request(app)
        .post('/sensitive')
        .set('Authorization', 'Bearer token')
        .send({ password: 'secret123', email: 'test@example.com' });
      
      expect(response.status).toBe(200);
    });

    it('should reject requests without authentication', async () => {
      const response = await request(app)
        .post('/sensitive')
        .send({ password: 'secret123', email: 'test@example.com' });
      
      expect(response.status).toBe(401);
    });
  });
});

describe('Database Constraints Service', () => {
  // Import after mocking
  const { PrismaClient } = require('@prisma/client');
  let mockPrisma: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma = new PrismaClient();
    
    // Ensure all required methods are properly mocked
    mockPrisma.user = {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn()
    };
    mockPrisma.account = {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn()
    };
    mockPrisma.refreshToken = {
      count: jest.fn()
    };
    mockPrisma.transaction = {
      count: jest.fn()
    };
    
    // Inject the mock Prisma client
    const DatabaseConstraintsService = require('../../services/databaseConstraints.service.js').default;
    DatabaseConstraintsService.setPrismaInstance(mockPrisma);
  });

  describe('Unique Constraint Validation', () => {
    it('should detect duplicate emails', async () => {
      const DatabaseConstraintsService = require('../../services/databaseConstraints.service.js').default;
      
      // Mock the Prisma client methods
      mockPrisma.user.findFirst = jest.fn().mockResolvedValue({ id: 1, email: 'test@example.com' });
      
      const result = await DatabaseConstraintsService.validateUniqueConstraints('User', { email: 'test@example.com' });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email already exists');
    });

    it('should detect duplicate account codes in same company', async () => {
      const DatabaseConstraintsService = require('../../services/databaseConstraints.service.js').default;
      
      mockPrisma.account.findFirst = jest.fn().mockResolvedValue({ id: 1, code: 'CASH', companyId: 'company1' });
      
      const result = await DatabaseConstraintsService.validateUniqueConstraints('Account', { 
        code: 'CASH', 
        companyId: 'company1' 
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Account code already exists in this company');
    });

    it('should allow duplicate account codes in different companies', async () => {
      const DatabaseConstraintsService = require('../../services/databaseConstraints.service.js').default;
      
      mockPrisma.account.findFirst = jest.fn().mockResolvedValue(null);
      
      const result = await DatabaseConstraintsService.validateUniqueConstraints('Account', { 
        code: 'CASH', 
        companyId: 'company2' 
      });
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Foreign Key Constraint Validation', () => {
    it('should detect invalid parent account', async () => {
      const DatabaseConstraintsService = require('../../services/databaseConstraints.service.js').default;
      
      mockPrisma.account.findUnique = jest.fn().mockResolvedValue(null);
      
      const result = await DatabaseConstraintsService.validateForeignKeyConstraints('Account', { 
        parentId: 'invalid-id',
        companyId: 'company1'
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Parent account not found');
    });

    it('should detect parent account from different company', async () => {
      const DatabaseConstraintsService = require('../../services/databaseConstraints.service.js').default;
      
      mockPrisma.account.findUnique = jest.fn().mockResolvedValue({ 
        id: 'parent-id', 
        companyId: 'company2' 
      });
      
      const result = await DatabaseConstraintsService.validateForeignKeyConstraints('Account', { 
        parentId: 'parent-id',
        companyId: 'company1'
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Parent account must belong to the same company');
    });
  });

  describe('Business Rules Validation', () => {
    it('should prevent self-referencing account hierarchy', async () => {
      const DatabaseConstraintsService = require('../../services/databaseConstraints.service.js').default;
      
      const result = await DatabaseConstraintsService.validateBusinessRules('Account', { 
        id: 'account-id',
        parentId: 'account-id'
      }, 'create');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Account cannot be its own parent');
    });

    it('should enforce password strength requirements', async () => {
      const DatabaseConstraintsService = require('../../services/databaseConstraints.service.js').default;
      
      const result = await DatabaseConstraintsService.validateBusinessRules('User', { 
        password: 'weak'
      }, 'create');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
    });

    it('should prevent negative inventory quantities', async () => {
      const DatabaseConstraintsService = require('../../services/databaseConstraints.service.js').default;
      
      const result = await DatabaseConstraintsService.validateBusinessRules('InventoryItem', { 
        quantity: -5
      }, 'create');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Quantity cannot be negative');
    });

    it('should enforce selling price >= cost price', async () => {
      const DatabaseConstraintsService = require('../../services/databaseConstraints.service.js').default;
      
      const result = await DatabaseConstraintsService.validateBusinessRules('InventoryItem', { 
        costPrice: 100,
        sellingPrice: 80
      }, 'create');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Selling price must be greater than or equal to cost price');
    });
  });

  describe('Comprehensive Validation', () => {
    it('should perform all validation types', async () => {
      // Mock all constraint checks to fail
      mockPrisma.user.findFirst = jest.fn().mockResolvedValue({ id: 1, email: 'test@example.com' });
      mockPrisma.account.findUnique = jest.fn().mockResolvedValue(null);
      
      const DatabaseConstraintsService = require('../../services/databaseConstraints.service.js').default;
      const result = await DatabaseConstraintsService.validate('User', { 
        email: 'test@example.com',
        password: 'weak'
      }, 'create');
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
