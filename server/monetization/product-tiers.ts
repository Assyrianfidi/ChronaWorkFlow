// CRITICAL: Product Tiers and Packaging Configuration
// MANDATORY: Enforceable product packaging with runtime entitlement validation

import { logger } from '../utils/structured-logger.js';
import { getImmutableAuditLogger } from '../compliance/immutable-audit-log.js';
import { governanceModelManager } from '../governance/governance-model.js';
import * as crypto from 'crypto';

export type ProductTier = 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE';
export type FeatureCategory = 'CORE' | 'COMPLIANCE' | 'SECURITY' | 'GOVERNANCE' | 'INTEGRATION' | 'ANALYTICS' | 'SUPPORT';
export type FeatureType = 'BOOLEAN' | 'LIMITED' | 'TIERED' | 'ENTERPRISE_ONLY';
export type EnforcementLevel = 'SOFT' | 'HARD' | 'COMPLIANCE';

export interface FeatureDefinition {
  id: string;
  name: string;
  description: string;
  category: FeatureCategory;
  type: FeatureType;
  enforcementLevel: EnforcementLevel;
  complianceRequired?: string[];
  dependencies?: string[];
  limits?: {
    [key: string]: {
      [tier in ProductTier]: number | string | boolean;
    };
  };
  pricing?: {
    included: boolean;
    unitPrice?: number;
    unit?: string;
    overageRate?: number;
  };
  metadata: {
    displayName: string;
    documentation: string;
    apiReference: string;
    deprecationWarning?: string;
  };
}

export interface ProductTierDefinition {
  tier: ProductTier;
  name: string;
  description: string;
  targetMarket: string;
  pricing: {
    monthly: number;
    annual: number;
    setupFee?: number;
    minimumCommitment?: number;
  };
  limits: {
    users: number;
    companies: number;
    transactions: number; // per month
    storage: number; // GB
    apiCalls: number; // per day
    customReports: number;
    integrations: number;
    supportLevel: 'COMMUNITY' | 'EMAIL' | 'PRIORITY' | 'DEDICATED';
    slaGuarantee: number; // percentage
  };
  features: {
    included: string[];
    excluded: string[];
    enterpriseOnly: string[];
  };
  compliance: {
    frameworks: string[];
    auditLogs: boolean;
    dataRetention: number; // days
    encryptionAtRest: boolean;
    encryptionInTransit: boolean;
    soc2: boolean;
    iso27001: boolean;
    gdpr: boolean;
    hipaa: boolean;
    sox: boolean;
  };
  upgradePaths: ProductTier[];
  downgradePaths: ProductTier[];
  trialDays: number;
  cancellationPolicy: string;
  refundPolicy: string;
}

export interface TierTransition {
  fromTier: ProductTier;
  toTier: ProductTier;
  type: 'UPGRADE' | 'DOWNGRADE';
  effectiveDate: Date;
  billingAdjustment: {
    proratedCredit?: number;
    proratedCharge?: number;
    newMonthlyRate: number;
  };
  dataImplications: {
    dataRetention: number;
    featureLoss: string[];
    migrationRequired: boolean;
    backupAvailable: boolean;
  };
  complianceImpact: {
    frameworkLoss: string[];
    auditTrailImpact: boolean;
    dataResidency: boolean;
    encryptionImpact: boolean;
  };
  safetyChecks: {
    confirmationRequired: boolean;
    adminApproval: boolean;
    complianceReview: boolean;
    dataBackup: boolean;
  };
}

/**
 * CRITICAL: Product Tiers Manager
 * 
 * Manages product tier definitions, feature mappings, and tier transitions.
 * Enforces runtime entitlement validation and safety guarantees.
 */
export class ProductTiersManager {
  private static instance: ProductTiersManager;
  private auditLogger: any;
  private tiers: Map<ProductTier, ProductTierDefinition> = new Map();
  private features: Map<string, FeatureDefinition> = new Map();
  private transitions: Map<string, TierTransition> = new Map();

