/**
 * SPIS Domain Types & Data Transfer Objects
 * Clean TypeScript contracts decoupled from any database driver.
 */

export enum UserRole {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
}

export enum SessionalNumber {
  SESSIONAL_1 = 1,
  SESSIONAL_2 = 2,
}

export enum ExamAttendance {
  ATTENDED = 'ATTENDED',
  NOT_ATTENDED = 'NOT_ATTENDED', // Absentees score 0, but explicitly marked
}

export enum SubmissionStatus {
  DRAFT = 'DRAFT', // Strictly hidden from students
  FINAL_SUBMITTED = 'FINAL_SUBMITTED', // Immediately visible to enrolled student
}

export enum AssessmentConductStatus {
  NOT_CONFIGURED = 'NOT_CONFIGURED',
  NOT_CONDUCTED = 'NOT_CONDUCTED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
}

export interface UserAccount {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CourseStructure {
  id: string;
  courseCode: string; // e.g. BCA, BBA, B.Com, B.A., B.Tech, MCA, MBA
  name: string;
  totalSemesters: number;
  durationYears: number;
  isActive: boolean;
  createdAt: string;
}

export interface AcademicSession {
  id: string;
  sessionCode: string; // e.g. "2025-2026", "2026-2027"
  title: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

export interface SubjectMaster {
  id: string;
  subjectCode: string;
  name: string;
  courseId: string;
  semester: number;
  isRequired: boolean;
  electiveGroup?: string; // Grouping key for elective rules
  credits: number;
  isActive: boolean;
  createdAt: string;
}

export interface StudentProfile {
  id: string;
  userId: string;
  enrollmentNo: string;
  rollNo: string;
  name: string;
  email: string;
  courseId: string;
  currentSemester: number;
  admissionSessionId: string;
  isActive: boolean;
  createdAt: string;
}

export interface TeacherProfile {
  id: string;
  userId: string;
  employeeCode: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  isActive: boolean;
  createdAt: string;
}

export interface TeacherAssignment {
  id: string;
  teacherId: string;
  subjectId: string;
  sessionId: string;
  semester: number;
  isActive: boolean;
  assignedAt: string;
}

export interface SessionalConfig {
  id: string;
  sessionId: string;
  courseId: string;
  semester: number;
  sessionalNumber: SessionalNumber;
  maxMarks: number; // Configurable, default 25
  status: AssessmentConductStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentRecord {
  id: string;
  studentId: string;
  subjectId: string;
  configId: string;
  sessionId: string;
  semester: number;
  sessionalNumber: SessionalNumber;
  
  // Marks and components
  obtainedMarks?: number | null; // Can be null (pending) or 0 (genuine zero / absent)
  maxMarks: number;
  examAttendance: ExamAttendance;
  classAttendancePct?: number | null; // 0 - 100%
  assignmentScore?: number | null; // 0 - 100%
  presentationScore?: number | null; // 0 - 100%
  classInteractionScore?: number | null; // 0 - 100%
  
  submissionStatus: SubmissionStatus;
  submittingTeacherId: string;
  finalSubmittedAt?: string | null;
  correctionReason?: string | null;
  correctionAuthorizedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ScoringWeights {
  version: string;
  sessionalExamWeight: number; // 0.40
  classAttendanceWeight: number; // 0.20
  assignmentWeight: number; // 0.15
  presentationWeight: number; // 0.15
  classInteractionWeight: number; // 0.10
}

export interface PerformanceCalculationResult {
  isComplete: boolean;
  missingComponents: string[];
  normalizedSessionalScore?: number;
  performanceScore?: number; // 0 - 100
  formulaVersion: string;
  weightsSnapshot: ScoringWeights;
}

export interface SessionalOverallReport {
  id: string;
  studentId: string;
  sessionId: string;
  courseId: string;
  semester: number;
  sessionalNumber: SessionalNumber;
  reportVersion: string;
  formulaVersion: string;
  weightsSnapshot: ScoringWeights;
  subjectScores: {
    subjectId: string;
    subjectCode: string;
    subjectName: string;
    isRequired: boolean;
    electiveGroup?: string;
    obtainedMarks: number | null;
    maxMarks: number;
    normalizedScore: number | null;
    attendancePct: number | null;
    performanceScore: number | null;
    examAttendance: ExamAttendance;
    submissionStatus: SubmissionStatus;
    isComplete: boolean;
  }[];
  overallAverageScore: number | null;
  isEligibleForOverallReport: boolean;
  completionBlockers: string[];
  generatedAt: string;
}

export interface AuditLogEntry {
  id: string;
  entityType: 'ASSESSMENT' | 'SESSIONAL_CONFIG' | 'ASSIGNMENT' | 'ENROLLMENT' | 'USER' | 'FEE_PAYMENT';
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'FINAL_SUBMIT' | 'CORRECTION' | 'DELETE';
  actorId: string;
  actorRole: UserRole;
  reason?: string;
  previousData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  timestamp: string;
}

export enum AcademicCycle {
  ODD_DECEMBER = 'ODD_DECEMBER', // December: Odd Semester (1, 3, 5, 7)
  EVEN_JUNE = 'EVEN_JUNE',       // June: Even Semester (2, 4, 6, 8)
}

export enum FeePaymentStatus {
  PAID = 'PAID',
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  OVERDUE = 'OVERDUE',
}

export interface CourseFeeStructure {
  id: string;
  courseId: string;
  semester: number;
  academicCycle: AcademicCycle;
  tuitionFee: number;
  examinationFee: number;
  laboratoryFee: number;
  libraryFee: number;
  totalFee: number;
  advanceCollectionSemester: number; // Rules: Fees collected one semester in advance
  ruleNotes: string;
}

export interface StudentFeeRecord {
  id: string;
  studentId: string;
  courseId: string;
  currentSemester: number;
  assessedSemester: number; // The semester being paid for
  academicCycle: AcademicCycle;
  totalFee: number;
  paidAmount: number;
  balance: number;
  status: FeePaymentStatus;
  dueDate: string;
  paidAt?: string | null;
  receiptNumber?: string | null;
  isAdvancePayment: boolean; // Indicates one semester in advance collection
}

