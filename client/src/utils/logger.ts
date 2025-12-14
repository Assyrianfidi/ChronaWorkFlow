// Secure logging utility that prevents sensitive data exposure
import { SECURITY_CONFIG } from "@/config/security";

type LogLevel = "error" | "warn" | "info" | "debug";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  requestId?: string;
}

class SecureLogger {
  private isProduction: boolean;
  private logLevel: LogLevel;

  constructor() {
    this.isProduction = process.env.NODE_ENV === "production";
    this.logLevel = SECURITY_CONFIG.LOGGING.level as LogLevel;
  }

  // Sanitize log data to remove sensitive information
  private sanitizeData(data: any): any {
    if (!data || typeof data !== "object") {
      return data;
    }

    const sensitiveFields = [
      "password",
      "secret",
      "token",
      "key",
      "ssn",
      "creditCard",
      "bankAccount",
      "routingNumber",
      "cvv",
      "pin",
      "auth",
      "authorization",
      "bearer",
      "jwt",
      "session",
      "cookie",
    ];

    const sanitized = Array.isArray(data) ? [] : {};

    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();

      // Check if this is a sensitive field
      if (sensitiveFields.some((field) => lowerKey.includes(field))) {
        sanitized[key] = "***REDACTED***";
      } else if (typeof value === "object" && value !== null) {
        sanitized[key] = this.sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  // Check if we should log at this level
  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };

    return levels[level] >= levels[this.logLevel];
  }

  // Create log entry
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: context ? this.sanitizeData(context) : undefined,
      userId: this.getUserId(),
      sessionId: this.getSessionId(),
      requestId: this.getRequestId(),
    };
  }

  // Get current user ID (if available)
  private getUserId(): string | undefined {
    try {
      return localStorage.getItem("userId") || undefined;
    } catch {
      return undefined;
    }
  }

  // Get current session ID (if available)
  private getSessionId(): string | undefined {
    try {
      return sessionStorage.getItem("sessionId") || undefined;
    } catch {
      return undefined;
    }
  }

  // Get current request ID (if available)
  private getRequestId(): string | undefined {
    try {
      return localStorage.getItem("requestId") || undefined;
    } catch {
      return undefined;
    }
  }

  // Log to console (development only)
  private logToConsole(entry: LogEntry): void {
    if (!SECURITY_CONFIG.LOGGING.logToConsole) return;

    const logMethod =
      entry.level === "error"
        ? "error"
        : entry.level === "warn"
          ? "warn"
          : entry.level === "info"
            ? "info"
            : "debug";

    console[logMethod](
      `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`,
      entry.context || "",
    );
  }

  // Log to file (production only)
  private async logToFile(entry: LogEntry): Promise<void> {
    if (!SECURITY_CONFIG.LOGGING.logToFile) return;

    try {
      // In a real implementation, this would send logs to a secure logging service
      // For now, we'll just log to console in development
      if (!this.isProduction) {
        this.logToConsole(entry);
      }
    } catch (error) {
      console.error("Failed to log to file:", error);
    }
  }

  // Public logging methods
  debug(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog("debug")) return;

    const entry = this.createLogEntry("debug", message, context);
    this.logToConsole(entry);
    this.logToFile(entry);
  }

  info(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog("info")) return;

    const entry = this.createLogEntry("info", message, context);
    this.logToConsole(entry);
    this.logToFile(entry);
  }

  warn(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog("warn")) return;

    const entry = this.createLogEntry("warn", message, context);
    this.logToConsole(entry);
    this.logToFile(entry);
  }

  error(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog("error")) return;

    const entry = this.createLogEntry("error", message, context);
    this.logToConsole(entry);
    this.logToFile(entry);
  }

  // Security event logging
  logSecurityEvent(event: string, details: Record<string, any>): void {
    this.warn(`SECURITY EVENT: ${event}`, {
      event,
      ...details,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      ip: "client-side", // In real app, this would be server-side
    });
  }

  // Error logging without sensitive stack traces in production
  logError(error: Error, context?: Record<string, any>): void {
    const errorContext = {
      ...context,
      message: error.message,
      // Only include stack trace in development
      stack: this.isProduction ? undefined : error.stack,
    };

    this.error(error.message, errorContext);
  }
}

// Create and export logger instance
export const logger = new SecureLogger();

// Export convenience functions
export const log = {
  debug: (message: string, context?: Record<string, any>) =>
    logger.debug(message, context),
  info: (message: string, context?: Record<string, any>) =>
    logger.info(message, context),
  warn: (message: string, context?: Record<string, any>) =>
    logger.warn(message, context),
  error: (message: string, context?: Record<string, any>) =>
    logger.error(message, context),
  security: (event: string, details: Record<string, any>) =>
    logger.logSecurityEvent(event, details),
  exception: (error: Error, context?: Record<string, any>) =>
    logger.logError(error, context),
};

export default logger;
