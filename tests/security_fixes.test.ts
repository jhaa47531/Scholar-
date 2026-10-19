import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/server/app.ts';
import { initializeFirebaseAdmin } from '../src/server/auth/firebaseAdmin.ts';
import {
  initializeRepositories,
  activeAssessmentRepo,
  activeAuditRepo,
  inMemoryAuditRepo,
} from '../src/repositories/index.ts';
import { ExamAttendance, SessionalNumber, SubmissionStatus } from '../src/types/domain.ts';

const app = createApp();

const ADMIN_TOKEN = 'SPIS_SECURE_TOKEN_admin@institution.edu';
const TEACHER_SHARMA_TOKEN = 'SPIS_SECURE_TOKEN_sharma@faculty.edu';
const STUDENT_AARAV_TOKEN = 'SPIS_SECURE_TOKEN_aarav.patel@student.edu';

describe('Security Fixes Verification Suite', () => {
  before(async () => {
    initializeFirebaseAdmin();
    await initializeRepositories();
  });

  // 1. Migration Endpoint Security
  describe('Fix 1: Migration Endpoint Security', () => {
    it('Unauthenticated GET /api/migration/overview returns 401', async () => {
      const res = await request(app).get('/api/migration/overview');
      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'UNAUTHORIZED');
    });

    it('Unauthenticated GET /api/migration/export-json returns 401', async () => {
      const res = await request(app).get('/api/migration/export-json');
      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'UNAUTHORIZED');
    });

    it('Student GET /api/migration/overview returns 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/migration/overview')
        .set('Authorization', `Bearer ${STUDENT_AARAV_TOKEN}`);
      assert.equal(res.status, 403);
      assert.equal(res.body.code, 'FORBIDDEN_ROLE');
    });

    it('Student GET /api/migration/export-json returns 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/migration/export-json')
        .set('Authorization', `Bearer ${STUDENT_AARAV_TOKEN}`);
      assert.equal(res.status, 403);
      assert.equal(res.body.code, 'FORBIDDEN_ROLE');
    });

    it('Admin GET /api/migration/overview returns 200 OK', async () => {
      const res = await request(app)
        .get('/api/migration/overview')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.status, 'MIGRATION_READY');
    });

    it('Admin GET /api/migration/export-json returns 200 OK with valid export payload', async () => {
      const res = await request(app)
        .get('/api/migration/export-json')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`);
      assert.equal(res.status, 200);
      assert.ok(res.body.tables);
    });
  });

  // 2. Student Roster Access Restriction
  describe('Fix 2: Student Roster Access Restriction', () => {
    it('Student GET /api/academic/students returns 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/academic/students')
        .set('Authorization', `Bearer ${STUDENT_AARAV_TOKEN}`);
      assert.equal(res.status, 403);
      assert.equal(res.body.code, 'FORBIDDEN_ROLE');
    });

    it('Teacher GET /api/academic/students returns 200 OK', async () => {
      const res = await request(app)
        .get('/api/academic/students?courseId=crs_bca&semester=1')
        .set('Authorization', `Bearer ${TEACHER_SHARMA_TOKEN}`);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));
    });

    it('Admin GET /api/academic/students returns 200 OK', async () => {
      const res = await request(app)
        .get('/api/academic/students')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));
    });
  });

  // 3. Finalized Assessment Protection & Correction Audit
  describe('Fix 3: Finalized Assessment Protection & Correction Workflow', () => {
    const testAssessmentId = 'asm_test_aarav_finalized_guard';

    before(async () => {
      // Seed a finalized assessment directly
      await activeAssessmentRepo.finalSubmitBatch('tch_sharma', [
        {
          id: testAssessmentId,
          studentId: 'stu_aarav',
          subjectId: 'sub_bca101',
          configId: 'cfg_bca_s1_sess2526',
          sessionId: 'sess_2025_26',
          semester: 1,
          sessionalNumber: SessionalNumber.SESSIONAL_1,
          obtainedMarks: 22,
          maxMarks: 25,
          examAttendance: ExamAttendance.ATTENDED,
          classAttendancePct: 90,
          assignmentScore: 14,
          presentationScore: 14,
          classInteractionScore: 9,
          submissionStatus: SubmissionStatus.FINAL_SUBMITTED,
          submittingTeacherId: 'tch_sharma',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
    });

    it('POST /api/assessments/draft returns 409 when attempting to overwrite a FINAL_SUBMITTED assessment', async () => {
      const res = await request(app)
        .post('/api/assessments/draft')
        .set('Authorization', `Bearer ${TEACHER_SHARMA_TOKEN}`)
        .send({
          assessment: {
            id: testAssessmentId,
            studentId: 'stu_aarav',
            subjectId: 'sub_bca101',
            configId: 'cfg_bca_s1_sess2526',
            sessionId: 'sess_2025_26',
            semester: 1,
            sessionalNumber: SessionalNumber.SESSIONAL_1,
            obtainedMarks: 10, // Attempted unauthorized rollback
            maxMarks: 25,
            examAttendance: ExamAttendance.ATTENDED,
          },
        });

      assert.equal(res.status, 409);
      assert.equal(res.body.code, 'FINALIZED_ASSESSMENT_LOCKED');
      assert.match(res.body.message, /Cannot overwrite or downgrade an already finalized assessment/);
    });

    it('POST /api/assessments/correction rejects requests missing a correctionReason with 400', async () => {
      const res = await request(app)
        .post('/api/assessments/correction')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .send({
          assessmentId: testAssessmentId,
          updates: { obtainedMarks: 23 },
          correctionReason: '', // Empty reason
        });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
    });

    it('POST /api/assessments/correction applies authorized change and logs immutable CORRECTION audit', async () => {
      const reason = 'Dean approved mark re-tallying for Q3';
      const previous = await activeAssessmentRepo.getAssessmentById(testAssessmentId);
      assert.ok(previous);
      const res = await request(app)
        .post('/api/assessments/correction')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .send({
          assessmentId: testAssessmentId,
          updates: { obtainedMarks: 23.5 },
          correctionReason: reason,
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.obtainedMarks, 23.5);
      assert.equal(res.body.data.correctionReason, reason);
      assert.equal(res.body.data.studentId, previous.studentId);
      assert.equal(res.body.data.subjectId, previous.subjectId);
      assert.equal(res.body.data.sessionId, previous.sessionId);

      const logs = await activeAuditRepo.getAuditLogs('ASSESSMENT', testAssessmentId);
      const correctionLog = logs.find((l) => l.action === 'CORRECTION' && l.reason === reason);
      assert.ok(correctionLog, 'Correction audit record must exist');
      assert.equal(correctionLog?.actorRole, 'ADMIN');
      assert.equal(correctionLog?.actorId, 'admin@institution.edu');
      assert.equal(correctionLog?.previousData?.obtainedMarks, previous.obtainedMarks);
      assert.equal(correctionLog?.newData?.obtainedMarks, 23.5);
      assert.equal(correctionLog?.newData?.correctionReason, reason);
      assert.ok(Number.isFinite(Date.parse(correctionLog!.timestamp)));
    });

    it('authorizes an assigned teacher from stored subject/session when request omits both fields', async () => {
      const res = await request(app)
        .post('/api/assessments/correction')
        .set('Authorization', `Bearer ${TEACHER_SHARMA_TOKEN}`)
        .send({
          assessmentId: testAssessmentId,
          updates: { obtainedMarks: 22 },
          correctionReason: 'Approved teacher correction with stored assignment context',
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.data.obtainedMarks, 22);
      assert.equal(res.body.data.subjectId, 'sub_bca101');
      assert.equal(res.body.data.sessionId, 'sess_2025_26');
    });

    it('rejects forged subject/session fields instead of using them for authorization', async () => {
      const before = await activeAssessmentRepo.getAssessmentById(testAssessmentId);
      assert.ok(before);
      const res = await request(app)
        .post('/api/assessments/correction')
        .set('Authorization', `Bearer ${TEACHER_SHARMA_TOKEN}`)
        .send({
          assessmentId: testAssessmentId,
          updates: {
            obtainedMarks: 20,
            subjectId: 'sub_bt101',
            sessionId: 'sess_2026_27',
          },
          correctionReason: 'Attempted forged authorization context',
        });

      assert.equal(res.status, 400);
      assert.equal(res.body.code, 'INVALID_CORRECTION_FIELDS');
      assert.deepEqual(await activeAssessmentRepo.getAssessmentById(testAssessmentId), before);
    });

    it('denies a teacher who is not assigned to the stored assessment subject/session', async () => {
      const before = await activeAssessmentRepo.getAssessmentById(testAssessmentId);
      assert.ok(before);
      const res = await request(app)
        .post('/api/assessments/correction')
        .set('Authorization', 'Bearer SPIS_SECURE_TOKEN_gupta@faculty.edu')
        .send({
          assessmentId: testAssessmentId,
          updates: { obtainedMarks: 19 },
          correctionReason: 'Attempted correction without assignment',
        });

      assert.equal(res.status, 403);
      assert.equal(res.body.code, 'UNAUTHORIZED_SUBJECT_ACCESS');
      assert.deepEqual(await activeAssessmentRepo.getAssessmentById(testAssessmentId), before);
    });

    it('rejects attempts to change assessment identity and ownership fields', async () => {
      const protectedFields = [
        'id',
        'studentId',
        'submittingTeacherId',
        'subjectId',
        'sessionId',
        'configId',
        'semester',
        'sessionalNumber',
      ];
      const before = await activeAssessmentRepo.getAssessmentById(testAssessmentId);
      assert.ok(before);

      for (const field of protectedFields) {
        const res = await request(app)
          .post('/api/assessments/correction')
          .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
          .send({
            assessmentId: testAssessmentId,
            updates: { obtainedMarks: 18, [field]: 'forged-value' },
            correctionReason: `Attempted identity update: ${field}`,
          });
        assert.equal(res.status, 400, `Expected ${field} to be immutable`);
        assert.equal(res.body.code, 'INVALID_CORRECTION_FIELDS');
      }

      assert.deepEqual(await activeAssessmentRepo.getAssessmentById(testAssessmentId), before);
    });

    it('does not apply the correction when audit persistence fails', async () => {
      const before = await activeAssessmentRepo.getAssessmentById(testAssessmentId);
      assert.ok(before);
      const originalRecordAudit = inMemoryAuditRepo.recordAudit.bind(inMemoryAuditRepo);
      inMemoryAuditRepo.recordAudit = async () => {
        throw new Error('simulated audit persistence failure');
      };

      try {
        const res = await request(app)
          .post('/api/assessments/correction')
          .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
          .send({
            assessmentId: testAssessmentId,
            updates: { obtainedMarks: 17 },
            correctionReason: 'Audit failure rollback test',
          });

        assert.equal(res.status, 500);
        assert.equal(res.body.code, 'CORRECTION_FAILED');
        assert.deepEqual(await activeAssessmentRepo.getAssessmentById(testAssessmentId), before);
      } finally {
        inMemoryAuditRepo.recordAudit = originalRecordAudit;
      }
    });
  });
});
