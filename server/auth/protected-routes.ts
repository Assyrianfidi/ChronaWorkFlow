// Protected Route Definitions
// All sensitive routes with proper authorization middleware

import { Router } from 'express';
import { 
  requireAuthorization, 
  requireAdmin, 
  requireUserManagement,
  requireFinancialAccess,
  requireFinancialWrite,
  requireAccountingAccess,
  requireCompanyAccess,
  requireAuditAccess,
  requireMinimumRole,
  requireSelfAccessOrPermission,
  requireApiKey
} from './authorization.js';
import { Permission, UserRole } from './rbac.js';

const router = Router();

// ===== PUBLIC ROUTES (No authentication required) =====
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'accubooks',
    env: process.env.NODE_ENV || 'development'
  });
});

router.get('/metrics', (req, res) => {
  // Metrics endpoint - should be protected in production
  if (process.env.NODE_ENV === 'production') {
    return requireApiKey(req, res, () => {
      // Return metrics here
      res.set('Content-Type', 'text/plain');
      res.send('# Metrics placeholder');
    });
  } else {
    res.set('Content-Type', 'text/plain');
    res.send('# Metrics placeholder');
  }
});

// ===== AUTHENTICATED ROUTES (Authentication required) =====

// User profile routes
router.get('/users/profile', requireAuthorization(), (req, res) => {
  res.json({ message: 'User profile endpoint' });
});

router.put('/users/profile', requireAuthorization(), (req, res) => {
  res.json({ message: 'Update user profile endpoint' });
});

// ===== ROLE-BASED PROTECTED ROUTES =====

// User Management (Admin only)
router.get('/users', 
  requireUserManagement,
  (req, res) => {
    res.json({ message: 'List users endpoint' });
  }
);

router.post('/users', 
  requireUserManagement,
  (req, res) => {
    res.json({ message: 'Create user endpoint' });
  }
);

router.get('/users/:userId', 
  requireSelfAccessOrPermission('userId', [Permission.USER_READ]),
  (req, res) => {
    res.json({ message: 'Get user endpoint' });
  }
);

router.put('/users/:userId', 
  requireSelfAccessOrPermission('userId', [Permission.USER_WRITE]),
  (req, res) => {
    res.json({ message: 'Update user endpoint' });
  }
);

router.delete('/users/:userId', 
  requireAuthorization({ permissions: [Permission.USER_DELETE] }),
  (req, res) => {
    res.json({ message: 'Delete user endpoint' });
  }
);

// Company Management
router.get('/companies', 
  requireCompanyAccess,
  (req, res) => {
    res.json({ message: 'List companies endpoint' });
  }
);

router.post('/companies', 
  requireAuthorization({ permissions: [Permission.COMPANY_WRITE] }),
  (req, res) => {
    res.json({ message: 'Create company endpoint' });
  }
);

router.get('/companies/:companyId', 
  requireCompanyAccess,
  (req, res) => {
    res.json({ message: 'Get company endpoint' });
  }
);

router.put('/companies/:companyId', 
  requireAuthorization({ 
    permissions: [Permission.COMPANY_WRITE],
    requireCompany: true 
  }),
  (req, res) => {
    res.json({ message: 'Update company endpoint' });
  }
);

router.delete('/companies/:companyId', 
  requireAuthorization({ 
    permissions: [Permission.COMPANY_DELETE],
    requireCompany: true 
  }),
  (req, res) => {
    res.json({ message: 'Delete company endpoint' });
  }
);

// Financial Data
router.get('/financial/transactions', 
  requireFinancialAccess,
  (req, res) => {
    res.json({ message: 'List transactions endpoint' });
  }
);

router.post('/financial/transactions', 
  requireFinancialWrite,
  (req, res) => {
    res.json({ message: 'Create transaction endpoint' });
  }
);

router.get('/financial/transactions/:transactionId', 
  requireFinancialAccess,
  (req, res) => {
    res.json({ message: 'Get transaction endpoint' });
  }
);

router.put('/financial/transactions/:transactionId', 
  requireFinancialWrite,
  (req, res) => {
    res.json({ message: 'Update transaction endpoint' });
  }
);

router.delete('/financial/transactions/:transactionId', 
  requireAuthorization({ permissions: [Permission.FINANCIAL_DELETE] }),
  (req, res) => {
    res.json({ message: 'Delete transaction endpoint' });
  }
);

// Accounting
router.get('/accounting/journal-entries', 
  requireAccountingAccess,
  (req, res) => {
    res.json({ message: 'List journal entries endpoint' });
  }
);

router.post('/accounting/journal-entries', 
  requireAuthorization({ permissions: [Permission.ACCOUNTING_WRITE] }),
  (req, res) => {
    res.json({ message: 'Create journal entry endpoint' });
  }
);

