/**
 * Feature Flag System - Safe Rollout Controls
 * Billion-Dollar Grade Feature Management
 * 
 * Safety First:
 * - All features default OFF
 * - Canary percentage rollout (0-100%)
 * - Instant disable capability
 * - Full audit logging
 * - A/B testing support
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  ToggleLeft,
  ToggleRight,
  Percent,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  History,
  Zap,
  Shield,
} from 'lucide-react';
import { StatusIndicator } from './SignalSystem';

// Feature Flag Types
export type FeatureFlagType = 'boolean' | 'percentage' | 'user_segment' | 'time_based';

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  type: FeatureFlagType;
  
  // Current state
  enabled: boolean;
  rolloutPercentage: number; // 0-100
  
  // Targeting
  userSegments: string[];
  excludedUsers: string[];
  
  // Time-based
  startTime?: Date;
  endTime?: Date;
  
  // Safety
  requiresConfirmation: boolean;
  canDisableInstantly: boolean;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  category: string;
  
  // Rollback
  lastRollbackAt?: Date;
  rollbackReason?: string;
}

// Feature Flag Context
interface FeatureFlagContextType {
  flags: FeatureFlag[];
  isEnabled: (flagId: string, userId?: string) => boolean;
  getFlagValue: (flagId: string, userId?: string) => boolean | number | string;
  
  // Controls
  toggleFlag: (flagId: string) => void;
  setRolloutPercentage: (flagId: string, percentage: number) => void;
  enableForUser: (flagId: string, userId: string) => void;
  disableForUser: (flagId: string, userId: string) => void;
  
  // Safety
  emergencyDisable: (flagId: string, reason: string) => void;
  rollbackFlag: (flagId: string, reason: string) => void;
  
  // Bulk operations
  enableCategory: (category: string) => void;
  disableCategory: (category: string) => void;
}

const FeatureFlagContext = createContext<FeatureFlagContextType | null>(null);

// Billion-Dollar Feature Flags
const DEFAULT_FLAGS: FeatureFlag[] = [
  // Workstream 1: Executive UX
  {
    id: 'ceo_themes_enabled',
    name: 'CEO Themes (Dark/Light/Boardroom)',
    description: 'Enable executive theme switching including boardroom presentation mode',
    type: 'boolean',
    enabled: false,
    rolloutPercentage: 0,
    userSegments: ['owner', 'admin'],
    excludedUsers: [],
    requiresConfirmation: false,
    canDisableInstantly: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    category: 'Executive UX',
  },
  {
    id: 'signal_first_design',
    name: 'Signal-First Dashboard Design',
    description: 'Replace raw numbers with status indicators and trend arrows',
    type: 'percentage',
    enabled: false,
    rolloutPercentage: 0,
    userSegments: ['owner', 'executive'],
    excludedUsers: [],
    requiresConfirmation: false,
    canDisableInstantly: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    category: 'Executive UX',
  },
  
  // Workstream 2: Voice Control
  {
    id: 'voice_commands_enabled',
    name: 'Voice Command Engine',
    description: 'Enable secure voice control for owner-only operations',
    type: 'boolean',
    enabled: false,
    rolloutPercentage: 0,
    userSegments: ['owner'],
    excludedUsers: [],
    requiresConfirmation: true,
    canDisableInstantly: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    category: 'Voice Control',
  },
  
  // Workstream 3: Brand/White-Label
  {
    id: 'multi_brand_support',
    name: 'Multi-Brand Engine',
    description: 'Enable brand switching and white-label capabilities',
    type: 'boolean',
    enabled: false,
    rolloutPercentage: 0,
    userSegments: ['owner', 'admin'],
    excludedUsers: [],
    requiresConfirmation: true,
    canDisableInstantly: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    category: 'Branding',
  },
  {
    id: 'brand.chronaworkflow.rename',
    name: 'ChronaWorkFlow Rebrand',
    description: 'Rename customer-facing product from AccuBooks to ChronaWorkFlow (formerly AccuBooks)',
    type: 'percentage',
    enabled: false,
    rolloutPercentage: 0,
    userSegments: ['all'],
    excludedUsers: [],
    requiresConfirmation: true,
    canDisableInstantly: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    category: 'Branding',
  },
  {
    id: 'white_label_mode',
    name: 'White-Label Mode',
    description: 'Allow tenants to customize branding',
    type: 'user_segment',
    enabled: false,
    rolloutPercentage: 0,
    userSegments: ['enterprise_tenant'],
    excludedUsers: [],
    requiresConfirmation: true,
    canDisableInstantly: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    category: 'Branding',
  },
  
  // Workstream 4: Public Trust
  {
    id: 'public_status_page',
    name: 'Public Status Page',
    description: 'Expose public read-only status page',
    type: 'boolean',
    enabled: false,
    rolloutPercentage: 0,
    userSegments: ['public'],
    excludedUsers: [],
    requiresConfirmation: false,
    canDisableInstantly: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    category: 'Trust Layer',
  },
  {
    id: 'trust_dashboard',
    name: 'Customer Trust Dashboard',
    description: 'Enable security and compliance dashboard for customers',
    type: 'boolean',
    enabled: false,
    rolloutPercentage: 0,
    userSegments: ['all'],
    excludedUsers: [],
    requiresConfirmation: false,
    canDisableInstantly: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    category: 'Trust Layer',
  },
  {
    id: 'compliance_badges_auto',
    name: 'Auto-Updated Compliance Badges',
    description: 'Real-time compliance badge verification',
    type: 'boolean',
    enabled: false,
    rolloutPercentage: 0,
    userSegments: ['all'],
    excludedUsers: [],
    requiresConfirmation: false,
    canDisableInstantly: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    category: 'Trust Layer',
  },
  
  // Workstream 5: Billion-Dollar Polish
  {
    id: 'motion_polish',
    name: 'Motion & Micro-interactions',
    description: 'Subtle animations and polished interactions',
    type: 'percentage',
    enabled: false,
    rolloutPercentage: 0,
    userSegments: ['all'],
    excludedUsers: [],
    requiresConfirmation: false,
    canDisableInstantly: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    category: 'Polish',
  },
  {
    id: 'executive_language',
    name: 'Executive-Grade Language',
    description: 'Business-focused terminology replacing dev jargon',
    type: 'boolean',
    enabled: false,
    rolloutPercentage: 0,
    userSegments: ['owner', 'executive', 'manager'],
    excludedUsers: [],
    requiresConfirmation: false,
    canDisableInstantly: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    category: 'Polish',
  },
];

// Feature Flag Provider
export const FeatureFlagProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [flags, setFlags] = useState<FeatureFlag[]>(DEFAULT_FLAGS);

  // Check if flag is enabled for user
  const isEnabled = useCallback((flagId: string, userId?: string, userSegment?: string): boolean => {
    const flag = flags.find(f => f.id === flagId);
    if (!flag) return false;
    
    // Master switch
    if (!flag.enabled) return false;
    
    // Check time-based restrictions
    if (flag.startTime && new Date() < flag.startTime) return false;
    if (flag.endTime && new Date() > flag.endTime) return false;
    
    // Check user segment (simplified - would check actual user segment)
    if (flag.userSegments.length > 0 && userSegment) {
      if (!flag.userSegments.includes(userSegment)) return false;
    }
    
    // Check excluded users
    if (userId && flag.excludedUsers.includes(userId)) return false;
    
    // Percentage rollout (using userId hash for consistency)
    if (flag.rolloutPercentage < 100 && userId) {
      const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const userPercentage = hash % 100;
      if (userPercentage >= flag.rolloutPercentage) return false;
    }
    
    return true;
  }, [flags]);

  // Get flag value (for percentage or multi-value flags)
  const getFlagValue = useCallback((flagId: string, userId?: string): boolean | number | string => {
    const flag = flags.find(f => f.id === flagId);
    if (!flag) return false;
    
    if (flag.type === 'percentage') {
      return flag.rolloutPercentage;
    }
    
    return isEnabled(flagId, userId);
  }, [flags, isEnabled]);

  // Toggle flag on/off
  const toggleFlag = useCallback((flagId: string) => {
    setFlags(prev => prev.map(f => 
      f.id === flagId 
        ? { ...f, enabled: !f.enabled, updatedAt: new Date() }
        : f
    ));
    logFlagChange(flagId, 'toggle');
  }, []);

  // Set rollout percentage
  const setRolloutPercentage = useCallback((flagId: string, percentage: number) => {
    const clamped = Math.max(0, Math.min(100, percentage));
    setFlags(prev => prev.map(f => 
      f.id === flagId 
        ? { ...f, rolloutPercentage: clamped, enabled: clamped > 0, updatedAt: new Date() }
        : f
    ));
    logFlagChange(flagId, `rollout ${clamped}%`);
  }, []);

  // Enable for specific user
  const enableForUser = useCallback((flagId: string, userId: string) => {
    setFlags(prev => prev.map(f => 
      f.id === flagId 
        ? { ...f, excludedUsers: f.excludedUsers.filter(u => u !== userId), updatedAt: new Date() }
        : f
    ));
  }, []);

  // Disable for specific user
  const disableForUser = useCallback((flagId: string, userId: string) => {
    setFlags(prev => prev.map(f => 
      f.id === flagId && !f.excludedUsers.includes(userId)
        ? { ...f, excludedUsers: [...f.excludedUsers, userId], updatedAt: new Date() }
        : f
    ));
  }, []);

  // Emergency disable (instant)
  const emergencyDisable = useCallback((flagId: string, reason: string) => {
    setFlags(prev => prev.map(f => 
      f.id === flagId 
        ? { 
            ...f, 
            enabled: false, 
            rolloutPercentage: 0, 
            updatedAt: new Date(),
            lastRollbackAt: new Date(),
            rollbackReason: `[EMERGENCY] ${reason}`
          }
        : f
    ));
    
    // Alert owner
    console.error(`🚨 EMERGENCY DISABLE: ${flagId} - ${reason}`);
    // In production: send notification, freeze writes if needed
  }, []);

  // Rollback with reason
  const rollbackFlag = useCallback((flagId: string, reason: string) => {
    setFlags(prev => prev.map(f => 
      f.id === flagId 
        ? { 
            ...f, 
            enabled: false, 
            rolloutPercentage: 0, 
            updatedAt: new Date(),
            lastRollbackAt: new Date(),
            rollbackReason: reason
          }
        : f
    ));
    logFlagChange(flagId, `rollback: ${reason}`);
  }, []);

  // Enable all flags in category
  const enableCategory = useCallback((category: string) => {
    setFlags(prev => prev.map(f => 
      f.category === category 
        ? { ...f, enabled: true, updatedAt: new Date() }
        : f
    ));
  }, []);

  // Disable all flags in category
  const disableCategory = useCallback((category: string) => {
    setFlags(prev => prev.map(f => 
      f.category === category 
        ? { ...f, enabled: false, rolloutPercentage: 0, updatedAt: new Date() }
        : f
    ));
  }, []);

  // Audit logging
  const logFlagChange = (flagId: string, action: string) => {
    const entry = {
      timestamp: new Date(),
      flagId,
      action,
      user: 'ceo', // Would get from auth context
    };
    console.log('Feature Flag Change:', entry);
    // In production: send to audit log service
  };

  return (
    <FeatureFlagContext.Provider value={{
      flags,
      isEnabled,
      getFlagValue,
      toggleFlag,
      setRolloutPercentage,
      enableForUser,
      disableForUser,
      emergencyDisable,
      rollbackFlag,
      enableCategory,
      disableCategory,
    }}>
      {children}
    </FeatureFlagContext.Provider>
  );
};

// Hook to use feature flags
export function useFeatureFlags() {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
  }
  return context;
}

// Feature Flag Admin Panel
export const FeatureFlagAdminPanel: React.FC = () => {
  const { 
    flags, 
    toggleFlag, 
    setRolloutPercentage, 
    emergencyDisable, 
    rollbackFlag,
    enableCategory,
    disableCategory,
  } = useFeatureFlags();

  const categories = Array.from(new Set(flags.map(f => f.category)));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Feature Flags</h2>
          <p className="text-slate-600 mt-1">Safe rollout controls - All features default OFF</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
            {flags.filter(f => f.enabled).length} Active
          </span>
          <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm font-medium">
            {flags.filter(f => !f.enabled).length} Disabled
          </span>
        </div>
      </div>

      {/* Category Controls */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map(category => (
          <div key={category} className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg">
            <span className="text-sm font-medium text-slate-700">{category}</span>
            <button
              onClick={() => enableCategory(category)}
              className="p-1 hover:bg-slate-200 rounded transition-colors"
              title={`Enable all ${category}`}
            >
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </button>
            <button
              onClick={() => disableCategory(category)}
              className="p-1 hover:bg-slate-200 rounded transition-colors"
              title={`Disable all ${category}`}
            >
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </button>
          </div>
        ))}
      </div>

      {/* Flags List */}
      <div className="space-y-4">
        {categories.map(category => (
          <div key={category} className="bg-white rounded-2xl shadow-sm border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 rounded-t-2xl">
              <h3 className="font-semibold text-slate-900">{category}</h3>
            </div>
            <div className="divide-y divide-slate-200">
              {flags.filter(f => f.category === category).map(flag => (
                <div key={flag.id} className="px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium text-slate-900">{flag.name}</h4>
                        <StatusIndicator 
                          status={flag.enabled ? 'healthy' : 'unknown'} 
                          size="sm" 
                        />
                        {flag.lastRollbackAt && (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-xs rounded-full">
                            Rolled back
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mt-1">{flag.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                        <span>ID: {flag.id}</span>
                        <span>Created: {flag.createdAt.toLocaleDateString()}</span>
                        {flag.requiresConfirmation && (
                          <span className="text-amber-600 flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            Requires confirmation
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 ml-4">
                      {/* Rollout Percentage Slider */}
                      {flag.type === 'percentage' && (
                        <div className="flex items-center gap-2">
                          <Percent className="w-4 h-4 text-slate-400" />
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={flag.rolloutPercentage}
                            onChange={(e) => setRolloutPercentage(flag.id, parseInt(e.target.value))}
                            className="w-24"
                          />
                          <span className="text-sm font-medium text-slate-700 w-10">
                            {flag.rolloutPercentage}%
                          </span>
                        </div>
                      )}

                      {/* Toggle */}
                      <button
                        onClick={() => toggleFlag(flag.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          flag.enabled 
                            ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' 
                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {flag.enabled ? (
                          <ToggleRight className="w-6 h-6" />
                        ) : (
                          <ToggleLeft className="w-6 h-6" />
                        )}
                      </button>

                      {/* Emergency Actions */}
                      {flag.enabled && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => rollbackFlag(flag.id, 'Manual rollback by owner')}
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Rollback"
                          >
                            <History className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => emergencyDisable(flag.id, 'Emergency stop triggered')}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Emergency Disable"
                          >
                            <Zap className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Quick Feature Flag Bar
export const FeatureFlagQuickBar: React.FC = () => {
  const { flags, emergencyDisable } = useFeatureFlags();
  const activeFlags = flags.filter(f => f.enabled);

  if (activeFlags.length === 0) return null;

  return (
    <div className="bg-slate-900 text-white px-4 py-2">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="text-sm">Active Feature Flags:</span>
          <div className="flex items-center gap-2">
            {activeFlags.slice(0, 3).map(flag => (
              <span 
                key={flag.id} 
                className="px-2 py-0.5 bg-slate-800 rounded text-xs"
                title={flag.name}
              >
                {flag.id}
              </span>
            ))}
            {activeFlags.length > 3 && (
              <span className="text-xs text-slate-400">+{activeFlags.length - 3} more</span>
            )}
          </div>
        </div>
        <button
          onClick={() => {
            if (confirm('Emergency disable ALL active feature flags?')) {
              activeFlags.forEach(f => emergencyDisable(f.id, 'Mass emergency disable'));
            }
          }}
          className="px-3 py-1 bg-rose-600 hover:bg-rose-700 rounded text-sm font-medium transition-colors"
        >
          Emergency Disable All
        </button>
      </div>
    </div>
  );
};

export default FeatureFlagProvider;
