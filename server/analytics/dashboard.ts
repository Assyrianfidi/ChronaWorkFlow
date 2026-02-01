import { EventEmitter } from 'events';
import { AnalyticsEngine, AnalyticsQuery, AnalyticsResult, KPIValue, Insight, DrillDown } from './analytics-engine';
import { ImmutableAuditLogger } from '../audit/immutable-logger';
import { GovernanceModelManager } from '../rbac/governance-model-manager';
import { FeatureFlagManager } from '../feature-flags/feature-flag-manager';

// Dashboard Backend Interfaces
export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  category: 'executive' | 'financial' | 'operational' | 'sales' | 'marketing' | 'custom';
  layout: DashboardLayout;
  widgets: DashboardWidgetTemplate[];
  filters: DashboardFilterTemplate[];
  isPublic: boolean;
  requiredPermissions: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardWidgetTemplate {
  id: string;
  type: 'kpi' | 'chart' | 'table' | 'metric' | 'insight' | 'drilldown' | 'text' | 'image';
  title: string;
  description?: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  config: WidgetConfig;
  dataSource: WidgetDataSource;
  permissions: {
    view: string[];
    edit: string[];
  };
  required: boolean;
}

export interface WidgetConfig {
  metric?: string;
  query?: string;
  chartType?: 'bar' | 'line' | 'pie' | 'scatter' | 'heatmap' | 'table' | 'gauge' | 'funnel';
  timeRange?: string;
  filters?: Record<string, any>;
  refreshInterval?: number;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  groupBy?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  colors?: string[];
  showLegend?: boolean;
  showTooltip?: boolean;
  showGrid?: boolean;
  yAxisLabel?: string;
  xAxisLabel?: string;
  title?: string;
  subtitle?: string;
  format?: string;
  thresholds?: {
    good: number;
    warning: number;
    critical: number;
  };
}

export interface WidgetDataSource {
  type: 'query' | 'metric' | 'api' | 'static';
  source: string;
  parameters?: Record<string, any>;
  cacheKey?: string;
  cacheTTL?: number;
}

