import { create } from 'zustand';
import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type { Subscription, BillingPlan, FeatureAccess } from '@/types';

interface BillingState {
  subscription: Subscription | null;
  plans: BillingPlan[];
  featureAccess: FeatureAccess[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchSubscription: () => Promise<void>;
  fetchPlans: () => Promise<void>;
  fetchFeatureAccess: () => Promise<void>;
  createCheckoutSession: (planId: string) => Promise<string>;
  cancelSubscription: () => Promise<void>;
  canAccessFeature: (feature: string) => boolean;
  getFeatureUsage: (feature: string) => { current: number; limit: number; canUse: boolean };
}

export const useBillingStore = create<BillingState>((set, get) => ({
  subscription: null,
  plans: [],
  featureAccess: [],
  isLoading: false,
  error: null,

  fetchSubscription: async () => {
    try {
      const data = await api.get<Subscription>(API_ENDPOINTS.billing.subscription);
      set({ subscription: data });
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    }
  },

  fetchPlans: async () => {
    try {
      const data = await api.get<BillingPlan[]>(API_ENDPOINTS.billing.plans);
      set({ plans: data });
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    }
  },

  fetchFeatureAccess: async () => {
    try {
      const data = await api.get<FeatureAccess[]>(API_ENDPOINTS.billing.plans + '/features');
      set({ featureAccess: data });
    } catch (error) {
      console.error('Failed to fetch feature access:', error);
    }
  },

  createCheckoutSession: async (planId: string) => {
    const response = await api.post<{ url: string }>(API_ENDPOINTS.billing.payment, { planId });
    return response.url;
  },

  cancelSubscription: async () => {
    await api.post(API_ENDPOINTS.billing.subscription + '/cancel');
    await get().fetchSubscription();
  },

  canAccessFeature: (feature: string) => {
    const { featureAccess } = get();
    const access = featureAccess.find(f => f.feature === feature);
    return access?.canUse ?? false;
  },

  getFeatureUsage: (feature: string) => {
    const { featureAccess } = get();
    const access = featureAccess.find(f => f.feature === feature);
    return {
      current: access?.currentUsage ?? 0,
      limit: access?.limit ?? 0,
      canUse: access?.canUse ?? false,
    };
  },
}));
