
declare global {
  interface Window {
    [key: string]: any;
  }
}

import React, { useState, useEffect, useCallback, useRef } from "react";
// @ts-ignore
import { useUserExperienceMode } from '../adaptive/UserExperienceMode.js.js';
// @ts-ignore
import { usePerformance } from '../adaptive/UI-Performance-Engine.js.js';
// @ts-ignore
import { useAuthStore } from '../../store/auth-store.js.js';

// Integration Types
interface ThirdPartyIntegration {
  id: string;
  name: string;
  description: string;
  category:
    | "payment"
    | "email"
    | "analytics"
    | "storage"
    | "social"
    | "crm"
    | "communication"
    | "productivity";
  provider: string;
  version: string;
  status: "connected" | "disconnected" | "error" | "pending";
  configuration: IntegrationConfig;
  capabilities: IntegrationCapability[];
  usage: IntegrationUsage;
  createdAt: number;
  lastSync?: number;
  errors?: IntegrationError[];
}

interface IntegrationConfig {
  apiKey?: string;
  apiSecret?: string;
  webhookUrl?: string;
  endpoints: Record<string, string>;
  settings: Record<string, any>;
  authentication: {
    type: "api-key" | "oauth2" | "basic" | "bearer" | "custom";
    credentials: Record<string, string>;
  };
  rateLimit?: {
    requests: number;
    window: number;
  };
  retryPolicy: {
    maxAttempts: number;
    backoff: "linear" | "exponential";
    delay: number;
  };
  capabilities?: IntegrationCapability[];
}

interface IntegrationCapability {
  name: string;
  description: string;
  enabled: boolean;
  endpoint?: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  parameters?: Record<string, any>;
  responseSchema?: any;
}

interface IntegrationUsage {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastRequest?: number;
  dataTransferred: number;
}

interface IntegrationError {
  id: string;
  timestamp: number;
  type:
    | "authentication"
    | "rate_limit"
    | "network"
    | "validation"
    | "server"
    | "unknown";
  message: string;
  code?: string;
  details?: any;
  resolved: boolean;
}

interface IntegrationEvent {
  id: string;
  integrationId: string;
  type:
    | "data_sync"
    | "webhook_received"
    | "api_call"
    | "error"
    | "status_change";
  data: any;
  timestamp: number;
  processed: boolean;
}

interface OAuthFlow {
  id: string;
  integrationId: string;
  state: string;
  codeVerifier?: string;
  codeChallenge?: string;
  redirectUri: string;
  scopes: string[];
  status: "pending" | "completed" | "failed";
  createdAt: number;
  completedAt?: number;
  tokens?: OAuthTokens;
}

interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresIn: number;
  scope: string;
  receivedAt: number;
}

// Integration Context
interface IntegrationContextType {
  // Integration Management
  integrations: ThirdPartyIntegration[];
  connectIntegration: (
    provider: string,
    config: IntegrationConfig,
  ) => Promise<ThirdPartyIntegration>;
  disconnectIntegration: (integrationId: string) => Promise<void>;
  updateIntegration: (
    integrationId: string,
    updates: Partial<ThirdPartyIntegration>,
  ) => Promise<void>;
  testIntegration: (integrationId: string) => Promise<boolean>;

  // OAuth Management
  initiateOAuth: (
    integrationId: string,
    scopes: string[],
  ) => Promise<OAuthFlow>;
  completeOAuth: (flowId: string, code: string) => Promise<OAuthTokens>;

  // API Calls
  callIntegration: (
    integrationId: string,
    capability: string,
    data?: any,
  ) => Promise<any>;

  // Webhooks
  registerWebhook: (
    integrationId: string,
    events: string[],
    url: string,
  ) => Promise<void>;
  handleWebhook: (
    integrationId: string,
    event: string,
    data: any,
  ) => Promise<void>;

  // Sync & Data
  syncData: (integrationId: string) => Promise<void>;
  getData: (
    integrationId: string,
    endpoint: string,
    params?: any,
  ) => Promise<any>;

  // Analytics
  getAnalytics: () => {
    totalIntegrations: number;
    activeIntegrations: number;
    totalRequests: number;
    successRate: number;
    topProviders: Array<{ provider: string; requests: number }>;
    errorAnalysis: Array<{ error: string; count: number }>;
  };
}

const IntegrationContext = React.createContext<IntegrationContextType | null>(
  null,
);

// Third Party Integration Engine
class ThirdPartyIntegrationEngine {
  private integrations: Map<string, ThirdPartyIntegration> = new Map();
  private oauthFlows: Map<string, OAuthFlow> = new Map();
  private events: IntegrationEvent[] = [];
  private adapters: Map<string, IntegrationAdapter> = new Map();
  private webhooks: Map<string, WebhookHandler> = new Map();
  private syncScheduler: SyncScheduler;

  constructor() {
    this.syncScheduler = new SyncScheduler();
    this.initializeAdapters();
    this.initializeDefaultIntegrations();
  }

