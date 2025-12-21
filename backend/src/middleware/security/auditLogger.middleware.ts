import { NextFunction, Request, Response } from "express";
import AuditLoggerService from "../../services/auditLogger.service";
import MonitoringService from "../../services/monitoring.service";

function getIp(req: Request): string {
  return (req.ip || (req.headers["x-forwarded-for"] as string) || "unknown") as string;
}

function getUserAgent(req: Request): string {
  const ua = req.get("user-agent");
  return ua || "unknown";
}

function getUser(req: any): { id?: any; email?: string } {
  return req?.user || {};
}

export function logAuthEvent(action: string, success: boolean) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = getUser(req as any);
    const details: any = {};

    if (!success) {
      details.reason = (res as any)?.locals?.authFailureReason || "Invalid credentials";
      details.bruteForce = true;
    }

    const severity = success ? "INFO" : "WARNING";

    try {
      await AuditLoggerService.logAuthEvent({
        action,
        userId: user.id ?? null,
        email: user.email ?? null,
        ip: getIp(req),
        userAgent: getUserAgent(req),
        success,
        details,
        severity,
      });
    } catch {
      // swallow
    }

    try {
      const monitoring = new (MonitoringService as any)();
      monitoring.recordAuthMetrics({
        action,
        success,
        userId: user.id,
      });
    } catch {
      // swallow
    }

    next();
  };
}

export function logDataEvent(action: string, resourceType: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = getUser(req as any);
    const severity = action === "DELETE" ? "WARNING" : "INFO";

    try {
      await AuditLoggerService.logDataEvent({
        action,
        resourceType,
        resourceId: (req as any).params?.id ?? null,
        userId: user.id ?? null,
        companyId: (req as any).user?.currentCompanyId ?? null,
        ip: getIp(req),
        userAgent: getUserAgent(req),
        success: true,
        details: {},
        severity,
      });
    } catch {
      // swallow
    }

    next();
  };
}

export function logSecurityEvent(action: string, details: any = {}) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const severity = "WARNING";

    try {
      await AuditLoggerService.logSecurityEvent({
        action,
        userId: (req as any).user?.id ?? null,
        ip: getIp(req),
        userAgent: getUserAgent(req),
        resource: details?.resource ?? null,
        details,
        severity,
      });
    } catch {
      // swallow
    }

    try {
      const monitoring = new (MonitoringService as any)();
      monitoring.recordSecurityMetrics({ action });
    } catch {
      // swallow
    }

    next();
  };
}

export function logPerformance(req: any, res: any, next: NextFunction) {
  const start = Date.now();

  res.on("finish", () => {
    try {
      const monitoring = new (MonitoringService as any)();
      monitoring.recordRequestMetrics({
        method: req.method,
        route: req.path || req.url,
        statusCode: res.statusCode,
        duration: Date.now() - start,
        success: res.statusCode < 400,
        ip: getIp(req),
        userAgent: getUserAgent(req),
      });
    } catch {
      // swallow
    }
  });

  next();
}

export function logAllRequests(req: Request, _res: Response, next: NextFunction) {
  (req as any).audit = (req as any).audit || {};
  next();
}

export function logErrors(err: any, req: Request, res: Response, next: NextFunction) {
  try {
    AuditLoggerService.logSystemEvent({
      action: "ERROR",
      details: {
        message: err?.message,
        url: (req as any).originalUrl || req.url,
      },
      severity: "ERROR",
    });
  } catch {
    // swallow
  }

  next(err);
}
