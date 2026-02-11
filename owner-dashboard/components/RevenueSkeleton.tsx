/**
 * Revenue Skeleton - Multi-Tier Subscription Management
 * Billion-Dollar Grade Feature Gates & Usage Ceilings
 * 
 * Features:
 * - Operator / Business / Enterprise tier definitions
 * - Usage ceilings per tier (users, transactions, storage)
 * - Support level assignment
 * - Compliance access controls
 * - Feature flag integration per tier
 * - Infrastructure ready (no pricing yet)
 */

import React, { useState } from 'react';
import {
  Layers,
  Users,
  Database,
  Shield,
  Headphones,
  CheckCircle,
  XCircle,
  Minus,
  Zap,
  Building2,
  User,
  Building,
  Lock,
  Unlock,
  Save,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { SignalCard, SignalGrid, StatusIndicator } from './SignalSystem';
import { useBrand } from './BrandEngine';
import { useFeatureFlags } from './FeatureFlagSystem';

export type SubscriptionTier = 'operator' | 'business' | 'enterprise';

interface TierConfig {
  id: SubscriptionTier;
  name: string;
  icon: React.ElementType;
  description: string;
  features: {
    maxUsers: number;
    maxTransactions: number;
    storageGB: number;
    apiCallsPerMinute: number;
    customIntegrations: boolean;
    whiteLabel: boolean;
    advancedReporting: boolean;
    complianceTools: boolean;
    prioritySupport: boolean;
    dedicatedManager: boolean;
    auditLogs: boolean;
    sla: string;
  };
  limits: {
    concurrentUsers: number;
    monthlyRevenueCap: number;
    documentStorage: number;
    retentionDays: number;
  };
}

const DEFAULT_TIERS: TierConfig[] = [
  {
    id: 'operator',
    name: 'Operator',
    icon: User,
    description: 'Individual operators and small teams getting started',
    features: {
      maxUsers: 3,
      maxTransactions: 1000,
      storageGB: 10,
      apiCallsPerMinute: 60,
      customIntegrations: false,
      whiteLabel: false,
      advancedReporting: false,
      complianceTools: false,
      prioritySupport: false,
      dedicatedManager: false,
      auditLogs: false,
      sla: 'Best effort',
    },
    limits: {
      concurrentUsers: 3,
      monthlyRevenueCap: 50000,
      documentStorage: 1000,
      retentionDays: 90,
    },
  },
  {
    id: 'business',
    name: 'Business',
    icon: Building,
    description: 'Growing businesses with advanced needs',
    features: {
      maxUsers: 25,
      maxTransactions: 50000,
      storageGB: 100,
      apiCallsPerMinute: 300,
      customIntegrations: true,
      whiteLabel: false,
      advancedReporting: true,
      complianceTools: true,
      prioritySupport: true,
      dedicatedManager: false,
      auditLogs: true,
      sla: '99.5% uptime',
    },
    limits: {
      concurrentUsers: 25,
      monthlyRevenueCap: 500000,
      documentStorage: 10000,
      retentionDays: 365,
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    icon: Building2,
    description: 'Large organizations with custom requirements',
    features: {
      maxUsers: -1, // Unlimited
      maxTransactions: -1, // Unlimited
      storageGB: -1, // Unlimited
      apiCallsPerMinute: 1000,
      customIntegrations: true,
      whiteLabel: true,
      advancedReporting: true,
      complianceTools: true,
      prioritySupport: true,
      dedicatedManager: true,
      auditLogs: true,
      sla: '99.99% uptime',
    },
    limits: {
      concurrentUsers: -1,
      monthlyRevenueCap: -1,
      documentStorage: -1,
      retentionDays: 2555, // 7 years
    },
  },
];

interface TierGate {
  featureId: string;
  featureName: string;
  operator: boolean;
  business: boolean;
  enterprise: boolean;
  description: string;
}

const DEFAULT_GATES: TierGate[] = [
  { featureId: 'basic_accounting', featureName: 'Basic Accounting', operator: true, business: true, enterprise: true, description: 'Core double-entry bookkeeping' },
  { featureId: 'invoicing', featureName: 'Invoicing & Billing', operator: true, business: true, enterprise: true, description: 'Create and send invoices' },
  { featureId: 'bank_sync', featureName: 'Bank Synchronization', operator: true, business: true, enterprise: true, description: 'Auto-import bank transactions' },
  { featureId: 'multi_currency', featureName: 'Multi-Currency', operator: false, business: true, enterprise: true, description: 'Support for 150+ currencies' },
  { featureId: 'advanced_reports', featureName: 'Advanced Reporting', operator: false, business: true, enterprise: true, description: 'Custom reports and dashboards' },
  { featureId: 'api_access', featureName: 'API Access', operator: false, business: true, enterprise: true, description: 'Full REST API access' },
  { featureId: 'webhooks', featureName: 'Webhooks', operator: false, business: true, enterprise: true, description: 'Real-time event notifications' },
  { featureId: 'custom_integrations', featureName: 'Custom Integrations', operator: false, business: true, enterprise: true, description: 'Build custom integrations' },
  { featureId: 'white_label', featureName: 'White-Label Branding', operator: false, business: false, enterprise: true, description: 'Remove branding, custom domain' },
  { featureId: 'audit_logs', featureName: 'Audit Logs', operator: false, business: false, enterprise: true, description: 'Full audit trail access' },
  { featureId: 'dedicated_manager', featureName: 'Dedicated Account Manager', operator: false, business: false, enterprise: true, description: 'Personal support manager' },
  { featureId: 'sla_guarantee', featureName: 'SLA Guarantee', operator: false, business: false, enterprise: true, description: 'Service level agreement with credits' },
  { featureId: 'compliance_pack', featureName: 'Compliance Package', operator: false, business: true, enterprise: true, description: 'SOC2, GDPR, PCI tools' },
  { featureId: 'sso', featureName: 'SSO / SAML', operator: false, business: false, enterprise: true, description: 'Single sign-on integration' },
  { featureId: 'advanced_security', featureName: 'Advanced Security', operator: false, business: false, enterprise: true, description: 'IP restrictions, 2FA enforcement' },
];

export const RevenueSkeleton: React.FC = () => {
  const { currentBrand } = useBrand();
  const { flags } = useFeatureFlags();
  
  const [tiers] = useState<TierConfig[]>(DEFAULT_TIERS);
  const [gates, setGates] = useState<TierGate[]>(DEFAULT_GATES);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('business');
  const [editing, setEditing] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  const toggleGate = (featureId: string, tier: SubscriptionTier) => {
    setGates(prev => prev.map(g => 
      g.featureId === featureId 
        ? { ...g, [tier]: !g[tier] }
        : g
    ));
    setUnsavedChanges(true);
  };

  const saveChanges = () => {
    // Simulate API call
    setTimeout(() => {
      setUnsavedChanges(false);
      setEditing(false);
    }, 500);
  };

  const selectedTierConfig = tiers.find(t => t.id === selectedTier);

  const formatLimit = (value: number) => value === -1 ? 'Unlimited' : value.toLocaleString();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-7 h-7 text-purple-600" />
            Revenue Skeleton
          </h2>
          <p className="text-slate-600 mt-1">
            {currentBrand.name} — Multi-tier feature gates & usage ceilings (Infrastructure Only)
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unsavedChanges && (
            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" />
              Unsaved Changes
            </span>
          )}
          <button
            onClick={() => setEditing(!editing)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              editing 
                ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' 
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            {editing ? 'Cancel Editing' : 'Edit Gates'}
          </button>
          {editing && (
            <button
              onClick={saveChanges}
              disabled={!unsavedChanges}
              className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                unsavedChanges
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          )}
        </div>
      </div>

      {/* Infrastructure Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <Zap className="w-5 h-5 text-amber-600 mt-0.5" />
        <div>
          <h3 className="font-medium text-amber-900">Infrastructure Configuration Only</h3>
          <p className="text-sm text-amber-700 mt-1">
            This is the revenue skeleton—feature gates and usage ceilings are configured here. 
            Pricing, billing, and payment processing are NOT yet enabled. Activate when ready for revenue.
          </p>
        </div>
      </div>

      {/* Tier Overview */}
      <SignalGrid columns={3}>
        {tiers.map((tier) => {
          const Icon = tier.icon;
          const isSelected = selectedTier === tier.id;
          
          return (
            <button
              key={tier.id}
              onClick={() => setSelectedTier(tier.id)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                isSelected 
                  ? 'border-purple-600 bg-purple-50' 
                  : 'border-slate-200 hover:border-purple-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${isSelected ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{tier.name}</h3>
                  <p className="text-xs text-slate-500">{tier.description}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                <div>
                  <span className="text-slate-500">Users:</span>{' '}
                  <span className="font-medium">{formatLimit(tier.features.maxUsers)}</span>
                </div>
                <div>
                  <span className="text-slate-500">Storage:</span>{' '}
                  <span className="font-medium">{formatLimit(tier.features.storageGB)} GB</span>
                </div>
                <div>
                  <span className="text-slate-500">API:</span>{' '}
                  <span className="font-medium">{tier.features.apiCallsPerMinute}/min</span>
                </div>
                <div>
                  <span className="text-slate-500">SLA:</span>{' '}
                  <span className="font-medium">{tier.features.sla}</span>
                </div>
              </div>
            </button>
          );
        })}
      </SignalGrid>

      {/* Selected Tier Details */}
      {selectedTierConfig && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h3 className="font-semibold text-slate-900">
              {selectedTierConfig.name} Tier Configuration
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Max Users</p>
                <p className="text-lg font-bold text-slate-900">{formatLimit(selectedTierConfig.features.maxUsers)}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Monthly Transactions</p>
                <p className="text-lg font-bold text-slate-900">{formatLimit(selectedTierConfig.features.maxTransactions)}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Storage</p>
                <p className="text-lg font-bold text-slate-900">{formatLimit(selectedTierConfig.features.storageGB)} GB</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">API Rate Limit</p>
                <p className="text-lg font-bold text-slate-900">{selectedTierConfig.features.apiCallsPerMinute}/min</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Concurrent Users</p>
                <p className="text-lg font-bold text-slate-900">{formatLimit(selectedTierConfig.limits.concurrentUsers)}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Revenue Cap</p>
                <p className="text-lg font-bold text-slate-900">
                  {selectedTierConfig.limits.monthlyRevenueCap === -1 ? 'Unlimited' : `$${(selectedTierConfig.limits.monthlyRevenueCap / 1000)}K/mo`}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Data Retention</p>
                <p className="text-lg font-bold text-slate-900">{selectedTierConfig.limits.retentionDays} days</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Support Level</p>
                <p className="text-lg font-bold text-slate-900">
                  {selectedTierConfig.features.dedicatedManager ? 'Dedicated AM' : 
                   selectedTierConfig.features.prioritySupport ? 'Priority' : 'Standard'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feature Gates Matrix */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Feature Gates Matrix
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Toggle which features are available per tier. Changes apply immediately when saved.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Feature</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-slate-700 w-32">Operator</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-slate-700 w-32">Business</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-slate-700 w-32">Enterprise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {gates.map((gate) => (
                <tr key={gate.featureId} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900">{gate.featureName}</p>
                    <p className="text-sm text-slate-500">{gate.description}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {editing ? (
                      <button
                        onClick={() => toggleGate(gate.featureId, 'operator')}
                        className={`p-2 rounded-lg transition-colors ${
                          gate.operator 
                            ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' 
                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {gate.operator ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                      </button>
                    ) : (
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                        gate.operator ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {gate.operator ? <CheckCircle className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {editing ? (
                      <button
                        onClick={() => toggleGate(gate.featureId, 'business')}
                        className={`p-2 rounded-lg transition-colors ${
                          gate.business 
                            ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' 
                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {gate.business ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                      </button>
                    ) : (
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                        gate.business ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {gate.business ? <CheckCircle className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {editing ? (
                      <button
                        onClick={() => toggleGate(gate.featureId, 'enterprise')}
                        className={`p-2 rounded-lg transition-colors ${
                          gate.enterprise 
                            ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' 
                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {gate.enterprise ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                      </button>
                    ) : (
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                        gate.enterprise ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {gate.enterprise ? <CheckCircle className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
          <p className="text-sm text-purple-700 mb-1">Operator Features</p>
          <p className="text-2xl font-bold text-purple-900">
            {gates.filter(g => g.operator).length}
          </p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <p className="text-sm text-blue-700 mb-1">Business Features</p>
          <p className="text-2xl font-bold text-blue-900">
            {gates.filter(g => g.business).length}
          </p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
          <p className="text-sm text-emerald-700 mb-1">Enterprise Features</p>
          <p className="text-2xl font-bold text-emerald-900">
            {gates.filter(g => g.enterprise).length}
          </p>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <p className="text-sm text-slate-700 mb-1">Total Gates</p>
          <p className="text-2xl font-bold text-slate-900">{gates.length}</p>
        </div>
      </div>
    </div>
  );
};

export default RevenueSkeleton;
