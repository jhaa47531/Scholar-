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

// Students
academicRouter.get('/students', requireAuth, async (req: Request, res: Response) => {
  const courseId = req.query.courseId as string | undefined;
  const semesterStr = req.query.semester as string | undefined;
  const semester = semesterStr ? parseInt(semesterStr, 10) : undefined;
  const students = await activeAcademicRepo.getStudents(courseId, semester);
  res.json({ success: true, data: students });
});

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
