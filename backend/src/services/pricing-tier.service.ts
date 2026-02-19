/**
 * Pricing Tier Enforcement Service
 * Manages Starter → Pro → Business → Enterprise tier logic with usage tracking and upgrade triggers
 */

import { prisma } from '../utils/prisma.js';
import logger from '../utils/logger.js';
import { EventBus } from '../events/event-bus.js';
import { CacheManager } from '../cache/cache-manager.js';

// Pricing tiers
export type PricingTier = 'trial' | 'starter' | 'pro' | 'business' | 'enterprise';

// Feature names
export type FeatureName =
  | 'ai_categorization'
  | 'ai_copilot_queries'
  | 'cash_flow_forecast'
  | 'anomaly_detection'
  | 'multi_entity'
  | 'team_members'
  | 'transactions_per_month'
  | 'invoices_per_month'
  | 'reports'
  | 'automations'
  | 'api_access'
  | 'custom_integrations'
  | 'priority_support'
  | 'dedicated_account_manager'
  | 'custom_ai_training'
  | 'white_label'
  | 'soc2_compliance'
  | 'audit_trail';

// Tier configuration
export interface TierConfig {
  tier: PricingTier;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  features: TierFeature[];
  limits: TierLimits;
  description: string;
}

export interface TierFeature {
  name: FeatureName;
  enabled: boolean;
  limit?: number;
  description: string;
}

export interface TierLimits {
  entities: number;
  teamMembers: number;
  transactionsPerMonth: number;
  invoicesPerMonth: number;
  aiCopilotQueries: number;
  automations: number;
  storageGB: number;
}

// Usage tracking
export interface UsageMetrics {
  userId: number;
  companyId: string;
  period: string; // YYYY-MM format
  entities: number;
  teamMembers: number;
  transactions: number;
  invoices: number;
  aiQueries: number;
  automations: number;
  storageUsedMB: number;
  lastUpdated: Date;
}

// Upgrade trigger
export interface UpgradeTrigger {
  type: 'limit_reached' | 'feature_needed' | 'usage_pattern' | 'time_based';
  currentTier: PricingTier;
  suggestedTier: PricingTier;
  reason: string;
  urgency: 'low' | 'medium' | 'high';
  potentialSavings?: number;
  featureUnlocked?: string[];
}

// Feature access result
export interface FeatureAccessResult {
  allowed: boolean;
  reason?: string;
  currentUsage?: number;
  limit?: number;
  upgradeRequired?: PricingTier;
  message?: string;
}

export class PricingTierService {
  private static instance: PricingTierService;
  private eventBus: EventBus;
  private cache: CacheManager;
  private tierConfigs: Map<PricingTier, TierConfig>;

  private constructor() {
    this.eventBus = new EventBus();
    this.cache = new CacheManager();
    this.tierConfigs = this.initializeTierConfigs();
    logger.info('Pricing Tier Service initialized');
  }

  static getInstance(): PricingTierService {
    if (!PricingTierService.instance) {
      PricingTierService.instance = new PricingTierService();
    }
    return PricingTierService.instance;
  }

