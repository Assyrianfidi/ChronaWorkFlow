# 🏗️ Enterprise SaaS Architecture Guide

## Overview

This document describes the implementation of four enterprise-grade systems that transform AccuBooks into a secure, scalable, multi-tenant SaaS platform:

1. **Backend RBAC Enforcement** - True authorization security
2. **Dashboard Composition Engine** - Drag-and-drop customizable dashboards
3. **Multi-Tenant White-Label Branding** - One codebase, many brands
4. **Feature Flag Analytics** - Usage tracking and adoption metrics

---

## 🔐 SYSTEM 1: BACKEND RBAC ENFORCEMENT

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT REQUEST                          │
│                  (JWT with role claim)                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              AUTHENTICATION MIDDLEWARE                       │
│         (Verify JWT, extract user + role)                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│            AUTHORIZATION MIDDLEWARE (RBAC)                   │
│  • Check role permissions against required permission       │
│  • Return 403 if unauthorized                               │
│  • Attach user context to request                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   ROUTE HANDLER                             │
│  • Fetch data (tenant-isolated)                            │
│  • Apply field-level filtering based on role               │
│  • Return only authorized data                              │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

**WHY Middleware-Based Authorization?**
- Declarative permission checks at route level
- Prevents authorization logic scattered across controllers
- Easy to audit (grep for `requirePermission`)
- Consistent error responses

**WHY Separate Permission and Role Checks?**
- Permissions are more granular and flexible
- Roles can change without refactoring code
- New permissions can be added without touching routes
- Supports future ABAC (Attribute-Based Access Control)

**WHY Field-Level Filtering?**
- Prevents over-fetching sensitive data
- Different roles see different fields
- Example: Accountants see invoice amounts but not bank account numbers
- Implements principle of least privilege

### File Structure

```
server/
├── auth/
│   └── rbac/
│       ├── permissions.ts          # Canonical permission definitions
│       ├── middleware.ts            # Authorization middleware
│       └── field-filters.ts         # Resource field filtering
├── routes/
│   ├── financial-reports.routes.ts # Example protected routes
│   ├── invoices.routes.ts
│   ├── bank-accounts.routes.ts
│   └── users.routes.ts
└── types/
    └── express.d.ts                 # Type augmentation for req.user
```

### Permission Matrix

| Permission | Owner | Admin | Manager | Accountant | Auditor | Inventory |
|-----------|-------|-------|---------|------------|---------|-----------|
| VIEW_PROFIT_LOSS | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| VIEW_BANK_ACCOUNTS | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| VIEW_INVOICES | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| CREATE_INVOICE | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| DELETE_INVOICE | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| MANAGE_USERS | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| EXPORT_REPORTS | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| MANAGE_INVENTORY | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |

### Usage Examples

#### Route-Level Authorization
```typescript
import { requireAuth, requirePermission } from '../auth/rbac/middleware';
import { Permission } from '../auth/rbac/permissions';

// Single permission
router.get(
  '/reports/profit-loss',
  requireAuth,
  requirePermission(Permission.VIEW_PROFIT_LOSS),
  handler
);

// Multiple permissions (ANY)
router.get(
  '/invoices',
  requireAuth,
  requireAnyPermission([Permission.VIEW_INVOICES, Permission.CREATE_INVOICE]),
  handler
);

// Multiple permissions (ALL)
router.post(
  '/reports/export',
  requireAuth,
  requireAllPermissions([
    Permission.VIEW_PROFIT_LOSS,
    Permission.EXPORT_FINANCIAL_REPORTS
  ]),
  handler
);
```

#### Controller-Level Authorization
```typescript
import { assertPermission } from '../auth/rbac/middleware';
import { Permission } from '../auth/rbac/permissions';

async function deleteInvoice(req: AuthenticatedRequest, res: Response) {
  // Additional runtime check
  assertPermission(req.user, Permission.DELETE_INVOICE);
  
  // Business logic...
}
```

#### Field-Level Filtering
```typescript
import { filterResourceFields } from '../auth/rbac/permissions';

const invoice = await db.invoices.findOne({ id: invoiceId });

// Filter fields based on user role
const filteredInvoice = filterResourceFields(
  invoice,
  'invoice',
  req.user.role
);

res.json({ data: filteredInvoice });
```

### Security Best Practices

