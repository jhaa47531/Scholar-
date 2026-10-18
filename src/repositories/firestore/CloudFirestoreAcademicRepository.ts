import { Firestore } from 'firebase-admin/firestore';
import { IAcademicRepository } from '../interfaces/IAcademicRepository.ts';
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

/**
 * Cloud Firestore Academic Repository Adapter
 * Provides real persistent storage using Firebase Firestore via Firebase Admin SDK.
 * Target Collections: academicSessions, courseStructures, subjects, students, teachers, teacherAssignments, users
 * Future Oracle Mapping: SPIS_ACADEMIC_SESSIONS, SPIS_COURSE_STRUCTURES, SPIS_SUBJECTS, SPIS_STUDENTS, SPIS_TEACHERS, SPIS_TEACHER_ASSIGNMENTS, SPIS_USERS
 */
export class CloudFirestoreAcademicRepository implements IAcademicRepository {
  private db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  /**
   * Safely initializes master catalog collections in Firestore if they are empty
   */
  async ensureInitialized(): Promise<void> {
    const courseSnapshot = await this.db.collection('courseStructures').limit(1).get();
    if (courseSnapshot.empty) {
      console.log('[Firestore Init] Seeding initial course structures, sessions, and catalog...');
      const batch = this.db.batch();

      // 1. Initial Courses
      const initialCourses: CourseStructure[] = [
        { id: 'crs_bca', courseCode: 'BCA', name: 'Bachelor of Computer Applications', totalSemesters: 6, durationYears: 3, isActive: true, createdAt: new Date().toISOString() },
        { id: 'crs_bba', courseCode: 'BBA', name: 'Bachelor of Business Administration', totalSemesters: 6, durationYears: 3, isActive: true, createdAt: new Date().toISOString() },
        { id: 'crs_bcom', courseCode: 'B.Com', name: 'Bachelor of Commerce', totalSemesters: 6, durationYears: 3, isActive: true, createdAt: new Date().toISOString() },
        { id: 'crs_ba', courseCode: 'B.A.', name: 'Bachelor of Arts', totalSemesters: 6, durationYears: 3, isActive: true, createdAt: new Date().toISOString() },
        { id: 'crs_btech', courseCode: 'B.Tech', name: 'Bachelor of Technology (Computer Science)', totalSemesters: 8, durationYears: 4, isActive: true, createdAt: new Date().toISOString() },
        { id: 'crs_mca', courseCode: 'MCA', name: 'Master of Computer Applications', totalSemesters: 4, durationYears: 2, isActive: true, createdAt: new Date().toISOString() },
        { id: 'crs_mba', courseCode: 'MBA', name: 'Master of Business Administration', totalSemesters: 4, durationYears: 2, isActive: true, createdAt: new Date().toISOString() },
      ];
      for (const c of initialCourses) {
        batch.set(this.db.collection('courseStructures').doc(c.id), c);
      }

      // 2. Academic Sessions
      const defaultSessions: AcademicSession[] = [
        { id: 'sess_2025_26', sessionCode: '2025-2026', title: 'Academic Year 2025-2026', startDate: '2025-07-01', endDate: '2026-06-30', isActive: true, createdAt: new Date().toISOString() },
        { id: 'sess_2026_27', sessionCode: '2026-2027', title: 'Academic Year 2026-2027', startDate: '2026-07-01', endDate: '2027-06-30', isActive: false, createdAt: new Date().toISOString() },
      ];
      for (const s of defaultSessions) {
        batch.set(this.db.collection('academicSessions').doc(s.id), s);
      }

      // 3. BCA Subjects
      const defaultSubjects: SubjectMaster[] = [
        { id: 'sub_bca101', subjectCode: 'BCA-101', name: 'Computer Fundamentals & Problem Solving', courseId: 'crs_bca', semester: 1, isRequired: true, credits: 4, isActive: true, createdAt: new Date().toISOString() },
        { id: 'sub_bca102', subjectCode: 'BCA-102', name: 'Programming in C Language', courseId: 'crs_bca', semester: 1, isRequired: true, credits: 4, isActive: true, createdAt: new Date().toISOString() },
        { id: 'sub_bca103', subjectCode: 'BCA-103', name: 'Mathematical Foundations for Computing', courseId: 'crs_bca', semester: 1, isRequired: true, credits: 3, isActive: true, createdAt: new Date().toISOString() },
        { id: 'sub_bca104_el1', subjectCode: 'BCA-104A', name: 'Technical Communication & Soft Skills', courseId: 'crs_bca', semester: 1, isRequired: false, electiveGroup: 'EL_GRP_1', credits: 3, isActive: true, createdAt: new Date().toISOString() },
        { id: 'sub_bca104_el2', subjectCode: 'BCA-104B', name: 'Organizational Behavior & Ethics', courseId: 'crs_bca', semester: 1, isRequired: false, electiveGroup: 'EL_GRP_1', credits: 3, isActive: true, createdAt: new Date().toISOString() },
        { id: 'sub_bt101', subjectCode: 'BT-CS101', name: 'Advanced Engineering Mathematics', courseId: 'crs_btech', semester: 1, isRequired: true, credits: 4, isActive: true, createdAt: new Date().toISOString() },
        { id: 'sub_bt102', subjectCode: 'BT-CS102', name: 'Data Structures and Algorithms', courseId: 'crs_btech', semester: 1, isRequired: true, credits: 4, isActive: true, createdAt: new Date().toISOString() },
      ];
      for (const sub of defaultSubjects) {
        batch.set(this.db.collection('subjects').doc(sub.id), sub);
      }

      // 4. Default Users
      const defaultUsers: UserAccount[] = [
        { id: 'usr_admin', email: 'admin@institution.edu', displayName: 'Prof. Eleanor Vance (Dean & Admin)', role: UserRole.ADMIN, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'usr_teacher_sharma', email: 'sharma@faculty.edu', displayName: 'Dr. Rajesh Sharma (HOD Computing)', role: UserRole.TEACHER, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'usr_teacher_gupta', email: 'gupta@faculty.edu', displayName: 'Prof. Anita Gupta (Asst. Professor)', role: UserRole.TEACHER, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'usr_student_aarav', email: 'aarav.patel@student.edu', displayName: 'Aarav Patel (BCA 1st Year)', role: UserRole.STUDENT, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'usr_student_diya', email: 'diya.sharma@student.edu', displayName: 'Diya Sharma (BCA 1st Year)', role: UserRole.STUDENT, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'usr_student_kabir', email: 'kabir.verma@student.edu', displayName: 'Kabir Verma (BCA 1st Year)', role: UserRole.STUDENT, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ];
      for (const u of defaultUsers) {
        batch.set(this.db.collection('users').doc(u.id), u);
      }

      // 5. Teachers
      const defaultTeachers: TeacherProfile[] = [
        { id: 'tch_sharma', userId: 'usr_teacher_sharma', employeeCode: 'FAC-CS-001', name: 'Dr. Rajesh Sharma', email: 'sharma@faculty.edu', department: 'Computer Applications', designation: 'Professor & Head', isActive: true, createdAt: new Date().toISOString() },
        { id: 'tch_gupta', userId: 'usr_teacher_gupta', employeeCode: 'FAC-CS-002', name: 'Prof. Anita Gupta', email: 'gupta@faculty.edu', department: 'Computer Applications', designation: 'Assistant Professor', isActive: true, createdAt: new Date().toISOString() },
      ];
      for (const t of defaultTeachers) {
        batch.set(this.db.collection('teachers').doc(t.id), t);
      }

      // 6. Students
      const defaultStudents: StudentProfile[] = [
        { id: 'stu_aarav', userId: 'usr_student_aarav', enrollmentNo: 'EN2025BCA001', rollNo: 'BCA-01', name: 'Aarav Patel', email: 'aarav.patel@student.edu', courseId: 'crs_bca', currentSemester: 1, admissionSessionId: 'sess_2025_26', isActive: true, createdAt: new Date().toISOString() },
        { id: 'stu_diya', userId: 'usr_student_diya', enrollmentNo: 'EN2025BCA002', rollNo: 'BCA-02', name: 'Diya Sharma', email: 'diya.sharma@student.edu', courseId: 'crs_bca', currentSemester: 1, admissionSessionId: 'sess_2025_26', isActive: true, createdAt: new Date().toISOString() },
        { id: 'stu_kabir', userId: 'usr_student_kabir', enrollmentNo: 'EN2025BCA003', rollNo: 'BCA-03', name: 'Kabir Verma', email: 'kabir.verma@student.edu', courseId: 'crs_bca', currentSemester: 1, admissionSessionId: 'sess_2025_26', isActive: true, createdAt: new Date().toISOString() },
      ];
      for (const st of defaultStudents) {
        batch.set(this.db.collection('students').doc(st.id), st);
      }

      // 7. Teacher Assignments
      const defaultAssignments: TeacherAssignment[] = [
        { id: 'asg_sharma_bca101', teacherId: 'tch_sharma', subjectId: 'sub_bca101', sessionId: 'sess_2025_26', semester: 1, isActive: true, assignedAt: new Date().toISOString() },
        { id: 'asg_sharma_bca102', teacherId: 'tch_sharma', subjectId: 'sub_bca102', sessionId: 'sess_2025_26', semester: 1, isActive: true, assignedAt: new Date().toISOString() },
        { id: 'asg_gupta_bca103', teacherId: 'tch_gupta', subjectId: 'sub_bca103', sessionId: 'sess_2025_26', semester: 1, isActive: true, assignedAt: new Date().toISOString() },
        { id: 'asg_gupta_bca104a', teacherId: 'tch_gupta', subjectId: 'sub_bca104_el1', sessionId: 'sess_2025_26', semester: 1, isActive: true, assignedAt: new Date().toISOString() },
      ];
      for (const a of defaultAssignments) {
        batch.set(this.db.collection('teacherAssignments').doc(a.id), a);
      }

      await batch.commit();
      console.log('[Firestore Init] Successfully committed initial academic master records to Cloud Firestore!');
    }
  }

  async getSessions(): Promise<AcademicSession[]> {
    const snap = await this.db.collection('academicSessions').get();
    return snap.docs.map((d) => d.data() as AcademicSession);
  }

  async getSessionById(id: string): Promise<AcademicSession | null> {
    const doc = await this.db.collection('academicSessions').doc(id).get();
    return doc.exists ? (doc.data() as AcademicSession) : null;
  }

  async createSession(session: AcademicSession): Promise<AcademicSession> {
    await this.db.collection('academicSessions').doc(session.id).set(session);
    return session;
  }

  async getCourses(): Promise<CourseStructure[]> {
    const snap = await this.db.collection('courseStructures').get();
    return snap.docs.map((d) => d.data() as CourseStructure);
  }

  async getCourseById(id: string): Promise<CourseStructure | null> {
    const doc = await this.db.collection('courseStructures').doc(id).get();
    return doc.exists ? (doc.data() as CourseStructure) : null;
  }

  async createCourse(course: CourseStructure): Promise<CourseStructure> {
    await this.db.collection('courseStructures').doc(course.id).set(course);
    return course;
  }

  async getSubjects(courseId?: string, semester?: number): Promise<SubjectMaster[]> {
    let query: FirebaseFirestore.Query = this.db.collection('subjects');
    if (courseId) query = query.where('courseId', '==', courseId);
    if (semester !== undefined) query = query.where('semester', '==', semester);
    const snap = await query.get();
    return snap.docs.map((d) => d.data() as SubjectMaster);
  }

  async getSubjectById(id: string): Promise<SubjectMaster | null> {
    const doc = await this.db.collection('subjects').doc(id).get();
    return doc.exists ? (doc.data() as SubjectMaster) : null;
  }

  async createSubject(subject: SubjectMaster): Promise<SubjectMaster> {
    await this.db.collection('subjects').doc(subject.id).set(subject);
    return subject;
  }

  async getStudents(courseId?: string, semester?: number): Promise<StudentProfile[]> {
    let query: FirebaseFirestore.Query = this.db.collection('students');
    if (courseId) query = query.where('courseId', '==', courseId);
    if (semester !== undefined) query = query.where('currentSemester', '==', semester);
    const snap = await query.get();
    return snap.docs.map((d) => d.data() as StudentProfile);
  }

  async getStudentById(id: string): Promise<StudentProfile | null> {
    const doc = await this.db.collection('students').doc(id).get();
    return doc.exists ? (doc.data() as StudentProfile) : null;
  }

  async getStudentByUserId(userId: string): Promise<StudentProfile | null> {
    const snap = await this.db.collection('students').where('userId', '==', userId).limit(1).get();
    return snap.empty ? null : (snap.docs[0].data() as StudentProfile);
  }

  async createStudent(student: StudentProfile): Promise<StudentProfile> {
    await this.db.collection('students').doc(student.id).set(student);
    return student;
  }

  async getTeachers(): Promise<TeacherProfile[]> {
    const snap = await this.db.collection('teachers').get();
    return snap.docs.map((d) => d.data() as TeacherProfile);
  }

  async getTeacherById(id: string): Promise<TeacherProfile | null> {
    const doc = await this.db.collection('teachers').doc(id).get();
    return doc.exists ? (doc.data() as TeacherProfile) : null;
  }

  async getTeacherByUserId(userId: string): Promise<TeacherProfile | null> {
    const snap = await this.db.collection('teachers').where('userId', '==', userId).limit(1).get();
    return snap.empty ? null : (snap.docs[0].data() as TeacherProfile);
  }

  async createTeacher(teacher: TeacherProfile): Promise<TeacherProfile> {
    await this.db.collection('teachers').doc(teacher.id).set(teacher);
    return teacher;
  }

  async getTeacherAssignments(teacherId?: string, sessionId?: string): Promise<TeacherAssignment[]> {
    let query: FirebaseFirestore.Query = this.db.collection('teacherAssignments');
    if (teacherId) query = query.where('teacherId', '==', teacherId);
    if (sessionId) query = query.where('sessionId', '==', sessionId);
    const snap = await query.get();
    return snap.docs.map((d) => d.data() as TeacherAssignment);
  }

  async isTeacherAssignedToSubject(teacherId: string, subjectId: string, sessionId: string): Promise<boolean> {
    const snap = await this.db
      .collection('teacherAssignments')
      .where('teacherId', '==', teacherId)
      .where('subjectId', '==', subjectId)
      .where('sessionId', '==', sessionId)
      .where('isActive', '==', true)
      .limit(1)
      .get();
    return !snap.empty;
  }

  async assignTeacher(assignment: TeacherAssignment): Promise<TeacherAssignment> {
    await this.db.collection('teacherAssignments').doc(assignment.id).set(assignment);
    return assignment;
  }

  async getUserByEmail(email: string): Promise<UserAccount | null> {
    const snap = await this.db.collection('users').where('email', '==', email.toLowerCase().trim()).limit(1).get();
    return snap.empty ? null : (snap.docs[0].data() as UserAccount);
  }

  async getUserById(id: string): Promise<UserAccount | null> {
    const doc = await this.db.collection('users').doc(id).get();
    return doc.exists ? (doc.data() as UserAccount) : null;
  }

  async createUser(user: UserAccount): Promise<UserAccount> {
    await this.db.collection('users').doc(user.id).set(user);
    return user;
  }
}
