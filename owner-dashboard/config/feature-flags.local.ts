/**
 * ChronaWorkFlow Local Feature Flags Configuration
 * All flags enabled for local testing
 */

export const localFeatureFlags = {
  // CEO Cockpit Features
  'ceoCockpit': { enabled: true, rolloutPercentage: 100 },
  'ceo.dashboard.advanced': { enabled: true, rolloutPercentage: 100 },
  'ceo.analytics.realtime': { enabled: true, rolloutPercentage: 100 },
  
  // Voice Commands
  'voiceCommands': { enabled: true, rolloutPercentage: 100 },
  'voice.command.engine': { enabled: true, rolloutPercentage: 100 },
  'voice.control.cockpit': { enabled: true, rolloutPercentage: 100 },
  
  // Emergency Controls
  'emergencyControls': { enabled: true, rolloutPercentage: 100 },
  'emergency.freeze': { enabled: true, rolloutPercentage: 100 },
  'emergency.rollback': { enabled: true, rolloutPercentage: 100 },
  'emergency.kill.switch': { enabled: true, rolloutPercentage: 100 },
  
  // What-If Simulator
  'whatIfSimulator': { enabled: true, rolloutPercentage: 100 },
  'simulator.financial': { enabled: true, rolloutPercentage: 100 },
  'simulator.scenarios': { enabled: true, rolloutPercentage: 100 },
  
  // Multi-Region Control
  'multiRegionControl': { enabled: true, rolloutPercentage: 100 },
  'regions.multi.deploy': { enabled: true, rolloutPercentage: 100 },
  'regions.compliance': { enabled: true, rolloutPercentage: 100 },
  
  // Branding
  'brandChronaWorkFlow': { enabled: true, rolloutPercentage: 100 },
  'brand.chronaworkflow.rename': { enabled: true, rolloutPercentage: 100 },
  'brand.logo.custom': { enabled: true, rolloutPercentage: 100 },
  
  // AI & Automation
  'ai.operator': { enabled: true, rolloutPercentage: 100 },
  'ai.autopilot': { enabled: true, rolloutPercentage: 100 },
  'ai.decision.support': { enabled: true, rolloutPercentage: 100 },
  
  // Trust & Security
  'trust.dashboard': { enabled: true, rolloutPercentage: 100 },
  'compliance.auto': { enabled: true, rolloutPercentage: 100 },
  'audit.chain': { enabled: true, rolloutPercentage: 100 },
  
  // Revenue & Growth
  'revenue.skeleton': { enabled: true, rolloutPercentage: 100 },
  'growth.confidence': { enabled: true, rolloutPercentage: 100 },
  
  // Safety Features
  'safety.confirmations': { enabled: true, rolloutPercentage: 100 },
  'safety.tb.validation': { enabled: true, rolloutPercentage: 100 },
  'safety.rollback.enabled': { enabled: true, rolloutPercentage: 100 },
  
  // Chaos & Testing
  'chaos.engine': { enabled: true, rolloutPercentage: 100 },
  'chaos.testing.enabled': { enabled: true, rolloutPercentage: 100 },
  
  // Auditor & Compliance
  'auditor.mode': { enabled: true, rolloutPercentage: 100 },
  'regulator.access': { enabled: true, rolloutPercentage: 100 },
  
  // Themes
  'themes.dark': { enabled: true, rolloutPercentage: 100 },
  'themes.boardroom': { enabled: true, rolloutPercentage: 100 },
  'themes.light': { enabled: true, rolloutPercentage: 100 },
};

export default localFeatureFlags;
