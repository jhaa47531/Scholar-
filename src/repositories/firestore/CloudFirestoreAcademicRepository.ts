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
  AcademicCycle,
  FeePaymentStatus,
  CourseFeeStructure,
  StudentFeeRecord,
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
    const adminDoc = await this.db.collection('users').doc('usr_admin').get();
    const instAdminSnap = await this.db.collection('users').where('email', '==', 'admin@institution.edu').limit(1).get();
    if (!adminDoc.exists || instAdminSnap.empty) {
      console.log('[Firestore Init] Seeding default institutional users, teachers, and students...');
      const batch = this.db.batch();

      // Default Users
      const defaultUsers: UserAccount[] = [
        { id: 'usr_admin', email: 'admin@institution.edu', displayName: 'Prof. Eleanor Vance (Dean & Admin)', role: UserRole.ADMIN, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'usr_admin_jha', email: 'jhaa47531@gmail.com', displayName: 'System Administrator (Aditya Jha)', role: UserRole.ADMIN, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'usr_teacher_sharma', email: 'sharma@faculty.edu', displayName: 'Dr. Rajesh Sharma (HOD Computing)', role: UserRole.TEACHER, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'usr_teacher_gupta', email: 'gupta@faculty.edu', displayName: 'Prof. Anita Gupta (Asst. Professor)', role: UserRole.TEACHER, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'usr_student_aarav', email: 'aarav.patel@student.edu', displayName: 'Aarav Patel (BCA 1st Year)', role: UserRole.STUDENT, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'usr_student_diya', email: 'diya.sharma@student.edu', displayName: 'Diya Sharma (BCA 1st Year)', role: UserRole.STUDENT, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'usr_student_kabir', email: 'kabir.verma@student.edu', displayName: 'Kabir Verma (BCA 1st Year)', role: UserRole.STUDENT, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ];
      for (const u of defaultUsers) {
        batch.set(this.db.collection('users').doc(u.id), u, { merge: true });
      }

      // Teachers
      const defaultTeachers: TeacherProfile[] = [
        { id: 'tch_sharma', userId: 'usr_teacher_sharma', employeeCode: 'FAC-CS-001', name: 'Dr. Rajesh Sharma', email: 'sharma@faculty.edu', department: 'Computer Applications', designation: 'Professor & Head', isActive: true, createdAt: new Date().toISOString() },
        { id: 'tch_gupta', userId: 'usr_teacher_gupta', employeeCode: 'FAC-CS-002', name: 'Prof. Anita Gupta', email: 'gupta@faculty.edu', department: 'Computer Applications', designation: 'Assistant Professor', isActive: true, createdAt: new Date().toISOString() },
      ];
      for (const t of defaultTeachers) {
        batch.set(this.db.collection('teachers').doc(t.id), t);
      }

      // Students
      const defaultStudents: StudentProfile[] = [
        { id: 'stu_aarav', userId: 'usr_student_aarav', enrollmentNo: 'EN2025BCA001', rollNo: 'BCA-01', name: 'Aarav Patel', email: 'aarav.patel@student.edu', courseId: 'crs_bca', currentSemester: 1, admissionSessionId: 'sess_2025_26', isActive: true, createdAt: new Date().toISOString() },
        { id: 'stu_diya', userId: 'usr_student_diya', enrollmentNo: 'EN2025BCA002', rollNo: 'BCA-02', name: 'Diya Sharma', email: 'diya.sharma@student.edu', courseId: 'crs_bca', currentSemester: 1, admissionSessionId: 'sess_2025_26', isActive: true, createdAt: new Date().toISOString() },
        { id: 'stu_kabir', userId: 'usr_student_kabir', enrollmentNo: 'EN2025BCA003', rollNo: 'BCA-03', name: 'Kabir Verma', email: 'kabir.verma@student.edu', courseId: 'crs_bca', currentSemester: 1, admissionSessionId: 'sess_2025_26', isActive: true, createdAt: new Date().toISOString() },
      ];
      for (const st of defaultStudents) {
        batch.set(this.db.collection('students').doc(st.id), st);
      }

      // Teacher Assignments
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
    }

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

      // 3. BCA & BTech Subjects
      const defaultSubjects: SubjectMaster[] = [
        // BCA Semester 1
        { id: 'sub_bca101', subjectCode: 'BCA-101', name: 'Computer Fundamentals & Problem Solving', courseId: 'crs_bca', semester: 1, isRequired: true, credits: 4, isActive: true, createdAt: new Date().toISOString() },
        { id: 'sub_bca102', subjectCode: 'BCA-102', name: 'Programming in C Language', courseId: 'crs_bca', semester: 1, isRequired: true, credits: 4, isActive: true, createdAt: new Date().toISOString() },
        { id: 'sub_bca103', subjectCode: 'BCA-103', name: 'Mathematical Foundations for Computing', courseId: 'crs_bca', semester: 1, isRequired: true, credits: 3, isActive: true, createdAt: new Date().toISOString() },
        { id: 'sub_bca104_el1', subjectCode: 'BCA-104A', name: 'Technical Communication & Soft Skills', courseId: 'crs_bca', semester: 1, isRequired: false, electiveGroup: 'EL_GRP_1', credits: 3, isActive: true, createdAt: new Date().toISOString() },
        { id: 'sub_bca104_el2', subjectCode: 'BCA-104B', name: 'Organizational Behavior & Ethics', courseId: 'crs_bca', semester: 1, isRequired: false, electiveGroup: 'EL_GRP_1', credits: 3, isActive: true, createdAt: new Date().toISOString() },
        // BCA Semester 2
        { id: 'sub_bca201', subjectCode: 'BCA-201', name: 'Data Structures using C', courseId: 'crs_bca', semester: 2, isRequired: true, credits: 4, isActive: true, createdAt: new Date().toISOString() },
        { id: 'sub_bca202', subjectCode: 'BCA-202', name: 'Object Oriented Programming in C++', courseId: 'crs_bca', semester: 2, isRequired: true, credits: 4, isActive: true, createdAt: new Date().toISOString() },
        { id: 'sub_bca203', subjectCode: 'BCA-203', name: 'Digital Electronics & Computer Architecture', courseId: 'crs_bca', semester: 2, isRequired: true, credits: 4, isActive: true, createdAt: new Date().toISOString() },
        { id: 'sub_bca204_el1', subjectCode: 'BCA-204A', name: 'Environmental Studies & Green Computing', courseId: 'crs_bca', semester: 2, isRequired: false, electiveGroup: 'EL_GRP_2', credits: 3, isActive: true, createdAt: new Date().toISOString() },
        { id: 'sub_bca204_el2', subjectCode: 'BCA-204B', name: 'Disaster Management & Cyber Safety', courseId: 'crs_bca', semester: 2, isRequired: false, electiveGroup: 'EL_GRP_2', credits: 3, isActive: true, createdAt: new Date().toISOString() },
        // BCA Semester 3
        { id: 'sub_bca301', subjectCode: 'BCA-301', name: 'Database Management Systems & SQL', courseId: 'crs_bca', semester: 3, isRequired: true, credits: 4, isActive: true, createdAt: new Date().toISOString() },
        { id: 'sub_bca302', subjectCode: 'BCA-302', name: 'Operating System Principles & Unix', courseId: 'crs_bca', semester: 3, isRequired: true, credits: 4, isActive: true, createdAt: new Date().toISOString() },
        { id: 'sub_bca303', subjectCode: 'BCA-303', name: 'Java Programming & Application Development', courseId: 'crs_bca', semester: 3, isRequired: true, credits: 4, isActive: true, createdAt: new Date().toISOString() },
        { id: 'sub_bca304', subjectCode: 'BCA-304', name: 'Discrete Mathematics & Graph Theory', courseId: 'crs_bca', semester: 3, isRequired: true, credits: 3, isActive: true, createdAt: new Date().toISOString() },
        // BCA Semester 4
        { id: 'sub_bca401', subjectCode: 'BCA-401', name: 'Computer Networks & TCP/IP Architecture', courseId: 'crs_bca', semester: 4, isRequired: true, credits: 4, isActive: true, createdAt: new Date().toISOString() },
        { id: 'sub_bca402', subjectCode: 'BCA-402', name: 'Web Development & Client-Side Scripting', courseId: 'crs_bca', semester: 4, isRequired: true, credits: 4, isActive: true, createdAt: new Date().toISOString() },
        { id: 'sub_bca403', subjectCode: 'BCA-403', name: 'Software Engineering & Agile Methodologies', courseId: 'crs_bca', semester: 4, isRequired: true, credits: 4, isActive: true, createdAt: new Date().toISOString() },
        { id: 'sub_bca404', subjectCode: 'BCA-404', name: 'Python for Computing & Scripting', courseId: 'crs_bca', semester: 4, isRequired: true, credits: 3, isActive: true, createdAt: new Date().toISOString() },
        // BCA Semester 5
        { id: 'sub_bca501', subjectCode: 'BCA-501', name: 'Cloud Computing Infrastructure & Virtualization', courseId: 'crs_bca', semester: 5, isRequired: true, credits: 4, isActive: true, createdAt: new Date().toISOString() },
        { id: 'sub_bca502', subjectCode: 'BCA-502', name: 'Artificial Intelligence & Machine Learning Basics', courseId: 'crs_bca', semester: 5, isRequired: true, credits: 4, isActive: true, createdAt: new Date().toISOString() },
        { id: 'sub_bca503', subjectCode: 'BCA-503', name: 'Information & Network Security', courseId: 'crs_bca', semester: 5, isRequired: true, credits: 4, isActive: true, createdAt: new Date().toISOString() },
        { id: 'sub_bca504_el1', subjectCode: 'BCA-504A', name: 'Mobile Application Development (Flutter/Android)', courseId: 'crs_bca', semester: 5, isRequired: false, electiveGroup: 'EL_GRP_3', credits: 3, isActive: true, createdAt: new Date().toISOString() },
        { id: 'sub_bca504_el2', subjectCode: 'BCA-504B', name: 'Big Data Fundamentals & NoSQL', courseId: 'crs_bca', semester: 5, isRequired: false, electiveGroup: 'EL_GRP_3', credits: 3, isActive: true, createdAt: new Date().toISOString() },
        // BCA Semester 6
        { id: 'sub_bca601', subjectCode: 'BCA-601', name: 'Full Stack Web Architecture & APIs', courseId: 'crs_bca', semester: 6, isRequired: true, credits: 4, isActive: true, createdAt: new Date().toISOString() },
        { id: 'sub_bca602', subjectCode: 'BCA-602', name: 'Major Capstone Project & Dissertation', courseId: 'crs_bca', semester: 6, isRequired: true, credits: 6, isActive: true, createdAt: new Date().toISOString() },
        { id: 'sub_bca603', subjectCode: 'BCA-603', name: 'Professional Seminar & Research Methodology', courseId: 'crs_bca', semester: 6, isRequired: true, credits: 2, isActive: true, createdAt: new Date().toISOString() },
        { id: 'sub_bca604_el1', subjectCode: 'BCA-604A', name: 'DevOps & Continuous Integration Practices', courseId: 'crs_bca', semester: 6, isRequired: false, electiveGroup: 'EL_GRP_4', credits: 3, isActive: true, createdAt: new Date().toISOString() },
        { id: 'sub_bca604_el2', subjectCode: 'BCA-604B', name: 'Internet of Things (IoT) & Embedded Sensors', courseId: 'crs_bca', semester: 6, isRequired: false, electiveGroup: 'EL_GRP_4', credits: 3, isActive: true, createdAt: new Date().toISOString() },
        // B.Tech
        { id: 'sub_bt101', subjectCode: 'BT-CS101', name: 'Advanced Engineering Mathematics', courseId: 'crs_btech', semester: 1, isRequired: true, credits: 4, isActive: true, createdAt: new Date().toISOString() },
        { id: 'sub_bt102', subjectCode: 'BT-CS102', name: 'Data Structures and Algorithms', courseId: 'crs_btech', semester: 1, isRequired: true, credits: 4, isActive: true, createdAt: new Date().toISOString() },
      ];
      for (const sub of defaultSubjects) {
        batch.set(this.db.collection('subjects').doc(sub.id), sub);
      }

      await batch.commit();
    }

    // Ensure subjects collection is populated even if courses collection was already initialized
    const subjectSnapshot = await this.db.collection('subjects').limit(1).get();
    if (subjectSnapshot.empty) {
      console.log('[Firestore Init] Seeding subject catalog into Cloud Firestore...');
      const batch = this.db.batch();
      // BCA & BTech Subjects
      const defaultSubjects: SubjectMaster[] = [
        // BCA Semester 1
        { id: 'sub_bca101', subjectCode: 'BCA-101', name: 'Computer Fundamentals & Problem Solving', courseId: 'crs_bca', semester: 1, isRequired: true, credits: 4, isActive: true, createdAt: new Date().toISOString() },
        { id: 'sub_bca102', subjectCode: 'BCA-102', name: 'Programming in C Language', courseId: 'crs_bca', semester: 1, isRequired: true, credits: 4, isActive: true, createdAt: new Date().toISOString() },
        { id: 'sub_bca103', subjectCode: 'BCA-103', name: 'Mathematical Foundations for Computing', courseId: 'crs_bca', semester: 1, isRequired: true, credits: 3, isActive: true, createdAt: new Date().toISOString() },
        { id: 'sub_bca104_el1', subjectCode: 'BCA-104A', name: 'Technical Communication & Soft Skills', courseId: 'crs_bca', semester: 1, isRequired: false, electiveGroup: 'EL_GRP_1', credits: 3, isActive: true, createdAt: new Date().toISOString() },
        { id: 'sub_bca104_el2', subjectCode: 'BCA-104B', name: 'Organizational Behavior & Ethics', courseId: 'crs_bca', semester: 1, isRequired: false, electiveGroup: 'EL_GRP_1', credits: 3, isActive: true, createdAt: new Date().toISOString() },
        // BCA Semester 2
        { id: 'sub_bca201', subjectCode: 'BCA-201', name: 'Data Structures using C', courseId: 'crs_bca', semester: 2, isRequired: true, credits: 4, isActive: true, createdAt: new Date().toISOString() },
        { id: 'sub_bca202', subjectCode: 'BCA-202', name: 'Object Oriented Programming in C++', courseId: 'crs_bca', semester: 2, isRequired: true, credits: 4, isActive: true, createdAt: new Date().toISOString() },
        { id: 'sub_bca203', subjectCode: 'BCA-203', name: 'Digital Electronics & Computer Architecture', courseId: 'crs_bca', semester: 2, isRequired: true, credits: 4, isActive: true, createdAt: new Date().toISOString() },
        { id: 'sub_bca204_el1', subjectCode: 'BCA-204A', name: 'Environmental Studies & Green Computing', courseId: 'crs_bca', semester: 2, isRequired: false, electiveGroup: 'EL_GRP_2', credits: 3, isActive: true, createdAt: new Date().toISOString() },
        { id: 'sub_bca204_el2', subjectCode: 'BCA-204B', name: 'Disaster Management & Cyber Safety', courseId: 'crs_bca', semester: 2, isRequired: false, electiveGroup: 'EL_GRP_2', credits: 3, isActive: true, createdAt: new Date().toISOString() },
        // BCA Semester 3
        { id: 'sub_bca301', subjectCode: 'BCA-301', name: 'Database Management Systems & SQL', courseId: 'crs_bca', semester: 3, isRequired: true, credits: 4, isActive: true, createdAt: new Date().toISOString() },
        { id: 'sub_bca302', subjectCode: 'BCA-302', name: 'Operating System Principles & Unix', courseId: 'crs_bca', semester: 3, isRequired: true, credits: 4, isActive: true, createdAt: new Date().toISOString() },
        { id: 'sub_bca303', subjectCode: 'BCA-303', name: 'Java Programming & Application Development', courseId: 'crs_bca', semester: 3, isRequired: true, credits: 4, isActive: true, createdAt: new Date().toISOString() },
        { id: 'sub_bca304', subjectCode: 'BCA-304', name: 'Discrete Mathematics & Graph Theory', courseId: 'crs_bca', semester: 3, isRequired: true, credits: 3, isActive: true, createdAt: new Date().toISOString() },
        // BCA Semester 4
        { id: 'sub_bca401', subjectCode: 'BCA-401', name: 'Computer Networks & TCP/IP Architecture', courseId: 'crs_bca', semester: 4, isRequired: true, credits: 4, isActive: true, createdAt: new Date().toISOString() },
        { id: 'sub_bca402', subjectCode: 'BCA-402', name: 'Web Development & Client-Side Scripting', courseId: 'crs_bca', semester: 4, isRequired: true, credits: 4, isActive: true, createdAt: new Date().toISOString() },
        { id: 'sub_bca403', subjectCode: 'BCA-403', name: 'Software Engineering & Agile Methodologies', courseId: 'crs_bca', semester: 4, isRequired: true, credits: 4, isActive: true, createdAt: new Date().toISOString() },
        { id: 'sub_bca404', subjectCode: 'BCA-404', name: 'Python for Computing & Scripting', courseId: 'crs_bca', semester: 4, isRequired: true, credits: 3, isActive: true, createdAt: new Date().toISOString() },
        // BCA Semester 5
        { id: 'sub_bca501', subjectCode: 'BCA-501', name: 'Cloud Computing Infrastructure & Virtualization', courseId: 'crs_bca', semester: 5, isRequired: true, credits: 4, isActive: true, createdAt: new Date().toISOString() },
        { id: 'sub_bca502', subjectCode: 'BCA-502', name: 'Artificial Intelligence & Machine Learning Basics', courseId: 'crs_bca', semester: 5, isRequired: true, credits: 4, isActive: true, createdAt: new Date().toISOString() },
        { id: 'sub_bca503', subjectCode: 'BCA-503', name: 'Information & Network Security', courseId: 'crs_bca', semester: 5, isRequired: true, credits: 4, isActive: true, createdAt: new Date().toISOString() },
        { id: 'sub_bca504_el1', subjectCode: 'BCA-504A', name: 'Mobile Application Development (Flutter/Android)', courseId: 'crs_bca', semester: 5, isRequired: false, electiveGroup: 'EL_GRP_3', credits: 3, isActive: true, createdAt: new Date().toISOString() },
        { id: 'sub_bca504_el2', subjectCode: 'BCA-504B', name: 'Big Data Fundamentals & NoSQL', courseId: 'crs_bca', semester: 5, isRequired: false, electiveGroup: 'EL_GRP_3', credits: 3, isActive: true, createdAt: new Date().toISOString() },
        // BCA Semester 6
        { id: 'sub_bca601', subjectCode: 'BCA-601', name: 'Full Stack Web Architecture & APIs', courseId: 'crs_bca', semester: 6, isRequired: true, credits: 4, isActive: true, createdAt: new Date().toISOString() },
        { id: 'sub_bca602', subjectCode: 'BCA-602', name: 'Major Capstone Project & Dissertation', courseId: 'crs_bca', semester: 6, isRequired: true, credits: 6, isActive: true, createdAt: new Date().toISOString() },
        { id: 'sub_bca603', subjectCode: 'BCA-603', name: 'Professional Seminar & Research Methodology', courseId: 'crs_bca', semester: 6, isRequired: true, credits: 2, isActive: true, createdAt: new Date().toISOString() },
        { id: 'sub_bca604_el1', subjectCode: 'BCA-604A', name: 'DevOps & Continuous Integration Practices', courseId: 'crs_bca', semester: 6, isRequired: false, electiveGroup: 'EL_GRP_4', credits: 3, isActive: true, createdAt: new Date().toISOString() },
        { id: 'sub_bca604_el2', subjectCode: 'BCA-604B', name: 'Internet of Things (IoT) & Embedded Sensors', courseId: 'crs_bca', semester: 6, isRequired: false, electiveGroup: 'EL_GRP_4', credits: 3, isActive: true, createdAt: new Date().toISOString() },
        // B.Tech
        { id: 'sub_bt101', subjectCode: 'BT-CS101', name: 'Advanced Engineering Mathematics', courseId: 'crs_btech', semester: 1, isRequired: true, credits: 4, isActive: true, createdAt: new Date().toISOString() },
        { id: 'sub_bt102', subjectCode: 'BT-CS102', name: 'Data Structures and Algorithms', courseId: 'crs_btech', semester: 1, isRequired: true, credits: 4, isActive: true, createdAt: new Date().toISOString() },
      ];
      for (const s of defaultSubjects) {
        batch.set(this.db.collection('subjects').doc(s.id), s);
      }
      await batch.commit();
    }

    const feeSnapshot = await this.db.collection('feeStructures').limit(1).get();
    if (feeSnapshot.empty) {
      console.log('[Firestore Init] Seeding fee structures and student fee records...');
      const batch = this.db.batch();

      const defaultFees: CourseFeeStructure[] = [
        { id: 'fee_bca_s1', courseId: 'crs_bca', semester: 1, academicCycle: AcademicCycle.ODD_DECEMBER, tuitionFee: 25000, examinationFee: 3000, laboratoryFee: 3000, libraryFee: 1000, totalFee: 32000, advanceCollectionSemester: 2, ruleNotes: 'Fees collected 1 semester in advance; Dec cycle' },
        { id: 'fee_bca_s2', courseId: 'crs_bca', semester: 2, academicCycle: AcademicCycle.EVEN_JUNE, tuitionFee: 25000, examinationFee: 3000, laboratoryFee: 3000, libraryFee: 1000, totalFee: 32000, advanceCollectionSemester: 3, ruleNotes: 'Fees collected 1 semester in advance; June cycle' },
        { id: 'fee_bba_s1', courseId: 'crs_bba', semester: 1, academicCycle: AcademicCycle.ODD_DECEMBER, tuitionFee: 24000, examinationFee: 3000, laboratoryFee: 2000, libraryFee: 1000, totalFee: 30000, advanceCollectionSemester: 2, ruleNotes: 'Fees collected 1 semester in advance; Dec cycle' },
        { id: 'fee_bcom_s1', courseId: 'crs_bcom', semester: 1, academicCycle: AcademicCycle.ODD_DECEMBER, tuitionFee: 19000, examinationFee: 2500, laboratoryFee: 1500, libraryFee: 1000, totalFee: 24000, advanceCollectionSemester: 2, ruleNotes: 'Fees collected 1 semester in advance; Dec cycle' },
        { id: 'fee_ba_s1', courseId: 'crs_ba', semester: 1, academicCycle: AcademicCycle.ODD_DECEMBER, tuitionFee: 16000, examinationFee: 2000, laboratoryFee: 1000, libraryFee: 1000, totalFee: 20000, advanceCollectionSemester: 2, ruleNotes: 'Fees collected 1 semester in advance; Dec cycle' },
        { id: 'fee_btech_s1', courseId: 'crs_btech', semester: 1, academicCycle: AcademicCycle.ODD_DECEMBER, tuitionFee: 42000, examinationFee: 4000, laboratoryFee: 6000, libraryFee: 3000, totalFee: 55000, advanceCollectionSemester: 2, ruleNotes: 'Fees collected 1 semester in advance; Dec cycle' },
        { id: 'fee_mca_s1', courseId: 'crs_mca', semester: 1, academicCycle: AcademicCycle.ODD_DECEMBER, tuitionFee: 34000, examinationFee: 3500, laboratoryFee: 3000, libraryFee: 1500, totalFee: 42000, advanceCollectionSemester: 2, ruleNotes: 'Fees collected 1 semester in advance; Dec cycle' },
        { id: 'fee_mba_s1', courseId: 'crs_mba', semester: 1, academicCycle: AcademicCycle.ODD_DECEMBER, tuitionFee: 38000, examinationFee: 4000, laboratoryFee: 4000, libraryFee: 2000, totalFee: 48000, advanceCollectionSemester: 2, ruleNotes: 'Fees collected 1 semester in advance; Dec cycle' },
      ];
      for (const f of defaultFees) {
        batch.set(this.db.collection('feeStructures').doc(f.id), f);
      }

      const defaultStudentFees: StudentFeeRecord[] = [
        { id: 'stf_aarav_s1', studentId: 'stu_aarav', courseId: 'crs_bca', currentSemester: 1, assessedSemester: 1, academicCycle: AcademicCycle.ODD_DECEMBER, totalFee: 32000, paidAmount: 32000, balance: 0, status: FeePaymentStatus.PAID, dueDate: '2025-08-15', paidAt: '2025-08-10T10:30:00Z', receiptNumber: 'REC-2025-BCA-0012', isAdvancePayment: false },
        { id: 'stf_aarav_s2_adv', studentId: 'stu_aarav', courseId: 'crs_bca', currentSemester: 1, assessedSemester: 2, academicCycle: AcademicCycle.EVEN_JUNE, totalFee: 32000, paidAmount: 32000, balance: 0, status: FeePaymentStatus.PAID, dueDate: '2025-12-10', paidAt: '2025-12-05T14:15:00Z', receiptNumber: 'REC-2025-BCA-0044', isAdvancePayment: true },
        { id: 'stf_diya_s1', studentId: 'stu_diya', courseId: 'crs_bca', currentSemester: 1, assessedSemester: 1, academicCycle: AcademicCycle.ODD_DECEMBER, totalFee: 32000, paidAmount: 32000, balance: 0, status: FeePaymentStatus.PAID, dueDate: '2025-08-15', paidAt: '2025-08-12T11:00:00Z', receiptNumber: 'REC-2025-BCA-0015', isAdvancePayment: false },
        { id: 'stf_diya_s2_adv', studentId: 'stu_diya', courseId: 'crs_bca', currentSemester: 1, assessedSemester: 2, academicCycle: AcademicCycle.EVEN_JUNE, totalFee: 32000, paidAmount: 16000, balance: 16000, status: FeePaymentStatus.PARTIAL, dueDate: '2025-12-10', paidAt: '2025-12-01T09:20:00Z', receiptNumber: 'REC-2025-BCA-0048', isAdvancePayment: true },
        { id: 'stf_kabir_s1', studentId: 'stu_kabir', courseId: 'crs_bca', currentSemester: 1, assessedSemester: 1, academicCycle: AcademicCycle.ODD_DECEMBER, totalFee: 32000, paidAmount: 32000, balance: 0, status: FeePaymentStatus.PAID, dueDate: '2025-08-15', paidAt: '2025-08-14T16:45:00Z', receiptNumber: 'REC-2025-BCA-0021', isAdvancePayment: false },
        { id: 'stf_kabir_s2_adv', studentId: 'stu_kabir', courseId: 'crs_bca', currentSemester: 1, assessedSemester: 2, academicCycle: AcademicCycle.EVEN_JUNE, totalFee: 32000, paidAmount: 0, balance: 32000, status: FeePaymentStatus.PENDING, dueDate: '2025-12-10', isAdvancePayment: true },
      ];
      for (const sf of defaultStudentFees) {
        batch.set(this.db.collection('studentFeeRecords').doc(sf.id), sf);
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

  async updateCourse(id: string, updates: Partial<CourseStructure>): Promise<CourseStructure> {
    const docRef = this.db.collection('courseStructures').doc(id);
    await docRef.set(updates, { merge: true });
    const updated = await docRef.get();
    return updated.data() as CourseStructure;
  }

  async deleteCourse(id: string): Promise<boolean> {
    await this.db.collection('courseStructures').doc(id).delete();
    return true;
  }

  async getSubjects(courseId?: string, semester?: number): Promise<SubjectMaster[]> {
    let query: FirebaseFirestore.Query = this.db.collection('subjects');
    if (courseId) {
      const course = await this.getCourseById(courseId);
      const targetId = course ? course.id : courseId;
      query = query.where('courseId', '==', targetId);
    }
    if (semester !== undefined) query = query.where('semester', '==', Number(semester));
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

  async updateSubject(id: string, updates: Partial<SubjectMaster>): Promise<SubjectMaster> {
    const docRef = this.db.collection('subjects').doc(id);
    await docRef.set(updates, { merge: true });
    const updated = await docRef.get();
    return updated.data() as SubjectMaster;
  }

  async deleteSubject(id: string): Promise<boolean> {
    await this.db.collection('subjects').doc(id).delete();
    return true;
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

  async updateStudent(id: string, updates: Partial<StudentProfile>): Promise<StudentProfile> {
    const docRef = this.db.collection('students').doc(id);
    await docRef.set(updates, { merge: true });
    const updated = await docRef.get();
    return updated.data() as StudentProfile;
  }

  async deleteStudent(id: string): Promise<boolean> {
    await this.db.collection('students').doc(id).delete();
    return true;
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

  async updateTeacher(id: string, updates: Partial<TeacherProfile>): Promise<TeacherProfile> {
    const docRef = this.db.collection('teachers').doc(id);
    await docRef.set(updates, { merge: true });
    const updated = await docRef.get();
    return updated.data() as TeacherProfile;
  }

  async deleteTeacher(id: string): Promise<boolean> {
    await this.db.collection('teachers').doc(id).delete();
    return true;
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

  async getFeeStructures(courseId?: string): Promise<CourseFeeStructure[]> {
    let query: FirebaseFirestore.Query = this.db.collection('feeStructures');
    if (courseId) query = query.where('courseId', '==', courseId);
    const snap = await query.get();
    return snap.docs.map((d) => d.data() as CourseFeeStructure);
  }

  async getStudentFeeRecords(studentId?: string): Promise<StudentFeeRecord[]> {
    let query: FirebaseFirestore.Query = this.db.collection('studentFeeRecords');
    if (studentId) query = query.where('studentId', '==', studentId);
    const snap = await query.get();
    return snap.docs.map((d) => d.data() as StudentFeeRecord);
  }

  async recordFeePayment(payment: {
    studentId: string;
    amount: number;
    assessedSemester?: number;
    receiptNumber?: string;
  }): Promise<StudentFeeRecord> {
    let query: FirebaseFirestore.Query = this.db.collection('studentFeeRecords').where('studentId', '==', payment.studentId);
    if (payment.assessedSemester !== undefined) {
      query = query.where('assessedSemester', '==', payment.assessedSemester);
    }
    const snap = await query.get();
    let targetDoc = snap.docs.find((d) => (d.data() as StudentFeeRecord).status !== FeePaymentStatus.PAID) || snap.docs[0];

    let target: StudentFeeRecord;
    let docRef: FirebaseFirestore.DocumentReference;

    if (!targetDoc) {
      const id = `stf_${payment.studentId}_s${payment.assessedSemester || 2}`;
      docRef = this.db.collection('studentFeeRecords').doc(id);
      target = {
        id,
        studentId: payment.studentId,
        courseId: 'crs_bca',
        currentSemester: 1,
        assessedSemester: payment.assessedSemester || 2,
        academicCycle: (payment.assessedSemester || 2) % 2 === 0 ? AcademicCycle.EVEN_JUNE : AcademicCycle.ODD_DECEMBER,
        totalFee: 32000,
        paidAmount: 0,
        balance: 32000,
        status: FeePaymentStatus.PENDING,
        dueDate: '2026-01-15',
        isAdvancePayment: true,
      };
    } else {
      docRef = targetDoc.ref;
      target = targetDoc.data() as StudentFeeRecord;
    }

    target.paidAmount += payment.amount;
    target.balance = Math.max(0, target.totalFee - target.paidAmount);
    target.status = target.balance === 0 ? FeePaymentStatus.PAID : target.paidAmount > 0 ? FeePaymentStatus.PARTIAL : FeePaymentStatus.PENDING;
    target.paidAt = new Date().toISOString();
    target.receiptNumber = payment.receiptNumber || `REC-${Date.now().toString().slice(-6)}`;

    await docRef.set(target);
    return target;
  }
}
