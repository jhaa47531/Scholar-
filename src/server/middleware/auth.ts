import { NextFunction, Request, Response } from 'express';
import { AuthenticatedUserContext, verifyTokenAndResolveUser } from '../auth/firebaseAdmin.ts';
import { activeAcademicRepo } from '../../repositories/index.ts';
import { UserRole } from '../../types/domain.ts';

// Extend Express Request to include authenticated user context
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUserContext;
    }
  }
}

/**
 * Middleware: Requires a valid Firebase Bearer token
 * Returns 401 Unauthorized if missing, expired, or invalid.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      message: 'Authentication required. Missing Bearer token in Authorization header.',
    });
  }

  const token = authHeader.substring(7);

  try {
    const userContext = await verifyTokenAndResolveUser(token);
    req.user = userContext;
    next();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '';
    const failureCode = errorMessage.match(/^([A-Z][A-Z0-9_]*)(?::([A-Za-z0-9_/-]+))?/);
    const safeFailure = failureCode
      ? [failureCode[1], failureCode[2]].filter(Boolean).join(':')
      : 'UNKNOWN_AUTH_ERROR';
    console.error(`[Auth] Authentication rejected (${safeFailure}).`);

    return res.status(401).json({
      success: false,
      code: 'INVALID_TOKEN',
      message: 'Authentication failed. Please sign in again.',
    });
  }
}

/**
 * Middleware: Enforces that the authenticated user possesses one of the allowed roles
 * Returns 403 Forbidden if role check fails.
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'Authentication required.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN_ROLE',
        message: `Access Denied: Requires one of [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`,
      });
    }

    next();
  };
}

/**
 * Middleware: Enforces that an authenticated TEACHER is assigned to the subject
 */
export async function requireAssignedTeacher(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  // Admins bypass subject assignment restrictions
  if (req.user.role === UserRole.ADMIN) {
    return next();
  }

  if (req.user.role !== UserRole.TEACHER || !req.user.teacherProfile) {
    return res.status(403).json({
      success: false,
      code: 'NOT_A_TEACHER',
      message: 'Access restricted to faculty members.',
    });
  }

  const subjectId = (req.query.subjectId || req.body.subjectId || req.params.subjectId) as string;
  const sessionId = (req.query.sessionId || req.body.sessionId || req.params.sessionId) as string;

  if (!subjectId || !sessionId) {
    return res.status(400).json({
      success: false,
      message: 'subjectId and sessionId are required to verify assignment permissions.',
    });
  }

  const isAssigned = await activeAcademicRepo.isTeacherAssignedToSubject(
    req.user.teacherProfile.id,
    subjectId,
    sessionId
  );

  if (!isAssigned) {
    return res.status(403).json({
      success: false,
      code: 'UNAUTHORIZED_SUBJECT_ACCESS',
      message: `Forbidden: Faculty member ${req.user.teacherProfile.name} is not assigned to subject ${subjectId} for session ${sessionId}.`,
    });
  }

  next();
}

/**
 * Middleware: Enforces that an authenticated STUDENT can only view their own marks
 */
export function enforceStudentRecordIsolation(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  // Admins and Teachers can inspect any student marks
  if (req.user.role === UserRole.ADMIN || req.user.role === UserRole.TEACHER) {
    return next();
  }

  if (req.user.role === UserRole.STUDENT) {
    if (!req.user.studentProfile) {
      return res.status(403).json({ success: false, message: 'No student profile associated with user.' });
    }

    const requestedStudentId = (req.query.studentId || req.body.studentId) as string | undefined;

    // If client supplied a different studentId, strictly deny
    if (requestedStudentId && requestedStudentId !== req.user.studentProfile.id) {
      return res.status(403).json({
        success: false,
        code: 'STUDENT_RECORD_ISOLATION_VIOLATION',
        message: 'Security Violation: Students are strictly forbidden from viewing another student’s academic records.',
      });
    }

    // Force studentId to be the authenticated student's ID
    if (req.query) req.query.studentId = req.user.studentProfile.id;
    if (req.body) req.body.studentId = req.user.studentProfile.id;
  }

  next();
}