  private constructor() {
    this.auditLogger = getImmutableAuditLogger();
    this.initializeProductTiers();
    this.initializeFeatures();
    this.initializeTransitions();
  }

  static getInstance(): ProductTiersManager {
    if (!ProductTiersManager.instance) {
      ProductTiersManager.instance = new ProductTiersManager();
    }
    return ProductTiersManager.instance;
  }

  /**
   * CRITICAL: Get product tier definition
   */
  getProductTier(tier: ProductTier): ProductTierDefinition | undefined {
    return this.tiers.get(tier);
  }

  /**
   * CRITICAL: Get feature definition
   */
  getFeature(featureId: string): FeatureDefinition | undefined {
    return this.features.get(featureId);
  }

  /**
   * CRITICAL: Check feature entitlement for tier
   */
  hasFeatureEntitlement(tier: ProductTier, featureId: string): boolean {
    const tierDef = this.tiers.get(tier);
    if (!tierDef) return false;

    const feature = this.features.get(featureId);
    if (!feature) return false;

    // Check if feature is included
    if (tierDef.features.included.includes(featureId)) {
      return true;
    }

    // Check if feature is enterprise-only and tier is Enterprise
    if (feature.type === 'ENTERPRISE_ONLY' && tier === 'ENTERPRISE') {
      return tierDef.features.enterpriseOnly.includes(featureId);
    }

    // Check if feature is explicitly excluded
    if (tierDef.features.excluded.includes(featureId)) {
      return false;
    }

    return false;
  }

  /**
   * CRITICAL: Get feature limit for tier
   */
  getFeatureLimit(tier: ProductTier, featureId: string, limitKey: string): number | string | boolean {
    const feature = this.features.get(featureId);
    if (!feature || !feature.limits) return false;

    const tierLimits = feature.limits[limitKey];
    if (!tierLimits) return false;

    return tierLimits[tier];
  }

  /**
   * CRITICAL: Validate tier transition
   */
  validateTierTransition(
    tenantId: string,
    fromTier: ProductTier,
    toTier: ProductTier,
    requestedBy: string
  ): TierTransition | null {
    const transitionKey = `${fromTier}_to_${toTier}`;
    const transition = this.transitions.get(transitionKey);
    
    if (!transition) {
      logger.error('Tier transition not defined', {
        tenantId,
        fromTier,
        toTier,
        requestedBy
      });
      return null;
    }

    // CRITICAL: Validate safety checks
    if (transition.safetyChecks.adminApproval) {
      const hasApproval = governanceModelManager.hasAuthority(requestedBy, 'ADMIN');
      if (!hasApproval) {
        logger.warn('Tier transition requires admin approval', {
          tenantId,
          fromTier,
          toTier,
          requestedBy
        });
        return null;
      }
    }

    if (transition.safetyChecks.complianceReview) {
      // In a real implementation, check compliance requirements
      logger.info('Compliance review required for tier transition', {
        tenantId,
        fromTier,
        toTier,
        complianceImpact: transition.complianceImpact
      });
    }

    // CRITICAL: Log transition validation
    this.auditLogger.logDataMutation({
      tenantId,
      actorId: requestedBy,
      action: 'TIER_TRANSITION_VALIDATED',
      resourceType: 'PRODUCT_TIER',
      resourceId: tenantId,
      outcome: 'SUCCESS',
      correlationId: this.generateCorrelationId(),
      metadata: {
        fromTier,
        toTier,
        transitionType: transition.type,
        billingAdjustment: transition.billingAdjustment.newMonthlyRate
      }
    });

    return transition;
  }

  /**
   * CRITICAL: Get all tiers for market segment
   */
  getTiersForMarketSegment(marketSegment: string): ProductTierDefinition[] {
    return Array.from(this.tiers.values())
      .filter(tier => tier.targetMarket.toLowerCase().includes(marketSegment.toLowerCase()));
  }

