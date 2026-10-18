import { Request, Response, Router } from 'express';
import { activeAuditRepo } from '../../repositories/index.ts';
import { requireAuth, requireRole } from '../middleware/auth.ts';
import { UserRole } from '../../types/domain.ts';

export const auditRouter = Router();

// Audit log inspection permitted for ADMIN and TEACHER (Student strictly forbidden)
auditRouter.get('/logs', requireAuth, requireRole([UserRole.ADMIN, UserRole.TEACHER]), async (req: Request, res: Response) => {
  const entityType = req.query.entityType as string | undefined;
  const entityId = req.query.entityId as string | undefined;
  const limitStr = req.query.limit as string | undefined;
  const limit = limitStr ? parseInt(limitStr, 10) : 50;

  const logs = await activeAuditRepo.getAuditLogs(entityType, entityId, limit);
  res.json({ success: true, data: logs });
});
