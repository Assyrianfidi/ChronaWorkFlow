import React, { useState, useEffect, useCallback, useRef } from "react";
import { useUserExperienceMode } from "@/components/adaptive/UserExperienceMode";
import { usePerformance } from "@/components/adaptive/UI-Performance-Engine";
import { useAuthStore } from "@/../../store/auth-store";

// API Gateway Types
interface APIEndpoint {
  id: string;
  name: string;
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  description: string;
  category: "internal" | "external" | "partner" | "public";
  version: string;
  status: "active" | "inactive" | "deprecated";
  authentication: {
    type: "none" | "api-key" | "oauth2" | "jwt" | "basic";
    required: boolean;
  };
  rateLimit: {
    requests: number;
    window: number; // milliseconds
    burst: number;
  };
  validation: {
    schema?: any;
    required: string[];
    optional: string[];
  };
  transformation: {
    request?: any;
    response?: any;
  };
  monitoring: {
    enabled: boolean;
    logging: boolean;
    metrics: boolean;
  };
  createdAt: number;
  updatedAt: number;
  usage: {
    totalRequests: number;
    successRate: number;
    averageResponseTime: number;
    errorRate: number;
  };
}

interface APIRequest {
  id: string;
  endpointId: string;
  method: string;
  path: string;
  headers: Record<string, string>;
  query: Record<string, string>;
  body: any;
  timestamp: number;
  status: "pending" | "processing" | "completed" | "failed";
  response?: {
    status: number;
    headers: Record<string, string>;
    body: any;
    duration: number;
  };
  error?: string;
  metadata: {
    userAgent: string;
    ip: string;
    userId?: string;
    sessionId: string;
  };
}

interface APIKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  rateLimit: {
    requests: number;
    window: number;
  };
  expiresAt?: number;
  isActive: boolean;
  createdAt: number;
  lastUsed?: number;
  usage: {
    totalRequests: number;
    lastRequest: number;
  };
}

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret?: string;
  active: boolean;
  retryPolicy: {
    maxAttempts: number;
    backoff: "linear" | "exponential";
    delay: number;
  };
  headers: Record<string, string>;
  createdAt: number;
  lastTriggered?: number;
  deliveryHistory: WebhookDelivery[];
}

interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: string;
  payload: any;
  attempt: number;
  status: "pending" | "delivered" | "failed";
  response?: {
    status: number;
    headers: Record<string, string>;
    body: string;
  };
  error?: string;
  timestamp: number;
}

// API Gateway Context
interface APIGatewayContextType {
  // Endpoints Management
  endpoints: APIEndpoint[];
  createEndpoint: (
    endpoint: Omit<APIEndpoint, "id" | "createdAt" | "updatedAt" | "usage">,
  ) => Promise<APIEndpoint>;
  updateEndpoint: (id: string, updates: Partial<APIEndpoint>) => Promise<void>;
  deleteEndpoint: (id: string) => Promise<void>;
  deployEndpoint: (id: string) => Promise<void>;

  // Request Management
  requests: APIRequest[];
  getRequest: (id: string) => APIRequest | undefined;
  getRequests: (filters?: {
    endpointId?: string;
    status?: string;
    dateRange?: { start: number; end: number };
  }) => APIRequest[];

  // API Keys Management
  apiKeys: APIKey[];
  createAPIKey: (
    key: Omit<APIKey, "id" | "key" | "createdAt" | "usage">,
  ) => Promise<APIKey>;
  revokeAPIKey: (id: string) => Promise<void>;

  // Webhooks Management
  webhooks: Webhook[];
  createWebhook: (
    webhook: Omit<Webhook, "id" | "createdAt" | "deliveryHistory">,
  ) => Promise<Webhook>;
  triggerWebhook: (event: string, payload: any) => Promise<void>;

  // Analytics
  getAnalytics: () => {
    totalRequests: number;
    successRate: number;
    averageResponseTime: number;
    topEndpoints: Array<{ endpoint: string; requests: number }>;
    errorAnalysis: Array<{ error: string; count: number; rate: number }>;
  };
}

const APIGatewayContext = React.createContext<APIGatewayContextType | null>(
  null,
);

