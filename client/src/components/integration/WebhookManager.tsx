import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useUserExperienceMode } from '../adaptive/UserExperienceMode';
import { usePerformance } from '../adaptive/UI-Performance-Engine';
import { useAuthStore } from '../../store/auth-store';

// Webhook Types
interface WebhookEndpoint {
  id: string;
  name: string;
  description: string;
  url: string;
  events: string[];
  secret?: string;
  active: boolean;
  method: 'POST' | 'PUT' | 'PATCH';
  headers: Record<string, string>;
  retryPolicy: WebhookRetryPolicy;
  filters: WebhookFilter[];
  transformations: WebhookTransformation[];
  rateLimit: {
    maxEvents: number;
    windowMs: number;
  };
  security: WebhookSecurity;
  createdAt: number;
  updatedAt: number;
  lastTriggered?: number;
  deliveryHistory: WebhookDelivery[];
  statistics: WebhookStatistics;
}

interface WebhookRetryPolicy {
  maxAttempts: number;
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
  initialDelay: number;
  maxDelay: number;
  retryableErrors: string[];
}

interface WebhookFilter {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'exists' | 'not_exists';
  value: any;
  caseSensitive?: boolean;
}

interface WebhookTransformation {
  type: 'field_mapping' | 'data_enrichment' | 'format_conversion' | 'custom';
  config: Record<string, any>;
}

interface WebhookSecurity {
  signatureHeader: string;
  signatureAlgorithm: 'sha256' | 'sha1' | 'md5';
  ipWhitelist: string[];
  requireHttps: boolean;
  validatePayload: boolean;
}

interface WebhookDelivery {
  id: string;
  webhookId: string;
  eventId: string;
  attempt: number;
  status: 'pending' | 'delivered' | 'failed' | 'retrying';
  payload: any;
  headers: Record<string, string>;
  response?: {
    status: number;
    headers: Record<string, string>;
    body: string;
    duration: number;
  };
  error?: string;
  timestamp: number;
  nextRetryAt?: number;
}

interface WebhookStatistics {
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  averageDeliveryTime: number;
  lastDeliveryStatus: 'success' | 'failure';
  successRate: number;
  errorRate: number;
}

interface WebhookEvent {
  id: string;
  type: string;
  source: string;
  data: any;
  timestamp: number;
  metadata: {
    version: string;
    id: string;
    causationId?: string;
    correlationId?: string;
  };
  processed: boolean;
  deliveredTo: string[];
}

interface WebhookTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  events: string[];
  payloadSchema: any;
  headers: Record<string, string>;
  transformations: WebhookTransformation[];
  popular: boolean;
}

// Webhook Manager Context
interface WebhookManagerContextType {
  // Endpoint Management
  endpoints: WebhookEndpoint[];
  createEndpoint: (endpoint: Omit<WebhookEndpoint, 'id' | 'createdAt' | 'updatedAt' | 'deliveryHistory' | 'statistics'>) => Promise<WebhookEndpoint>;
  updateEndpoint: (id: string, updates: Partial<WebhookEndpoint>) => Promise<void>;
  deleteEndpoint: (id: string) => Promise<void>;
  toggleEndpoint: (id: string) => Promise<void>;
  
  // Event Management
  events: WebhookEvent[];
  triggerEvent: (type: string, source: string, data: any, metadata?: any) => Promise<void>;
  getEvents: (filters?: {
    type?: string;
    source?: string;
    dateRange?: { start: number; end: number };
  }) => WebhookEvent[];
  
  // Delivery Management
  deliveries: WebhookDelivery[];
  getDeliveries: (filters?: {
    webhookId?: string;
    status?: string;
    dateRange?: { start: number; end: number };
  }) => WebhookDelivery[];
  retryDelivery: (deliveryId: string) => Promise<void>;
  
  // Templates
  templates: WebhookTemplate[];
  createFromTemplate: (templateId: string, name: string, url: string) => Promise<WebhookEndpoint>;
  
  // Analytics
  getAnalytics: () => {
    totalEndpoints: number;
    activeEndpoints: number;
    totalEvents: number;
    totalDeliveries: number;
    successRate: number;
    averageDeliveryTime: number;
    topEvents: Array<{ event: string; deliveries: number }>;
    errorAnalysis: Array<{ error: string; count: number }>;
  };
}

const WebhookManagerContext = React.createContext<WebhookManagerContextType | null>(null);

