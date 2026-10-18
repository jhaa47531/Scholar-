import { Request, Response, Router } from 'express';
import { activeAcademicRepo, activeAssessmentRepo } from '../../repositories/index.ts';
import { defaultCalculationService } from '../../services/CalculationService.ts';
import { CURRENT_FORMULA_VERSION, SCORING_WEIGHTS_V1 } from '../../config/scoring.ts';
import { enforceStudentRecordIsolation, requireAuth } from '../middleware/auth.ts';
import {
  AssessmentRecord,
  SessionalNumber,
  SessionalOverallReport,
  SubmissionStatus,
} from '../../types/domain.ts';

export const reportRouter = Router();

reportRouter.get(
  '/sessional',
  requireAuth,
  enforceStudentRecordIsolation,
  async (req: Request, res: Response) => {
    const { sessionId, sessionalNumber } = req.query;
    const studentId = req.query.studentId as string;

    if (!studentId || !sessionId || !sessionalNumber) {
      return res.status(400).json({ success: false, message: 'studentId, sessionId, and sessionalNumber are required' });
    }

    const sessNum = Number(sessionalNumber) as SessionalNumber;
    const student = await activeAcademicRepo.getStudentById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Get all subjects for student's course and semester
    const subjects = await activeAcademicRepo.getSubjects(student.courseId, student.currentSemester);

    // Get all student assessments for this session and sessional
    const allAssessments = await activeAssessmentRepo.getStudentAssessments(student.id, sessionId as string, sessNum);
    const assessmentMap = new Map(allAssessments.map((a) => [a.subjectId, a]));

    const completionBlockers: string[] = [];
    const subjectScores: SessionalOverallReport['subjectScores'] = [];
    let totalScoreSum = 0;
    let completeSubjectCount = 0;

    for (const sub of subjects) {
      const asm = assessmentMap.get(sub.id);

      if (!asm || asm.submissionStatus !== SubmissionStatus.FINAL_SUBMITTED) {
        if (sub.isRequired) {
          completionBlockers.push(`Required subject "${sub.name} (${sub.subjectCode})" has no final-submitted assessment.`);
        }
        subjectScores.push({
          subjectId: sub.id,
          subjectCode: sub.subjectCode,
          subjectName: sub.name,
          isRequired: sub.isRequired,
          electiveGroup: sub.electiveGroup,
          obtainedMarks: null,
          maxMarks: 25,
          normalizedScore: null,
          attendancePct: null,
          performanceScore: null,
          examAttendance: asm ? asm.examAttendance : ('' as any),
          submissionStatus: asm ? asm.submissionStatus : (SubmissionStatus.DRAFT as any),
          isComplete: false,
        });
        continue;
      }

      // Has final-submitted assessment
      const calc = defaultCalculationService.calculatePerformanceScore(asm);
      if (!calc.isComplete) {
        if (sub.isRequired) {
          completionBlockers.push(
            `Subject "${sub.name}" missing scoring components: ${calc.missingComponents.join(', ')}`
          );
        }
      } else {
        totalScoreSum += calc.performanceScore!;
        completeSubjectCount++;
      }

      subjectScores.push({
        subjectId: sub.id,
        subjectCode: sub.subjectCode,
        subjectName: sub.name,
        isRequired: sub.isRequired,
        electiveGroup: sub.electiveGroup,
        obtainedMarks: asm.obtainedMarks ?? null,
        maxMarks: asm.maxMarks,
        normalizedScore: calc.normalizedSessionalScore ?? null,
        attendancePct: asm.classAttendancePct ?? null,
        performanceScore: calc.performanceScore ?? null,
        examAttendance: asm.examAttendance,
        submissionStatus: asm.submissionStatus,
        isComplete: calc.isComplete,
      });
    }

    const isEligible = completionBlockers.length === 0 && completeSubjectCount > 0;
    const overallAverageScore = isEligible
      ? Math.round((totalScoreSum / completeSubjectCount) * 100) / 100
      : null;

    const report: SessionalOverallReport = {
      id: `rep_${student.id}_s${sessNum}_${sessionId}`,
      studentId: student.id,
      sessionId: sessionId as string,
      courseId: student.courseId,
      semester: student.currentSemester,
      sessionalNumber: sessNum,
      reportVersion: '1.0',
      formulaVersion: CURRENT_FORMULA_VERSION,
      weightsSnapshot: { ...SCORING_WEIGHTS_V1 },
      subjectScores,
      overallAverageScore,
      isEligibleForOverallReport: isEligible,
      completionBlockers,
      generatedAt: new Date().toISOString(),
    };

    res.json({ success: true, data: report });
  }
);

reportRouter.get(
  '/comparison',
  requireAuth,
  enforceStudentRecordIsolation,
  async (req: Request, res: Response) => {
    const { sessionId } = req.query;
    const studentId = req.query.studentId as string;

    if (!studentId || !sessionId) {
      return res.status(400).json({ success: false, message: 'studentId and sessionId required' });
    }

    const student = await activeAcademicRepo.getStudentById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const s1Assessments = await activeAssessmentRepo.getStudentAssessments(
      student.id,
      sessionId as string,
      SessionalNumber.SESSIONAL_1
    );
    const s2Assessments = await activeAssessmentRepo.getStudentAssessments(
      student.id,
      sessionId as string,
      SessionalNumber.SESSIONAL_2
    );

    const subjects = await activeAcademicRepo.getSubjects(student.courseId, student.currentSemester);

    const s1Map = new Map(s1Assessments.map((a) => [a.subjectId, a]));
    const s2Map = new Map(s2Assessments.map((a) => [a.subjectId, a]));

    const comparisonRows = subjects.map((sub) => {
      const a1 = s1Map.get(sub.id);
      const a2 = s2Map.get(sub.id);

      const s1Submitted = a1 && a1.submissionStatus === SubmissionStatus.FINAL_SUBMITTED;
      const s2Submitted = a2 && a2.submissionStatus === SubmissionStatus.FINAL_SUBMITTED;

      const c1 = s1Submitted ? defaultCalculationService.calculatePerformanceScore(a1) : null;
      const c2 = s2Submitted ? defaultCalculationService.calculatePerformanceScore(a2) : null;

      let delta: number | null = null;
      if (c1?.isComplete && c2?.isComplete && c1.performanceScore !== undefined && c2.performanceScore !== undefined) {
        delta = Math.round((c2.performanceScore - c1.performanceScore) * 100) / 100;
      }

      return {
        subject: sub,
        s1: {
          status: s1Submitted ? 'FINAL_SUBMITTED' : (a1 ? 'DRAFT' : 'NOT_AVAILABLE'),
          obtainedMarks: s1Submitted ? a1.obtainedMarks : null,
          maxMarks: a1 ? a1.maxMarks : 25,
          performanceScore: c1?.isComplete ? c1.performanceScore : null,
        },
        s2: {
          status: s2Submitted ? 'FINAL_SUBMITTED' : (a2 ? 'DRAFT' : 'NOT_AVAILABLE'),
          obtainedMarks: s2Submitted ? a2.obtainedMarks : null,
          maxMarks: a2 ? a2.maxMarks : 25,
          performanceScore: c2?.isComplete ? c2.performanceScore : null,
        },
        delta,
        trend: delta === null ? 'INCOMPLETE' : delta > 0 ? 'IMPROVED' : delta < 0 ? 'DECLINED' : 'UNCHANGED',
      };
    });

    res.json({
      success: true,
      data: {
        student,
        comparisonRows,
      },
    });
  }
);
