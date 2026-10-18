import {
  AcademicSession,
  CourseStructure,
  StudentProfile,
  SubjectMaster,
  TeacherAssignment,
  TeacherProfile,
  UserAccount,
  UserRole,
} from '../../types/domain.ts';
import { IAcademicRepository } from '../interfaces/IAcademicRepository.ts';

/**
 * Academic Repository Implementation
 * Maps to Firestore collections: courseStructures, academicSessions, subjects, students, teachers, teacherAssignments, users
 * Future Oracle Mapping: SPIS_COURSE_STRUCTURES, SPIS_ACADEMIC_SESSIONS, SPIS_SUBJECTS, SPIS_STUDENTS, SPIS_TEACHERS, SPIS_TEACHER_ASSIGNMENTS, SPIS_USERS
 */
export class AcademicRepository implements IAcademicRepository {
  private sessions: Map<string, AcademicSession> = new Map();
  private courses: Map<string, CourseStructure> = new Map();
  private subjects: Map<string, SubjectMaster> = new Map();
  private students: Map<string, StudentProfile> = new Map();
  private teachers: Map<string, TeacherProfile> = new Map();
  private assignments: Map<string, TeacherAssignment> = new Map();
  private users: Map<string, UserAccount> = new Map();

  constructor() {
    this.seedDefaultAcademicData();
  }