  /**
   * CRITICAL: Get upgrade path
   */
  getUpgradePath(currentTier: ProductTier): ProductTier[] {
    const tier = this.tiers.get(currentTier);
    return tier ? tier.upgradePaths : [];
  }

  /**
   * CRITICAL: Get downgrade path
   */
  getDowngradePath(currentTier: ProductTier): ProductTier[] {
    const tier = this.tiers.get(currentTier);
    return tier ? tier.downgradePaths : [];
  }

  /**
   * CRITICAL: Calculate tier pricing
   */
  calculateTierPricing(tier: ProductTier, billingCycle: 'MONTHLY' | 'ANNUAL', quantity: number = 1): {
    basePrice: number;
    totalPrice: number;
    setupFee?: number;
    discount: number;
    effectiveRate: number;
  } {
    const tierDef = this.tiers.get(tier);
    if (!tierDef) {
      throw new Error(`Invalid tier: ${tier}`);
    }

    const basePrice = billingCycle === 'ANNUAL' ? tierDef.pricing.annual : tierDef.pricing.monthly;
    const totalPrice = basePrice * quantity;
    const discount = billingCycle === 'ANNUAL' ? (tierDef.pricing.monthly * 12 - tierDef.pricing.annual) : 0;
    const effectiveRate = totalPrice / quantity;

    return {
      basePrice,
      totalPrice,
      setupFee: tierDef.pricing.setupFee,
      discount,
      effectiveRate
    };
  }

  /**
   * CRITICAL: Get compliance requirements for tier
   */
  getComplianceRequirements(tier: ProductTier): {
    required: string[];
    included: string[];
    optional: string[];
  } {
    const tierDef = this.tiers.get(tier);
    if (!tierDef) {
      return { required: [], included: [], optional: [] };
    }

    const allFrameworks = ['SOC2', 'ISO27001', 'GDPR', 'CCPA', 'SOX', 'HIPAA'];
    const included = tierDef.compliance.frameworks;
    const required = included.filter(f => ['SOC2', 'SOX'].includes(f)); // Always required for business
    const optional = allFrameworks.filter(f => !included.includes(f));

    return { required, included, optional };
  }