// API Gateway Engine
class APIGatewayEngine {
  private endpoints: Map<string, APIEndpoint> = new Map();
  private requests: Map<string, APIRequest> = new Map();
  private apiKeys: Map<string, APIKey> = new Map();
  private webhooks: Map<string, Webhook> = new Map();
  private middleware: Map<string, (req: any, res: any, next: any) => void> =
    new Map();
  private transformers: Map<string, (data: any) => any> = new Map();
  private validators: Map<string, (data: any) => boolean> = new Map();

  constructor() {
    this.initializeMiddleware();
    this.initializeTransformers();
    this.initializeValidators();
    this.initializeDefaultEndpoints();
  }

  private initializeMiddleware(): void {
    // Authentication middleware
    this.middleware.set(
      "auth",
      async (req: APIRequest, endpoint: APIEndpoint) => {
        if (!endpoint.authentication.required) return true;

        const authHeader = req.headers["authorization"];
        if (!authHeader) {
          throw new Error("Authentication required");
        }

        switch (endpoint.authentication.type) {
          case "api-key":
            return this.validateAPIKey(authHeader);
          case "jwt":
            return this.validateJWT(authHeader);
          case "basic":
            return this.validateBasicAuth(authHeader);
          default:
            return false;
        }
      },
    );

    // Rate limiting middleware
    this.middleware.set(
      "rateLimit",
      async (req: APIRequest, endpoint: APIEndpoint) => {
        const key = this.getClientKey(req);
        const requests = this.getRecentRequests(key, endpoint.rateLimit.window);

        if (requests.length >= endpoint.rateLimit.requests) {
          throw new Error("Rate limit exceeded");
        }

        return true;
      },
    );

    // Logging middleware
    this.middleware.set(
      "logging",
      async (req: APIRequest, endpoint: APIEndpoint) => {
        if (endpoint.monitoring.logging) {
          console.log(`API Request: ${req.method} ${req.path}`, {
            timestamp: req.timestamp,
            userAgent: req.metadata.userAgent,
            ip: req.metadata.ip,
          });
        }
        return true;
      },
    );

    // Metrics middleware
    this.middleware.set(
      "metrics",
      async (req: APIRequest, endpoint: APIEndpoint) => {
        if (endpoint.monitoring.metrics) {
          // Record metrics
          this.recordMetrics(req, endpoint);
        }
        return true;
      },
    );
  }

  private initializeTransformers(): void {
    // Request transformers
    this.transformers.set("camelCase", (data: any) => {
      return this.transformKeys(data, this.toCamelCase);
    });

    this.transformers.set("snakeCase", (data: any) => {
      return this.transformKeys(data, this.toSnakeCase);
    });

    this.transformers.set("kebabCase", (data: any) => {
      return this.transformKeys(data, this.toKebabCase);
    });

    // Response transformers
    this.transformers.set("filterFields", (data: any, fields: string[]) => {
      if (!Array.isArray(fields) || fields.length === 0) return data;

      return this.filterObject(data, fields);
    });

    this.transformers.set(
      "paginate",
      (data: any, page: number, limit: number) => {
        const offset = (page - 1) * limit;
        return {
          data: Array.isArray(data) ? data.slice(offset, offset + limit) : data,
          pagination: {
            page,
            limit,
            total: Array.isArray(data) ? data.length : 1,
            pages: Math.ceil((Array.isArray(data) ? data.length : 1) / limit),
          },
        };
      },
    );
  }

  private initializeValidators(): void {
    // JSON Schema validator
    this.validators.set("jsonSchema", async (data: any, schema: any) => {
      // Simplified validation - in production use a proper JSON schema validator
      if (schema.required && Array.isArray(schema.required)) {
        for (const field of schema.required) {
          if (!(field in data)) {
            throw new Error(`Required field missing: ${field}`);
          }
        }
      }
      return true;
    });

    // Type validator
    this.validators.set("type", async (data: any, expectedType: string) => {
      switch (expectedType) {
        case "string":
          return typeof data === "string";
        case "number":
          return typeof data === "number";
        case "boolean":
          return typeof data === "boolean";
        case "array":
          return Array.isArray(data);
        case "object":
          return typeof data === "object" && data !== null;
        default:
          return true;
      }
    });
  }

