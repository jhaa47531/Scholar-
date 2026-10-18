import {
  AssessmentRecord,
  ExamAttendance,
  PerformanceCalculationResult,
  ScoringWeights,
} from '../types/domain.ts';
import { SCORING_WEIGHTS_V1 } from '../config/scoring.ts';

export class CalculationService {
  private weights: ScoringWeights;

  constructor(weights: ScoringWeights = SCORING_WEIGHTS_V1) {
    this.weights = weights;
  }

  /**
   * Normalizes obtained marks to a 0-100 scale.
   * Handles examination absence: absent students receive 0 score, explicitly marked NOT_ATTENDED.
   */
  public normalizeSessionalMarks(
    obtainedMarks: number | null | undefined,
    maxMarks: number,
    attendance: ExamAttendance
  ): number | null {
    if (attendance === ExamAttendance.NOT_ATTENDED) {
      return 0; // Explicitly absent, scored 0
    }

    if (obtainedMarks === null || obtainedMarks === undefined) {
      return null; // Missing marks, distinct from genuine zero
    }

    if (maxMarks <= 0) {
      throw new Error('Maximum marks must be strictly greater than zero');
    }

    if (obtainedMarks < 0 || obtainedMarks > maxMarks) {
      throw new Error(`Obtained marks (${obtainedMarks}) must be between 0 and maximum marks (${maxMarks})`);
    }

    return (obtainedMarks / maxMarks) * 100;
  }

  /**
   * Calculates overall weighted performance score.
   * Performance Score = 0.40M + 0.20A + 0.15S + 0.15R + 0.10I
   */
  public calculatePerformanceScore(assessment: AssessmentRecord): PerformanceCalculationResult {
    const missingComponents: string[] = [];

    // 1. Sessional Exam Score Check
    let normalizedM: number | null = null;
    if (assessment.examAttendance === ExamAttendance.NOT_ATTENDED) {
      normalizedM = 0;
    } else if (assessment.obtainedMarks === null || assessment.obtainedMarks === undefined) {
      missingComponents.push('Sessional Exam Marks');
    } else {
      normalizedM = this.normalizeSessionalMarks(
        assessment.obtainedMarks,
        assessment.maxMarks,
        assessment.examAttendance
      );
    }

    // 2. Class Attendance (0-100%)
    if (assessment.classAttendancePct === null || assessment.classAttendancePct === undefined) {
      missingComponents.push('Class Attendance Percentage');
    } else if (assessment.classAttendancePct < 0 || assessment.classAttendancePct > 100) {
      missingComponents.push('Valid Class Attendance (0-100%)');
    }

    // 3. Assignment Score (0-100%)
    if (assessment.assignmentScore === null || assessment.assignmentScore === undefined) {
      missingComponents.push('Assignment Performance');
    } else if (assessment.assignmentScore < 0 || assessment.assignmentScore > 100) {
      missingComponents.push('Valid Assignment Score (0-100%)');
    }

    // 4. Presentation Score (0-100%)
    if (assessment.presentationScore === null || assessment.presentationScore === undefined) {
      missingComponents.push('Presentation Performance');
    } else if (assessment.presentationScore < 0 || assessment.presentationScore > 100) {
      missingComponents.push('Valid Presentation Score (0-100%)');
    }

    // 5. Class Interaction Score (0-100%)
    if (assessment.classInteractionScore === null || assessment.classInteractionScore === undefined) {
      missingComponents.push('Class Interaction Performance');
    } else if (assessment.classInteractionScore < 0 || assessment.classInteractionScore > 100) {
      missingComponents.push('Valid Class Interaction Score (0-100%)');
    }

    if (missingComponents.length > 0 || normalizedM === null) {
      return {
        isComplete: false,
        missingComponents,
        normalizedSessionalScore: normalizedM ?? undefined,
        formulaVersion: this.weights.version,
        weightsSnapshot: { ...this.weights },
      };
    }

    const A = assessment.classAttendancePct!;
    const S = assessment.assignmentScore!;
    const R = assessment.presentationScore!;
    const I = assessment.classInteractionScore!;

    const rawScore =
      this.weights.sessionalExamWeight * normalizedM +
      this.weights.classAttendanceWeight * A +
      this.weights.assignmentWeight * S +
      this.weights.presentationWeight * R +
      this.weights.classInteractionWeight * I;

    // Round to 2 decimal places
    const performanceScore = Math.round(rawScore * 100) / 100;

    return {
      isComplete: true,
      missingComponents: [],
      normalizedSessionalScore: Math.round(normalizedM * 100) / 100,
      performanceScore,
      formulaVersion: this.weights.version,
      weightsSnapshot: { ...this.weights },
    };
  }
}

export const defaultCalculationService = new CalculationService();
