import { Request, Response, Router } from 'express';
import { activeAcademicRepo, activeAssessmentRepo, activeAuditRepo } from '../../repositories/index.ts';
import { defaultCalculationService } from '../../services/CalculationService.ts';
import {
  enforceStudentRecordIsolation,
  requireAssignedTeacher,
  requireAuth,
  requireRole,
} from '../middleware/auth.ts';
import {
  AssessmentRecord,
  ExamAttendance,
  SessionalConfig,
  SessionalNumber,
  SubmissionStatus,
  UserRole,
} from '../../types/domain.ts';

export const assessmentRouter = Router();

// Sessional Configs list
assessmentRouter.get('/configs', requireAuth, async (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string | undefined;
  const courseId = req.query.courseId as string | undefined;
  const configs = await activeAssessmentRepo.listSessionalConfigs(sessionId, courseId);
  res.json({ success: true, data: configs });
});

// Configure or update sessional (STRICT ADMIN ONLY)
assessmentRouter.post('/configs', requireAuth, requireRole([UserRole.ADMIN]), async (req: Request, res: Response) => {
  const { sessionId, courseId, semester, sessionalNumber, maxMarks, status } = req.body;
  if (!sessionId || !courseId || !semester || !sessionalNumber) {
    return res.status(400).json({ success: false, message: 'Missing required sessional configuration fields' });
  }

  const configId = `cfg_${courseId}_s${sessionalNumber}_${sessionId}`;
  const config: SessionalConfig = {
    id: configId,
    sessionId,
    courseId,
    semester: Number(semester),
    sessionalNumber: Number(sessionalNumber) as SessionalNumber,
    maxMarks: Number(maxMarks) || 25,
    status: status || 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const saved = await activeAssessmentRepo.saveSessionalConfig(config);

  await activeAuditRepo.recordAudit({
    entityType: 'SESSIONAL_CONFIG',
    entityId: saved.id,
    action: 'CREATE',
    actorId: req.user!.email,
    actorRole: req.user!.role,
    reason: `Configured Sessional ${sessionalNumber} for Course ${courseId} Sem ${semester}`,
    newData: saved as unknown as Record<string, unknown>,
  });

  res.status(201).json({ success: true, data: saved });
});

// Teacher assessment entry data
assessmentRouter.get(
  '/teacher/subject-sheet',
  requireAuth,
  requireRole([UserRole.ADMIN, UserRole.TEACHER]),
  requireAssignedTeacher,
  async (req: Request, res: Response) => {
    const { subjectId, sessionId, sessionalNumber } = req.query;

    if (!subjectId || !sessionId || !sessionalNumber) {
      return res.status(400).json({ success: false, message: 'subjectId, sessionId, and sessionalNumber are required' });
    }

    const teacherId = req.user!.role === UserRole.TEACHER ? req.user!.teacherProfile!.id : (req.query.teacherId as string || 'ADMIN');

    const subject = await activeAcademicRepo.getSubjectById(subjectId as string);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    // Sessional Config
    const sessNum = Number(sessionalNumber) as SessionalNumber;
    const config = await activeAssessmentRepo.getSessionalConfig(
      sessionId as string,
      subject.courseId,
      subject.semester,
      sessNum
    );

    if (!config) {
      return res.status(404).json({
        success: false,
        message: `Sessional ${sessNum} is not configured for course ${subject.courseId} semester ${subject.semester}`,
      });
    }

    // Students in course and semester
    const students = await activeAcademicRepo.getStudents(subject.courseId, subject.semester);

    // Existing assessments
    const assessments = await activeAssessmentRepo.getSubjectAssessments(subject.id, config.id);
    const assessmentMap = new Map(assessments.map((a) => [a.studentId, a]));

    const rows = students.map((stu) => {
      const existing = assessmentMap.get(stu.id);
      return {
        student: stu,
        assessment: existing || {
          id: `asm_${stu.id}_${subject.id}_s${sessNum}`,
          studentId: stu.id,
          subjectId: subject.id,
          configId: config.id,
          sessionId: sessionId as string,
          semester: subject.semester,
          sessionalNumber: sessNum,
          obtainedMarks: null,
          maxMarks: config.maxMarks,
          examAttendance: ExamAttendance.ATTENDED,
          classAttendancePct: null,
          assignmentScore: null,
          presentationScore: null,
          classInteractionScore: null,
          submissionStatus: SubmissionStatus.DRAFT,
          submittingTeacherId: teacherId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };
    });

    res.json({
      success: true,
      data: {
        subject,
        config,
        rows,
      },
    });
  }
);

// Save Draft
assessmentRouter.post(
  '/draft',
  requireAuth,
  requireRole([UserRole.ADMIN, UserRole.TEACHER]),
  async (req: Request, res: Response) => {
    const { assessment } = req.body;
    if (!assessment) {
      return res.status(400).json({ success: false, message: 'Invalid payload: assessment object required' });
    }

    const teacherId = req.user!.role === UserRole.TEACHER ? req.user!.teacherProfile!.id : 'ADMIN';

    // Verify teacher assignment boundary
    if (req.user!.role === UserRole.TEACHER) {
      const isAssigned = await activeAcademicRepo.isTeacherAssignedToSubject(
        teacherId,
        assessment.subjectId,
        assessment.sessionId
      );
      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          code: 'UNAUTHORIZED_SUBJECT_ACCESS',
          message: 'Forbidden: You are not assigned to this subject.',
        });
      }
    }

    const saved = await activeAssessmentRepo.saveDraft({
      ...assessment,
      submittingTeacherId: teacherId,
    });

    res.json({ success: true, message: 'Draft saved securely. Invisible to students.', data: saved });
  }
);

