import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/server/app.ts';
import { initializeFirebaseAdmin, getFirestoreDb } from '../src/server/auth/firebaseAdmin.ts';
import { initializeRepositories, activeAcademicRepo, activeAssessmentRepo, activeAuditRepo } from '../src/repositories/index.ts';
import {
  ExamAttendance,
  SessionalNumber,
  SubmissionStatus,
  UserRole,
} from '../src/types/domain.ts';

const app = createApp();

const ADMIN_TOKEN = 'SPIS_SECURE_TOKEN_admin@institution.edu';
const TEACHER_SHARMA_TOKEN = 'SPIS_SECURE_TOKEN_sharma@faculty.edu';
const STUDENT_AARAV_TOKEN = 'SPIS_SECURE_TOKEN_aarav.patel@student.edu';
const STUDENT_DIYA_TOKEN = 'SPIS_SECURE_TOKEN_diya.sharma@student.edu';

describe('Complete Academic Assessment End-to-End Workflow', () => {
  before(async () => {
    initializeFirebaseAdmin();
    await initializeRepositories();
  });

  const uniqueSuffix = Date.now().toString().slice(-4);
  const testStudentId = `stu_e2e_${uniqueSuffix}`;
  const testTeacherId = `tch_e2e_${uniqueSuffix}`;
  const testTeacherEmail = `teacher.e2e.${uniqueSuffix}@faculty.edu`;
  const testStudentEmail = `student.e2e.${uniqueSuffix}@student.edu`;
  const testSubjectId = 'sub_bca102'; // Programming in C Language
  const testSessionId = 'sess_2025_26';

  it('Step 1: Admin registers new Teacher and Student accounts', async () => {
    // 1. Create Teacher User & Profile
    await activeAcademicRepo.createUser({
      id: `usr_${testTeacherId}`,
      email: testTeacherEmail,
      displayName: `Prof. Test Faculty ${uniqueSuffix}`,
      role: UserRole.TEACHER,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const teacher = await activeAcademicRepo.createTeacher({
      id: testTeacherId,
      userId: `usr_${testTeacherId}`,
      employeeCode: `EMP-${uniqueSuffix}`,
      name: `Prof. Test Faculty ${uniqueSuffix}`,
      email: testTeacherEmail,
      department: 'Computer Science',
      designation: 'Assistant Professor',
      isActive: true,
      createdAt: new Date().toISOString(),
    });
    assert.equal(teacher.id, testTeacherId);

    // 2. Create Student User & Profile
    await activeAcademicRepo.createUser({
      id: `usr_${testStudentId}`,
      email: testStudentEmail,
      displayName: `Test Student ${uniqueSuffix}`,
      role: UserRole.STUDENT,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const student = await activeAcademicRepo.createStudent({
      id: testStudentId,
      userId: `usr_${testStudentId}`,
      enrollmentNo: `EN${uniqueSuffix}`,
      rollNo: `ROLL-${uniqueSuffix}`,
      name: `Test Student ${uniqueSuffix}`,
      email: testStudentEmail,
      courseId: 'crs_bca',
      currentSemester: 1,
      admissionSessionId: testSessionId,
      isActive: true,
      createdAt: new Date().toISOString(),
    });
    assert.equal(student.id, testStudentId);
  });

  it('Step 2: Admin assigns the Teacher to Subject for Academic Session', async () => {
    const res = await request(app)
      .post('/api/academic/assignments')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({
        teacherId: testTeacherId,
        subjectId: testSubjectId,
        sessionId: testSessionId,
        semester: 1,
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.teacherId, testTeacherId);
    assert.equal(res.body.data.subjectId, testSubjectId);
  });

  it('Step 3: Admin configures Sessional 1 with configurable Maximum Marks (25)', async () => {
    const res = await request(app)
      .post('/api/assessments/configs')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({
        sessionId: testSessionId,
        courseId: 'crs_bca',
        semester: 1,
        sessionalNumber: 1,
        maxMarks: 25,
        status: 'ACTIVE',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.maxMarks, 25);
  });

  it('Step 4: Teacher loads subject assessment sheet and verifies student enrollment', async () => {
    const teacherToken = `SPIS_SECURE_TOKEN_${testTeacherEmail}`;

    const res = await request(app)
      .get(`/api/assessments/teacher/subject-sheet?subjectId=${testSubjectId}&sessionId=${testSessionId}&sessionalNumber=1`)
      .set('Authorization', `Bearer ${teacherToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.rows.length >= 1);
    const studentRow = res.body.data.rows.find((r: any) => r.student.id === testStudentId);
    assert.ok(studentRow, 'Newly created student must appear on teacher sheet');
  });

  it('Step 5: Teacher saves assessment Draft (Must remain strictly invisible to student)', async () => {
    const teacherToken = `SPIS_SECURE_TOKEN_${testTeacherEmail}`;

    const draftPayload = {
      assessment: {
        id: `asm_${testStudentId}_${testSubjectId}_s1`,
        studentId: testStudentId,
        subjectId: testSubjectId,
        configId: `cfg_crs_bca_s1_${testSessionId}`,
        sessionId: testSessionId,
        semester: 1,
        sessionalNumber: SessionalNumber.SESSIONAL_1,
        obtainedMarks: 23,
        maxMarks: 25,
        examAttendance: ExamAttendance.ATTENDED,
        classAttendancePct: 92,
        assignmentScore: 88,
        presentationScore: 85,
        classInteractionScore: 90,
      },
    };

    const resDraft = await request(app)
      .post('/api/assessments/draft')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send(draftPayload);

    assert.equal(resDraft.status, 200);
    assert.equal(resDraft.body.success, true);
    assert.equal(resDraft.body.data.submissionStatus, SubmissionStatus.DRAFT);

    // Verify student viewing marks: Draft MUST NOT appear
    const studentToken = `SPIS_SECURE_TOKEN_${testStudentEmail}`;
    const resStudentMarks = await request(app)
      .get(`/api/assessments/student/marks?sessionId=${testSessionId}`)
      .set('Authorization', `Bearer ${studentToken}`);

    assert.equal(resStudentMarks.status, 200);
    const draftFound = resStudentMarks.body.data.some((m: any) => m.id === `asm_${testStudentId}_${testSubjectId}_s1`);
    assert.equal(draftFound, false, 'DRAFT marks must NEVER be visible to the student');
  });

  it('Step 6: Teacher reviews and confirms Final Submit', async () => {
    const teacherToken = `SPIS_SECURE_TOKEN_${testTeacherEmail}`;

    const finalSubmissions = [
      {
        id: `asm_${testStudentId}_${testSubjectId}_s1`,
        studentId: testStudentId,
        subjectId: testSubjectId,
        configId: `cfg_crs_bca_s1_${testSessionId}`,
        sessionId: testSessionId,
        semester: 1,
        sessionalNumber: SessionalNumber.SESSIONAL_1,
        obtainedMarks: 23,
        maxMarks: 25,
        examAttendance: ExamAttendance.ATTENDED,
        classAttendancePct: 92,
        assignmentScore: 88,
        presentationScore: 85,
        classInteractionScore: 90,
      },
    ];

    const resSubmit = await request(app)
      .post('/api/assessments/final-submit')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ assessments: finalSubmissions });

    assert.equal(resSubmit.status, 200);
    assert.equal(resSubmit.body.success, true);
    assert.equal(resSubmit.body.data[0].submissionStatus, SubmissionStatus.FINAL_SUBMITTED);
  });

  it('Step 7: Enrolled Student can immediately view final submitted marks and score', async () => {
    const studentToken = `SPIS_SECURE_TOKEN_${testStudentEmail}`;

    const res = await request(app)
      .get(`/api/assessments/student/marks?sessionId=${testSessionId}`)
      .set('Authorization', `Bearer ${studentToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    const submittedRecord = res.body.data.find((m: any) => m.id === `asm_${testStudentId}_${testSubjectId}_s1`);
    assert.ok(submittedRecord, 'Submitted marks must be visible to enrolled student');
    assert.equal(submittedRecord.obtainedMarks, 23);
    assert.equal(submittedRecord.submissionStatus, SubmissionStatus.FINAL_SUBMITTED);
    assert.ok(submittedRecord.calculation.isComplete);
    assert.ok(submittedRecord.calculation.performanceScore > 0);
  });

  it('Step 8: Another student cannot access test student marks (403 Forbidden)', async () => {
    // Diya Sharma tries to inspect the test student's records
    const res = await request(app)
      .get(`/api/assessments/student/marks?studentId=${testStudentId}&sessionId=${testSessionId}`)
      .set('Authorization', `Bearer ${STUDENT_DIYA_TOKEN}`);

    assert.equal(res.status, 403);
    assert.equal(res.body.code, 'STUDENT_RECORD_ISOLATION_VIOLATION');
  });

  it('Step 9: Audit log contains verified submission record', async () => {
    const res = await request(app)
      .get('/api/audit/logs')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`);

    assert.equal(res.status, 200);
    const logs = res.body.data;
    const submitLog = logs.find((l: any) => l.action === 'FINAL_SUBMIT' && l.actorId === testTeacherEmail);
    assert.ok(submitLog, 'Final submit audit entry must exist in audit log');
  });
});