router.get('/accounting/reports', 
  requireAccountingAccess,
  (req, res) => {
    res.json({ message: 'Accounting reports endpoint' });
  }
);

// Inventory
router.get('/inventory/items', 
  requireAuthorization({ permissions: [Permission.INVENTORY_READ] }),
  (req, res) => {
    res.json({ message: 'List inventory items endpoint' });
  }
);

router.post('/inventory/items', 
  requireAuthorization({ permissions: [Permission.INVENTORY_WRITE] }),
  (req, res) => {
    res.json({ message: 'Create inventory item endpoint' });
  }
);

router.put('/inventory/items/:itemId', 
  requireAuthorization({ permissions: [Permission.INVENTORY_WRITE] }),
  (req, res) => {
    res.json({ message: 'Update inventory item endpoint' });
  }
);

router.delete('/inventory/items/:itemId', 
  requireAuthorization({ permissions: [Permission.INVENTORY_DELETE] }),
  (req, res) => {
    res.json({ message: 'Delete inventory item endpoint' });
  }
);

// Payroll (Manager+)
router.get('/payroll/employees', 
  requireMinimumRole(UserRole.MANAGER),
  (req, res) => {
    res.json({ message: 'List payroll employees endpoint' });
  }
);

router.post('/payroll/run', 
  requireAuthorization({ permissions: [Permission.PAYROLL_WRITE] }),
  (req, res) => {
    res.json({ message: 'Run payroll endpoint' });
  }
);

router.get('/payroll/reports', 
  requireAuthorization({ permissions: [Permission.PAYROLL_READ] }),
  (req, res) => {
    res.json({ message: 'Payroll reports endpoint' });
  }
);

// Reports
router.get('/reports/financial', 
  requireFinancialAccess,
  (req, res) => {
    res.json({ message: 'Financial reports endpoint' });
  }
);

router.get('/reports/accounting', 
  requireAccountingAccess,
  (req, res) => {
    res.json({ message: 'Accounting reports endpoint' });
  }
);

router.get('/reports/inventory', 
  requireAuthorization({ permissions: [Permission.INVENTORY_READ] }),
  (req, res) => {
    res.json({ message: 'Inventory reports endpoint' });
  }
);

// ===== ADMIN ROUTES =====

// System Administration
router.get('/admin/system/status', 
  requireAdmin,
  (req, res) => {
    res.json({ message: 'System status endpoint' });
  }
);

router.get('/admin/system/logs', 
  requireAuditAccess,
  (req, res) => {
    res.json({ message: 'System logs endpoint' });
  }
);

router.post('/admin/system/maintenance', 
  requireAdmin,
  (req, res) => {
    res.json({ message: 'System maintenance endpoint' });
  }
);

// Audit Logs
router.get('/admin/audit-logs', 
  requireAuditAccess,
  (req, res) => {
    res.json({ message: 'Audit logs endpoint' });
  }
);

router.post('/admin/audit-logs/search', 
  requireAuditAccess,
  (req, res) => {
    res.json({ message: 'Search audit logs endpoint' });
  }
);

// User Role Management
router.put('/admin/users/:userId/role', 
  requireUserManagement,
  (req, res) => {
    res.json({ message: 'Update user role endpoint' });
  }
);

router.post('/admin/users/:userId/permissions', 
  requireUserManagement,
  (req, res) => {
    res.json({ message: 'Add user permissions endpoint' });
  }
);

router.delete('/admin/users/:userId/permissions/:permission', 
  requireUserManagement,
  (req, res) => {
    res.json({ message: 'Remove user permission endpoint' });
  }
);

// Database Management
router.get('/admin/database/status', 
  requireAdmin,
  (req, res) => {
    res.json({ message: 'Database status endpoint' });
  }
);

router.post('/admin/database/backup', 
  requireAdmin,
  (req, res) => {
    res.json({ message: 'Database backup endpoint' });
  }
);

router.post('/admin/database/restore', 
  requireAdmin,
  (req, res) => {
    res.json({ message: 'Database restore endpoint' });
  }
);

// ===== API ROUTES =====

// External API endpoints
router.get('/api/v1/companies', 
  requireApiKey,
  (req, res) => {
    res.json({ message: 'API companies endpoint' });
  }
);

router.post('/api/v1/webhooks', 
  requireApiKey,
  (req, res) => {
    res.json({ message: 'API webhook endpoint' });
  }
);

// ===== ERROR HANDLING =====

// 404 handler for protected routes
router.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'Endpoint not found',
    code: 'ENDPOINT_NOT_FOUND'
  });
});

export default router;
