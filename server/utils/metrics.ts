// Production-grade metrics collection for Prometheus/Grafana integration
// Self-contained, no external dependencies

export interface MetricValue {
  value: number;
  timestamp: number;
  labels?: Record<string, string>;
}

export interface Metric {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  help: string;
  values: MetricValue[];
}

export class MetricsCollector {
  private metrics: Map<string, Metric> = new Map();
  private isEnabled: boolean;
  private startTime: number;

  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'production';
    this.startTime = Date.now();
    
    if (this.isEnabled) {
      this.initializeMetrics();
    }
  }

  private initializeMetrics(): void {
    // Application metrics
    this.createMetric('app_startup_duration', 'gauge', 'Application startup duration in milliseconds');
    this.createMetric('app_uptime', 'gauge', 'Application uptime in seconds');
    this.createMetric('app_errors_total', 'counter', 'Total number of application errors');
    this.createMetric('app_requests_total', 'counter', 'Total number of HTTP requests');
    this.createMetric('app_request_duration', 'histogram', 'HTTP request duration in milliseconds');
    this.createMetric('app_active_connections', 'gauge', 'Number of active connections');
    
    // Database metrics
    this.createMetric('db_connections_active', 'gauge', 'Number of active database connections');
    this.createMetric('db_queries_total', 'counter', 'Total number of database queries');
    this.createMetric('db_query_duration', 'histogram', 'Database query duration in milliseconds');
    this.createMetric('db_errors_total', 'counter', 'Total number of database errors');
  }

  private createMetric(name: string, type: Metric['type'], help: string): void {
    this.metrics.set(name, {
      name,
      type,
      help,
      values: []
    });
  }

  private getMetric(name: string): Metric | undefined {
    return this.metrics.get(name);
  }

  // Counter operations
  incrementCounter(name: string, value: number = 1, labels?: Record<string, string>): void {
    if (!this.isEnabled) return;
    
    const metric = this.getMetric(name);
    if (metric && metric.type === 'counter') {
      const existingValue = metric.values.find(v => 
        JSON.stringify(v.labels || {}) === JSON.stringify(labels || {})
      );
      
      if (existingValue) {
        existingValue.value += value;
        existingValue.timestamp = Date.now();
      } else {
        metric.values.push({
          value,
          timestamp: Date.now(),
          labels
        });
      }
    }
  }

  // Gauge operations
  setGauge(name: string, value: number, labels?: Record<string, string>): void {
    if (!this.isEnabled) return;
    
    const metric = this.getMetric(name);
    if (metric && metric.type === 'gauge') {
      const existingIndex = metric.values.findIndex(v => 
        JSON.stringify(v.labels || {}) === JSON.stringify(labels || {})
      );
      
      const newValue: MetricValue = {
        value,
        timestamp: Date.now(),
        labels
      };

      if (existingIndex >= 0) {
        metric.values[existingIndex] = newValue;
      } else {
        metric.values.push(newValue);
      }
    }
  }

  // Histogram operations
  recordHistogram(name: string, value: number, labels?: Record<string, string>): void {
    if (!this.isEnabled) return;
    
    const metric = this.getMetric(name);
    if (metric && metric.type === 'histogram') {
      metric.values.push({
        value,
        timestamp: Date.now(),
        labels
      });
      
      // Keep only last 1000 values to prevent memory leaks
      if (metric.values.length > 1000) {
        metric.values = metric.values.slice(-1000);
      }
    }
  }

  // Specific metric methods
  recordStartupDuration(duration: number): void {
    this.setGauge('app_startup_duration', duration);
  }

  recordRequest(method: string, path: string, statusCode: number, duration: number): void {
    const labels = { method, path: path.split('?')[0], status_code: statusCode.toString() };
    
    this.incrementCounter('app_requests_total', 1, labels);
    this.recordHistogram('app_request_duration', duration, labels);
    
    if (statusCode >= 400) {
      this.incrementCounter('app_errors_total', 1, labels);
    }
  }

  recordDatabaseQuery(duration: number, error?: boolean): void {
    this.recordHistogram('db_query_duration', duration);
    this.incrementCounter('db_queries_total');
    
    if (error) {
      this.incrementCounter('db_errors_total');
    }
  }

  updateActiveConnections(count: number): void {
    this.setGauge('app_active_connections', count);
  }

  updateDatabaseConnections(count: number): void {
    this.setGauge('db_connections_active', count);
  }

  // Update uptime gauge
  updateUptime(): void {
    if (!this.isEnabled) return;
    
    const uptime = (Date.now() - this.startTime) / 1000; // seconds
    this.setGauge('app_uptime', uptime);
  }

  // Export metrics in Prometheus format
  exportPrometheusFormat(): string {
    if (!this.isEnabled) {
      return '';
    }

    let output = '';
    
    for (const metric of this.metrics.values()) {
      output += `# HELP ${metric.name} ${metric.help}\n`;
      output += `# TYPE ${metric.name} ${metric.type}\n`;
      
      for (const value of metric.values) {
        const labels = value.labels ? 
          `{${Object.entries(value.labels).map(([k, v]) => `${k}="${v}"`).join(',')}}` : '';
        output += `${metric.name}${labels} ${value.value} ${value.timestamp}\n`;
      }
    }
    
    return output;
  }

  // Get metrics endpoint handler
  getMetricsHandler(): (req: any, res: any) => void {
    return (req: any, res: any) => {
      if (!this.isEnabled) {
        res.status(404).send('Metrics not enabled');
        return;
      }

      res.set('Content-Type', 'text/plain');
      res.send(this.exportPrometheusFormat());
    };
  }

  // Health check for metrics system
  isHealthy(): boolean {
    return this.isEnabled && this.metrics.size > 0;
  }
}

// Global metrics instance
export const metrics = new MetricsCollector();

// Update uptime every minute
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    metrics.updateUptime();
  }, 60000);
}
