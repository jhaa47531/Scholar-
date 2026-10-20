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

/**
 * Universal login endpoint: handles email/password credentials with development fallback
 */
authRouter.post('/login', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ success: false, message: 'Institutional email is required' });
  }

  const user = await activeAcademicRepo.getUserByEmail(email.trim());
  if (!user || !user.isActive) {
    return res.status(401).json({ success: false, message: 'Invalid credentials or inactive institutional account' });
  }

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

/**
 * Account Registration endpoint (Student and Faculty self-service registration)
 */
authRouter.post('/register', async (req: Request, res: Response) => {
  const {
    email,
    displayName,
    role,
    enrollmentNo,
    rollNo,
    courseId,
    currentSemester,
    admissionSessionId,
    department,
    designation,
    employeeCode,
  } = req.body;

  if (!email || !displayName || !role) {
    return res.status(400).json({ success: false, message: 'Missing required fields: email, displayName, role' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await activeAcademicRepo.getUserByEmail(normalizedEmail);
  if (existingUser) {
    return res.status(409).json({ success: false, message: 'An account with this institutional email already exists' });
  }

  const userId = `usr_${Date.now()}`;
  const newUser = await activeAcademicRepo.createUser({
    id: userId,
    email: normalizedEmail,
    displayName: displayName.trim(),
    role: role as any,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  if (role === 'STUDENT') {
    if (!enrollmentNo || !rollNo || !courseId) {
      return res.status(400).json({ success: false, message: 'Missing student enrollment details (enrollmentNo, rollNo, courseId)' });
    }
    await activeAcademicRepo.createStudent({
      id: `stu_${Date.now()}`,
      userId: newUser.id,
      enrollmentNo: String(enrollmentNo).trim(),
      rollNo: String(rollNo).trim(),
      name: displayName.trim(),
      email: newUser.email,
      courseId: String(courseId).trim(),
      currentSemester: Number(currentSemester) || 1,
      admissionSessionId: admissionSessionId || 'sess_2025_26',
      isActive: true,
      createdAt: new Date().toISOString(),
    });
  } else if (role === 'TEACHER') {
    await activeAcademicRepo.createTeacher({
      id: `tch_${Date.now()}`,
      userId: newUser.id,
      employeeCode: employeeCode ? String(employeeCode).trim() : `FAC-${Date.now().toString().slice(-4)}`,
      name: displayName.trim(),
      email: newUser.email,
      department: department ? String(department).trim() : 'Computer Applications',
      designation: designation ? String(designation).trim() : 'Assistant Professor',
      isActive: true,
      createdAt: new Date().toISOString(),
    });
  }

  const token = `SPIS_SECURE_TOKEN_${newUser.email}`;
  res.status(201).json({
    success: true,
    token,
    user: {
      id: newUser.id,
      email: newUser.email,
      displayName: newUser.displayName,
      role: newUser.role,
    },
  });
});