export interface DashboardFilterTemplate {
  id: string;
  name: string;
  type: 'date' | 'select' | 'multiselect' | 'text' | 'number' | 'range';
  field: string;
  label: string;
  options?: Array<{ label: string; value: any; description?: string }>;
  defaultValue?: any;
  required: boolean;
  dependsOn?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

export interface DashboardInstance {
  id: string;
  templateId: string;
  tenantId: string;
  name: string;
  description: string;
  layout: DashboardLayout;
  widgets: DashboardWidgetInstance[];
  filters: DashboardFilterInstance[];
  permissions: {
    view: string[];
    edit: string[];
    share: string[];
    admin: string[];
  };
  settings: DashboardSettings;
  refreshInterval: number;
  isPublic: boolean;
  isFavorite: boolean;
  tags: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastViewed?: Date;
  viewCount: number;
}

export interface DashboardWidgetInstance {
  id: string;
  templateId: string;
  instanceId: string;
  type: 'kpi' | 'chart' | 'table' | 'metric' | 'insight' | 'drilldown' | 'text' | 'image';
  title: string;
  description?: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  config: WidgetConfig;
  dataSource: WidgetDataSource;
  data?: WidgetData;
  lastRefresh?: Date;
  refreshInterval: number;
  enabled: boolean;
  visible: boolean;
  permissions: {
    view: string[];
    edit: string[];
  };
  customizations: {
    title?: string;
    colors?: string[];
    size?: { width: number; height: number };
    position?: { x: number; y: number };
  };
}

export interface WidgetData {
  id: string;
  widgetId: string;
  type: 'kpi' | 'chart' | 'table' | 'metric' | 'insight' | 'drilldown';
  data: any;
  metadata: {
    rowCount?: number;
    columns?: string[];
    types?: Record<string, string>;
    lastUpdated: Date;
    refreshTime: number;
    cacheHit: boolean;
  };
  kpis?: Record<string, KPIValue>;
  insights?: Insight[];
  drillDowns?: DrillDown[];
  error?: string;
}

export interface DashboardFilterInstance {
  id: string;
  templateId: string;
  instanceId: string;
  name: string;
  type: 'date' | 'select' | 'multiselect' | 'text' | 'number' | 'range';
  field: string;
  label: string;
  value?: any;
  defaultValue?: any;
  options?: Array<{ label: string; value: any; description?: string }>;
  required: boolean;
  enabled: boolean;
  visible: boolean;
  dependsOn?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

export interface DashboardSettings {
  autoRefresh: boolean;
  refreshInterval: number;
  theme: 'light' | 'dark' | 'auto';
  density: 'compact' | 'normal' | 'comfortable';
  showGrid: boolean;
  snapToGrid: boolean;
  allowCustomization: boolean;
  exportFormats: ('pdf' | 'excel' | 'csv' | 'png' | 'json')[];
  maxWidgets: number;
  dataRetention: number;
  sharing: {
    allowPublic: boolean;
    allowEmbed: boolean;
    requireAuth: boolean;
    domains?: string[];
  };
}

export interface DashboardLayout {
  type: 'grid' | 'flex' | 'custom';
  columns: number;
  rows: number;
  gap: number;
  breakpoints?: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
}

export interface DashboardExport {
  id: string;
  dashboardId: string;
  tenantId: string;
  format: 'pdf' | 'excel' | 'csv' | 'png' | 'json';
  options: ExportOptions;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  downloadUrl?: string;
  fileSize?: number;
  error?: string;
  requestedBy: string;
}

export interface ExportOptions {
  includeFilters: boolean;
  includeMetadata: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  widgets?: string[];
  quality?: 'low' | 'medium' | 'high';
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'A4' | 'A3' | 'Letter' | 'Legal';
}

export interface DashboardSubscription {
  id: string;
  dashboardId: string;
  tenantId: string;
  userId: string;
  type: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  delivery: {
    email?: string;
    webhook?: string;
    slack?: string;
    teams?: string;
  };
  filters: Record<string, any>;
  enabled: boolean;
  lastSent?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardActivity {
  id: string;
  dashboardId: string;
  tenantId: string;
  userId: string;
  action: 'viewed' | 'shared' | 'exported' | 'customized' | 'created' | 'deleted' | 'favorited';
  details: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export class DashboardBackend extends EventEmitter {
  private static instance: DashboardBackend;
  private auditLog: ImmutableAuditLogger;
  private governance: GovernanceModelManager;
  private featureFlags: FeatureFlagManager;
  private analyticsEngine: AnalyticsEngine;

  // Data storage
  private templates: Map<string, DashboardTemplate> = new Map();
  private instances: Map<string, DashboardInstance> = new Map();
  private widgets: Map<string, DashboardWidgetInstance> = new Map();
  private filters: Map<string, DashboardFilterInstance> = new Map();
  private widgetData: Map<string, WidgetData> = new Map();
  private exports: Map<string, DashboardExport> = new Map();
  private subscriptions: Map<string, DashboardSubscription> = new Map();
  private activities: Map<string, DashboardActivity> = new Map();

  // Performance metrics
  private performanceMetrics = {
    dashboardsViewed: 0,
    widgetsRefreshed: 0,
    exportsGenerated: 0,
    averageLoadTime: 0,
    cacheHitRate: 0,
    activeSubscriptions: 0
  };

  private constructor() {
    super();
    this.auditLog = new ImmutableAuditLogger();
    this.governance = new GovernanceModelManager();
    this.featureFlags = new FeatureFlagManager();
    this.analyticsEngine = AnalyticsEngine.getInstance();
    
    this.initializeEventHandlers();
    this.startDataRefreshScheduler();
    this.initializeDefaultTemplates();
  }

  public static getInstance(): DashboardBackend {
    if (!DashboardBackend.instance) {
      DashboardBackend.instance = new DashboardBackend();
    }
    return DashboardBackend.instance;
  }

  private initializeEventHandlers(): void {
    this.on('dashboard:viewed', this.handleDashboardViewed.bind(this));
    this.on('widget:refresh', this.handleWidgetRefresh.bind(this));
    this.on('dashboard:shared', this.handleDashboardShared.bind(this));
    this.on('export:completed', this.handleExportCompleted.bind(this));
  }

  // Template Management
  public async createTemplate(template: Omit<DashboardTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<DashboardTemplate> {
    const dashboardTemplate: DashboardTemplate = {
      ...template,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.templates.set(dashboardTemplate.id, dashboardTemplate);

    // Audit log
    await this.auditLog.logOperation('dashboard_template_created', template.createdBy, {
      templateId: dashboardTemplate.id,
      name: template.name,
      category: template.category
    });

    return dashboardTemplate;
  }

  public async getTemplate(templateId: string, userId: string): Promise<DashboardTemplate | null> {
    const template = this.templates.get(templateId);
    if (!template) return null;

    // Check permissions
    if (!template.isPublic) {
      const hasPermission = await this.governance.checkPermission(
        userId,
        'dashboard:template:view',
        'system'
      );
      if (!hasPermission) {
        throw new Error('Insufficient permissions to view dashboard template');
      }
    }

    return template;
  }

  public async getTemplates(category?: string, userId: string): Promise<DashboardTemplate[]> {
    const templates = Array.from(this.templates.values());
    
    let filtered = templates;
    if (category) {
      filtered = filtered.filter(t => t.category === category);
    }

    // Filter by permissions
    return filtered.filter(t => 
      t.isPublic || 
      await this.governance.checkPermission(userId, 'dashboard:template:view', 'system')
    );
  }

  // Instance Management
  public async createInstance(instance: Omit<DashboardInstance, 'id' | 'createdAt' | 'updatedAt' | 'viewCount' | 'lastViewed'>): Promise<DashboardInstance> {
    const template = this.templates.get(instance.templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Check permissions
    const hasPermission = await this.governance.checkPermission(
      instance.createdBy,
      'dashboard:create',
      instance.tenantId
    );
    if (!hasPermission) {
      throw new Error('Insufficient permissions to create dashboard instance');
    }

    const dashboardInstance: DashboardInstance = {
      ...instance,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      viewCount: 0
    };

    // Create widget instances from template
    dashboardInstance.widgets = await this.createWidgetInstances(template.widgets, dashboardInstance.id);
    
    // Create filter instances from template
    dashboardInstance.filters = await this.createFilterInstances(template.filters, dashboardInstance.id);

    this.instances.set(dashboardInstance.id, dashboardInstance);

    // Audit log
    await this.auditLog.logOperation('dashboard_instance_created', instance.createdBy, {
      instanceId: dashboardInstance.id,
      templateId: instance.templateId,
      tenantId: instance.tenantId,
      name: instance.name
    });

    return dashboardInstance;
  }

  public async getInstance(instanceId: string, userId: string): Promise<DashboardInstance | null> {
    const instance = this.instances.get(instanceId);
    if (!instance) return null;

    // Check permissions
    const hasPermission = await this.governance.checkPermission(
      userId,
      'dashboard:view',
      instance.tenantId
    );
    if (!hasPermission && !instance.permissions.view.includes(userId)) {
      throw new Error('Insufficient permissions to view dashboard instance');
    }

    // Update view statistics
    instance.lastViewed = new Date();
    instance.viewCount++;

    // Log activity
    await this.logActivity(instanceId, instance.tenantId, userId, 'viewed', {});

    this.emit('dashboard:viewed', instance, userId);
    return instance;
  }

  public async updateInstance(instanceId: string, updates: Partial<DashboardInstance>, userId: string): Promise<DashboardInstance> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error('Dashboard instance not found');
    }

    // Check permissions
    const hasPermission = await this.governance.checkPermission(
      userId,
      'dashboard:edit',
      instance.tenantId
    );
    if (!hasPermission && !instance.permissions.edit.includes(userId)) {
      throw new Error('Insufficient permissions to update dashboard instance');
    }

    const updatedInstance = {
      ...instance,
      ...updates,
      updatedAt: new Date()
    };

    this.instances.set(instanceId, updatedInstance);

    // Audit log
    await this.auditLog.logOperation('dashboard_instance_updated', userId, {
      instanceId,
      tenantId: instance.tenantId,
      updates: Object.keys(updates)
    });

    return updatedInstance;
  }

  // Widget Management
  private async createWidgetInstances(templateWidgets: DashboardWidgetTemplate[], instanceId: string): Promise<DashboardWidgetInstance[]> {
    const widgetInstances: DashboardWidgetInstance[] = [];

    for (const templateWidget of templateWidgets) {
      const widgetInstance: DashboardWidgetInstance = {
        id: this.generateId(),
        templateId: templateWidget.id,
        instanceId,
        type: templateWidget.type,
        title: templateWidget.title,
        description: templateWidget.description,
        position: templateWidget.position,
        config: templateWidget.config,
        dataSource: templateWidget.dataSource,
        refreshInterval: templateWidget.config.refreshInterval || 300000, // 5 minutes default
        enabled: true,
        visible: true,
        permissions: templateWidget.permissions,
        customizations: {}
      };

      this.widgets.set(widgetInstance.id, widgetInstance);
      widgetInstances.push(widgetInstance);

      // Initialize widget data
      await this.refreshWidgetData(widgetInstance);
    }

    return widgetInstances;
  }

  private async createFilterInstances(templateFilters: DashboardFilterTemplate[], instanceId: string): Promise<DashboardFilterInstance[]> {
    const filterInstances: DashboardFilterInstance[] = [];

    for (const templateFilter of templateFilters) {
      const filterInstance: DashboardFilterInstance = {
        id: this.generateId(),
        templateId: templateFilter.id,
        instanceId,
        name: templateFilter.name,
        type: templateFilter.type,
        field: templateFilter.field,
        label: templateFilter.label,
        value: templateFilter.defaultValue,
        defaultValue: templateFilter.defaultValue,
        options: templateFilter.options,
        required: templateFilter.required,
        enabled: true,
        visible: true,
        dependsOn: templateFilter.dependsOn,
        validation: templateFilter.validation
      };

      this.filters.set(filterInstance.id, filterInstance);
      filterInstances.push(filterInstance);
    }

    return filterInstances;
  }

  // Widget Data Management
  public async refreshWidgetData(widget: DashboardWidgetInstance): Promise<WidgetData> {
    try {
      const startTime = Date.now();
      
      let data: any;
      let metadata: any;

      switch (widget.dataSource.type) {
        case 'query':
          {
            const result = await this.executeQuery(widget.dataSource.source, widget.dataSource.parameters);
            data = result.data;
            metadata = result.metadata;
            break;
          }
        case 'metric':
          data = await this.fetchMetric(widget.dataSource.source, widget.dataSource.parameters);
          metadata = { lastUpdated: new Date(), refreshTime: Date.now() - startTime, cacheHit: false };
          break;
        case 'api':
          data = await this.fetchFromAPI(widget.dataSource.source, widget.dataSource.parameters);
          metadata = { lastUpdated: new Date(), refreshTime: Date.now() - startTime, cacheHit: false };
          break;
        case 'static':
          data = widget.dataSource.parameters?.data || [];
          metadata = { lastUpdated: new Date(), refreshTime: 0, cacheHit: true };
          break;
        default:
          throw new Error(`Unsupported data source type: ${widget.dataSource.type}`);
      }

      const widgetData: WidgetData = {
        id: this.generateId(),
        widgetId: widget.id,
        type: widget.type,
        data,
        metadata: {
          ...metadata,
          lastUpdated: new Date(),
          refreshTime: Date.now() - startTime,
          cacheHit: metadata.cacheHit || false
        }
      };

      // Add KPIs, insights, and drill-downs for supported widget types
      if (widget.type === 'kpi' || widget.type === 'chart') {
        widgetData.kpis = this.extractKPIs(data, widget.config);
      }

      if (widget.type === 'chart' || widget.type === 'insight') {
        widgetData.insights = await this.generateInsights(data, widget);
      }

      if (widget.type === 'drilldown') {
        widgetData.drillDowns = this.generateDrillDowns(data, widget.config);
      }

      this.widgetData.set(widget.id, widgetData);
      widget.lastRefresh = new Date();

      this.emit('widget:refresh', widget, widgetData);
      this.performanceMetrics.widgetsRefreshed++;

      return widgetData;

    } catch (error) {
      const errorData: WidgetData = {
        id: this.generateId(),
        widgetId: widget.id,
        type: widget.type,
        data: null,
        metadata: {
          lastUpdated: new Date(),
          refreshTime: 0,
          cacheHit: false
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      this.widgetData.set(widget.id, errorData);
      return errorData;
    }
  }

  private async executeQuery(queryId: string, parameters?: Record<string, any>): Promise<AnalyticsResult> {
    const query = await this.analyticsEngine.submitQuery({
      tenantId: 'system', // This should be passed from context
      userId: 'system',
      query: queryId,
      parameters: parameters || {},
      type: 'realtime',
      priority: 'standard'
    });

    if (query.status !== 'completed' || !query.result) {
      throw new Error('Query execution failed');
    }

    return query.result;
  }

  private async fetchMetric(metricId: string, parameters?: Record<string, any>): Promise<any> {
    // Fetch metric data from analytics engine
    // This would integrate with the metrics system
    return {
      value: 1250000,
      trend: 'up',
      changePercent: 15.5,
      target: 1000000,
      status: 'good'
    };
  }

  private async fetchFromAPI(url: string, parameters?: Record<string, any>): Promise<any> {
    // Fetch data from external API
    // This would implement actual API calls
    return [];
  }

  private extractKPIs(data: any[], config: WidgetConfig): Record<string, KPIValue> {
    const kpis: Record<string, KPIValue> = {};

    if (config.metric) {
      kpis[config.metric] = {
        name: config.metric,
        value: this.calculateMetricValue(data, config),
        unit: config.format || 'count',
        trend: 'stable',
        changePercent: 0,
        status: 'good'
      };
    }

    return kpis;
  }

  private calculateMetricValue(data: any[], config: WidgetConfig): number {
    if (!data.length) return 0;

    const field = config.groupBy?.[0] || 'value';
    const values = data.map(item => item[field]).filter(v => typeof v === 'number');

    switch (config.aggregation) {
      case 'sum': return values.reduce((sum, val) => sum + val, 0);
      case 'avg': return values.reduce((sum, val) => sum + val, 0) / values.length;
      case 'count': return values.length;
      case 'min': return Math.min(...values);
      case 'max': return Math.max(...values);
      default: return values[0] || 0;
    }
  }

  private async generateInsights(data: any[], widget: DashboardWidgetInstance): Promise<Insight[]> {
    // Generate insights based on widget data
    // This would integrate with the insights engine
    return [
      {
        id: this.generateId(),
        type: 'trend',
        title: 'Upward Trend Detected',
        description: 'The data shows a positive trend over the selected period',
        confidence: 0.85,
        impact: 'medium',
        data: { trend: 'up' },
        actions: ['Investigate drivers', 'Consider scaling'],
        createdAt: new Date()
      }
    ];
  }

  private generateDrillDowns(data: any[], config: WidgetConfig): DrillDown[] {
    // Generate drill-down options based on data
    return [
      {
        id: this.generateId(),
        name: 'Detailed Breakdown',
        description: 'View detailed breakdown by categories',
        dimensions: config.groupBy || [],
        metrics: [config.metric || 'value'],
        chartType: config.chartType || 'bar'
      }
    ];
  }

  // Export Management
  public async exportDashboard(instanceId: string, format: DashboardExport['format'], options: ExportOptions, userId: string): Promise<DashboardExport> {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error('Dashboard instance not found');
    }

    // Check permissions
    const hasPermission = await this.governance.checkPermission(
      userId,
      'dashboard:export',
      instance.tenantId
    );
    if (!hasPermission) {
      throw new Error('Insufficient permissions to export dashboard');
    }

    const exportJob: DashboardExport = {
      id: this.generateId(),
      dashboardId: instanceId,
      tenantId: instance.tenantId,
      format,
      options,
      status: 'pending',
      requestedBy: userId,
      createdAt: new Date()
    };

    this.exports.set(exportJob.id, exportJob);

    // Start export process
    this.processExport(exportJob);

    // Audit log
    await this.auditLog.logOperation('dashboard_export_requested', userId, {
      exportId: exportJob.id,
      dashboardId: instanceId,
      format,
      options
    });

    return exportJob;
  }

  private async processExport(exportJob: DashboardExport): Promise<void> {
    try {
      exportJob.status = 'processing';

      const instance = this.instances.get(exportJob.dashboardId);
      if (!instance) {
        throw new Error('Dashboard instance not found');
      }

      // Generate export based on format
      let exportData: Buffer;
      let fileName: string;

      switch (exportJob.format) {
        case 'pdf':
          exportData = await this.generatePDFExport(instance, exportJob.options);
          fileName = `dashboard_${instance.name}_${Date.now()}.pdf`;
          break;
        case 'excel':
          exportData = await this.generateExcelExport(instance, exportJob.options);
          fileName = `dashboard_${instance.name}_${Date.now()}.xlsx`;
          break;
        case 'csv':
          exportData = await this.generateCSVExport(instance, exportJob.options);
          fileName = `dashboard_${instance.name}_${Date.now()}.csv`;
          break;
        case 'png':
          exportData = await this.generatePNGExport(instance, exportJob.options);
          fileName = `dashboard_${instance.name}_${Date.now()}.png`;
          break;
        case 'json':
          exportData = await this.generateJSONExport(instance, exportJob.options);
          fileName = `dashboard_${instance.name}_${Date.now()}.json`;
          break;
        default:
          throw new Error(`Unsupported export format: ${exportJob.format}`);
      }

      // Store export file (in production, this would use cloud storage)
      const downloadUrl = `/exports/${exportJob.id}/${fileName}`;
      
      exportJob.status = 'completed';
      exportJob.completedAt = new Date();
      exportJob.downloadUrl = downloadUrl;
      exportJob.fileSize = exportData.length;

      this.emit('export:completed', exportJob);
      this.performanceMetrics.exportsGenerated++;

    } catch (error) {
      exportJob.status = 'failed';
      exportJob.error = error instanceof Error ? error.message : 'Unknown error';
    }
  }

  private async generatePDFExport(instance: DashboardInstance, options: ExportOptions): Promise<Buffer> {
    // Generate PDF export
    // This would use a PDF generation library
    return Buffer.from('PDF export data');
  }

  private async generateExcelExport(instance: DashboardInstance, options: ExportOptions): Promise<Buffer> {
    // Generate Excel export
    // This would use an Excel generation library
    return Buffer.from('Excel export data');
  }

  private async generateCSVExport(instance: DashboardInstance, options: ExportOptions): Promise<Buffer> {
    // Generate CSV export
    const csvData = this.convertToCSV(instance, options);
    return Buffer.from(csvData);
  }

  private async generatePNGExport(instance: DashboardInstance, options: ExportOptions): Promise<Buffer> {
    // Generate PNG export
    // This would use a screenshot/chart generation library
    return Buffer.from('PNG export data');
  }

  private async generateJSONExport(instance: DashboardInstance, options: ExportOptions): Promise<Buffer> {
    // Generate JSON export
    const jsonData = this.convertToJSON(instance, options);
    return Buffer.from(JSON.stringify(jsonData, null, 2));
  }

  private convertToCSV(instance: DashboardInstance, options: ExportOptions): string {
    // Convert dashboard data to CSV format
    const rows: string[] = [];
    
    // Add headers
    rows.push('Widget,Type,Data');
    
    // Add widget data
    for (const widget of instance.widgets) {
      const widgetData = this.widgetData.get(widget.id);
      if (widgetData && widgetData.data) {
        rows.push(`"${widget.title}",${widget.type},${JSON.stringify(widgetData.data)}`);
      }
    }
    
    return rows.join('\n');
  }

  private convertToJSON(instance: DashboardInstance, options: ExportOptions): any {
    // Convert dashboard data to JSON format
    const dashboardData: any = {
      dashboard: {
        id: instance.id,
        name: instance.name,
        description: instance.description,
        exportedAt: new Date().toISOString()
      },
      widgets: []
    };

    for (const widget of instance.widgets) {
      const widgetData = this.widgetData.get(widget.id);
      dashboardData.widgets.push({
        id: widget.id,
        title: widget.title,
        type: widget.type,
        data: widgetData?.data || null,
        metadata: widgetData?.metadata || {}
      });
    }

    return dashboardData;
  }

  // Subscription Management
  public async createSubscription(subscription: Omit<DashboardSubscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<DashboardSubscription> {
    const dashboardSubscription: DashboardSubscription = {
      ...subscription,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.subscriptions.set(dashboardSubscription.id, dashboardSubscription);
    this.performanceMetrics.activeSubscriptions++;

    // Audit log
    await this.auditLog.logOperation('dashboard_subscription_created', subscription.userId, {
      subscriptionId: dashboardSubscription.id,
      dashboardId: subscription.dashboardId,
      type: subscription.type
    });

    return dashboardSubscription;
  }

  // Activity Logging
  private async logActivity(dashboardId: string, tenantId: string, userId: string, action: DashboardActivity['action'], details: Record<string, any>): Promise<void> {
    const activity: DashboardActivity = {
      id: this.generateId(),
      dashboardId,
      tenantId,
      userId,
      action,
      details,
      timestamp: new Date()
    };

    this.activities.set(activity.id, activity);
  }

  // Event Handlers
  private async handleDashboardViewed(instance: DashboardInstance, userId: string): Promise<void> {
    this.performanceMetrics.dashboardsViewed++;
    await this.logActivity(instance.id, instance.tenantId, userId, 'viewed', {});
  }

  private async handleWidgetRefresh(widget: DashboardWidgetInstance, data: WidgetData): Promise<void> {
    // Update performance metrics
    const refreshTime = data.metadata.refreshTime;
    const totalRefreshes = this.performanceMetrics.widgetsRefreshed;
    const avgTime = this.performanceMetrics.averageLoadTime;
    this.performanceMetrics.averageLoadTime = (avgTime * (totalRefreshes - 1) + refreshTime) / totalRefreshes;
  }

  private async handleDashboardShared(instance: DashboardInstance, userId: string): Promise<void> {
    await this.logActivity(instance.id, instance.tenantId, userId, 'shared', {});
  }

  private async handleExportCompleted(exportJob: DashboardExport): Promise<void> {
    await this.logActivity(exportJob.dashboardId, exportJob.tenantId, exportJob.requestedBy, 'exported', {
      format: exportJob.format,
      fileSize: exportJob.fileSize
    });
  }

  // Schedulers and Background Tasks
  private startDataRefreshScheduler(): void {
    setInterval(() => {
      this.refreshAllWidgets();
    }, 60000); // Every minute
  }

  private async refreshAllWidgets(): Promise<void> {
    const now = Date.now();
    
    for (const widget of this.widgets.values()) {
      if (widget.enabled && 
          (!widget.lastRefresh || now - widget.lastRefresh.getTime() > widget.refreshInterval)) {
        await this.refreshWidgetData(widget);
      }
    }
  }

  private initializeDefaultTemplates(): void {
    // Create default dashboard templates
    this.createExecutiveDashboardTemplate();
    this.createFinancialDashboardTemplate();
    this.createOperationalDashboardTemplate();
  }

  private async createExecutiveDashboardTemplate(): Promise<void> {
    const template: DashboardTemplate = {
      id: this.generateId(),
      name: 'Executive Overview',
      description: 'High-level executive dashboard with key business metrics',
      category: 'executive',
      layout: {
        type: 'grid',
        columns: 12,
        rows: 8,
        gap: 16
      },
      widgets: [
        {
          id: this.generateId(),
          type: 'kpi',
          title: 'Total Revenue',
          position: { x: 0, y: 0, width: 3, height: 2 },
          config: {
            metric: 'totalRevenue',
            format: 'currency',
            refreshInterval: 300000
          },
          dataSource: {
            type: 'metric',
            source: 'totalRevenue'
          },
          permissions: { view: [], edit: [] },
          required: true
        },
        {
          id: this.generateId(),
          type: 'chart',
          title: 'Revenue Trend',
          position: { x: 3, y: 0, width: 6, height: 2 },
          config: {
            chartType: 'line',
            timeRange: '30d',
            refreshInterval: 300000
          },
          dataSource: {
            type: 'query',
            source: 'revenue_trend_query'
          },
          permissions: { view: [], edit: [] },
          required: true
        }
      ],
      filters: [
        {
          id: this.generateId(),
          name: 'Date Range',
          type: 'date',
          field: 'date',
          label: 'Date Range',
          required: false
        }
      ],
      isPublic: true,
      requiredPermissions: ['dashboard:view'],
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.templates.set(template.id, template);
  }

  private async createFinancialDashboardTemplate(): Promise<void> {
    // Similar implementation for financial dashboard
  }

  private async createOperationalDashboardTemplate(): Promise<void> {
    // Similar implementation for operational dashboard
  }

  // Helper Methods
  private generateId(): string {
    return `dashboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API Methods
  public async getInstances(tenantId: string, userId: string): Promise<DashboardInstance[]> {
    // Check permissions
    const hasPermission = await this.governance.checkPermission(
      userId,
      'dashboard:view',
      tenantId
    );
    if (!hasPermission) {
      throw new Error('Insufficient permissions to view dashboard instances');
    }

    return Array.from(this.instances.values())
      .filter(i => i.tenantId === tenantId)
      .filter(i => i.isPublic || i.permissions.view.includes(userId));
  }

  public async getWidgetData(widgetId: string, userId: string): Promise<WidgetData | null> {
    const widget = this.widgets.get(widgetId);
    if (!widget) return null;

    const instance = this.instances.get(widget.instanceId);
    if (!instance) return null;

    // Check permissions
    const hasPermission = await this.governance.checkPermission(
      userId,
      'dashboard:view',
      instance.tenantId
    );
    if (!hasPermission && !instance.permissions.view.includes(userId)) {
      throw new Error('Insufficient permissions to view widget data');
    }

    return this.widgetData.get(widgetId) || null;
  }

  public getPerformanceMetrics() {
    return { ...this.performanceMetrics };
  }

  public async getExport(exportId: string, userId: string): Promise<DashboardExport | null> {
    const exportJob = this.exports.get(exportId);
    if (!exportJob) return null;

    // Check permissions
    const hasPermission = await this.governance.checkPermission(
      userId,
      'dashboard:export',
      exportJob.tenantId
    );
    if (!hasPermission && exportJob.requestedBy !== userId) {
      throw new Error('Insufficient permissions to view export job');
    }

    return exportJob;
  }
}

export default DashboardBackend;
