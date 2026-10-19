import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { initializeFirebaseAdmin } from '../src/server/auth/firebaseAdmin.ts';
import { initializeRepositories, activeAssessmentRepo, activeAuditRepo } from '../src/repositories/index.ts';
import { UserRole } from '../src/types/domain.ts';

describe('Assessment Correction & Immutable Audit Verification', () => {
  before(async () => {
    initializeFirebaseAdmin();
    await initializeRepositories();
  });

  it('Post-Submission Correction: Requires reason, records before/after in audit trail', async () => {
    const assessmentId = 'asm_aarav_bca101_s1';

    // 1. Fetch current assessment
    const existing = await activeAssessmentRepo.getAssessment('stu_aarav', 'sub_bca101', 'cfg_bca_s1_sess2526');
    assert.ok(existing, 'Target assessment must exist');
    const oldMarks = existing.obtainedMarks;

    // 2. Perform authorized correction
    const newMarks = 24.0;
    const correctionReason = 'Re-evaluation of Question 4 per Dean approval (Grievance #G2025-09)';
    const authorizedBy = 'admin@institution.edu';

    const result = await activeAssessmentRepo.correctAssessmentWithAudit(
      existing.id,
      { obtainedMarks: newMarks },
      correctionReason,
      authorizedBy,
      UserRole.ADMIN,
      existing
    );
    const corrected = result.assessment;

    assert.equal(corrected.obtainedMarks, newMarks);
    assert.equal(corrected.correctionReason, correctionReason);
    assert.equal(corrected.correctionAuthorizedBy, authorizedBy);

    assert.ok(result.auditLog.id);
    assert.equal(result.auditLog.previousData?.obtainedMarks, oldMarks);
    assert.equal(result.auditLog.newData?.obtainedMarks, newMarks);
    assert.equal(result.auditLog.actorId, authorizedBy);
    assert.equal(result.auditLog.actorRole, UserRole.ADMIN);
    assert.equal(result.auditLog.reason, correctionReason);
    assert.ok(Number.isFinite(Date.parse(result.auditLog.timestamp)));

    // Confirm the correction operation persisted the audit record as part of the operation.
    const logs = await activeAuditRepo.getAuditLogs('ASSESSMENT', existing.id);
    const foundCorrection = logs.find((l) => l.action === 'CORRECTION' && l.reason === correctionReason);
    assert.ok(foundCorrection, 'Correction record must be found in persistent audit logs');
    assert.equal(foundCorrection?.actorId, authorizedBy);
    assert.equal(foundCorrection?.previousData?.obtainedMarks, oldMarks);
    assert.equal(foundCorrection?.newData?.obtainedMarks, newMarks);
  });
});
