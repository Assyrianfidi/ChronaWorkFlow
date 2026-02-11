/**
 * AccuBooks View Architecture Configuration
 * Enterprise-grade view system with multiple modes for different user personas
 */

// ============================================================================
// MAIN VIEW MODES
// ============================================================================

export type MainViewMode = "business" | "accountant";

export interface MainViewConfig {
  id: MainViewMode;
  name: string;
  description: string;
  icon: string;
  targetRoles: string[];
  features: {
    simplifiedNavigation: boolean;
    advancedAccounting: boolean;
    journalEntries: boolean;
    reconciliationTools: boolean;
    bulkActions: boolean;
    technicalReports: boolean;
  };
  terminology: {
    sales: string;
    expenses: string;
    customers: string;
    vendors: string;
    reports: string;
    accounting: string;
    transactions: string;
    banking: string;
  };
}

export const MAIN_VIEWS: Record<MainViewMode, MainViewConfig> = {
  business: {
    id: "business",
    name: "Business View",
    description: "Simplified interface for business owners",
    icon: "Building2",
    targetRoles: ["OWNER", "ADMIN", "MANAGER", "USER"],
    features: {
      simplifiedNavigation: true,
      advancedAccounting: false,
      journalEntries: false,
      reconciliationTools: false,
      bulkActions: false,
      technicalReports: false,
    },
    terminology: {
      sales: "Get Paid",
      expenses: "Pay & Buy",
      customers: "Customers",
      vendors: "Suppliers",
      reports: "Reports",
      accounting: "Money & Banking",
      transactions: "Money In & Out",
      banking: "Bank & Credit Cards",
    },
  },
  accountant: {
    id: "accountant",
    name: "Accountant View",
    description: "Full accounting features for professionals",
    icon: "Calculator",
    targetRoles: ["ACCOUNTANT", "BOOKKEEPER", "AUDITOR", "ADMIN"],
    features: {
      simplifiedNavigation: false,
      advancedAccounting: true,
      journalEntries: true,
      reconciliationTools: true,
      bulkActions: true,
      technicalReports: true,
    },
    terminology: {
      sales: "Accounts Receivable",
      expenses: "Accounts Payable",
      customers: "Customers",
      vendors: "Vendors",
      reports: "Financial Reports",
      accounting: "General Ledger",
      transactions: "Journal Entries",
      banking: "Banking & Reconciliation",
    },
  },
};

// ============================================================================
// DASHBOARD VIEW OPTIONS
// ============================================================================

export type DashboardViewMode = "custom" | "performance" | "cashflow";

export interface DashboardViewConfig {
  id: DashboardViewMode;
  name: string;
  description: string;
  icon: string;
  features: string[];
  requiredTier?: string;
}

export const DASHBOARD_VIEWS: Record<DashboardViewMode, DashboardViewConfig> = {
  custom: {
    id: "custom",
    name: "Custom Dashboard",
    description: "Drag-and-drop widget system with custom KPIs",
    icon: "LayoutDashboard",
    features: [
      "dragDropWidgets",
      "customKPIs",
      "multipleLayouts",
      "roleBasedViews",
    ],
    requiredTier: "advanced",
  },
  performance: {
    id: "performance",
    name: "Performance Center",
    description: "Financial performance overview with trend analysis",
    icon: "TrendingUp",
    features: [
      "incomeExpenseTrends",
      "periodComparisons",
      "performanceMetrics",
      "visualCharts",
    ],
  },
  cashflow: {
    id: "cashflow",
    name: "Cash Flow Planner",
    description: "Interactive cash flow forecasting and scenario planning",
    icon: "Wallet",
    features: [
      "cashFlowForecasting",
      "scenarioPlanning",
      "bestWorstCase",
      "customScenarios",
    ],
  },
};

// ============================================================================
// REPORT VIEW MODES
// ============================================================================

export type ReportViewMode = "standard" | "print" | "email" | "pdf";

export interface ReportViewConfig {
  id: ReportViewMode;
  name: string;
  description: string;
  icon: string;
  layout: {
    showHeaders: boolean;
    showFooters: boolean;
    pageBreaks: boolean;
    optimizedFor: "screen" | "print" | "email" | "pdf";
    simplifiedLayout: boolean;
  };
}

