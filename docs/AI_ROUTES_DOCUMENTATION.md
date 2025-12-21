# AccuBooks AI & GTM Routes Documentation

## Overview

This document describes all AI-powered and Go-To-Market (GTM) API routes implemented in AccuBooks.

---

## Route Summary

| Route Prefix | Description | Auth Required | Rate Limited |
|--------------|-------------|---------------|--------------|
| `/api/ai` | AI Features (Categorization, Copilot, Forecast, Anomaly) | Yes | Yes |
| `/api/migration` | QuickBooks Migration (QBO/IIF Import) | Yes | Yes |
| `/api/trial` | Trial System & Activation Milestones | Yes | No |
| `/api/pricing` | Pricing Tiers & Feature Access | Partial | No |

---

## AI Routes (`/api/ai`)

### Transaction Categorization

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| POST | `/api/ai/categorize` | Categorize single transaction | 50/min |
| POST | `/api/ai/categorize/batch` | Batch categorize transactions | 50/min |
| POST | `/api/ai/categorize/feedback` | Submit categorization feedback | 50/min |
| GET | `/api/ai/categorize/accuracy` | Get accuracy metrics | 50/min |

**Request Example (Single Categorization):**
```json
POST /api/ai/categorize
{
  "description": "AMAZON WEB SERVICES AWS.AMAZON.CO",
  "amount": 150.00,
  "type": "expense"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "category": "software_subscriptions",
    "confidence": 0.95,
    "alternativeCategories": [
      { "category": "cloud_services", "confidence": 0.85 }
    ]
  }
}
```

### AI CFO Copilot

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| POST | `/api/ai/copilot/ask` | Ask natural language question | 10/min |
| GET | `/api/ai/copilot/quick-insights` | Get quick financial insights | 10/min |

**Request Example:**
```json
POST /api/ai/copilot/ask
{
  "query": "Why did profit drop this month?"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "query": "Why did profit drop this month?",
    "queryType": "analysis",
    "answer": "Profit decreased by 15% this month primarily due to...",
    "insights": ["Revenue decreased by 8%", "Operating expenses increased by 12%"],
    "recommendations": ["Review subscription costs", "Follow up on overdue invoices"],
    "dataPoints": [
      { "label": "Revenue", "value": 45000, "change": -3600, "trend": "down" }
    ],
    "confidence": 0.92,
    "processingTime": 1250
  }
}
```

### Cash Flow Forecasting

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| GET | `/api/ai/forecast` | Get cash flow forecast | 20/5min |

**Query Parameters:**
- `days` (optional): Forecast period (7, 14, or 30 days). Default: 30

**Response:**
```json
{
  "success": true,
  "data": {
    "currentCashPosition": 125000,
    "projectedCashPosition": 142000,
    "daysForecasted": 30,
    "dailyForecasts": [...],
    "riskAssessment": {
      "overallRisk": "low",
      "cashRunwayDays": 180,
      "shortfallProbability": 0.05,
      "recommendations": [...]
    },
    "insights": [...],
    "accuracy": {
      "historicalAccuracy": 0.89,
      "dataQuality": "good",
      "dataPoints": 450
    }
  }
}
```

### Anomaly Detection

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| GET | `/api/ai/anomalies` | Scan for anomalies | 30/5min |
| POST | `/api/ai/anomalies/:id/resolve` | Resolve an anomaly | 30/5min |

**Anomaly Types Detected:**
- `duplicate` - Duplicate transactions
- `unusual_amount` - Amounts outside normal range
- `mis_categorized` - Potentially wrong category
- `round_number` - Suspicious round amounts
- `weekend` - Unusual weekend transactions
- `split` - Potential split transactions
- `sequential_gap` - Missing sequence numbers

### AI Usage

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ai/usage` | Get AI feature usage stats |

---

## Migration Routes (`/api/migration`)

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| POST | `/api/migration/qbo` | Import QBO/OFX file | 5/hour |
| POST | `/api/migration/iif` | Import IIF file | 5/hour |
| GET | `/api/migration/:id/status` | Get migration status | None |
| GET | `/api/migration/supported-formats` | List supported formats | None |

**Supported File Formats:**
- `.qbo` - QuickBooks Online
- `.ofx` - Open Financial Exchange
- `.qfx` - Quicken Financial Exchange
- `.iif` - Intuit Interchange Format

**Request Example (File Upload):**
```
POST /api/migration/qbo
Content-Type: multipart/form-data

