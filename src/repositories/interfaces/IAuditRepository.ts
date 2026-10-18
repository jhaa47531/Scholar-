import { AuditLogEntry } from '../../types/domain.ts';

export interface IAuditRepository {
  recordAudit(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<AuditLogEntry>;
  getAuditLogs(entityType?: string, entityId?: string, limit?: number): Promise<AuditLogEntry[]>;
}