  private initializeTierConfigs(): Map<PricingTier, TierConfig> {
    const configs = new Map<PricingTier, TierConfig>();

    // Trial tier
    configs.set('trial', {
      tier: 'trial',
      name: 'Free Trial',
      monthlyPrice: 0,
      annualPrice: 0,
      description: '14-day free trial with full Pro features',
      limits: {
        entities: 1,
        teamMembers: 2,
        transactionsPerMonth: 500,
        invoicesPerMonth: 20,
        aiCopilotQueries: 50,
        automations: 3,
        storageGB: 1,
      },
      features: [
        { name: 'ai_categorization', enabled: true, description: 'AI-powered transaction categorization' },
        { name: 'ai_copilot_queries', enabled: true, limit: 50, description: 'AI CFO Copilot queries' },
        { name: 'cash_flow_forecast', enabled: true, description: '30-day cash flow forecasting' },
        { name: 'anomaly_detection', enabled: true, description: 'Automatic anomaly detection' },
        { name: 'multi_entity', enabled: false, description: 'Multi-entity accounting' },
        { name: 'reports', enabled: true, description: 'Financial reports' },
        { name: 'automations', enabled: true, limit: 3, description: 'Automation workflows' },
        { name: 'api_access', enabled: false, description: 'API access' },
        { name: 'priority_support', enabled: false, description: 'Priority support' },
      ],
    });

    // Starter tier - $29/month
    configs.set('starter', {
      tier: 'starter',
      name: 'Starter',
      monthlyPrice: 29,
      annualPrice: 290,
      description: 'Perfect for solopreneurs and freelancers',
      limits: {
        entities: 1,
        teamMembers: 1,
        transactionsPerMonth: 500,
        invoicesPerMonth: 50,
        aiCopilotQueries: 100,
        automations: 5,
        storageGB: 5,
      },
      features: [
        { name: 'ai_categorization', enabled: true, description: 'AI-powered transaction categorization' },
        { name: 'ai_copilot_queries', enabled: true, limit: 100, description: 'AI CFO Copilot queries' },
        { name: 'cash_flow_forecast', enabled: true, description: '30-day cash flow forecasting' },
        { name: 'anomaly_detection', enabled: true, description: 'Automatic anomaly detection' },
        { name: 'multi_entity', enabled: false, description: 'Multi-entity accounting' },
        { name: 'team_members', enabled: false, description: 'Team collaboration' },
        { name: 'reports', enabled: true, description: 'Basic financial reports' },
        { name: 'automations', enabled: true, limit: 5, description: 'Automation workflows' },
        { name: 'api_access', enabled: false, description: 'API access' },
        { name: 'priority_support', enabled: false, description: 'Priority support' },
        { name: 'audit_trail', enabled: true, description: 'Basic audit trail' },
      ],
    });

    // Pro tier - $99/month
    configs.set('pro', {
      tier: 'pro',
      name: 'Pro',
      monthlyPrice: 99,
      annualPrice: 990,
      description: 'For growing small businesses',
      limits: {
        entities: 3,
        teamMembers: 5,
        transactionsPerMonth: 2000,
        invoicesPerMonth: 200,
        aiCopilotQueries: 500,
        automations: 20,
        storageGB: 25,
      },
      features: [
        { name: 'ai_categorization', enabled: true, description: 'AI-powered transaction categorization' },
        { name: 'ai_copilot_queries', enabled: true, limit: 500, description: 'AI CFO Copilot queries' },
        { name: 'cash_flow_forecast', enabled: true, description: '30-day cash flow forecasting' },
        { name: 'anomaly_detection', enabled: true, description: 'Automatic anomaly detection' },
        { name: 'multi_entity', enabled: true, limit: 3, description: 'Up to 3 entities' },
        { name: 'team_members', enabled: true, limit: 5, description: 'Up to 5 team members' },
        { name: 'reports', enabled: true, description: 'Advanced financial reports' },
        { name: 'automations', enabled: true, limit: 20, description: 'Automation workflows' },
        { name: 'api_access', enabled: true, description: 'API access' },
        { name: 'priority_support', enabled: false, description: 'Priority support' },
        { name: 'audit_trail', enabled: true, description: 'Full audit trail' },
        { name: 'custom_integrations', enabled: false, description: 'Custom integrations' },
      ],
    });

    // Business tier - $299/month
    configs.set('business', {
      tier: 'business',
      name: 'Business',
      monthlyPrice: 299,
      annualPrice: 2990,
      description: 'For established businesses with complex needs',
      limits: {
        entities: 10,
        teamMembers: 25,
        transactionsPerMonth: 10000,
        invoicesPerMonth: 1000,
        aiCopilotQueries: 2000,
        automations: 100,
        storageGB: 100,
      },
      features: [
        { name: 'ai_categorization', enabled: true, description: 'AI-powered transaction categorization' },
        { name: 'ai_copilot_queries', enabled: true, limit: 2000, description: 'AI CFO Copilot queries' },
        { name: 'cash_flow_forecast', enabled: true, description: 'Advanced cash flow forecasting' },
        { name: 'anomaly_detection', enabled: true, description: 'Advanced anomaly detection' },
        { name: 'multi_entity', enabled: true, limit: 10, description: 'Up to 10 entities' },
        { name: 'team_members', enabled: true, limit: 25, description: 'Up to 25 team members' },
        { name: 'reports', enabled: true, description: 'Custom financial reports' },
        { name: 'automations', enabled: true, limit: 100, description: 'Unlimited automations' },
        { name: 'api_access', enabled: true, description: 'Full API access' },
        { name: 'priority_support', enabled: true, description: 'Priority support' },
        { name: 'audit_trail', enabled: true, description: 'Enterprise audit trail' },
        { name: 'custom_integrations', enabled: true, description: 'Custom integrations' },
        { name: 'soc2_compliance', enabled: true, description: 'SOC 2 compliance' },
      ],
    });

    // Enterprise tier - Custom pricing
    configs.set('enterprise', {
      tier: 'enterprise',
      name: 'Enterprise',
      monthlyPrice: 999, // Starting price
      annualPrice: 9990,
      description: 'For large organizations with enterprise requirements',
      limits: {
        entities: -1, // Unlimited
        teamMembers: -1,
        transactionsPerMonth: -1,
        invoicesPerMonth: -1,
        aiCopilotQueries: -1,
        automations: -1,
        storageGB: -1,
      },
      features: [
        { name: 'ai_categorization', enabled: true, description: 'AI-powered transaction categorization' },
        { name: 'ai_copilot_queries', enabled: true, description: 'Unlimited AI CFO Copilot queries' },
        { name: 'cash_flow_forecast', enabled: true, description: 'Enterprise cash flow forecasting' },
        { name: 'anomaly_detection', enabled: true, description: 'Enterprise anomaly detection' },
        { name: 'multi_entity', enabled: true, description: 'Unlimited entities' },
        { name: 'team_members', enabled: true, description: 'Unlimited team members' },
        { name: 'reports', enabled: true, description: 'Custom enterprise reports' },
        { name: 'automations', enabled: true, description: 'Unlimited automations' },
        { name: 'api_access', enabled: true, description: 'Enterprise API access' },
        { name: 'priority_support', enabled: true, description: '24/7 priority support' },
        { name: 'dedicated_account_manager', enabled: true, description: 'Dedicated account manager' },
        { name: 'custom_ai_training', enabled: true, description: 'Custom AI model training' },
        { name: 'white_label', enabled: true, description: 'White-label options' },
        { name: 'audit_trail', enabled: true, description: 'Enterprise audit trail' },
        { name: 'custom_integrations', enabled: true, description: 'Custom integrations' },
        { name: 'soc2_compliance', enabled: true, description: 'SOC 2 Type II compliance' },
      ],
    });

    return configs;
  }

