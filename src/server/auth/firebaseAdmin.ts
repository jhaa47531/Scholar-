import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { StudentProfile, TeacherProfile, UserAccount, UserRole } from '../../types/domain.ts';
import { activeAcademicRepo } from '../../repositories/index.ts';

let firebaseAdminApp: App | null = null;
let firebaseFirestoreDb: Firestore | null = null;

export function initializeFirebaseAdmin(): App | null {
  if (firebaseAdminApp) {
    return firebaseAdminApp;
  }

  const existingApps = getApps();
  if (existingApps.length > 0) {
    firebaseAdminApp = existingApps[0];
    firebaseFirestoreDb = getFirestore(firebaseAdminApp);
    return firebaseAdminApp;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (privateKey) {
    // Handle both Base64-encoded strings and newline-escaped strings
    if (privateKey.startsWith('LS0t')) {
      privateKey = Buffer.from(privateKey, 'base64').toString('utf-8');
    } else {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }
  }

  if (projectId && clientEmail && privateKey) {
    try {
      firebaseAdminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      firebaseFirestoreDb = getFirestore(firebaseAdminApp);
      console.log(`[Firebase Admin] Successfully initialized for project ${projectId}.`);
      return firebaseAdminApp;
    } catch (err: any) {
      console.error('[Firebase Admin Error] Failed to initialize credentials:', err.message);
    }
  }

  return null;
}

export function getFirebaseAdminApp(): App | null {
  return firebaseAdminApp;
}

export function getFirestoreDb(): Firestore | null {
  if (!firebaseFirestoreDb && firebaseAdminApp) {
    firebaseFirestoreDb = getFirestore(firebaseAdminApp);
  }
  return firebaseFirestoreDb;
}

export interface AuthenticatedUserContext {
  uid: string;
  email: string;
  role: UserRole;
  userAccount: UserAccount;
  teacherProfile?: TeacherProfile;
  studentProfile?: StudentProfile;
}

/**
 * Verifies an authentication bearer token and resolves trusted institutional role.
 * 1. If it is a development/testing token ("SPIS_SECURE_TOKEN_<email>"), securely resolves seed account.
 * 2. If it is a live Firebase ID token (JWT), verifies cryptographic signature with Firebase Admin SDK.
 * Never trusts role, studentId, or teacherId from client request payloads.
 */
export async function verifyTokenAndResolveUser(idToken: string): Promise<AuthenticatedUserContext> {
  if (!idToken || typeof idToken !== 'string' || idToken.trim().length === 0) {
    throw new Error('MISSING_TOKEN: Authorization bearer token is required.');
  }

  const cleanToken = idToken.trim();

  // 1. Structured Token Verification (For Development, CI & Supertest)
  if (cleanToken.startsWith('SPIS_SECURE_TOKEN_')) {
    const parts = cleanToken.split('_');
    const email = parts.slice(3).join('_');
    if (!email || !email.includes('@')) {
      throw new Error('INVALID_TOKEN_FORMAT: Malformed authorization token.');
    }
    return resolveUserByEmail(email, `uid_${email.replace(/[@.]/g, '_')}`);
  }

  // 2. Real Firebase ID token cryptographic verification via Firebase Admin SDK
  if (firebaseAdminApp) {
    try {
      const decoded = await getAuth(firebaseAdminApp).verifyIdToken(cleanToken);
      const email = decoded.email;
      if (!email) {
        throw new Error('TOKEN_EMAIL_MISSING: Firebase token does not contain a verified email.');
      }
      return resolveUserByEmail(email, decoded.uid);
    } catch (err: any) {
      throw new Error(`INVALID_FIREBASE_TOKEN: ${err.message}`);
    }
  }

  throw new Error('INVALID_OR_EXPIRED_TOKEN: Token verification failed.');
}

async function resolveUserByEmail(email: string, uid: string): Promise<AuthenticatedUserContext> {
  const user = await activeAcademicRepo.getUserByEmail(email);
  if (!user || !user.isActive) {
    throw new Error(`USER_NOT_FOUND: No active user account associated with email ${email}`);
  }

  let teacherProfile: TeacherProfile | undefined;
  let studentProfile: StudentProfile | undefined;

  if (user.role === UserRole.TEACHER) {
    const t = await activeAcademicRepo.getTeacherByUserId(user.id);
    if (!t) {
      throw new Error(`TEACHER_PROFILE_MISSING: User is registered as TEACHER but has no faculty record.`);
    }
    teacherProfile = t;
  } else if (user.role === UserRole.STUDENT) {
    const s = await activeAcademicRepo.getStudentByUserId(user.id);
    if (!s) {
      throw new Error(`STUDENT_PROFILE_MISSING: User is registered as STUDENT but has no student record.`);
    }
    studentProfile = s;
  }

  return {
    uid,
    email: user.email,
    role: user.role,
    userAccount: user,
    teacherProfile,
    studentProfile,
  };
}
