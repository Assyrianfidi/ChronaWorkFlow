/**
 * Central Analytics Types
 * Privacy-safe, vendor-agnostic analytics abstraction
 */

export type EventCategory =
  | 'auth'
  | 'dashboard'
  | 'scenario'
  | 'forecast'
  | 'trust'
  | 'error'
  | 'performance';

export interface BaseAnalyticsEvent {
  category: EventCategory;
  action: string;
  timestamp: number;
  sessionId: string;
  tenantIdHash?: string; // Hashed, never raw
  userId?: string; // Hashed, never raw
  userRole?: string;
  featureFlags?: Record<string, boolean>;
}

export interface AuthEvent extends BaseAnalyticsEvent {
  category: 'auth';
  action: 'login_success' | 'login_failure' | 'logout' | 'session_expired';
  metadata?: {
    method?: 'email' | 'google' | 'sso';
    failureReason?: string;
  };
}

export interface DashboardEvent extends BaseAnalyticsEvent {
  category: 'dashboard';
  action: 'viewed' | 'kpi_clicked' | 'refresh';
  metadata?: {
    kpiType?: string;
    loadTime?: number;
  };
}

export interface ScenarioEvent extends BaseAnalyticsEvent {
  category: 'scenario';
  action:
    | 'created'
    | 'edited'
    | 'deleted'
    | 'duplicated'
    | 'comparison_viewed'
    | 'wizard_started'
    | 'wizard_completed'
    | 'wizard_abandoned';
  metadata?: {
    scenarioType?: string;
    stepNumber?: number;
    comparisonCount?: number;
  };
}

export interface ForecastEvent extends BaseAnalyticsEvent {
  category: 'forecast';
  action: 'generated' | 'viewed' | 'regenerated' | 'exported';
  metadata?: {
    forecastType?: string;
    confidenceScore?: number;
    executionTime?: number;
    dataPoints?: number;
  };
}

export interface TrustEvent extends BaseAnalyticsEvent {
  category: 'trust';
  action:
    | 'calculation_explainer_opened'
    | 'calculation_explainer_closed'
    | 'calculation_step_expanded'
    | 'assumptions_panel_viewed'
    | 'assumption_clicked'
    | 'confidence_indicator_hovered'
    | 'confidence_indicator_clicked';
  metadata?: {
    confidenceScore?: number;
    assumptionSensitivity?: 'HIGH' | 'MEDIUM' | 'LOW';
    stepNumber?: number;
  };
}

export interface ErrorEvent extends BaseAnalyticsEvent {
  category: 'error';
  action:
    | 'runtime_error'
    | 'api_error'
    | 'render_error'
    | 'validation_error'
    | 'network_error';
  metadata: {
    errorType: string;
    errorMessage: string;
    componentName?: string;
    apiEndpoint?: string;
    statusCode?: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
  };
}

export interface PerformanceEvent extends BaseAnalyticsEvent {
  category: 'performance';
  action:
    | 'page_load'
    | 'api_call'
    | 'forecast_calculation'
    | 'chart_render'
    | 'component_mount';
  metadata: {
    duration: number;
    endpoint?: string;
    componentName?: string;
    dataSize?: number;
  };
}

export type AnalyticsEvent =
  | AuthEvent
  | DashboardEvent
  | ScenarioEvent
  | ForecastEvent
  | TrustEvent
  | ErrorEvent
  | PerformanceEvent;

export interface AnalyticsProvider {
  track(event: AnalyticsEvent): void;
  identify(userId: string, traits?: Record<string, any>): void;
  page(name: string, properties?: Record<string, any>): void;
  flush(): Promise<void>;
}

export interface AnalyticsConfig {
  enabled: boolean;
  debug: boolean;
  providers: string[];
  sampleRate?: number; // 0-1, for performance events
  excludePII: boolean;
}