  /**
   * Get user's current tier
   */
  async getUserTier(userId: number): Promise<PricingTier> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { planType: true },
    });

    return (user?.planType as PricingTier) || 'trial';
  }

  /**
   * Get tier configuration
   */
  getTierConfig(tier: PricingTier): TierConfig | undefined {
    return this.tierConfigs.get(tier);
  }

  /**
   * Get all tier configurations
   */
  getAllTierConfigs(): TierConfig[] {
    return Array.from(this.tierConfigs.values());
  }

  /**
   * Check if user has access to a feature
   */
  async checkFeatureAccess(
    userId: number,
    featureName: FeatureName
  ): Promise<FeatureAccessResult> {
    const tier = await this.getUserTier(userId);
    const config = this.tierConfigs.get(tier);

    if (!config) {
      return { allowed: false, reason: 'Invalid tier configuration' };
    }

    const feature = config.features.find(f => f.name === featureName);

    if (!feature) {
      return { allowed: false, reason: 'Feature not found' };
    }

    if (!feature.enabled) {
      const upgradeTier = this.findTierWithFeature(featureName);
      return {
        allowed: false,
        reason: `This feature requires ${upgradeTier} plan or higher`,
        upgradeRequired: upgradeTier,
        message: `Upgrade to ${upgradeTier} to unlock ${feature.description}`,
      };
    }

    // Check usage limits if applicable
    if (feature.limit !== undefined) {
      const usage = await this.getFeatureUsage(userId, featureName);
      
      if (usage >= feature.limit) {
        const upgradeTier = this.findNextTierWithHigherLimit(tier, featureName);
        return {
          allowed: false,
          reason: 'Usage limit reached',
          currentUsage: usage,
          limit: feature.limit,
          upgradeRequired: upgradeTier,
          message: `You've reached your ${featureName} limit. Upgrade to get more.`,
        };
      }

      return {
        allowed: true,
        currentUsage: usage,
        limit: feature.limit,
      };
    }

    return { allowed: true };
  }

  /**
   * Check if user is within tier limits
   */
  async checkTierLimits(userId: number, companyId: string): Promise<{
    withinLimits: boolean;
    violations: Array<{ limit: string; current: number; max: number }>;
    warnings: Array<{ limit: string; current: number; max: number; percentUsed: number }>;
  }> {
    const tier = await this.getUserTier(userId);
    const config = this.tierConfigs.get(tier);
    const usage = await this.getUsageMetrics(userId, companyId);

    const violations: Array<{ limit: string; current: number; max: number }> = [];
    const warnings: Array<{ limit: string; current: number; max: number; percentUsed: number }> = [];

    if (!config) {
      return { withinLimits: false, violations: [], warnings: [] };
    }

    const limits = config.limits;

    // Check each limit
    const checks = [
      { name: 'entities', current: usage.entities, max: limits.entities },
      { name: 'teamMembers', current: usage.teamMembers, max: limits.teamMembers },
      { name: 'transactions', current: usage.transactions, max: limits.transactionsPerMonth },
      { name: 'invoices', current: usage.invoices, max: limits.invoicesPerMonth },
      { name: 'aiQueries', current: usage.aiQueries, max: limits.aiCopilotQueries },
      { name: 'automations', current: usage.automations, max: limits.automations },
    ];

    for (const check of checks) {
      if (check.max === -1) continue; // Unlimited

      const percentUsed = (check.current / check.max) * 100;

      if (check.current > check.max) {
        violations.push({ limit: check.name, current: check.current, max: check.max });
      } else if (percentUsed >= 80) {
        warnings.push({ limit: check.name, current: check.current, max: check.max, percentUsed });
      }
    }

    return {
      withinLimits: violations.length === 0,
      violations,
      warnings,
    };
  }

  /**
   * Get usage metrics for a user
   */
  async getUsageMetrics(userId: number, companyId: string): Promise<UsageMetrics> {
    const cacheKey = `usage:${userId}:${companyId}`;
    const cached = await this.cache.get<UsageMetrics>(cacheKey);
    if (cached) {
      return cached;
    }

    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Count entities
    const entities = await prisma.company.count({
      where: {
        members: {
          some: { userId },
        },
      },
    });

    // Count team members
    const teamMembers = await prisma.companyMember.count({
      where: { companyId },
    });

    // Count transactions this month
    const transactions = await prisma.transaction.count({
      where: {
        companyId,
        createdAt: { gte: monthStart },
      },
    });

    // Count invoices this month
    const invoices = await prisma.invoice.count({
      where: {
        companyId,
        createdAt: { gte: monthStart },
      },
    });

    // Count AI queries (from activity log)
    const aiQueries = await prisma.activity.count({
      where: {
        userId: userId.toString(),
        type: 'ai_query',
        timestamp: { gte: monthStart },
      },
    });

    // Count automations
    const automations = await prisma.activity.count({
      where: {
        userId: userId.toString(),
        type: 'automation',
        action: 'created',
      },
    });

    const usage: UsageMetrics = {
      userId,
      companyId,
      period,
      entities,
      teamMembers,
      transactions,
      invoices,
      aiQueries,
      automations,
      storageUsedMB: 0, // Would be calculated from actual storage
      lastUpdated: now,
    };

    // Cache for 5 minutes
    await this.cache.set(cacheKey, usage, { ttl: 300 });

    return usage;
  }

  /**
   * Track feature usage
   */
  async trackFeatureUsage(userId: number, featureName: FeatureName): Promise<void> {
    await prisma.activity.create({
      data: {
        type: 'feature_usage',
        action: featureName,
        userId: userId.toString(),
        userName: '',
        description: `Used feature: ${featureName}`,
        metadata: {
          featureName,
          timestamp: new Date().toISOString(),
        },
      },
    });

    // Invalidate usage cache
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { currentCompanyId: true },
    });

    if (user?.currentCompanyId) {
      await this.cache.delete(`usage:${userId}:${user.currentCompanyId}`);
    }
  }

  /**
   * Get feature usage count
   */
  private async getFeatureUsage(userId: number, featureName: FeatureName): Promise<number> {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    return prisma.activity.count({
      where: {
        userId: userId.toString(),
        type: 'feature_usage',
        action: featureName,
        timestamp: { gte: monthStart },
      },
    });
  }

  /**
   * Check for upgrade triggers
   */
  async checkUpgradeTriggers(userId: number, companyId: string): Promise<UpgradeTrigger[]> {
    const triggers: UpgradeTrigger[] = [];
    const tier = await this.getUserTier(userId);
    const usage = await this.getUsageMetrics(userId, companyId);
    const config = this.tierConfigs.get(tier);

    if (!config || tier === 'enterprise') {
      return triggers;
    }

    const limits = config.limits;

    // Check for limit-based triggers
    if (limits.transactionsPerMonth !== -1 && usage.transactions >= limits.transactionsPerMonth * 0.9) {
      triggers.push({
        type: 'limit_reached',
        currentTier: tier,
        suggestedTier: this.getNextTier(tier),
        reason: 'Approaching transaction limit',
        urgency: usage.transactions >= limits.transactionsPerMonth ? 'high' : 'medium',
      });
    }

    if (limits.aiCopilotQueries !== -1 && usage.aiQueries >= limits.aiCopilotQueries * 0.9) {
      triggers.push({
        type: 'limit_reached',
        currentTier: tier,
        suggestedTier: this.getNextTier(tier),
        reason: 'Approaching AI query limit',
        urgency: usage.aiQueries >= limits.aiCopilotQueries ? 'high' : 'medium',
      });
    }

    if (limits.entities !== -1 && usage.entities >= limits.entities) {
      triggers.push({
        type: 'limit_reached',
        currentTier: tier,
        suggestedTier: this.getNextTier(tier),
        reason: 'Entity limit reached',
        urgency: 'high',
        featureUnlocked: ['multi_entity'],
      });
    }

    // Check for feature-based triggers
    if (tier === 'starter' && usage.teamMembers > 1) {
      triggers.push({
        type: 'feature_needed',
        currentTier: tier,
        suggestedTier: 'pro',
        reason: 'Team collaboration features needed',
        urgency: 'medium',
        featureUnlocked: ['team_members', 'multi_entity'],
      });
    }

    // Usage pattern triggers
    if (usage.transactions > 1000 && tier === 'starter') {
      triggers.push({
        type: 'usage_pattern',
        currentTier: tier,
        suggestedTier: 'pro',
        reason: 'High transaction volume suggests business growth',
        urgency: 'low',
        potentialSavings: 0,
      });
    }

    return triggers;
  }

  /**
   * Upgrade user to a new tier
   */
  async upgradeTier(
    userId: number,
    newTier: PricingTier,
    subscriptionId?: string
  ): Promise<void> {
    const currentTier = await this.getUserTier(userId);

    await prisma.user.update({
      where: { id: userId },
      data: {
        planType: newTier,
        subscriptionStatus: 'active',
        subscriptionId,
      },
    });

    // Log the upgrade
    await prisma.activity.create({
      data: {
        type: 'subscription',
        action: 'upgraded',
        userId: userId.toString(),
        userName: '',
        description: `Upgraded from ${currentTier} to ${newTier}`,
        metadata: {
          previousTier: currentTier,
          newTier,
          timestamp: new Date().toISOString(),
        },
      },
    });

    logger.info('User tier upgraded', { userId, from: currentTier, to: newTier });

    this.eventBus.emit('tier.upgraded', { userId, from: currentTier, to: newTier });
  }

  /**
   * Downgrade user to a lower tier
   */
  async downgradeTier(userId: number, newTier: PricingTier): Promise<{
    success: boolean;
    warnings: string[];
  }> {
    const currentTier = await this.getUserTier(userId);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { currentCompanyId: true },
    });

    if (!user?.currentCompanyId) {
      return { success: false, warnings: ['No company associated with user'] };
    }

    const usage = await this.getUsageMetrics(userId, user.currentCompanyId);
    const newConfig = this.tierConfigs.get(newTier);
    const warnings: string[] = [];

    if (!newConfig) {
      return { success: false, warnings: ['Invalid tier'] };
    }

    // Check if current usage exceeds new tier limits
    if (newConfig.limits.entities !== -1 && usage.entities > newConfig.limits.entities) {
      warnings.push(`You have ${usage.entities} entities but ${newTier} allows only ${newConfig.limits.entities}`);
    }

    if (newConfig.limits.teamMembers !== -1 && usage.teamMembers > newConfig.limits.teamMembers) {
      warnings.push(`You have ${usage.teamMembers} team members but ${newTier} allows only ${newConfig.limits.teamMembers}`);
    }

    if (warnings.length > 0) {
      return { success: false, warnings };
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        planType: newTier,
      },
    });

    logger.info('User tier downgraded', { userId, from: currentTier, to: newTier });

    this.eventBus.emit('tier.downgraded', { userId, from: currentTier, to: newTier });

    return { success: true, warnings: [] };
  }

  // Helper methods
  private findTierWithFeature(featureName: FeatureName): PricingTier {
    const tiers: PricingTier[] = ['starter', 'pro', 'business', 'enterprise'];
    
    for (const tier of tiers) {
      const config = this.tierConfigs.get(tier);
      const feature = config?.features.find(f => f.name === featureName);
      if (feature?.enabled) {
        return tier;
      }
    }
    
    return 'enterprise';
  }

  private findNextTierWithHigherLimit(currentTier: PricingTier, featureName: FeatureName): PricingTier {
    const tiers: PricingTier[] = ['starter', 'pro', 'business', 'enterprise'];
    const currentIndex = tiers.indexOf(currentTier);
    const currentConfig = this.tierConfigs.get(currentTier);
    const currentFeature = currentConfig?.features.find(f => f.name === featureName);
    const currentLimit = currentFeature?.limit || 0;

    for (let i = currentIndex + 1; i < tiers.length; i++) {
      const config = this.tierConfigs.get(tiers[i]);
      const feature = config?.features.find(f => f.name === featureName);
      
      if (feature?.enabled && (feature.limit === undefined || feature.limit > currentLimit)) {
        return tiers[i];
      }
    }

    return 'enterprise';
  }

  private getNextTier(currentTier: PricingTier): PricingTier {
    const tiers: PricingTier[] = ['trial', 'starter', 'pro', 'business', 'enterprise'];
    const currentIndex = tiers.indexOf(currentTier);
    
    if (currentIndex < tiers.length - 1) {
      return tiers[currentIndex + 1];
    }
    
    return 'enterprise';
  }

  /**
   * Get comparison between tiers
   */
  getTierComparison(tier1: PricingTier, tier2: PricingTier): {
    additionalFeatures: string[];
    increasedLimits: Array<{ name: string; from: number; to: number }>;
    priceDifference: number;
  } {
    const config1 = this.tierConfigs.get(tier1);
    const config2 = this.tierConfigs.get(tier2);

    if (!config1 || !config2) {
      return { additionalFeatures: [], increasedLimits: [], priceDifference: 0 };
    }

    const additionalFeatures: string[] = [];
    const increasedLimits: Array<{ name: string; from: number; to: number }> = [];

    // Find additional features
    for (const feature of config2.features) {
      const feature1 = config1.features.find(f => f.name === feature.name);
      
      if (feature.enabled && (!feature1 || !feature1.enabled)) {
        additionalFeatures.push(feature.description);
      }
    }

    // Find increased limits
    const limitKeys = Object.keys(config1.limits) as Array<keyof TierLimits>;
    for (const key of limitKeys) {
      const from = config1.limits[key];
      const to = config2.limits[key];
      
      if (to > from || (to === -1 && from !== -1)) {
        increasedLimits.push({
          name: key,
          from,
          to: to === -1 ? Infinity : to,
        });
      }
    }

    return {
      additionalFeatures,
      increasedLimits,
      priceDifference: config2.monthlyPrice - config1.monthlyPrice,
    };
  }

  /**
   * Alias for checkUpgradeTriggers - expected by routes
   */
  async getUpgradeTriggers(userId: number, companyId: string): Promise<any> {
    return this.checkUpgradeTriggers(userId, companyId);
  }
}

// Export singleton
export const pricingTierService = PricingTierService.getInstance();