  private initializeAdapters(): void {
    // Payment adapters
    this.adapters.set("stripe", new StripeAdapter());
    this.adapters.set("paypal", new PayPalAdapter());

    // Email adapters
    this.adapters.set("sendgrid", new SendGridAdapter());
    this.adapters.set("mailgun", new MailgunAdapter());

    // Analytics adapters
    this.adapters.set("google-analytics", new GoogleAnalyticsAdapter());
    this.adapters.set("mixpanel", new MixpanelAdapter());

    // Storage adapters
    this.adapters.set("aws-s3", new S3Adapter());
    this.adapters.set("google-drive", new GoogleDriveAdapter());

    // Social adapters
    this.adapters.set("twitter", new TwitterAdapter());
    this.adapters.set("facebook", new FacebookAdapter());

    // CRM adapters
    this.adapters.set("salesforce", new SalesforceAdapter());
    this.adapters.set("hubspot", new HubSpotAdapter());

    // Communication adapters
    this.adapters.set("slack", new SlackAdapter());
    this.adapters.set("discord", new DiscordAdapter());

    // Productivity adapters
    this.adapters.set("google-workspace", new GoogleWorkspaceAdapter());
    this.adapters.set("microsoft-365", new Microsoft365Adapter());
  }

  private initializeDefaultIntegrations(): void {
    const defaultIntegrations: ThirdPartyIntegration[] = [
      {
        id: "stripe-default",
        name: "Stripe Payments",
        description: "Accept payments and manage subscriptions",
        category: "payment",
        provider: "stripe",
        version: "v1",
        status: "disconnected",
        configuration: {
          endpoints: {
            api: "https://api.stripe.com/v1",
            webhooks: "https://hooks.stripe.com",
          },
          settings: {
            currency: "USD",
            webhookSecret: "",
          },
          authentication: {
            type: "api-key",
            credentials: {},
          },
          retryPolicy: {
            maxAttempts: 3,
            backoff: "exponential",
            delay: 1000,
          },
        },
        capabilities: [
          {
            name: "create_payment",
            description: "Create a payment intent",
            enabled: false,
            endpoint: "/payment_intents",
            method: "POST",
          },
          {
            name: "create_customer",
            description: "Create a customer",
            enabled: false,
            endpoint: "/customers",
            method: "POST",
          },
        ],
        usage: {
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          averageResponseTime: 0,
          dataTransferred: 0,
        },
        createdAt: Date.now(),
      },
      {
        id: "sendgrid-default",
        name: "SendGrid Email",
        description: "Send transactional and marketing emails",
        category: "email",
        provider: "sendgrid",
        version: "v3",
        status: "disconnected",
        configuration: {
          endpoints: {
            api: "https://api.sendgrid.com/v3",
            webhooks: "https://api.sendgrid.com/v3/webhooks",
          },
          settings: {
            fromEmail: "noreply@example.com",
            templates: [],
          },
          authentication: {
            type: "api-key",
            credentials: {},
          },
          retryPolicy: {
            maxAttempts: 3,
            backoff: "exponential",
            delay: 1000,
          },
        },
        capabilities: [
          {
            name: "send_email",
            description: "Send an email",
            enabled: false,
            endpoint: "/mail/send",
            method: "POST",
          },
          {
            name: "get_templates",
            description: "Get email templates",
            enabled: false,
            endpoint: "/templates",
            method: "GET",
          },
        ],
        usage: {
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          averageResponseTime: 0,
          dataTransferred: 0,
        },
        createdAt: Date.now(),
      },
      {
        id: "slack-default",
        name: "Slack",
        description: "Team communication and collaboration",
        category: "communication",
        provider: "slack",
        version: "v1",
        status: "disconnected",
        configuration: {
          endpoints: {
            api: "https://slack.com/api",
            webhooks: "https://hooks.slack.com",
          },
          settings: {
            channel: "#general",
            botName: "AccuBooks Bot",
          },
          authentication: {
            type: "oauth2",
            credentials: {},
          },
          retryPolicy: {
            maxAttempts: 3,
            backoff: "exponential",
            delay: 1000,
          },
        },
        capabilities: [
          {
            name: "send_message",
            description: "Send a message to a channel",
            enabled: false,
            endpoint: "/chat.postMessage",
            method: "POST",
          },
          {
            name: "get_channels",
            description: "Get list of channels",
            enabled: false,
            endpoint: "/conversations.list",
            method: "GET",
          },
        ],
        usage: {
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          averageResponseTime: 0,
          dataTransferred: 0,
        },
        createdAt: Date.now(),
      },
    ];

    defaultIntegrations.forEach((integration) => {
      this.integrations.set(integration.id, integration);
    });
  }

  async connectIntegration(
    provider: string,
    config: IntegrationConfig,
  ): Promise<ThirdPartyIntegration> {
    const adapter = this.adapters.get(provider);
    if (!adapter) {
      throw new Error(`No adapter found for provider: ${provider}`);
    }

    // Test connection
    const isConnected = await adapter.testConnection(config);
    if (!isConnected) {
      throw new Error("Connection test failed");
    }

    const integration: ThirdPartyIntegration = {
      id: Math.random().toString(36),
      name: adapter.getName(),
      description: adapter.getDescription(),
      category: adapter.getCategory() as
        | "payment"
        | "email"
        | "analytics"
        | "storage"
        | "social"
        | "crm"
        | "communication"
        | "productivity",
      provider,
      version: adapter.getVersion(),
      status: "connected",
      configuration: config,
      capabilities: adapter.getCapabilities(),
      usage: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        dataTransferred: 0,
      },
      createdAt: Date.now(),
      lastSync: Date.now(),
    };

    this.integrations.set(integration.id, integration);

