/**
 * Pricing Service
 * Handles pricing tier API calls
 */

const API_BASE = '/api';

interface PricingTier {
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  limits: {
    transactions: number;
    aiQueries: number;
    entities: number;
    users: number;
    storage: string;
  };
  highlighted?: boolean;
}

interface PricingTiers {
  trial: PricingTier;
  starter: PricingTier;
  pro: PricingTier;
  business: PricingTier;
  enterprise: PricingTier;
}

interface CurrentTier {
  tier: string;
  tierConfig: PricingTier;
  usage?: {
    transactionsThisMonth: number;
    aiQueriesThisMonth: number;
    entitiesCount: number;
    usersCount: number;
    storageUsed: string;
  };
  limits?: {
    transactions: { limit: number; used: number; remaining: number };
    aiQueries: { limit: number; used: number; remaining: number };
    entities: { limit: number; used: number; remaining: number };
  };
}

interface TierComparison {
  from: string;
  to: string;
  priceDifference: {
    monthly: number;
    annual: number;
  };
  additionalFeatures: string[];
  increasedLimits: Array<{
    feature: string;
    from: number | string;
    to: number | string;
  }>;
}

interface UpgradeTrigger {
  type: string;
  message: string;
  suggestedTier: string;
  currentUsage: number;
  limit: number;
  percentUsed: number;
}

class PricingService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  async getAllTiers(): Promise<{ success: boolean; data: PricingTiers }> {
    const response = await fetch(`${API_BASE}/pricing/tiers`);

    if (!response.ok) {
      throw new Error('Failed to get pricing tiers');
    }

    return response.json();
  }

  async compareTiers(from: string, to: string): Promise<{ success: boolean; data: TierComparison }> {
    const response = await fetch(`${API_BASE}/pricing/compare?from=${from}&to=${to}`);

    if (!response.ok) {
      throw new Error('Failed to compare tiers');
    }

    return response.json();
  }

  async getCurrentTier(): Promise<{ success: boolean; data: CurrentTier }> {
    const response = await fetch(`${API_BASE}/pricing/current`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get current tier');
    }

    return response.json();
  }

  async checkFeatureAccess(featureName: string): Promise<{
    success: boolean;
    data: {
      hasAccess: boolean;
      requiredTier?: string;
      upgradeMessage?: string;
    };
  }> {
    const response = await fetch(`${API_BASE}/pricing/feature/${featureName}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to check feature access');
    }

    return response.json();
  }

  async getUpgradeTriggers(): Promise<{ success: boolean; data: UpgradeTrigger[] }> {
    const response = await fetch(`${API_BASE}/pricing/upgrade-triggers`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get upgrade triggers');
    }

    return response.json();
  }

  async upgradeTier(tier: string, subscriptionId?: string): Promise<{
    success: boolean;
    data: { upgraded: boolean; newTier: string };
  }> {
    const response = await fetch(`${API_BASE}/pricing/upgrade`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ tier, subscriptionId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upgrade tier');
    }

    return response.json();
  }

  async downgradeTier(tier: string): Promise<{
    success: boolean;
    data: { downgraded: boolean; newTier: string; effectiveDate: string };
  }> {
    const response = await fetch(`${API_BASE}/pricing/downgrade`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ tier }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to downgrade tier');
    }

    return response.json();
  }

  async trackUsage(featureName: string): Promise<void> {
    const response = await fetch(`${API_BASE}/pricing/track-usage`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ featureName }),
    });

    if (!response.ok) {
      throw new Error('Failed to track usage');
    }
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  }

  calculateAnnualSavings(monthlyPrice: number, annualPrice: number): number {
    const yearlyFromMonthly = monthlyPrice * 12;
    return yearlyFromMonthly - annualPrice;
  }

  calculateSavingsPercentage(monthlyPrice: number, annualPrice: number): number {
    const yearlyFromMonthly = monthlyPrice * 12;
    return Math.round(((yearlyFromMonthly - annualPrice) / yearlyFromMonthly) * 100);
  }
}

export const pricingService = new PricingService();
export default pricingService;
