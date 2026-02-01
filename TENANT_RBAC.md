# Tenant-Aware RBAC & Permission Authority Documentation

## Overview

This document outlines the comprehensive Role-Based Access Control (RBAC) system implemented for AccuBooks-Chronaworkflow. The system provides **authoritative, tenant-aware access control** with **deterministic security enforcement** and **zero tolerance for privilege escalation**.

## 🔒 CRITICAL SECURITY REQUIREMENTS

### Non-Negotiable Rules
1. **ALL authorization decisions go through the central engine**
2. **Permissions are explicit, server-side only, deny-by-default**
3. **Roles are permission bundles only - never checked directly**
4. **Cross-tenant access is IMPOSSIBLE by design**
5. **Missing permissions result in HARD FAILURE**
6. **All security events are logged and monitored**

### Threat Model
- **Internal malicious actors** (not just external attacks)
- **Privilege escalation attempts**
- **Cross-tenant data access**
- **Permission enumeration attacks**
- **Role-based bypass attempts**

---

## 🏗️ Architecture Overview

### Multi-Layer Authorization Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    Permission Registry                           │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │           Canonical Permission Definitions              │ │
│  │  • String-based permissions (domain:action:scope)      │ │
│  │  • Role → Permission mappings (explicit only)         │ │
│  │  • Domain grouping (billing, users, accounting, etc.)    │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                Central Authorization Engine                    │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │           Single Source of Truth for All Decisions     │ │
│  │  • authorize(permission, context, resource?)           │ │
│  │  • Tenant membership validation                     │ │
│  │  • Role-derived permission checks                   │ │
│  │  • Resource ownership validation                    │ │
│  │  • Deterministic failure handling                    │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                API & Service Layer Guards                    │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │           API Boundary Protection                        │ │
│  │  • requirePermission middleware                       │
│  │  • Service layer guards                               │
│  │  • Resource-scoped validation                       │
│  │  • Internal service call prevention                   │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                Resource-Scoped Permissions                 │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │           Tenant-Scoped Resource Access                 │ │
│  │  • ID probing attack prevention                     │
│  │  • Cross-tenant access blocking                     │
│  │  • Error message sanitization                       │
│  │  • Resource existence hiding                        │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                Least-Privilege Enforcement                   │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │           Minimal Default Permissions                  │ │
│  │  • New users get minimal permissions               │ │
│  │  • New features default to NO access                 │
│  │  • Missing permission mappings fail CI               │
│  │  • Explicit permission grants required               │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    RBAC Auditing & Observability              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │           Comprehensive Security Logging                 │
│  │  • Permission denials                                 │ │
│  │  • Privilege escalations                              │ │
│  │  • Suspicious access attempts                         │
│  │  • Role changes                                      │
│  │  • Tenant-safe sanitization                         │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Permission Model (Authoritative)

### Permission Structure

**Format**: `domain:action[:scope]`

**Domains**:
- `billing` - Billing and subscription operations
- `users` - User management and access control  
- `accounting` - Financial data and transactions
- `reports` - Reporting and analytics
- `system` - System administration
- `inventory` - Inventory and stock management

**Examples**:
- `billing:read` - Read billing information
- `users:invite` - Invite users to tenant
- `accounting:transaction:create` - Create financial transactions
- `reports:export:all` - Export all reports
- `system:admin` - Full system administration

### Role → Permission Mappings

| Role | Permissions Count | Key Permissions |
|------|-------------------|----------------|
| **OWNER** | 45+ | All tenant permissions except system admin |
| **ADMIN** | 35+ | High-level administrative permissions |
| **MANAGER** | 25+ | Business operations permissions |
| **EMPLOYEE** | 15+ | Basic operational permissions |
| **VIEWER** | 5+ | Read-only permissions |

### Critical Rules

- ✅ **Permissions are strings only** - no complex objects
- ✅ **Roles are permission bundles** - never checked directly
- ✅ **All mappings are explicit** - no implicit permissions
- ✅ **Missing permissions = hard failure**
- ✅ **CI validates all mappings**

---

## 🔧 Central Authorization Engine

### Core Authorization Method

```typescript
const result = await authorizationEngine.authorize({
  permission: 'users:delete',
  tenantContext,
  resource: {
    type: 'users',
    id: 'user-123',
    ownerId: 'owner-456',
    tenantId: 'tn_abc123...'
  },
  context: {
    operation: 'delete_user',
    requestId: 'req-123',
    userId: 'user-789'
  }
});
```