export const REPORT_VIEWS: Record<ReportViewMode, ReportViewConfig> = {
  standard: {
    id: "standard",
    name: "Standard View",
    description: "Default on-screen optimized layout",
    icon: "Monitor",
    layout: {
      showHeaders: true,
      showFooters: true,
      pageBreaks: false,
      optimizedFor: "screen",
      simplifiedLayout: false,
    },
  },
  print: {
    id: "print",
    name: "Print View",
    description: "Print-ready formatting with headers and page breaks",
    icon: "Printer",
    layout: {
      showHeaders: true,
      showFooters: true,
      pageBreaks: true,
      optimizedFor: "print",
      simplifiedLayout: false,
    },
  },
  email: {
    id: "email",
    name: "Email View",
    description: "Simplified layout optimized for email delivery",
    icon: "Mail",
    layout: {
      showHeaders: false,
      showFooters: false,
      pageBreaks: false,
      optimizedFor: "email",
      simplifiedLayout: true,
    },
  },
  pdf: {
    id: "pdf",
    name: "PDF View",
    description: "Export-ready, professional formatting",
    icon: "FileText",
    layout: {
      showHeaders: true,
      showFooters: true,
      pageBreaks: true,
      optimizedFor: "pdf",
      simplifiedLayout: false,
    },
  },
};

// ============================================================================
// TRANSACTION VIEW OPTIONS
// ============================================================================

export type TransactionViewMode = "classic" | "simplified" | "split";

export interface TransactionViewConfig {
  id: TransactionViewMode;
  name: string;
  description: string;
  icon: string;
  layout: {
    fullForm: boolean;
    allFieldsVisible: boolean;
    condensed: boolean;
    splitPanel: boolean;
    listPosition: "left" | "top" | "hidden";
  };
}

export const TRANSACTION_VIEWS: Record<
  TransactionViewMode,
  TransactionViewConfig
> = {
  classic: {
    id: "classic",
    name: "Classic View",
    description: "Traditional full-form layout with all fields visible",
    icon: "FormInput",
    layout: {
      fullForm: true,
      allFieldsVisible: true,
      condensed: false,
      splitPanel: false,
      listPosition: "hidden",
    },
  },
  simplified: {
    id: "simplified",
    name: "Simplified View",
    description: "Condensed transaction forms with essential fields only",
    icon: "Minimize2",
    layout: {
      fullForm: true,
      allFieldsVisible: false,
      condensed: true,
      splitPanel: false,
      listPosition: "hidden",
    },
  },
  split: {
    id: "split",
    name: "Split View",
    description: "Transaction list on left, detail/edit panel on right",
    icon: "Columns",
    layout: {
      fullForm: false,
      allFieldsVisible: true,
      condensed: false,
      splitPanel: true,
      listPosition: "left",
    },
  },
};

// ============================================================================
// BANKING VIEW MODES
// ============================================================================

export type BankingViewMode = "for-review" | "categorized" | "excluded" | "all";

export interface BankingViewConfig {
  id: BankingViewMode;
  name: string;
  description: string;
  icon: string;
  filter: {
    matched: boolean | null;
    categorized: boolean | null;
    excluded: boolean | null;
  };
  color: string;
}

export const BANKING_VIEWS: Record<BankingViewMode, BankingViewConfig> = {
  "for-review": {
    id: "for-review",
    name: "For Review",
    description: "Unmatched or uncategorized transactions",
    icon: "AlertCircle",
    filter: {
      matched: false,
      categorized: false,
      excluded: false,
    },
    color: "#f59e0b",
  },
  categorized: {
    id: "categorized",
    name: "Categorized",
    description: "Processed transactions",
    icon: "CheckCircle",
    filter: {
      matched: true,
      categorized: true,
      excluded: false,
    },
    color: "#22c55e",
  },
  excluded: {
    id: "excluded",
    name: "Excluded",
    description: "Transactions removed from books",
    icon: "XCircle",
    filter: {
      matched: null,
      categorized: null,
      excluded: true,
    },
    color: "#ef4444",
  },
  all: {
    id: "all",
    name: "All",
    description: "Complete transaction history",
    icon: "List",
    filter: {
      matched: null,
      categorized: null,
      excluded: null,
    },
    color: "#3b82f6",
  },
};

// ============================================================================
// LIST VIEW OPTIONS
// ============================================================================

export type ListViewMode = "compact" | "expanded" | "grid" | "card";

export interface ListViewConfig {
  id: ListViewMode;
  name: string;
  description: string;
  icon: string;
  density: "compact" | "comfortable" | "spacious";
  style: "list" | "grid" | "card";
  rowHeight: number;
  showGridLines: boolean;
}