  private initializeDefaultEndpoints(): void {
    const defaultEndpoints: APIEndpoint[] = [
      {
        id: "health-check",
        name: "Health Check",
        path: "/api/health",
        method: "GET",
        description: "System health check endpoint",
        category: "public",
        version: "v1",
        status: "active",
        authentication: { type: "none", required: false },
        rateLimit: { requests: 100, window: 60000, burst: 10 },
        validation: { required: [], optional: [] },
        transformation: {},
        monitoring: { enabled: true, logging: true, metrics: true },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usage: {
          totalRequests: 0,
          successRate: 1.0,
          averageResponseTime: 0,
          errorRate: 0,
        },
      },
      {
        id: "user-profile",
        name: "User Profile",
        path: "/api/users/:id",
        method: "GET",
        description: "Get user profile information",
        category: "internal",
        version: "v1",
        status: "active",
        authentication: { type: "jwt", required: true },
        rateLimit: { requests: 1000, window: 60000, burst: 50 },
        validation: { required: ["id"], optional: [] },
        transformation: {
          request: { transformer: "camelCase" },
          response: {
            transformer: "filterFields",
            fields: ["id", "name", "email", "role"],
          },
        },
        monitoring: { enabled: true, logging: true, metrics: true },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usage: {
          totalRequests: 0,
          successRate: 1.0,
          averageResponseTime: 0,
          errorRate: 0,
        },
      },
      {
        id: "analytics-data",
        name: "Analytics Data",
        path: "/api/analytics",
        method: "GET",
        description: "Get analytics and metrics data",
        category: "internal",
        version: "v1",
        status: "active",
        authentication: { type: "api-key", required: true },
        rateLimit: { requests: 500, window: 60000, burst: 25 },
        validation: {
          required: [],
          optional: ["startDate", "endDate", "type"],
        },
        transformation: {
          response: { transformer: "paginate", page: 1, limit: 100 },
        },
        monitoring: { enabled: true, logging: true, metrics: true },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usage: {
          totalRequests: 0,
          successRate: 1.0,
          averageResponseTime: 0,
          errorRate: 0,
        },
      },
    ];

    defaultEndpoints.forEach((endpoint) => {
      this.endpoints.set(endpoint.id, endpoint);
    });
  }

  async processRequest(request: APIRequest): Promise<APIRequest> {
    const startTime = Date.now();

    try {
      // Find matching endpoint
      const endpoint = this.findEndpoint(request.method, request.path);
      if (!endpoint) {
        throw new Error("Endpoint not found");
      }

      // Apply middleware
      await this.applyMiddleware(request, endpoint);

      // Validate request
      await this.validateRequest(request, endpoint);

      // Transform request
      await this.transformRequest(request, endpoint);

      // Process request (simulate)
      const response = await this.executeRequest(request, endpoint);

      // Transform response
      await this.transformResponse(response, endpoint);

      // Update request
      request.status = "completed";
      request.response = response;
      request.response.duration = Date.now() - startTime;

      // Update endpoint usage
      this.updateEndpointUsage(endpoint.id, request.response);

      // Trigger webhooks
      await this.triggerWebhooks("api.request.completed", {
        request: request.id,
        endpoint: endpoint.id,
        status: "completed",
      });
    } catch (error) {
      request.status = "failed";
      request.error = error instanceof Error ? error.message : "Unknown error";

      // Trigger error webhooks
      await this.triggerWebhooks("api.request.failed", {
        request: request.id,
        error: request.error,
      });
    }

    return request;
  }

  private findEndpoint(method: string, path: string): APIEndpoint | undefined {
    // Simple path matching - in production use proper routing
    for (const endpoint of this.endpoints.values()) {
      if (endpoint.method === method && this.matchesPath(endpoint.path, path)) {
        return endpoint;
      }
    }
    return undefined;
  }

