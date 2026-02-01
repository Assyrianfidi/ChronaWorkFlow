/**
 * Backend Error Logger
 * Structured error logging with correlation IDs and context preservation
 */

import { Request, Response, NextFunction } from 'express';

export interface BackendErrorContext {
  requestId?: string;
  tenantId?: string;
  userId?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  userAgent?: string;
  ip?: string;
}

export interface BackendLoggedError {
  type: string;
  message: string;
  stack?: string;
  context: BackendErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
}

class BackendErrorLogger {
  private errorQueue: BackendLoggedError[] = [];
  private maxQueueSize = 500;

  /**
   * Log an error
   */
  logError(
    error: Error | string,
    context: BackendErrorContext = {},
    severity: BackendLoggedError['severity'] = 'medium'
  ): void {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = typeof error === 'string' ? undefined : error.stack;
    const errorType = typeof error === 'string' ? 'Error' : error.name;

    const loggedError: BackendLoggedError = {
      type: errorType,
      message: this.sanitizeErrorMessage(errorMessage),
      stack: errorStack ? this.sanitizeStack(errorStack) : undefined,
      context,
      severity,
      timestamp: Date.now(),
    };

    this.addToQueue(loggedError);

    // Log to console with structured format
    this.logToConsole(loggedError);
  }

  /**
   * Log a validation error
   */
  logValidationError(
    fieldName: string,
    errorMessage: string,
    context: BackendErrorContext = {}
  ): void {
    this.logError(
      `Validation Error: ${fieldName} - ${errorMessage}`,
      context,
      'low'
    );
  }

  /**
   * Log an authorization error
   */
  logAuthorizationError(
    errorMessage: string,
    context: BackendErrorContext = {}
  ): void {
    this.logError(
      `Authorization Error: ${errorMessage}`,
      context,
      'high'
    );
  }

  /**
   * Log an idempotency error
   */
  logIdempotencyError(
    errorMessage: string,
    context: BackendErrorContext = {}
  ): void {
    this.logError(
      `Idempotency Error: ${errorMessage}`,
      context,
      'medium'
    );
  }

  /**
   * Log a database error
   */
  logDatabaseError(
    errorMessage: string,
    context: BackendErrorContext = {}
  ): void {
    this.logError(
      `Database Error: ${errorMessage}`,
      context,
      'critical'
    );
  }

  /**
   * Express error handling middleware
   */
  errorMiddleware() {
    return (err: Error, req: Request, res: Response, next: NextFunction) => {
      const context: BackendErrorContext = {
        requestId: (req as any).requestId,
        tenantId: (req as any).tenantId,
        userId: (req as any).userId,
        endpoint: req.path,
        method: req.method,
        userAgent: req.get('user-agent'),
        ip: req.ip,
      };

      // Determine severity based on error type
      let severity: BackendLoggedError['severity'] = 'medium';
      if (err.name === 'UnauthorizedError' || err.name === 'ForbiddenError') {
        severity = 'high';
      } else if (err.name === 'ValidationError') {
        severity = 'low';
      } else if (err.message.includes('database') || err.message.includes('connection')) {
        severity = 'critical';
      }

      this.logError(err, context, severity);

      // Don't expose internal errors to clients
      const statusCode = (err as any).statusCode || 500;
      const userMessage = statusCode >= 500
        ? 'An internal error occurred. Please try again later.'
        : err.message;

      res.status(statusCode).json({
        error: {
          message: userMessage,
          requestId: context.requestId,
        },
      });
    };
  }

  /**
   * Get recent errors
   */
  getRecentErrors(count: number = 50): BackendLoggedError[] {
    return this.errorQueue.slice(-count);
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: BackendLoggedError['severity']): BackendLoggedError[] {
    return this.errorQueue.filter((e) => e.severity === severity);
  }

  /**
   * Get error rate
   */
  getErrorRate(timeWindowMs: number = 60000): number {
    const now = Date.now();
    const recentErrors = this.errorQueue.filter(
      (e) => now - e.timestamp < timeWindowMs
    );
    return recentErrors.length;
  }

  /**
   * Clear error queue
   */
  clearQueue(): void {
    this.errorQueue = [];
  }

  /**
   * Add error to queue
   */
  private addToQueue(error: BackendLoggedError): void {
    this.errorQueue.push(error);

    // Trim queue if too large
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue = this.errorQueue.slice(-this.maxQueueSize);
    }
  }

  /**
   * Log to console with structured format
   */
  private logToConsole(error: BackendLoggedError): void {
    const logLevel = this.getSeverityLogLevel(error.severity);
    const logData = {
      timestamp: new Date(error.timestamp).toISOString(),
      level: logLevel,
      type: error.type,
      message: error.message,
      context: error.context,
      severity: error.severity,
    };

    if (error.severity === 'critical' || error.severity === 'high') {
      console.error('[ERROR]', JSON.stringify(logData, null, 2));
      if (error.stack) {
        console.error('[STACK]', error.stack);
      }
    } else {
      console.warn('[ERROR]', JSON.stringify(logData, null, 2));
    }
  }

  /**
   * Get log level for severity
   */
  private getSeverityLogLevel(severity: BackendLoggedError['severity']): string {
    switch (severity) {
      case 'critical':
        return 'CRITICAL';
      case 'high':
        return 'ERROR';
      case 'medium':
        return 'WARN';
      case 'low':
        return 'INFO';
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
    
    // Remove API keys and tokens
    sanitized = sanitized.replace(/\b[A-Za-z0-9]{32,}\b/g, '[TOKEN]');
    
    return sanitized;
  }

  /**
   * Sanitize stack trace
   */
  private sanitizeStack(stack: string): string {
    // Remove file paths that might contain usernames
    return stack.replace(/\/Users\/[^\/]+/g, '/Users/[USER]')
                .replace(/C:\\Users\\[^\\]+/g, 'C:\\Users\\[USER]')
                .replace(/\/home\/[^\/]+/g, '/home/[USER]');
  }
}

// Singleton instance
const backendErrorLogger = new BackendErrorLogger();

export { backendErrorLogger, BackendErrorLogger };
export default backendErrorLogger;
