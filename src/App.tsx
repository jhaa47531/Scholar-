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
  const [customEmailInput, setCustomEmailInput] = useState('');

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

  const handleLogin = async (email: string) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const data = await api.loginAs(email);
      if (data.success && data.token) {
        setApiAuthToken(data.token);
        setAuthToken(data.token);
        setIsLoginModalOpen(false);
        await verifySession(data.token);
      } else {
        setAuthError(data.message || 'Authentication rejected');
      }
    } catch (err: any) {
      setAuthError('Login request failed: ' + err.message);
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
    try {
      const [health, sess, crs, subs, aud] = await Promise.all([
        api.getHealth(),
        api.getSessions(),
        api.getCourses(),
        api.getSubjects(),
        api.getAuditLogs(),
      ]);

      setHealthStatus(health);
      if (sess && sess.length > 0) {
        setSessions(sess);
        if (!selectedSessionId) setSelectedSessionId(sess[0].id);
      }
      setCourses(crs);
      setSubjects(subs);
      setAuditLogs(aud);

      // Role-specific data loading
      if (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.TEACHER) {
        const [fac, stus, asg, cfg] = await Promise.all([
          api.getTeachers(),
          api.getStudents(),
          api.getAssignments(undefined, selectedSessionId),
          api.getConfigs(selectedSessionId),
        ]);
        setFaculty(fac);
        setStudents(stus);
        setAssignments(asg);
        setConfigs(cfg);
      }

      if (currentUser.role === UserRole.STUDENT) {
        loadStudentPortalData();
      }
    } catch (err) {
      console.error('Error fetching master records:', err);
    }
  };

  const loadStudentPortalData = async () => {
    try {
      const [marksRes, repRes, compRes] = await Promise.all([
        api.getStudentMarks(selectedSessionId),
        api.getSessionalReport(selectedSessionId, 1),
        api.getComparisonReport(selectedSessionId),
      ]);

      if (marksRes.success) setStudentMarksData(marksRes.data);
      if (repRes.success) setStudentReport(repRes.data);
      if (compRes.success) setStudentComparison(compRes.data);
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

  // If user is not authenticated, render the premium Institutional Login Portal
  if (!currentUser && !authLoading) {
    return (
      <div className="min-h-screen bg-[#060d1a] flex flex-col justify-center items-center p-4 selection:bg-amber-500/30 selection:text-amber-200">
        <div className="max-w-md w-full surface-navy rounded-2xl p-6 sm:p-8 border border-[#192b45] shadow-2xl space-y-6 card-3d">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 mx-auto flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-bold">
              <GraduationCap className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              ScholarSense Academic Portal
            </h1>
            <p className="text-xs text-slate-400">
              Student Performance Intelligence System (SPIS)
            </p>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              Server-Verified Authentication Active. Separate portals for Institutional Admin, Faculty, and Students.
            </span>
          </div>

          {authError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
              {authError}
            </div>
          )}

          <div className="space-y-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (customEmailInput.trim()) {
                  handleLogin(customEmailInput.trim());
                }
              }}
              className="space-y-2 pb-4 border-b border-slate-800"
            >
              <label className="text-xs font-semibold text-slate-300 block">
                Sign in with Institutional Email:
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={customEmailInput}
                  onChange={(e) => setCustomEmailInput(e.target.value)}
                  placeholder="e.g. admin@institution.edu"
                  className="flex-1 bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  disabled={authLoading || !customEmailInput.trim()}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  Sign In
                </button>
              </div>
            </form>

            <div className="space-y-2.5">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono flex items-center justify-between">
                <span>Quick Persona Access:</span>
                <span className="text-emerald-400 text-[10px]">Active RBAC</span>
              </div>

              <button
                onClick={() => handleLogin('admin@institution.edu')}
                className="w-full p-3 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 text-left transition-all flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                    Prof. Eleanor Vance (Dean)
                  </div>
                  <div className="text-[11px] text-slate-400">admin@institution.edu</div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono font-bold border border-amber-500/20">
                  ADMIN
                </span>
              </button>

              <button
                onClick={() => handleLogin('sharma@faculty.edu')}
                className="w-full p-3 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 text-left transition-all flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                    Dr. Rajesh Sharma (Faculty)
                  </div>
                  <div className="text-[11px] text-slate-400">sharma@faculty.edu (Assigned: BCA-101)</div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 font-mono font-bold border border-sky-500/20">
                  TEACHER
                </span>
              </button>

              <button
                onClick={() => handleLogin('aarav.patel@student.edu')}
                className="w-full p-3 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 text-left transition-all flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                    Aarav Patel (Enrolled Student)
                  </div>
                  <div className="text-[11px] text-slate-400">aarav.patel@student.edu (Roll: BCA-01)</div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-mono font-bold border border-emerald-500/20">
                  STUDENT
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#060d1a] text-slate-100 overflow-hidden font-sans">
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
                <AdminStudents students={students} courses={courses} />
              )}
              {activePage === 'faculty' && (
                <AdminFaculty faculty={faculty} />
              )}
              {activePage === 'courses' && (
                <AdminCourses courses={courses} subjects={subjects} />
              )}
              {activePage === 'subjects' && (
                <AdminSubjects subjects={subjects} courses={courses} />
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
                  sessions={sessions}
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
                  sessions={sessions}
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