// Webhook Engine
class WebhookEngine {
  private endpoints: Map<string, WebhookEndpoint> = new Map();
  private events: WebhookEvent[] = [];
  private deliveries: Map<string, WebhookDelivery> = new Map();
  private templates: Map<string, WebhookTemplate> = new Map();
  private eventQueue: WebhookEvent[] = [];
  private processingQueue: WebhookDelivery[] = [];
  private rateLimiters: Map<string, RateLimiter> = new Map();
  private isProcessing = false;

  constructor() {
    this.initializeTemplates();
    this.startEventProcessor();
    this.startDeliveryProcessor();
  }

  private initializeTemplates(): void {
    const templates: WebhookTemplate[] = [
      {
        id: 'user-events',
        name: 'User Events',
        description: 'Webhook for user-related events',
        category: 'user',
        events: ['user.created', 'user.updated', 'user.deleted', 'user.login', 'user.logout'],
        payloadSchema: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            email: { type: 'string' },
            timestamp: { type: 'string' }
          }
        },
        headers: {
          'Content-Type': 'application/json',
          'X-Event-Type': '{{event.type}}'
        },
        transformations: [
          {
            type: 'field_mapping',
            config: {
              mappings: {
                'user.id': 'userId',
                'user.email': 'email'
              }
            }
          }
        ],
        popular: true
      },
      {
        id: 'payment-events',
        name: 'Payment Events',
        description: 'Webhook for payment-related events',
        category: 'payment',
        events: ['payment.completed', 'payment.failed', 'payment.refunded', 'payment.disputed'],
        payloadSchema: {
          type: 'object',
          properties: {
            paymentId: { type: 'string' },
            amount: { type: 'number' },
            currency: { type: 'string' },
            status: { type: 'string' }
          }
        },
        headers: {
          'Content-Type': 'application/json',
          'X-Payment-Status': '{{data.status}}'
        },
        transformations: [],
        popular: true
      },
      {
        id: 'order-events',
        name: 'Order Events',
        description: 'Webhook for order-related events',
        category: 'order',
        events: ['order.created', 'order.updated', 'order.cancelled', 'order.shipped', 'order.delivered'],
        payloadSchema: {
          type: 'object',
          properties: {
            orderId: { type: 'string' },
            customerId: { type: 'string' },
            total: { type: 'number' },
            status: { type: 'string' }
          }
        },
        headers: {
          'Content-Type': 'application/json',
          'X-Order-Status': '{{data.status}}'
        },
        transformations: [
          {
            type: 'data_enrichment',
            config: {
              enrichments: {
                'timestamp': '{{event.timestamp}}',
                'source': '{{event.source}}'
              }
            }
          }
        ],
        popular: false
      },
      {
        id: 'system-events',
        name: 'System Events',
        description: 'Webhook for system-related events',
        category: 'system',
        events: ['system.started', 'system.shutdown', 'system.error', 'system.maintenance'],
        payloadSchema: {
          type: 'object',
          properties: {
            systemId: { type: 'string' },
            level: { type: 'string' },
            message: { type: 'string' },
            timestamp: { type: 'string' }
          }
        },
        headers: {
          'Content-Type': 'application/json',
          'X-System-Level': '{{data.level}}'
        },
        transformations: [],
        popular: false
      }
    ];

    templates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  private startEventProcessor(): void {
    setInterval(() => {
      this.processEventQueue();
    }, 1000); // Process every second
  }

  private startDeliveryProcessor(): void {
    setInterval(() => {
      this.processDeliveryQueue();
    }, 500); // Process every 500ms
  }

  private async processEventQueue(): Promise<void> {
    if (this.isProcessing || this.eventQueue.length === 0) return;

    this.isProcessing = true;

    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift()!;
      await this.processEvent(event);
    }

    this.isProcessing = false;
  }

  private async processEvent(event: WebhookEvent): Promise<void> {
    // Find relevant endpoints
    const relevantEndpoints = Array.from(this.endpoints.values())
      .filter(endpoint => 
        endpoint.active && 
        endpoint.events.includes(event.type) &&
        this.passesFilters(event, endpoint.filters)
      );

    // Create deliveries for each endpoint
    for (const endpoint of relevantEndpoints) {
      await this.createDelivery(endpoint, event);
    }

    // Mark event as processed
    event.processed = true;
  }

  private passesFilters(event: WebhookEvent, filters: WebhookFilter[]): boolean {
    if (filters.length === 0) return true;

    return filters.every(filter => {
      const fieldValue = this.getFieldValue(event, filter.field);
      
      switch (filter.operator) {
        case 'equals':
          return fieldValue === filter.value;
        case 'not_equals':
          return fieldValue !== filter.value;
        case 'contains':
          return typeof fieldValue === 'string' && 
            (filter.caseSensitive ? fieldValue : fieldValue.toLowerCase())
              .includes(filter.caseSensitive ? filter.value : filter.value.toLowerCase());
        case 'not_contains':
          return typeof fieldValue === 'string' && 
            !(filter.caseSensitive ? fieldValue : fieldValue.toLowerCase())
              .includes(filter.caseSensitive ? filter.value : filter.value.toLowerCase());
        case 'greater_than':
          return typeof fieldValue === 'number' && fieldValue > filter.value;
        case 'less_than':
          return typeof fieldValue === 'number' && fieldValue < filter.value;
        case 'exists':
          return fieldValue !== undefined && fieldValue !== null;
        case 'not_exists':
          return fieldValue === undefined || fieldValue === null;
        default:
          return true;
      }
    });
  }

  private getFieldValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private async createDelivery(endpoint: WebhookEndpoint, event: WebhookEvent): Promise<void> {
    // Check rate limits
    const rateLimiter = this.getRateLimiter(endpoint.id);
    if (!rateLimiter.check()) {
      console.log(`Rate limit exceeded for webhook ${endpoint.id}`);
      return;
    }

    // Apply transformations
    const payload = await this.applyTransformations(event.data, endpoint.transformations);

    // Prepare headers
    const headers = {
      ...endpoint.headers,
      'Content-Type': 'application/json',
      'X-Webhook-Event': event.type,
      'X-Webhook-ID': event.id,
      'X-Webhook-Timestamp': event.timestamp.toString()
    };

    // Add signature if secret is configured
    if (endpoint.secret) {
      headers['X-Webhook-Signature'] = await this.generateSignature(payload, endpoint.secret, endpoint.security.signatureAlgorithm);
    }

    const delivery: WebhookDelivery = {
      id: Math.random().toString(36),
      webhookId: endpoint.id,
      eventId: event.id,
      attempt: 1,
      status: 'pending',
      payload,
      headers,
      timestamp: Date.now()
    };

    this.deliveries.set(delivery.id, delivery);
    this.processingQueue.push(delivery);

    // Update endpoint statistics
    endpoint.statistics.totalDeliveries++;
    endpoint.lastTriggered = Date.now();

    // Add to event delivery tracking
    event.deliveredTo.push(endpoint.id);
  }

  private getRateLimiter(endpointId: string): RateLimiter {
    if (!this.rateLimiters.has(endpointId)) {
      this.rateLimiters.set(endpointId, new RateLimiter(100, 60000)); // 100 requests per minute
    }
    return this.rateLimiters.get(endpointId)!;
  }

  private async applyTransformations(data: any, transformations: WebhookTransformation[]): Promise<any> {
    let transformed = { ...data };

    for (const transformation of transformations) {
      switch (transformation.type) {
        case 'field_mapping':
          transformed = this.applyFieldMapping(transformed, transformation.config.mappings);
          break;
        case 'data_enrichment':
          transformed = this.applyDataEnrichment(transformed, transformation.config.enrichments);
          break;
        case 'format_conversion':
          transformed = this.applyFormatConversion(transformed, transformation.config);
          break;
        case 'custom':
          transformed = await this.applyCustomTransformation(transformed, transformation.config);
          break;
      }
    }

    return transformed;
  }

  private applyFieldMapping(data: any, mappings: Record<string, string>): any {
    const mapped: any = {};

    for (const [sourcePath, targetPath] of Object.entries(mappings)) {
      const value = this.getFieldValue(data, sourcePath);
      this.setFieldValue(mapped, targetPath, value);
    }

    return mapped;
  }

  private applyDataEnrichment(data: any, enrichments: Record<string, string>): any {
    const enriched = { ...data };

    for (const [field, template] of Object.entries(enrichments)) {
      enriched[field] = this.processTemplate(template, { data });
    }

    return enriched;
  }

  private applyFormatConversion(data: any, config: any): any {
    switch (config.targetFormat) {
      case 'xml':
        return this.jsonToXml(data);
      case 'csv':
        return this.jsonToCsv(data);
      case 'form-urlencoded':
        return this.jsonToUrlEncoded(data);
      default:
        return data;
    }
  }

  private async applyCustomTransformation(data: any, config: any): Promise<any> {
    // Custom transformation logic would go here
    return data;
  }

  private setFieldValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  private processTemplate(template: string, context: any): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, expression) => {
      try {
        // Simple template processing - in production use a proper template engine
        const value = this.getFieldValue(context, expression.trim());
        return value !== undefined ? String(value) : match;
      } catch {
        return match;
      }
    });
  }

  private jsonToXml(data: any): string {
    // Simplified JSON to XML conversion
    const convert = (obj: any, rootName: string = 'root'): string => {
      if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
        return `<${rootName}>${obj}</${rootName}>`;
      }
      
      if (Array.isArray(obj)) {
        return obj.map(item => convert(item, rootName.slice(0, -1))).join('');
      }
      
      if (typeof obj === 'object' && obj !== null) {
        const entries = Object.entries(obj)
          .map(([key, value]) => convert(value, key))
          .join('');
        return `<${rootName}>${entries}</${rootName}>`;
      }
      
      return `<${rootName}></${rootName}>`;
    };

    return `<?xml version="1.0" encoding="UTF-8"?>${convert(data)}`;
  }

  private jsonToCsv(data: any): string {
    if (!Array.isArray(data)) return '';
    
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ];
    
    return csvRows.join('\n');
  }

  private jsonToUrlEncoded(data: any): string {
    return new URLSearchParams(
      Object.entries(data)
        .filter(([_, value]) => value !== undefined && value !== null)
        .map(([key, value]) => [key, String(value)])
    ).toString();
  }

  private async generateSignature(payload: any, secret: string, algorithm: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(payload));
    const key = encoder.encode(secret);

    let hashBuffer: ArrayBuffer;
    
    switch (algorithm) {
      case 'sha256':
        hashBuffer = await crypto.subtle.digest('SHA-256', await crypto.subtle.importKey(
          'raw',
          key,
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        ));
        break;
      case 'sha1':
        hashBuffer = await crypto.subtle.digest('SHA-1', await crypto.subtle.importKey(
          'raw',
          key,
          { name: 'HMAC', hash: 'SHA-1' },
          false,
          ['sign']
        ));
        break;
      case 'md5':
        // MD5 is not supported by Web Crypto API, fallback to simple hash
        hashBuffer = encoder.encode(btoa(JSON.stringify(payload)));
        break;
      default:
        hashBuffer = data;
    }

    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async processDeliveryQueue(): Promise<void> {
    if (this.processingQueue.length === 0) return;

    const delivery = this.processingQueue.shift()!;
    await this.deliverWebhook(delivery);
  }

  private async deliverWebhook(delivery: WebhookDelivery): Promise<void> {
    const endpoint = this.endpoints.get(delivery.webhookId);
    if (!endpoint) return;

    delivery.status = 'retrying';

    try {
      const startTime = Date.now();
      
      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: delivery.headers,
        body: JSON.stringify(delivery.payload)
      });

      const duration = Date.now() - startTime;
      const responseText = await response.text();

      delivery.response = {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseText,
        duration
      };

      if (response.ok) {
        delivery.status = 'delivered';
        endpoint.statistics.successfulDeliveries++;
        endpoint.statistics.lastDeliveryStatus = 'success';
      } else {
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }

    } catch (error) {
      delivery.error = error instanceof Error ? error.message : 'Unknown error';
      delivery.status = 'failed';
      endpoint.statistics.failedDeliveries++;
      endpoint.statistics.lastDeliveryStatus = 'failure';

      // Schedule retry if applicable
      if (delivery.attempt < endpoint.retryPolicy.maxAttempts) {
        const delay = this.calculateRetryDelay(delivery.attempt, endpoint.retryPolicy);
        delivery.nextRetryAt = Date.now() + delay;
        delivery.attempt++;
        
        setTimeout(() => {
          this.processingQueue.push(delivery);
        }, delay);
      }
    }

    // Update statistics
    this.updateEndpointStatistics(endpoint);
  }

  private calculateRetryDelay(attempt: number, policy: WebhookRetryPolicy): number {
    switch (policy.backoffStrategy) {
      case 'linear':
        return policy.initialDelay * attempt;
      case 'exponential':
        return Math.min(policy.initialDelay * Math.pow(2, attempt - 1), policy.maxDelay);
      case 'fixed':
        return policy.initialDelay;
      default:
        return policy.initialDelay;
    }
  }

  private updateEndpointStatistics(endpoint: WebhookEndpoint): void {
    const stats = endpoint.statistics;
    stats.successRate = stats.totalDeliveries > 0 ? stats.successfulDeliveries / stats.totalDeliveries : 0;
    stats.errorRate = stats.totalDeliveries > 0 ? stats.failedDeliveries / stats.totalDeliveries : 0;

    // Calculate average delivery time
    const deliveries = Array.from(this.deliveries.values())
      .filter(d => d.webhookId === endpoint.id && d.response?.duration);
    
    if (deliveries.length > 0) {
      stats.averageDeliveryTime = deliveries.reduce((sum, d) => sum + d.response!.duration, 0) / deliveries.length;
    }
  }

  // Public methods
  async createEndpoint(endpointData: Omit<WebhookEndpoint, 'id' | 'createdAt' | 'updatedAt' | 'deliveryHistory' | 'statistics'>): Promise<WebhookEndpoint> {
    const endpoint: WebhookEndpoint = {
      ...endpointData,
      id: Math.random().toString(36),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deliveryHistory: [],
      statistics: {
        totalDeliveries: 0,
        successfulDeliveries: 0,
        failedDeliveries: 0,
        averageDeliveryTime: 0,
        lastDeliveryStatus: 'success',
        successRate: 1.0,
        errorRate: 0.0
      }
    };

    this.endpoints.set(endpoint.id, endpoint);
    return endpoint;
  }

  async updateEndpoint(id: string, updates: Partial<WebhookEndpoint>): Promise<void> {
    const endpoint = this.endpoints.get(id);
    if (!endpoint) return;

    Object.assign(endpoint, updates);
    endpoint.updatedAt = Date.now();
  }

  async deleteEndpoint(id: string): Promise<void> {
    this.endpoints.delete(id);
    
    // Clean up related deliveries
    const deliveries = Array.from(this.deliveries.values())
      .filter(d => d.webhookId === id);
    
    deliveries.forEach(delivery => {
      this.deliveries.delete(delivery.id);
    });
  }

  async toggleEndpoint(id: string): Promise<void> {
    const endpoint = this.endpoints.get(id);
    if (!endpoint) return;

    endpoint.active = !endpoint.active;
    endpoint.updatedAt = Date.now();
  }

  async triggerEvent(type: string, source: string, data: any, metadata?: any): Promise<void> {
    const event: WebhookEvent = {
      id: Math.random().toString(36),
      type,
      source,
      data,
      timestamp: Date.now(),
      metadata: {
        version: '1.0',
        id: Math.random().toString(36),
        ...metadata
      },
      processed: false,
      deliveredTo: []
    };

    this.events.push(event);
    this.eventQueue.push(event);

    // Keep only last 1000 events
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }
  }

  getEvents(filters?: {
    type?: string;
    source?: string;
    dateRange?: { start: number; end: number };
  }): WebhookEvent[] {
    let filtered = this.events;

    if (filters?.type) {
      filtered = filtered.filter(event => event.type === filters.type);
    }

    if (filters?.source) {
      filtered = filtered.filter(event => event.source === filters.source);
    }

    if (filters?.dateRange) {
      filtered = filtered.filter(event => 
        event.timestamp >= filters.dateRange!.start && 
        event.timestamp <= filters.dateRange!.end
      );
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }

  getDeliveries(filters?: {
    webhookId?: string;
    status?: string;
    dateRange?: { start: number; end: number };
  }): WebhookDelivery[] {
    let filtered = Array.from(this.deliveries.values());

    if (filters?.webhookId) {
      filtered = filtered.filter(delivery => delivery.webhookId === filters.webhookId);
    }

    if (filters?.status) {
      filtered = filtered.filter(delivery => delivery.status === filters.status);
    }

    if (filters?.dateRange) {
      filtered = filtered.filter(delivery => 
        delivery.timestamp >= filters.dateRange!.start && 
        delivery.timestamp <= filters.dateRange!.end
      );
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }

  async retryDelivery(deliveryId: string): Promise<void> {
    const delivery = this.deliveries.get(deliveryId);
    if (!delivery) return;

    delivery.attempt = 1;
    delivery.status = 'pending';
    delivery.error = undefined;
    delivery.response = undefined;

    this.processingQueue.push(delivery);
  }

  async createFromTemplate(templateId: string, name: string, url: string): Promise<WebhookEndpoint> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    return await this.createEndpoint({
      name,
      description: template.description,
      url,
      events: template.events,
      active: true,
      method: 'POST',
      headers: template.headers,
      retryPolicy: {
        maxAttempts: 3,
        backoffStrategy: 'exponential',
        initialDelay: 1000,
        maxDelay: 30000,
        retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND']
      },
      filters: [],
      transformations: template.transformations,
      rateLimit: {
        maxEvents: 100,
        windowMs: 60000
      },
      security: {
        signatureHeader: 'X-Webhook-Signature',
        signatureAlgorithm: 'sha256',
        ipWhitelist: [],
        requireHttps: true,
        validatePayload: true
      }
    });
  }

  getAnalytics() {
    const endpoints = Array.from(this.endpoints.values());
    const totalEndpoints = endpoints.length;
    const activeEndpoints = endpoints.filter(e => e.active).length;
    
    const totalEvents = this.events.length;
    const totalDeliveries = Array.from(this.deliveries.values()).length;
    
    const successfulDeliveries = Array.from(this.deliveries.values())
      .filter(d => d.status === 'delivered').length;
    const successRate = totalDeliveries > 0 ? successfulDeliveries / totalDeliveries : 0;

    const deliveryTimes = Array.from(this.deliveries.values())
      .filter(d => d.response?.duration)
      .map(d => d.response!.duration);
    const averageDeliveryTime = deliveryTimes.length > 0 
      ? deliveryTimes.reduce((sum, time) => sum + time, 0) / deliveryTimes.length 
      : 0;

    // Top events
    const eventCounts: Record<string, number> = {};
    this.events.forEach(event => {
      eventCounts[event.type] = (eventCounts[event.type] || 0) + 1;
    });
    const topEvents = Object.entries(eventCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([event, deliveries]) => ({ event, deliveries }));

    // Error analysis
    const errorCounts: Record<string, number> = {};
    Array.from(this.deliveries.values())
      .filter(d => d.error)
      .forEach(delivery => {
        errorCounts[delivery.error!] = (errorCounts[delivery.error!] || 0) + 1;
      });
    const errorAnalysis = Object.entries(errorCounts)
      .map(([error, count]) => ({ error, count }));

    return {
      totalEndpoints,
      activeEndpoints,
      totalEvents,
      totalDeliveries,
      successRate,
      averageDeliveryTime,
      topEvents,
      errorAnalysis
    };
  }

  // Getters
  getEndpoints(): WebhookEndpoint[] {
    return Array.from(this.endpoints.values());
  }

  getTemplates(): WebhookTemplate[] {
    return Array.from(this.templates.values());
  }
}

