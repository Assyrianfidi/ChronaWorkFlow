# STEP 2: Error Taxonomy

**Date**: January 31, 2026  
**Purpose**: Classify errors by type, source, and handling strategy

---

## 🎯 Error Classification Framework

### By Source

1. **User Errors** - Caused by user input or actions
2. **System Errors** - Infrastructure or service failures
3. **Data Errors** - Invalid or corrupted data
4. **Integration Errors** - Third-party service failures

### By Severity

1. **Low** - Minor issues, no user impact
2. **Medium** - Degraded experience, workarounds available
3. **High** - Feature unavailable, significant impact
4. **Critical** - System down, data loss risk

### By Recovery Strategy

1. **Retry** - Transient errors, automatic retry
2. **User Action** - Requires user correction
3. **Manual Intervention** - Requires admin/dev action
4. **Graceful Degradation** - Continue with reduced functionality

---

## 📊 Frontend Error Types

### 1. Runtime Errors

**Type**: `runtime_error`  
**Source**: User/System  
**Severity**: Medium-High  
**Examples**:
- Uncaught exceptions in event handlers
- Null pointer dereferences
- Type errors in JavaScript

**Handling**:
- Capture via global error handler
- Log to backend with component context
- Show user-friendly error message
- Preserve user data where possible

**Recovery**: Reload component or page

---

### 2. API Errors

**Type**: `api_error`  
**Source**: System/Integration  
**Severity**: Medium-Critical  
**Examples**:
- 400 Bad Request - User error
- 401 Unauthorized - Auth failure
- 403 Forbidden - Permission denied
- 404 Not Found - Resource missing
- 500 Internal Server Error - System failure
- 503 Service Unavailable - Overload

**Handling**:
```typescript
// 4xx errors - User action required
if (statusCode >= 400 && statusCode < 500) {
  errorLogger.logApiError(endpoint, statusCode, message, context);
  showUserMessage(message);
  severity = 'medium';
}

// 5xx errors - System failure
if (statusCode >= 500) {
  errorLogger.logApiError(endpoint, statusCode, message, context);
  showUserMessage('Service temporarily unavailable. Please try again.');
  severity = 'critical';
  scheduleRetry();
}
```

**Recovery**: 
- 4xx: User correction
- 5xx: Automatic retry with exponential backoff

---

### 3. Render Errors

**Type**: `render_error`  
**Source**: User/Data  
**Severity**: High  
**Examples**:
- Component throws during render
- Invalid props passed to component
- Missing required data

**Handling**:
- Capture via Error Boundary
- Log with component name and props (sanitized)
- Show fallback UI
- Preserve application state

**Recovery**: Reload component or show error state

---

### 4. Validation Errors

**Type**: `validation_error`  
**Source**: User  
**Severity**: Low  
**Examples**:
- Invalid email format
- Required field missing
- Number out of range
- Date in past when future required

**Handling**:
- Show inline validation message
- Log for analytics (not errors)
- Prevent form submission
- Highlight invalid fields

**Recovery**: User correction

---

### 5. Network Errors

**Type**: `network_error`  
**Source**: System  
**Severity**: Medium  
**Examples**:
- Connection timeout
- DNS resolution failure
- CORS error
- Network offline

**Handling**:
- Detect via fetch rejection
- Show offline indicator
- Queue requests for retry
- Enable offline mode if applicable

**Recovery**: Automatic retry when online

---

## 🖥️ Backend Error Types

### 1. Unhandled Exceptions

**Type**: `UnhandledException`  
**Source**: System  
**Severity**: Critical  
**Examples**:
- Uncaught promise rejections
- Null pointer exceptions
- Type errors
- Out of memory

**Handling**:
```typescript
process.on('uncaughtException', (error) => {
  backendErrorLogger.logError(error, {
    requestId: 'N/A',
    endpoint: 'N/A',
  }, 'critical');
  
  // Graceful shutdown
  server.close(() => {
    process.exit(1);
  });
});
```

**Recovery**: Process restart (via PM2/Docker)

---

### 2. Validation Errors

**Type**: `ValidationError`  
**Source**: User  
**Severity**: Low  
**Examples**:
- Invalid request body
- Missing required fields
- Type mismatch
- Business rule violation

**Handling**:
```typescript
if (!isValid(requestBody)) {
  backendErrorLogger.logValidationError(
    fieldName,
    validationMessage,
    { requestId, endpoint }
  );
  
  return res.status(400).json({
    error: {
      message: 'Validation failed',
      fields: validationErrors,
      requestId,
    },
  });
}
```

**Recovery**: User correction

---

### 3. Authorization Errors

