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
import { IAcademicRepository } from '../interfaces/IAcademicRepository.ts';

/**
 * Academic Repository Implementation
 * Maps to Firestore collections: courseStructures, academicSessions, subjects, students, teachers, teacherAssignments, users, feeStructures, studentFeeRecords
 * Future Oracle Mapping: SPIS_COURSE_STRUCTURES, SPIS_ACADEMIC_SESSIONS, SPIS_SUBJECTS, SPIS_STUDENTS, SPIS_TEACHERS, SPIS_TEACHER_ASSIGNMENTS, SPIS_USERS, SPIS_FEE_STRUCTURES, SPIS_STUDENT_FEES
 */
export class AcademicRepository implements IAcademicRepository {
  private sessions: Map<string, AcademicSession> = new Map();
  private courses: Map<string, CourseStructure> = new Map();
  private subjects: Map<string, SubjectMaster> = new Map();
  private students: Map<string, StudentProfile> = new Map();
  private teachers: Map<string, TeacherProfile> = new Map();
  private assignments: Map<string, TeacherAssignment> = new Map();
  private users: Map<string, UserAccount> = new Map();
  private feeStructures: Map<string, CourseFeeStructure> = new Map();
  private studentFeeRecords: Map<string, StudentFeeRecord> = new Map();

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

    // 3. BCA & B.Tech Subjects
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
    for (const sub of defaultSubjects) this.subjects.set(sub.id, sub);