    // Set up webhooks if needed
    await this.setupWebhooks(integration);

    // Start sync scheduler
    this.syncScheduler.scheduleSync(integration);

    this.recordEvent(integration.id, "status_change", { status: "connected" });

    return integration;
  }

  async disconnectIntegration(integrationId: string): Promise<void> {
    const integration = this.integrations.get(integrationId);
    if (!integration) return;

    // Clean up webhooks
    await this.cleanupWebhooks(integration);

    // Stop sync scheduler
    this.syncScheduler.unscheduleSync(integrationId);

    integration.status = "disconnected";
    this.recordEvent(integrationId, "status_change", {
      status: "disconnected",
    });
  }

  async updateIntegration(
    integrationId: string,
    updates: Partial<ThirdPartyIntegration>,
  ): Promise<void> {
    const integration = this.integrations.get(integrationId);
    if (!integration) return;

    Object.assign(integration, updates);
    integration.lastSync = Date.now();
  }

  async testIntegration(integrationId: string): Promise<boolean> {
    const integration = this.integrations.get(integrationId);
    if (!integration) return false;

    const adapter = this.adapters.get(integration.provider);
    if (!adapter) return false;

    try {
      const result = await adapter.testConnection(integration.configuration);
      integration.status = result ? "connected" : "error";
      return result;
    } catch (error) {
      integration.status = "error";
      this.recordError(
        integrationId,
        "network",
        error instanceof Error ? error.message : "Unknown error",
      );
      return false;
    }
  }

  async initiateOAuth(
    integrationId: string,
    scopes: string[],
  ): Promise<OAuthFlow> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error("Integration not found");
    }

    const adapter = this.adapters.get(integration.provider);
    if (!adapter || !adapter.supportsOAuth()) {
      throw new Error("OAuth not supported for this integration");
    }

    const flow: OAuthFlow = {
      id: Math.random().toString(36),
      integrationId,
      state: Math.random().toString(36),
      redirectUri: `${window.location.origin}/oauth/callback`,
      scopes,
      status: "pending",
      createdAt: Date.now(),
    };

    // Generate PKCE if supported
    if (adapter.supportsPKCE()) {
      flow.codeVerifier = this.generateCodeVerifier();
      flow.codeChallenge = this.generateCodeChallenge(flow.codeVerifier);
    }

    this.oauthFlows.set(flow.id, flow);

    // Initiate OAuth flow
    const authUrl = await adapter.getOAuthUrl(flow);
    window.open(authUrl, "_blank");

    return flow;
  }

  async completeOAuth(flowId: string, code: string): Promise<OAuthTokens> {
    const flow = this.oauthFlows.get(flowId);
    if (!flow || flow.status !== "pending") {
      throw new Error("Invalid OAuth flow");
    }

    const integration = this.integrations.get(flow.integrationId);
    if (!integration) {
      throw new Error("Integration not found");
    }

    const adapter = this.adapters.get(integration.provider);
    if (!adapter) {
      throw new Error("Adapter not found");
    }

    try {
      const tokens = await adapter.exchangeCodeForTokens(code, flow);

      flow.status = "completed";
      flow.completedAt = Date.now();
      flow.tokens = tokens;

      // Update integration configuration
      integration.configuration.authentication.credentials = {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken || "",
        tokenType: tokens.tokenType,
      };

      integration.status = "connected";
      integration.lastSync = Date.now();

      this.recordEvent(flow.integrationId, "status_change", {
        status: "connected",
        via: "oauth",
      });

      return tokens;
    } catch (error) {
      flow.status = "failed";
      throw error;
    }
  }

  async callIntegration(
    integrationId: string,
    capability: string,
    data?: any,
  ): Promise<any> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error("Integration not found");
    }

    const adapter = this.adapters.get(integration.provider);
    if (!adapter) {
      throw new Error("Adapter not found");
    }

    const capabilityConfig = integration.capabilities.find(
      (cap) => cap.name === capability,
    );
    if (!capabilityConfig || !capabilityConfig.enabled) {
      throw new Error("Capability not available");
    }

    const startTime = Date.now();

    try {
      const result = await adapter.call(
        capabilityConfig,
        data,
        integration.configuration,
      );

      // Update usage statistics
      integration.usage.totalRequests++;
      integration.usage.successfulRequests++;
      integration.usage.averageResponseTime =
        (integration.usage.averageResponseTime *
          (integration.usage.totalRequests - 1) +
          (Date.now() - startTime)) /
        integration.usage.totalRequests;
      integration.usage.lastRequest = Date.now();

      this.recordEvent(integrationId, "api_call", {
        capability,
        success: true,
      });

      return result;
    } catch (error) {
      integration.usage.totalRequests++;
      integration.usage.failedRequests++;

      this.recordError(
        integrationId,
        "network",
        error instanceof Error ? error.message : "Unknown error",
      );
      this.recordEvent(integrationId, "api_call", {
        capability,
        success: false,
      });

      throw error;
    }
  }

  async registerWebhook(
    integrationId: string,
    events: string[],
    url: string,
  ): Promise<void> {
    const integration = this.integrations.get(integrationId);
    if (!integration) return;

    const adapter = this.adapters.get(integration.provider);
    if (!adapter || !adapter.supportsWebhooks()) {
      throw new Error("Webhooks not supported");
    }

    await adapter.registerWebhook(events, url, integration.configuration);

    // Store webhook handler
    this.webhooks.set(
      integrationId,
      new WebhookHandler(integrationId, events, url),
    );
  }

  async handleWebhook(
    integrationId: string,
    event: string,
    data: any,
  ): Promise<void> {
    const webhook = this.webhooks.get(integrationId);
    if (!webhook || !webhook.events.includes(event)) {
      throw new Error("Webhook not registered for this event");
    }

    await webhook.handle(event, data);
    this.recordEvent(integrationId, "webhook_received", { event, data });
  }

  async syncData(integrationId: string): Promise<void> {
    const integration = this.integrations.get(integrationId);
    if (!integration) return;

    const adapter = this.adapters.get(integration.provider);
    if (!adapter || !adapter.supportsSync()) {
      return;
    }

    try {
      await adapter.syncData(integration.configuration);
      integration.lastSync = Date.now();
      this.recordEvent(integrationId, "data_sync", { success: true });
    } catch (error) {
      this.recordError(
        integrationId,
        "server",
        error instanceof Error ? error.message : "Sync failed",
      );
      this.recordEvent(integrationId, "data_sync", { success: false });
    }
  }

  async getData(
    integrationId: string,
    endpoint: string,
    params?: any,
  ): Promise<any> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error("Integration not found");
    }

    const adapter = this.adapters.get(integration.provider);
    if (!adapter) {
      throw new Error("Adapter not found");
    }

    return await adapter.getData(endpoint, params, integration.configuration);
  }

  private async setupWebhooks(
    integration: ThirdPartyIntegration,
  ): Promise<void> {
    const adapter = this.adapters.get(integration.provider);
    if (!adapter || !adapter.supportsWebhooks()) {
      return;
    }

    try {
      const webhookUrl = `${window.location.origin}/webhooks/${integration.id}`;
      const events = adapter.getWebhookEvents();

      await adapter.registerWebhook(
        events,
        webhookUrl,
        integration.configuration,
      );
      this.webhooks.set(
        integration.id,
        new WebhookHandler(integration.id, events, webhookUrl),
      );
    } catch (error) {
      console.error("Failed to setup webhooks:", error);
    }
  }

  private async cleanupWebhooks(
    integration: ThirdPartyIntegration,
  ): Promise<void> {
    const webhook = this.webhooks.get(integration.id);
    if (!webhook) return;

    const adapter = this.adapters.get(integration.provider);
    if (adapter && adapter.supportsWebhooks()) {
      try {
        await adapter.unregisterWebhook(webhook.url, integration.configuration);
      } catch (error) {
        console.error("Failed to cleanup webhooks:", error);
      }
    }

    this.webhooks.delete(integration.id);
  }

  private recordEvent(
    integrationId: string,
    type:
      | "error"
      | "data_sync"
      | "webhook_received"
      | "api_call"
      | "status_change",
    data: any,
  ): void {
    const event: IntegrationEvent = {
      id: Math.random().toString(36),
      integrationId,
      type,
      data,
      timestamp: Date.now(),
      processed: false,
    };

    this.events.push(event);

    // Keep only last 1000 events
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }
  }

  private recordError(
    integrationId: string,
    type:
      | "authentication"
      | "rate_limit"
      | "network"
      | "validation"
      | "server"
      | "unknown",
    message: string,
  ): void {
    const integration = this.integrations.get(integrationId);
    if (!integration) return;

    const error: IntegrationError = {
      id: Math.random().toString(36),
      timestamp: Date.now(),
      type,
      message,
      resolved: false,
    };

    if (!integration.errors) {
      integration.errors = [];
    }

    integration.errors.push(error);

    // Keep only last 50 errors
    if (integration.errors.length > 50) {
      integration.errors = integration.errors.slice(-50);
    }
  }

  private generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, Array.from(array)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  }

  private async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return btoa(
      String.fromCharCode.apply(null, Array.from(new Uint8Array(digest))),
    )
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  }

  // Public getters
  getIntegrations(): ThirdPartyIntegration[] {
    return Array.from(this.integrations.values());
  }

  getAnalytics() {
    const integrations = Array.from(this.integrations.values());
    const totalIntegrations = integrations.length;
    const activeIntegrations = integrations.filter(
      (i) => i.status === "connected",
    ).length;

    const totalRequests = integrations.reduce(
      (sum, i) => sum + i.usage.totalRequests,
      0,
    );
    const successfulRequests = integrations.reduce(
      (sum, i) => sum + i.usage.successfulRequests,
      0,
    );
    const successRate =
      totalRequests > 0 ? successfulRequests / totalRequests : 0;

    // Top providers
    const providerCounts: Record<string, number> = {};
    integrations.forEach((integration) => {
      providerCounts[integration.provider] =
        (providerCounts[integration.provider] || 0) +
        integration.usage.totalRequests;
    });
    const topProviders = Object.entries(providerCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([provider, requests]) => ({ provider, requests }));

    // Error analysis
    const errorCounts: Record<string, number> = {};
    integrations.forEach((integration) => {
      if (integration.errors) {
        integration.errors.forEach((error) => {
          errorCounts[error.message] = (errorCounts[error.message] || 0) + 1;
        });
      }
    });
    const errorAnalysis = Object.entries(errorCounts).map(([error, count]) => ({
      error,
      count,
    }));

    return {
      totalIntegrations,
      activeIntegrations,
      totalRequests,
      successRate,
      topProviders,
      errorAnalysis,
    };
  }
}

