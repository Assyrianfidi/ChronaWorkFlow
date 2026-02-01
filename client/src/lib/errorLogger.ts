/**
 * Frontend Error Logger
 * Structured error logging with context preservation
 */

import analytics from './analytics';

export interface ErrorContext {
  componentName?: string;
  action?: string;
  userId?: string;
  tenantId?: string;
  url?: string;
  userAgent?: string;
  timestamp?: number;
}

export interface LoggedError {
  type: string;
  message: string;
  stack?: string;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class ErrorLogger {
  private errorQueue: LoggedError[] = [];
  private maxQueueSize = 50;

  constructor() {
    this.setupGlobalErrorHandlers();
  }

  /**
   * Log a runtime error
   */
  logError(
    error: Error | string,
    context: ErrorContext = {},
    severity: LoggedError['severity'] = 'medium'
  ): void {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = typeof error === 'string' ? undefined : error.stack;
    const errorType = typeof error === 'string' ? 'Error' : error.name;

    const loggedError: LoggedError = {
      type: errorType,
      message: this.sanitizeErrorMessage(errorMessage),
      stack: errorStack ? this.sanitizeStack(errorStack) : undefined,
      context: {
        ...context,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
      },
      severity,
    };

    // Add to queue
    this.addToQueue(loggedError);

    // Track in analytics
    analytics.trackError('runtime_error', {
      errorType: loggedError.type,
      errorMessage: loggedError.message,
      componentName: context.componentName,
      severity,
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorLogger]', loggedError);
    }

    // Send to backend
    this.sendToBackend(loggedError);
  }

  /**
   * Log an API error
   */
  logApiError(
    endpoint: string,
    statusCode: number,
    errorMessage: string,
    context: ErrorContext = {}
  ): void {
    const severity = this.getApiErrorSeverity(statusCode);

    const loggedError: LoggedError = {
      type: 'ApiError',
      message: this.sanitizeErrorMessage(errorMessage),
      context: {
        ...context,
        url: endpoint,
        timestamp: Date.now(),
      },
      severity,
    };

    this.addToQueue(loggedError);

    analytics.trackError('api_error', {
      errorType: 'ApiError',
      errorMessage: loggedError.message,
      apiEndpoint: endpoint,
      statusCode,
      severity,
    });

    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorLogger] API Error', loggedError);
    }

    this.sendToBackend(loggedError);
  }

  /**
   * Log a validation error
   */
  logValidationError(
    fieldName: string,
    errorMessage: string,
    context: ErrorContext = {}
  ): void {
    const loggedError: LoggedError = {
      type: 'ValidationError',
      message: `${fieldName}: ${this.sanitizeErrorMessage(errorMessage)}`,
      context: {
        ...context,
        timestamp: Date.now(),
      },
      severity: 'low',
    };

    this.addToQueue(loggedError);

    analytics.trackError('validation_error', {
      errorType: 'ValidationError',
      errorMessage: loggedError.message,
      componentName: context.componentName,
      severity: 'low',
    });
  }

  /**
   * Log a network error
   */
  logNetworkError(
    errorMessage: string,
    context: ErrorContext = {}
  ): void {
    const loggedError: LoggedError = {
      type: 'NetworkError',
      message: this.sanitizeErrorMessage(errorMessage),
      context: {
        ...context,
        timestamp: Date.now(),
      },
      severity: 'medium',
    };

    this.addToQueue(loggedError);

    analytics.trackError('network_error', {
      errorType: 'NetworkError',
      errorMessage: loggedError.message,
      severity: 'medium',
    });
  }

  /**
   * Get recent errors
   */
  getRecentErrors(count: number = 10): LoggedError[] {
    return this.errorQueue.slice(-count);
  }

  /**
   * Clear error queue
   */
  clearQueue(): void {
    this.errorQueue = [];
  }

  /**
   * Setup global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    // Handle unhandled errors
    window.addEventListener('error', (event) => {
      this.logError(event.error || event.message, {
        componentName: 'Global',
        action: 'unhandled_error',
      }, 'high');
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError(
        event.reason instanceof Error ? event.reason : String(event.reason),
        {
          componentName: 'Global',
          action: 'unhandled_rejection',
        },
        'high'
      );
    });
  }

  /**
   * Add error to queue
   */
  private addToQueue(error: LoggedError): void {
    this.errorQueue.push(error);

    // Trim queue if too large
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue = this.errorQueue.slice(-this.maxQueueSize);
    }
  }

  /**
   * Send error to backend
   */
  private async sendToBackend(error: LoggedError): Promise<void> {
    try {
      await fetch('/api/errors/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(error),
        keepalive: true,
      });
    } catch (err) {
      // Silently fail - don't create error loops
      if (process.env.NODE_ENV === 'development') {
        console.error('[ErrorLogger] Failed to send error to backend:', err);
      }
    }
  }

  /**
   * Sanitize error message to remove PII
   */
  private sanitizeErrorMessage(message: string): string {
    // Remove email addresses
    let sanitized = message.replace(/[\w.-]+@[\w.-]+\.\w+/g, '[EMAIL]');
    
    // Remove phone numbers
    sanitized = sanitized.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]');
    
    // Remove credit card numbers
    sanitized = sanitized.replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[CARD]');
    
    // Remove SSN
    sanitized = sanitized.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]');
    
    return sanitized;
  }

  /**
   * Sanitize stack trace
   */
  private sanitizeStack(stack: string): string {
    // Remove file paths that might contain usernames
    return stack.replace(/\/Users\/[^\/]+/g, '/Users/[USER]')
                .replace(/C:\\Users\\[^\\]+/g, 'C:\\Users\\[USER]');
  }

  /**
   * Determine API error severity based on status code
   */
  private getApiErrorSeverity(statusCode: number): LoggedError['severity'] {
    if (statusCode >= 500) return 'critical';
    if (statusCode >= 400 && statusCode < 500) return 'medium';
    return 'low';
  }
}

// Singleton instance
const errorLogger = new ErrorLogger();

export { errorLogger };
export default errorLogger;