  private matchesPath(endpointPath: string, requestPath: string): boolean {
    // Simple path matching with parameters
    const endpointParts = endpointPath.split("/");
    const requestParts = requestPath.split("/");

    if (endpointParts.length !== requestParts.length) {
      return false;
    }

    for (let i = 0; i < endpointParts.length; i++) {
      if (endpointParts[i].startsWith(":")) {
        continue; // Parameter
      }
      if (endpointParts[i] !== requestParts[i]) {
        return false;
      }
    }

    return true;
  }

  private async applyMiddleware(
    request: APIRequest,
    endpoint: APIEndpoint,
  ): Promise<void> {
    const middlewareOrder = ["auth", "rateLimit", "logging", "metrics"];

    for (const middlewareName of middlewareOrder) {
      const middleware = this.middleware.get(middlewareName);
      if (middleware) {
        await middleware(request, endpoint);
      }
    }
  }

  private async validateRequest(
    request: APIRequest,
    endpoint: APIEndpoint,
  ): Promise<void> {
    if (!endpoint.validation.schema) return;

    const validator = this.validators.get("jsonSchema");
    if (validator) {
      await validator(request.body, endpoint.validation.schema);
    }
  }

  private async transformRequest(
    request: APIRequest,
    endpoint: APIEndpoint,
  ): Promise<void> {
    if (!endpoint.transformation.request) return;

    const { transformer, ...options } = endpoint.transformation.request;
    const transformFn = this.transformers.get(transformer);

    if (transformFn) {
      request.body = await transformFn(request.body, options);
    }
  }

  private async transformResponse(
    response: any,
    endpoint: APIEndpoint,
  ): Promise<void> {
    if (!endpoint.transformation.response) return;

    const { transformer, ...options } = endpoint.transformation.response;
    const transformFn = this.transformers.get(transformer);

    if (transformFn) {
      response.body = await transformFn(response.body, options);
    }
  }

  private async executeRequest(
    request: APIRequest,
    endpoint: APIEndpoint,
  ): Promise<any> {
    // Simulate request processing
    await new Promise((resolve) =>
      setTimeout(resolve, Math.random() * 100 + 50),
    );

    // Generate mock response based on endpoint
    let responseBody: any = {};

    switch (endpoint.id) {
      case "health-check":
        responseBody = {
          status: "healthy",
          timestamp: Date.now(),
          uptime: Date.now(),
          version: "1.0.0",
        };
        break;
      case "user-profile":
        responseBody = {
          id: request.path.split("/").pop(),
          name: "John Doe",
          email: "john.doe@example.com",
          role: "user",
          createdAt: Date.now(),
        };
        break;
      case "analytics-data":
        responseBody = {
          metrics: [
            { name: "users", value: 1250 },
            { name: "sessions", value: 3400 },
            { name: "revenue", value: 45600 },
          ],
          period: "last-30-days",
          generatedAt: Date.now(),
        };
        break;
      default:
        responseBody = { message: "Request processed successfully" };
    }

    return {
      status: 200,
      headers: {
        "content-type": "application/json",
        "x-request-id": request.id,
      },
      body: responseBody,
    };
  }

  private updateEndpointUsage(endpointId: string, response: any): void {
    const endpoint = this.endpoints.get(endpointId);
    if (!endpoint) return;

    endpoint.usage.totalRequests++;
    endpoint.usage.successRate =
      (endpoint.usage.successRate * (endpoint.usage.totalRequests - 1) +
        (response.status < 400 ? 1 : 0)) /
      endpoint.usage.totalRequests;
    endpoint.usage.averageResponseTime =
      (endpoint.usage.averageResponseTime * (endpoint.usage.totalRequests - 1) +
        response.duration) /
      endpoint.usage.totalRequests;
    endpoint.usage.errorRate =
      (endpoint.usage.errorRate * (endpoint.usage.totalRequests - 1) +
        (response.status >= 400 ? 1 : 0)) /
      endpoint.usage.totalRequests;
  }

  private async triggerWebhooks(event: string, payload: any): Promise<void> {
    const relevantWebhooks = Array.from(this.webhooks.values()).filter(
      (webhook) => webhook.active && webhook.events.includes(event),
    );

    for (const webhook of relevantWebhooks) {
      // Trigger webhook asynchronously
      this.deliverWebhook(webhook, event, payload).catch(console.error);
    }
  }