export const LIST_VIEWS: Record<ListViewMode, ListViewConfig> = {
  compact: {
    id: "compact",
    name: "Compact",
    description:
      "Dense lists with minimal spacing for maximum items per screen",
    icon: "AlignJustify",
    density: "compact",
    style: "list",
    rowHeight: 32,
    showGridLines: true,
  },
  expanded: {
    id: "expanded",
    name: "Expanded",
    description: "Increased white space for improved readability",
    icon: "List",
    density: "comfortable",
    style: "list",
    rowHeight: 48,
    showGridLines: false,
  },
  grid: {
    id: "grid",
    name: "Grid",
    description: "Spreadsheet-style layout",
    icon: "Table",
    density: "compact",
    style: "grid",
    rowHeight: 32,
    showGridLines: true,
  },
  card: {
    id: "card",
    name: "Card",
    description: "Visual card-based display",
    icon: "LayoutGrid",
    density: "spacious",
    style: "card",
    rowHeight: 120,
    showGridLines: false,
  },
};

// ============================================================================
// ACCESSIBILITY VIEW OPTIONS
// ============================================================================

export type AccessibilityViewMode =
  | "default"
  | "high-contrast"
  | "screen-reader";

export interface AccessibilityViewConfig {
  id: AccessibilityViewMode;
  name: string;
  description: string;
  icon: string;
  features: {
    highContrast: boolean;
    largeText: boolean;
    reducedMotion: boolean;
    screenReaderOptimized: boolean;
    focusIndicators: boolean;
  };
}

export const ACCESSIBILITY_VIEWS: Record<
  AccessibilityViewMode,
  AccessibilityViewConfig
> = {
  default: {
    id: "default",
    name: "Default",
    description: "Standard accessibility settings",
    icon: "Eye",
    features: {
      highContrast: false,
      largeText: false,
      reducedMotion: false,
      screenReaderOptimized: false,
      focusIndicators: true,
    },
  },
  "high-contrast": {
    id: "high-contrast",
    name: "High Contrast",
    description: "Accessibility-compliant color system",
    icon: "Contrast",
    features: {
      highContrast: true,
      largeText: false,
      reducedMotion: false,
      screenReaderOptimized: false,
      focusIndicators: true,
    },
  },
  "screen-reader": {
    id: "screen-reader",
    name: "Screen Reader",
    description: "Structured layouts for assistive technologies",
    icon: "Headphones",
    features: {
      highContrast: false,
      largeText: true,
      reducedMotion: true,
      screenReaderOptimized: true,
      focusIndicators: true,
    },
  },
};

// ============================================================================
// TEMPORARY VIEW MODES
// ============================================================================

export type TemporaryViewMode = "normal" | "presentation" | "fullscreen";

export interface TemporaryViewConfig {
  id: TemporaryViewMode;
  name: string;
  description: string;
  icon: string;
  features: {
    hideChrome: boolean;
    hideToolbar: boolean;
    hideSidebar: boolean;
    hideHeader: boolean;
    maximumWorkspace: boolean;
  };
}

export const TEMPORARY_VIEWS: Record<TemporaryViewMode, TemporaryViewConfig> = {
  normal: {
    id: "normal",
    name: "Normal",
    description: "Standard interface with all elements visible",
    icon: "Monitor",
    features: {
      hideChrome: false,
      hideToolbar: false,
      hideSidebar: false,
      hideHeader: false,
      maximumWorkspace: false,
    },
  },
  presentation: {
    id: "presentation",
    name: "Presentation",
    description: "Clean, distraction-free view for screen sharing",
    icon: "Presentation",
    features: {
      hideChrome: true,
      hideToolbar: true,
      hideSidebar: true,
      hideHeader: true,
      maximumWorkspace: true,
    },
  },
  fullscreen: {
    id: "fullscreen",
    name: "Fullscreen",
    description: "Browser and toolbar elements hidden for maximum workspace",
    icon: "Maximize",
    features: {
      hideChrome: true,
      hideToolbar: true,
      hideSidebar: true,
      hideHeader: true,
      maximumWorkspace: true,
    },
  },
};

// ============================================================================
// SPECIALIZED WORK VIEWS
// ============================================================================

export type SpecializedViewMode =
  | "default"
  | "project"
  | "payroll"
  | "time-tracking";

