export {
  ApiClient,
  apiClient,
  handleApiError,
  isApiError,
} from "./api-client";
export { DashboardService, dashboardService } from "./dashboard.service";
export { offlineService } from "./offline.service";

// Export types
export type { ApiResponse, ApiError } from "./api-client";
export type {
  DashboardKPI,
  Invoice,
  InvoiceItem,
  Transaction,
  Customer,
  ExpenseCategory,
  CashFlowData,
} from "./dashboard.service";
export type { OfflineCache, OfflineQueueItem } from "./offline.service";