// Final Submit Batch
assessmentRouter.post(
  '/final-submit',
  requireAuth,
  requireRole([UserRole.ADMIN, UserRole.TEACHER]),
  async (req: Request, res: Response) => {
    const { assessments } = req.body as { assessments: AssessmentRecord[] };

    if (!Array.isArray(assessments) || assessments.length === 0) {
      return res.status(400).json({ success: false, message: 'Valid assessments array required' });
    }

    const teacherId = req.user!.role === UserRole.TEACHER ? req.user!.teacherProfile!.id : 'ADMIN';

    // Validate teacher authorization for all records
    for (const record of assessments) {
      if (req.user!.role === UserRole.TEACHER) {
        const isAssigned = await activeAcademicRepo.isTeacherAssignedToSubject(
          teacherId,
          record.subjectId,
          record.sessionId
        );
        if (!isAssigned) {
          return res.status(403).json({
            success: false,
            code: 'UNAUTHORIZED_SUBJECT_ACCESS',
            message: `Forbidden: Faculty member is not authorized for subject ${record.subjectId}`,
          });
        }
      }

      // Validate marks boundary
      if (record.examAttendance === ExamAttendance.ATTENDED) {
        if (record.obtainedMarks !== null && record.obtainedMarks !== undefined) {
          if (record.obtainedMarks < 0 || record.obtainedMarks > record.maxMarks) {
            return res.status(400).json({
              success: false,
              message: `Obtained marks ${record.obtainedMarks} exceeds maximum ${record.maxMarks} for student ${record.studentId}`,
            });
          }
        }
      } else {
        // Business Rule: Absent student receives 0, explicitly marked NOT_ATTENDED
        record.obtainedMarks = 0;
      }
    }

    // Atomically save final submissions
    const finalized = await activeAssessmentRepo.finalSubmitBatch(teacherId, assessments);

    // Record audit log
    await activeAuditRepo.recordAudit({
      entityType: 'ASSESSMENT',
      entityId: `BATCH_${assessments[0].subjectId}_S${assessments[0].sessionalNumber}`,
      action: 'FINAL_SUBMIT',
      actorId: req.user!.email,
      actorRole: req.user!.role,
      reason: `Final submission of ${assessments.length} student marks for subject ${assessments[0].subjectId}`,
    });

    res.json({
      success: true,
      message: 'Assessment finalized and submitted. Marks are now immediately visible to enrolled students.',
      data: finalized,
    });
  }
);

// Student marks view: Strict record isolation
assessmentRouter.get(
  '/student/marks',
  requireAuth,
  enforceStudentRecordIsolation,
  async (req: Request, res: Response) => {
    const studentId = req.query.studentId as string;
    const sessionId = req.query.sessionId as string;
    const sessionalNumber = req.query.sessionalNumber;

    if (!studentId || !sessionId) {
      return res.status(400).json({ success: false, message: 'studentId and sessionId required' });
    }

    const sessNum = sessionalNumber ? (Number(sessionalNumber) as SessionalNumber) : undefined;
    const allAssessments = await activeAssessmentRepo.getStudentAssessments(studentId, sessionId, sessNum);

    // Students can ONLY see FINAL_SUBMITTED marks. Drafts remain strictly invisible!
    const visibleToStudent = allAssessments.filter(
      (a) => a.submissionStatus === SubmissionStatus.FINAL_SUBMITTED
    );

    // Attach subject details and calculation breakdown
    const enriched = await Promise.all(
      visibleToStudent.map(async (rec) => {
        const subject = await activeAcademicRepo.getSubjectById(rec.subjectId);
        const calcResult = defaultCalculationService.calculatePerformanceScore(rec);
        return {
          ...rec,
          subject,
          calculation: calcResult,
        };
      })
    );

    res.json({
      success: true,
      data: enriched,
    });
  }
);
