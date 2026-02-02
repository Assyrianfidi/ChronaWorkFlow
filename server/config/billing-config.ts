// Billing Configuration
// Phase 4: Payments & Billing Dark Launch
// Date: February 1, 2026
// Purpose: Safe billing activation for limited beta subset

export interface BillingConfig {
  enabled: boolean;
  mode: 'sandbox' | 'live';
  maxBillingUsers: number;
  provider: 'stripe';
  tiers: {
    free: TierConfig;
    starter: TierConfig;
    pro: TierConfig;
  };
  safetyControls: {
    freezeOnIncorrectCharge: boolean;
    freezeOnDuplicateCharge: boolean;
    freezeOnInvoiceMismatch: boolean;
    freezeOnFailedRefund: boolean;
    freezeOnWebhookInconsistency: boolean;
    freezeOnUserDispute: boolean;
    requireExplicitConsent: boolean;
    allowImmediateOptOut: boolean;
  };
  monitoring: {
    logAllBillingActivity: boolean;
    alertOnPaymentFailure: boolean;
    alertOnRefundRequest: boolean;
    alertOnDispute: boolean;
  };
}

export interface TierConfig {
  name: string;
  priceMonthly: number;
  pricingModel: 'flat' | 'usage';
  requiresPayment: boolean;
  features: {
    scenarios: number | 'unlimited';
    forecasts: number | 'unlimited';
  };
}

export const billingConfig: BillingConfig = {
  enabled: false, // Set to true only after Phase 3 beta success
  mode: 'sandbox', // Start in sandbox, move to 'live' for beta subset
  maxBillingUsers: 10, // Maximum 5-10 users for Phase 4
  provider: 'stripe',
  
  tiers: {
    free: {
      name: 'FREE',
      priceMonthly: 0,
      pricingModel: 'flat',
      requiresPayment: false,
      features: {
        scenarios: 0,
        forecasts: 10,
      },
    },
    starter: {
      name: 'STARTER',
      priceMonthly: 29.00, // $29/month (beta discount: 50% off = $14.50)
      pricingModel: 'flat',
      requiresPayment: true,
      features: {
        scenarios: 10,
        forecasts: 100,
      },
    },
    pro: {
      name: 'PRO',
      priceMonthly: 49.00, // $49/month (beta discount: 50% off = $24.50)
      pricingModel: 'flat',
      requiresPayment: true,
      features: {
        scenarios: 'unlimited',
        forecasts: 'unlimited',
      },
    },
  },
  
  safetyControls: {
    // CRITICAL: Freeze billing immediately on ANY of these conditions
    freezeOnIncorrectCharge: true,
    freezeOnDuplicateCharge: true,
    freezeOnInvoiceMismatch: true,
    freezeOnFailedRefund: true,
    freezeOnWebhookInconsistency: true,
    freezeOnUserDispute: true,
    
    // User protection
    requireExplicitConsent: true,
    allowImmediateOptOut: true,
  },
  
  monitoring: {
    logAllBillingActivity: true,
    alertOnPaymentFailure: true,
    alertOnRefundRequest: true,
    alertOnDispute: true,
  },
};

/**
 * Check if billing is enabled
 */
export function isBillingEnabled(): boolean {
  return billingConfig.enabled;
}

/**
 * Get tier configuration
 */
export function getTierConfig(tier: 'free' | 'starter' | 'pro'): TierConfig {
  return billingConfig.tiers[tier];
}

/**
 * Calculate beta discount price
 */
export function getBetaPrice(tier: 'starter' | 'pro'): number {
  const basePrice = billingConfig.tiers[tier].priceMonthly;
  return basePrice * 0.5; // 50% beta discount
}

/**
 * Calculate prorated amount
 */
export function calculateProration(
  tier: 'starter' | 'pro',
  daysRemaining: number,
  daysInMonth: number
): number {
  const monthlyPrice = getBetaPrice(tier);
  return (monthlyPrice / daysInMonth) * daysRemaining;
}

/**
 * Validate invoice accuracy
 */
export function validateInvoice(
  tier: 'starter' | 'pro',
  chargedAmount: number,
  expectedAmount: number,
  tolerance: number = 0.01 // 1 cent tolerance for rounding
): { valid: boolean; error?: string } {
  const difference = Math.abs(chargedAmount - expectedAmount);
  
  if (difference > tolerance) {
    return {
      valid: false,
      error: `Invoice mismatch: charged $${chargedAmount}, expected $${expectedAmount} (diff: $${difference})`,
    };
  }
  
  return { valid: true };
}

/**
 * Log billing activity
 */
export function logBillingActivity(
  userId: string,
  action: string,
  metadata: {
    invoiceId?: string;
    chargeId?: string;
    amount?: number;
    currency?: string;
    tier?: string;
    timestamp?: string;
  }
) {
  if (billingConfig.monitoring.logAllBillingActivity) {
    console.log('[BILLING ACTIVITY]', {
      timestamp: metadata.timestamp || new Date().toISOString(),
      userId,
      action,
      ...metadata,
    });
  }
}

/**
 * Freeze billing (safety control)
 */
export function freezeBilling(reason: string, metadata?: Record<string, any>) {
  console.error('[BILLING FREEZE]', {
    timestamp: new Date().toISOString(),
    reason,
    metadata,
  });
  
  // In production, this would:
  // 1. Set billingConfig.enabled = false
  // 2. Trigger P0 alert
  // 3. Notify all stakeholders
  // 4. Preserve all logs and state
  // 5. Initiate incident response
}
