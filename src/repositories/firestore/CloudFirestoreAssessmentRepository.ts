import { randomUUID } from 'node:crypto';
import { Firestore } from 'firebase-admin/firestore';
import { IAssessmentRepository } from '../interfaces/IAssessmentRepository.ts';
import { AssessmentCorrectionFields, AssessmentCorrectionResult } from '../interfaces/IAssessmentRepository.ts';
import {
  AssessmentConductStatus,
  AssessmentRecord,
  AuditLogEntry,
  ExamAttendance,
  SessionalConfig,
  SessionalNumber,
  SubmissionStatus,
  UserRole,
} from '../../types/domain.ts';

/**
 * Cloud Firestore Assessment Repository Adapter
 * Provides persistent storage for sessional configurations and student assessments.
 * Target Collections: sessionalConfigs, assessments
 * Future Oracle Mapping: SPIS_SESSIONAL_CONFIGS, SPIS_ASSESSMENTS
 */
export class CloudFirestoreAssessmentRepository implements IAssessmentRepository {
  private db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  /**
   * Safely initializes sessional configurations and baseline assessment records if empty
   */
  async ensureInitialized(): Promise<void> {
    const configSnap = await this.db.collection('sessionalConfigs').limit(1).get();
    if (configSnap.empty) {
      console.log('[Firestore Init] Seeding initial sessional configurations to Cloud Firestore...');
      const batch = this.db.batch();

      const configS1: SessionalConfig = {
        id: 'cfg_bca_s1_sess2526',
        sessionId: 'sess_2025_26',
        courseId: 'crs_bca',
        semester: 1,
        sessionalNumber: SessionalNumber.SESSIONAL_1,
        maxMarks: 25,
        status: AssessmentConductStatus.ACTIVE,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      batch.set(this.db.collection('sessionalConfigs').doc(configS1.id), configS1);

      const configS2: SessionalConfig = {
        id: 'cfg_bca_s2_sess2526',
        sessionId: 'sess_2025_26',
        courseId: 'crs_bca',
        semester: 1,
        sessionalNumber: SessionalNumber.SESSIONAL_2,
        maxMarks: 25,
        status: AssessmentConductStatus.ACTIVE,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      batch.set(this.db.collection('sessionalConfigs').doc(configS2.id), configS2);

      // Initial Final-Submitted assessment records for Aarav Patel
      const aaravSub1: AssessmentRecord = {
        id: 'asm_aarav_bca101_s1',
        studentId: 'stu_aarav',
        subjectId: 'sub_bca101',
        configId: configS1.id,
        sessionId: 'sess_2025_26',
        semester: 1,
        sessionalNumber: SessionalNumber.SESSIONAL_1,
        obtainedMarks: 22.5,
        maxMarks: 25,
        examAttendance: ExamAttendance.ATTENDED,
        classAttendancePct: 92,
        assignmentScore: 88,
        presentationScore: 85,
        classInteractionScore: 90,
        submissionStatus: SubmissionStatus.FINAL_SUBMITTED,
        submittingTeacherId: 'tch_sharma',
        finalSubmittedAt: '2025-09-15T10:00:00Z',
        createdAt: '2025-09-15T09:30:00Z',
        updatedAt: '2025-09-15T10:00:00Z',
      };
      batch.set(this.db.collection('assessments').doc(aaravSub1.id), aaravSub1);

      const aaravSub2: AssessmentRecord = {
        id: 'asm_aarav_bca102_s1',
        studentId: 'stu_aarav',
        subjectId: 'sub_bca102',
        configId: configS1.id,
        sessionId: 'sess_2025_26',
        semester: 1,
        sessionalNumber: SessionalNumber.SESSIONAL_1,
        obtainedMarks: 20,
        maxMarks: 25,
        examAttendance: ExamAttendance.ATTENDED,
        classAttendancePct: 88,
        assignmentScore: 82,
        presentationScore: 80,
        classInteractionScore: 85,
        submissionStatus: SubmissionStatus.FINAL_SUBMITTED,
        submittingTeacherId: 'tch_sharma',
        finalSubmittedAt: '2025-09-15T10:30:00Z',
        createdAt: '2025-09-15T09:45:00Z',
        updatedAt: '2025-09-15T10:30:00Z',
      };
      batch.set(this.db.collection('assessments').doc(aaravSub2.id), aaravSub2);

      // Student Diya: Absent in BCA-101 (Score 0, NOT_ATTENDED)
      const diyaSub1: AssessmentRecord = {
        id: 'asm_diya_bca101_s1',
        studentId: 'stu_diya',
        subjectId: 'sub_bca101',
        configId: configS1.id,
        sessionId: 'sess_2025_26',
        semester: 1,
        sessionalNumber: SessionalNumber.SESSIONAL_1,
        obtainedMarks: 0,
        maxMarks: 25,
        examAttendance: ExamAttendance.NOT_ATTENDED,
        classAttendancePct: 65,
        assignmentScore: 70,
        presentationScore: 60,
        classInteractionScore: 70,
        submissionStatus: SubmissionStatus.FINAL_SUBMITTED,
        submittingTeacherId: 'tch_sharma',
        finalSubmittedAt: '2025-09-15T10:00:00Z',
        createdAt: '2025-09-15T09:30:00Z',
        updatedAt: '2025-09-15T10:00:00Z',
      };
      batch.set(this.db.collection('assessments').doc(diyaSub1.id), diyaSub1);

      await batch.commit();
      console.log('[Firestore Init] Successfully seeded initial sessional configs & assessments!');
    }
  }

  async getSessionalConfig(
    sessionId: string,
    courseId: string,
    semester: number,
    sessionalNumber: SessionalNumber
  ): Promise<SessionalConfig | null> {
    const snap = await this.db
      .collection('sessionalConfigs')
      .where('sessionId', '==', sessionId)
      .where('courseId', '==', courseId)
      .where('semester', '==', semester)
      .where('sessionalNumber', '==', sessionalNumber)
      .limit(1)
      .get();

    return snap.empty ? null : (snap.docs[0].data() as SessionalConfig);
  }

  async listSessionalConfigs(sessionId?: string, courseId?: string): Promise<SessionalConfig[]> {
    let query: FirebaseFirestore.Query = this.db.collection('sessionalConfigs');
    if (sessionId) query = query.where('sessionId', '==', sessionId);
    if (courseId) query = query.where('courseId', '==', courseId);
    const snap = await query.get();
    return snap.docs.map((d) => d.data() as SessionalConfig);
  }

  async saveSessionalConfig(config: SessionalConfig): Promise<SessionalConfig> {
    await this.db.collection('sessionalConfigs').doc(config.id).set(config);
    return config;
  }

  async getAssessment(studentId: string, subjectId: string, configId: string): Promise<AssessmentRecord | null> {
    const snap = await this.db
      .collection('assessments')
      .where('studentId', '==', studentId)
      .where('subjectId', '==', subjectId)
      .where('configId', '==', configId)
      .limit(1)
      .get();

    return snap.empty ? null : (snap.docs[0].data() as AssessmentRecord);
  }

  async getAssessmentById(id: string): Promise<AssessmentRecord | null> {
    const doc = await this.db.collection('assessments').doc(id).get();
    return doc.exists ? (doc.data() as AssessmentRecord) : null;
  }

  async getSubjectAssessments(subjectId: string, configId: string): Promise<AssessmentRecord[]> {
    const snap = await this.db
      .collection('assessments')
      .where('subjectId', '==', subjectId)
      .where('configId', '==', configId)
      .get();

    return snap.docs.map((d) => d.data() as AssessmentRecord);
  }

  async getStudentAssessments(
    studentId: string,
    sessionId: string,
    sessionalNumber?: SessionalNumber
  ): Promise<AssessmentRecord[]> {
    let query = this.db
      .collection('assessments')
      .where('studentId', '==', studentId)
      .where('sessionId', '==', sessionId);

    if (sessionalNumber !== undefined) {
      query = query.where('sessionalNumber', '==', sessionalNumber);
    }

    const snap = await query.get();
    return snap.docs.map((d) => d.data() as AssessmentRecord);
  }

  async saveDraft(assessment: AssessmentRecord): Promise<AssessmentRecord> {
    const docRef = this.db.collection('assessments').doc(assessment.id);

    return await this.db.runTransaction(async (transaction) => {
      const existingDoc = await transaction.get(docRef);
      if (existingDoc.exists) {
        const existingData = existingDoc.data() as AssessmentRecord;
        if (existingData.submissionStatus === SubmissionStatus.FINAL_SUBMITTED) {
          throw new Error(
            'FINALIZED_ASSESSMENT_LOCKED: Cannot overwrite or downgrade an already finalized assessment via draft save. Use the authorized correction workflow instead.'
          );
        }
      }

      const updated: AssessmentRecord = {
        ...assessment,
        submissionStatus: SubmissionStatus.DRAFT,
        updatedAt: new Date().toISOString(),
      };
      transaction.set(docRef, updated);
      return updated;
    });
  }

  async finalSubmitBatch(teacherId: string, records: AssessmentRecord[]): Promise<AssessmentRecord[]> {
    const timestamp = new Date().toISOString();
    const batch = this.db.batch();
    const saved: AssessmentRecord[] = [];

    for (const rec of records) {
      const updated: AssessmentRecord = {
        ...rec,
        submissionStatus: SubmissionStatus.FINAL_SUBMITTED,
        submittingTeacherId: teacherId,
        finalSubmittedAt: timestamp,
        updatedAt: timestamp,
      };
      batch.set(this.db.collection('assessments').doc(updated.id), updated);
      saved.push(updated);
    }

    await batch.commit();
    return saved;
  }

  async correctAssessmentWithAudit(
    assessmentId: string,
    updates: AssessmentCorrectionFields,
    correctionReason: string,
    actorId: string,
    actorRole: UserRole,
    expectedAssessment: AssessmentRecord,
    teacherId?: string
  ): Promise<AssessmentCorrectionResult> {
    const docRef = this.db.collection('assessments').doc(assessmentId);
    const auditRef = this.db.collection('auditLogs').doc(`aud_${randomUUID()}`);
    const teacherAssignmentsQuery = teacherId
      ? this.db
          .collection('teacherAssignments')
          .where('teacherId', '==', teacherId)
          .where('subjectId', '==', expectedAssessment.subjectId)
          .where('sessionId', '==', expectedAssessment.sessionId)
          .where('isActive', '==', true)
      : null;

    return await this.db.runTransaction(async (transaction) => {
      const [doc, assignments] = await Promise.all([
        transaction.get(docRef),
        teacherAssignmentsQuery ? transaction.get(teacherAssignmentsQuery) : Promise.resolve(null),
      ]);
      if (!doc.exists) {
        throw new Error('ASSESSMENT_NOT_FOUND');
      }

      const existing = doc.data() as AssessmentRecord;
      assertCorrectionContextMatches(existing, expectedAssessment);
      if (actorRole === UserRole.TEACHER && (!teacherId || !assignments || assignments.empty)) {
        throw new Error('UNAUTHORIZED_SUBJECT_ACCESS');
      }
      const timestamp = new Date().toISOString();
      const updated: AssessmentRecord = {
        ...existing,
        ...updates,
        correctionReason,
        correctionAuthorizedBy: actorId,
        updatedAt: timestamp,
      };
      const auditLog: AuditLogEntry = {
        id: auditRef.id,
        entityType: 'ASSESSMENT',
        entityId: assessmentId,
        action: 'CORRECTION',
        actorId,
        actorRole,
        reason: correctionReason,
        previousData: { ...existing },
        newData: { ...updated },
        timestamp,
      };

      if (this.auditFailureHook) {
        this.auditFailureHook();
      }
      transaction.set(docRef, updated);
      transaction.create(auditRef, auditLog);
      return { assessment: updated, auditLog };
    });
  }

  public auditFailureHook?: () => void;
}

function assertCorrectionContextMatches(current: AssessmentRecord, expected: AssessmentRecord): void {
  const identityFields: (keyof AssessmentRecord)[] = [
    'id',
    'studentId',
    'subjectId',
    'configId',
    'sessionId',
    'semester',
    'sessionalNumber',
    'submittingTeacherId',
  ];
  if (identityFields.some((field) => current[field] !== expected[field])) {
    throw new Error('ASSESSMENT_CONTEXT_CHANGED');
  }
}
