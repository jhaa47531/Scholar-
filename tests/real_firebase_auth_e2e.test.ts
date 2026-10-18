import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/server/app.ts';
import { initializeFirebaseAdmin, getFirebaseAdminApp, verifyTokenAndResolveUser } from '../src/server/auth/firebaseAdmin.ts';
import { initializeRepositories, activeAcademicRepo } from '../src/repositories/index.ts';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { initializeApp as initClientApp } from 'firebase/app';
import { getAuth as getClientAuth, signInWithCustomToken } from 'firebase/auth';
import { UserRole } from '../src/types/domain.ts';
import dotenv from 'dotenv';
dotenv.config();

const app = createApp();

describe('Real Live Firebase Authentication & Zero-Trust RBAC Suite', () => {
  let adminRealIdToken: string;
  let teacherRealIdToken: string;
  let studentRealIdToken: string;

  before(async () => {
    initializeFirebaseAdmin();
    await initializeRepositories();

    const adminApp = getFirebaseAdminApp();
    assert.ok(adminApp, 'Firebase Admin App must be initialized for project scholarsense-f29bb');
    const adminAuth = getAdminAuth(adminApp);

    // Initialize Client Firebase SDK
    const clientApp = initClientApp({
      apiKey: process.env.VITE_FIREBASE_API_KEY,
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      appId: process.env.VITE_FIREBASE_APP_ID,
    }, 'live-auth-test-app');
    const clientAuth = getClientAuth(clientApp);

    // 1. Generate real Firebase ID token for Admin
    const adminUser = await adminAuth.getUserByEmail('admin@institution.edu');
    const adminCustomToken = await adminAuth.createCustomToken(adminUser.uid);
    const adminCred = await signInWithCustomToken(clientAuth, adminCustomToken);
    adminRealIdToken = await adminCred.user.getIdToken(true);
    assert.ok(adminRealIdToken.startsWith('eyJ'), 'Admin token must be a valid RS256 JWT');

    // 2. Generate real Firebase ID token for Teacher
    const teacherUser = await adminAuth.getUserByEmail('sharma@faculty.edu');
    const teacherCustomToken = await adminAuth.createCustomToken(teacherUser.uid);
    const teacherCred = await signInWithCustomToken(clientAuth, teacherCustomToken);
    teacherRealIdToken = await teacherCred.user.getIdToken(true);
    assert.ok(teacherRealIdToken.startsWith('eyJ'), 'Teacher token must be a valid RS256 JWT');

    // 3. Generate real Firebase ID token for Student
    const studentUser = await adminAuth.getUserByEmail('aarav.patel@student.edu');
    const studentCustomToken = await adminAuth.createCustomToken(studentUser.uid);
    const studentCred = await signInWithCustomToken(clientAuth, studentCustomToken);
    studentRealIdToken = await studentCred.user.getIdToken(true);
    assert.ok(studentRealIdToken.startsWith('eyJ'), 'Student token must be a valid RS256 JWT');
  });

  it('Verification 1: Real Firebase ID Token for Admin resolves trusted ADMIN role and profile', async () => {
    const userContext = await verifyTokenAndResolveUser(adminRealIdToken);
    assert.equal(userContext.email, 'admin@institution.edu');
    assert.equal(userContext.role, UserRole.ADMIN);
    assert.ok(userContext.userAccount.displayName.includes('Eleanor Vance'));
  });

  it('Verification 2: Real Firebase ID Token for Teacher resolves trusted TEACHER role and faculty profile', async () => {
    const userContext = await verifyTokenAndResolveUser(teacherRealIdToken);
    assert.equal(userContext.email, 'sharma@faculty.edu');
    assert.equal(userContext.role, UserRole.TEACHER);
    assert.ok(userContext.teacherProfile);
    assert.equal(userContext.teacherProfile?.id, 'tch_sharma');
  });

  it('Verification 3: Real Firebase ID Token for Student resolves trusted STUDENT role and student profile', async () => {
    const userContext = await verifyTokenAndResolveUser(studentRealIdToken);
    assert.equal(userContext.email, 'aarav.patel@student.edu');
    assert.equal(userContext.role, UserRole.STUDENT);
    assert.ok(userContext.studentProfile);
    assert.equal(userContext.studentProfile?.id, 'stu_aarav');
  });

  it('Verification 4: GET /api/auth/me returns 200 with server-verified identity using real ID token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${adminRealIdToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.role, UserRole.ADMIN);
    assert.equal(res.body.data.email, 'admin@institution.edu');
  });

  it('Verification 5: Forged or tampered Firebase ID Token is rejected with 401 Unauthorized', async () => {
    // Tamper with signature payload
    const tamperedToken = adminRealIdToken.slice(0, -10) + 'XXXXXXXXXX';
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${tamperedToken}`);

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.code, 'INVALID_TOKEN');
  });

  it('Verification 6: Student presenting real Firebase ID token cannot escalate to ADMIN (403 Forbidden)', async () => {
    const res = await request(app)
      .post('/api/academic/assignments')
      .set('Authorization', `Bearer ${studentRealIdToken}`)
      .send({
        teacherId: 'tch_sharma',
        subjectId: 'sub_bca101',
        sessionId: 'sess_2025_26',
        semester: 1,
        // Attacker attempts to forge role in payload
        role: 'ADMIN',
      });

    assert.equal(res.status, 403);
    assert.equal(res.body.code, 'FORBIDDEN_ROLE');
  });

  it('Verification 7: Teacher presenting real Firebase ID token gets 200 for assigned subject, 403 for unassigned', async () => {
    // Assigned subject: BCA-101
    const resAssigned = await request(app)
      .get('/api/assessments/teacher/subject-sheet?subjectId=sub_bca101&sessionId=sess_2025_26&sessionalNumber=1')
      .set('Authorization', `Bearer ${teacherRealIdToken}`);

    assert.equal(resAssigned.status, 200);
    assert.equal(resAssigned.body.success, true);

    // Unassigned subject: BT-CS101
    const resUnassigned = await request(app)
      .get('/api/assessments/teacher/subject-sheet?subjectId=sub_bt101&sessionId=sess_2025_26&sessionalNumber=1')
      .set('Authorization', `Bearer ${teacherRealIdToken}`);

    assert.equal(resUnassigned.status, 403);
    assert.equal(resUnassigned.body.code, 'UNAUTHORIZED_SUBJECT_ACCESS');
  });

  it('Verification 8: Student presenting real Firebase ID token is isolated to own records', async () => {
    // Student Aarav queries their own marks -> 200 OK
    const resOwn = await request(app)
      .get('/api/assessments/student/marks?sessionId=sess_2025_26')
      .set('Authorization', `Bearer ${studentRealIdToken}`);

    assert.equal(resOwn.status, 200);
    assert.equal(resOwn.body.success, true);
    assert.ok(Array.isArray(resOwn.body.data));

    // Student Aarav attempts to query Diya's records -> 403 Forbidden
    const resOther = await request(app)
      .get('/api/assessments/student/marks?studentId=stu_diya&sessionId=sess_2025_26')
      .set('Authorization', `Bearer ${studentRealIdToken}`);

    assert.equal(resOther.status, 403);
    assert.equal(resOther.body.code, 'STUDENT_RECORD_ISOLATION_VIOLATION');
  });
});
