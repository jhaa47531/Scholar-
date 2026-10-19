import {
  AssessmentRecord,
  AuditLogEntry,
  SessionalConfig,
  SessionalNumber,
  SubmissionStatus,
  UserRole,
} from '../../types/domain.ts';

export type AssessmentCorrectionFields = Pick<
  Partial<AssessmentRecord>,
  | 'obtainedMarks'
  | 'examAttendance'
  | 'classAttendancePct'
  | 'assignmentScore'
  | 'presentationScore'
  | 'classInteractionScore'
>;

export interface AssessmentCorrectionResult {
  assessment: AssessmentRecord;
  auditLog: AuditLogEntry;
}

export interface IAssessmentRepository {
  // Sessional Configuration
  getSessionalConfig(sessionId: string, courseId: string, semester: number, sessionalNumber: SessionalNumber): Promise<SessionalConfig | null>;
  listSessionalConfigs(sessionId?: string, courseId?: string): Promise<SessionalConfig[]>;
  saveSessionalConfig(config: SessionalConfig): Promise<SessionalConfig>;

  // Assessment Records
  getAssessment(studentId: string, subjectId: string, configId: string): Promise<AssessmentRecord | null>;
  getAssessmentById(id: string): Promise<AssessmentRecord | null>;
  getSubjectAssessments(subjectId: string, configId: string): Promise<AssessmentRecord[]>;
  getStudentAssessments(studentId: string, sessionId: string, sessionalNumber?: SessionalNumber): Promise<AssessmentRecord[]>;
  
  // Workflow: Save Draft
  saveDraft(assessment: AssessmentRecord): Promise<AssessmentRecord>;
  
  // Workflow: Final Submit Batch
  finalSubmitBatch(teacherId: string, assessments: AssessmentRecord[]): Promise<AssessmentRecord[]>;
  
  // Correction
  correctAssessmentWithAudit(
    assessmentId: string,
    updates: AssessmentCorrectionFields,
    correctionReason: string,
    actorId: string,
    actorRole: UserRole,
    expectedAssessment: AssessmentRecord,
    teacherId?: string
  ): Promise<AssessmentCorrectionResult>;
}
