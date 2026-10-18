import { ScoringWeights } from '../types/domain.ts';

export const CURRENT_FORMULA_VERSION = 'v1.0';

export const SCORING_WEIGHTS_V1: ScoringWeights = {
  version: CURRENT_FORMULA_VERSION,
  sessionalExamWeight: 0.40, // 40%
  classAttendanceWeight: 0.20, // 20%
  assignmentWeight: 0.15, // 15%
  presentationWeight: 0.15, // 15%
  classInteractionWeight: 0.10, // 10%
};

/**
 * Validates that scoring weights sum exactly to 1.0 (100%)
 */
export function validateWeightsSum(weights: ScoringWeights): boolean {
  const sum =
    weights.sessionalExamWeight +
    weights.classAttendanceWeight +
    weights.assignmentWeight +
    weights.presentationWeight +
    weights.classInteractionWeight;
  return Math.abs(sum - 1.0) < 0.0001;
}

if (!validateWeightsSum(SCORING_WEIGHTS_V1)) {
  throw new Error('FATAL: Scoring weights configuration does not sum to 1.0 (100%)');
}
