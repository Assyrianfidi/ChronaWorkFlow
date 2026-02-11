/**
 * View Architecture Index
 * Export all view-related components and hooks
 */

// Components
export {
  ViewSwitcherDropdown,
  ViewToggleButton,
  ViewSwitcherDialog,
  ViewBadge,
} from './ViewSwitcher';

export { DashboardViewSwitcher } from './DashboardViewSwitcher';
export { ReportViewModeSwitcher } from './ReportViewModeSwitcher';
export { TransactionViewSwitcher } from './TransactionViewSwitcher';
export { BankingViewSwitcher } from './BankingViewSwitcher';
export { ListViewSwitcher } from './ListViewSwitcher';
export { AccessibilityViewSwitcher } from './AccessibilityViewSwitcher';
export { PresentationModeExit } from './PresentationModeExit';

// Hooks
export { useView } from '@/contexts/ViewContext';
export { useViewNavigation } from '@/hooks/useViewNavigation';

// Configuration
export {
  MAIN_VIEWS,
  DASHBOARD_VIEWS,
  REPORT_VIEWS,
  TRANSACTION_VIEWS,
  BANKING_VIEWS,
  LIST_VIEWS,
  ACCESSIBILITY_VIEWS,
  TEMPORARY_VIEWS,
  SPECIALIZED_VIEWS,
  MULTI_COMPANY_VIEWS,
  REGIONAL_VIEWS,
  DEFAULT_VIEW_STATE,
  canAccessView,
} from '@/config/view.config';

// Types
export type {
  ViewState,
  MainViewMode,
  DashboardViewMode,
  ReportViewMode,
  TransactionViewMode,
  BankingViewMode,
  ListViewMode,
  AccessibilityViewMode,
  TemporaryViewMode,
  SpecializedViewMode,
  MultiCompanyViewMode,
  RegionalViewMode,
  MainViewConfig,
  DashboardViewConfig,
  ReportViewConfig,
  TransactionViewConfig,
  BankingViewConfig,
  ListViewConfig,
  AccessibilityViewConfig,
  TemporaryViewConfig,
  SpecializedViewConfig,
  MultiCompanyViewConfig,
  RegionalViewConfig,
} from '@/config/view.config';
