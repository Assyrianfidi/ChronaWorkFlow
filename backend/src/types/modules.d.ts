// TypeScript declarations for JavaScript modules

declare module "./middleware/errorHandler.js" {
  export function errorHandler(err: any, req: any, res: any, next: any): void;
  export function notFound(req: any, res: any): void;
}

declare module "./routes/report.routes.js" {
  import { Router } from "express";
  const router: Router;
  export default router;
}

declare module "./routes/user.routes.js" {
  import { Router } from "express";
  const router: Router;
  export default router;
}

declare module "../services/auditLogger.service.js" {
  export default class AuditLoggerService {
    static log(event: string, data: any): void;
    static logAuthEvent(event: any): Promise<void>;
  }
}