  /**
   * CRITICAL: Initialize product tiers
   */
  private initializeProductTiers(): void {
    const tiers: ProductTierDefinition[] = [
      {
        tier: 'FREE',
        name: 'Free Tier',
        description: 'Basic accounting for individuals and very small businesses',
        targetMarket: 'Individuals, Freelancers, Micro-businesses',
        pricing: {
          monthly: 0,
          annual: 0
        },
        limits: {
          users: 1,
          companies: 1,
          transactions: 50,
          storage: 1,
          apiCalls: 100,
          customReports: 0,
          integrations: 2,
          supportLevel: 'COMMUNITY',
          slaGuarantee: 0
        },
        features: {
          included: [
            'basic_accounting',
            'invoice_generation',
            'expense_tracking',
            'basic_reports',
            'data_export'
          ],
          excluded: [
            'multi_user',
            'advanced_compliance',
            'custom_integrations',
            'priority_support',
            'audit_logs',
            'api_access'
          ],
          enterpriseOnly: []
        },
        compliance: {
          frameworks: [],
          auditLogs: false,
          dataRetention: 30,
          encryptionAtRest: true,
          encryptionInTransit: true,
          soc2: false,
          iso27001: false,
          gdpr: false,
          hipaa: false,
          sox: false
        },
        upgradePaths: ['STARTER', 'PRO'],
        downgradePaths: [],
        trialDays: 0,
        cancellationPolicy: 'Immediate cancellation',
        refundPolicy: 'No refunds for free tier'
      },
      {
        tier: 'STARTER',
        name: 'Starter',
        description: 'Small business accounting with essential features',
        targetMarket: 'Small businesses, Startups',
        pricing: {
          monthly: 29,
          annual: 290,
          setupFee: 0
        },
        limits: {
          users: 3,
          companies: 2,
          transactions: 500,
          storage: 10,
          apiCalls: 1000,
          customReports: 5,
          integrations: 5,
          supportLevel: 'EMAIL',
          slaGuarantee: 99.0
        },
        features: {
          included: [
            'basic_accounting',
            'invoice_generation',
            'expense_tracking',
            'basic_reports',
            'data_export',
            'multi_user',
            'basic_compliance',
            'api_access',
            'email_support'
          ],
          excluded: [
            'advanced_compliance',
            'custom_integrations',
            'priority_support',
            'audit_logs',
            'advanced_analytics',
            'custom_workflows'
          ],
          enterpriseOnly: []
        },
        compliance: {
          frameworks: ['GDPR', 'CCPA'],
          auditLogs: true,
          dataRetention: 90,
          encryptionAtRest: true,
          encryptionInTransit: true,
          soc2: false,
          iso27001: false,
          gdpr: true,
          hipaa: false,
          sox: false
        },
        upgradePaths: ['PRO', 'ENTERPRISE'],
        downgradePaths: ['FREE'],
        trialDays: 14,
        cancellationPolicy: '30-day notice',
        refundPolicy: '30-day money-back guarantee'
      },
      {
        tier: 'PRO',
        name: 'Professional',
        description: 'Advanced accounting for growing businesses',
        targetMarket: 'Medium businesses, Growing companies',
        pricing: {
          monthly: 99,
          annual: 990,
          setupFee: 0
        },
        limits: {
          users: 10,
          companies: 5,
          transactions: 5000,
          storage: 100,
          apiCalls: 10000,
          customReports: 25,
          integrations: 15,
          supportLevel: 'PRIORITY',
          slaGuarantee: 99.5
        },
        features: {
          included: [
            'basic_accounting',
            'invoice_generation',
            'expense_tracking',
            'basic_reports',
            'data_export',
            'multi_user',
            'basic_compliance',
            'api_access',
            'email_support',
            'advanced_compliance',
            'custom_integrations',
            'priority_support',
            'audit_logs',
            'advanced_analytics',
            'custom_workflows'
          ],
          excluded: [
            'enterprise_governance',
            'custom_compliance',
            'dedicated_support',
            'white_label',
            'advanced_security'
          ],
          enterpriseOnly: []
        },
        compliance: {
          frameworks: ['SOC2', 'ISO27001', 'GDPR', 'CCPA'],
          auditLogs: true,
          dataRetention: 2555, // 7 years
          encryptionAtRest: true,
          encryptionInTransit: true,
          soc2: true,
          iso27001: true,
          gdpr: true,
          hipaa: false,
          sox: false
        },
        upgradePaths: ['ENTERPRISE'],
        downgradePaths: ['STARTER', 'FREE'],
        trialDays: 14,
        cancellationPolicy: '30-day notice',
        refundPolicy: '30-day money-back guarantee'
      },
      {
        tier: 'ENTERPRISE',
        name: 'Enterprise',
        description: 'Enterprise-grade accounting with full compliance and governance',
        targetMarket: 'Enterprise, Regulated industries',
        pricing: {
          monthly: 499,
          annual: 4990,
          setupFee: 5000,
          minimumCommitment: 10000
        },
        limits: {
          users: -1, // Unlimited
          companies: -1,
          transactions: -1,
          storage: -1,
          apiCalls: -1,
          customReports: -1,
          integrations: -1,
          supportLevel: 'DEDICATED',
          slaGuarantee: 99.9
        },
        features: {
          included: [
            'basic_accounting',
            'invoice_generation',
            'expense_tracking',
            'basic_reports',
            'data_export',
            'multi_user',
            'basic_compliance',
            'api_access',
            'email_support',
            'advanced_compliance',
            'custom_integrations',
            'priority_support',
            'audit_logs',
            'advanced_analytics',
            'custom_workflows'
          ],
          excluded: [],
          enterpriseOnly: [
            'enterprise_governance',
            'custom_compliance',
            'dedicated_support',
            'white_label',
            'advanced_security',
            'custom_audit_trails',
            'regulatory_reporting',
            'advanced_data_residency'
          ]
        },
        compliance: {
          frameworks: ['SOC2', 'ISO27001', 'GDPR', 'CCPA', 'SOX', 'HIPAA'],
          auditLogs: true,
          dataRetention: 2555, // 7 years
          encryptionAtRest: true,
          encryptionInTransit: true,
          soc2: true,
          iso27001: true,
          gdpr: true,
          hipaa: true,
          sox: true
        },
        upgradePaths: [],
        downgradePaths: ['PRO', 'STARTER', 'FREE'],
        trialDays: 30,
        cancellationPolicy: '90-day notice',
        refundPolicy: 'Custom refund terms'
      }
    ];

    for (const tier of tiers) {
      this.tiers.set(tier.tier, tier);
    }
  }