### Validation Pipeline

1. **Request Structure Validation**
   - Permission exists and is valid
   - Tenant context is present and valid
   - User ID is present
   - Resource parameters are valid

2. **Tenant Context Validation**
   - Tenant exists and is active
   - User is tenant member
   - User membership is active
   - Role matches database record

3. **Permission Check**
   - User has required permission for role
   - Permission caching for performance
   - Permission registry validation

4. **Resource Ownership Validation** (if applicable)
   - Resource belongs to tenant
   - User owns resource or has admin override
   - Resource exists and is accessible

5. **Deterministic Result**
   - **Authorized**: Success with detailed context
   - **Denied**: Hard failure with specific reason
   - **Error**: Fail-safe denial

### Security Features

- **Fail-Safe Design**: Any error results in denial
- **Caching**: Permission caching with TTL for performance
- **Audit Logging**: All decisions logged with context
- **Security Alerts**: Suspicious patterns trigger alerts
- **Metrics**: Comprehensive authorization metrics

---

## 🛡️ API & Service Layer Enforcement

### API Layer Protection

```typescript
// Single permission requirement
app.delete('/users/:id', 
  requirePermission(authorizationEngine, {
    permission: 'users:delete',
    resource: {
      type: 'users',
      idParam: 'id'
    }
  }),
  userController.deleteUser
);

// Multiple permission options
app.post('/reports/export',
  requireAnyPermission(authorizationEngine, [
    'reports:export',
    'reports:export:all'
  ]),
  reportController.exportReport
);

// All permissions required
app.delete('/system/reset',
  requireAllPermissions(authorizationEngine, [
    'system:admin',
    'system:maintenance'
  ]),
  systemController.resetSystem
);
```

### Service Layer Protection

```typescript
class UserService {
  async deleteUser(userId: string, tenantContext: TenantContext): Promise<void> {
    // CRITICAL: Service layer authorization
    const authResult = await serviceGuard.requirePermission(tenantContext, {
      permission: 'users:delete',
      resource: { type: 'users', id: userId },
      operation: 'delete_user',
      requestId: this.requestId
    });

    if (!authResult.authorized) {
      throw new Error(`Authorization denied: ${authResult.reason}`);
    }

    // Execute operation
    return await this.userRepository.delete(userId);
  }
}
```

### Critical Enforcement Rules

- ✅ **ALL sensitive routes use guards**
- ✅ **API and service layers both protected**
- ✅ **Internal service calls cannot bypass**
- ✅ **Resource context automatically validated**
- ✅ **Self-access patterns supported**

---

## 🎯 Resource-Scoped Permissions

### Resource Access Validation

```typescript
const result = await resourceValidator.validateResourcePermission({
  permission: 'invoice:read',
  scope: {
    type: 'invoices',
    id: 'invoice-123'
  },
  tenantContext,
  operation: 'read_invoice',
  requestId: 'req-456'
});
```

### Security Features

#### ID Probing Prevention
- **Detection**: Sequential ID patterns trigger alerts
- **Rate Limiting**: 10 attempts per 5 minutes per user/resource
- **Blocking**: Automatic IP blocking for excessive probing
- **Logging**: All probing attempts logged as security events

#### Cross-Tenant Access Blocking
- **Validation**: Resource tenant ID must match user tenant
- **Failure**: Cross-tenant attempts logged and blocked
- **Sanitization**: Errors don't reveal resource existence
- **Isolation**: Complete tenant separation enforced

#### Error Message Sanitization
- **Consistent**: All denials return "Access denied"
- **Information Leakage Prevention**: No tenant/user details in errors
- **Security**: Error patterns sanitized automatically

---

## 🔒 Least-Privilege Defaults

### New User Permissions

```typescript
const newUserDefaults = leastPrivilegeManager.getNewUserPermissions();
// Returns:
// {
//   role: 'VIEWER',
//   permissions: ['users:read', 'users:profile:read']
// }
```

### New Feature Access

```typescript
const requiresPermission = leastPrivilegeManager.requiresExplicitPermission('new-feature');
// Returns: true (default to DENY)

const requiredPermissions = leastPrivilegeManager.getRequiredPermissions('new-feature');
// Returns: [] (must be explicitly mapped)
```

### CI Validation

```typescript
const validation = validatePermissionMappingsForCI();
// Returns:
// {
//   success: true/false,
//   errors: [...],
//   warnings: [...]
// }
```

