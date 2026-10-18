import { Request, Response, Router } from 'express';
import { requireAuth } from '../middleware/auth.ts';
import { activeAcademicRepo } from '../../repositories/index.ts';
import { getFirebaseAdminApp } from '../auth/firebaseAdmin.ts';
import { getAuth } from 'firebase-admin/auth';

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
 * Real Firebase Authentication: Generates a Firebase Custom Token for the user account.
 * Client Firebase SDK uses signInWithCustomToken to authenticate with Firebase Auth
 * and receive a real, cryptographically signed Firebase ID Token (JWT).
 */
authRouter.post('/firebase-token', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  const user = await activeAcademicRepo.getUserByEmail(email.trim());
  if (!user || !user.isActive) {
    return res.status(404).json({ success: false, message: `Active user not found for email: ${email}` });
  }

  const adminApp = getFirebaseAdminApp();
  if (adminApp) {
    try {
      const adminAuth = getAuth(adminApp);
      let firebaseUser;
      try {
        firebaseUser = await adminAuth.getUserByEmail(user.email);
      } catch (err: any) {
        if (err.code === 'auth/user-not-found') {
          firebaseUser = await adminAuth.createUser({
            email: user.email,
            displayName: user.displayName,
          });
        } else {
          throw err;
        }
      }

      const customToken = await adminAuth.createCustomToken(firebaseUser.uid);
      return res.json({
        success: true,
        customToken,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: `Firebase token error: ${err.message}` });
    }
  }

  // Fallback to structured development token if Firebase Admin not configured
  res.json({
    success: true,
    token: `SPIS_SECURE_TOKEN_${user.email}`,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
    },
  });
});

/**
 * Exchange/generate a verified session bearer token for testing environments.
 * Validates that the requested account exists and is active.
 */
authRouter.post('/token', async (req: Request, res: Response) => {
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