1. **Zero Trust**: Always verify permissions, even for internal calls
2. **Fail Secure**: Default to deny if permission check fails
3. **Audit Everything**: Log all authorization decisions
4. **Tenant Isolation**: Always filter by `tenantId` in queries
5. **Field Filtering**: Apply after database fetch, before response
6. **JWT Claims**: Store role in JWT, verify signature on every request
7. **Rate Limiting**: Apply per-role rate limits to prevent abuse

### Frontend-Backend Sync

**Frontend (UI Gating)**
```typescript
// client/src/hooks/useRoleBasedUI.ts
export function getRolePermissions(role: UserRole): RolePermissions {
  // Mirror backend permission matrix
  // Used for UI hiding only, NOT security
}
```

**Backend (Security Enforcement)**
```typescript
// server/auth/rbac/permissions.ts
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  // Canonical source of truth
  // Actual security boundary
}
```

**Sync Strategy**:
- Backend permissions are source of truth
- Frontend imports same role enum from shared types
- Frontend checks are UX optimization only
- Backend always validates regardless of frontend state

---

## 🎨 SYSTEM 2: DASHBOARD COMPOSITION ENGINE

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    WIDGET REGISTRY                          │
│  • Profit & Loss Widget                                     │
│  • Cash Flow Chart                                          │
│  • Bank Accounts Widget                                     │
│  • Invoices Widget                                          │
│  • Custom Widgets (extensible)                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              DASHBOARD LAYOUT ENGINE                         │
│  • Load user's saved layout from DB                         │
│  • Fallback to role default layout                          │
│  • Apply feature flag filtering                             │
│  • Apply role-based widget availability                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│            DRAG & DROP GRID SYSTEM                          │
│  • React Grid Layout (responsive)                           │
│  • Save layout changes to backend                           │
│  • Persist per user or per role                             │
└─────────────────────────────────────────────────────────────┘
```

### Data Model

#### Dashboard Layout Schema
```typescript
interface DashboardLayout {
  id: string;
  userId?: string;              // User-specific layout
  roleId?: string;              // Role default layout
  tenantId: string;             // Tenant isolation
  name: string;                 // "My Dashboard", "Accountant Default"
  isDefault: boolean;           // Is this the default for the role?
  layout: LayoutConfig;         // Grid layout configuration
  createdAt: Date;
  updatedAt: Date;
}

interface LayoutConfig {
  desktop: WidgetPosition[];
  tablet: WidgetPosition[];
  mobile: WidgetPosition[];
}

interface WidgetPosition {
  widgetId: string;             // "profit-loss", "cash-flow"
  x: number;                    // Grid column
  y: number;                    // Grid row
  w: number;                    // Width in grid units
  h: number;                    // Height in grid units
  minW?: number;                // Minimum width
  minH?: number;                // Minimum height
  maxW?: number;                // Maximum width
  maxH?: number;                // Maximum height
  static?: boolean;             // Cannot be moved/resized
}
```

#### Widget Registry Schema
```typescript
interface WidgetDefinition {
  id: string;                   // Unique widget ID
  name: string;                 // Display name
  description: string;          // Widget description
  component: string;            // Component path
  category: WidgetCategory;     // Financial, Operations, etc.
  requiredPermissions: Permission[]; // Who can see this widget
  featureFlag?: string;         // Optional feature flag
  defaultSize: {
    w: number;
    h: number;
  };
  minSize?: {
    w: number;
    h: number;
  };
  maxSize?: {
    w: number;
    h: number;
  };
  icon: string;                 // Icon name
  previewImage?: string;        // Preview thumbnail
}

enum WidgetCategory {
  FINANCIAL = 'FINANCIAL',
  OPERATIONS = 'OPERATIONS',
  ANALYTICS = 'ANALYTICS',
  CUSTOM = 'CUSTOM',
}
```

### API Endpoints

#### GET /api/dashboards/layout
```typescript
// Get user's dashboard layout
// Falls back to role default if no user layout exists
GET /api/dashboards/layout?userId={userId}

Response:
{
  "success": true,
  "data": {
    "id": "layout-123",
    "userId": "user-456",
    "layout": {
      "desktop": [...],
      "tablet": [...],
      "mobile": [...]
    }
  }
}
```

#### POST /api/dashboards/layout
```typescript
// Save user's dashboard layout
POST /api/dashboards/layout

Body:
{
  "layout": {
    "desktop": [...],
    "tablet": [...],
    "mobile": [...]
  }
}

Response:
{
  "success": true,
  "data": {
    "id": "layout-123",
    "message": "Layout saved successfully"
  }
}
```

#### GET /api/dashboards/widgets
```typescript
// Get available widgets for current user
// Filtered by role permissions and feature flags
GET /api/dashboards/widgets