### Critical Rules

- ✅ **New users get minimal permissions**
- ✅ **New features default to NO access**
- ✅ **Missing permission mappings fail CI**
- ✅ **Explicit grants required for elevated access**
- ✅ **Least-privilege principle applied automatically**

---

## 📊 Auditing & Observability

### Security Event Types

| Event Type | Description | Severity |
|------------|-------------|----------|
| `PERMISSION_DENIED` | Access blocked due to missing permission | MEDIUM/HIGH |
| `PRIVILEGE_ESCALATION` | User role increased | HIGH |
| `SUSPICIOUS_ACCESS` | Potential attack detected | CRITICAL |
| `ROLE_CHANGE` | User role modified | MEDIUM |
| `PERMISSION_GRANTED` | Access allowed | LOW |

### Audit Logging

```typescript
// Permission denial
auditLogger.logPermissionDenial(
  tenantContext,
  'users:delete',
  'PERMISSION_DENIED',
  'users',
  'user-123',
  'delete_user',
  {
    requestId: 'req-789',
    ip: '192.168.1.100',
    validationChecks: ['permission_valid', 'tenant_context_valid']
  }
);

// Suspicious access
auditLogger.logSuspiciousAccess(
  tenantContext,
  'ID_PROBING',
  'probing_attempt',
  'req-790',
  {
    attemptCount: 15,
    timeWindow: 300000,
    detectedPattern: 'sequential_ids'
  },
  {
    ip: '192.168.1.200',
    userAgent: 'malicious-bot'
  }
);
```

### Security Metrics

```typescript
const metrics = auditLogger.getMetrics();
// Returns:
// {
//   totalEvents: 1250,
//   permissionDenials: 89,
//   privilegeEscalations: 12,
//   suspiciousAccess: 3,
//   highSeverityEvents: 15,
//   criticalEvents: 2,
//   eventsByTenant: Map<string, number>,
//   eventsByUser: Map<string, number>,
//   eventsByPermission: Map<string, number>,
//   topViolations: [...]
// }
```

### Tenant-Safe Sanitization

- **PII Protection**: Personal information masked in logs
- **Tenant ID Masking**: Tenant identifiers partially masked
- **Resource ID Masking**: Resource IDs partially masked
- **Error Sanitization**: Error messages standardized
- **Context Isolation**: Tenant data never mixed in logs

---

## 🧪 Tests & Proof

### Test Coverage

#### Permission Denial Tests
- ✅ **Blocks access without permission**
- ✅ **API middleware blocks unauthorized requests**
- ✅ **Service guards block unauthorized operations**
- ✅ **Deterministic failure behavior**

#### Role Change Tests
- ✅ **Role changes take effect immediately**
- ✅ **Permission cache cleared on role change**
- ✅ **Role changes logged in audit trail**
- ✅ **Permission inheritance works correctly**

#### Cross-Tenant Tests
- ✅ **Cross-tenant access is impossible**
- ✅ **Resource-scoped cross-tenant blocking**
- ✅ **ID probing attacks detected and blocked**
- ✅ **Error messages don't reveal resource existence**

#### Permission Definition Tests
- ✅ **Invalid permissions fail validation**
- ✅ **Missing permission mappings fail CI**
- ✅ **Unmapped features fail validation**
- ✅ **Permission registry completeness validated**

#### Integration Tests
- ✅ **End-to-end authorization flow works**
- ✅ **Multiple permission requirements work**
- ✅ **All components integrate correctly**
- ✅ **Performance with caching is acceptable**

### Test Execution

```bash
# Run all RBAC tests
npm test -- server/auth/__tests__/tenant-rbac.test.ts

# Run with coverage
npm run test:coverage -- server/auth/__tests__/tenant-rbac.test.ts

# Run CI validation
npm run validate:rbac
```

---

## 🚀 Implementation Guide

### 1. Setup Authorization Engine

```typescript
import { createAuthorizationEngine } from './server/auth/authorization-engine.js';

const authorizationEngine = createAuthorizationEngine(prisma, {
  enableAuditLogging: true,
  enableSecurityAlerts: true,
  enableResourceOwnershipValidation: true,
  cachePermissions: true
});
```

### 2. Protect API Routes

```typescript
import { requirePermission } from './server/auth/authorization-guards.js';

app.get('/users/:id',
  requirePermission(authorizationEngine, {
    permission: 'users:read',
    resource: { type: 'users', idParam: 'id' }
  }),
  userController.getUser
);
```

