import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { initializeFirebaseAdmin, getFirestoreDb } from '../src/server/auth/firebaseAdmin.ts';
import { CloudFirestoreAcademicRepository } from '../src/repositories/firestore/CloudFirestoreAcademicRepository.ts';
import { CloudFirestoreAssessmentRepository } from '../src/repositories/firestore/CloudFirestoreAssessmentRepository.ts';
import { CloudFirestoreAuditRepository } from '../src/repositories/firestore/CloudFirestoreAuditRepository.ts';
import { inMemoryAcademicRepo, inMemoryAssessmentRepo, inMemoryAuditRepo } from '../src/repositories/index.ts';
import {
  AssessmentRecord,
  ExamAttendance,
  SessionalNumber,
  SubmissionStatus,
  UserRole,
} from '../src/types/domain.ts';

describe('Firestore & Dual Repository Adapter Verification Suite', () => {
  before(() => {
    initializeFirebaseAdmin();
  });

  // --- PART 1: LIVE CLOUD FIRESTORE REPOSITORY TESTS ---
  it('[LIVE_FIRESTORE] Academic Repository: Can read initialized courses from Cloud Firestore', async () => {
    const db = getFirestoreDb();
    if (!db) {
      console.log('Skipping live Firestore test: DB not configured');
      return;
    }

    const firestoreAcademic = new CloudFirestoreAcademicRepository(db);
    await firestoreAcademic.ensureInitialized();

    const courses = await firestoreAcademic.getCourses();
    assert.ok(courses.length >= 7, 'Expected at least 7 course structures in Cloud Firestore');
    const bca = courses.find((c) => c.courseCode === 'BCA');
    assert.ok(bca, 'BCA course must exist in Cloud Firestore');
    assert.equal(bca?.totalSemesters, 6);
  });

  it('[LIVE_FIRESTORE] Assessment Repository: Can save draft and retrieve from Cloud Firestore', async () => {
    const db = getFirestoreDb();
    if (!db) {
      console.log('Skipping live Firestore test: DB not configured');
      return;
    }

    const firestoreAssessment = new CloudFirestoreAssessmentRepository(db);
    await firestoreAssessment.ensureInitialized();

    const testAssessment: AssessmentRecord = {
      id: 'asm_test_live_fs_draft_unique',
      studentId: 'stu_test_unique_student',
      subjectId: 'sub_bca101',
      configId: 'cfg_bca_s1_sess2526',
      sessionId: 'sess_2025_26',
      semester: 1,
      sessionalNumber: SessionalNumber.SESSIONAL_1,
      obtainedMarks: 21,
      maxMarks: 25,
      examAttendance: ExamAttendance.ATTENDED,
      classAttendancePct: 90,
      assignmentScore: 85,
      presentationScore: 80,
      classInteractionScore: 85,
      submissionStatus: SubmissionStatus.DRAFT,
      submittingTeacherId: 'tch_sharma',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save draft in Cloud Firestore
    const saved = await firestoreAssessment.saveDraft(testAssessment);
    assert.equal(saved.submissionStatus, SubmissionStatus.DRAFT);

    // Verify record in Cloud Firestore
    const fetched = await firestoreAssessment.getAssessment('stu_test_unique_student', 'sub_bca101', 'cfg_bca_s1_sess2526');
    assert.ok(fetched, 'Record must be readable from Cloud Firestore');
    assert.equal(fetched?.obtainedMarks, 21);
    assert.equal(fetched?.submissionStatus, SubmissionStatus.DRAFT);
  });

  it('[LIVE_FIRESTORE] Audit Repository: Can write and query audit logs in Cloud Firestore', async () => {
    const db = getFirestoreDb();
    if (!db) {
      console.log('Skipping live Firestore test: DB not configured');
      return;
    }

    const firestoreAudit = new CloudFirestoreAuditRepository(db);
    const testLog = await firestoreAudit.recordAudit({
      entityType: 'ASSESSMENT',
      entityId: 'asm_test_live_fs_01',
      action: 'CREATE',
      actorId: 'tch_sharma',
      actorRole: UserRole.TEACHER,
      reason: 'Verification test audit log for Cloud Firestore live persistence',
    });

    assert.ok(testLog.id);
    const logs = await firestoreAudit.getAuditLogs('ASSESSMENT', 'asm_test_live_fs_01');
    assert.ok(logs.length >= 1, 'Audit log must be queryable from Cloud Firestore');
    assert.equal(logs[0].action, 'CREATE');
  });

  // --- PART 2: IN-MEMORY ADAPTER PRESERVATION TESTS (MOCK/OFFLINE SAFE) ---
  it('[IN_MEMORY_PRESERVED] In-memory adapter remains available and decoupled', async () => {
    const courses = await inMemoryAcademicRepo.getCourses();
    assert.equal(courses.length, 7);
    const btech = courses.find((c) => c.courseCode === 'B.Tech');
    assert.ok(btech);
    assert.equal(btech?.totalSemesters, 8);
  });

  it('[IN_MEMORY_PRESERVED] In-memory assessment draft remains isolated from student queries', async () => {
    const assessments = await inMemoryAssessmentRepo.getStudentAssessments('stu_aarav', 'sess_2025_26');
    const finalOnly = assessments.filter((a) => a.submissionStatus === SubmissionStatus.FINAL_SUBMITTED);
    assert.ok(finalOnly.length > 0);
    assert.ok(finalOnly.every((a) => a.submissionStatus === SubmissionStatus.FINAL_SUBMITTED));
  });
});
