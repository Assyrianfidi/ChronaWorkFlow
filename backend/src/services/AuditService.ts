import { AuditLog } from '@/models/AuditLog';
import { getRepository } from 'typeorm';

export class AuditService {
  static async logEvent(actorId: number, action: string, details: any, correlationId: string) {
    const auditLog = new AuditLog();
    auditLog.actorId = actorId;
    auditLog.action = action;
    auditLog.details = details;
    auditLog.correlationId = correlationId;
    await getRepository(AuditLog).save(auditLog);
  }
}