### 3. Protect Service Methods

```typescript
import { createServiceAuthorizationGuard } from './server/auth/authorization-guards.js';

class UserService {
  private serviceGuard = createServiceAuthorizationGuard(authorizationEngine);

  async updateUser(userId: string, data: any, tenantContext: TenantContext) {
    return this.serviceGuard.executeWithAuthorization(tenantContext, {
      permission: 'users:update',
      resource: { type: 'users', id: userId },
      operation: 'update_user',
      requestId: this.requestId
    }, async () => {
      return await this.userRepository.update(userId, data);
    });
  }
}
```

### 4. Resource-Scoped Validation

```typescript
import { checkResourcePermission } from './server/auth/resource-scoped-permissions.js';

const result = await checkResourcePermission(
  prisma,
  authorizationEngine,
  'invoice:read',
  'invoices',
  'invoice-123',
  tenantContext,
  'read_invoice',
  'req-456'
);
```

### 5. Enable Auditing

```typescript
import { getRbacAuditLogger } from './server/auth/rbac-audit-logger.js';

const auditLogger = getRbacAuditLogger(prisma);

// Log security events
auditLogger.logPermissionDenial(
  tenantContext,
  'users:delete',
  'PERMISSION_DENIED',
  'users',
  'user-123',
  'delete_user',
  {
    requestId: 'req-789',
    ip: req.ip,
    userAgent: req.get('User-Agent')
  }
);
```

---

## 📋 Configuration

### Environment Variables

```bash
# Authorization Engine
ENABLE_AUDIT_LOGGING=true
ENABLE_SECURITY_ALERTS=true
ENABLE_RESOURCE_OWNERSHIP_VALIDATION=true
ENABLE_PERMISSION_CACHING=true

# Least Privilege
NEW_USER_DEFAULT_ROLE=VIEWER
NEW_FEATURE_DEFAULT_ACCESS=DENY
FAIL_ON_MISSING_PERMISSIONS=true
FAIL_ON_UNMAPPED_FEATURES=true

# Security
PROBING_DETECTION_MAX_ATTEMPTS=10
PROBING_DETECTION_WINDOW_MS=300000
SECURITY_ALERT_WEBHOOK_URL=https://your-security-system.com/alerts
```

### Permission Registry Configuration

```typescript
// Custom permissions can be added here
export const CUSTOM_PERMISSIONS = {
  'custom:feature:read': 'Read custom feature data',
  'custom:feature:write': 'Write custom feature data',
  'custom:feature:admin': 'Administer custom feature'
};
```

---

## 🔍 Security Checklist

### ✅ Implementation Checklist

- [ ] **Central authorization engine implemented**
- [ ] **Permission registry is complete and validated**
- [ ] **API layer guards are in place**
- [ ] **Service layer guards are in place**
- [ ] **Resource-scoped validation is active**
- [ ] **Least-privilege defaults are enforced**
- [ ] **Comprehensive audit logging is enabled**
- [ ] **All security tests are passing**
- [ ] **CI validation is configured**
- [ ] **Security monitoring is active**

### ✅ Security Validation

- [ ] **Cross-tenant access is impossible**
- [ ] **Permission escalation is controlled**
- [ ] **ID probing attacks are blocked**
- [ ] **Error messages are sanitized**
- [ ] **All decisions are deterministic**
- [ ] **Audit trail is complete**
- [ ] **Security metrics are monitored**

### ✅ Operational Readiness

- [ ] **Performance is acceptable (< 10ms per check)**
- [ ] **Caching is working correctly**
- [ ] **Audit logs are tenant-safe**
- [ ] **Security alerts are triggered**
- [ ] **CI pipeline blocks violations**
- [ ] **Documentation is complete**

---

## 📞 Support and Escalation

### Security Incident Response

1. **Critical Events**: Immediate notification to security team
2. **High Severity**: Automated alerts with investigation
3. **Medium Severity**: Daily security reports
4. **Low Severity**: Weekly security summaries

### Contact Information

- **Security Team**: security@accubooks.com
- **Engineering**: engineering@accubooks.com
- **On-call**: +1-555-SECURITY

---

**Last Updated**: January 25, 2026
**Version**: 1.0
**Security Classification**: CRITICAL
**Next Review**: April 25, 2026
**Approved by**: Head Platform Architect
