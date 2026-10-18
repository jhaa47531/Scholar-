import {
  AssessmentRecord,
  SessionalConfig,
  SessionalNumber,
  SubmissionStatus,
} from '../../types/domain.ts';

export interface IAssessmentRepository {
  // Sessional Configuration
  getSessionalConfig(sessionId: string, courseId: string, semester: number, sessionalNumber: SessionalNumber): Promise<SessionalConfig | null>;
  listSessionalConfigs(sessionId?: string, courseId?: string): Promise<SessionalConfig[]>;
  saveSessionalConfig(config: SessionalConfig): Promise<SessionalConfig>;

  // Assessment Records
  getAssessment(studentId: string, subjectId: string, configId: string): Promise<AssessmentRecord | null>;
  getSubjectAssessments(subjectId: string, configId: string): Promise<AssessmentRecord[]>;
  getStudentAssessments(studentId: string, sessionId: string, sessionalNumber?: SessionalNumber): Promise<AssessmentRecord[]>;
  
  // Workflow: Save Draft
  saveDraft(assessment: AssessmentRecord): Promise<AssessmentRecord>;
  
  // Workflow: Final Submit Batch
  finalSubmitBatch(teacherId: string, assessments: AssessmentRecord[]): Promise<AssessmentRecord[]>;
  
  // Correction
  updateAssessmentWithCorrection(
    assessmentId: string,
    updates: Partial<AssessmentRecord>,
    correctionReason: string,
    authorizedBy: string
  ): Promise<AssessmentRecord>;
}
