import {
  AssessmentConductStatus,
  AssessmentRecord,
  ExamAttendance,
  SessionalConfig,
  SessionalNumber,
  SubmissionStatus,
} from '../../types/domain.ts';
import { IAssessmentRepository } from '../interfaces/IAssessmentRepository.ts';

/**
 * Assessment Repository Implementation
 * Maps to Firestore collections: sessionalConfigs, assessments
 * Future Oracle Mapping: SPIS_SESSIONAL_CONFIGS, SPIS_ASSESSMENTS
 */
export class AssessmentRepository implements IAssessmentRepository {
  private configs: Map<string, SessionalConfig> = new Map();
  private assessments: Map<string, AssessmentRecord> = new Map();

  constructor() {
    this.seedDefaultSessionalConfigs();
  }

  private seedDefaultSessionalConfigs() {
    // Sessional 1 for BCA Sem 1, Session 2025-26
    const configS1: SessionalConfig = {
      id: 'cfg_bca_s1_sess2526',
      sessionId: 'sess_2025_26',
      courseId: 'crs_bca',
      semester: 1,
      sessionalNumber: SessionalNumber.SESSIONAL_1,
      maxMarks: 25, // Default configurable maximum
      status: AssessmentConductStatus.ACTIVE,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.configs.set(configS1.id, configS1);

    // Sessional 2 for BCA Sem 1, Session 2025-26 (Status: ACTIVE / ongoing)
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
    this.configs.set(configS2.id, configS2);

    // Initial Submitted Data for Student Aarav (BCA-101 and BCA-102 in Sessional 1)
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
    this.assessments.set(aaravSub1.id, aaravSub1);

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
    this.assessments.set(aaravSub2.id, aaravSub2);

    // Student Diya: Absent in BCA-101 (Not Attended, marks 0, explicitly flagged)
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
      examAttendance: ExamAttendance.NOT_ATTENDED, // Rule: score 0, but marked NOT_ATTENDED
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
    this.assessments.set(diyaSub1.id, diyaSub1);
  }

  async getSessionalConfig(
    sessionId: string,
    courseId: string,
    semester: number,
    sessionalNumber: SessionalNumber
  ): Promise<SessionalConfig | null> {
    for (const c of this.configs.values()) {
      if (
        c.sessionId === sessionId &&
        c.courseId === courseId &&
        c.semester === semester &&
        c.sessionalNumber === sessionalNumber
      ) {
        return c;
      }
    }
    return null;
  }

  async listSessionalConfigs(sessionId?: string, courseId?: string): Promise<SessionalConfig[]> {
    let list = Array.from(this.configs.values());
    if (sessionId) list = list.filter((c) => c.sessionId === sessionId);
    if (courseId) list = list.filter((c) => c.courseId === courseId);
    return list;
  }

  async saveSessionalConfig(config: SessionalConfig): Promise<SessionalConfig> {
    this.configs.set(config.id, config);
    return config;
  }

  async getAssessment(studentId: string, subjectId: string, configId: string): Promise<AssessmentRecord | null> {
    for (const a of this.assessments.values()) {
      if (a.studentId === studentId && a.subjectId === subjectId && a.configId === configId) {
        return a;
      }
    }
    return null;
  }

  async getSubjectAssessments(subjectId: string, configId: string): Promise<AssessmentRecord[]> {
    return Array.from(this.assessments.values()).filter(
      (a) => a.subjectId === subjectId && a.configId === configId
    );
  }

  async getStudentAssessments(
    studentId: string,
    sessionId: string,
    sessionalNumber?: SessionalNumber
  ): Promise<AssessmentRecord[]> {
    return Array.from(this.assessments.values()).filter((a) => {
      const matchStudent = a.studentId === studentId;
      const matchSession = a.sessionId === sessionId;
      const matchSessional = sessionalNumber ? a.sessionalNumber === sessionalNumber : true;
      return matchStudent && matchSession && matchSessional;
    });
  }

  async saveDraft(assessment: AssessmentRecord): Promise<AssessmentRecord> {
    const existing = this.assessments.get(assessment.id);
    if (existing && existing.submissionStatus === SubmissionStatus.FINAL_SUBMITTED) {
      throw new Error(
        'FINALIZED_ASSESSMENT_LOCKED: Cannot overwrite or downgrade an already finalized assessment via draft save. Use the authorized correction workflow instead.'
      );
    }
    const updated: AssessmentRecord = {
      ...assessment,
      submissionStatus: SubmissionStatus.DRAFT,
      updatedAt: new Date().toISOString(),
    };
    this.assessments.set(updated.id, updated);
    return updated;
  }

  async finalSubmitBatch(teacherId: string, records: AssessmentRecord[]): Promise<AssessmentRecord[]> {
    const timestamp = new Date().toISOString();
    const saved: AssessmentRecord[] = [];

    for (const rec of records) {
      const updated: AssessmentRecord = {
        ...rec,
        submissionStatus: SubmissionStatus.FINAL_SUBMITTED,
        submittingTeacherId: teacherId,
        finalSubmittedAt: timestamp,
        updatedAt: timestamp,
      };
      this.assessments.set(updated.id, updated);
      saved.push(updated);
    }
    return saved;
  }

  async updateAssessmentWithCorrection(
    assessmentId: string,
    updates: Partial<AssessmentRecord>,
    correctionReason: string,
    authorizedBy: string
  ): Promise<AssessmentRecord> {
    const existing = this.assessments.get(assessmentId);
    if (!existing) {
      throw new Error(`Assessment with ID ${assessmentId} not found`);
    }

    const updated: AssessmentRecord = {
      ...existing,
      ...updates,
      correctionReason,
      correctionAuthorizedBy: authorizedBy,
      updatedAt: new Date().toISOString(),
    };
    this.assessments.set(assessmentId, updated);
    return updated;
  }
}

export const globalAssessmentRepo = new AssessmentRepository();