  /**
   * CRITICAL: Initialize features
   */
  private initializeFeatures(): void {
    const features: FeatureDefinition[] = [
      {
        id: 'basic_accounting',
        name: 'Basic Accounting',
        description: 'Core accounting functionality',
        category: 'CORE',
        type: 'BOOLEAN',
        enforcementLevel: 'HARD',
        metadata: {
          displayName: 'Basic Accounting',
          documentation: '/docs/features/basic-accounting',
          apiReference: '/api/v1/accounting'
        }
      },
      {
        id: 'multi_user',
        name: 'Multi-User Access',
        description: 'Multiple user accounts with role-based access',
        category: 'CORE',
        type: 'LIMITED',
        enforcementLevel: 'HARD',
        limits: {
          users: {
            FREE: 1,
            STARTER: 3,
            PRO: 10,
            ENTERPRISE: -1
          }
        },
        metadata: {
          displayName: 'Multi-User Access',
          documentation: '/docs/features/multi-user',
          apiReference: '/api/v1/users'
        }
      },
      {
        id: 'advanced_compliance',
        name: 'Advanced Compliance',
        description: 'Advanced compliance features and reporting',
        category: 'COMPLIANCE',
        type: 'BOOLEAN',
        enforcementLevel: 'COMPLIANCE',
        complianceRequired: ['SOC2', 'ISO27001'],
        metadata: {
          displayName: 'Advanced Compliance',
          documentation: '/docs/features/advanced-compliance',
          apiReference: '/api/v1/compliance'
        }
      },
      {
        id: 'enterprise_governance',
        name: 'Enterprise Governance',
        description: 'Enterprise-grade governance and oversight',
        category: 'GOVERNANCE',
        type: 'ENTERPRISE_ONLY',
        enforcementLevel: 'COMPLIANCE',
        complianceRequired: ['SOX'],
        metadata: {
          displayName: 'Enterprise Governance',
          documentation: '/docs/features/enterprise-governance',
          apiReference: '/api/v1/governance'
        }
      },
      {
        id: 'api_access',
        name: 'API Access',
        description: 'Programmatic access via REST API',
        category: 'INTEGRATION',
        type: 'LIMITED',
        enforcementLevel: 'HARD',
        limits: {
          apiCalls: {
            FREE: 100,
            STARTER: 1000,
            PRO: 10000,
            ENTERPRISE: -1
          }
        },
        pricing: {
          included: true,
          overageRate: 0.001
        },
        metadata: {
          displayName: 'API Access',
          documentation: '/docs/features/api-access',
          apiReference: '/api/v1/docs'
        }
      }
    ];

    for (const feature of features) {
      this.features.set(feature.id, feature);
    }
  }

