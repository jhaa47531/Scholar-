import { Request, Response, Router } from 'express';
import { activeAcademicRepo, activeAuditRepo } from '../../repositories/index.ts';
import { requireAuth, requireRole } from '../middleware/auth.ts';
import { UserRole } from '../../types/domain.ts';

export const academicRouter = Router();

// Sessions
academicRouter.get('/sessions', requireAuth, async (req: Request, res: Response) => {
  const sessions = await activeAcademicRepo.getSessions();
  res.json({ success: true, data: sessions });
});

// Courses
academicRouter.get('/courses', requireAuth, async (req: Request, res: Response) => {
  const courses = await activeAcademicRepo.getCourses();
  res.json({ success: true, data: courses });
});

// Subjects
academicRouter.get('/subjects', requireAuth, async (req: Request, res: Response) => {
  const courseId = req.query.courseId as string | undefined;
  const semesterStr = req.query.semester as string | undefined;
  const semester = semesterStr ? parseInt(semesterStr, 10) : undefined;
  const subjects = await activeAcademicRepo.getSubjects(courseId, semester);
  res.json({ success: true, data: subjects });
});

// Students (Restricted to Faculty and Admins)
academicRouter.get(
  '/students',
  requireAuth,
  requireRole([UserRole.ADMIN, UserRole.TEACHER]),
  async (req: Request, res: Response) => {
    const courseId = req.query.courseId as string | undefined;
    const semesterStr = req.query.semester as string | undefined;
    const semester = semesterStr ? parseInt(semesterStr, 10) : undefined;
    const students = await activeAcademicRepo.getStudents(courseId, semester);
    res.json({ success: true, data: students });
  }
);

// Teachers
academicRouter.get('/teachers', requireAuth, async (req: Request, res: Response) => {
  const teachers = await activeAcademicRepo.getTeachers();
  res.json({ success: true, data: teachers });
});

// Teacher Assignments (Faculty and Admins)
academicRouter.get('/assignments', requireAuth, async (req: Request, res: Response) => {
  const teacherId = req.query.teacherId as string | undefined;
  const sessionId = req.query.sessionId as string | undefined;
  const assignments = await activeAcademicRepo.getTeacherAssignments(teacherId, sessionId);
  res.json({ success: true, data: assignments });
});

// Assign Teacher to Subject (STRICT ADMIN ONLY)
academicRouter.post('/assignments', requireAuth, requireRole([UserRole.ADMIN]), async (req: Request, res: Response) => {
  const { teacherId, subjectId, sessionId, semester } = req.body;
  if (!teacherId || !subjectId || !sessionId || !semester) {
    return res.status(400).json({ success: false, message: 'Missing required assignment fields' });
  }

  const assignment = await activeAcademicRepo.assignTeacher({
    id: `asg_${Date.now()}`,
    teacherId,
    subjectId,
    sessionId,
    semester: Number(semester),
    isActive: true,
    assignedAt: new Date().toISOString(),
  });

  await activeAuditRepo.recordAudit({
    entityType: 'ASSIGNMENT',
    entityId: assignment.id,
    action: 'CREATE',
    actorId: req.user!.email,
    actorRole: req.user!.role,
    reason: `Assigned teacher ${teacherId} to subject ${subjectId}`,
    newData: assignment as unknown as Record<string, unknown>,
  });

  res.status(201).json({ success: true, data: assignment });
});

// Fee Structures (Admin, Teacher, Student)
academicRouter.get('/fees/structures', requireAuth, async (req: Request, res: Response) => {
  const courseId = req.query.courseId as string | undefined;
  const structures = await activeAcademicRepo.getFeeStructures(courseId);
  res.json({ success: true, data: structures });
});

// Student Fee Records (with strict student isolation)
academicRouter.get('/fees/records', requireAuth, async (req: Request, res: Response) => {
  const requestedStudentId = req.query.studentId as string | undefined;

  // Student Record Isolation
  if (req.user!.role === UserRole.STUDENT) {
    const studentProfile = req.user!.studentProfile;
    if (!studentProfile) {
      return res.status(403).json({ success: false, code: 'STUDENT_PROFILE_MISSING', message: 'Student profile not linked' });
    }
    if (requestedStudentId && requestedStudentId !== studentProfile.id) {
      return res.status(403).json({
        success: false,
        code: 'STUDENT_RECORD_ISOLATION_VIOLATION',
        message: 'Students are strictly forbidden from viewing another student fee record.',
      });
    }
    const records = await activeAcademicRepo.getStudentFeeRecords(studentProfile.id);
    return res.json({ success: true, data: records });
  }

  // Admin and Teacher can query any student or all records
  const records = await activeAcademicRepo.getStudentFeeRecords(requestedStudentId);
  res.json({ success: true, data: records });
});

