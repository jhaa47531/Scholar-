import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/server/app.ts';
import { initializeFirebaseAdmin, getFirestoreDb } from '../src/server/auth/firebaseAdmin.ts';
import { initializeRepositories, isLiveFirestoreActive } from '../src/repositories/index.ts';

const app = createApp();
const ADMIN_TOKEN = 'SPIS_SECURE_TOKEN_admin@institution.edu';

describe('Real Live Cloud Firestore End-to-End Persistence Suite', () => {
  let createdCourseId: string;
  let createdSubjectId: string;
  let createdTeacherId: string;
  let createdTeacherUserId: string;
  let createdStudentId: string;
  let createdStudentUserId: string;

  const testUniqueSuffix = Date.now().toString().slice(-5);
  const testEnrollmentNo = `EN${Date.now()}`;
  const testRollNo = `T-${testUniqueSuffix}`;
  const teacherEmail = `faculty_${Date.now()}@institution.edu`;
  const studentEmail = `student_${Date.now()}@institution.edu`;

  before(async () => {
    initializeFirebaseAdmin();
    const repoStatus = await initializeRepositories();
    assert.equal(repoStatus.isLiveFirestore, true, 'Live Cloud Firestore adapter must be active');
    assert.equal(isLiveFirestoreActive(), true, 'isLiveFirestoreActive() must return true');
  });

  it('1. Verifies /api/health reports CONNECTED_AND_ACTIVE and CLOUD_FIRESTORE persistence mode', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.firebaseAdmin.firestoreStatus, 'CONNECTED_AND_ACTIVE');
    assert.equal(res.body.database.persistenceMode, 'CLOUD_FIRESTORE');
    assert.ok(res.body.database.currentDriver.includes('Live Cloud Firestore Repository'));
  });

  it('2. Verifies /api/health/probe executes live Firestore write, read, and delete with 200 OK', async () => {
    const res = await request(app).get('/api/health/probe');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.stage, 'COMPLETED');
    assert.ok(typeof res.body.latencyMs === 'number');
  });

  it('3. Admin creates course -> verifies persistence directly in Cloud Firestore database', async () => {
    const res = await request(app)
      .post('/api/academic/courses')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({
        courseCode: `TC${testUniqueSuffix}`,
        name: 'Test Computer Degree',
        totalSemesters: 6,
        durationYears: 3,
        isActive: true,
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    createdCourseId = res.body.data.id;
    assert.ok(createdCourseId, 'Course ID must be assigned by repository');

    // Verify directly in raw Firestore document collection
    const db = getFirestoreDb()!;
    const docSnap = await db.collection('courseStructures').doc(createdCourseId).get();
    assert.equal(docSnap.exists, true, 'Course document must exist in Firestore courseStructures collection');
    assert.equal(docSnap.data()?.courseCode, `TC${testUniqueSuffix}`);
  });

  it('4. Admin creates subject -> verifies persistence directly in Cloud Firestore database', async () => {
    assert.ok(createdCourseId, 'Must have created course id');
    const res = await request(app)
      .post('/api/academic/subjects')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({
        subjectCode: `TS-${testUniqueSuffix}`,
        name: 'Introduction to Automated Testing',
        courseId: createdCourseId,
        semester: 1,
        isRequired: true,
        credits: 4,
        isActive: true,
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    createdSubjectId = res.body.data.id;
    assert.ok(createdSubjectId, 'Subject ID must be assigned by repository');

    // Verify directly in raw Firestore document collection
    const db = getFirestoreDb()!;
    const docSnap = await db.collection('subjects').doc(createdSubjectId).get();
    assert.equal(docSnap.exists, true, 'Subject document must exist in Firestore subjects collection');
    assert.equal(docSnap.data()?.subjectCode, `TS-${testUniqueSuffix}`);
  });

  it('5. Admin creates faculty -> verifies persistence in Firestore users and teachers collections', async () => {
    const res = await request(app)
      .post('/api/academic/teachers')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({
        employeeCode: `FAC-${testUniqueSuffix}`,
        name: 'Dr. Automated Tester',
        email: teacherEmail,
        department: 'Computer Science',
        designation: 'Associate Professor',
        isActive: true,
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    createdTeacherId = res.body.data.id;
    createdTeacherUserId = res.body.data.userId;
    assert.ok(createdTeacherId, 'Teacher profile ID must be assigned');
    assert.ok(createdTeacherUserId, 'Teacher user ID must be assigned');

    // Verify directly in raw Firestore document collections
    const db = getFirestoreDb()!;
    const teacherDocSnap = await db.collection('teachers').doc(createdTeacherId).get();
    assert.equal(teacherDocSnap.exists, true, 'Teacher document must exist in Firestore teachers collection');
    assert.equal(teacherDocSnap.data()?.email, teacherEmail);

    const userDocSnap = await db.collection('users').doc(createdTeacherUserId).get();
    assert.equal(userDocSnap.exists, true, 'User account must exist in Firestore users collection');
    assert.equal(userDocSnap.data()?.role, 'TEACHER');
  });

  it('6. Admin creates student -> verifies persistence in Firestore users and students collections', async () => {
    assert.ok(createdCourseId, 'Must have created course id');
    const res = await request(app)
      .post('/api/academic/students')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({
        enrollmentNo: testEnrollmentNo,
        rollNo: testRollNo,
        name: 'John Test Student',
        email: studentEmail,
        courseId: createdCourseId,
        currentSemester: 1,
        admissionSessionId: 'sess_2025_26',
        isActive: true,
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    createdStudentId = res.body.data.id;
    createdStudentUserId = res.body.data.userId;
    assert.ok(createdStudentId, 'Student profile ID must be assigned');
    assert.ok(createdStudentUserId, 'Student user ID must be assigned');

    // Verify directly in raw Firestore document collections
    const db = getFirestoreDb()!;
    const studentDocSnap = await db.collection('students').doc(createdStudentId).get();
    assert.equal(studentDocSnap.exists, true, 'Student document must exist in Firestore students collection');
    assert.equal(studentDocSnap.data()?.enrollmentNo, testEnrollmentNo);
    assert.equal(studentDocSnap.data()?.email, studentEmail);

    const userDocSnap = await db.collection('users').doc(createdStudentUserId).get();
    assert.equal(userDocSnap.exists, true, 'User account must exist in Firestore users collection');
    assert.equal(userDocSnap.data()?.role, 'STUDENT');
  });

  after(async () => {
    // Clean up test documents to keep database clean and pristine
    const db = getFirestoreDb();
    if (db) {
      if (createdCourseId) await db.collection('courseStructures').doc(createdCourseId).delete().catch(() => {});
      if (createdSubjectId) await db.collection('subjects').doc(createdSubjectId).delete().catch(() => {});
      if (createdTeacherId) await db.collection('teachers').doc(createdTeacherId).delete().catch(() => {});
      if (createdTeacherUserId) await db.collection('users').doc(createdTeacherUserId).delete().catch(() => {});
      if (createdStudentId) await db.collection('students').doc(createdStudentId).delete().catch(() => {});
      if (createdStudentUserId) await db.collection('users').doc(createdStudentUserId).delete().catch(() => {});
    }
  });
});
