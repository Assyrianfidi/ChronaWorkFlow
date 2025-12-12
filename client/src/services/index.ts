export { ApiClient, apiClient, handleApiError, isApiError } from './api-client.js';
export { DashboardService, dashboardService } from './dashboard.service.js';
export { offlineService } from './offline.service.js';

// Export types
export type { ApiResponse, ApiError } from './api-client.js';
export type {
  DashboardKPI,
  Invoice,
  InvoiceItem,
  Transaction,
  Customer,
  ExpenseCategory,
  CashFlowData,
} from './dashboard.service.js';
export type { OfflineCache, OfflineQueueItem } from './offline.service.js';