**Type**: `AuthorizationError`  
**Source**: User/System  
**Severity**: High  
**Examples**:
- Invalid JWT token
- Expired session
- Insufficient permissions
- Tenant isolation violation

**Handling**:
```typescript
if (!isAuthorized(user, resource)) {
  backendErrorLogger.logAuthorizationError(
    'Access denied to resource',
    { requestId, tenantId, userId, endpoint }
  );
  
  return res.status(403).json({
    error: {
      message: 'Access denied',
      requestId,
    },
  });
}
```

**Recovery**: User login or permission grant

---

### 4. Idempotency Errors

**Type**: `IdempotencyError`  
**Source**: User/System  
**Severity**: Medium  
**Examples**:
- Duplicate operation detected
- Idempotency key mismatch
- Operation already completed

**Handling**:
```typescript
const existingOperation = await checkIdempotency(idempotencyKey);

if (existingOperation) {
  backendErrorLogger.logIdempotencyError(
    'Duplicate operation detected',
    { requestId, tenantId, operationId: idempotencyKey }
  );
  
  // Return existing result
  return res.status(200).json(existingOperation.result);
}
```

**Recovery**: Return cached result

---

### 5. Database Errors

**Type**: `DatabaseError`  
**Source**: System/Data  
**Severity**: Critical  
**Examples**:
- Connection pool exhausted
- Query timeout
- Constraint violation
- Deadlock detected

**Handling**:
```typescript
try {
  await prisma.transaction.create({ data });
} catch (error) {
  if (error.code === 'P2002') {
    // Unique constraint violation
    backendErrorLogger.logDatabaseError(
      'Duplicate record',
      { requestId, tenantId }
    );
    return res.status(409).json({ error: 'Record already exists' });
  }
  
  // Other database errors
  backendErrorLogger.logDatabaseError(
    error.message,
    { requestId, tenantId }
  );
  
  return res.status(500).json({ error: 'Database error' });
}
```

**Recovery**: Retry with exponential backoff

---

## 🔄 Error Handling Patterns

### Pattern 1: Graceful Degradation

```typescript
try {
  const forecast = await generateForecast(data);
  return forecast;
} catch (error) {
  errorLogger.logError(error, context, 'high');
  
  // Return cached forecast if available
  const cachedForecast = await getCachedForecast(data.id);
  if (cachedForecast) {
    return { ...cachedForecast, cached: true };
  }
  
  // Return simplified forecast
  return generateSimplifiedForecast(data);
}
```

### Pattern 2: Circuit Breaker

```typescript
class CircuitBreaker {
  private failures = 0;
  private threshold = 5;
  private timeout = 60000; // 1 minute
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      throw new Error('Circuit breaker is OPEN');
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }
  
  private onFailure() {
    this.failures++;
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
      setTimeout(() => {
        this.state = 'HALF_OPEN';
      }, this.timeout);
    }
  }
}
```

### Pattern 3: Retry with Exponential Backoff

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Max retries exceeded');
}
```

### Pattern 4: Error Boundary (React)

```typescript
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    errorLogger.logError(error, {
      componentName: errorInfo.componentStack,
      action: 'render',
    }, 'high');
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    
    return this.props.children;
  }
}
```

---

## 📈 Error Monitoring Metrics

### Key Metrics

| Metric | Calculation | Threshold | Alert |
|--------|-------------|-----------|-------|
| Error Rate | Errors / Total Requests | < 1% | > 5% |
| Critical Error Rate | Critical Errors / Total Errors | < 0.1% | > 1% |
| Mean Time to Detection (MTTD) | Time to first alert | < 5 min | > 15 min |
| Mean Time to Resolution (MTTR) | Time to fix | < 1 hour | > 4 hours |
| Error Recurrence Rate | Repeat Errors / Total Errors | < 10% | > 25% |

### Dashboards

**Real-Time Monitoring**:
- Error count (last hour)
- Error rate trend
- Top 10 errors by frequency
- Critical errors (immediate attention)

**Historical Analysis**:
- Error trends (daily/weekly)
- Error distribution by type
- Error distribution by severity
- Most common error messages

---

## ✅ Error Handling Checklist

### Frontend
- ✅ Global error handler installed
- ✅ Error boundaries on major components
- ✅ API error handling with user messages
- ✅ Network error detection
- ✅ Validation error display
- ✅ Error logging to backend
- ✅ User-friendly error messages
- ✅ No raw stack traces shown

### Backend
- ✅ Global exception handler
- ✅ Express error middleware
- ✅ Validation error handling
- ✅ Authorization error handling
- ✅ Database error handling
- ✅ Idempotency error handling
- ✅ Structured error logging
- ✅ Correlation IDs preserved
- ✅ PII sanitization
- ✅ Stack trace sanitization

---

**End of Error Taxonomy**