Response:
{
  "success": true,
  "data": [
    {
      "id": "profit-loss",
      "name": "Profit & Loss",
      "category": "FINANCIAL",
      "defaultSize": { "w": 6, "h": 4 }
    },
    // ... more widgets
  ]
}
```

### Frontend Implementation

#### Widget Registry
```typescript
// client/src/dashboard/widgetRegistry.ts
import { WidgetDefinition } from '@/types/dashboard';
import { Permission } from '@/types/permissions';

export const WIDGET_REGISTRY: Record<string, WidgetDefinition> = {
  'profit-loss': {
    id: 'profit-loss',
    name: 'Profit & Loss',
    description: 'View revenue, expenses, and net profit',
    component: 'ProfitLossWidget',
    category: WidgetCategory.FINANCIAL,
    requiredPermissions: [Permission.VIEW_PROFIT_LOSS],
    featureFlag: 'PROFIT_LOSS_WIDGET',
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
    icon: 'TrendingUp',
  },
  'cash-flow': {
    id: 'cash-flow',
    name: 'Cash Flow',
    description: 'Visualize inflow and outflow trends',
    component: 'CashFlowChart',
    category: WidgetCategory.FINANCIAL,
    requiredPermissions: [Permission.VIEW_CASH_FLOW],
    featureFlag: 'FINANCIAL_DASHBOARD_CHARTS',
    defaultSize: { w: 12, h: 6 },
    minSize: { w: 6, h: 4 },
    icon: 'BarChart',
  },
  // ... more widgets
};

export function getAvailableWidgets(
  userRole: UserRole,
  featureFlags: Record<string, boolean>
): WidgetDefinition[] {
  return Object.values(WIDGET_REGISTRY).filter(widget => {
    // Check permissions
    const hasPermission = widget.requiredPermissions.every(perm =>
      hasPermission(userRole, perm)
    );
    
    // Check feature flag
    const flagEnabled = !widget.featureFlag || featureFlags[widget.featureFlag];
    
    return hasPermission && flagEnabled;
  });
}
```

#### Dashboard Composition Component
```typescript
// client/src/pages/CustomizableDashboard.tsx
import React, { useState, useEffect } from 'react';
import GridLayout from 'react-grid-layout';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getAvailableWidgets } from '@/dashboard/widgetRegistry';
import { useAuth } from '@/contexts/AuthContext';
import { useFeatureFlags } from '@/contexts/FeatureFlagContext';

export function CustomizableDashboard() {
  const { user } = useAuth();
  const { flags } = useFeatureFlags();
  
  // Load user's layout
  const { data: layoutData } = useQuery({
    queryKey: ['dashboard-layout', user?.id],
    queryFn: () => fetchDashboardLayout(user?.id),
  });
  
  // Save layout mutation
  const saveLayout = useMutation({
    mutationFn: (layout: LayoutConfig) => saveDashboardLayout(layout),
  });
  
  // Get available widgets
  const availableWidgets = getAvailableWidgets(user?.role, flags);
  
  const handleLayoutChange = (newLayout: Layout[]) => {
    // Debounce and save
    saveLayout.mutate({
      desktop: newLayout,
      // ... tablet and mobile layouts
    });
  };
  
  return (
    <div className="dashboard-container">
      <DashboardToolbar availableWidgets={availableWidgets} />
      
      <GridLayout
        className="dashboard-grid"
        layout={layoutData?.desktop || []}
        cols={12}
        rowHeight={60}
        width={1200}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".widget-drag-handle"
        resizeHandles={['se', 'sw', 'ne', 'nw']}
      >
        {layoutData?.desktop.map(item => (
          <div key={item.widgetId} className="dashboard-widget">
            <WidgetRenderer widgetId={item.widgetId} />
          </div>
        ))}
      </GridLayout>
    </div>
  );
}
```

### Database Schema (Prisma)

```prisma
model DashboardLayout {
  id        String   @id @default(cuid())
  userId    String?  // Null for role defaults
  roleId    String?  // Null for user-specific
  tenantId  String
  name      String
  isDefault Boolean  @default(false)
  layout    Json     // LayoutConfig as JSON
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  user   User?   @relation(fields: [userId], references: [id])
  tenant Tenant  @relation(fields: [tenantId], references: [id])
  
  @@unique([userId, tenantId])
  @@unique([roleId, tenantId, isDefault])
  @@index([tenantId])
  @@index([userId])
}
```

### Extensibility

**Adding a New Widget**:
1. Create widget component in `client/src/components/widgets/`
2. Register in `widgetRegistry.ts`
3. Define required permissions
4. Optional: Add feature flag
5. Widget automatically appears in available widgets list

**Example**:
```typescript
// 1. Create component
export function CustomMetricsWidget() {
  return <div>Custom Metrics</div>;
}

