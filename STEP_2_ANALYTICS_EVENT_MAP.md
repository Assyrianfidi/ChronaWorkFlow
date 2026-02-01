# STEP 2: Analytics Event Map

**Date**: January 31, 2026  
**Purpose**: Document all analytics events, their triggers, and privacy safeguards

---

## 📊 Product Analytics Events

### Authentication Events

| Event | Action | Trigger | Metadata | PII Risk |
|-------|--------|---------|----------|----------|
| `auth.login_success` | User logs in successfully | Login form submission | `method` (email/google/sso) | ✅ None (userId hashed) |
| `auth.login_failure` | Login attempt fails | Login form submission | `method`, `failureReason` | ✅ None |
| `auth.logout` | User logs out | Logout button click | None | ✅ None |
| `auth.session_expired` | Session expires | Token expiration | None | ✅ None |

### Dashboard Events

| Event | Action | Trigger | Metadata | PII Risk |
|-------|--------|---------|----------|----------|
| `dashboard.viewed` | Dashboard page loaded | Page navigation | `loadTime` (ms) | ✅ None |
| `dashboard.kpi_clicked` | KPI card clicked | Card interaction | `kpiType` | ✅ None |
| `dashboard.refresh` | Dashboard refreshed | Refresh button | None | ✅ None |

### Scenario Events

| Event | Action | Trigger | Metadata | PII Risk |
|-------|--------|---------|----------|----------|
| `scenario.created` | New scenario created | Scenario creation | `scenarioType` | ✅ None |
| `scenario.edited` | Scenario modified | Scenario edit | `scenarioType` | ✅ None |
| `scenario.deleted` | Scenario removed | Delete confirmation | `scenarioType` | ✅ None |
| `scenario.duplicated` | Scenario copied | Duplicate action | `scenarioType` | ✅ None |
| `scenario.comparison_viewed` | Comparison page viewed | Navigation | `comparisonCount` | ✅ None |
| `scenario.wizard_started` | Wizard initiated | Wizard start | `scenarioType` | ✅ None |
| `scenario.wizard_completed` | Wizard finished | Final step submit | `scenarioType`, `stepNumber` | ✅ None |
| `scenario.wizard_abandoned` | Wizard exited early | Navigation away | `scenarioType`, `stepNumber` | ✅ None |

### Forecast Events

| Event | Action | Trigger | Metadata | PII Risk |
|-------|--------|---------|----------|----------|
| `forecast.generated` | Forecast created | Generate button | `forecastType`, `confidenceScore`, `executionTime`, `dataPoints` | ✅ None |
| `forecast.viewed` | Forecast page viewed | Navigation | `forecastType`, `confidenceScore` | ✅ None |
| `forecast.regenerated` | Forecast recalculated | Regenerate button | `forecastType`, `confidenceScore` | ✅ None |
| `forecast.exported` | Forecast exported | Export action | `forecastType` | ✅ None |

### Trust Layer Events

| Event | Action | Trigger | Metadata | PII Risk |
|-------|--------|---------|----------|----------|
| `trust.calculation_explainer_opened` | Explainer expanded | Button click | `confidenceScore` | ✅ None |
| `trust.calculation_explainer_closed` | Explainer collapsed | Button click | `confidenceScore` | ✅ None |
| `trust.calculation_step_expanded` | Step details shown | Step click | `stepNumber` | ✅ None |
| `trust.assumptions_panel_viewed` | Assumptions viewed | Panel open | None | ✅ None |
| `trust.assumption_clicked` | Assumption selected | Assumption click | `assumptionSensitivity` | ✅ None |
| `trust.confidence_indicator_hovered` | Confidence hovered | Mouse hover | `confidenceScore` | ✅ None |
| `trust.confidence_indicator_clicked` | Confidence clicked | Click | `confidenceScore` | ✅ None |

---

## 🚨 Error Events

### Frontend Errors

| Event | Action | Trigger | Metadata | Severity |
|-------|--------|---------|----------|----------|
| `error.runtime_error` | JavaScript error | Unhandled exception | `errorType`, `errorMessage`, `componentName` | Medium-High |
| `error.api_error` | API call fails | Failed fetch | `apiEndpoint`, `statusCode`, `errorMessage` | Medium-Critical |
| `error.render_error` | Component render fails | Error boundary | `componentName`, `errorMessage` | High |
| `error.validation_error` | Form validation fails | Form submit | `errorMessage`, `componentName` | Low |
| `error.network_error` | Network failure | Connection loss | `errorMessage` | Medium |

### Backend Errors

| Event | Type | Trigger | Context | Severity |
|-------|------|---------|---------|----------|
| Unhandled Exception | Runtime error | Uncaught error | `requestId`, `tenantId`, `endpoint`, `method` | Critical |
| Validation Error | Input validation | Invalid request | `requestId`, `endpoint`, `fieldName` | Low |
| Authorization Error | Access denied | Unauthorized access | `requestId`, `tenantId`, `userId`, `endpoint` | High |
| Idempotency Error | Duplicate request | Idempotency check | `requestId`, `tenantId`, `operationId` | Medium |
| Database Error | DB operation fails | Query failure | `requestId`, `tenantId`, `operation` | Critical |

---

## ⚡ Performance Events

### Frontend Performance

