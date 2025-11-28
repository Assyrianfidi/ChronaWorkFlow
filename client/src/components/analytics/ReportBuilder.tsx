import React, { useState, useCallback, useMemo } from 'react';
import { useAnalytics } from './AnalyticsEngine';
import { ReportFilter, AnalyticsReport } from './AnalyticsEngine';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'financial' | 'operational' | 'user' | 'custom';
  type: 'summary' | 'detailed' | 'comparative' | 'forecast';
  metrics: string[];
  filters: Partial<ReportFilter>[];
  visualizations: {
    type: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'heatmap';
    title: string;
    config: any;
  }[];
}

interface ReportBuilderProps {
  onReportGenerated?: (report: AnalyticsReport) => void;
  onCancel?: () => void;
  initialTemplate?: ReportTemplate;
}

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'financial-summary',
    name: 'Financial Summary',
    description: 'Overview of financial metrics and trends',
    category: 'financial',
    type: 'summary',
    metrics: ['revenue', 'expenses', 'profit', 'cash-flow'],
    filters: [
      { field: 'date_range', operator: 'between', value: 'last_30_days', label: 'Date Range' }
    ],
    visualizations: [
      {
        type: 'line',
        title: 'Revenue Trend',
        config: { xAxis: 'date', yAxis: 'amount' }
      },
      {
        type: 'pie',
        title: 'Expense Breakdown',
        config: { groupBy: 'category' }
      }
    ]
  },
  {
    id: 'user-analytics',
    name: 'User Analytics',
    description: 'User behavior and engagement metrics',
    category: 'user',
    type: 'detailed',
    metrics: ['active_users', 'new_users', 'retention', 'engagement'],
    filters: [
      { field: 'user_type', operator: 'equals', value: 'all', label: 'User Type' },
      { field: 'date_range', operator: 'between', value: 'last_30_days', label: 'Date Range' }
    ],
    visualizations: [
      {
        type: 'bar',
        title: 'User Growth',
        config: { xAxis: 'period', yAxis: 'count' }
      },
      {
        type: 'area',
        title: 'Engagement Metrics',
        config: { xAxis: 'date', yAxis: 'score' }
      }
    ]
  },
  {
    id: 'operational-efficiency',
    name: 'Operational Efficiency',
    description: 'System performance and operational metrics',
    category: 'operational',
    type: 'comparative',
    metrics: ['response_time', 'throughput', 'error_rate', 'utilization'],
    filters: [
      { field: 'service', operator: 'equals', value: 'all', label: 'Service' },
      { field: 'date_range', operator: 'between', value: 'last_7_days', label: 'Date Range' }
    ],
    visualizations: [
      {
        type: 'heatmap',
        title: 'Performance Heatmap',
        config: { x: 'time', y: 'service', value: 'metric' }
      },
      {
        type: 'scatter',
        title: 'Response vs Throughput',
        config: { x: 'response_time', y: 'throughput' }
      }
    ]
  }
];