  private seedDefaultAcademicData() {
    // 1. Initial Courses per Specification
    const initialCourses: CourseStructure[] = [
      { id: 'crs_bca', courseCode: 'BCA', name: 'Bachelor of Computer Applications', totalSemesters: 6, durationYears: 3, isActive: true, createdAt: new Date().toISOString() },
      { id: 'crs_bba', courseCode: 'BBA', name: 'Bachelor of Business Administration', totalSemesters: 6, durationYears: 3, isActive: true, createdAt: new Date().toISOString() },
      { id: 'crs_bcom', courseCode: 'B.Com', name: 'Bachelor of Commerce', totalSemesters: 6, durationYears: 3, isActive: true, createdAt: new Date().toISOString() },
      { id: 'crs_ba', courseCode: 'B.A.', name: 'Bachelor of Arts', totalSemesters: 6, durationYears: 3, isActive: true, createdAt: new Date().toISOString() },
      { id: 'crs_btech', courseCode: 'B.Tech', name: 'Bachelor of Technology (Computer Science)', totalSemesters: 8, durationYears: 4, isActive: true, createdAt: new Date().toISOString() },
      { id: 'crs_mca', courseCode: 'MCA', name: 'Master of Computer Applications', totalSemesters: 4, durationYears: 2, isActive: true, createdAt: new Date().toISOString() },
      { id: 'crs_mba', courseCode: 'MBA', name: 'Master of Business Administration', totalSemesters: 4, durationYears: 2, isActive: true, createdAt: new Date().toISOString() },
    ];
    for (const c of initialCourses) this.courses.set(c.id, c);

    // 2. Academic Sessions
    const defaultSessions: AcademicSession[] = [
      { id: 'sess_2025_26', sessionCode: '2025-2026', title: 'Academic Year 2025-2026', startDate: '2025-07-01', endDate: '2026-06-30', isActive: true, createdAt: new Date().toISOString() },
      { id: 'sess_2026_27', sessionCode: '2026-2027', title: 'Academic Year 2026-2027', startDate: '2026-07-01', endDate: '2027-06-30', isActive: false, createdAt: new Date().toISOString() },
    ];
    for (const s of defaultSessions) this.sessions.set(s.id, s);

    // 3. BCA Semester 1 Subjects (Required & Elective Group)
    const defaultSubjects: SubjectMaster[] = [
      { id: 'sub_bca101', subjectCode: 'BCA-101', name: 'Computer Fundamentals & Problem Solving', courseId: 'crs_bca', semester: 1, isRequired: true, credits: 4, isActive: true, createdAt: new Date().toISOString() },
      { id: 'sub_bca102', subjectCode: 'BCA-102', name: 'Programming in C Language', courseId: 'crs_bca', semester: 1, isRequired: true, credits: 4, isActive: true, createdAt: new Date().toISOString() },
      { id: 'sub_bca103', subjectCode: 'BCA-103', name: 'Mathematical Foundations for Computing', courseId: 'crs_bca', semester: 1, isRequired: true, credits: 3, isActive: true, createdAt: new Date().toISOString() },
      { id: 'sub_bca104_el1', subjectCode: 'BCA-104A', name: 'Technical Communication & Soft Skills', courseId: 'crs_bca', semester: 1, isRequired: false, electiveGroup: 'EL_GRP_1', credits: 3, isActive: true, createdAt: new Date().toISOString() },
      { id: 'sub_bca104_el2', subjectCode: 'BCA-104B', name: 'Organizational Behavior & Ethics', courseId: 'crs_bca', semester: 1, isRequired: false, electiveGroup: 'EL_GRP_1', credits: 3, isActive: true, createdAt: new Date().toISOString() },
      // B.Tech Semester 1 Subjects
      { id: 'sub_bt101', subjectCode: 'BT-CS101', name: 'Advanced Engineering Mathematics', courseId: 'crs_btech', semester: 1, isRequired: true, credits: 4, isActive: true, createdAt: new Date().toISOString() },
      { id: 'sub_bt102', subjectCode: 'BT-CS102', name: 'Data Structures and Algorithms', courseId: 'crs_btech', semester: 1, isRequired: true, credits: 4, isActive: true, createdAt: new Date().toISOString() },
    ];
    for (const sub of defaultSubjects) this.subjects.set(sub.id, sub);

    // 4. Default Users
    const defaultUsers: UserAccount[] = [
      { id: 'usr_admin', email: 'admin@institution.edu', displayName: 'Prof. Eleanor Vance (Dean & Admin)', role: UserRole.ADMIN, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'usr_teacher_sharma', email: 'sharma@faculty.edu', displayName: 'Dr. Rajesh Sharma (HOD Computing)', role: UserRole.TEACHER, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'usr_teacher_gupta', email: 'gupta@faculty.edu', displayName: 'Prof. Anita Gupta (Asst. Professor)', role: UserRole.TEACHER, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'usr_student_aarav', email: 'aarav.patel@student.edu', displayName: 'Aarav Patel (BCA 1st Year)', role: UserRole.STUDENT, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'usr_student_diya', email: 'diya.sharma@student.edu', displayName: 'Diya Sharma (BCA 1st Year)', role: UserRole.STUDENT, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'usr_student_kabir', email: 'kabir.verma@student.edu', displayName: 'Kabir Verma (BCA 1st Year)', role: UserRole.STUDENT, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ];
    for (const u of defaultUsers) this.users.set(u.id, u);

    // 5. Teachers
    const defaultTeachers: TeacherProfile[] = [
      { id: 'tch_sharma', userId: 'usr_teacher_sharma', employeeCode: 'FAC-CS-001', name: 'Dr. Rajesh Sharma', email: 'sharma@faculty.edu', department: 'Computer Applications', designation: 'Professor & Head', isActive: true, createdAt: new Date().toISOString() },
      { id: 'tch_gupta', userId: 'usr_teacher_gupta', employeeCode: 'FAC-CS-002', name: 'Prof. Anita Gupta', email: 'gupta@faculty.edu', department: 'Computer Applications', designation: 'Assistant Professor', isActive: true, createdAt: new Date().toISOString() },
    ];
    for (const t of defaultTeachers) this.teachers.set(t.id, t);

    // 6. Students
    const defaultStudents: StudentProfile[] = [
      { id: 'stu_aarav', userId: 'usr_student_aarav', enrollmentNo: 'EN2025BCA001', rollNo: 'BCA-01', name: 'Aarav Patel', email: 'aarav.patel@student.edu', courseId: 'crs_bca', currentSemester: 1, admissionSessionId: 'sess_2025_26', isActive: true, createdAt: new Date().toISOString() },
      { id: 'stu_diya', userId: 'usr_student_diya', enrollmentNo: 'EN2025BCA002', rollNo: 'BCA-02', name: 'Diya Sharma', email: 'diya.sharma@student.edu', courseId: 'crs_bca', currentSemester: 1, admissionSessionId: 'sess_2025_26', isActive: true, createdAt: new Date().toISOString() },
      { id: 'stu_kabir', userId: 'usr_student_kabir', enrollmentNo: 'EN2025BCA003', rollNo: 'BCA-03', name: 'Kabir Verma', email: 'kabir.verma@student.edu', courseId: 'crs_bca', currentSemester: 1, admissionSessionId: 'sess_2025_26', isActive: true, createdAt: new Date().toISOString() },
    ];
    for (const st of defaultStudents) this.students.set(st.id, st);

    // 7. Teacher Assignments (Dr. Sharma teaches BCA-101 and BCA-102; Prof. Gupta teaches BCA-103)
    const defaultAssignments: TeacherAssignment[] = [
      { id: 'asg_sharma_bca101', teacherId: 'tch_sharma', subjectId: 'sub_bca101', sessionId: 'sess_2025_26', semester: 1, isActive: true, assignedAt: new Date().toISOString() },
      { id: 'asg_sharma_bca102', teacherId: 'tch_sharma', subjectId: 'sub_bca102', sessionId: 'sess_2025_26', semester: 1, isActive: true, assignedAt: new Date().toISOString() },
      { id: 'asg_gupta_bca103', teacherId: 'tch_gupta', subjectId: 'sub_bca103', sessionId: 'sess_2025_26', semester: 1, isActive: true, assignedAt: new Date().toISOString() },
      { id: 'asg_gupta_bca104a', teacherId: 'tch_gupta', subjectId: 'sub_bca104_el1', sessionId: 'sess_2025_26', semester: 1, isActive: true, assignedAt: new Date().toISOString() },
    ];
    for (const a of defaultAssignments) this.assignments.set(a.id, a);
  }

  async getSessions(): Promise<AcademicSession[]> {
    return Array.from(this.sessions.values());
  }

  async getSessionById(id: string): Promise<AcademicSession | null> {
    return this.sessions.get(id) || null;
  }

  async createSession(session: AcademicSession): Promise<AcademicSession> {
    this.sessions.set(session.id, session);
    return session;
  }

  async getCourses(): Promise<CourseStructure[]> {
    return Array.from(this.courses.values());
  }

  async getCourseById(id: string): Promise<CourseStructure | null> {
    return this.courses.get(id) || null;
  }

  async createCourse(course: CourseStructure): Promise<CourseStructure> {
    this.courses.set(course.id, course);
    return course;
  }

  async getSubjects(courseId?: string, semester?: number): Promise<SubjectMaster[]> {
    let list = Array.from(this.subjects.values());
    if (courseId) list = list.filter((s) => s.courseId === courseId);
    if (semester !== undefined) list = list.filter((s) => s.semester === semester);
    return list;
  }

  async getSubjectById(id: string): Promise<SubjectMaster | null> {
    return this.subjects.get(id) || null;
  }

  async createSubject(subject: SubjectMaster): Promise<SubjectMaster> {
    this.subjects.set(subject.id, subject);
    return subject;
  }

  async getStudents(courseId?: string, semester?: number): Promise<StudentProfile[]> {
    let list = Array.from(this.students.values());
    if (courseId) list = list.filter((s) => s.courseId === courseId);
    if (semester !== undefined) list = list.filter((s) => s.currentSemester === semester);
    return list;
  }

  async getStudentById(id: string): Promise<StudentProfile | null> {
    return this.students.get(id) || null;
  }

  async getStudentByUserId(userId: string): Promise<StudentProfile | null> {
    for (const st of this.students.values()) {
      if (st.userId === userId) return st;
    }
    return null;
  }

  async createStudent(student: StudentProfile): Promise<StudentProfile> {
    this.students.set(student.id, student);
    return student;
  }

  async getTeachers(): Promise<TeacherProfile[]> {
    return Array.from(this.teachers.values());
  }

  async getTeacherById(id: string): Promise<TeacherProfile | null> {
    return this.teachers.get(id) || null;
  }

  async getTeacherByUserId(userId: string): Promise<TeacherProfile | null> {
    for (const t of this.teachers.values()) {
      if (t.userId === userId) return t;
    }
    return null;
  }

  async createTeacher(teacher: TeacherProfile): Promise<TeacherProfile> {
    this.teachers.set(teacher.id, teacher);
    return teacher;
  }

  async getTeacherAssignments(teacherId?: string, sessionId?: string): Promise<TeacherAssignment[]> {
    let list = Array.from(this.assignments.values());
    if (teacherId) list = list.filter((a) => a.teacherId === teacherId);
    if (sessionId) list = list.filter((a) => a.sessionId === sessionId);
    return list;
  }

  async isTeacherAssignedToSubject(teacherId: string, subjectId: string, sessionId: string): Promise<boolean> {
    for (const a of this.assignments.values()) {
      if (a.teacherId === teacherId && a.subjectId === subjectId && a.sessionId === sessionId && a.isActive) {
        return true;
      }
    }
    return false;
  }

  async assignTeacher(assignment: TeacherAssignment): Promise<TeacherAssignment> {
    this.assignments.set(assignment.id, assignment);
    return assignment;
  }

  async getUserByEmail(email: string): Promise<UserAccount | null> {
    for (const u of this.users.values()) {
      if (u.email.toLowerCase() === email.toLowerCase()) return u;
    }
    return null;
  }

  async getUserById(id: string): Promise<UserAccount | null> {
    return this.users.get(id) || null;
  }

  async createUser(user: UserAccount): Promise<UserAccount> {
    this.users.set(user.id, user);
    return user;
  }
}

export const globalAcademicRepo = new AcademicRepository();
