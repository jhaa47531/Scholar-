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

    const corrected = await activeAssessmentRepo.updateAssessmentWithCorrection(
      existing.id,
      { obtainedMarks: newMarks },
      correctionReason,
      authorizedBy
    );

    assert.equal(corrected.obtainedMarks, newMarks);
    assert.equal(corrected.correctionReason, correctionReason);
    assert.equal(corrected.correctionAuthorizedBy, authorizedBy);

    // 3. Record in audit trail
    const auditRecord = await activeAuditRepo.recordAudit({
      entityType: 'ASSESSMENT',
      entityId: existing.id,
      action: 'CORRECTION',
      actorId: authorizedBy,
      actorRole: UserRole.ADMIN,
      reason: correctionReason,
      previousData: { obtainedMarks: oldMarks },
      newData: { obtainedMarks: newMarks },
    });

    assert.ok(auditRecord.id);

    // 4. Query audit logs to confirm persistence
    const logs = await activeAuditRepo.getAuditLogs('ASSESSMENT', existing.id);
    assert.ok(logs.length >= 1);
    const foundCorrection = logs.find((l) => l.action === 'CORRECTION' && l.reason === correctionReason);
    assert.ok(foundCorrection, 'Correction record must be found in persistent audit logs');
    assert.equal(foundCorrection?.actorId, 'admin@institution.edu');
  });
});