  private async deliverWebhook(
    webhook: Webhook,
    event: string,
    payload: any,
  ): Promise<void> {
    const delivery: WebhookDelivery = {
      id: Math.random().toString(36),
      webhookId: webhook.id,
      event,
      payload,
      attempt: 1,
      status: "pending",
      timestamp: Date.now(),
    };

    webhook.deliveryHistory.push(delivery);

    try {
      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Event": event,
          ...webhook.headers,
        },
        body: JSON.stringify(payload),
      });

      delivery.status = "delivered";
      delivery.response = {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: await response.text(),
      };

      webhook.lastTriggered = Date.now();
    } catch (error) {
      delivery.status = "failed";
      delivery.error = error instanceof Error ? error.message : "Unknown error";

      // Implement retry logic
      if (delivery.attempt < webhook.retryPolicy.maxAttempts) {
        const delay =
          webhook.retryPolicy.backoff === "exponential"
            ? webhook.retryPolicy.delay * Math.pow(2, delivery.attempt - 1)
            : webhook.retryPolicy.delay;

        setTimeout(() => {
          delivery.attempt++;
          this.deliverWebhook(webhook, event, payload);
        }, delay);
      }
    }
  }

  private validateAPIKey(key: string): boolean {
    return this.apiKeys.has(key.replace("Bearer ", ""));
  }

  private validateJWT(token: string): boolean {
    // Simplified JWT validation - in production use proper JWT library
    return token.startsWith("eyJ") && token.length > 100;
  }

  private validateBasicAuth(auth: string): boolean {
    const credentials = Buffer.from(
      auth.replace("Basic ", ""),
      "base64",
    ).toString();
    return credentials.includes(":");
  }

  private getClientKey(request: APIRequest): string {
    return `${request.metadata.ip}:${request.metadata.userAgent}`;
  }

  private getRecentRequests(key: string, window: number): APIRequest[] {
    const now = Date.now();
    return Array.from(this.requests.values()).filter(
      (req) => this.getClientKey(req) === key && req.timestamp > now - window,
    );
  }

  private recordMetrics(request: APIRequest, endpoint: APIEndpoint): void {
    // Record metrics for monitoring
    console.log(`Metrics recorded for ${endpoint.id}`, {
      timestamp: request.timestamp,
      status: request.status,
      duration: request.response?.duration,
    });
  }

  private transformKeys(obj: any, transformFn: (key: string) => string): any {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.transformKeys(item, transformFn));
    } else if (obj && typeof obj === "object") {
      const transformed: any = {};
      for (const [key, value] of Object.entries(obj)) {
        transformed[transformFn(key)] = this.transformKeys(value, transformFn);
      }
      return transformed;
    }
    return obj;
  }

  private toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  private toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }

  private toKebabCase(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
  }

  private filterObject(obj: any, fields: string[]): any {
    if (!obj || typeof obj !== "object") return obj;

    const filtered: any = {};
    for (const field of fields) {
      if (field in obj) {
        filtered[field] = obj[field];
      }
    }
    return filtered;
  }

  // Public methods for context
  getEndpoints(): APIEndpoint[] {
    return Array.from(this.endpoints.values());
  }

  getRequests(filters?: {
    endpointId?: string;
    status?: string;
    dateRange?: { start: number; end: number };
  }): APIRequest[] {
    let requests = Array.from(this.requests.values());

    if (filters?.endpointId) {
      requests = requests.filter(
        (req) => req.endpointId === filters.endpointId,
      );
    }

    if (filters?.status) {
      requests = requests.filter((req) => req.status === filters.status);
    }

    if (filters?.dateRange) {
      requests = requests.filter(
        (req) =>
          req.timestamp >= filters.dateRange!.start &&
          req.timestamp <= filters.dateRange!.end,
      );
    }

    return requests.sort((a, b) => b.timestamp - a.timestamp);
  }

  getAPIKeys(): APIKey[] {
    return Array.from(this.apiKeys.values());
  }

  getWebhooks(): Webhook[] {
    return Array.from(this.webhooks.values());
  }

  getAnalytics() {
    const requests = Array.from(this.requests.values());
    const totalRequests = requests.length;
    const successfulRequests = requests.filter(
      (req) => req.status === "completed",
    ).length;
    const successRate =
      totalRequests > 0 ? successfulRequests / totalRequests : 0;

    const responseTimes = requests
      .filter((req) => req.response?.duration)
      .map((req) => req.response!.duration);
    const averageResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) /
          responseTimes.length
        : 0;

    // Top endpoints
    const endpointCounts: Record<string, number> = {};
    requests.forEach((req) => {
      endpointCounts[req.endpointId] =
        (endpointCounts[req.endpointId] || 0) + 1;
    });
    const topEndpoints = Object.entries(endpointCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([endpoint, count]) => ({ endpoint, requests: count }));

    // Error analysis
    const errorCounts: Record<string, number> = {};
    requests.forEach((req) => {
      if (req.error) {
        errorCounts[req.error] = (errorCounts[req.error] || 0) + 1;
      }
    });
    const errorAnalysis = Object.entries(errorCounts).map(([error, count]) => ({
      error,
      count,
      rate: totalRequests > 0 ? count / totalRequests : 0,
    }));

    return {
      totalRequests,
      successRate,
      averageResponseTime,
      topEndpoints,
      errorAnalysis,
    };
  }

  async createEndpoint(
    endpointData: Omit<APIEndpoint, "id" | "createdAt" | "updatedAt" | "usage">,
  ): Promise<APIEndpoint> {
    const endpoint: APIEndpoint = {
      ...endpointData,
      id: Math.random().toString(36),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      usage: {
        totalRequests: 0,
        successRate: 1.0,
        averageResponseTime: 0,
        errorRate: 0,
      },
    };

    this.endpoints.set(endpoint.id, endpoint);
    return endpoint;
  }

  async createAPIKey(
    keyData: Omit<APIKey, "id" | "key" | "createdAt" | "usage">,
  ): Promise<APIKey> {
    const apiKey: APIKey = {
      ...keyData,
      id: Math.random().toString(36),
      key: this.generateAPIKey(),
      createdAt: Date.now(),
      usage: {
        totalRequests: 0,
        lastRequest: 0,
      },
    };

    this.apiKeys.set(apiKey.key, apiKey);
    return apiKey;
  }

  async createWebhook(
    webhookData: Omit<Webhook, "id" | "createdAt" | "deliveryHistory">,
  ): Promise<Webhook> {
    const webhook: Webhook = {
      ...webhookData,
      id: Math.random().toString(36),
      createdAt: Date.now(),
      deliveryHistory: [],
    };

    this.webhooks.set(webhook.id, webhook);
    return webhook;
  }

  private generateAPIKey(): string {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let key = "";
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  }
}

