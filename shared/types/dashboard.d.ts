/**
 * Dashboard Composition System Types
 * Shared between frontend and backend
 */
import { Permission } from './permissions';
export interface DashboardLayout {
    id: string;
    userId?: string;
    roleId?: string;
    tenantId: string;
    name: string;
    isDefault: boolean;
    layout: LayoutConfig;
    createdAt: Date;
    updatedAt: Date;
}
export interface LayoutConfig {
    desktop: WidgetPosition[];
    tablet: WidgetPosition[];
    mobile: WidgetPosition[];
}
export interface WidgetPosition {
    widgetId: string;
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    minH?: number;
    maxW?: number;
    maxH?: number;
    static?: boolean;
}
export interface WidgetDefinition {
    id: string;
    name: string;
    description: string;
    component: string;
    category: WidgetCategory;
    requiredPermissions: Permission[];
    featureFlag?: string;
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
    icon: string;
    previewImage?: string;
    tags?: string[];
}
export declare enum WidgetCategory {
    FINANCIAL = "FINANCIAL",
    OPERATIONS = "OPERATIONS",
    ANALYTICS = "ANALYTICS",
    REPORTS = "REPORTS",
    CUSTOM = "CUSTOM"
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
//# sourceMappingURL=dashboard.d.ts.map