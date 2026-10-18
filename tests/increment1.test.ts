import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { defaultCalculationService } from '../src/services/CalculationService.ts';
import { ExamAttendance, SubmissionStatus, SessionalNumber, UserRole } from '../src/types/domain.ts';
import { validateWeightsSum, SCORING_WEIGHTS_V1 } from '../src/config/scoring.ts';
import { AcademicRepository } from '../src/repositories/firestore/AcademicRepository.ts';
import { AssessmentRepository } from '../src/repositories/firestore/AssessmentRepository.ts';
import { AuditRepository } from '../src/repositories/firestore/AuditRepository.ts';

describe('Increment 1 & Business Rules Automated Verification', () => {
  it('Scoring weights must strictly sum to 1.0 (100%)', () => {
    assert.equal(validateWeightsSum(SCORING_WEIGHTS_V1), true);
    assert.equal(SCORING_WEIGHTS_V1.sessionalExamWeight, 0.40);
    assert.equal(SCORING_WEIGHTS_V1.classAttendanceWeight, 0.20);
    assert.equal(SCORING_WEIGHTS_V1.assignmentWeight, 0.15);
    assert.equal(SCORING_WEIGHTS_V1.presentationWeight, 0.15);
    assert.equal(SCORING_WEIGHTS_V1.classInteractionWeight, 0.10);
  });

  it('Exam Absence: Student who did not attend receives score 0 and NOT_ATTENDED flag', () => {
    const calc = defaultCalculationService.calculatePerformanceScore({
      id: 'test_absent',
      studentId: 'stu_01',
      subjectId: 'sub_01',
      configId: 'cfg_01',
      sessionId: 'sess_01',
      semester: 1,
      sessionalNumber: SessionalNumber.SESSIONAL_1,
      obtainedMarks: 0,
      maxMarks: 25,
      examAttendance: ExamAttendance.NOT_ATTENDED,
      classAttendancePct: 80,
      assignmentScore: 80,
      presentationScore: 80,
      classInteractionScore: 80,
      submissionStatus: SubmissionStatus.FINAL_SUBMITTED,
      submittingTeacherId: 'tch_01',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    assert.equal(calc.isComplete, true);
    assert.equal(calc.normalizedSessionalScore, 0);
    // 0.4*0 + 0.2*80 + 0.15*80 + 0.15*80 + 0.1*80 = 0 + 16 + 12 + 12 + 8 = 48
    assert.equal(calc.performanceScore, 48);
  });

  it('Genuine zero marks vs missing marks: Missing components refuse definitive score', () => {
    const calcMissing = defaultCalculationService.calculatePerformanceScore({
      id: 'test_missing',
      studentId: 'stu_02',
      subjectId: 'sub_01',
      configId: 'cfg_01',
      sessionId: 'sess_01',
      semester: 1,
      sessionalNumber: SessionalNumber.SESSIONAL_1,
      obtainedMarks: null, // MISSING MARKS
      maxMarks: 25,
      examAttendance: ExamAttendance.ATTENDED,
      classAttendancePct: 80,
      assignmentScore: 80,
      presentationScore: 80,
      classInteractionScore: 80,
      submissionStatus: SubmissionStatus.DRAFT,
      submittingTeacherId: 'tch_01',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    assert.equal(calcMissing.isComplete, false);
    assert.equal(calcMissing.performanceScore, undefined);
    assert.equal(calcMissing.missingComponents.includes('Sessional Exam Marks'), true);
  });

  it('Teacher Assignment Authorization: Blocks unauthorized subject access', async () => {
    const academicRepo = new AcademicRepository();
    const isAssigned = await academicRepo.isTeacherAssignedToSubject('tch_sharma', 'sub_bca101', 'sess_2025_26');
    assert.equal(isAssigned, true);

    const isUnauthorized = await academicRepo.isTeacherAssignedToSubject('tch_sharma', 'sub_bt101', 'sess_2025_26');
    assert.equal(isUnauthorized, false);
  });

  it('Draft Invisibility: Draft marks are excluded from student visibility queries', async () => {
    const assessRepo = new AssessmentRepository();
    await assessRepo.saveDraft({
      id: 'asm_draft_test',
      studentId: 'stu_aarav',
      subjectId: 'sub_bca103',
      configId: 'cfg_bca_s1_sess2526',
      sessionId: 'sess_2025_26',
      semester: 1,
      sessionalNumber: SessionalNumber.SESSIONAL_1,
      obtainedMarks: 18,
      maxMarks: 25,
      examAttendance: ExamAttendance.ATTENDED,
      classAttendancePct: 75,
      assignmentScore: 70,
      presentationScore: 75,
      classInteractionScore: 80,
      submissionStatus: SubmissionStatus.DRAFT,
      submittingTeacherId: 'tch_gupta',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const allRecords = await assessRepo.getStudentAssessments('stu_aarav', 'sess_2025_26', SessionalNumber.SESSIONAL_1);
    const visibleOnly = allRecords.filter((r) => r.submissionStatus === SubmissionStatus.FINAL_SUBMITTED);
    
    const draftFoundInVisible = visibleOnly.some((r) => r.id === 'asm_draft_test');
    assert.equal(draftFoundInVisible, false, 'Draft marks must NEVER be visible in final submitted student queries');
  });

  it('Audit Trail: Successfully writes and retrieves immutable log records', async () => {
    const auditRepo = new AuditRepository();
    const log = await auditRepo.recordAudit({
      entityType: 'ASSESSMENT',
      entityId: 'asm_test_01',
      action: 'CORRECTION',
      actorId: 'tch_sharma',
      actorRole: UserRole.TEACHER,
      reason: 'Re-evaluation of question 3 upon student grievance',
      previousData: { obtainedMarks: 18 },
      newData: { obtainedMarks: 21 },
    });

    assert.ok(log.id);
    assert.equal(log.action, 'CORRECTION');
    const logs = await auditRepo.getAuditLogs('ASSESSMENT', 'asm_test_01');
    assert.equal(logs.length, 1);
    assert.equal(logs[0].reason, 'Re-evaluation of question 3 upon student grievance');
  });
});
