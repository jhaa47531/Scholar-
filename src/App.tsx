import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap,
  Shield,
  Layers,
  BookOpen,
  Award,
  Users,
  Lock,
  ArrowRight,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import {
  UserRole,
  CourseStructure,
  AcademicSession,
  SubjectMaster,
  StudentProfile,
  TeacherProfile,
  TeacherAssignment,
  SessionalConfig,
  AuditLogEntry,
} from './types/domain.ts';
import { api, authFetch, getApiAuthToken, setApiAuthToken } from './services/api.ts';
import { Sidebar } from './components/layout/Sidebar.tsx';
import { TopBar } from './components/layout/TopBar.tsx';
import { LoginModal } from './components/auth/LoginModal.tsx';
import { LoginPage } from './components/auth/LoginPage.tsx';
import { GlobalSearchModal } from './components/common/GlobalSearchModal.tsx';
import { NotificationDrawer } from './components/common/NotificationDrawer.tsx';

// Admin Components
import { AdminOverview } from './components/admin/AdminOverview.tsx';
import { AdminAnalytics } from './components/admin/AdminAnalytics.tsx';
import { AdminStudents } from './components/admin/AdminStudents.tsx';
import { AdminFaculty } from './components/admin/AdminFaculty.tsx';
import { AdminCourses } from './components/admin/AdminCourses.tsx';
import { AdminSubjects } from './components/admin/AdminSubjects.tsx';
import { AdminAssignments } from './components/admin/AdminAssignments.tsx';
import { AdminConfigs } from './components/admin/AdminConfigs.tsx';
import { AdminReports } from './components/admin/AdminReports.tsx';
import { AdminAuditLogs } from './components/admin/AdminAuditLogs.tsx';
import { AdminMigration } from './components/admin/AdminMigration.tsx';

// Teacher Components
import { TeacherOverview } from './components/teacher/TeacherOverview.tsx';
import { TeacherMySubjects } from './components/teacher/TeacherMySubjects.tsx';
import { TeacherRoster } from './components/teacher/TeacherRoster.tsx';
import { TeacherMarksEntry } from './components/teacher/TeacherMarksEntry.tsx';
import { TeacherDrafts } from './components/teacher/TeacherDrafts.tsx';
import { TeacherFinalSubmissions } from './components/teacher/TeacherFinalSubmissions.tsx';
import { TeacherCorrectionHistory } from './components/teacher/TeacherCorrectionHistory.tsx';

// Student Components
import { StudentDashboard } from './components/student/StudentDashboard.tsx';
import { StudentResults } from './components/student/StudentResults.tsx';
import { StudentSubjectPerformance } from './components/student/StudentSubjectPerformance.tsx';
import { StudentProgressAnalytics } from './components/student/StudentProgressAnalytics.tsx';
import { StudentRecommendations } from './components/student/StudentRecommendations.tsx';
import { StudentFinalReports } from './components/student/StudentFinalReports.tsx';

