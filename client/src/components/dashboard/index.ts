export { AnalyticsKPI, type KPIMetric } from "./AnalyticsKPI.js";
export { LatestInvoices, type Invoice } from "./LatestInvoices.js";
export { ExpenseBreakdown, type ExpenseCategory } from "./ExpenseBreakdown.js";
export { CashFlowChart, type CashFlowData } from "./CashFlowChart.js";
export { ZeroState } from "./ZeroState.js";
export {
  LoadingSkeleton,
  KPISkeleton,
  TableSkeleton,
  ChartSkeleton,
} from "./LoadingSkeleton.js";

// Role-based dashboard components - renamed to avoid conflicts
export { default as DashboardMetricCard } from "./MetricCard.js";
export { default as QuickActions } from "./QuickActions.js";
export { default as ActivityFeed } from "./ActivityFeed.js";
export { default as InventoryStatus } from "./InventoryStatus.js";