export const ReportBuilder: React.FC<ReportBuilderProps> = ({
  onReportGenerated,
  onCancel,
  initialTemplate
}) => {
  const { generateReport, metrics } = useAnalytics();
  
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(initialTemplate || null);
  const [reportName, setReportName] = useState('');
  const [reportType, setReportType] = useState<ReportTemplate['type']>('summary');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [filters, setFilters] = useState<ReportFilter[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [customFilters, setCustomFilters] = useState<Partial<ReportFilter>>({});

  // Filter available metrics based on selected template
  const availableMetrics = useMemo(() => {
    if (!selectedTemplate) return metrics;
    return metrics.filter(m => selectedTemplate.metrics.includes(m.id));
  }, [selectedTemplate, metrics]);

  // Handle template selection
  const handleTemplateSelect = useCallback((template: ReportTemplate) => {
    setSelectedTemplate(template);
    setReportName(template.name);
    setReportType(template.type);
    setSelectedMetrics(template.metrics);
    
    // Convert template filters to report filters
    const reportFilters: ReportFilter[] = template.filters.map(f => ({
      field: f.field,
      operator: f.operator as any,
      value: f.value,
      label: f.label || f.field
    }));
    setFilters(reportFilters);
    
    setCurrentStep(2);
  }, []);

  // Handle metric selection
  const handleMetricToggle = useCallback((metricId: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metricId)
        ? prev.filter(id => id !== metricId)
        : [...prev, metricId]
    );
  }, []);

  // Handle filter updates
  const handleFilterUpdate = useCallback((index: number, field: keyof ReportFilter, value: any) => {
    setFilters(prev => prev.map((filter, i) => 
      i === index ? { ...filter, [field]: value } : filter
    ));
  }, []);

  // Add new filter
  const handleAddFilter = useCallback(() => {
    const newFilter: ReportFilter = {
      field: 'date_range',
      operator: 'between',
      value: 'last_30_days',
      label: 'Date Range'
    };
    setFilters(prev => [...prev, newFilter]);
  }, []);

  // Remove filter
  const handleRemoveFilter = useCallback((index: number) => {
    setFilters(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Generate report
  const handleGenerateReport = useCallback(async () => {
    if (!reportName || selectedMetrics.length === 0) {
      return;
    }

    setIsGenerating(true);
    try {
      const report = await generateReport(reportType, filters);
      onReportGenerated?.(report);
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [reportName, reportType, selectedMetrics, filters, generateReport, onReportGenerated]);

  // Render template selection
  const renderTemplateSelection = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Choose a Report Template</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORT_TEMPLATES.map(template => (
          <div
            key={template.id}
            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              selectedTemplate?.id === template.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleTemplateSelect(template)}
          >
            <h4 className="font-semibold">{template.name}</h4>
            <p className="text-sm text-gray-600 mt-1">{template.description}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                {template.category}
              </span>
              <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                {template.type}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <button
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          onClick={() => setSelectedTemplate({
            id: 'custom',
            name: 'Custom Report',
            description: 'Build a custom report from scratch',
            category: 'custom',
            type: 'summary',
            metrics: [],
            filters: [],
            visualizations: []
          })}
        >
          Build Custom Report
        </button>
      </div>
    </div>
  );

  // Render metric selection
  const renderMetricSelection = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Select Metrics</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {availableMetrics.map(metric => (
          <label
            key={metric.id}
            className="flex items-center p-3 border rounded cursor-pointer hover:bg-gray-50"
          >
            <input
              type="checkbox"
              checked={selectedMetrics.includes(metric.id)}
              onChange={() => handleMetricToggle(metric.id)}
              className="mr-3"
            />
            <div>
              <div className="font-medium">{metric.name}</div>
              <div className="text-sm text-gray-500">{metric.category}</div>
            </div>
          </label>
        ))}
      </div>
      {selectedMetrics.length === 0 && (
        <p className="text-gray-500">Select at least one metric to continue</p>
      )}
    </div>
  );

  // Render filter configuration
  const renderFilterConfiguration = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Configure Filters</h3>
      <div className="space-y-3">
        {filters.map((filter, index) => (
          <div key={index} className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Field</label>
              <select
                value={filter.field}
                onChange={(e) => handleFilterUpdate(index, 'field', e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="date_range">Date Range</option>
                <option value="category">Category</option>
                <option value="user_type">User Type</option>
                <option value="status">Status</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Operator</label>
              <select
                value={filter.operator}
                onChange={(e) => handleFilterUpdate(index, 'operator', e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="equals">Equals</option>
                <option value="contains">Contains</option>
                <option value="greater">Greater Than</option>
                <option value="less">Less Than</option>
                <option value="between">Between</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Value</label>
              <input
                type="text"
                value={filter.value}
                onChange={(e) => handleFilterUpdate(index, 'value', e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            <button
              onClick={() => handleRemoveFilter(index)}
              className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={handleAddFilter}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Add Filter
      </button>
    </div>
  );

  // Render report configuration
  const renderReportConfiguration = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Report Configuration</h3>
      <div>
        <label className="block text-sm font-medium mb-1">Report Name</label>
        <input
          type="text"
          value={reportName}
          onChange={(e) => setReportName(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="Enter report name"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Report Type</label>
        <select
          value={reportType}
          onChange={(e) => setReportType(e.target.value as any)}
          className="w-full p-2 border rounded"
        >
          <option value="summary">Summary</option>
          <option value="detailed">Detailed</option>
          <option value="comparative">Comparative</option>
          <option value="forecast">Forecast</option>
        </select>
      </div>
      
      {selectedTemplate && selectedTemplate.visualizations.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">Included Visualizations</h4>
          <div className="space-y-2">
            {selectedTemplate.visualizations.map((viz, index) => (
              <div key={index} className="p-2 bg-gray-50 rounded">
                <div className="font-medium">{viz.title}</div>
                <div className="text-sm text-gray-600">Type: {viz.type}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Render current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderTemplateSelection();
      case 2:
        return renderMetricSelection();
      case 3:
        return renderFilterConfiguration();
      case 4:
        return renderReportConfiguration();
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Report Builder</h2>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4].map(step => (
              <div
                key={step}
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step <= currentStep
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step}
              </div>
            ))}
            <div className="flex-1 h-1 bg-gray-200 -ml-4">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {renderCurrentStep()}

      <div className="mt-6 flex justify-between">
        <div>
          {currentStep > 1 && (
            <button
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Previous
            </button>
          )}
          {onCancel && (
            <button
              onClick={onCancel}
              className="ml-2 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          )}
        </div>
        <div>
          {currentStep < 4 ? (
            <button
              onClick={() => setCurrentStep(prev => prev + 1)}
              disabled={currentStep === 2 && selectedMetrics.length === 0}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleGenerateReport}
              disabled={!reportName || selectedMetrics.length === 0 || isGenerating}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300"
            >
              {isGenerating ? 'Generating...' : 'Generate Report'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportBuilder;