export interface SpecializedViewConfig {
  id: SpecializedViewMode;
  name: string;
  description: string;
  icon: string;
  features: string[];
  requiredFeature?: string;
}

export const SPECIALIZED_VIEWS: Record<
  SpecializedViewMode,
  SpecializedViewConfig
> = {
  default: {
    id: "default",
    name: "Standard",
    description: "Default accounting workflow",
    icon: "Briefcase",
    features: ["standardWorkflow"],
  },
  project: {
    id: "project",
    name: "Project View",
    description: "Project-centric layout with task and time tracking",
    icon: "FolderKanban",
    features: [
      "projectDashboard",
      "taskTracking",
      "timeTracking",
      "projectReports",
    ],
    requiredFeature: "projects",
  },
  payroll: {
    id: "payroll",
    name: "Payroll View",
    description: "Employee- and payroll-focused navigation",
    icon: "Users",
    features: [
      "employeeManagement",
      "payrollProcessing",
      "taxCalculations",
      "payrollReports",
    ],
    requiredFeature: "payroll",
  },
  "time-tracking": {
    id: "time-tracking",
    name: "Time Tracking",
    description: "Timesheet-focused interface with weekly time-entry",
    icon: "Clock",
    features: ["timesheetEntry", "weeklyView", "timer", "timeReports"],
    requiredFeature: "time_tracking",
  },
};

// ============================================================================
// MULTI-COMPANY VIEWS (Accountant Only)
// ============================================================================

export type MultiCompanyViewMode =
  | "single"
  | "client-dashboard"
  | "client-switcher"
  | "accountant-tools"
  | "batch-actions";

export interface MultiCompanyViewConfig {
  id: MultiCompanyViewMode;
  name: string;
  description: string;
  icon: string;
  features: string[];
  requiredRole: string[];
}

export const MULTI_COMPANY_VIEWS: Record<
  MultiCompanyViewMode,
  MultiCompanyViewConfig
> = {
  single: {
    id: "single",
    name: "Single Company",
    description: "Focus on one company at a time",
    icon: "Building",
    features: ["singleCompanyFocus"],
    requiredRole: ["ALL"],
  },
  "client-dashboard": {
    id: "client-dashboard",
    name: "Client Dashboard",
    description: "Overview of all client companies",
    icon: "LayoutGrid",
    features: [
      "clientOverview",
      "clientMetrics",
      "clientHealthStatus",
      "consolidatedView",
    ],
    requiredRole: ["ACCOUNTANT", "BOOKKEEPER", "ADMIN"],
  },
  "client-switcher": {
    id: "client-switcher",
    name: "Client Switcher",
    description: "Instant switching between client books",
    icon: "Switch",
    features: [
      "quickClientSwitch",
      "recentClients",
      "clientSearch",
      "favorites",
    ],
    requiredRole: ["ACCOUNTANT", "BOOKKEEPER", "ADMIN"],
  },
  "accountant-tools": {
    id: "accountant-tools",
    name: "Accountant Tools",
    description: "Reclassify, write-offs, and bulk fixes",
    icon: "Wrench",
    features: [
      "reclassifyTransactions",
      "writeOffs",
      "bulkEdits",
      "adjustmentTools",
    ],
    requiredRole: ["ACCOUNTANT", "BOOKKEEPER", "ADMIN"],
  },
  "batch-actions": {
    id: "batch-actions",
    name: "Batch Actions",
    description: "Multi-client transaction management",
    icon: "Layers",
    features: [
      "multiClientActions",
      "batchCategorization",
      "bulkReconciliation",
      "crossClientReports",
    ],
    requiredRole: ["ACCOUNTANT", "BOOKKEEPER", "ADMIN"],
  },
};

// ============================================================================
// REGIONAL VIEW VARIATIONS
// ============================================================================

export type RegionalViewMode = "default" | "vat" | "gst" | "sales-tax";

export interface RegionalViewConfig {
  id: RegionalViewMode;
  name: string;
  description: string;
  icon: string;
  region: string;
  taxFeatures: {
    taxName: string;
    taxId: string;
    taxRates: string[];
    taxReports: string[];
    taxWorkflows: string[];
  };
}

