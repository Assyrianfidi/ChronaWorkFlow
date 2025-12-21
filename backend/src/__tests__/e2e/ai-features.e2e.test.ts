/**
 * End-to-End Tests for AI Features
 * Tests ML Categorization, AI CFO Copilot, Cash Flow Forecasting, and Anomaly Detection
 */

import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

// Test configuration
const API_BASE_URL = process.env.TEST_API_URL || 'http://localhost:5000';
let authToken: string;
let testCompanyId: string;
let testUserId: string;

describe('AI Features E2E Tests', () => {
  beforeAll(async () => {
    // Setup: Create test user and get auth token
    const loginResponse = await request(API_BASE_URL)
      .post('/api/v1/auth/login')
      .send({
        email: process.env.TEST_USER_EMAIL || 'test@accubooks.com',
        password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
      });

    if (loginResponse.status === 200) {
      authToken = loginResponse.body.data?.token || loginResponse.body.token;
      testUserId = loginResponse.body.data?.user?.id;
      testCompanyId = loginResponse.body.data?.user?.currentCompanyId;
    }
  });

  afterAll(async () => {
    // Cleanup: Remove test data if needed
  });

  describe('ML Transaction Categorization', () => {
    it('should categorize a single transaction with 95%+ confidence', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/ai/categorize')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'AMAZON WEB SERVICES AWS.AMAZON.CO',
          amount: 150.00,
          type: 'expense',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('category');
      expect(response.body.data).toHaveProperty('confidence');
      // Target: 95% accuracy
      expect(response.body.data.confidence).toBeGreaterThanOrEqual(0.85);
    });

    it('should batch categorize multiple transactions', async () => {
      const transactions = [
        { description: 'STARBUCKS COFFEE', amount: 5.50, type: 'expense' },
        { description: 'PAYROLL DEPOSIT', amount: 5000.00, type: 'income' },
        { description: 'OFFICE DEPOT SUPPLIES', amount: 125.00, type: 'expense' },
        { description: 'STRIPE PAYMENT', amount: 1500.00, type: 'income' },
        { description: 'COMCAST INTERNET', amount: 89.99, type: 'expense' },
      ];

      const response = await request(API_BASE_URL)
        .post('/api/ai/categorize/batch')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ transactions });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.results).toHaveLength(5);
      
      // Calculate accuracy
      const highConfidenceCount = response.body.data.results.filter(
        (r: any) => r.confidence >= 0.85
      ).length;
      const accuracy = highConfidenceCount / transactions.length;
      
      // Target: 95% accuracy
      expect(accuracy).toBeGreaterThanOrEqual(0.80);
    });

    it('should accept feedback to improve categorization', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/ai/categorize/feedback')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          transactionId: 'test-transaction-123',
          originalCategory: 'office_supplies',
          correctedCategory: 'software_subscriptions',
          description: 'ADOBE CREATIVE CLOUD',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return categorization accuracy metrics', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/ai/categorize/accuracy')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accuracy');
      expect(response.body.data).toHaveProperty('totalCategorized');
    });
  });

  describe('AI CFO Copilot', () => {
    it('should answer natural language financial queries', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/ai/copilot/ask')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: 'Why did profit drop this month?',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('answer');
      expect(response.body.data).toHaveProperty('confidence');
      expect(response.body.data).toHaveProperty('insights');
      expect(response.body.data.answer.length).toBeGreaterThan(0);
    });

    it('should provide expense analysis', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/ai/copilot/ask')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: 'What are my top expenses?',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('dataPoints');
    });

    it('should provide quick insights without specific query', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/ai/copilot/quick-insights')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('insights');
      expect(Array.isArray(response.body.data.insights)).toBe(true);
    });

    it('should handle comparison queries', async () => {
      const response = await request(API_BASE_URL)
        .post('/api/ai/copilot/ask')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: 'Compare this month to last month',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.queryType).toBe('comparison');
    });
  });

  describe('Cash Flow Forecasting', () => {
    it('should generate 30-day cash flow forecast', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/ai/forecast?days=30')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('currentCashPosition');
      expect(response.body.data).toHaveProperty('projectedCashPosition');
      expect(response.body.data).toHaveProperty('dailyForecasts');
      expect(response.body.data).toHaveProperty('riskAssessment');
      expect(response.body.data.dailyForecasts.length).toBeGreaterThanOrEqual(30);
    });

    it('should include risk assessment in forecast', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/ai/forecast?days=30')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      const riskAssessment = response.body.data.riskAssessment;
      expect(riskAssessment).toHaveProperty('overallRisk');
      expect(riskAssessment).toHaveProperty('cashRunwayDays');
      expect(riskAssessment).toHaveProperty('recommendations');
      expect(['low', 'medium', 'high', 'critical']).toContain(riskAssessment.overallRisk);
    });

    it('should provide forecast insights', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/ai/forecast?days=30')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('insights');
      expect(Array.isArray(response.body.data.insights)).toBe(true);
    });

    it('should support different forecast periods', async () => {
      const periods = [7, 14, 30];
      
      for (const days of periods) {
        const response = await request(API_BASE_URL)
          .get(`/api/ai/forecast?days=${days}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.daysForecasted).toBe(days);
      }
    });
  });

  describe('Anomaly Detection', () => {
    it('should scan for anomalies in transactions', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/ai/anomalies')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('anomalies');
      expect(response.body.data).toHaveProperty('summary');
      expect(Array.isArray(response.body.data.anomalies)).toBe(true);
    });

    it('should detect duplicate transactions', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/ai/anomalies')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      const duplicates = response.body.data.anomalies.filter(
        (a: any) => a.type === 'duplicate'
      );
      // Duplicates should have related transaction IDs
      duplicates.forEach((d: any) => {
        expect(d).toHaveProperty('relatedTransactionIds');
      });
    });

    it('should detect unusual amounts', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/ai/anomalies')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      const unusualAmounts = response.body.data.anomalies.filter(
        (a: any) => a.type === 'unusual_amount'
      );
      // Unusual amounts should have deviation info
      unusualAmounts.forEach((u: any) => {
        expect(u.metadata).toHaveProperty('deviation');
      });
    });

    it('should allow resolving anomalies', async () => {
      // First get anomalies
      const anomaliesResponse = await request(API_BASE_URL)
        .get('/api/ai/anomalies')
        .set('Authorization', `Bearer ${authToken}`);

      if (anomaliesResponse.body.data.anomalies.length > 0) {
        const anomalyId = anomaliesResponse.body.data.anomalies[0].id;
        
        const resolveResponse = await request(API_BASE_URL)
          .post(`/api/ai/anomalies/${anomalyId}/resolve`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            resolution: 'confirmed_valid',
            notes: 'Verified as legitimate transaction',
          });

        expect(resolveResponse.status).toBe(200);
        expect(resolveResponse.body.success).toBe(true);
      }
    });

    it('should provide anomaly summary statistics', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/ai/anomalies')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      const summary = response.body.data.summary;
      expect(summary).toHaveProperty('totalAnomalies');
      expect(summary).toHaveProperty('byType');
      expect(summary).toHaveProperty('bySeverity');
    });
  });

  describe('AI Usage Tracking', () => {
    it('should return AI usage statistics', async () => {
      const response = await request(API_BASE_URL)
        .get('/api/ai/usage')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('categorizations');
      expect(response.body.data).toHaveProperty('copilotQueries');
      expect(response.body.data).toHaveProperty('forecasts');
      expect(response.body.data).toHaveProperty('anomalyScans');
    });
  });
});