| Event | Action | Trigger | Metadata | Sample Rate |
|-------|--------|---------|----------|-------------|
| `performance.page_load` | Page loads | Navigation | `duration`, `pageName` | 100% |
| `performance.api_call` | API request | Fetch call | `duration`, `endpoint` | 100% |
| `performance.forecast_calculation` | Forecast computed | Calculation | `duration`, `dataSize` | 100% |
| `performance.chart_render` | Chart rendered | Chart mount | `duration`, `componentName`, `dataSize` | 50% |
| `performance.component_mount` | Component mounts | React mount | `duration`, `componentName` | 10% |

### Backend Performance

| Metric | Measurement | Threshold | Alert |
|--------|-------------|-----------|-------|
| API Latency (p50) | Request duration | < 200ms | > 500ms |
| API Latency (p95) | Request duration | < 1000ms | > 2000ms |
| API Latency (p99) | Request duration | < 2000ms | > 5000ms |
| Error Rate | Failed requests | < 1% | > 5% |
| Database Query Time | Query duration | < 100ms | > 500ms |
| Redis Operation Time | Cache operation | < 10ms | > 50ms |

---

## 🔒 Privacy Safeguards

### Data Sanitization

**Automatic PII Removal**:
- ✅ Email addresses → `[EMAIL]`
- ✅ Phone numbers → `[PHONE]`
- ✅ Credit card numbers → `[CARD]`
- ✅ SSN → `[SSN]`
- ✅ API keys/tokens → `[TOKEN]`
- ✅ File paths with usernames → `/Users/[USER]`

**Hashing**:
- ✅ `userId` → SHA-256 hash (16 chars)
- ✅ `tenantId` → SHA-256 hash (16 chars)
- ✅ Session IDs → Generated, not user-identifiable

**Excluded Fields**:
- ❌ Raw email addresses
- ❌ Raw phone numbers
- ❌ Names
- ❌ Addresses
- ❌ Payment information
- ❌ Personal identifiers

### Data Retention

- **Analytics Events**: 90 days
- **Error Logs**: 30 days
- **Performance Metrics**: 7 days (aggregated: 90 days)
- **Session Data**: Session lifetime only

---

## 📈 Trust & Confidence Telemetry

### Internal Metrics (Not User-Facing)

| Metric | Purpose | Collection |
|--------|---------|------------|
| Confidence Score Distribution | Identify low-confidence forecasts | All forecasts |
| Assumptions Most Viewed | Understand user concerns | Trust layer interactions |
| High Risk Scenarios | Flag concerning outputs | Scenario risk scores |
| Forecast Regeneration Rate | Measure trust/satisfaction | Regenerate actions |
| Calculation Explainer Usage | Measure transparency demand | Explainer opens |

### Usage Insights

**What We Track**:
- ✅ Which assumptions users view most (indicates confusion)
- ✅ How often users regenerate forecasts (trust signal)
- ✅ Confidence score patterns (model credibility)
- ✅ Risk indicator engagement (risk awareness)

**What We DON'T Track**:
- ❌ Actual financial values
- ❌ Company-specific data
- ❌ Personal financial information
- ❌ Competitive intelligence

---

## 🎯 Implementation Summary

### Frontend
- **Analytics Client**: `client/src/lib/analytics.ts`
- **Error Logger**: `client/src/lib/errorLogger.ts`
- **Integration**: Automatic via global handlers + manual tracking

### Backend
- **Performance Monitor**: `server/middleware/performanceMonitor.ts`
- **Error Logger**: `server/middleware/errorLogger.ts`
- **Integration**: Express middleware + manual logging

### Shared
- **Types**: `shared/analytics/types.ts`
- **Service**: `shared/analytics/AnalyticsService.ts`

---

## ✅ Verification Checklist

- ✅ No PII in analytics payloads
- ✅ All user IDs hashed
- ✅ Error messages sanitized
- ✅ Stack traces sanitized
- ✅ Event-based tracking (not just page views)
- ✅ Structured, searchable logs
- ✅ Correlation IDs preserved
- ✅ Performance sampling configured
- ✅ Automatic error capture
- ✅ No user experience disruption

---

## 🚀 Usage Examples

### Frontend Analytics
```typescript
import analytics from '@/lib/analytics';

// Track user action
analytics.trackScenario('created', { scenarioType: 'REVENUE_INCREASE' });

// Track trust layer interaction
analytics.trackTrust('calculation_explainer_opened', { confidenceScore: 85 });

// Track performance
analytics.trackPerformance('forecast_calculation', {
  duration: 1250,
  dataSize: 1000,
});
```

### Frontend Error Logging
```typescript
import errorLogger from '@/lib/errorLogger';

// Log error with context
errorLogger.logError(error, {
  componentName: 'ForecastResultsView',
  action: 'generate_forecast',
}, 'high');

// Log API error
errorLogger.logApiError('/api/forecasts', 500, 'Internal server error');
```

### Backend Error Logging
```typescript
import backendErrorLogger from '@/middleware/errorLogger';

// Log error
backendErrorLogger.logError(error, {
  requestId: req.requestId,
  tenantId: req.tenantId,
  endpoint: req.path,
}, 'critical');

// Use middleware
app.use(backendErrorLogger.errorMiddleware());
```

### Backend Performance Monitoring
```typescript
import performanceMonitor from '@/middleware/performanceMonitor';

// Use middleware
app.use(performanceMonitor.middleware());

// Get stats
const stats = performanceMonitor.getStats('/api/forecasts');
console.log(`p95 latency: ${stats.p95}ms`);
```

---

**End of Analytics Event Map**
