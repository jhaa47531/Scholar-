import { Firestore } from 'firebase-admin/firestore';
import { IAuditRepository } from '../interfaces/IAuditRepository.ts';
import { AuditLogEntry, UserRole } from '../../types/domain.ts';

/**
 * Cloud Firestore Audit Repository Adapter
 * Provides persistent audit trails in Cloud Firestore.
 * Target Collection: auditLogs
 * Future Oracle Mapping: SPIS_AUDIT_LOGS
 */
export class CloudFirestoreAuditRepository implements IAuditRepository {
  private db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  async ensureInitialized(): Promise<void> {
    const snap = await this.db.collection('auditLogs').limit(1).get();
    if (snap.empty) {
      console.log('[Firestore Init] Seeding baseline audit log records to Cloud Firestore...');
      const log1: AuditLogEntry = {
        id: 'aud_init_01',
        entityType: 'SESSIONAL_CONFIG',
        entityId: 'cfg_bca_s1_sess2526',
        action: 'CREATE',
        actorId: 'usr_admin',
        actorRole: UserRole.ADMIN,
        reason: 'Initial setup of BCA Semester 1 Sessional 1 Configuration',
        timestamp: '2025-08-01T09:00:00Z',
      };
      await this.db.collection('auditLogs').doc(log1.id).set(log1);
    }
  }

  async recordAudit(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<AuditLogEntry> {
    const fullEntry: AuditLogEntry = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    await this.db.collection('auditLogs').doc(fullEntry.id).set(fullEntry);
    return fullEntry;
  }

  async getAuditLogs(entityType?: string, entityId?: string, limit: number = 50): Promise<AuditLogEntry[]> {
    let query: FirebaseFirestore.Query = this.db.collection('auditLogs');
    if (entityType) query = query.where('entityType', '==', entityType);
    if (entityId) query = query.where('entityId', '==', entityId);

    const snap = await query.limit(limit).get();
    const logs = snap.docs.map((d) => d.data() as AuditLogEntry);
    // Sort descending by timestamp
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}