// 2. Register
WIDGET_REGISTRY['custom-metrics'] = {
  id: 'custom-metrics',
  name: 'Custom Metrics',
  component: 'CustomMetricsWidget',
  requiredPermissions: [Permission.VIEW_DASHBOARD],
  defaultSize: { w: 6, h: 4 },
};
```

---

## 🏢 SYSTEM 3: MULTI-TENANT WHITE-LABEL BRANDING

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   INCOMING REQUEST                          │
│        (subdomain, header, or token-based)                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              TENANT RESOLUTION MIDDLEWARE                    │
│  • Extract tenant identifier (subdomain/header/token)       │
│  • Lookup tenant configuration from database                │
│  • Attach tenant context to request                         │
│  • Return 404 if tenant not found                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│            TENANT CONFIGURATION INJECTION                    │
│  • Load tenant branding (logo, colors, theme)              │
│  • Load tenant feature flags                                │
│  • Load tenant settings                                     │
│  • Inject into response headers or API response             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  APPLICATION LAYER                          │
│  • All queries filtered by tenantId                         │
│  • Theme applied dynamically (CSS variables)                │
│  • Features enabled/disabled per tenant                     │
└─────────────────────────────────────────────────────────────┘
```

### Data Model

#### Tenant Schema
```typescript
interface Tenant {
  id: string;
  name: string;                 // "Acme Corp"
  subdomain: string;            // "acme" (acme.accubooks.com)
  customDomain?: string;        // "accounting.acme.com"
  
  // Branding
  branding: TenantBranding;
  
  // Feature Flags
  featureFlags: Record<string, boolean>;
  
  // Settings
  settings: TenantSettings;
  
  // Subscription
  plan: SubscriptionPlan;
  status: TenantStatus;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

interface TenantBranding {
  logo: {
    light: string;              // URL to light logo
    dark: string;               // URL to dark logo
  };
  favicon: string;              // URL to favicon
  
  // Theme colors (override defaults)
  theme: {
    name: string;               // "default", "blue", "custom"
    colors: {
      primary: string;
      primaryHover: string;
      // ... all theme colors
    };
  };
  
  // Typography
  typography?: {
    fontFamily: string;
    fontFamilyHeading: string;
  };
  
  // Custom CSS (advanced)
  customCss?: string;
}

interface TenantSettings {
  defaultThemeMode: 'light' | 'dark' | 'system';
  allowUserThemeChange: boolean;
  defaultLanguage: string;
  timezone: string;
  dateFormat: string;
  currencyFormat: string;
  
  // Security
  enforceSSO: boolean;
  allowedEmailDomains?: string[];
  sessionTimeout: number;       // minutes
  
  // Features
  enabledModules: string[];     // ["invoicing", "expenses", "inventory"]
}

enum SubscriptionPlan {
  FREE = 'FREE',
  STARTER = 'STARTER',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE',
}

enum TenantStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  TRIAL = 'TRIAL',
  CANCELLED = 'CANCELLED',
}
```

### Tenant Resolution Strategies

#### 1. Subdomain-Based (Recommended)
```
https://acme.accubooks.com     → tenant: "acme"
https://techcorp.accubooks.com → tenant: "techcorp"
```

**Pros**: Clean URLs, easy to understand, SEO-friendly
**Cons**: Requires wildcard DNS, SSL certificate management

#### 2. Header-Based
```
GET /api/reports
Host: api.accubooks.com
X-Tenant-ID: acme
```

**Pros**: Simple, works with single domain
**Cons**: Requires client to send header, not user-friendly

#### 3. Token-Based (JWT Claim)
```
JWT payload: {
  userId: "user-123",
  tenantId: "acme",
  role: "OWNER"
}
```

**Pros**: Secure, no additional lookup needed
**Cons**: Tenant locked to token, requires re-auth to switch

### Implementation

