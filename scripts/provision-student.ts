import 'dotenv/config';
import { createHash } from 'node:crypto';
import { createInterface } from 'node:readline/promises';
import process from 'node:process';
import { getAuth } from 'firebase-admin/auth';
import { DocumentReference, Firestore } from 'firebase-admin/firestore';
import { initializeFirebaseAdmin, getFirebaseAdminApp, getFirestoreDb } from '../src/server/auth/firebaseAdmin.ts';
import {
  AcademicSession,
  CourseStructure,
  StudentProfile,
  UserAccount,
  UserRole,
} from '../src/types/domain.ts';

interface StudentProvisioningInput {
  email: string;
  displayName: string;
  name: string;
  enrollmentNo: string;
  rollNo: string;
  courseId: string;
  currentSemester: number;
  admissionSessionId: string;
}

interface ProvisioningDocuments {
  accountRef: DocumentReference;
  studentRef: DocumentReference;
  uniquenessRefs: DocumentReference[];
  account: UserAccount;
  student: StudentProfile;
}

class ProvisioningError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = 'ProvisioningError';
  }
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function uniquenessDocumentId(kind: string, value: string): string {
  const digest = createHash('sha256').update(normalize(value)).digest('hex');
  return `${kind}_${digest}`;
}

function required(value: string, field: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new ProvisioningError(`MISSING_${field.toUpperCase()}`);
  return trimmed;
}

async function collectInput(): Promise<StudentProvisioningInput> {
  const terminal = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const email = required(await terminal.question('Verified Firebase Auth email: '), 'email');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ProvisioningError('INVALID_EMAIL');
    }

    const displayName = required(await terminal.question('Account display name: '), 'display_name');
    const name = required(await terminal.question('Student legal/academic name: '), 'student_name');
    const enrollmentNo = required(await terminal.question('Enrollment number: '), 'enrollment_no');
    const rollNo = required(await terminal.question('Roll number: '), 'roll_no');
    const courseId = required(await terminal.question('Existing course ID: '), 'course_id');
    const semesterText = required(await terminal.question('Current semester (integer): '), 'current_semester');
    const admissionSessionId = required(
      await terminal.question('Existing admission session ID: '),
      'admission_session_id'
    );
    const currentSemester = Number(semesterText);

    if (!Number.isSafeInteger(currentSemester) || currentSemester < 1) {
      throw new ProvisioningError('INVALID_CURRENT_SEMESTER');
    }

    return {
      email: normalize(email),
      displayName,
      name,
      enrollmentNo,
      rollNo,
      courseId,
      currentSemester,
      admissionSessionId,
    };
  } finally {
    terminal.close();
  }
}

async function verifyFirebaseIdentity(email: string) {
  const app = getFirebaseAdminApp();
  if (!app) throw new ProvisioningError('FIREBASE_ADMIN_UNAVAILABLE');

  let authUser;
  try {
    authUser = await getAuth(app).getUserByEmail(email);
  } catch (error) {
    const code = getFirebaseErrorCode(error);
    throw new ProvisioningError(code === 'auth/user-not-found' ? 'FIREBASE_AUTH_USER_NOT_FOUND' : 'FIREBASE_AUTH_LOOKUP_FAILED');
  }

  if (!authUser.email || normalize(authUser.email) !== email) {
    throw new ProvisioningError('FIREBASE_AUTH_EMAIL_MISMATCH');
  }
  if (!authUser.emailVerified) throw new ProvisioningError('FIREBASE_AUTH_EMAIL_NOT_VERIFIED');
  if (authUser.disabled) throw new ProvisioningError('FIREBASE_AUTH_USER_DISABLED');

  return authUser;
}

function getFirebaseErrorCode(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = error.code;
    if ((typeof code === 'string' || typeof code === 'number') && /^[A-Za-z0-9_/-]{1,64}$/.test(String(code))) {
      return String(code);
    }
  }
  return 'UNKNOWN';
}