// Record Fee Payment (ADMIN ONLY)
academicRouter.post(
  '/fees/payment',
  requireAuth,
  requireRole([UserRole.ADMIN]),
  async (req: Request, res: Response) => {
    const { studentId, amount, assessedSemester, receiptNumber } = req.body;
    if (!studentId || !amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid studentId and positive payment amount are required' });
    }

    const updatedRecord = await activeAcademicRepo.recordFeePayment({
      studentId,
      amount: Number(amount),
      assessedSemester: assessedSemester ? Number(assessedSemester) : undefined,
      receiptNumber,
    });

    await activeAuditRepo.recordAudit({
      entityType: 'FEE_PAYMENT',
      entityId: updatedRecord.id,
      action: 'UPDATE',
      actorId: req.user!.email,
      actorRole: req.user!.role,
      reason: `Recorded fee payment of ₹${amount} for student ${studentId} (Semester ${updatedRecord.assessedSemester})`,
      newData: updatedRecord as unknown as Record<string, unknown>,
    });

    res.status(200).json({ success: true, data: updatedRecord });
  }
);

// Create Course (ADMIN ONLY)
academicRouter.post(
  '/courses',
  requireAuth,
  requireRole([UserRole.ADMIN]),
  async (req: Request, res: Response) => {
    const { courseCode, name, totalSemesters, durationYears } = req.body;
    if (!courseCode || !name || !totalSemesters || !durationYears) {
      return res.status(400).json({ success: false, message: 'Missing courseCode, name, totalSemesters, or durationYears' });
    }

    const course = await activeAcademicRepo.createCourse({
      id: `crs_${courseCode.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      courseCode: courseCode.trim().toUpperCase(),
      name: name.trim(),
      totalSemesters: Number(totalSemesters),
      durationYears: Number(durationYears),
      isActive: true,
      createdAt: new Date().toISOString(),
    });

    await activeAuditRepo.recordAudit({
      entityType: 'USER',
      entityId: course.id,
      action: 'CREATE',
      actorId: req.user!.email,
      actorRole: req.user!.role,
      reason: `Created course structure ${course.courseCode}`,
      newData: course as unknown as Record<string, unknown>,
    });

    res.status(201).json({ success: true, data: course });
  }
);

// Create Subject (ADMIN ONLY)
academicRouter.post(
  '/subjects',
  requireAuth,
  requireRole([UserRole.ADMIN]),
  async (req: Request, res: Response) => {
    const { subjectCode, name, courseId, semester, isRequired, electiveGroup, credits } = req.body;
    if (!subjectCode || !name || !courseId || semester === undefined) {
      return res.status(400).json({ success: false, message: 'Missing subjectCode, name, courseId, or semester' });
    }

    const subject = await activeAcademicRepo.createSubject({
      id: `sub_${subjectCode.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      subjectCode: subjectCode.trim(),
      name: name.trim(),
      courseId: courseId.trim(),
      semester: Number(semester),
      isRequired: Boolean(isRequired),
      electiveGroup: electiveGroup ? String(electiveGroup).trim() : undefined,
      credits: Number(credits) || 3,
      isActive: true,
      createdAt: new Date().toISOString(),
    });

    await activeAuditRepo.recordAudit({
      entityType: 'USER',
      entityId: subject.id,
      action: 'CREATE',
      actorId: req.user!.email,
      actorRole: req.user!.role,
      reason: `Created subject master ${subject.subjectCode} (${subject.name})`,
      newData: subject as unknown as Record<string, unknown>,
    });

    res.status(201).json({ success: true, data: subject });
  }
);

// Create Student Profile (ADMIN ONLY)
academicRouter.post(
  '/students',
  requireAuth,
  requireRole([UserRole.ADMIN]),
  async (req: Request, res: Response) => {
    const { name, email, rollNo, enrollmentNo, courseId, currentSemester, admissionSessionId } = req.body;
    if (!name || !email || !rollNo || !enrollmentNo || !courseId) {
      return res.status(400).json({ success: false, message: 'Missing required student enrollment details' });
    }

    // Check course existence
    const course = await activeAcademicRepo.getCourseById(courseId);
    if (!course) {
      return res.status(400).json({ success: false, message: `Course ${courseId} does not exist` });
    }

    const studentId = `stu_${Date.now()}`;
    const userId = `usr_${Date.now()}`;

    // Create user account if not existing
    let user = await activeAcademicRepo.getUserByEmail(email.trim());
    if (!user) {
      user = await activeAcademicRepo.createUser({
        id: userId,
        email: email.trim().toLowerCase(),
        displayName: name.trim(),
        role: UserRole.STUDENT,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    const student = await activeAcademicRepo.createStudent({
      id: studentId,
      userId: user.id,
      enrollmentNo: enrollmentNo.trim(),
      rollNo: rollNo.trim(),
      name: name.trim(),
      email: user.email,
      courseId: courseId.trim(),
      currentSemester: Number(currentSemester) || 1,
      admissionSessionId: admissionSessionId || 'sess_2025_26',
      isActive: true,
      createdAt: new Date().toISOString(),
    });

    await activeAuditRepo.recordAudit({
      entityType: 'ENROLLMENT',
      entityId: student.id,
      action: 'CREATE',
      actorId: req.user!.email,
      actorRole: req.user!.role,
      reason: `Enrolled student ${student.name} (${student.enrollmentNo}) into ${course.courseCode}`,
      newData: student as unknown as Record<string, unknown>,
    });

    res.status(201).json({ success: true, data: student });
  }
);