// Main API Gateway Component
export const EnterpriseAPIGateway: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { currentMode } = useUserExperienceMode();
  const { isLowPerformanceMode } = usePerformance();
  const { user } = useAuthStore();

  const [endpoints, setEndpoints] = useState<APIEndpoint[]>([]);
  const [requests, setRequests] = useState<APIRequest[]>([]);
  const [apiKeys, setAPIKeys] = useState<APIKey[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);

  const gatewayRef = useRef<APIGatewayEngine>();

  // Initialize gateway
  useEffect(() => {
    gatewayRef.current = new APIGatewayEngine();
    loadData();

    return () => {
      // Cleanup
    };
  }, []);

  const loadData = useCallback(() => {
    if (!gatewayRef.current) return;

    setEndpoints(gatewayRef.current.getEndpoints());
    setRequests(gatewayRef.current.getRequests());
    setAPIKeys(gatewayRef.current.getAPIKeys());
    setWebhooks(gatewayRef.current.getWebhooks());
  }, []);

  const createEndpoint = useCallback(
    async (
      endpointData: Omit<
        APIEndpoint,
        "id" | "createdAt" | "updatedAt" | "usage"
      >,
    ): Promise<APIEndpoint> => {
      if (!gatewayRef.current) {
        throw new Error("API Gateway not initialized");
      }

      const endpoint = await gatewayRef.current.createEndpoint(endpointData);
      setEndpoints((prev) => [...prev, endpoint]);
      return endpoint;
    },
    [],
  );

  const updateEndpoint = useCallback(
    async (id: string, updates: Partial<APIEndpoint>): Promise<void> => {
      setEndpoints((prev) =>
        prev.map((endpoint) =>
          endpoint.id === id
            ? { ...endpoint, ...updates, updatedAt: Date.now() }
            : endpoint,
        ),
      );
    },
    [],
  );

  const deleteEndpoint = useCallback(async (id: string): Promise<void> => {
    setEndpoints((prev) => prev.filter((endpoint) => endpoint.id !== id));
  }, []);

  const deployEndpoint = useCallback(
    async (id: string): Promise<void> => {
      await updateEndpoint(id, { status: "active" });
    },
    [updateEndpoint],
  );

  const getRequest = useCallback(
    (id: string): APIRequest | undefined => {
      return requests.find((req) => req.id === id);
    },
    [requests],
  );

  const getRequests = useCallback(
    (filters?: {
      endpointId?: string;
      status?: string;
      dateRange?: { start: number; end: number };
    }): APIRequest[] => {
      if (!gatewayRef.current) return [];

      return gatewayRef.current.getRequests(filters);
    },
    [],
  );

  const createAPIKey = useCallback(
    async (
      keyData: Omit<APIKey, "id" | "key" | "createdAt" | "usage">,
    ): Promise<APIKey> => {
      if (!gatewayRef.current) {
        throw new Error("API Gateway not initialized");
      }

      const apiKey = await gatewayRef.current.createAPIKey(keyData);
      setAPIKeys((prev) => [...prev, apiKey]);
      return apiKey;
    },
    [],
  );

  const revokeAPIKey = useCallback(async (id: string): Promise<void> => {
    setAPIKeys((prev) =>
      prev.map((key) => (key.id === id ? { ...key, isActive: false } : key)),
    );
  }, []);

  const createWebhook = useCallback(
    async (
      webhookData: Omit<Webhook, "id" | "createdAt" | "deliveryHistory">,
    ): Promise<Webhook> => {
      if (!gatewayRef.current) {
        throw new Error("API Gateway not initialized");
      }

      const webhook = await gatewayRef.current.createWebhook(webhookData);
      setWebhooks((prev) => [...prev, webhook]);
      return webhook;
    },
    [],
  );

  const triggerWebhook = useCallback(
    async (event: string, payload: any): Promise<void> => {
      if (!gatewayRef.current) return;

      // This would trigger webhooks - in a real implementation
      console.log(`Triggering webhook for event: ${event}`, payload);
    },
    [],
  );

  const getAnalytics = useCallback(() => {
    if (!gatewayRef.current) {
      return {
        totalRequests: 0,
        successRate: 0,
        averageResponseTime: 0,
        topEndpoints: [],
        errorAnalysis: [],
      };
    }

    return gatewayRef.current.getAnalytics();
  }, []);

  const contextValue: APIGatewayContextType = {
    endpoints,
    createEndpoint,
    updateEndpoint,
    deleteEndpoint,
    deployEndpoint,
    requests,
    getRequest,
    getRequests,
    apiKeys,
    createAPIKey,
    revokeAPIKey,
    webhooks,
    createWebhook,
    triggerWebhook,
    getAnalytics,
  };

  return (
    <APIGatewayContext.Provider value={contextValue}>
      {children}
    </APIGatewayContext.Provider>
  );
};

// Hooks
export const useAPIGateway = (): APIGatewayContextType => {
  const context = React.useContext(APIGatewayContext);
  if (!context) {
    throw new Error("useAPIGateway must be used within EnterpriseAPIGateway");
  }
  return context;
};

// Higher-Order Components
export const withAPIGateway = <P extends object>(
  Component: React.ComponentType<P>,
) => {
  return React.forwardRef<any, P>((props, ref) => (
    <EnterpriseAPIGateway>
      <Component {...props} ref={ref} />
    </EnterpriseAPIGateway>
  ));
};

// Utility Components
export { APIGatewayContext };
export default EnterpriseAPIGateway;