#### Tenant Resolution Middleware
```typescript
// server/middleware/tenantResolution.ts
import { Request, Response, NextFunction } from 'express';

export interface TenantRequest extends Request {
  tenant?: Tenant;
}

export async function resolveTenant(
  req: TenantRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let tenantId: string | null = null;
    
    // Strategy 1: Subdomain
    const subdomain = extractSubdomain(req.hostname);
    if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
      tenantId = subdomain;
    }
    
    // Strategy 2: Header (fallback)
    if (!tenantId) {
      tenantId = req.headers['x-tenant-id'] as string;
    }
    
    // Strategy 3: JWT claim (fallback)
    if (!tenantId && req.user) {
      tenantId = (req.user as any).tenantId;
    }
    
    if (!tenantId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Tenant identifier is required',
        code: 'MISSING_TENANT',
      });
      return;
    }
    
    // Load tenant from database
    const tenant = await db.tenants.findUnique({
      where: { subdomain: tenantId },
      include: {
        branding: true,
        settings: true,
      },
    });
    
    if (!tenant) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Tenant not found',
        code: 'TENANT_NOT_FOUND',
      });
      return;
    }
    
    if (tenant.status !== TenantStatus.ACTIVE) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Tenant account is not active',
        code: 'TENANT_INACTIVE',
        status: tenant.status,
      });
      return;
    }
    
    // Attach tenant to request
    req.tenant = tenant;
    
    // Inject tenant branding into response headers
    res.setHeader('X-Tenant-ID', tenant.id);
    res.setHeader('X-Tenant-Name', tenant.name);
    
    next();
  } catch (error) {
    console.error('[ERROR] Tenant resolution failed:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to resolve tenant',
    });
  }
}

function extractSubdomain(hostname: string): string | null {
  const parts = hostname.split('.');
  if (parts.length >= 3) {
    return parts[0];
  }
  return null;
}
```

#### Tenant Branding API
```typescript
// GET /api/tenant/branding
router.get('/branding', resolveTenant, async (req: TenantRequest, res) => {
  const { tenant } = req;
  
  res.json({
    success: true,
    data: {
      logo: tenant.branding.logo,
      favicon: tenant.branding.favicon,
      theme: tenant.branding.theme,
      typography: tenant.branding.typography,
      settings: {
        defaultThemeMode: tenant.settings.defaultThemeMode,
        allowUserThemeChange: tenant.settings.allowUserThemeChange,
      },
    },
  });
});
```

#### Frontend Theme Injection
```typescript
// client/src/hooks/useTenantBranding.ts
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

export function useTenantBranding() {
  const { data: branding } = useQuery({
    queryKey: ['tenant-branding'],
    queryFn: fetchTenantBranding,
    staleTime: Infinity, // Cache indefinitely
  });
  
  useEffect(() => {
    if (!branding) return;
    
    // Inject theme colors as CSS variables
    const root = document.documentElement;
    Object.entries(branding.theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
    
    // Inject typography
    if (branding.typography) {
      root.style.setProperty('--font-family', branding.typography.fontFamily);
      root.style.setProperty('--font-family-heading', branding.typography.fontFamilyHeading);
    }
    
    // Update favicon
    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon) {
      favicon.setAttribute('href', branding.favicon);
    }
    
    // Update title
    document.title = `${branding.tenantName} - AccuBooks`;
  }, [branding]);
  
  return branding;
}
```

### Tenant-Scoped Feature Flags

```typescript
// server/services/featureFlags.ts
export function getTenantFeatureFlags(
  tenantId: string,
  userId: string
): Record<string, boolean> {
  // Load tenant feature flags
  const tenantFlags = await db.tenants.findUnique({
    where: { id: tenantId },
    select: { featureFlags: true },
  });
  
  // Merge with global defaults
  const flags = {
    ...GLOBAL_FEATURE_FLAGS,
    ...tenantFlags.featureFlags,
  };
  
  // Apply user-level overrides (for testing)
  const userOverrides = await db.userFeatureFlagOverrides.findMany({
    where: { userId, tenantId },
  });
  
  userOverrides.forEach(override => {
    flags[override.flagKey] = override.enabled;
  });
  
  return flags;
}
```

### Database Schema (Prisma)

```prisma
model Tenant {
  id            String         @id @default(cuid())
  name          String
  subdomain     String         @unique
  customDomain  String?        @unique
  
  // Branding (JSON)
  branding      Json
  
  // Feature Flags (JSON)
  featureFlags  Json           @default("{}")
  
  // Settings (JSON)
  settings      Json
  
  // Subscription
  plan          SubscriptionPlan
  status        TenantStatus
  
  // Relations
  users         User[]
  invoices      Invoice[]
  expenses      Expense[]
  layouts       DashboardLayout[]
  
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  
  @@index([subdomain])
  @@index([status])
}

enum SubscriptionPlan {
  FREE
  STARTER
  PROFESSIONAL
  ENTERPRISE
}

enum TenantStatus {
  ACTIVE
  SUSPENDED
  TRIAL
  CANCELLED
}
```

