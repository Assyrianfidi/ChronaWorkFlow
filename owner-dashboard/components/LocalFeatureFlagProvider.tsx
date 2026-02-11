/**
 * Local Development Feature Flag Provider
 * All flags enabled for ChronaWorkFlow local testing
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

interface FeatureFlag {
  id: string;
  enabled: boolean;
  rolloutPercentage: number;
}

interface LocalFeatureContextType {
  flags: Record<string, FeatureFlag>;
  isEnabled: (flagId: string) => boolean;
  setRolloutPercentage: (flagId: string, percentage: number) => void;
  enableAll: () => void;
  disableAll: () => void;
}

// ALL FEATURES ENABLED FOR LOCAL TESTING
const ALL_FLAGS_ENABLED: Record<string, FeatureFlag> = {
  // Core CEO Features
  'ceoCockpit': { id: 'ceoCockpit', enabled: true, rolloutPercentage: 100 },
  'ceo.dashboard.advanced': { id: 'ceo.dashboard.advanced', enabled: true, rolloutPercentage: 100 },
  'ceo.analytics.realtime': { id: 'ceo.analytics.realtime', enabled: true, rolloutPercentage: 100 },
  'ceo_themes_enabled': { id: 'ceo_themes_enabled', enabled: true, rolloutPercentage: 100 },
  'signal_first_design': { id: 'signal_first_design', enabled: true, rolloutPercentage: 100 },
  
  // Voice Commands
  'voiceCommands': { id: 'voiceCommands', enabled: true, rolloutPercentage: 100 },
  'voice.command.engine': { id: 'voice.command.engine', enabled: true, rolloutPercentage: 100 },
  'voice.control.cockpit': { id: 'voice.control.cockpit', enabled: true, rolloutPercentage: 100 },
  'voice_commands_enabled': { id: 'voice_commands_enabled', enabled: true, rolloutPercentage: 100 },
  
  // Emergency Controls
  'emergencyControls': { id: 'emergencyControls', enabled: true, rolloutPercentage: 100 },
  'emergency.freeze': { id: 'emergency.freeze', enabled: true, rolloutPercentage: 100 },
  'emergency.rollback': { id: 'emergency.rollback', enabled: true, rolloutPercentage: 100 },
  'emergency.kill.switch': { id: 'emergency.kill.switch', enabled: true, rolloutPercentage: 100 },
  
  // What-If Simulator
  'whatIfSimulator': { id: 'whatIfSimulator', enabled: true, rolloutPercentage: 100 },
  'simulator.financial': { id: 'simulator.financial', enabled: true, rolloutPercentage: 100 },
  'simulator.scenarios': { id: 'simulator.scenarios', enabled: true, rolloutPercentage: 100 },
  
  // Multi-Region
  'multiRegionControl': { id: 'multiRegionControl', enabled: true, rolloutPercentage: 100 },
  'regions.multi.deploy': { id: 'regions.multi.deploy', enabled: true, rolloutPercentage: 100 },
  'regions.compliance': { id: 'regions.compliance', enabled: true, rolloutPercentage: 100 },
  
  // Branding
  'brandChronaWorkFlow': { id: 'brandChronaWorkFlow', enabled: true, rolloutPercentage: 100 },
  'brand.chronaworkflow.rename': { id: 'brand.chronaworkflow.rename', enabled: true, rolloutPercentage: 100 },
  'brand.logo.custom': { id: 'brand.logo.custom', enabled: true, rolloutPercentage: 100 },
  'multi_brand_support': { id: 'multi_brand_support', enabled: true, rolloutPercentage: 100 },
  'white_label_mode': { id: 'white_label_mode', enabled: true, rolloutPercentage: 100 },
  
  // AI & Automation
  'ai.operator': { id: 'ai.operator', enabled: true, rolloutPercentage: 100 },
  'ai.autopilot': { id: 'ai.autopilot', enabled: true, rolloutPercentage: 100 },
  'ai.decision.support': { id: 'ai.decision.support', enabled: true, rolloutPercentage: 100 },
  
  // Trust & Security
  'trust.dashboard': { id: 'trust.dashboard', enabled: true, rolloutPercentage: 100 },
  'compliance.auto': { id: 'compliance.auto', enabled: true, rolloutPercentage: 100 },
  'audit.chain': { id: 'audit.chain', enabled: true, rolloutPercentage: 100 },
  'public_status_page': { id: 'public_status_page', enabled: true, rolloutPercentage: 100 },
  'compliance_badges_auto': { id: 'compliance_badges_auto', enabled: true, rolloutPercentage: 100 },
  
  // Revenue
  'revenue.skeleton': { id: 'revenue.skeleton', enabled: true, rolloutPercentage: 100 },
  'growth.confidence': { id: 'growth.confidence', enabled: true, rolloutPercentage: 100 },
  
  // Safety
  'safety.confirmations': { id: 'safety.confirmations', enabled: true, rolloutPercentage: 100 },
  'safety.tb.validation': { id: 'safety.tb.validation', enabled: true, rolloutPercentage: 100 },
  'safety.rollback.enabled': { id: 'safety.rollback.enabled', enabled: true, rolloutPercentage: 100 },
  
  // Chaos Testing
  'chaos.engine': { id: 'chaos.engine', enabled: true, rolloutPercentage: 100 },
  'chaos.testing.enabled': { id: 'chaos.testing.enabled', enabled: true, rolloutPercentage: 100 },
  
  // Auditor
  'auditor.mode': { id: 'auditor.mode', enabled: true, rolloutPercentage: 100 },
  'regulator.access': { id: 'regulator.access', enabled: true, rolloutPercentage: 100 },
  
  // Themes
  'themes.dark': { id: 'themes.dark', enabled: true, rolloutPercentage: 100 },
  'themes.boardroom': { id: 'themes.boardroom', enabled: true, rolloutPercentage: 100 },
  'themes.light': { id: 'themes.light', enabled: true, rolloutPercentage: 100 },
  
  // Polish
  'motion_polish': { id: 'motion_polish', enabled: true, rolloutPercentage: 100 },
  'executive_language': { id: 'executive_language', enabled: true, rolloutPercentage: 100 },
};

const LocalFeatureContext = createContext<LocalFeatureContextType | null>(null);

export const LocalFeatureFlagProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [flags, setFlags] = useState<Record<string, FeatureFlag>>(ALL_FLAGS_ENABLED);

  const isEnabled = useCallback((flagId: string): boolean => {
    return flags[flagId]?.enabled ?? false;
  }, [flags]);

  const setRolloutPercentage = useCallback((flagId: string, percentage: number) => {
    setFlags(prev => ({
      ...prev,
      [flagId]: { ...prev[flagId], rolloutPercentage: Math.max(0, Math.min(100, percentage)) }
    }));
  }, []);

  const enableAll = useCallback(() => {
    setFlags(prev => Object.fromEntries(
      Object.entries(prev).map(([key, flag]) => [key, { ...flag, enabled: true, rolloutPercentage: 100 }])
    ));
  }, []);

  const disableAll = useCallback(() => {
    setFlags(prev => Object.fromEntries(
      Object.entries(prev).map(([key, flag]) => [key, { ...flag, enabled: false, rolloutPercentage: 0 }])
    ));
  }, []);

  return (
    <LocalFeatureContext.Provider value={{ flags, isEnabled, setRolloutPercentage, enableAll, disableAll }}>
      {children}
    </LocalFeatureContext.Provider>
  );
};

export function useLocalFeatureFlags() {
  const context = useContext(LocalFeatureContext);
  if (!context) {
    throw new Error('useLocalFeatureFlags must be used within LocalFeatureFlagProvider');
  }
  return context;
}

export default LocalFeatureFlagProvider;
