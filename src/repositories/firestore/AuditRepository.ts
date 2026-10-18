import { AuditLogEntry, UserRole } from '../../types/domain.ts';
import { IAuditRepository } from '../interfaces/IAuditRepository.ts';

/**
 * Audit Repository Implementation
 * Maps to Firestore collection: auditLogs
 * Future Oracle Mapping: SPIS_AUDIT_LOGS
 */
export class AuditRepository implements IAuditRepository {
  private logs: AuditLogEntry[] = [];

  constructor() {
    this.seedInitialAuditTrail();
  }

  private seedInitialAuditTrail() {
    this.logs.push({
      id: 'aud_init_01',
      entityType: 'SESSIONAL_CONFIG',
      entityId: 'cfg_bca_s1_sess2526',
      action: 'CREATE',
      actorId: 'usr_admin',
      actorRole: UserRole.ADMIN,
      reason: 'Initial setup of BCA Semester 1 Sessional 1 Configuration',
      timestamp: '2025-08-01T09:00:00Z',
    });
    this.logs.push({
      id: 'aud_init_02',
      entityType: 'ASSESSMENT',
      entityId: 'asm_aarav_bca101_s1',
      action: 'FINAL_SUBMIT',
      actorId: 'tch_sharma',
      actorRole: UserRole.TEACHER,
      reason: 'Final submission of Sessional 1 marks for BCA-101',
      timestamp: '2025-09-15T10:00:00Z',
    });
  }

  async recordAudit(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<AuditLogEntry> {
    const fullEntry: AuditLogEntry = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this.logs.unshift(fullEntry); // Newest first
    return fullEntry;
  }

  async getAuditLogs(entityType?: string, entityId?: string, limit: number = 50): Promise<AuditLogEntry[]> {
    let result = [...this.logs];
    if (entityType) {
      result = result.filter((l) => l.entityType === entityType);
    }
    if (entityId) {
      result = result.filter((l) => l.entityId === entityId);
    }
    return result.slice(0, limit);
  }
}

export const globalAuditRepo = new AuditRepository();
