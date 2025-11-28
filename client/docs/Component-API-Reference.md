# AccuBooks Component API Reference

## Table of Contents
1. [Core Components](#core-components)
2. [Adaptive Components](#adaptive-components)
3. [Interaction Components](#interaction-components)
4. [Analytics Components](#analytics-components)
5. [Automation Components](#automation-components)
6. [Integration Components](#integration-components)
7. [Accessibility Components](#accessibility-components)
8. [UI Components](#ui-components)

## Core Components

### Authentication Components

#### `LoginForm`
```tsx
interface LoginFormProps {
  onSubmit: (credentials: LoginCredentials) => Promise<void>;
  loading?: boolean;
  error?: string;
  className?: string;
}

interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}
```

**Usage:**
```tsx
<LoginForm 
  onSubmit={handleLogin}
  loading={isLoading}
  error={errorMessage}
/>
```

#### `AuthProvider`
```tsx
interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  loading: boolean;
  error: string | null;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'viewer';
  preferences: UserPreferences;
}
```

**Usage:**
```tsx
const { user, login, logout } = useAuth();
```

### Layout Components

#### `Layout`
```tsx
interface LayoutProps {
  children: React.ReactNode;
  sidebar?: boolean;
  header?: boolean;
  footer?: boolean;
  className?: string;
}
```

**Usage:**
```tsx
<Layout sidebar={true}>
  <main>Main content</main>
</Layout>
```

#### `Navigation`
```tsx
interface NavigationProps {
  items: NavigationItem[];
  activeItem?: string;
  onItemClick?: (item: NavigationItem) => void;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

interface NavigationItem {
  id: string;
  label: string;
  href?: string;
  icon?: React.ReactNode;
  badge?: string | number;
  children?: NavigationItem[];
}
```

## Adaptive Components

### `AdaptiveLayoutEngine`
```tsx
interface AdaptiveLayoutEngineProps {
  children: React.ReactNode;
  breakpoints?: BreakpointConfig;
  className?: string;
}

interface BreakpointConfig {
  mobile: number;
  tablet: number;
  desktop: number;
  wide: number;
}
```

**Usage:**
```tsx
<AdaptiveLayoutEngine>
  <App />
</AdaptiveLayoutEngine>
```

### `UserExperienceModeProvider`
```tsx
interface UXModeContextType {
  mode: 'normal' | 'focus' | 'immersive' | 'minimal';
  setMode: (mode: UXMode) => void;
  preferences: UXPreferences;
  updatePreferences: (prefs: Partial<UXPreferences>) => void;
}

interface UXPreferences {
  reduceMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  screenReader: boolean;
}
```

**Usage:**
```tsx
const { mode, setMode } = useUserExperienceMode();
```

## Interaction Components

### `WorkflowManager`
```tsx
interface WorkflowManagerProps {
  workflows: Workflow[];
  onWorkflowStart?: (workflow: Workflow) => void;
  onWorkflowComplete?: (workflow: Workflow, result: any) => void;
  className?: string;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  triggers: WorkflowTrigger[];
  conditions?: WorkflowCondition[];
}

interface WorkflowStep {
  id: string;
  name: string;
  type: 'action' | 'condition' | 'delay' | 'approval';
  config: StepConfig;
  nextSteps?: string[];
}
```

**Usage:**
```tsx
<WorkflowManager 
  workflows={availableWorkflows}
  onWorkflowStart={handleWorkflowStart}
/>
```

### `PredictiveAssistant`
```tsx
interface PredictiveAssistantProps {
  enabled?: boolean;
  context?: AssistantContext;
  onSuggestion?: (suggestion: AssistantSuggestion) => void;
  className?: string;
}

interface AssistantContext {
  currentPage: string;
  userHistory: UserAction[];
  currentTask?: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening';
}

interface AssistantSuggestion {
  id: string;
  type: 'action' | 'navigation' | 'information';
  title: string;
  description: string;
  action?: () => void;
  priority: 'low' | 'medium' | 'high';
}
```

**Usage:**
```tsx
<PredictiveAssistant 
  enabled={true}
  context={assistantContext}
  onSuggestion={handleSuggestion}
/>
```

## Analytics Components

### `AnalyticsEngine`
```tsx
interface AnalyticsEngineProps {
  children: React.ReactNode;
  trackingEnabled?: boolean;
  config?: AnalyticsConfig;
}

interface AnalyticsConfig {
  trackPageViews: boolean;
  trackUserActions: boolean;
  trackPerformance: boolean;
  customEvents?: CustomEventConfig[];
}
```

**Usage:**
```tsx
<AnalyticsEngine trackingEnabled={true}>
  <App />
</AnalyticsEngine>
```

### `DataVisualization`
```tsx
interface DataVisualizationProps {
  data: any[];
  type: ChartType;
  config: VisualizationConfig;
  onDataPointClick?: (point: DataPoint) => void;
  className?: string;
}

type ChartType = 'line' | 'bar' | 'pie' | 'scatter' | 'heatmap';

interface VisualizationConfig {
  title?: string;
  xAxis?: AxisConfig;
  yAxis?: AxisConfig;
  colors?: string[];
  responsive?: boolean;
  animation?: boolean;
}
```

**Usage:**
```tsx
<DataVisualization 
  data={salesData}
  type="line"
  config={chartConfig}
  onDataPointClick={handleDataClick}
/>
```

### `BusinessIntelligence`
```tsx
interface BusinessIntelligenceProps {
  dashboards: Dashboard[];
  activeDashboard?: string;
  onDashboardChange?: (dashboardId: string) => void;
  className?: string;
}

interface Dashboard {
  id: string;
  name: string;
  widgets: Widget[];
  layout: LayoutConfig;
  filters?: FilterConfig[];
}

interface Widget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'text';
  title: string;
  dataSource: string;
  config: WidgetConfig;
}
```

**Usage:**
```tsx
<BusinessIntelligence 
  dashboards={dashboards}
  activeDashboard={currentDashboard}
/>
```

## Automation Components

### `AutomationEngine`
```tsx
interface AutomationEngineProps {
  children: React.ReactNode;
  rules: AutomationRule[];
  onRuleExecute?: (rule: AutomationRule, result: any) => void;
}

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  enabled: boolean;
}
```

**Usage:**
```tsx
<AutomationEngine rules={automationRules}>
  <App />
</AutomationEngine>
```

### `SmartWorkflow`
```tsx
interface SmartWorkflowProps {
  workflow: Workflow;
  onStepComplete?: (step: WorkflowStep, result: any) => void;
  onWorkflowComplete?: (result: any) => void;
  className?: string;
}
```

**Usage:**
```tsx
<SmartWorkflow 
  workflow={currentWorkflow}
  onStepComplete={handleStepComplete}
/>
```

### `IntelligentScheduler`
```tsx
interface IntelligentSchedulerProps {
  tasks: ScheduledTask[];
  onTaskExecute?: (task: ScheduledTask) => void;
  onTaskComplete?: (task: ScheduledTask, result: any) => void;
  className?: string;
}

interface ScheduledTask {
  id: string;
  name: string;
  schedule: ScheduleConfig;
  action: () => Promise<any>;
  priority: 'low' | 'medium' | 'high';
}
```

**Usage:**
```tsx
<IntelligentScheduler 
  tasks={scheduledTasks}
  onTaskExecute={handleTaskExecution}
/>
```

## Integration Components

### `EnterpriseAPIGateway`
```tsx
interface EnterpriseAPIGatewayProps {
  children: React.ReactNode;
  config: GatewayConfig;
  onApiCall?: (request: ApiRequest) => void;
  onResponse?: (response: ApiResponse) => void;
}

interface GatewayConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  authentication: AuthConfig;
  rateLimiting?: RateLimitConfig;
}
```

**Usage:**
```tsx
<EnterpriseAPIGateway config={gatewayConfig}>
  <App />
</EnterpriseAPIGateway>
```

### `GraphQLServer`
```tsx
interface GraphQLServerProps {
  children: React.ReactNode;
  endpoint: string;
  schema?: GraphQLSchema;
  onQuery?: (query: string, variables: any) => void;
  onMutation?: (mutation: string, variables: any) => void;
}
```

**Usage:**
```tsx
<GraphQLServer 
  endpoint="/graphql"
  onQuery={handleQuery}
>
  <App />
</GraphQLServer>
```

### `ThirdPartyIntegrations`
```tsx
interface ThirdPartyIntegrationsProps {
  children: React.ReactNode;
  integrations: Integration[];
  onIntegrationConnect?: (integration: Integration) => void;
  onIntegrationDisconnect?: (integrationId: string) => void;
}

interface Integration {
  id: string;
  name: string;
  type: 'oauth' | 'api-key' | 'webhook';
  config: IntegrationConfig;
  status: 'connected' | 'disconnected' | 'error';
}
```

**Usage:**
```tsx
<ThirdPartyIntegrations 
  integrations={availableIntegrations}
  onIntegrationConnect={handleConnection}
>
  <App />
</ThirdPartyIntegrations>
```

### `WebhookManager`
```tsx
interface WebhookManagerProps {
  children: React.ReactNode;
  webhooks: Webhook[];
  onWebhookTrigger?: (webhook: Webhook, payload: any) => void;
  onWebhookError?: (webhook: Webhook, error: Error) => void;
}

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret?: string;
  active: boolean;
}
```

**Usage:**
```tsx
<WebhookManager 
  webhooks={configuredWebhooks}
  onWebhookTrigger={handleWebhookTrigger}
>
  <App />
</WebhookManager>
```

## Accessibility Components

### `VoiceCommandEngine`
```tsx
interface VoiceCommandEngineProps {
  children: React.ReactNode;
  commands?: VoiceCommand[];
  onCommandRecognized?: (command: VoiceCommand) => void;
  onError?: (error: Error) => void;
}

interface VoiceCommand {
  id: string;
  phrase: string | string[];
  action: string;
  parameters?: Record<string, any>;
  description: string;
}
```

**Usage:**
```tsx
<VoiceCommandEngine commands={voiceCommands}>
  <App />
</VoiceCommandEngine>
```

### `ScreenReaderEnhancements`
```tsx
interface ScreenReaderEnhancementsProps {
  children: React.ReactNode;
  settings?: ScreenReaderSettings;
  onAnnouncement?: (message: string) => void;
}

interface ScreenReaderSettings {
  rate: number;
  pitch: number;
  volume: number;
  voice: string;
  language: string;
}
```

**Usage:**
```tsx
<ScreenReaderEnhancements settings={screenReaderSettings}>
  <App />
</ScreenReaderEnhancements>
```

### `VisualModeEngine`
```tsx
interface VisualModeEngineProps {
  children: React.ReactNode;
  mode?: VisualMode;
  onModeChange?: (mode: VisualMode) => void;
}

interface VisualMode {
  id: string;
  name: string;
  type: 'high-contrast' | 'colorblind' | 'dyslexia' | 'low-vision';
  settings: VisualModeSettings;
}
```

**Usage:**
```tsx
<VisualModeEngine mode={currentMode}>
  <App />
</VisualModeEngine>
```

### `RealTimeAccessibilityMonitor`
```tsx
interface RealTimeAccessibilityMonitorProps {
  children: React.ReactNode;
  rules?: AccessibilityRule[];
  onViolation?: (violation: AccessibilityViolation) => void;
  onFix?: (violation: AccessibilityViolation) => void;
}

interface AccessibilityRule {
  id: string;
  name: string;
  selector: string;
  check: (element: Element) => boolean;
  fix?: (element: Element) => void;
}
```

**Usage:**
```tsx
<RealTimeAccessibilityMonitor 
  rules={accessibilityRules}
  onViolation={handleViolation}
>
  <App />
</RealTimeAccessibilityMonitor>
```

## UI Components

### Chart Components

#### `ChartContainer`
```tsx
interface ChartContainerProps {
  children: React.ReactNode;
  config: ChartConfig;
  className?: string;
}

interface ChartConfig {
  width?: number;
  height?: number;
  responsive?: boolean;
  maintainAspectRatio?: boolean;
}
```

#### `ChartTooltip`
```tsx
interface ChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  content?: React.ReactNode;
  className?: string;
}
```

#### `ChartLegend`
```tsx
interface ChartLegendProps {
  payload?: any[];
  onClick?: (data: any) => void;
  content?: React.ReactNode;
  className?: string;
}
```

### Form Components

#### `FormField`
```tsx
interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number';
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helper?: string;
  className?: string;
}
```

#### `FormSelect`
```tsx
interface FormSelectProps {
  label: string;
  name: string;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
}

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}
```

### Table Components

#### `DataTable`
```tsx
interface DataTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  pagination?: PaginationConfig;
  sorting?: SortingConfig;
  filtering?: FilteringConfig;
  onRowClick?: (row: T) => void;
  className?: string;
}

interface TableColumn<T> {
  key: keyof T;
  title: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
}
```

### Modal Components

#### `Modal`
```tsx
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  closable?: boolean;
  className?: string;
}
```

#### `Drawer`
```tsx
interface DrawerProps {
  open: boolean;
  onClose: () => void;
  placement?: 'left' | 'right' | 'top' | 'bottom';
  children: React.ReactNode;
  width?: number | string;
  height?: number | string;
  className?: string;
}
```

## Hooks Reference

### Custom Hooks

#### `useAuth`
```tsx
const useAuth = (): AuthContextType => {
  // Returns authentication context
};
```

#### `useTheme`
```tsx
const useTheme = (): ThemeContextType => {
  // Returns theme context
};
```

#### `useAccessibility`
```tsx
const useAccessibility = (): AccessibilityContextType => {
  // Returns accessibility context
};
```

#### `useVoiceCommands`
```tsx
const useVoiceCommands = (): VoiceCommandContextType => {
  // Returns voice command context
};
```

#### `useAnalytics`
```tsx
const useAnalytics = (): AnalyticsContextType => {
  // Returns analytics context
};
```

#### `useWorkflow`
```tsx
const useWorkflow = (): WorkflowContextType => {
  // Returns workflow context
};
```

## Utility Functions

### Validation
```tsx
// Email validation
const validateEmail = (email: string): boolean;

// Password validation
const validatePassword = (password: string): PasswordValidationResult;

// Form validation
const validateForm = (data: FormData, schema: ValidationSchema): ValidationResult;
```

### Formatting
```tsx
// Currency formatting
const formatCurrency = (amount: number, currency: string): string;

// Date formatting
const formatDate = (date: Date, format: string): string;

// Number formatting
const formatNumber = (number: number, options: NumberFormatOptions): string;
```

### API Utilities
```tsx
// API request helper
const apiRequest = async <T>(endpoint: string, options?: RequestOptions): Promise<T>;

// Error handling
const handleApiError = (error: ApiError): string;

// Response transformation
const transformResponse = <T, U>(data: T, transformer: (data: T) => U): U;
```

## Type Definitions

### Common Types
```tsx
// API Response
interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

// Pagination
interface PaginationConfig {
  page: number;
  pageSize: number;
  total: number;
}

// Sorting
interface SortingConfig {
  key: string;
  direction: 'asc' | 'desc';
}

// Filtering
interface FilteringConfig {
  filters: Filter[];
  operator: 'and' | 'or';
}

interface Filter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains';
  value: any;
}
```

### Component Props
```tsx
// Common props
interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  testId?: string;
}

// Form props
interface FormComponentProps extends BaseComponentProps {
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helper?: string;
}

// Interactive props
interface InteractiveComponentProps extends BaseComponentProps {
  onClick?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
}
```

## Best Practices

### Component Design
1. **Single Responsibility**: Each component should have one clear purpose
2. **Composition over Inheritance**: Favor composition patterns
3. **Props Interface**: Always define clear prop interfaces
4. **Default Props**: Provide sensible defaults
5. **Error Boundaries**: Wrap components in error boundaries

### Performance
1. **React.memo**: Use for expensive components
2. **useMemo**: Cache expensive calculations
3. **useCallback**: Stable function references
4. **Lazy Loading**: Code split large components
5. **Virtualization**: For large lists/tables

### Accessibility
1. **Semantic HTML**: Use appropriate HTML elements
2. **ARIA Attributes**: Provide proper ARIA markup
3. **Keyboard Navigation**: Ensure all interactions work via keyboard
4. **Screen Reader**: Test with screen readers
5. **Color Contrast**: Maintain sufficient contrast ratios

### Testing
1. **Unit Tests**: Test component logic
2. **Integration Tests**: Test component interactions
3. **Accessibility Tests**: Test a11y features
4. **Visual Tests**: Test component rendering
5. **User Flow Tests**: Test complete user journeys

## Migration Guide

### From Legacy Components
1. **Identify Dependencies**: Map current component usage
2. **Create Wrapper**: Build wrapper components for gradual migration
3. **Update Props**: Adjust prop interfaces as needed
4. **Test Thoroughly**: Ensure functionality is preserved
5. **Remove Legacy**: Clean up old components

### Breaking Changes
1. **Version Bump**: Update package version
2. **Changelog**: Document breaking changes
3. **Migration Guide**: Provide upgrade instructions
4. **Deprecation Warnings**: Add warnings for deprecated features
5. **Support Period**: Maintain support for legacy versions

This API reference provides comprehensive documentation for all AccuBooks components. For more specific usage examples and advanced configurations, refer to the individual component documentation files.
