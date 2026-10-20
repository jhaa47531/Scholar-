import {
  AcademicSession,
  CourseStructure,
  StudentProfile,
  SubjectMaster,
  TeacherAssignment,
  TeacherProfile,
  UserAccount,
  CourseFeeStructure,
  StudentFeeRecord,
} from '../../types/domain.ts';

export interface IAcademicRepository {
  // Academic Sessions
  getSessions(): Promise<AcademicSession[]>;
  getSessionById(id: string): Promise<AcademicSession | null>;
  createSession(session: AcademicSession): Promise<AcademicSession>;

  // Courses
  getCourses(): Promise<CourseStructure[]>;
  getCourseById(id: string): Promise<CourseStructure | null>;
  createCourse(course: CourseStructure): Promise<CourseStructure>;
  updateCourse(id: string, updates: Partial<CourseStructure>): Promise<CourseStructure>;
  deleteCourse(id: string): Promise<boolean>;

  // Subjects
  getSubjects(courseId?: string, semester?: number): Promise<SubjectMaster[]>;
  getSubjectById(id: string): Promise<SubjectMaster | null>;
  createSubject(subject: SubjectMaster): Promise<SubjectMaster>;
  updateSubject(id: string, updates: Partial<SubjectMaster>): Promise<SubjectMaster>;
  deleteSubject(id: string): Promise<boolean>;

  // Students
  getStudents(courseId?: string, semester?: number): Promise<StudentProfile[]>;
  getStudentById(id: string): Promise<StudentProfile | null>;
  getStudentByUserId(userId: string): Promise<StudentProfile | null>;
  createStudent(student: StudentProfile): Promise<StudentProfile>;
  updateStudent(id: string, updates: Partial<StudentProfile>): Promise<StudentProfile>;
  deleteStudent(id: string): Promise<boolean>;

  // Teachers
  getTeachers(): Promise<TeacherProfile[]>;
  getTeacherById(id: string): Promise<TeacherProfile | null>;
  getTeacherByUserId(userId: string): Promise<TeacherProfile | null>;
  createTeacher(teacher: TeacherProfile): Promise<TeacherProfile>;
  updateTeacher(id: string, updates: Partial<TeacherProfile>): Promise<TeacherProfile>;
  deleteTeacher(id: string): Promise<boolean>;

  // Teacher Assignments
  getTeacherAssignments(teacherId?: string, sessionId?: string): Promise<TeacherAssignment[]>;
  isTeacherAssignedToSubject(teacherId: string, subjectId: string, sessionId: string): Promise<boolean>;
  assignTeacher(assignment: TeacherAssignment): Promise<TeacherAssignment>;

  // Users
  getUserByEmail(email: string): Promise<UserAccount | null>;
  getUserById(id: string): Promise<UserAccount | null>;
  createUser(user: UserAccount): Promise<UserAccount>;

  // Fee Management & Advance Collection Rules
  getFeeStructures(courseId?: string): Promise<CourseFeeStructure[]>;
  getStudentFeeRecords(studentId?: string): Promise<StudentFeeRecord[]>;
  recordFeePayment(payment: {
    studentId: string;
    amount: number;
    assessedSemester?: number;
    receiptNumber?: string;
  }): Promise<StudentFeeRecord>;
}

