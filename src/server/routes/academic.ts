import { Request, Response, Router } from 'express';
import { activeAcademicRepo, activeAuditRepo } from '../../repositories/index.ts';
import { requireAuth, requireRole } from '../middleware/auth.ts';
import { UserRole, CourseStructure, SubjectMaster, StudentProfile, TeacherProfile } from '../../types/domain.ts';
import { getFirebaseAdminApp } from '../auth/firebaseAdmin.ts';

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
    try {
      const { courseCode, name, totalSemesters, durationYears } = req.body;
      if (!courseCode || !name || !totalSemesters || !durationYears) {
        return res.status(400).json({ success: false, message: 'Missing courseCode, name, totalSemesters, or durationYears' });
      }

      const existingCourses = await activeAcademicRepo.getCourses();
      const codeUpper = courseCode.trim().toUpperCase();
      if (existingCourses.some((c) => c.courseCode.toUpperCase() === codeUpper)) {
        return res.status(409).json({ success: false, message: `Course with code ${codeUpper} already exists.` });
      }

      const courseId = `crs_${courseCode.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      const course = await activeAcademicRepo.createCourse({
        id: courseId,
        courseCode: codeUpper,
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
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Failed to create course' });
    }
  }
);

// Edit Course (ADMIN ONLY)
academicRouter.put(
  '/courses/:id',
  requireAuth,
  requireRole([UserRole.ADMIN]),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, totalSemesters, durationYears, isActive } = req.body;

      const course = await activeAcademicRepo.getCourseById(id);
      if (!course) {
        return res.status(404).json({ success: false, message: 'Course not found' });
      }

      const updates: Partial<CourseStructure> = {};
      if (name) updates.name = String(name).trim();
      if (totalSemesters !== undefined) updates.totalSemesters = Number(totalSemesters);
      if (durationYears !== undefined) updates.durationYears = Number(durationYears);
      if (isActive !== undefined) updates.isActive = Boolean(isActive);

      const updated = await activeAcademicRepo.updateCourse(id, updates);

      await activeAuditRepo.recordAudit({
        entityType: 'USER',
        entityId: id,
        action: 'UPDATE',
        actorId: req.user!.email,
        actorRole: req.user!.role,
        reason: `Updated course structure ${course.courseCode}`,
        newData: updated as unknown as Record<string, unknown>,
      });

      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Failed to update course' });
    }
  }
);

// Delete / Archive Course (ADMIN ONLY)
academicRouter.delete(
  '/courses/:id',
  requireAuth,
  requireRole([UserRole.ADMIN]),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const course = await activeAcademicRepo.getCourseById(id);
      if (!course) {
        return res.status(404).json({ success: false, message: 'Course not found' });
      }

      // Check linked subjects and students
      const subjects = await activeAcademicRepo.getSubjects(id);
      const students = await activeAcademicRepo.getStudents(id);

      if (subjects.length > 0 || students.length > 0) {
        // Safe deactivation instead of permanent destructive cascade
        const updated = await activeAcademicRepo.updateCourse(id, { isActive: false });
        return res.json({
          success: true,
          action: 'DEACTIVATED',
          message: `Course has ${subjects.length} subjects and ${students.length} students linked. It has been deactivated to preserve academic history.`,
          data: updated,
        });
      }

      await activeAcademicRepo.deleteCourse(id);
      res.json({ success: true, action: 'DELETED', message: 'Course successfully deleted.' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Failed to delete course' });
    }
  }
);

// Create Subject (ADMIN ONLY)
academicRouter.post(
  '/subjects',
  requireAuth,
  requireRole([UserRole.ADMIN]),
  async (req: Request, res: Response) => {
    try {
      const { subjectCode, name, courseId, semester, isRequired, electiveGroup, credits } = req.body;
      if (!subjectCode || !name || !courseId || semester === undefined) {
        return res.status(400).json({ success: false, message: 'Missing subjectCode, name, courseId, or semester' });
      }

      // Verify course exists
      const course =
        (await activeAcademicRepo.getCourseById(courseId)) ||
        (await activeAcademicRepo.getCourses()).find((c) => c.courseCode.toUpperCase() === courseId.toUpperCase());
      if (!course) {
        return res.status(400).json({ success: false, message: `Course ${courseId} does not exist.` });
      }

      const existingSubs = await activeAcademicRepo.getSubjects();
      const codeTrimmed = subjectCode.trim();
      if (existingSubs.some((s) => s.subjectCode.toUpperCase() === codeTrimmed.toUpperCase())) {
        return res.status(409).json({ success: false, message: `Subject code ${codeTrimmed} already exists.` });
      }

      const subjectId = `sub_${codeTrimmed.toLowerCase().replace(/[^a-z0-9]/g, '')}_${Date.now().toString().slice(-4)}`;
      const subject = await activeAcademicRepo.createSubject({
        id: subjectId,
        subjectCode: codeTrimmed,
        name: name.trim(),
        courseId: course.id,
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
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Failed to create subject' });
    }
  }
);

// Edit Subject (ADMIN ONLY)
academicRouter.put(
  '/subjects/:id',
  requireAuth,
  requireRole([UserRole.ADMIN]),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { subjectCode, name, courseId, semester, isRequired, electiveGroup, credits, isActive } = req.body;

      const subject = await activeAcademicRepo.getSubjectById(id);
      if (!subject) {
        return res.status(404).json({ success: false, message: 'Subject not found' });
      }

      const updates: Partial<SubjectMaster> = {};
      if (subjectCode) updates.subjectCode = String(subjectCode).trim();
      if (name) updates.name = String(name).trim();
      if (courseId) {
        const course =
          (await activeAcademicRepo.getCourseById(courseId)) ||
          (await activeAcademicRepo.getCourses()).find((c) => c.courseCode.toUpperCase() === courseId.toUpperCase());
        if (course) updates.courseId = course.id;
      }
      if (semester !== undefined) updates.semester = Number(semester);
      if (isRequired !== undefined) updates.isRequired = Boolean(isRequired);
      if (electiveGroup !== undefined) updates.electiveGroup = electiveGroup ? String(electiveGroup).trim() : undefined;
      if (credits !== undefined) updates.credits = Number(credits);
      if (isActive !== undefined) updates.isActive = Boolean(isActive);

      const updated = await activeAcademicRepo.updateSubject(id, updates);

      await activeAuditRepo.recordAudit({
        entityType: 'USER',
        entityId: id,
        action: 'UPDATE',
        actorId: req.user!.email,
        actorRole: req.user!.role,
        reason: `Updated subject ${updated.subjectCode} (${updated.name})`,
        newData: updated as unknown as Record<string, unknown>,
      });

      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Failed to update subject' });
    }
  }
);

// Safe Delete / Deactivate Subject (ADMIN ONLY)
academicRouter.delete(
  '/subjects/:id',
  requireAuth,
  requireRole([UserRole.ADMIN]),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const subject = await activeAcademicRepo.getSubjectById(id);
      if (!subject) {
        return res.status(404).json({ success: false, message: 'Subject not found' });
      }

      // Check linked teacher assignments
      const assignments = await activeAcademicRepo.getTeacherAssignments();
      const linkedAssignments = assignments.filter((a) => a.subjectId === id);

      if (linkedAssignments.length > 0) {
        const updated = await activeAcademicRepo.updateSubject(id, { isActive: false });
        return res.json({
          success: true,
          action: 'DEACTIVATED',
          message: `Subject is assigned to ${linkedAssignments.length} faculty teaching assignment(s). It has been deactivated to preserve academic records.`,
          data: updated,
        });
      }

      await activeAcademicRepo.deleteSubject(id);
      res.json({ success: true, action: 'DELETED', message: `Subject ${subject.subjectCode} deleted.` });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Failed to delete subject' });
    }
  }
);

// Create Student Profile (ADMIN ONLY)
academicRouter.post(
  '/students',
  requireAuth,
  requireRole([UserRole.ADMIN]),
  async (req: Request, res: Response) => {
    try {
      const { name, email, rollNo, enrollmentNo, courseId, currentSemester, admissionSessionId } = req.body;
      if (!name || !email || !rollNo || !enrollmentNo || !courseId) {
        return res.status(400).json({ success: false, message: 'Missing required student enrollment details: name, email, rollNo, enrollmentNo, courseId.' });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const normalizedRoll = rollNo.trim().toUpperCase();
      const normalizedEnrollment = enrollmentNo.trim().toUpperCase();

      // Check course existence
      const course =
        (await activeAcademicRepo.getCourseById(courseId)) ||
        (await activeAcademicRepo.getCourses()).find((c) => c.courseCode.toUpperCase() === courseId.toUpperCase());
      if (!course) {
        return res.status(400).json({ success: false, message: `Course ${courseId} does not exist.` });
      }

      // Validate semester range
      const semNum = Number(currentSemester) || 1;
      if (semNum < 1 || semNum > course.totalSemesters) {
        return res.status(400).json({ success: false, message: `Semester must be between 1 and ${course.totalSemesters} for ${course.courseCode}.` });
      }

      // Check for duplicate student email, enrollmentNo, or rollNo
      const existingStudents = await activeAcademicRepo.getStudents();
      const dupEmail = existingStudents.find((s) => s.email.toLowerCase() === normalizedEmail);
      if (dupEmail) {
        return res.status(409).json({ success: false, message: `A student with email ${normalizedEmail} already exists.` });
      }
      const dupEnroll = existingStudents.find((s) => s.enrollmentNo.toUpperCase() === normalizedEnrollment);
      if (dupEnroll) {
        return res.status(409).json({ success: false, message: `A student with enrollment number ${normalizedEnrollment} already exists.` });
      }
      const dupRoll = existingStudents.find((s) => s.rollNo.toUpperCase() === normalizedRoll && s.courseId === course.id);
      if (dupRoll) {
        return res.status(409).json({ success: false, message: `A student with roll number ${normalizedRoll} already exists in ${course.courseCode}.` });
      }

      const studentId = `stu_${Date.now()}`;
      const userId = `usr_${Date.now()}`;

      // Create user account if not existing
      let user = await activeAcademicRepo.getUserByEmail(normalizedEmail);
      if (!user) {
        user = await activeAcademicRepo.createUser({
          id: userId,
          email: normalizedEmail,
          displayName: name.trim(),
          role: UserRole.STUDENT,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      // Provision Firebase Auth user if Firebase Admin is available so student can authenticate
      const fbApp = getFirebaseAdminApp();
      if (fbApp) {
        try {
          const auth = (await import('firebase-admin/auth')).getAuth(fbApp);
          try {
            await auth.getUserByEmail(normalizedEmail);
          } catch {
            await auth.createUser({
              email: normalizedEmail,
              password: 'institutionalPass123!',
              displayName: name.trim(),
            });
            console.log(`[Auth Provisioning] Created Firebase Auth user for new student ${normalizedEmail}`);
          }
        } catch (authErr: any) {
          console.warn('[Auth Provisioning] Could not create Firebase Auth user:', authErr.message);
        }
      }

      const student = await activeAcademicRepo.createStudent({
        id: studentId,
        userId: user.id,
        enrollmentNo: normalizedEnrollment,
        rollNo: normalizedRoll,
        name: name.trim(),
        email: user.email,
        courseId: course.id,
        currentSemester: semNum,
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
        reason: `Enrolled student ${student.name} (${student.enrollmentNo}) into ${course.courseCode} Semester ${student.currentSemester}`,
        newData: student as unknown as Record<string, unknown>,
      });

      res.status(201).json({ success: true, data: student });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Failed to create student' });
    }
  }
);

// Edit / Update Student (ADMIN ONLY)
academicRouter.put(
  '/students/:id',
  requireAuth,
  requireRole([UserRole.ADMIN]),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, rollNo, enrollmentNo, currentSemester, courseId, isActive } = req.body;

      const student = await activeAcademicRepo.getStudentById(id);
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student profile not found.' });
      }

      const updates: Partial<StudentProfile> = {};
      if (name) updates.name = String(name).trim();
      if (rollNo) updates.rollNo = String(rollNo).trim().toUpperCase();
      if (enrollmentNo) updates.enrollmentNo = String(enrollmentNo).trim().toUpperCase();
      if (currentSemester !== undefined) updates.currentSemester = Number(currentSemester);
      if (courseId) updates.courseId = String(courseId).trim();
      if (isActive !== undefined) updates.isActive = Boolean(isActive);

      const updated = await activeAcademicRepo.updateStudent(id, updates);

      await activeAuditRepo.recordAudit({
        entityType: 'USER',
        entityId: id,
        action: 'UPDATE',
        actorId: req.user!.email,
        actorRole: req.user!.role,
        reason: `Updated student record for ${updated.name} (${updated.enrollmentNo})`,
        newData: updated as unknown as Record<string, unknown>,
      });

      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Failed to update student' });
    }
  }
);

// Create Faculty / Teacher Profile (ADMIN ONLY)
academicRouter.post(
  '/teachers',
  requireAuth,
  requireRole([UserRole.ADMIN]),
  async (req: Request, res: Response) => {
    try {
      const { name, email, employeeCode, department, designation } = req.body;
      if (!name || !email) {
        return res.status(400).json({ success: false, message: 'Faculty name and institutional email are required.' });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const code = employeeCode ? String(employeeCode).trim().toUpperCase() : `FAC-${Date.now().toString().slice(-4)}`;

      // Check duplicates
      const existingTeachers = await activeAcademicRepo.getTeachers();
      if (existingTeachers.some((t) => t.email.toLowerCase() === normalizedEmail)) {
        return res.status(409).json({ success: false, message: `Faculty with email ${normalizedEmail} already exists.` });
      }
      if (existingTeachers.some((t) => t.employeeCode.toUpperCase() === code)) {
        return res.status(409).json({ success: false, message: `Faculty with employee code ${code} already exists.` });
      }

      const teacherId = `tch_${Date.now()}`;
      const userId = `usr_${Date.now()}`;

      // Create user account if not existing
      let user = await activeAcademicRepo.getUserByEmail(normalizedEmail);
      if (!user) {
        user = await activeAcademicRepo.createUser({
          id: userId,
          email: normalizedEmail,
          displayName: name.trim(),
          role: UserRole.TEACHER,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      // Provision Firebase Auth user if available
      const fbApp = getFirebaseAdminApp();
      if (fbApp) {
        try {
          const auth = (await import('firebase-admin/auth')).getAuth(fbApp);
          try {
            await auth.getUserByEmail(normalizedEmail);
          } catch {
            await auth.createUser({
              email: normalizedEmail,
              password: 'institutionalPass123!',
              displayName: name.trim(),
            });
          }
        } catch (authErr: any) {
          console.warn('[Auth Provisioning] Could not create Firebase Auth user for teacher:', authErr.message);
        }
      }

      const teacher = await activeAcademicRepo.createTeacher({
        id: teacherId,
        userId: user.id,
        employeeCode: code,
        name: name.trim(),
        email: user.email,
        department: department ? String(department).trim() : 'Computer Applications',
        designation: designation ? String(designation).trim() : 'Assistant Professor',
        isActive: true,
        createdAt: new Date().toISOString(),
      });

      await activeAuditRepo.recordAudit({
        entityType: 'USER',
        entityId: teacher.id,
        action: 'CREATE',
        actorId: req.user!.email,
        actorRole: req.user!.role,
        reason: `Created faculty profile for ${teacher.name} (${teacher.employeeCode})`,
        newData: teacher as unknown as Record<string, unknown>,
      });

      res.status(201).json({ success: true, data: teacher });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Failed to create faculty member' });
    }
  }
);

// Edit / Update Faculty (ADMIN ONLY)
academicRouter.put(
  '/teachers/:id',
  requireAuth,
  requireRole([UserRole.ADMIN]),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, department, designation, employeeCode, isActive } = req.body;

      const teacher = await activeAcademicRepo.getTeacherById(id);
      if (!teacher) {
        return res.status(404).json({ success: false, message: 'Faculty profile not found.' });
      }

      const updates: Partial<TeacherProfile> = {};
      if (name) updates.name = String(name).trim();
      if (department) updates.department = String(department).trim();
      if (designation) updates.designation = String(designation).trim();
      if (employeeCode) updates.employeeCode = String(employeeCode).trim().toUpperCase();
      if (isActive !== undefined) updates.isActive = Boolean(isActive);

      const updated = await activeAcademicRepo.updateTeacher(id, updates);

      await activeAuditRepo.recordAudit({
        entityType: 'USER',
        entityId: id,
        action: 'UPDATE',
        actorId: req.user!.email,
        actorRole: req.user!.role,
        reason: `Updated faculty profile for ${updated.name} (${updated.employeeCode})`,
        newData: updated as unknown as Record<string, unknown>,
      });

      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Failed to update faculty' });
    }
  }
);

