// Legacy file - functionality moved to audit.service.ts
// This file is kept for backward compatibility but should not be used
export class AuditService {
  static async logEvent(_actorId: number, _action: string, _details: any, _correlationId: string) {
    console.warn('Legacy AuditService.logEvent called - use audit.service.ts instead');
  }
}
