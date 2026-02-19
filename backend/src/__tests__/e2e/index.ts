/**
 * E2E Test Suite Index
 * Exports all end-to-end test configurations
 */

export * from './ai-features.e2e.test.js';
export * from './migration.e2e.test.js';
export * from './trial-pricing.e2e.test.js';

// Test configuration
export const E2E_CONFIG = {
  API_BASE_URL: process.env.TEST_API_URL || 'http://localhost:5000',
  TIMEOUT: 30000, // 30 seconds
  RETRY_COUNT: 3,
};

// Test categories
export const TEST_CATEGORIES = {
  AI_FEATURES: 'AI Features',
  MIGRATION: 'QuickBooks Migration',
  TRIAL: 'Trial System',
  PRICING: 'Pricing Tiers',
};