async function loadAndValidate(
  db: Firestore,
  input: StudentProvisioningInput,
  authUid: string,
  transaction?: FirebaseFirestore.Transaction
): Promise<ProvisioningDocuments> {
  const usersCollection = db.collection('users');
  const studentsCollection = db.collection('students');
  const accountRef = usersCollection.doc(`usr_${authUid}`);
  const studentRef = studentsCollection.doc(`stu_${authUid}`);
  const courseRef = db.collection('courseStructures').doc(input.courseId);
  const sessionRef = db.collection('academicSessions').doc(input.admissionSessionId);
  const uniquenessCollection = db.collection('studentProvisioningKeys');
  const uniquenessRefs = [
    uniquenessCollection.doc(uniquenessDocumentId('email', input.email)),
    uniquenessCollection.doc(uniquenessDocumentId('enrollment', input.enrollmentNo)),
    uniquenessCollection.doc(uniquenessDocumentId('roll', input.rollNo)),
  ];

  const [
    usersSnapshot,
    studentsSnapshot,
    accountSnapshot,
    studentSnapshot,
    courseSnapshot,
    sessionSnapshot,
    ...uniquenessSnapshots
  ] =
    transaction
      ? await Promise.all([
          transaction.get(usersCollection),
          transaction.get(studentsCollection),
          transaction.get(accountRef),
          transaction.get(studentRef),
          transaction.get(courseRef),
          transaction.get(sessionRef),
          ...uniquenessRefs.map((ref) => transaction.get(ref)),
        ])
      : await Promise.all([
          usersCollection.get(),
          studentsCollection.get(),
          accountRef.get(),
          studentRef.get(),
          courseRef.get(),
          sessionRef.get(),
          ...uniquenessRefs.map((ref) => ref.get()),
        ]);

  if (uniquenessSnapshots.some((snapshot) => snapshot.exists)) {
    throw new ProvisioningError('DUPLICATE_STUDENT_IDENTIFIER');
  }
  if (usersSnapshot.docs.some((doc) => normalize(String(doc.get('email') || '')) === input.email)) {
    throw new ProvisioningError('DUPLICATE_ACADEMIC_EMAIL');
  }
  if (
    studentsSnapshot.docs.some((doc) => {
      const enrollmentNo = doc.get('enrollmentNo');
      return typeof enrollmentNo === 'string' && normalize(enrollmentNo) === normalize(input.enrollmentNo);
    })
  ) {
    throw new ProvisioningError('DUPLICATE_ENROLLMENT_NUMBER');
  }
  if (
    studentsSnapshot.docs.some((doc) => {
      const rollNo = doc.get('rollNo');
      return typeof rollNo === 'string' && normalize(rollNo) === normalize(input.rollNo);
    })
  ) {
    throw new ProvisioningError('DUPLICATE_ROLL_NUMBER');
  }
  if (accountSnapshot.exists || studentSnapshot.exists) {
    throw new ProvisioningError('GENERATED_DOCUMENT_ID_ALREADY_EXISTS');
  }
  if (!courseSnapshot.exists) throw new ProvisioningError('COURSE_NOT_FOUND');
  if (!sessionSnapshot.exists) throw new ProvisioningError('ADMISSION_SESSION_NOT_FOUND');

  const course = courseSnapshot.data() as CourseStructure;
  const session = sessionSnapshot.data() as AcademicSession;
  if (course.id !== input.courseId) throw new ProvisioningError('COURSE_ID_MISMATCH');
  if (course.isActive !== true) throw new ProvisioningError('COURSE_NOT_ACTIVE');
  if (!Number.isSafeInteger(course.totalSemesters) || input.currentSemester > course.totalSemesters) {
    throw new ProvisioningError('SEMESTER_OUTSIDE_COURSE_RANGE');
  }
  if (session.id !== input.admissionSessionId) throw new ProvisioningError('ADMISSION_SESSION_ID_MISMATCH');

  const createdAt = new Date().toISOString();
  const account: UserAccount = {
    id: accountRef.id,
    email: input.email,
    displayName: input.displayName,
    role: UserRole.STUDENT,
    isActive: true,
    createdAt,
    updatedAt: createdAt,
  };
  const student: StudentProfile = {
    id: studentRef.id,
    userId: account.id,
    enrollmentNo: input.enrollmentNo,
    rollNo: input.rollNo,
    name: input.name,
    email: input.email,
    courseId: input.courseId,
    currentSemester: input.currentSemester,
    admissionSessionId: input.admissionSessionId,
    isActive: true,
    createdAt,
  };

  return { accountRef, studentRef, uniquenessRefs, account, student };
}

function getSafeErrorCode(error: unknown): string {
  if (error instanceof ProvisioningError) return error.code;
  return 'UNKNOWN';
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== '--apply') || args.filter((arg) => arg === '--apply').length > 1) {
    throw new ProvisioningError('INVALID_COMMAND_LINE_OPTIONS');
  }
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new ProvisioningError('INTERACTIVE_TERMINAL_REQUIRED');
  }

  const apply = args.includes('--apply');
  const input = await collectInput();

  initializeFirebaseAdmin();
  const db = getFirestoreDb();
  if (!db) throw new ProvisioningError('FIRESTORE_UNAVAILABLE');

  let authUser = await verifyFirebaseIdentity(input.email);
  const preview = await loadAndValidate(db, input, authUser.uid);

  console.log('Validation passed: verified, enabled Firebase Auth user; no duplicate academic identifiers; valid active course, semester, and existing admission session.');
  console.log('Provisioning is STUDENT-only. No passwords, tokens, or account/profile values are displayed.');

  if (!apply) {
    console.log('Dry run complete. No Firestore writes were performed. Re-run with --apply only after verifying institutional authorization and all academic details.');
    return;
  }

  const terminal = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const confirmation = await terminal.question(
      'Confirm institution-approved identity and academic details. Type PROVISION STUDENT to create the account and linked profile: '
    );
    if (confirmation !== 'PROVISION STUDENT') throw new ProvisioningError('OPERATOR_CONFIRMATION_NOT_MATCHED');
  } finally {
    terminal.close();
  }

  authUser = await verifyFirebaseIdentity(input.email);
  if (authUser.uid !== preview.account.id.slice('usr_'.length)) {
    throw new ProvisioningError('FIREBASE_AUTH_IDENTITY_CHANGED');
  }

  await db.runTransaction(async (transaction) => {
    const documents = await loadAndValidate(db, input, authUser.uid, transaction);
    transaction.create(documents.accountRef, documents.account);
    transaction.create(documents.studentRef, documents.student);
    for (const ref of documents.uniquenessRefs) {
      transaction.create(ref, { createdAt: documents.account.createdAt });
    }
  });

  console.log('Provisioning completed: one STUDENT account and its linked student profile were created.');
}

main().catch((error: unknown) => {
  const code = getSafeErrorCode(error);
  console.error(`Student provisioning stopped (${code}). No credentials or input values were logged.`);
  process.exitCode = 1;
});