export const REGIONAL_VIEWS: Record<RegionalViewMode, RegionalViewConfig> = {
  default: {
    id: "default",
    name: "Default",
    description: "Standard tax configuration",
    icon: "Globe",
    region: "global",
    taxFeatures: {
      taxName: "Tax",
      taxId: "Tax ID",
      taxRates: ["Standard"],
      taxReports: ["Tax Summary"],
      taxWorkflows: ["Basic"],
    },
  },
  vat: {
    id: "vat",
    name: "VAT (UK/EU)",
    description: "VAT-specific workflows and reporting for UK/EU",
    icon: "Stamp",
    region: "UK/EU",
    taxFeatures: {
      taxName: "VAT",
      taxId: "VAT Number",
      taxRates: ["Standard 20%", "Reduced 5%", "Zero 0%"],
      taxReports: ["VAT Return", "EC Sales List", "Intrastat"],
      taxWorkflows: ["MTD Compliance", "Quarterly Filing"],
    },
  },
  gst: {
    id: "gst",
    name: "GST (CA/AU/IN)",
    description: "GST-centric layouts for Canada, Australia, India",
    icon: "Receipt",
    region: "CA/AU/IN",
    taxFeatures: {
      taxName: "GST",
      taxId: "GST Number",
      taxRates: ["5%", "10%", "12%", "18%", "28%"],
      taxReports: ["GSTR-1", "GSTR-3B", "BAS"],
      taxWorkflows: ["Input Credit", "Reverse Charge"],
    },
  },
  "sales-tax": {
    id: "sales-tax",
    name: "Sales Tax (US)",
    description: "State-based sales tax workflows for United States",
    icon: "MapPin",
    region: "US",
    taxFeatures: {
      taxName: "Sales Tax",
      taxId: "Tax Permit",
      taxRates: ["State Varies", "County", "City", "Special"],
      taxReports: ["Sales Tax Return", "Exemption Report"],
      taxWorkflows: ["Multi-State", "Economic Nexus"],
    },
  },
};

// ============================================================================
// COMPLETE VIEW STATE
// ============================================================================

export interface ViewState {
  // Main view mode
  mainView: MainViewMode;

  // Dashboard view
  dashboardView: DashboardViewMode;

  // Report view mode
  reportView: ReportViewMode;

  // Transaction view mode
  transactionView: TransactionViewMode;

  // Banking view filter
  bankingView: BankingViewMode;

  // List view preference
  listView: ListViewMode;

  // Accessibility mode
  accessibility: AccessibilityViewMode;

  // Temporary mode (not persisted)
  temporaryView: TemporaryViewMode;

  // Specialized view
  specializedView: SpecializedViewMode;

  // Multi-company view (accountants only)
  multiCompanyView: MultiCompanyViewMode;

  // Regional view
  regionalView: RegionalViewMode;

  // Timestamps
  lastModified: Date;
  modifiedBy: string;
}

export const DEFAULT_VIEW_STATE: ViewState = {
  mainView: "business",
  dashboardView: "performance",
  reportView: "standard",
  transactionView: "classic",
  bankingView: "for-review",
  listView: "expanded",
  accessibility: "default",
  temporaryView: "normal",
  specializedView: "default",
  multiCompanyView: "single",
  regionalView: "default",
  lastModified: new Date(),
  modifiedBy: "system",
};

// ============================================================================
// VIEW PERMISSIONS
// ============================================================================

export function canAccessView(
  viewId: string,
  userRole: string,
  userTier?: string,
  enabledFeatures?: string[],
): boolean {
  // Main views
  if (viewId in MAIN_VIEWS) {
    const view = MAIN_VIEWS[viewId as MainViewMode];
    return (
      view.targetRoles.includes(userRole) || view.targetRoles.includes("ALL")
    );
  }

  // Dashboard views
  if (viewId in DASHBOARD_VIEWS) {
    const view = DASHBOARD_VIEWS[viewId as DashboardViewMode];
    if (view.requiredTier && userTier !== view.requiredTier) {
      return false;
    }
    return true;
  }

  // Multi-company views (accountants only)
  if (viewId in MULTI_COMPANY_VIEWS) {
    const view = MULTI_COMPANY_VIEWS[viewId as MultiCompanyViewMode];
    return (
      view.requiredRole.includes(userRole) || view.requiredRole.includes("ALL")
    );
  }

  // Specialized views
  if (viewId in SPECIALIZED_VIEWS) {
    const view = SPECIALIZED_VIEWS[viewId as SpecializedViewMode];
    if (
      view.requiredFeature &&
      !enabledFeatures?.includes(view.requiredFeature)
    ) {
      return false;
    }
    return true;
  }

  return true;
}