// Integration Adapter Interface
abstract class IntegrationAdapter {
  abstract getName(): string;
  abstract getDescription(): string;
  abstract getCategory(): string;
  abstract getVersion(): string;
  abstract getCapabilities(): IntegrationCapability[];
  abstract testConnection(config: IntegrationConfig): Promise<boolean>;
  abstract call(
    capability: IntegrationCapability,
    data: any,
    config: IntegrationConfig,
  ): Promise<any>;

  supportsOAuth(): boolean {
    return false;
  }
  supportsPKCE(): boolean {
    return false;
  }
  supportsWebhooks(): boolean {
    return false;
  }
  supportsSync(): boolean {
    return false;
  }

  async getOAuthUrl(flow: OAuthFlow): Promise<string> {
    throw new Error("OAuth not supported");
  }
  async exchangeCodeForTokens(
    code: string,
    flow: OAuthFlow,
  ): Promise<OAuthTokens> {
    throw new Error("OAuth not supported");
  }
  async registerWebhook(
    events: string[],
    url: string,
    config: IntegrationConfig,
  ): Promise<void> {
    throw new Error("Webhooks not supported");
  }
  async unregisterWebhook(
    url: string,
    config: IntegrationConfig,
  ): Promise<void> {
    throw new Error("Webhooks not supported");
  }
  async syncData(config: IntegrationConfig): Promise<void> {
    throw new Error("Sync not supported");
  }
  async getData(
    endpoint: string,
    params: any,
    config: IntegrationConfig,
  ): Promise<any> {
    throw new Error("Data retrieval not supported");
  }
  getWebhookEvents(): string[] {
    return [];
  }
}