export default function App() {
  // Session & Authentication State
  const [authToken, setAuthToken] = useState<string | null>(() => getApiAuthToken());
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Active Navigation Page
  const [activePage, setActivePage] = useState<string>('overview');
  const [selectedTeacherSubject, setSelectedTeacherSubject] = useState<string>('sub_bca101');

  // Master Academic Records
  const [courses, setCourses] = useState<CourseStructure[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('sess_2025_26');
  const [subjects, setSubjects] = useState<SubjectMaster[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [faculty, setFaculty] = useState<TeacherProfile[]>([]);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [configs, setConfigs] = useState<SessionalConfig[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [healthStatus, setHealthStatus] = useState<any>(null);

  // Student Portal Specific Records
  const [studentMarksData, setStudentMarksData] = useState<any[]>([]);
  const [studentReport, setStudentReport] = useState<any>(null);
  const [studentComparison, setStudentComparison] = useState<any>(null);

  // UI Overlays
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Verify Auth Session using a specific token or current stored token
  const verifySession = async (tokenToVerify?: string | null) => {
    const token = tokenToVerify ?? authToken ?? getApiAuthToken();
    if (!token) {
      setCurrentUser(null);
      setAuthLoading(false);
      return;
    }

    setAuthLoading(true);
    setAuthError(null);
    try {
      const data = await api.getMe(token);
      if (data.success && data.data) {
        setApiAuthToken(token);
        setAuthToken(token);
        setCurrentUser(data.data);

        // Direct user to default role page
        if (data.data.role === UserRole.ADMIN) {
          setActivePage((prev) => (prev && prev !== 'dashboard' ? prev : 'overview'));
        } else if (data.data.role === UserRole.TEACHER) {
          setActivePage((prev) => (prev && prev !== 'overview' ? prev : 'dashboard'));
        } else if (data.data.role === UserRole.STUDENT) {
          setActivePage('dashboard');
        }
      } else {
        setAuthError(data.message || 'Session verification failed.');
        setAuthToken(null);
        setApiAuthToken(null);
        setCurrentUser(null);
      }
    } catch (err: any) {
      setAuthError('Authentication verification error: ' + err.message);
      setAuthToken(null);
      setApiAuthToken(null);
      setCurrentUser(null);
    } finally {
      setAuthLoading(false);
    }
  };

  // Check initial token on mount
  useEffect(() => {
    const token = getApiAuthToken();
    if (token) {
      verifySession(token);
    } else {
      setAuthLoading(false);
    }
  }, []);

  // Set up Firebase Auth state listener to keep token fresh
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    (async () => {
      try {
        const { auth } = await import('./config/firebase.ts');
        const { onAuthStateChanged } = await import('firebase/auth');
        if (auth) {
          unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            if (fbUser) {
              const freshToken = await fbUser.getIdToken();
              setApiAuthToken(freshToken);
              setAuthToken(freshToken);
              verifySession(freshToken);
            }
          });
        }
      } catch (err) {
        console.warn('[Firebase Auth state listener]', err);
      }
    })();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleLogin = async (email: string, password: string) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const data = await api.signInWithEmailAndPassword(email, password);
      if (data.success && data.token) {
        setApiAuthToken(data.token);
        setAuthToken(data.token);
        setIsLoginModalOpen(false);
        await verifySession(data.token);
      } else {
        setAuthError(data.message || 'Sign-in failed. Check your email and password.');
      }
    } catch {
      setAuthError('Sign-in failed. Check your email and password, then try again.');
    } finally {
      setLoginPassword('');
      setAuthLoading(false);
    }
  };

  const handleRegister = async (payload: any) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const data = await api.register(payload);
      if (data.success && data.token) {
        setApiAuthToken(data.token);
        setAuthToken(data.token);
        setIsLoginModalOpen(false);
        await verifySession(data.token);
      } else {
        setAuthError(data.message || 'Registration failed.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Registration request error.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { auth } = await import('./config/firebase.ts');
      const { signOut } = await import('firebase/auth');
      if (auth) {
        await signOut(auth);
      }
    } catch (_) {}
    setAuthToken(null);
    setApiAuthToken(null);
    setCurrentUser(null);
    setActivePage('overview');
  };

  // Fetch Master Data on User Authentication
  useEffect(() => {
    if (currentUser) {
      fetchMasterData();
    }
  }, [currentUser, selectedSessionId]);

  const fetchMasterData = async () => {
    if (!currentUser) return;
    try {
      const [health, sess, crs, subs] = await Promise.all([
        api.getHealth(),
        api.getSessions(),
        api.getCourses(),
        api.getSubjects(),
      ]);

      if (health) setHealthStatus(health);
      if (sess && sess.length > 0) {
        setSessions(sess);
        if (!selectedSessionId || !sess.some((s) => s.id === selectedSessionId)) {
          setSelectedSessionId(sess[0].id);
        }
      }
      if (crs) setCourses(crs);
      if (subs) setSubjects(subs);

      const targetSessionId = selectedSessionId || (sess && sess.length > 0 ? sess[0].id : 'sess_2025_26');

      // Admin Data Loading
      if (currentUser.role === UserRole.ADMIN) {
        const [fac, stus, asg, cfg, aud] = await Promise.all([
          api.getTeachers(),
          api.getStudents(),
          api.getAssignments(undefined, targetSessionId),
          api.getConfigs(targetSessionId),
          api.getAuditLogs(),
        ]);
        if (fac) setFaculty(fac);
        if (stus) setStudents(stus);
        if (asg) setAssignments(asg);
        if (cfg) setConfigs(cfg);
        if (aud) setAuditLogs(aud);
      } else if (currentUser.role === UserRole.TEACHER) {
        // Teacher Data Loading
        const [fac, stus, asg, cfg] = await Promise.all([
          api.getTeachers(),
          api.getStudents(),
          api.getAssignments(currentUser.teacherProfile?.id, targetSessionId),
          api.getConfigs(targetSessionId),
        ]);
        if (fac) setFaculty(fac);
        if (stus) setStudents(stus);
        if (asg) setAssignments(asg);
        if (cfg) setConfigs(cfg);
      } else if (currentUser.role === UserRole.STUDENT) {
        // Student Portal Data Loading
        await loadStudentPortalData(targetSessionId);
      }
    } catch (err) {
      console.error('Error fetching master records:', err);
    }
  };

  const loadStudentPortalData = async (sessionIdToUse?: string) => {
    const sId = sessionIdToUse || selectedSessionId;
    if (!sId) return;
    try {
      const [marksRes, repRes, compRes] = await Promise.all([
        api.getStudentMarks(sId),
        api.getSessionalReport(sId, 1),
        api.getComparisonReport(sId),
      ]);

      if (marksRes?.success && marksRes.data) setStudentMarksData(marksRes.data);
      if (repRes?.success && repRes.data) setStudentReport(repRes.data);
      if (compRes?.success && compRes.data) setStudentComparison(compRes.data);
    } catch (err) {
      console.error('Error loading student portal data:', err);
    }
  };

  // Active Session Record
  const activeSession = useMemo(() => {
    return sessions.find((s) => s.id === selectedSessionId) || sessions[0];
  }, [sessions, selectedSessionId]);

  // Authenticated Faculty & Student Profiles
  const currentTeacherProfile: TeacherProfile = useMemo(() => {
    const found = faculty.find((f) => f.email === currentUser?.email);
    if (found) return found;
    return {
      id: 'teacher_mock',
      userId: currentUser?.id || 'usr_teacher',
      employeeCode: 'FAC-2025-01',
      name: currentUser?.displayName || 'Faculty Member',
      email: currentUser?.email || 'sharma@faculty.edu',
      department: 'Computer Applications',
      designation: 'Associate Professor',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
  }, [faculty, currentUser]);

  const currentStudentProfile: StudentProfile = useMemo(() => {
    const found = students.find((s) => s.email === currentUser?.email);
    if (found) return found;
    return {
      id: 'stud_bca01',
      userId: currentUser?.id || 'usr_student',
      enrollmentNo: 'EN2025BCA001',
      rollNo: 'BCA-01',
      name: currentUser?.displayName || 'Aarav Patel',
      email: currentUser?.email || 'aarav.patel@student.edu',
      courseId: 'bca',
      currentSemester: 1,
      admissionSessionId: 'sess_2025_26',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
  }, [students, currentUser]);

  // Teacher's specific assignments
  const currentTeacherAssignments = useMemo(() => {
    if (currentUser?.role !== UserRole.TEACHER) return assignments;
    return assignments.filter((a) => a.teacherId === currentTeacherProfile.id);
  }, [assignments, currentUser, currentTeacherProfile]);

  // Compute Breadcrumb Trail
  const breadcrumbs = useMemo(() => {
    const roleLabel =
      currentUser?.role === UserRole.ADMIN
        ? 'Institutional Admin'
        : currentUser?.role === UserRole.TEACHER
        ? 'Faculty Portal'
        : 'Student Portal';

    const pageLabels: Record<string, string> = {
      // Admin
      overview: 'Overview',
      analytics: 'Institutional Analytics',
      students: 'Students Directory',
      faculty: 'Faculty Directory',
      courses: 'Courses & Semesters',
      subjects: 'Subjects Master',
      assignments: 'Teacher Assignments',
      configs: 'Assessment Configuration',
      reports: 'Performance Reports',
      audit: 'Audit Logs',
      migration: 'Data Export & Migration',
      // Teacher
      dashboard: 'Dashboard',
      my_subjects: 'My Subjects',
      roster: 'Student Roster',
      marks_entry: 'Marks Entry Matrix',
      drafts: 'Draft Assessments',
      finalized: 'Final Submissions',
      corrections: 'Correction History',
      // Student
      results: 'Official Results',
      subject_performance: 'Subject Performance',
      progress_analytics: 'Progress Analytics',
      recommendations: 'Advisory Engine',
      final_reports: 'Finalized Reports',
    };

    return [roleLabel, pageLabels[activePage] || 'Dashboard'];
  }, [currentUser, activePage]);

  // Global Search selection handler
  const handleSelectSearchResult = (type: string, id: string) => {
    if (currentUser?.role === UserRole.ADMIN) {
      if (type === 'student') setActivePage('students');
      else if (type === 'faculty') setActivePage('faculty');
      else if (type === 'subject') setActivePage('subjects');
      else if (type === 'course') setActivePage('courses');
    } else if (currentUser?.role === UserRole.TEACHER) {
      if (type === 'student') setActivePage('roster');
      else if (type === 'subject') {
        setSelectedTeacherSubject(id);
        setActivePage('marks_entry');
      }
    } else if (currentUser?.role === UserRole.STUDENT) {
      if (type === 'subject') setActivePage('subject_performance');
    }
  };

  // Loading state during session verification
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex flex-col justify-center items-center p-4">
        <div className="flex items-center gap-3 text-slate-700 bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-xs">
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-700">Verifying ScholarSense session...</span>
        </div>
      </div>
    );
  }

  // If user is not authenticated, render the single institutional Login Page
  if (!currentUser) {
    return (
      <LoginPage
        onLogin={handleLogin}
        onRegister={handleRegister}
        isLoading={authLoading}
        errorMessage={authError}
        courses={courses}
      />
    );
  }

  return (
    <div className="min-h-screen flex bg-[#F7F9FC] text-slate-800 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        currentRole={currentUser?.role || UserRole.ADMIN}
        activePage={activePage}
        onSelectPage={setActivePage}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        userDisplayName={currentUser?.displayName}
        userEmail={currentUser?.email}
        onSwitchUser={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {/* Top Navigation Bar */}
        <TopBar
          breadcrumbs={breadcrumbs}
          sessions={sessions}
          selectedSessionId={selectedSessionId}
          onSelectSession={setSelectedSessionId}
          userRoleName={currentUser?.role || 'User'}
          userDisplayName={currentUser?.displayName}
          userEmail={currentUser?.email}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          notificationCount={auditLogs.length}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onSwitchUser={() => setIsLoginModalOpen(true)}
          onLogout={handleLogout}
          persistenceMode={healthStatus?.firebaseAdmin?.firestoreStatus || 'IN_MEMORY'}
        />

        {/* Dynamic Page Router */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {/* ================= ADMIN PAGES ================= */}
          {currentUser?.role === UserRole.ADMIN && (
            <>
              {activePage === 'overview' && (
                <AdminOverview
                  students={students}
                  faculty={faculty}
                  courses={courses}
                  subjects={subjects}
                  configs={configs}
                  auditLogs={auditLogs}
                  sessions={sessions}
                  onNavigate={setActivePage}
                />
              )}
              {activePage === 'analytics' && (
                <AdminAnalytics
                  students={students}
                  courses={courses}
                  subjects={subjects}
                  configs={configs}
                  auditLogs={auditLogs}
                />
              )}
              {activePage === 'students' && (
                <AdminStudents students={students} courses={courses} onRefresh={fetchMasterData} />
              )}
              {activePage === 'faculty' && (
                <AdminFaculty faculty={faculty} onRefresh={fetchMasterData} />
              )}
              {activePage === 'courses' && (
                <AdminCourses courses={courses} subjects={subjects} onRefresh={fetchMasterData} />
              )}
              {activePage === 'subjects' && (
                <AdminSubjects subjects={subjects} courses={courses} onRefresh={fetchMasterData} />
              )}
              {activePage === 'assignments' && (
                <AdminAssignments
                  assignments={assignments}
                  faculty={faculty}
                  subjects={subjects}
                  sessions={sessions}
                  onRefresh={fetchMasterData}
                />
              )}
              {activePage === 'configs' && (
                <AdminConfigs
                  configs={configs}
                  courses={courses}
                  sessions={sessions}
                  onRefresh={fetchMasterData}
                />
              )}
              {activePage === 'reports' && (
                <AdminReports
                  students={students}
                  sessions={sessions}
                  activeSessionId={selectedSessionId}
                />
              )}
              {activePage === 'audit' && (
                <AdminAuditLogs logs={auditLogs} />
              )}
              {activePage === 'migration' && (
                <AdminMigration />
              )}
            </>
          )}

          {/* ================= TEACHER PAGES ================= */}
          {currentUser?.role === UserRole.TEACHER && (
            <>
              {activePage === 'dashboard' && (
                <TeacherOverview
                  teacher={currentTeacherProfile}
                  assignments={currentTeacherAssignments}
                  subjects={subjects}
                  activeSession={activeSession}
                  onNavigate={setActivePage}
                  onSelectSubjectForGrading={(subId) => {
                    setSelectedTeacherSubject(subId);
                    setActivePage('marks_entry');
                  }}
                />
              )}
              {activePage === 'my_subjects' && (
                <TeacherMySubjects
                  assignments={currentTeacherAssignments}
                  subjects={subjects}
                  onOpenMarksEntry={(subId) => {
                    setSelectedTeacherSubject(subId);
                    setActivePage('marks_entry');
                  }}
                />
              )}
              {activePage === 'roster' && (
                <TeacherRoster
                  assignments={currentTeacherAssignments}
                  subjects={subjects}
                  students={students}
                />
              )}
              {activePage === 'marks_entry' && (
                <TeacherMarksEntry
                  assignments={currentTeacherAssignments}
                  subjects={subjects}
                  sessions={sessions}
                  activeSessionId={selectedSessionId}
                  selectedSubjectId={selectedTeacherSubject}
                  onSubjectChange={setSelectedTeacherSubject}
                />
              )}
              {activePage === 'drafts' && (
                <TeacherDrafts
                  assignments={currentTeacherAssignments}
                  subjects={subjects}
                  activeSessionId={selectedSessionId}
                  onOpenMarksEntry={(subId) => {
                    setSelectedTeacherSubject(subId);
                    setActivePage('marks_entry');
                  }}
                />
              )}
              {activePage === 'finalized' && (
                <TeacherFinalSubmissions
                  assignments={currentTeacherAssignments}
                  subjects={subjects}
                  activeSessionId={selectedSessionId}
                  onOpenMarksEntry={(subId) => {
                    setSelectedTeacherSubject(subId);
                    setActivePage('marks_entry');
                  }}
                />
              )}
              {activePage === 'corrections' && (
                <TeacherCorrectionHistory
                  assignments={currentTeacherAssignments}
                  subjects={subjects}
                  sessions={sessions}
                  activeSessionId={selectedSessionId}
                />
              )}
            </>
          )}

          {/* ================= STUDENT PAGES ================= */}
          {currentUser?.role === UserRole.STUDENT && (
            <>
              {activePage === 'dashboard' && (
                <StudentDashboard
                  studentProfile={currentStudentProfile}
                  marksData={studentMarksData}
                  sessionalReport={studentReport}
                  activeSession={activeSession}
                  onNavigate={setActivePage}
                />
              )}
              {activePage === 'results' && (
                <StudentResults
                  marksData={studentMarksData}
                  studentName={currentStudentProfile.name}
                  studentRoll={currentStudentProfile.rollNo}
                />
              )}
              {activePage === 'subject_performance' && (
                <StudentSubjectPerformance
                  marksData={studentMarksData}
                  comparisonData={studentComparison}
                />
              )}
              {activePage === 'progress_analytics' && (
                <StudentProgressAnalytics
                  marksData={studentMarksData}
                  sessionalReport={studentReport}
                />
              )}
              {activePage === 'recommendations' && (
                <StudentRecommendations
                  marksData={studentMarksData}
                  studentName={currentStudentProfile.name}
                  onNavigateToResults={() => setActivePage('results')}
                />
              )}
              {activePage === 'final_reports' && (
                <StudentFinalReports
                  report={studentReport}
                  studentProfile={currentStudentProfile}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Overlays: Account Switcher, Global Search, Notification Drawer */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleLogin}
        isLoading={authLoading}
        errorMessage={authError}
      />

      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        students={students}
        faculty={faculty}
        subjects={subjects}
        courses={courses}
        onSelectResult={handleSelectSearchResult}
      />

      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        auditLogs={auditLogs}
        onNavigateToAudit={() => {
          if (currentUser?.role === UserRole.ADMIN) {
            setActivePage('audit');
          } else if (currentUser?.role === UserRole.TEACHER) {
            setActivePage('corrections');
          }
        }}
      />
    </div>
  );
}
