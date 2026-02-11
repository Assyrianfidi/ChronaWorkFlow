/**
 * ViewContext - Enterprise View Architecture State Management
 * Manages all view modes: Business/Accountant, Dashboard, Report, Transaction, etc.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import {
  ViewState,
  DEFAULT_VIEW_STATE,
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
  canAccessView,
} from '@/config/view.config';

// ============================================================================
// STORAGE KEY
// ============================================================================

const VIEW_STORAGE_KEY = 'accubooks-view-preferences';

// ============================================================================
// CONTEXT TYPE
// ============================================================================

interface ViewContextType {
  // Current state
  viewState: ViewState;
  
  // Main view switching
  mainView: MainViewMode;
  setMainView: (view: MainViewMode) => void;
  mainViewConfig: typeof MAIN_VIEWS[MainViewMode];
  
  // Dashboard view
  dashboardView: DashboardViewMode;
  setDashboardView: (view: DashboardViewMode) => void;
  dashboardViewConfig: typeof DASHBOARD_VIEWS[DashboardViewMode];
  
  // Report view
  reportView: ReportViewMode;
  setReportView: (view: ReportViewMode) => void;
  reportViewConfig: typeof REPORT_VIEWS[ReportViewMode];
  
  // Transaction view
  transactionView: TransactionViewMode;
  setTransactionView: (view: TransactionViewMode) => void;
  transactionViewConfig: typeof TRANSACTION_VIEWS[TransactionViewMode];
  
  // Banking view
  bankingView: BankingViewMode;
  setBankingView: (view: BankingViewMode) => void;
  bankingViewConfig: typeof BANKING_VIEWS[BankingViewMode];
  
  // List view
  listView: ListViewMode;
  setListView: (view: ListViewMode) => void;
  listViewConfig: typeof LIST_VIEWS[ListViewMode];
  
  // Accessibility
  accessibility: AccessibilityViewMode;
  setAccessibility: (view: AccessibilityViewMode) => void;
  accessibilityConfig: typeof ACCESSIBILITY_VIEWS[AccessibilityViewMode];
  
  // Temporary views (not persisted)
  temporaryView: TemporaryViewMode;
  setTemporaryView: (view: TemporaryViewMode) => void;
  temporaryViewConfig: typeof TEMPORARY_VIEWS[TemporaryViewMode];
  enterPresentationMode: () => void;
  exitPresentationMode: () => void;
  toggleFullscreen: () => void;
  
  // Specialized view
  specializedView: SpecializedViewMode;
  setSpecializedView: (view: SpecializedViewMode) => void;
  specializedViewConfig: typeof SPECIALIZED_VIEWS[SpecializedViewMode];
  
  // Multi-company view
  multiCompanyView: MultiCompanyViewMode;
  setMultiCompanyView: (view: MultiCompanyViewMode) => void;
  multiCompanyViewConfig: typeof MULTI_COMPANY_VIEWS[MultiCompanyViewMode];
  
  // Regional view
  regionalView: RegionalViewMode;
  setRegionalView: (view: RegionalViewMode) => void;
  regionalViewConfig: typeof REGIONAL_VIEWS[RegionalViewMode];
  
  // Utility functions
  resetToDefaults: () => void;
  canAccessView: (viewId: string) => boolean;
  
  // Terminology helper (based on main view)
  getTerminology: (key: keyof typeof MAIN_VIEWS['business']['terminology']) => string;
  
  // Loading state
  isLoading: boolean;
}

// ============================================================================
// CREATE CONTEXT
// ============================================================================

const ViewContext = createContext<ViewContextType | undefined>(undefined);

// ============================================================================
// VIEW PROVIDER PROPS
// ============================================================================

interface ViewProviderProps {
  children: ReactNode;
  userRole?: string;
  userTier?: string;
  enabledFeatures?: string[];
  defaultState?: Partial<ViewState>;
}

// ============================================================================
// VIEW PROVIDER COMPONENT
// ============================================================================

export function ViewProvider({
  children,
  userRole = 'USER',
  userTier = 'basic',
  enabledFeatures = [],
  defaultState = {},
}: ViewProviderProps) {
  const [viewState, setViewState] = useState<ViewState>({
    ...DEFAULT_VIEW_STATE,
    ...defaultState,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load view preferences from localStorage
  useEffect(() => {
    const loadViewPreferences = () => {
      try {
        const stored = localStorage.getItem(VIEW_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Don't load temporary view from storage
          const { temporaryView, ...restored } = parsed;
          setViewState(prev => ({
            ...prev,
            ...restored,
            // Always reset temporary view to normal on load
            temporaryView: 'normal',
          }));
        }
      } catch (error) {
        console.error('Failed to load view preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadViewPreferences();
  }, []);

  // Persist view preferences (excluding temporary view)
  useEffect(() => {
    if (isLoading) return;
    
    const persistState = {
      ...viewState,
      temporaryView: 'normal', // Never persist temporary views
      lastModified: new Date(),
    };
    
    localStorage.setItem(VIEW_STORAGE_KEY, JSON.stringify(persistState));
  }, [viewState, isLoading]);

  // ============================================================================
  // MAIN VIEW
  // ============================================================================

  const setMainView = useCallback((view: MainViewMode) => {
    if (!canAccessView(view, userRole, userTier, enabledFeatures)) {
      console.warn(`User cannot access main view: ${view}`);
      return;
    }
    setViewState(prev => ({ ...prev, mainView: view }));
  }, [userRole, userTier, enabledFeatures]);

  // ============================================================================
  // DASHBOARD VIEW
  // ============================================================================

  const setDashboardView = useCallback((view: DashboardViewMode) => {
    if (!canAccessView(view, userRole, userTier, enabledFeatures)) {
      console.warn(`User cannot access dashboard view: ${view}`);
      return;
    }
    setViewState(prev => ({ ...prev, dashboardView: view }));
  }, [userRole, userTier, enabledFeatures]);

  // ============================================================================
  // REPORT VIEW
  // ============================================================================

  const setReportView = useCallback((view: ReportViewMode) => {
    setViewState(prev => ({ ...prev, reportView: view }));
  }, []);

  // ============================================================================
  // TRANSACTION VIEW
  // ============================================================================

  const setTransactionView = useCallback((view: TransactionViewMode) => {
    setViewState(prev => ({ ...prev, transactionView: view }));
  }, []);

  // ============================================================================
  // BANKING VIEW
  // ============================================================================

  const setBankingView = useCallback((view: BankingViewMode) => {
    setViewState(prev => ({ ...prev, bankingView: view }));
  }, []);

  // ============================================================================
  // LIST VIEW
  // ============================================================================

  const setListView = useCallback((view: ListViewMode) => {
    setViewState(prev => ({ ...prev, listView: view }));
  }, []);

  // ============================================================================
  // ACCESSIBILITY
  // ============================================================================

  const setAccessibility = useCallback((view: AccessibilityViewMode) => {
    setViewState(prev => ({ ...prev, accessibility: view }));
    
    // Apply accessibility features to document
    const root = document.documentElement;
    const config = ACCESSIBILITY_VIEWS[view];
    
    if (config.features.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    if (config.features.largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }
    
    if (config.features.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
    
    if (config.features.screenReaderOptimized) {
      root.classList.add('screen-reader');
    } else {
      root.classList.remove('screen-reader');
    }
  }, []);

  // ============================================================================
  // TEMPORARY VIEWS
  // ============================================================================

  const setTemporaryView = useCallback((view: TemporaryViewMode) => {
    setViewState(prev => ({ ...prev, temporaryView: view }));
    
    const config = TEMPORARY_VIEWS[view];
    const root = document.documentElement;
    
    if (config.features.maximumWorkspace) {
      root.classList.add('presentation-mode');
    } else {
      root.classList.remove('presentation-mode');
    }
  }, []);

  const enterPresentationMode = useCallback(() => {
    setTemporaryView('presentation');
  }, [setTemporaryView]);

  const exitPresentationMode = useCallback(() => {
    setTemporaryView('normal');
  }, [setTemporaryView]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setTemporaryView('fullscreen');
    } else {
      document.exitFullscreen().catch(() => {});
      setTemporaryView('normal');
    }
  }, [setTemporaryView]);

  // ============================================================================
  // SPECIALIZED VIEW
  // ============================================================================

  const setSpecializedView = useCallback((view: SpecializedViewMode) => {
    if (!canAccessView(view, userRole, userTier, enabledFeatures)) {
      console.warn(`User cannot access specialized view: ${view}`);
      return;
    }
    setViewState(prev => ({ ...prev, specializedView: view }));
  }, [userRole, userTier, enabledFeatures]);

  // ============================================================================
  // MULTI-COMPANY VIEW
  // ============================================================================

  const setMultiCompanyView = useCallback((view: MultiCompanyViewMode) => {
    if (!canAccessView(view, userRole, userTier, enabledFeatures)) {
      console.warn(`User cannot access multi-company view: ${view}`);
      return;
    }
    setViewState(prev => ({ ...prev, multiCompanyView: view }));
  }, [userRole, userTier, enabledFeatures]);

  // ============================================================================
  // REGIONAL VIEW
  // ============================================================================

  const setRegionalView = useCallback((view: RegionalViewMode) => {
    setViewState(prev => ({ ...prev, regionalView: view }));
  }, []);

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const resetToDefaults = useCallback(() => {
    setViewState({
      ...DEFAULT_VIEW_STATE,
      temporaryView: 'normal',
    });
    localStorage.removeItem(VIEW_STORAGE_KEY);
  }, []);

  const canAccessViewCheck = useCallback((viewId: string) => {
    return canAccessView(viewId, userRole, userTier, enabledFeatures);
  }, [userRole, userTier, enabledFeatures]);

  // Get terminology based on current main view
  const getTerminology = useCallback(
    (key: keyof typeof MAIN_VIEWS['business']['terminology']) => {
      return MAIN_VIEWS[viewState.mainView].terminology[key];
    },
    [viewState.mainView]
  );

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const value: ViewContextType = {
    // State
    viewState,
    isLoading,
    
    // Main view
    mainView: viewState.mainView,
    setMainView,
    mainViewConfig: MAIN_VIEWS[viewState.mainView],
    
    // Dashboard
    dashboardView: viewState.dashboardView,
    setDashboardView,
    dashboardViewConfig: DASHBOARD_VIEWS[viewState.dashboardView],
    
    // Report
    reportView: viewState.reportView,
    setReportView,
    reportViewConfig: REPORT_VIEWS[viewState.reportView],
    
    // Transaction
    transactionView: viewState.transactionView,
    setTransactionView,
    transactionViewConfig: TRANSACTION_VIEWS[viewState.transactionView],
    
    // Banking
    bankingView: viewState.bankingView,
    setBankingView,
    bankingViewConfig: BANKING_VIEWS[viewState.bankingView],
    
    // List
    listView: viewState.listView,
    setListView,
    listViewConfig: LIST_VIEWS[viewState.listView],
    
    // Accessibility
    accessibility: viewState.accessibility,
    setAccessibility,
    accessibilityConfig: ACCESSIBILITY_VIEWS[viewState.accessibility],
    
    // Temporary
    temporaryView: viewState.temporaryView,
    setTemporaryView,
    temporaryViewConfig: TEMPORARY_VIEWS[viewState.temporaryView],
    enterPresentationMode,
    exitPresentationMode,
    toggleFullscreen,
    
    // Specialized
    specializedView: viewState.specializedView,
    setSpecializedView,
    specializedViewConfig: SPECIALIZED_VIEWS[viewState.specializedView],
    
    // Multi-company
    multiCompanyView: viewState.multiCompanyView,
    setMultiCompanyView,
    multiCompanyViewConfig: MULTI_COMPANY_VIEWS[viewState.multiCompanyView],
    
    // Regional
    regionalView: viewState.regionalView,
    setRegionalView,
    regionalViewConfig: REGIONAL_VIEWS[viewState.regionalView],
    
    // Utilities
    resetToDefaults,
    canAccessView: canAccessViewCheck,
    getTerminology,
  };

  return (
    <ViewContext.Provider value={value}>
      {children}
    </ViewContext.Provider>
  );
}

// ============================================================================
// USE VIEW HOOK
// ============================================================================

export function useView(): ViewContextType {
  const context = useContext(ViewContext);
  if (context === undefined) {
    throw new Error('useView must be used within a ViewProvider');
  }
  return context;
}

export default ViewProvider;
