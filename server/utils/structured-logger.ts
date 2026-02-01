import { randomUUID } from 'crypto';

export interface LogContext {
  correlationId?: string;
  requestId?: string;
  userId?: string;
  companyId?: string;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  duration?: number;
  service: string;
  version?: string;
}

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export class StructuredLogger {
  private serviceName: string;
  private version: string;
  private isEnabled: boolean;

  constructor(serviceName: string, version: string = '1.0.0') {
    this.serviceName = serviceName;
    this.version = version;
    this.isEnabled = process.env.NODE_ENV === 'production';
  }

  private createLogEntry(level: LogLevel, message: string, context?: LogContext, error?: Error, duration?: number): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: this.isEnabled ? error.stack : undefined
      } : undefined,
      duration,
      service: this.serviceName,
      version: this.version
    };
  }

  private sanitizeContext(context?: LogContext): LogContext | undefined {
    if (!context || !this.isEnabled) {
      return context;
    }

    // Remove potential PII and secrets from context
    const sanitized = { ...context };
    
    // Remove common secret patterns
    const secretKeys = ['password', 'secret', 'token', 'key', 'auth'];
    secretKeys.forEach(key => {
      if (key in sanitized) {
        delete sanitized[key];
      }
    });

    // Remove email addresses
    if (sanitized.email) {
      sanitized.email = sanitized.email.replace(/(.{2}).*(@.*)/, '$1***$2');
    }

    return sanitized;
  }

  private sanitizeErrorStack(stack?: string): string | undefined {
    if (!stack) {
      return undefined;
    }

    const lines = stack.split('\n');
    const filtered = lines.filter((line) => !line.includes('sourceMappingURL=data:application/json;base64,'));
    const joined = filtered.join('\n');

    const maxLen = 8000;
    if (joined.length <= maxLen) {
      return joined;
    }

    return joined.slice(0, maxLen) + '...';
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error, duration?: number): void {
    if (!this.isEnabled && level !== 'error') {
      return;
    }

    const entry = this.createLogEntry(level, message, this.sanitizeContext(context), error, duration);
    
    if (this.isEnabled) {
      // Production: JSON structured logging
      console.log(JSON.stringify(entry));
    } else {
      // Development: Human-readable logging
      const timestamp = entry.timestamp;
      const contextStr = context ? ` [${Object.entries(context).map(([k, v]) => `${k}=${v}`).join(', ')}]` : '';
      const durationStr = duration ? ` (${duration}ms)` : '';
      console.error(`[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}${durationStr}`);
      
      if (error && level === 'error') {
        console.error(this.sanitizeErrorStack(error.stack));
      }
    }
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.log('error', message, context, error);
  }

  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV !== 'production') {
      this.log('debug', message, context);
    }
  }

  // Performance logging
  startTimer(context?: LogContext): () => void {
    const startTime = Date.now();
    return () => {
      const duration = Date.now() - startTime;
      this.info('Operation completed', { ...context, duration });
      return duration;
    };
  }

  // Request logging
  logRequest(method: string, url: string, context?: LogContext): void {
    this.info(`${method} ${url}`, {
      ...context,
      type: 'request',
      method,
      url
    });
  }

  logResponse(method: string, url: string, statusCode: number, duration: number, context?: LogContext): void {
    const level = statusCode >= 400 ? 'warn' : 'info';
    this.log(level, `${method} ${url} - ${statusCode}`, {
      ...context,
      type: 'response',
      method,
      url,
      statusCode,
      duration
    });
  }

  // Startup/Shutdown logging
  logStartup(): void {
    this.info('Application starting', {
      type: 'startup',
      nodeVersion: process.version,
      platform: process.platform,
      pid: process.pid
    });
  }

  logReady(duration: number): void {
    this.info('Application ready', {
      type: 'ready',
      startupDuration: duration
    });
  }

  logShutdown(signal: string): void {
    this.info('Application shutting down', {
      type: 'shutdown',
      signal,
      pid: process.pid
    });
  }

  logShutdownComplete(duration: number): void {
    this.info('Application shutdown complete', {
      type: 'shutdown_complete',
      shutdownDuration: duration
    });
  }
}

// Global logger instance
export const logger = new StructuredLogger('accubooks', '1.0.0');

// Correlation ID utilities
export function generateCorrelationId(): string {
  return randomUUID();
}

export function createRequestContext(req?: any): LogContext {
  const correlationId = req?.headers['x-correlation-id'] || generateCorrelationId();
  const requestId = generateCorrelationId();
  
  return {
    correlationId,
    requestId,
    userAgent: req?.headers['user-agent'],
    ip: req?.ip || req?.connection?.remoteAddress
  };
}