// Rate Limiter
class RateLimiter {
  private requests: number[] = [];

  constructor(private maxRequests: number, private windowMs: number) {}

  check(): boolean {
    const now = Date.now();
    
    // Remove old requests outside the window
    this.requests = this.requests.filter(timestamp => timestamp > now - this.windowMs);
    
    // Check if we can make a new request
    if (this.requests.length >= this.maxRequests) {
      return false;
    }
    
    // Add current request
    this.requests.push(now);
    return true;
  }
}

// Main Webhook Manager Component
export const WebhookManager: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentMode } = useUserExperienceMode();
  const { isLowPerformanceMode } = usePerformance();
  const { user } = useAuthStore();
  
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [templates, setTemplates] = useState<WebhookTemplate[]>([]);
  
  const engineRef = useRef<WebhookEngine>();

  // Initialize engine
  useEffect(() => {
    engineRef.current = new WebhookEngine();
    loadData();
    
    return () => {
      // Cleanup
    };
  }, []);

  const loadData = useCallback(() => {
    if (!engineRef.current) return;

    setEndpoints(engineRef.current.getEndpoints());
    setEvents(engineRef.current.getEvents());
    setDeliveries(engineRef.current.getDeliveries());
    setTemplates(engineRef.current.getTemplates());
  }, []);

  const createEndpoint = useCallback(async (endpointData: Omit<WebhookEndpoint, 'id' | 'createdAt' | 'updatedAt' | 'deliveryHistory' | 'statistics'>): Promise<WebhookEndpoint> => {
    if (!engineRef.current) {
      throw new Error('Webhook engine not initialized');
    }

    const endpoint = await engineRef.current.createEndpoint(endpointData);
    setEndpoints(prev => [...prev, endpoint]);
    return endpoint;
  }, []);

  const updateEndpoint = useCallback(async (id: string, updates: Partial<WebhookEndpoint>): Promise<void> => {
    if (!engineRef.current) return;

    await engineRef.current.updateEndpoint(id, updates);
    setEndpoints(prev => prev.map(endpoint => 
      endpoint.id === id ? { ...endpoint, ...updates, updatedAt: Date.now() } : endpoint
    ));
  }, []);

  const deleteEndpoint = useCallback(async (id: string): Promise<void> => {
    if (!engineRef.current) return;

    await engineRef.current.deleteEndpoint(id);
    setEndpoints(prev => prev.filter(endpoint => endpoint.id !== id));
    setDeliveries(prev => prev.filter(delivery => delivery.webhookId !== id));
  }, []);

  const toggleEndpoint = useCallback(async (id: string): Promise<void> => {
    if (!engineRef.current) return;

    await engineRef.current.toggleEndpoint(id);
    setEndpoints(prev => prev.map(endpoint => 
      endpoint.id === id ? { ...endpoint, active: !endpoint.active, updatedAt: Date.now() } : endpoint
    ));
  }, []);

  const triggerEvent = useCallback(async (type: string, source: string, data: any, metadata?: any): Promise<void> => {
    if (!engineRef.current) return;

    await engineRef.current.triggerEvent(type, source, data, metadata);
    loadData();
  }, [loadData]);

  const getEvents = useCallback((filters?: {
    type?: string;
    source?: string;
    dateRange?: { start: number; end: number };
  }): WebhookEvent[] => {
    if (!engineRef.current) return [];

    return engineRef.current.getEvents(filters);
  }, []);

  const getDeliveries = useCallback((filters?: {
    webhookId?: string;
    status?: string;
    dateRange?: { start: number; end: number };
  }): WebhookDelivery[] => {
    if (!engineRef.current) return [];

    return engineRef.current.getDeliveries(filters);
  }, []);

  const retryDelivery = useCallback(async (deliveryId: string): Promise<void> => {
    if (!engineRef.current) return;

    await engineRef.current.retryDelivery(deliveryId);
    loadData();
  }, [loadData]);

  const createFromTemplate = useCallback(async (templateId: string, name: string, url: string): Promise<WebhookEndpoint> => {
    if (!engineRef.current) {
      throw new Error('Webhook engine not initialized');
    }

    const endpoint = await engineRef.current.createFromTemplate(templateId, name, url);
    setEndpoints(prev => [...prev, endpoint]);
    return endpoint;
  }, []);

  const getAnalytics = useCallback(() => {
    if (!engineRef.current) {
      return {
        totalEndpoints: 0,
        activeEndpoints: 0,
        totalEvents: 0,
        totalDeliveries: 0,
        successRate: 0,
        averageDeliveryTime: 0,
        topEvents: [],
        errorAnalysis: []
      };
    }

    return engineRef.current.getAnalytics();
  }, []);

  const contextValue: WebhookManagerContextType = {
    endpoints,
    createEndpoint,
    updateEndpoint,
    deleteEndpoint,
    toggleEndpoint,
    events,
    triggerEvent,
    getEvents,
    deliveries,
    getDeliveries,
    retryDelivery,
    templates,
    createFromTemplate,
    getAnalytics
  };

  return (
    <WebhookManagerContext.Provider value={contextValue}>
      {children}
    </WebhookManagerContext.Provider>
  );
};

// Hooks
export const useWebhookManager = (): WebhookManagerContextType => {
  const context = React.useContext(WebhookManagerContext);
  if (!context) {
    throw new Error('useWebhookManager must be used within WebhookManager');
  }
  return context;
};

// Higher-Order Components
export const withWebhookManager = <P extends object>(Component: React.ComponentType<P>) => {
  return React.forwardRef<any, P>((props, ref) => (
    <WebhookManager>
      <Component {...props} ref={ref} />
    </WebhookManager>
  ));
};

// Utility Components
export { WebhookManagerContext };
export default WebhookManager;