file: [QBO file]
```

**Response:**
```json
{
  "success": true,
  "data": {
    "migrationId": "mig_abc123",
    "durationMinutes": 2.5,
    "summary": {
      "accountsImported": 15,
      "transactionsImported": 450,
      "customersImported": 25,
      "vendorsImported": 12,
      "invoicesImported": 0,
      "categorizedTransactions": 428,
      "categorizationAccuracy": 0.95
    },
    "errors": [],
    "warnings": ["2 transactions had missing dates"]
  }
}
```

---

## Trial Routes (`/api/trial`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trial/state` | Get current trial state |
| POST | `/api/trial/start` | Start a new trial |
| POST | `/api/trial/milestone/:type` | Complete a milestone |
| POST | `/api/trial/convert` | Convert trial to paid |
| GET | `/api/trial/analytics` | Get trial analytics (admin) |

**Milestone Types:**
- `account_created` - Account setup complete
- `data_imported` - Data imported from file or bank
- `first_categorization` - First AI categorization used
- `first_invoice` - First invoice created
- `first_report` - First report generated
- `ai_copilot_used` - AI CFO Copilot used
- `automation_created` - First automation rule created
- `bank_connected` - Bank account connected
- `team_member_invited` - Team member invited
- `full_automation` - Full automation achieved

**Trial State Response:**
```json
{
  "success": true,
  "data": {
    "status": "active",
    "daysRemaining": 10,
    "trialStartDate": "2024-01-01",
    "trialEndDate": "2024-01-15",
    "completedMilestones": [...],
    "pendingMilestones": [...],
    "activationScore": 65,
    "activationPercentage": 65,
    "riskLevel": "low",
    "recommendedActions": [...]
  }
}
```

---

## Pricing Routes (`/api/pricing`)

### Public Endpoints (No Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pricing/tiers` | Get all pricing tiers |
| GET | `/api/pricing/compare` | Compare two tiers |

### Protected Endpoints (Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pricing/current` | Get current user tier |
| GET | `/api/pricing/feature/:name` | Check feature access |
| GET | `/api/pricing/upgrade-triggers` | Get upgrade triggers |
| POST | `/api/pricing/upgrade` | Upgrade tier |
| POST | `/api/pricing/downgrade` | Downgrade tier |
| POST | `/api/pricing/track-usage` | Track feature usage |

**Pricing Tiers:**

| Tier | Monthly | Annual | Key Features |
|------|---------|--------|--------------|
| Starter | $29 | $290 | 500 transactions, 100 AI queries |
| Pro | $99 | $990 | 2,000 transactions, 500 AI queries, 3 entities |
| Business | $299 | $2,990 | 10,000 transactions, 2,000 AI queries, 10 entities |
| Enterprise | $999 | $9,990 | Unlimited everything |

---

## Middleware Applied

### All Routes
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **JWT Authentication** - Bearer token validation
- **Request Logging** - Audit trail

### AI Routes
- **AI Rate Limiter** - Prevents abuse of AI endpoints
- **Feature Access Check** - Tier-based access control
- **Usage Tracking** - Tracks feature usage for billing

### Migration Routes
- **Migration Rate Limiter** - 5 migrations per hour
- **File Upload (Multer)** - 50MB max file size
- **File Type Validation** - Only QBO/IIF/OFX/QFX allowed

### Admin Routes
- **Role-Based Access Control** - Admin role required

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

**Common Error Codes:**
- `UNAUTHORIZED` - Missing or invalid auth token
- `FORBIDDEN` - Insufficient permissions
- `RATE_LIMITED` - Too many requests
- `FEATURE_RESTRICTED` - Feature not available in current tier
- `VALIDATION_ERROR` - Invalid request data
- `NOT_FOUND` - Resource not found

---

## Testing

E2E tests are available in `backend/src/__tests__/e2e/`:

- `ai-features.e2e.test.ts` - AI feature tests
- `migration.e2e.test.ts` - Migration tests
- `trial-pricing.e2e.test.ts` - Trial and pricing tests

Run tests with:
```bash
npm run test:e2e
```

---

## Security Considerations

1. **Rate Limiting** - All AI endpoints are rate limited to prevent abuse
2. **Authentication** - JWT tokens required for all protected routes
3. **Authorization** - Feature access controlled by pricing tier
4. **Input Validation** - All inputs validated before processing
5. **File Validation** - Uploaded files validated for type and size
6. **Audit Logging** - All requests logged for compliance

---

*Last Updated: December 2024*
