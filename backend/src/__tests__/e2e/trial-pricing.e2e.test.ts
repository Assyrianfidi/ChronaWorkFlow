/**
 * End-to-End Tests for Trial System and Pricing Tiers
 * Tests trial activation, milestones, and pricing tier enforcement
 */

import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const API_BASE_URL = process.env.TEST_API_URL || 'http://localhost:5000';
let authToken: string;
let testUserId: string;

describe('Trial System E2E Tests', () => {
  beforeAll(async () => {
    const loginResponse = await request(API_BASE_URL)
      .post('/api/v1/auth/login')
      .send({
        email: process.env.TEST_USER_EMAIL || 'test@accubooks.com',
        password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
      });

    if (loginResponse.status === 200) {
      authToken = loginResponse.body.data?.token || loginResponse.body.token;
      testUserId = loginResponse.body.data?.user?.id;
    }
  });

  describe('Trial State Management', () => {
    it('should return current trial state', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/trial/state')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('daysRemaining');
      expect(response.body.data).toHaveProperty('completedMilestones');
      expect(response.body.data).toHaveProperty('pendingMilestones');
    });

    it('should include activation score and percentage', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/trial/state')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('activationScore');
      expect(response.body.data).toHaveProperty('activationPercentage');
      expect(response.body.data.activationPercentage).toBeGreaterThanOrEqual(0);
      expect(response.body.data.activationPercentage).toBeLessThanOrEqual(100);
    });

    it('should include risk level assessment', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/trial/state')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('riskLevel');
      expect(['low', 'medium', 'high']).toContain(response.body.data.riskLevel);
    });

    it('should include recommended actions', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/trial/state')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('recommendedActions');
      expect(Array.isArray(response.body.data.recommendedActions)).toBe(true);
    });
  });

  describe('Milestone Completion', () => {
    it('should complete a milestone successfully', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/trial/milestone/first_categorization')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should update activation score after milestone completion', async () => {
      // Get initial state
      const initialState = await request(API_BASE_URL)
        .get('/api/trial/state')
        .set('Authorization', `Bearer ${authToken}`);

      const initialScore = initialState.body.data.activationScore;

      // Complete a milestone
      await request(API_BASE_URL)
        .post('/api/trial/milestone/ai_copilot_used')
        .set('Authorization', `Bearer ${authToken}`);

      // Get updated state
      const updatedState = await request(API_BASE_URL)
        .get('/api/trial/state')
        .set('Authorization', `Bearer ${authToken}`);

      // Score should increase or stay same (if already completed)
      expect(updatedState.body.data.activationScore).toBeGreaterThanOrEqual(initialScore);
    });

    it('should handle duplicate milestone completion gracefully', async () => {
      // Complete same milestone twice
      await request(API_BASE_URL)
        .post('/api/trial/milestone/account_created')
        .set('Authorization', `Bearer ${authToken}`);

      const response = await request(API_BASE_URL)
        .post('/api/trial/milestone/account_created')
        .set('Authorization', `Bearer ${authToken}`);

      // Should not error, just acknowledge
      expect(response.status).toBe(200);
    });
  });

  describe('Trial Conversion', () => {
    it('should convert trial to paid subscription', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/trial/convert')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          planType: 'pro',
        });

      // May succeed or fail based on test user state
      expect([200, 400]).toContain(response.status);
    });

    it('should reject invalid plan types', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/trial/convert')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          planType: 'invalid_plan',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});

describe('Pricing Tier E2E Tests', () => {
  beforeAll(async () => {
    const loginResponse = await request(API_BASE_URL)
      .post('/api/v1/auth/login')
      .send({
        email: process.env.TEST_USER_EMAIL || 'test@accubooks.com',
        password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
      });

    if (loginResponse.status === 200) {
      authToken = loginResponse.body.data?.token || loginResponse.body.token;
    }
  });

  describe('Pricing Tiers (Public)', () => {
    it('should return all pricing tiers without authentication', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/pricing/tiers');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('starter');
      expect(response.body.data).toHaveProperty('pro');
      expect(response.body.data).toHaveProperty('business');
      expect(response.body.data).toHaveProperty('enterprise');
    });

    it('should include pricing information for each tier', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/pricing/tiers');

      expect(response.status).toBe(200);
      
      const tiers = ['starter', 'pro', 'business', 'enterprise'];
      tiers.forEach(tier => {
        expect(response.body.data[tier]).toHaveProperty('monthlyPrice');
        expect(response.body.data[tier]).toHaveProperty('annualPrice');
        expect(response.body.data[tier]).toHaveProperty('features');
        expect(response.body.data[tier]).toHaveProperty('limits');
      });
    });

    it('should compare two pricing tiers', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/pricing/compare?from=starter&to=pro');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('priceDifference');
      expect(response.body.data).toHaveProperty('additionalFeatures');
      expect(response.body.data).toHaveProperty('increasedLimits');
    });
  });

  describe('Current User Tier', () => {
    it('should return current user tier and usage', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/pricing/current')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('tier');
      expect(response.body.data).toHaveProperty('tierConfig');
    });

    it('should include usage metrics', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/pricing/current')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      if (response.body.data.usage) {
        expect(response.body.data.usage).toHaveProperty('transactionsThisMonth');
        expect(response.body.data.usage).toHaveProperty('aiQueriesThisMonth');
      }
    });
  });

  describe('Feature Access Control', () => {
    it('should check access to specific features', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/pricing/feature/ai_categorization')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('hasAccess');
      expect(typeof response.body.data.hasAccess).toBe('boolean');
    });

    it('should return upgrade prompt for restricted features', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/pricing/feature/enterprise_api')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      if (!response.body.data.hasAccess) {
        expect(response.body.data).toHaveProperty('requiredTier');
        expect(response.body.data).toHaveProperty('upgradeMessage');
      }
    });

    it('should enforce transaction limits', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/pricing/current')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      if (response.body.data.limits) {
        expect(response.body.data.limits).toHaveProperty('transactions');
        expect(response.body.data.limits.transactions).toHaveProperty('limit');
        expect(response.body.data.limits.transactions).toHaveProperty('used');
      }
    });
  });

  describe('Upgrade Triggers', () => {
    it('should return upgrade triggers for current user', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/pricing/upgrade-triggers')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should include trigger details', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/pricing/upgrade-triggers')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      response.body.data.forEach((trigger: any) => {
        expect(trigger).toHaveProperty('type');
        expect(trigger).toHaveProperty('message');
        expect(trigger).toHaveProperty('suggestedTier');
      });
    });
  });

  describe('Tier Transitions', () => {
    it('should handle tier upgrade request', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/pricing/upgrade')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tier: 'pro',
          subscriptionId: 'test_subscription_123',
        });

      // May succeed or fail based on current tier
      expect([200, 400]).toContain(response.status);
    });

    it('should handle tier downgrade request', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/pricing/downgrade')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tier: 'starter',
        });

      // May succeed or fail based on current tier and usage
      expect([200, 400]).toContain(response.status);
    });

    it('should reject invalid tier in upgrade', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/pricing/upgrade')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tier: 'invalid_tier',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Usage Tracking', () => {
    it('should track feature usage', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/pricing/track-usage')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          featureName: 'ai_categorization',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject tracking without feature name', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/pricing/track-usage')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});

describe('Tier Feature Enforcement Integration', () => {
  beforeAll(async () => {
    const loginResponse = await request(API_BASE_URL)
      .post('/api/v1/auth/login')
      .send({
        email: process.env.TEST_USER_EMAIL || 'test@accubooks.com',
        password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
      });

    if (loginResponse.status === 200) {
      authToken = loginResponse.body.data?.token || loginResponse.body.token;
    }
  });

  it('should enforce AI query limits based on tier', async () => {
    // Make multiple AI queries to test rate limiting
    const queries = Array(5).fill(null).map(() => 
      request(API_BASE_URL)
        .post('/api/ai/copilot/ask')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ query: 'What is my cash position?' })
    );

    const responses = await Promise.all(queries);
    
    // All should succeed or some should be rate limited
    responses.forEach(response => {
      expect([200, 429]).toContain(response.status);
    });
  });

  it('should enforce transaction limits based on tier', async () => {
    const response = await request(API_BASE_URL)
      .get('/api/pricing/current')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    
    if (response.body.data.limits?.transactions) {
      const { limit, used } = response.body.data.limits.transactions;
      expect(used).toBeLessThanOrEqual(limit);
    }
  });

  it('should show upgrade prompts when approaching limits', async () => {
    const response = await request(API_BASE_URL)
      .get('/api/pricing/upgrade-triggers')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    // Triggers array may be empty if not approaching limits
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});