// Stripe Adapter
class StripeAdapter extends IntegrationAdapter {
  getName(): string {
    return "Stripe";
  }
  getDescription(): string {
    return "Payment processing platform";
  }
  getCategory(): string {
    return "payment";
  }
  getVersion(): string {
    return "v1";
  }

  getCapabilities(): IntegrationCapability[] {
    return [
      {
        name: "create_payment",
        description: "Create a payment intent",
        enabled: true,
        endpoint: "/payment_intents",
        method: "POST",
      },
      {
        name: "create_customer",
        description: "Create a customer",
        enabled: true,
        endpoint: "/customers",
        method: "POST",
      },
    ];
  }

  async testConnection(config: IntegrationConfig): Promise<boolean> {
    try {
      const response = await fetch(`${config.endpoints.api}/balance`, {
        headers: {
          Authorization: `Bearer ${config.authentication.credentials.apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async call(
    capability: IntegrationCapability,
    data: any,
    config: IntegrationConfig,
  ): Promise<any> {
    const response = await fetch(
      `${config.endpoints.api}${capability.endpoint}`,
      {
        method: capability.method,
        headers: {
          Authorization: `Bearer ${config.authentication.credentials.apiKey}`,
          "Content-Type": "application/json",
        },
        body: capability.method === "POST" ? JSON.stringify(data) : undefined,
      },
    );

    if (!response.ok) {
      throw new Error(`Stripe API error: ${response.statusText}`);
    }

    return response.json();
  }
}

// SendGrid Adapter
class SendGridAdapter extends IntegrationAdapter {
  getName(): string {
    return "SendGrid";
  }
  getDescription(): string {
    return "Email delivery platform";
  }
  getCategory(): string {
    return "email";
  }
  getVersion(): string {
    return "v3";
  }

  getCapabilities(): IntegrationCapability[] {
    return [
      {
        name: "send_email",
        description: "Send an email",
        enabled: true,
        endpoint: "/mail/send",
        method: "POST",
      },
    ];
  }

  async testConnection(config: IntegrationConfig): Promise<boolean> {
    try {
      const response = await fetch(`${config.endpoints.api}/user/account`, {
        headers: {
          Authorization: `Bearer ${config.authentication.credentials.apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async call(
    capability: IntegrationCapability,
    data: any,
    config: IntegrationConfig,
  ): Promise<any> {
    const response = await fetch(
      `${config.endpoints.api}${capability.endpoint}`,
      {
        method: capability.method,
        headers: {
          Authorization: `Bearer ${config.authentication.credentials.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
    );

    if (!response.ok) {
      throw new Error(`SendGrid API error: ${response.statusText}`);
    }

    return response.status === 202 ? { success: true } : response.json();
  }
}

// Slack Adapter
class SlackAdapter extends IntegrationAdapter {
  getName(): string {
    return "Slack";
  }
  getDescription(): string {
    return "Team communication platform";
  }
  getCategory(): string {
    return "communication";
  }
  getVersion(): string {
    return "v1";
  }

  getCapabilities(): IntegrationCapability[] {
    return [
      {
        name: "send_message",
        description: "Send a message to a channel",
        enabled: true,
        endpoint: "/chat.postMessage",
        method: "POST",
      },
    ];
  }

  supportsOAuth(): boolean {
    return true;
  }

  async testConnection(config: IntegrationConfig): Promise<boolean> {
    try {
      const response = await fetch(`${config.endpoints.api}/auth.test`, {
        headers: {
          Authorization: `Bearer ${config.authentication.credentials.accessToken}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async call(
    capability: IntegrationCapability,
    data: any,
    config: IntegrationConfig,
  ): Promise<any> {
    const response = await fetch(
      `${config.endpoints.api}${capability.endpoint}`,
      {
        method: capability.method,
        headers: {
          Authorization: `Bearer ${config.authentication.credentials.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          channel: config.settings.channel,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getOAuthUrl(flow: OAuthFlow): Promise<string> {
    const params = new URLSearchParams({
      client_id: "your-slack-client-id",
      scope: flow.scopes.join(" "),
      redirect_uri: flow.redirectUri,
      state: flow.state,
      response_type: "code",
    });

    return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
  }

  async exchangeCodeForTokens(
    code: string,
    flow: OAuthFlow,
  ): Promise<OAuthTokens> {
    const response = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: "your-slack-client-id",
        client_secret: "your-slack-client-secret",
        code,
        redirect_uri: flow.redirectUri,
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error("OAuth exchange failed");
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenType: "Bearer",
      expiresIn: data.expires_in || 43200,
      scope: data.scope,
      receivedAt: Date.now(),
    };
  }
}

// Placeholder adapters for other providers
class PayPalAdapter extends IntegrationAdapter {
  getName(): string {
    return "PayPal";
  }
  getDescription(): string {
    return "Payment processing platform";
  }
  getCategory(): string {
    return "payment";
  }
  getVersion(): string {
    return "v1";
  }
  getCapabilities(): IntegrationCapability[] {
    return [];
  }
  async testConnection(config: IntegrationConfig): Promise<boolean> {
    return false;
  }
  async call(
    capability: IntegrationCapability,
    data: any,
    config: IntegrationConfig,
  ): Promise<any> {
    return {};
  }
}

class MailgunAdapter extends IntegrationAdapter {
  getName(): string {
    return "Mailgun";
  }
  getDescription(): string {
    return "Email delivery platform";
  }
  getCategory(): string {
    return "email";
  }
  getVersion(): string {
    return "v3";
  }
  getCapabilities(): IntegrationCapability[] {
    return [];
  }
  async testConnection(config: IntegrationConfig): Promise<boolean> {
    return false;
  }
  async call(
    capability: IntegrationCapability,
    data: any,
    config: IntegrationConfig,
  ): Promise<any> {
    return {};
  }
}

class GoogleAnalyticsAdapter extends IntegrationAdapter {
  getName(): string {
    return "Google Analytics";
  }
  getDescription(): string {
    return "Web analytics platform";
  }
  getCategory(): string {
    return "analytics";
  }
  getVersion(): string {
    return "v4";
  }
  getCapabilities(): IntegrationCapability[] {
    return [];
  }
  async testConnection(config: IntegrationConfig): Promise<boolean> {
    return false;
  }
  async call(
    capability: IntegrationCapability,
    data: any,
    config: IntegrationConfig,
  ): Promise<any> {
    return {};
  }
}

class MixpanelAdapter extends IntegrationAdapter {
  getName(): string {
    return "Mixpanel";
  }
  getDescription(): string {
    return "Product analytics platform";
  }
  getCategory(): string {
    return "analytics";
  }
  getVersion(): string {
    return "v2.0";
  }
  getCapabilities(): IntegrationCapability[] {
    return [];
  }
  async testConnection(config: IntegrationConfig): Promise<boolean> {
    return false;
  }
  async call(
    capability: IntegrationCapability,
    data: any,
    config: IntegrationConfig,
  ): Promise<any> {
    return {};
  }
}

class S3Adapter extends IntegrationAdapter {
  getName(): string {
    return "AWS S3";
  }
  getDescription(): string {
    return "Object storage service";
  }
  getCategory(): string {
    return "storage";
  }
  getVersion(): string {
    return "v1";
  }
  getCapabilities(): IntegrationCapability[] {
    return [];
  }
  async testConnection(config: IntegrationConfig): Promise<boolean> {
    return false;
  }
  async call(
    capability: IntegrationCapability,
    data: any,
    config: IntegrationConfig,
  ): Promise<any> {
    return {};
  }
}

class GoogleDriveAdapter extends IntegrationAdapter {
  getName(): string {
    return "Google Drive";
  }
  getDescription(): string {
    return "Cloud storage service";
  }
  getCategory(): string {
    return "storage";
  }
  getVersion(): string {
    return "v3";
  }
  getCapabilities(): IntegrationCapability[] {
    return [];
  }
  async testConnection(config: IntegrationConfig): Promise<boolean> {
    return false;
  }
  async call(
    capability: IntegrationCapability,
    data: any,
    config: IntegrationConfig,
  ): Promise<any> {
    return {};
  }
}

class TwitterAdapter extends IntegrationAdapter {
  getName(): string {
    return "Twitter";
  }
  getDescription(): string {
    return "Social media platform";
  }
  getCategory(): string {
    return "social";
  }
  getVersion(): string {
    return "v2";
  }
  getCapabilities(): IntegrationCapability[] {
    return [];
  }
  async testConnection(config: IntegrationConfig): Promise<boolean> {
    return false;
  }
  async call(
    capability: IntegrationCapability,
    data: any,
    config: IntegrationConfig,
  ): Promise<any> {
    return {};
  }
}

class FacebookAdapter extends IntegrationAdapter {
  getName(): string {
    return "Facebook";
  }
  getDescription(): string {
    return "Social media platform";
  }
  getCategory(): string {
    return "social";
  }
  getVersion(): string {
    return "v12.0";
  }
  getCapabilities(): IntegrationCapability[] {
    return [];
  }
  async testConnection(config: IntegrationConfig): Promise<boolean> {
    return false;
  }
  async call(
    capability: IntegrationCapability,
    data: any,
    config: IntegrationConfig,
  ): Promise<any> {
    return {};
  }
}

class SalesforceAdapter extends IntegrationAdapter {
  getName(): string {
    return "Salesforce";
  }
  getDescription(): string {
    return "CRM platform";
  }
  getCategory(): string {
    return "crm";
  }
  getVersion(): string {
    return "v52.0";
  }
  getCapabilities(): IntegrationCapability[] {
    return [];
  }
  async testConnection(config: IntegrationConfig): Promise<boolean> {
    return false;
  }
  async call(
    capability: IntegrationCapability,
    data: any,
    config: IntegrationConfig,
  ): Promise<any> {
    return {};
  }
}

class HubSpotAdapter extends IntegrationAdapter {
  getName(): string {
    return "HubSpot";
  }
  getDescription(): string {
    return "CRM platform";
  }
  getCategory(): string {
    return "crm";
  }
  getVersion(): string {
    return "v3";
  }
  getCapabilities(): IntegrationCapability[] {
    return [];
  }
  async testConnection(config: IntegrationConfig): Promise<boolean> {
    return false;
  }
  async call(
    capability: IntegrationCapability,
    data: any,
    config: IntegrationConfig,
  ): Promise<any> {
    return {};
  }
}

class DiscordAdapter extends IntegrationAdapter {
  getName(): string {
    return "Discord";
  }
  getDescription(): string {
    return "Communication platform";
  }
  getCategory(): string {
    return "communication";
  }
  getVersion(): string {
    return "v10";
  }
  getCapabilities(): IntegrationCapability[] {
    return [];
  }
  async testConnection(config: IntegrationConfig): Promise<boolean> {
    return false;
  }
  async call(
    capability: IntegrationCapability,
    data: any,
    config: IntegrationConfig,
  ): Promise<any> {
    return {};
  }
}

class GoogleWorkspaceAdapter extends IntegrationAdapter {
  getName(): string {
    return "Google Workspace";
  }
  getDescription(): string {
    return "Productivity suite";
  }
  getCategory(): string {
    return "productivity";
  }
  getVersion(): string {
    return "v1";
  }
  getCapabilities(): IntegrationCapability[] {
    return [];
  }
  async testConnection(config: IntegrationConfig): Promise<boolean> {
    return false;
  }
  async call(
    capability: IntegrationCapability,
    data: any,
    config: IntegrationConfig,
  ): Promise<any> {
    return {};
  }
}

class Microsoft365Adapter extends IntegrationAdapter {
  getName(): string {
    return "Microsoft 365";
  }
  getDescription(): string {
    return "Productivity suite";
  }
  getCategory(): string {
    return "productivity";
  }
  getVersion(): string {
    return "v1.0";
  }
  getCapabilities(): IntegrationCapability[] {
    return [];
  }
  async testConnection(config: IntegrationConfig): Promise<boolean> {
    return false;
  }
  async call(
    capability: IntegrationCapability,
    data: any,
    config: IntegrationConfig,
  ): Promise<any> {
    return {};
  }
}

// Webhook Handler
class WebhookHandler {
  constructor(
    private integrationId: string,
    public events: string[],
    public url: string,
  ) {}

  async handle(event: string, data: any): Promise<void> {
    // Process webhook event
    console.log(`Webhook received for ${this.integrationId}: ${event}`, data);
  }
}

// Sync Scheduler
class SyncScheduler {
  private scheduledIntegrations: Map<string, NodeJS.Timeout> = new Map();

  scheduleSync(integration: ThirdPartyIntegration): void {
    // Schedule periodic sync (every hour)
    const interval = setInterval(
      async () => {
        // Sync logic would be here
        console.log(`Syncing ${integration.name}`);
      },
      60 * 60 * 1000,
    );

    this.scheduledIntegrations.set(integration.id, interval);
  }

  unscheduleSync(integrationId: string): void {
    const interval = this.scheduledIntegrations.get(integrationId);
    if (interval) {
      clearInterval(interval);
      this.scheduledIntegrations.delete(integrationId);
    }
  }
}

// Main Third Party Integrations Component
// @ts-ignore
export const ThirdPartyIntegrations: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { currentMode } = useUserExperienceMode();
  const { isLowPerformanceMode } = usePerformance();
  const { user } = useAuthStore();

  const [integrations, setIntegrations] = useState<ThirdPartyIntegration[]>([]);
  const [oauthFlows, setOAuthFlows] = useState<OAuthFlow[]>([]);

  const engineRef = useRef<ThirdPartyIntegrationEngine>();

  // Initialize engine
  useEffect(() => {
    engineRef.current = new ThirdPartyIntegrationEngine();
    loadData();

    return () => {
      // Cleanup
    };
  }, []);

  const loadData = useCallback(() => {
    if (!engineRef.current) return;

    setIntegrations(engineRef.current.getIntegrations());
  }, []);

  const connectIntegration = useCallback(
    async (
      provider: string,
      config: IntegrationConfig,
    ): Promise<ThirdPartyIntegration> => {
      if (!engineRef.current) {
        throw new Error("Integration engine not initialized");
      }

      const integration = await engineRef.current.connectIntegration(
        provider,
        config,
      );
      setIntegrations((prev) => [...prev, integration]);
      return integration;
    },
    [],
  );

  const disconnectIntegration = useCallback(
    async (integrationId: string): Promise<void> => {
      if (!engineRef.current) return;

      await engineRef.current.disconnectIntegration(integrationId);
      setIntegrations((prev) =>
        prev.filter((integration) => integration.id !== integrationId),
      );
    },
    [],
  );

  const updateIntegration = useCallback(
    async (
      integrationId: string,
      updates: Partial<ThirdPartyIntegration>,
    ): Promise<void> => {
      if (!engineRef.current) return;

      await engineRef.current.updateIntegration(integrationId, updates);
      setIntegrations((prev) =>
        prev.map((integration) =>
          integration.id === integrationId
            ? { ...integration, ...updates }
            : integration,
        ),
      );
    },
    [],
  );

  const testIntegration = useCallback(
    async (integrationId: string): Promise<boolean> => {
      if (!engineRef.current) return false;

      const result = await engineRef.current.testIntegration(integrationId);
      loadData();
      return result;
    },
    [loadData],
  );

  const initiateOAuth = useCallback(
    async (integrationId: string, scopes: string[]): Promise<OAuthFlow> => {
      if (!engineRef.current) {
        throw new Error("Integration engine not initialized");
      }

      const flow = await engineRef.current.initiateOAuth(integrationId, scopes);
      setOAuthFlows((prev) => [...prev, flow]);
      return flow;
    },
    [],
  );

  const completeOAuth = useCallback(
    async (flowId: string, code: string): Promise<OAuthTokens> => {
      if (!engineRef.current) {
        throw new Error("Integration engine not initialized");
      }

      const tokens = await engineRef.current.completeOAuth(flowId, code);
      setOAuthFlows((prev) =>
        prev.map((flow) =>
          flow.id === flowId
            ? {
                ...flow,
                status: "completed" as const,
                completedAt: Date.now(),
                tokens,
              }
            : flow,
        ),
      );
      loadData();
      return tokens;
    },
    [loadData],
  );

  const callIntegration = useCallback(
    async (
      integrationId: string,
      capability: string,
      data?: any,
    ): Promise<any> => {
      if (!engineRef.current) {
        throw new Error("Integration engine not initialized");
      }

      const result = await engineRef.current.callIntegration(
        integrationId,
        capability,
        data,
      );
      loadData();
      return result;
    },
    [loadData],
  );

  const registerWebhook = useCallback(
    async (
      integrationId: string,
      events: string[],
      url: string,
    ): Promise<void> => {
      if (!engineRef.current) return;

      await engineRef.current.registerWebhook(integrationId, events, url);
    },
    [],
  );

  const handleWebhook = useCallback(
    async (integrationId: string, event: string, data: any): Promise<void> => {
      if (!engineRef.current) return;

      await engineRef.current.handleWebhook(integrationId, event, data);
    },
    [],
  );

  const syncData = useCallback(
    async (integrationId: string): Promise<void> => {
      if (!engineRef.current) return;

      await engineRef.current.syncData(integrationId);
      loadData();
    },
    [loadData],
  );

  const getData = useCallback(
    async (
      integrationId: string,
      endpoint: string,
      params?: any,
    ): Promise<any> => {
      if (!engineRef.current) {
        throw new Error("Integration engine not initialized");
      }

      return await engineRef.current.getData(integrationId, endpoint, params);
    },
    [],
  );

  const getAnalytics = useCallback(() => {
    if (!engineRef.current) {
      return {
        totalIntegrations: 0,
        activeIntegrations: 0,
        totalRequests: 0,
        successRate: 0,
        topProviders: [],
        errorAnalysis: [],
      };
    }

    return engineRef.current.getAnalytics();
  }, []);

  const contextValue: IntegrationContextType = {
    integrations,
    connectIntegration,
    disconnectIntegration,
    updateIntegration,
    testIntegration,
    initiateOAuth,
    completeOAuth,
    callIntegration,
    registerWebhook,
    handleWebhook,
    syncData,
    getData,
    getAnalytics,
  };

  return (
    <IntegrationContext.Provider value={contextValue}>
      {children}
    </IntegrationContext.Provider>
  );
};

// Hooks
export const useThirdPartyIntegrations = (): IntegrationContextType => {
  const context = React.useContext(IntegrationContext);
  if (!context) {
    throw new Error(
      "useThirdPartyIntegrations must be used within ThirdPartyIntegrations",
    );
  }
  return context;
};

// Higher-Order Components
export const withThirdPartyIntegrations = <P extends object>(
  Component: React.ComponentType<P>,
) => {
  const WithThirdPartyIntegrationsComponent = (props: P) => (
    <ThirdPartyIntegrations>
      <Component {...props} />
    </ThirdPartyIntegrations>
  );
  WithThirdPartyIntegrationsComponent.displayName = `withThirdPartyIntegrations(${Component.displayName || Component.name})`;
  return WithThirdPartyIntegrationsComponent;
};

// Utility Components
export { IntegrationContext };
export default ThirdPartyIntegrations;