    // 4. Default Users
    const defaultUsers: UserAccount[] = [
      { id: 'usr_admin', email: 'admin@institution.edu', displayName: 'Prof. Eleanor Vance (Dean & Admin)', role: UserRole.ADMIN, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'usr_admin_jha', email: 'jhaa47531@gmail.com', displayName: 'System Administrator (Aditya Jha)', role: UserRole.ADMIN, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
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

    // 8. Fee Structures (Preserving institutional rule: Fees collected one semester in advance; June=Even cycle, Dec=Odd cycle)
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
    for (const f of defaultFees) this.feeStructures.set(f.id, f);

    // 9. Initial Student Fee Records
    const defaultStudentFees: StudentFeeRecord[] = [
      // Aarav: Sem 1 Paid + Sem 2 Advance Paid
      { id: 'stf_aarav_s1', studentId: 'stu_aarav', courseId: 'crs_bca', currentSemester: 1, assessedSemester: 1, academicCycle: AcademicCycle.ODD_DECEMBER, totalFee: 32000, paidAmount: 32000, balance: 0, status: FeePaymentStatus.PAID, dueDate: '2025-08-15', paidAt: '2025-08-10T10:30:00Z', receiptNumber: 'REC-2025-BCA-0012', isAdvancePayment: false },
      { id: 'stf_aarav_s2_adv', studentId: 'stu_aarav', courseId: 'crs_bca', currentSemester: 1, assessedSemester: 2, academicCycle: AcademicCycle.EVEN_JUNE, totalFee: 32000, paidAmount: 32000, balance: 0, status: FeePaymentStatus.PAID, dueDate: '2025-12-10', paidAt: '2025-12-05T14:15:00Z', receiptNumber: 'REC-2025-BCA-0044', isAdvancePayment: true },

      // Diya: Sem 1 Paid + Sem 2 Advance Partial (Due in Dec cycle)
      { id: 'stf_diya_s1', studentId: 'stu_diya', courseId: 'crs_bca', currentSemester: 1, assessedSemester: 1, academicCycle: AcademicCycle.ODD_DECEMBER, totalFee: 32000, paidAmount: 32000, balance: 0, status: FeePaymentStatus.PAID, dueDate: '2025-08-15', paidAt: '2025-08-12T11:00:00Z', receiptNumber: 'REC-2025-BCA-0015', isAdvancePayment: false },
      { id: 'stf_diya_s2_adv', studentId: 'stu_diya', courseId: 'crs_bca', currentSemester: 1, assessedSemester: 2, academicCycle: AcademicCycle.EVEN_JUNE, totalFee: 32000, paidAmount: 16000, balance: 16000, status: FeePaymentStatus.PARTIAL, dueDate: '2025-12-10', paidAt: '2025-12-01T09:20:00Z', receiptNumber: 'REC-2025-BCA-0048', isAdvancePayment: true },

      // Kabir: Sem 1 Paid + Sem 2 Advance Pending
      { id: 'stf_kabir_s1', studentId: 'stu_kabir', courseId: 'crs_bca', currentSemester: 1, assessedSemester: 1, academicCycle: AcademicCycle.ODD_DECEMBER, totalFee: 32000, paidAmount: 32000, balance: 0, status: FeePaymentStatus.PAID, dueDate: '2025-08-15', paidAt: '2025-08-14T16:45:00Z', receiptNumber: 'REC-2025-BCA-0021', isAdvancePayment: false },
      { id: 'stf_kabir_s2_adv', studentId: 'stu_kabir', courseId: 'crs_bca', currentSemester: 1, assessedSemester: 2, academicCycle: AcademicCycle.EVEN_JUNE, totalFee: 32000, paidAmount: 0, balance: 32000, status: FeePaymentStatus.PENDING, dueDate: '2025-12-10', isAdvancePayment: true },
    ];
    for (const sf of defaultStudentFees) this.studentFeeRecords.set(sf.id, sf);
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

  async updateCourse(id: string, updates: Partial<CourseStructure>): Promise<CourseStructure> {
    const existing = this.courses.get(id);
    if (!existing) throw new Error(`Course ${id} not found`);
    const updated = { ...existing, ...updates };
    this.courses.set(id, updated);
    return updated;
  }

  async deleteCourse(id: string): Promise<boolean> {
    return this.courses.delete(id);
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

  async updateSubject(id: string, updates: Partial<SubjectMaster>): Promise<SubjectMaster> {
    const existing = this.subjects.get(id);
    if (!existing) throw new Error(`Subject ${id} not found`);
    const updated = { ...existing, ...updates };
    this.subjects.set(id, updated);
    return updated;
  }

  async deleteSubject(id: string): Promise<boolean> {
    return this.subjects.delete(id);
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

  async updateStudent(id: string, updates: Partial<StudentProfile>): Promise<StudentProfile> {
    const existing = this.students.get(id);
    if (!existing) throw new Error(`Student ${id} not found`);
    const updated = { ...existing, ...updates };
    this.students.set(id, updated);
    return updated;
  }

  async deleteStudent(id: string): Promise<boolean> {
    return this.students.delete(id);
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

  async updateTeacher(id: string, updates: Partial<TeacherProfile>): Promise<TeacherProfile> {
    const existing = this.teachers.get(id);
    if (!existing) throw new Error(`Teacher ${id} not found`);
    const updated = { ...existing, ...updates };
    this.teachers.set(id, updated);
    return updated;
  }

  async deleteTeacher(id: string): Promise<boolean> {
    return this.teachers.delete(id);
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

  async getFeeStructures(courseId?: string): Promise<CourseFeeStructure[]> {
    let list = Array.from(this.feeStructures.values());
    if (courseId) list = list.filter((f) => f.courseId === courseId);
    return list;
  }

  async getStudentFeeRecords(studentId?: string): Promise<StudentFeeRecord[]> {
    let list = Array.from(this.studentFeeRecords.values());
    if (studentId) list = list.filter((r) => r.studentId === studentId);
    return list;
  }

  async recordFeePayment(payment: {
    studentId: string;
    amount: number;
    assessedSemester?: number;
    receiptNumber?: string;
  }): Promise<StudentFeeRecord> {
    const records = Array.from(this.studentFeeRecords.values()).filter(
      (r) => r.studentId === payment.studentId && (payment.assessedSemester === undefined || r.assessedSemester === payment.assessedSemester)
    );

    let target = records.find((r) => r.status !== FeePaymentStatus.PAID) || records[0];

    if (!target) {
      // Create new advance record
      const id = `stf_${payment.studentId}_s${payment.assessedSemester || 2}`;
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
      this.studentFeeRecords.set(id, target);
    }

    target.paidAmount += payment.amount;
    target.balance = Math.max(0, target.totalFee - target.paidAmount);
    target.status = target.balance === 0 ? FeePaymentStatus.PAID : target.paidAmount > 0 ? FeePaymentStatus.PARTIAL : FeePaymentStatus.PENDING;
    target.paidAt = new Date().toISOString();
    target.receiptNumber = payment.receiptNumber || `REC-${Date.now().toString().slice(-6)}`;

    this.studentFeeRecords.set(target.id, target);
    return target;
  }
}

export const globalAcademicRepo = new AcademicRepository();