### Security Considerations

1. **Tenant Isolation**: ALL database queries MUST filter by `tenantId`
2. **Cross-Tenant Access**: Prevent users from accessing other tenants' data
3. **Subdomain Validation**: Sanitize subdomain input to prevent injection
4. **Custom Domain Verification**: Verify DNS ownership before enabling
5. **Rate Limiting**: Apply per-tenant rate limits
6. **Data Residency**: Store tenant data in specified regions (GDPR)

---

## 📊 SYSTEM 4: FEATURE FLAG ANALYTICS

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                  FRONTEND APPLICATION                        │
│  • User views feature                                       │
│  • User clicks feature                                      │
│  • User actively uses feature                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              ANALYTICS TRACKING HOOK                         │
│  • trackFeatureView()                                       │
│  • trackFeatureClick()                                      │
│  • trackFeatureUsage()                                      │
│  • Batching + debouncing                                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│            ANALYTICS INGESTION API                          │
│  POST /api/analytics/events                                 │
│  • Validate event schema                                    │
│  • Enrich with metadata (timestamp, IP, etc.)              │
│  • Write to analytics database                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              ANALYTICS DATABASE                             │
│  • Time-series optimized (ClickHouse/TimescaleDB)          │
│  • Partitioned by date                                      │
│  • Indexed for fast queries                                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│            ANALYTICS REPORTING API                          │
│  • Feature adoption metrics                                 │
│  • Role-based usage breakdown                               │
│  • Tenant-based usage breakdown                             │
│  • Trend analysis                                           │
└─────────────────────────────────────────────────────────────┘
```

### Event Schema

```typescript
interface FeatureFlagEvent {
  // Event identification
  eventId: string;              // Unique event ID
  eventType: FeatureFlagEventType;
  
  // Feature identification
  featureFlag: string;          // Feature flag key
  featureName: string;          // Human-readable name
  
  // User context
  userId: string;
  userRole: UserRole;
  tenantId: string;
  
  // Event metadata
  timestamp: Date;
  sessionId: string;            // Group events by session
  
  // Additional context
  metadata?: Record<string, any>; // Custom event data
  
  // Privacy-safe
  // NO sensitive data (PII, financial amounts, etc.)
}

enum FeatureFlagEventType {
  VIEWED = 'VIEWED',            // Feature rendered on screen
  CLICKED = 'CLICKED',          // User clicked feature element
  USED = 'USED',                // User actively used feature
  ENABLED = 'ENABLED',          // Feature flag enabled for user
  DISABLED = 'DISABLED',        // Feature flag disabled for user
}
```

### Frontend Tracking Hook

```typescript
// client/src/hooks/useFeatureFlagAnalytics.ts
import { useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { debounce } from 'lodash';

interface TrackingOptions {
  metadata?: Record<string, any>;
  debounceMs?: number;
}

export function useFeatureFlagAnalytics() {
  const { user } = useAuth();
  const eventQueue = useRef<FeatureFlagEvent[]>([]);
  
  // Batch send events every 5 seconds
  const flushEvents = useCallback(
    debounce(async () => {
      if (eventQueue.current.length === 0) return;
      
      const events = [...eventQueue.current];
      eventQueue.current = [];
      
      try {
        await fetch('/api/analytics/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events }),
        });
      } catch (error) {
        console.error('[ANALYTICS] Failed to send events:', error);
        // Don't retry - analytics should not block user experience
      }
    }, 5000),
    []
  );
  
  const trackEvent = useCallback(
    (
      eventType: FeatureFlagEventType,
      featureFlag: string,
      featureName: string,
      options: TrackingOptions = {}
    ) => {
      if (!user) return;
      
      const event: FeatureFlagEvent = {
        eventId: generateEventId(),
        eventType,
        featureFlag,
        featureName,
        userId: user.id,
        userRole: user.role,
        tenantId: user.tenantId,
        timestamp: new Date(),
        sessionId: getSessionId(),
        metadata: options.metadata,
      };
      
      eventQueue.current.push(event);
      flushEvents();
    },
    [user, flushEvents]
  );
  
  const trackFeatureView = useCallback(
    (featureFlag: string, featureName: string, options?: TrackingOptions) => {
      trackEvent(FeatureFlagEventType.VIEWED, featureFlag, featureName, options);
    },
    [trackEvent]
  );
  
  const trackFeatureClick = useCallback(
    (featureFlag: string, featureName: string, options?: TrackingOptions) => {
      trackEvent(FeatureFlagEventType.CLICKED, featureFlag, featureName, options);
    },
    [trackEvent]
  );
  
  const trackFeatureUsage = useCallback(
    (featureFlag: string, featureName: string, options?: TrackingOptions) => {
      trackEvent(FeatureFlagEventType.USED, featureFlag, featureName, options);
    },
    [trackEvent]
  );
  
  return {
    trackFeatureView,
    trackFeatureClick,
    trackFeatureUsage,
  };
}