  /**
   * CRITICAL: Initialize tier transitions
   */
  private initializeTransitions(): void {
    const transitions: TierTransition[] = [
      {
        fromTier: 'FREE',
        toTier: 'STARTER',
        type: 'UPGRADE',
        effectiveDate: new Date(),
        billingAdjustment: {
          proratedCharge: 29,
          newMonthlyRate: 29
        },
        dataImplications: {
          dataRetention: 90,
          featureLoss: [],
          migrationRequired: false,
          backupAvailable: true
        },
        complianceImpact: {
          frameworkLoss: [],
          auditTrailImpact: false,
          dataResidency: false,
          encryptionImpact: false
        },
        safetyChecks: {
          confirmationRequired: true,
          adminApproval: false,
          complianceReview: false,
          dataBackup: true
        }
      },
      {
        fromTier: 'STARTER',
        toTier: 'PRO',
        type: 'UPGRADE',
        effectiveDate: new Date(),
        billingAdjustment: {
          proratedCharge: 70,
          newMonthlyRate: 99
        },
        dataImplications: {
          dataRetention: 2555,
          featureLoss: [],
          migrationRequired: false,
          backupAvailable: true
        },
        complianceImpact: {
          frameworkLoss: [],
          auditTrailImpact: false,
          dataResidency: false,
          encryptionImpact: false
        },
        safetyChecks: {
          confirmationRequired: true,
          adminApproval: false,
          complianceReview: true,
          dataBackup: true
        }
      },
      {
        fromTier: 'PRO',
        toTier: 'ENTERPRISE',
        type: 'UPGRADE',
        effectiveDate: new Date(),
        billingAdjustment: {
          proratedCharge: 400,
          newMonthlyRate: 499
        },
        dataImplications: {
          dataRetention: 2555,
          featureLoss: [],
          migrationRequired: false,
          backupAvailable: true
        },
        complianceImpact: {
          frameworkLoss: [],
          auditTrailImpact: false,
          dataResidency: false,
          encryptionImpact: false
        },
        safetyChecks: {
          confirmationRequired: true,
          adminApproval: true,
          complianceReview: true,
          dataBackup: true
        }
      },
      {
        fromTier: 'ENTERPRISE',
        toTier: 'PRO',
        type: 'DOWNGRADE',
        effectiveDate: new Date(),
        billingAdjustment: {
          proratedCredit: 400,
          newMonthlyRate: 99
        },
        dataImplications: {
          dataRetention: 2555,
          featureLoss: ['enterprise_governance', 'custom_compliance', 'dedicated_support'],
          migrationRequired: true,
          backupAvailable: true
        },
        complianceImpact: {
          frameworkLoss: ['HIPAA'],
          auditTrailImpact: false,
          dataResidency: false,
          encryptionImpact: false
        },
        safetyChecks: {
          confirmationRequired: true,
          adminApproval: true,
          complianceReview: true,
          dataBackup: true
        }
      }
    ];

    for (const transition of transitions) {
      const key = `${transition.fromTier}_to_${transition.toTier}`;
      this.transitions.set(key, transition);
    }
  }

  /**
   * CRITICAL: Generate correlation ID
   */
  private generateCorrelationId(): string {
    const bytes = crypto.randomBytes(8);
    return `corr_${bytes.toString('hex')}`;
  }
}

/**
 * CRITICAL: Global product tiers manager instance
 */
export const productTiersManager = ProductTiersManager.getInstance();

/**
 * CRITICAL: Convenience functions
 */
export const getProductTier = (tier: ProductTier): ProductTierDefinition | undefined => {
  return productTiersManager.getProductTier(tier);
};

export const hasFeatureEntitlement = (tier: ProductTier, featureId: string): boolean => {
  return productTiersManager.hasFeatureEntitlement(tier, featureId);
};

export const getFeatureLimit = (tier: ProductTier, featureId: string, limitKey: string): number | string | boolean => {
  return productTiersManager.getFeatureLimit(tier, featureId, limitKey);
};
