import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/server/app.ts';

const app = createApp();

const ADMIN_TOKEN = 'SPIS_SECURE_TOKEN_admin@institution.edu';
const TEACHER_SHARMA_TOKEN = 'SPIS_SECURE_TOKEN_sharma@faculty.edu';
const STUDENT_AARAV_TOKEN = 'SPIS_SECURE_TOKEN_aarav.patel@student.edu';

describe('HTTP Integration & Security Access Control Suite', () => {
  it('Public Endpoint: GET /api/health returns 200 without authentication', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'HEALTHY');
  });

  it('Missing Token: Protected route returns 401 Unauthorized', async () => {
    const res = await request(app).get('/api/academic/courses');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.code, 'UNAUTHORIZED');
  });

  it('Invalid/Tampered Token: Returns 401 Unauthorized', async () => {
    const res = await request(app)
      .get('/api/academic/courses')
      .set('Authorization', 'Bearer fake_malformed_token_12345');
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.code, 'INVALID_TOKEN');
  });

  it('Role Enforcement: Student blocked from Admin-only assignment route (403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/academic/assignments')
      .set('Authorization', `Bearer ${STUDENT_AARAV_TOKEN}`)
      .send({
        teacherId: 'tch_sharma',
        subjectId: 'sub_bca101',
        sessionId: 'sess_2025_26',
        semester: 1,
      });
    assert.equal(res.status, 403);
    assert.equal(res.body.code, 'FORBIDDEN_ROLE');
  });

  it('Role Enforcement: Student blocked from viewing audit logs (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/audit/logs')
      .set('Authorization', `Bearer ${STUDENT_AARAV_TOKEN}`);
    assert.equal(res.status, 403);
    assert.equal(res.body.code, 'FORBIDDEN_ROLE');
  });

  it('Teacher Assignment Check: Assigned teacher gets 200 OK for assigned subject', async () => {
    const res = await request(app)
      .get('/api/assessments/teacher/subject-sheet?subjectId=sub_bca101&sessionId=sess_2025_26&sessionalNumber=1')
      .set('Authorization', `Bearer ${TEACHER_SHARMA_TOKEN}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.rows);
  });

  it('Teacher Assignment Check: Teacher blocked with 403 from unassigned subject', async () => {
    const res = await request(app)
      .get('/api/assessments/teacher/subject-sheet?subjectId=sub_bt101&sessionId=sess_2025_26&sessionalNumber=1')
      .set('Authorization', `Bearer ${TEACHER_SHARMA_TOKEN}`);
    assert.equal(res.status, 403);
    assert.equal(res.body.code, 'UNAUTHORIZED_SUBJECT_ACCESS');
  });

  it('Student Record Isolation: Student viewing their own marks receives 200 OK', async () => {
    const res = await request(app)
      .get('/api/assessments/student/marks?sessionId=sess_2025_26')
      .set('Authorization', `Bearer ${STUDENT_AARAV_TOKEN}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
  });

  it('Student Record Isolation: Student attempting to query another student is denied (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/assessments/student/marks?studentId=stu_diya&sessionId=sess_2025_26')
      .set('Authorization', `Bearer ${STUDENT_AARAV_TOKEN}`);
    assert.equal(res.status, 403);
    assert.equal(res.body.code, 'STUDENT_RECORD_ISOLATION_VIOLATION');
  });

  it('Validation: Missing required fields in config creation returns 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/assessments/configs')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({
        // Missing courseId, semester, sessionalNumber
        sessionId: 'sess_2025_26',
      });
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  it('Admin Access: Admin successfully reads audit logs (200 OK)', async () => {
    const res = await request(app)
      .get('/api/audit/logs')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
  });
});