// Helper: Generate unique event ID
function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper: Get or create session ID
function getSessionId(): string {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
}
```

### Usage in Components

```typescript
// Automatic tracking with HOC
export const ProfitLossWidget = withFeatureTracking(
  ProfitLossWidgetComponent,
  'PROFIT_LOSS_WIDGET',
  'Profit & Loss Widget'
);

// Manual tracking
function InvoicesList() {
  const { trackFeatureClick, trackFeatureUsage } = useFeatureFlagAnalytics();
  
  const handleCreateInvoice = () => {
    trackFeatureClick('CREATE_INVOICE', 'Create Invoice Button');
    // ... create invoice logic
  };
  
  const handleInvoiceCreated = () => {
    trackFeatureUsage('CREATE_INVOICE', 'Invoice Created');
  };
  
  return (
    <button onClick={handleCreateInvoice}>
      Create Invoice
    </button>
  );
}
```

### Backend Ingestion API

```typescript
// server/routes/analytics.routes.ts
router.post('/events', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { events } = req.body;
    
    // Validate events
    if (!Array.isArray(events) || events.length === 0) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Events array is required',
      });
      return;
    }
    
    // Validate each event
    const validEvents = events.filter(event => {
      return (
        event.featureFlag &&
        event.eventType &&
        event.userId === req.user!.id // Security: Verify user ID
      );
    });
    
    if (validEvents.length === 0) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'No valid events provided',
      });
      return;
    }
    
    // Enrich events with server-side metadata
    const enrichedEvents = validEvents.map(event => ({
      ...event,
      serverTimestamp: new Date(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    }));
    
    // Write to analytics database (async, non-blocking)
    await analyticsDb.events.insertMany(enrichedEvents);
    
    res.json({
      success: true,
      data: {
        received: events.length,
        processed: validEvents.length,
      },
    });
  } catch (error) {
    console.error('[ERROR] Analytics ingestion failed:', error);
    // Don't fail the request - analytics should not block user experience
    res.json({
      success: true,
      data: { received: 0, processed: 0 },
    });
  }
});
```

### Analytics Reporting API

```typescript
// GET /api/analytics/features/adoption
router.get('/features/adoption', requireAuth, requireRole([UserRole.OWNER, UserRole.ADMIN]), async (req, res) => {
  const { tenantId } = req.user!;
  const { startDate, endDate, featureFlag } = req.query;
  
  const adoption = await analyticsDb.query(`
    SELECT
      featureFlag,
      featureName,
      COUNT(DISTINCT userId) as uniqueUsers,
      COUNT(*) as totalEvents,
      COUNT(DISTINCT CASE WHEN eventType = 'VIEWED' THEN userId END) as viewedUsers,
      COUNT(DISTINCT CASE WHEN eventType = 'CLICKED' THEN userId END) as clickedUsers,
      COUNT(DISTINCT CASE WHEN eventType = 'USED' THEN userId END) as activeUsers,
      (COUNT(DISTINCT CASE WHEN eventType = 'USED' THEN userId END) * 100.0 / COUNT(DISTINCT userId)) as adoptionRate
    FROM feature_flag_events
    WHERE tenantId = ?
      AND timestamp BETWEEN ? AND ?
      ${featureFlag ? 'AND featureFlag = ?' : ''}
    GROUP BY featureFlag, featureName
    ORDER BY adoptionRate DESC
  `, [tenantId, startDate, endDate, featureFlag].filter(Boolean));
  
  res.json({
    success: true,
    data: adoption,
  });
});

