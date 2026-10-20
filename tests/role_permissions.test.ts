import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/server/app.ts';

const app = createApp();

const ADMIN_TOKEN = 'SPIS_SECURE_TOKEN_admin@institution.edu';
const TEACHER_TOKEN = 'SPIS_SECURE_TOKEN_sharma@faculty.edu';
const STUDENT_AARAV_TOKEN = 'SPIS_SECURE_TOKEN_aarav.patel@student.edu';
const STUDENT_DIYA_TOKEN = 'SPIS_SECURE_TOKEN_diya.sharma@student.edu';

describe('Institutional RBAC & Account Management Security Suite', () => {
  // -------------------------------------------------------------
  // 1. ADMIN INSTITUTIONAL MANAGEMENT PERMISSIONS (ALLOWED)
  // -------------------------------------------------------------
  describe('Admin Permissions: Institutional Management', () => {
    const timestamp = Date.now();
    const testRollNo = `TEST-ROLL-${timestamp.toString().slice(-4)}`;
    const testEnrollmentNo = `EN${timestamp.toString().slice(-6)}`;
    const testStudentEmail = `student.test.${timestamp}@institution.edu`;
    let createdStudentId = '';

    it('Admin can create a new student account (POST /api/academic/students)', async () => {
      const res = await request(app)
        .post('/api/academic/students')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .send({
          name: 'Test Enrolled Student',
          email: testStudentEmail,
          rollNo: testRollNo,
          enrollmentNo: testEnrollmentNo,
          courseId: 'crs_bca',
          currentSemester: 1,
          admissionSessionId: 'sess_2025_26',
        });

      assert.equal(res.status, 201, `Failed to create student: ${JSON.stringify(res.body)}`);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.email, testStudentEmail);
      assert.equal(res.body.data.rollNo, testRollNo);
      assert.equal(res.body.data.enrollmentNo, testEnrollmentNo);
      assert.equal(res.body.data.currentSemester, 1);
      createdStudentId = res.body.data.id;
    });

    it('Admin can edit student details and promote semester (PUT /api/academic/students/:id)', async () => {
      assert.ok(createdStudentId, 'Student must be created in prior test');
      const res = await request(app)
        .put(`/api/academic/students/${createdStudentId}`)
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .send({
          currentSemester: 2,
          name: 'Test Enrolled Student (Sem 2)',
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.currentSemester, 2);
      assert.equal(res.body.data.name, 'Test Enrolled Student (Sem 2)');
    });

    it('Admin can toggle student active status (deactivate / reactivate)', async () => {
      assert.ok(createdStudentId);
      // Deactivate
      const deactRes = await request(app)
        .put(`/api/academic/students/${createdStudentId}`)
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .send({ isActive: false });
      assert.equal(deactRes.status, 200);
      assert.equal(deactRes.body.data.isActive, false);

      // Reactivate
      const reactRes = await request(app)
        .put(`/api/academic/students/${createdStudentId}`)
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .send({ isActive: true });
      assert.equal(reactRes.status, 200);
      assert.equal(reactRes.body.data.isActive, true);
    });

    const testFacultyCode = `FAC-TST-${timestamp.toString().slice(-4)}`;
    const testFacultyEmail = `faculty.test.${timestamp}@faculty.edu`;
    let createdTeacherId = '';

    it('Admin can create a new faculty account (POST /api/academic/teachers)', async () => {
      const res = await request(app)
        .post('/api/academic/teachers')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .send({
          name: 'Dr. Test Faculty',
          email: testFacultyEmail,
          employeeCode: testFacultyCode,
          department: 'Computer Applications',
          designation: 'Associate Professor',
        });

      assert.equal(res.status, 201, `Failed to create faculty: ${JSON.stringify(res.body)}`);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.email, testFacultyEmail);
      assert.equal(res.body.data.employeeCode, testFacultyCode);
      createdTeacherId = res.body.data.id;
    });

    it('Admin can edit faculty details (PUT /api/academic/teachers/:id)', async () => {
      assert.ok(createdTeacherId);
      const res = await request(app)
        .put(`/api/academic/teachers/${createdTeacherId}`)
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .send({
          designation: 'Professor & Head',
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.designation, 'Professor & Head');
    });

    it('Admin can assign faculty to course, subject, and semester (POST /api/academic/assignments)', async () => {
      assert.ok(createdTeacherId);
      const res = await request(app)
        .post('/api/academic/assignments')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .send({
          teacherId: createdTeacherId,
          subjectId: 'sub_bca101',
          sessionId: 'sess_2025_26',
          semester: 1,
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.teacherId, createdTeacherId);
      assert.equal(res.body.data.subjectId, 'sub_bca101');
    });

    it('Admin can manage course structures (POST & PUT /api/academic/courses)', async () => {
      const code = `MCA${timestamp.toString().slice(-3)}`;
      const res = await request(app)
        .post('/api/academic/courses')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .send({
          courseCode: code,
          name: 'Master of Computer Applications',
          totalSemesters: 4,
          durationYears: 2,
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
    });

    it('Admin can manage subject catalog (POST & PUT /api/academic/subjects)', async () => {
      const subCode = `CS${timestamp.toString().slice(-4)}`;
      const res = await request(app)
        .post('/api/academic/subjects')
        .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
        .send({
          subjectCode: subCode,
          name: 'Advanced Cloud Architecture',
          courseId: 'crs_bca',
          semester: 1,
          isRequired: true,
          credits: 4,
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
    });
  });

  // -------------------------------------------------------------
  // 2. FACULTY ROLE BOUNDARY & ACCESS RESTRICTIONS (FORBIDDEN)
  // -------------------------------------------------------------
  describe('Faculty Restrictions: Academic Scope Only', () => {
    it('Faculty cannot create student accounts (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/academic/students')
        .set('Authorization', `Bearer ${TEACHER_TOKEN}`)
        .send({
          name: 'Unauthorized Student',
          email: 'unauth.student@institution.edu',
          rollNo: 'UNAUTH-01',
          enrollmentNo: 'ENUNAUTH001',
          courseId: 'crs_bca',
          currentSemester: 1,
        });

      assert.equal(res.status, 403);
      assert.equal(res.body.code, 'FORBIDDEN_ROLE');
    });

    it('Faculty cannot edit student accounts (403 Forbidden)', async () => {
      const res = await request(app)
        .put('/api/academic/students/stu_aarav')
        .set('Authorization', `Bearer ${TEACHER_TOKEN}`)
        .send({
          currentSemester: 3,
        });

      assert.equal(res.status, 403);
      assert.equal(res.body.code, 'FORBIDDEN_ROLE');
    });

    it('Faculty cannot create faculty accounts (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/academic/teachers')
        .set('Authorization', `Bearer ${TEACHER_TOKEN}`)
        .send({
          name: 'Unauthorized Faculty',
          email: 'unauth.faculty@faculty.edu',
          employeeCode: 'FAC-UNAUTH-01',
        });

      assert.equal(res.status, 403);
      assert.equal(res.body.code, 'FORBIDDEN_ROLE');
    });

    it('Faculty cannot access administrative user registration /api/auth/register (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${TEACHER_TOKEN}`)
        .send({
          email: 'new.account@institution.edu',
          displayName: 'New Account',
          role: 'STUDENT',
          rollNo: 'TEST-12',
          enrollmentNo: 'ENTEST12',
          courseId: 'crs_bca',
        });

      assert.equal(res.status, 403);
      assert.equal(res.body.code, 'FORBIDDEN_ROLE');
    });

    it('Faculty cannot create courses (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/academic/courses')
        .set('Authorization', `Bearer ${TEACHER_TOKEN}`)
        .send({
          courseCode: 'FORBIDDEN_CRS',
          name: 'Forbidden Course',
          totalSemesters: 4,
          durationYears: 2,
        });

      assert.equal(res.status, 403);
      assert.equal(res.body.code, 'FORBIDDEN_ROLE');
    });

    it('Faculty cannot create subjects (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/academic/subjects')
        .set('Authorization', `Bearer ${TEACHER_TOKEN}`)
        .send({
          subjectCode: 'FORBIDDEN_SUB',
          name: 'Forbidden Subject',
          courseId: 'crs_bca',
          semester: 1,
        });

      assert.equal(res.status, 403);
      assert.equal(res.body.code, 'FORBIDDEN_ROLE');
    });

    it('Faculty cannot assign teachers to subjects (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/academic/assignments')
        .set('Authorization', `Bearer ${TEACHER_TOKEN}`)
        .send({
          teacherId: 'tch_sharma',
          subjectId: 'sub_bca101',
          sessionId: 'sess_2025_26',
          semester: 1,
        });

      assert.equal(res.status, 403);
      assert.equal(res.body.code, 'FORBIDDEN_ROLE');
    });

    it('Faculty can view assigned student rosters (200 OK)', async () => {
      const res = await request(app)
        .get('/api/academic/students?courseId=crs_bca&semester=1')
        .set('Authorization', `Bearer ${TEACHER_TOKEN}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));
    });

    it('Faculty can save draft assessment marks for assigned subject (200 OK)', async () => {
      const res = await request(app)
        .post('/api/assessments/draft')
        .set('Authorization', `Bearer ${TEACHER_TOKEN}`)
        .send({
          assessment: {
            studentId: 'stu_aarav',
            subjectId: 'sub_bca101',
            sessionId: 'sess_2025_26',
            sessionalNumber: 1,
            marks: { s1: 18, s2: 0, s3: 0, s4: 0, s5: 0 },
          },
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
    });
  });

  // -------------------------------------------------------------
  // 3. STUDENT ROLE BOUNDARY & ACCESS RESTRICTIONS (FORBIDDEN)
  // -------------------------------------------------------------
  describe('Student Restrictions: Personal Academic Scope Only', () => {
    it('Student cannot create student accounts (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/academic/students')
        .set('Authorization', `Bearer ${STUDENT_AARAV_TOKEN}`)
        .send({
          name: 'Student Self Created',
          email: 'student.self@institution.edu',
          rollNo: 'STU-SELF',
          enrollmentNo: 'ENSELF',
          courseId: 'crs_bca',
        });

      assert.equal(res.status, 403);
      assert.equal(res.body.code, 'FORBIDDEN_ROLE');
    });

    it('Student cannot create faculty accounts (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/academic/teachers')
        .set('Authorization', `Bearer ${STUDENT_AARAV_TOKEN}`)
        .send({
          name: 'Student Attempted Faculty',
          email: 'faculty.attempt@faculty.edu',
        });

      assert.equal(res.status, 403);
      assert.equal(res.body.code, 'FORBIDDEN_ROLE');
    });

    it('Student cannot access /api/auth/register (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${STUDENT_AARAV_TOKEN}`)
        .send({
          email: 'student.escalated@institution.edu',
          displayName: 'Escalated User',
          role: 'ADMIN',
        });

      assert.equal(res.status, 403);
      assert.equal(res.body.code, 'FORBIDDEN_ROLE');
    });

    it('Student cannot access institutional student directory /api/academic/students (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/academic/students')
        .set('Authorization', `Bearer ${STUDENT_AARAV_TOKEN}`);

      assert.equal(res.status, 403);
      assert.equal(res.body.code, 'FORBIDDEN_ROLE');
    });

    it('Student cannot modify course or subject structures (403 Forbidden)', async () => {
      const resCourse = await request(app)
        .post('/api/academic/courses')
        .set('Authorization', `Bearer ${STUDENT_AARAV_TOKEN}`)
        .send({ courseCode: 'STU_CRS', name: 'Illegal Course', totalSemesters: 2, durationYears: 1 });
      assert.equal(resCourse.status, 403);

      const resSub = await request(app)
        .post('/api/academic/subjects')
        .set('Authorization', `Bearer ${STUDENT_AARAV_TOKEN}`)
        .send({ subjectCode: 'STU_SUB', name: 'Illegal Subject', courseId: 'crs_bca', semester: 1 });
      assert.equal(resSub.status, 403);
    });

    it('Student cannot view other students fee records (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/academic/fees/records?studentId=stu_diya')
        .set('Authorization', `Bearer ${STUDENT_AARAV_TOKEN}`);

      assert.equal(res.status, 403);
      assert.equal(res.body.code, 'STUDENT_RECORD_ISOLATION_VIOLATION');
    });

    it('Student cannot view other students marks (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/assessments/student/marks?studentId=stu_diya&sessionId=sess_2025_26')
        .set('Authorization', `Bearer ${STUDENT_AARAV_TOKEN}`);

      assert.equal(res.status, 403);
      assert.equal(res.body.code, 'STUDENT_RECORD_ISOLATION_VIOLATION');
    });

    it('Student can access own profile and dashboard identity (200 OK)', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${STUDENT_AARAV_TOKEN}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.role, 'STUDENT');
      assert.equal(res.body.data.email, 'aarav.patel@student.edu');
      assert.equal(res.body.data.studentProfile.id, 'stu_aarav');
    });

    it('Student can access own fee records (200 OK)', async () => {
      const res = await request(app)
        .get('/api/academic/fees/records')
        .set('Authorization', `Bearer ${STUDENT_AARAV_TOKEN}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));
    });

    it('Student can access own marks for final submitted assessments (200 OK)', async () => {
      const res = await request(app)
        .get('/api/assessments/student/marks?sessionId=sess_2025_26')
        .set('Authorization', `Bearer ${STUDENT_AARAV_TOKEN}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(Array.isArray(res.body.data));
    });
  });
});
