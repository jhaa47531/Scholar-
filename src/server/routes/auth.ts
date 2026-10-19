import { Request, Response, Router } from 'express';
import { requireAuth } from '../middleware/auth.ts';
import { activeAcademicRepo } from '../../repositories/index.ts';
import { isDevelopmentAuthEnabled } from '../auth/firebaseAdmin.ts';

export const authRouter = Router();

/**
 * Returns current authenticated session details
 */
authRouter.get('/me', requireAuth, (req: Request, res: Response) => {
  const user = req.user!;
  res.json({
    success: true,
    data: {
      uid: user.uid,
      email: user.email,
      role: user.role,
      displayName: user.userAccount.displayName,
      teacherProfile: user.teacherProfile || null,
      studentProfile: user.studentProfile || null,
    },
  });
});

/**
 * Development/test-only token helper for local integration tests.
 */
authRouter.post('/token', async (req: Request, res: Response) => {
  if (!isDevelopmentAuthEnabled()) {
    return res.status(404).json({ success: false, message: 'Not found' });
  }

  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  const user = await activeAcademicRepo.getUserByEmail(email.trim());
  if (!user || !user.isActive) {
    return res.status(404).json({ success: false, message: `Active user not found for email: ${email}` });
  }

  // Generate trusted session token for development / testing
  const token = `SPIS_SECURE_TOKEN_${user.email}`;

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    },
  });
});