// GET /api/analytics/features/usage-by-role
router.get('/features/usage-by-role', requireAuth, requireRole([UserRole.OWNER, UserRole.ADMIN]), async (req, res) => {
  const { tenantId } = req.user!;
  const { featureFlag } = req.query;
  
  const usageByRole = await analyticsDb.query(`
    SELECT
      userRole,
      COUNT(DISTINCT userId) as uniqueUsers,
      COUNT(*) as totalEvents,
      AVG(CASE WHEN eventType = 'USED' THEN 1 ELSE 0 END) as usageRate
    FROM feature_flag_events
    WHERE tenantId = ?
      AND featureFlag = ?
      AND timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY userRole
    ORDER BY usageRate DESC
  `, [tenantId, featureFlag]);
  
  res.json({
    success: true,
    data: usageByRole,
  });
});
```

### Analytics Dashboard KPIs

```typescript
interface FeatureHealthMetrics {
  featureFlag: string;
  featureName: string;
  
  // Adoption
  totalUsers: number;
  activeUsers: number;           // Used in last 30 days
  adoptionRate: number;           // % of users who actively use
  
  // Engagement
  avgSessionsPerUser: number;
  avgEventsPerSession: number;
  
  // Trends
  weekOverWeekGrowth: number;     // % change in active users
  monthOverMonthGrowth: number;
  
  // Health Score (0-100)
  healthScore: number;            // Composite metric
  
  // Recommendation
  recommendation: FeatureRecommendation;
}

enum FeatureRecommendation {
  PROMOTE = 'PROMOTE',            // High adoption, promote more
  IMPROVE = 'IMPROVE',            // Low adoption, needs improvement
  SUNSET = 'SUNSET',              // No adoption, consider removing
  MONITOR = 'MONITOR',            // Stable, continue monitoring
}
```

### Database Schema

```sql
-- TimescaleDB or ClickHouse optimized schema
CREATE TABLE feature_flag_events (
  event_id VARCHAR(255) PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  
  feature_flag VARCHAR(255) NOT NULL,
  feature_name VARCHAR(255) NOT NULL,
  
  user_id VARCHAR(255) NOT NULL,
  user_role VARCHAR(50) NOT NULL,
  tenant_id VARCHAR(255) NOT NULL,
  
  timestamp TIMESTAMP NOT NULL,
  server_timestamp TIMESTAMP NOT NULL,
  session_id VARCHAR(255) NOT NULL,
  
  metadata JSONB,
  
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  INDEX idx_tenant_timestamp (tenant_id, timestamp DESC),
  INDEX idx_feature_timestamp (feature_flag, timestamp DESC),
  INDEX idx_user_timestamp (user_id, timestamp DESC)
);

-- Partition by date for performance
SELECT create_hypertable('feature_flag_events', 'timestamp');
```

### Privacy & Performance

**Privacy**:
- No PII (names, emails, addresses)
- No sensitive data (financial amounts, account numbers)
- IP addresses hashed or anonymized
- GDPR-compliant data retention (90 days default)

**Performance**:
- Batch events (send every 5 seconds)
- Async ingestion (non-blocking)
- Time-series database (optimized for analytics)
- Materialized views for common queries
- CDN for analytics dashboard

---

## 🚀 DEPLOYMENT GUIDE

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ (main database)
- TimescaleDB or ClickHouse (analytics)
- Redis (caching, sessions)

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/accubooks
ANALYTICS_DATABASE_URL=postgresql://user:pass@localhost:5432/analytics

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRY=7d

# Multi-Tenant
BASE_DOMAIN=accubooks.com
WILDCARD_SSL_CERT=/path/to/cert.pem

# Feature Flags
ENABLE_ANALYTICS=true
ANALYTICS_BATCH_SIZE=100
```

### Migration Steps

1. **Database Migrations**
```bash
npx prisma migrate deploy
```

2. **Seed Default Data**
```bash
npm run seed:tenants
npm run seed:permissions
```

3. **Build & Deploy**
```bash
npm run build
npm run start:prod
```

### Monitoring

- **Authorization Failures**: Alert on >10% 403 rate
- **Tenant Resolution**: Alert on >1% 404 rate
- **Analytics Ingestion**: Alert on >5% error rate
- **Database Performance**: Monitor query times

---

## 📚 ADDITIONAL RESOURCES

### Code Examples
- See `server/examples/` for complete working examples
- See `client/examples/` for frontend integration examples

### Testing
- Unit tests: `npm run test`
- Integration tests: `npm run test:integration`
- E2E tests: `npm run test:e2e`

### Documentation
- API Documentation: `/docs/api`
- Architecture Diagrams: `/docs/architecture`
- Security Guide: `/docs/security`

---

**Last Updated**: January 31, 2026  
**Version**: 1.0.0  
**Status**: Production Ready
