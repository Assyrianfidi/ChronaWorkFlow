/**
 * Dashboard Composition System Types
 * Shared between frontend and backend
 */

import { Permission } from './permissions';

export interface DashboardLayout {
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

export interface LayoutConfig {
  desktop: WidgetPosition[];
  tablet: WidgetPosition[];
  mobile: WidgetPosition[];
}

export interface WidgetPosition {
  widgetId: string;             // "profit-loss", "cash-flow"
  x: number;                    // Grid column (0-based)
  y: number;                    // Grid row (0-based)
  w: number;                    // Width in grid units
  h: number;                    // Height in grid units
  minW?: number;                // Minimum width
  minH?: number;                // Minimum height
  maxW?: number;                // Maximum width
  maxH?: number;                // Maximum height
  static?: boolean;             // Cannot be moved/resized
}

export interface WidgetDefinition {
  id: string;                   // Unique widget ID
  name: string;                 // Display name
  description: string;          // Widget description
  component: string;            // Component name/path
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
  icon: string;                 // Icon name (lucide-react)
  previewImage?: string;        // Preview thumbnail URL
  tags?: string[];              // Search tags
}

export enum WidgetCategory {
  FINANCIAL = 'FINANCIAL',
  OPERATIONS = 'OPERATIONS',
  ANALYTICS = 'ANALYTICS',
  REPORTS = 'REPORTS',
  CUSTOM = 'CUSTOM',
}

export interface WidgetRegistry {
  [widgetId: string]: WidgetDefinition;
}

export interface SaveLayoutRequest {
  layout: LayoutConfig;
  name?: string;
  isDefault?: boolean;
}

export interface SaveLayoutResponse {
  success: boolean;
  data: {
    id: string;
    message: string;
  };
}

export interface GetLayoutResponse {
  success: boolean;
  data: DashboardLayout;
}

export interface GetWidgetsResponse {
  success: boolean;
  data: WidgetDefinition[];
}
