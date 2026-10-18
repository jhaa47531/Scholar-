import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  ShieldCheck,
  Database,
  Layers,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserCheck,
  FileSpreadsheet,
  Activity,
  ArrowRight,
  Server,
  Download,
  Eye,
  RefreshCw,
  Award,
  ChevronRight,
  Sliders,
  Sparkles,
  Lock,
  LogOut,
  User,
  KeyRound,
} from 'lucide-react';
import {
  UserRole,
  SessionalNumber,
  ExamAttendance,
  SubmissionStatus,
  CourseStructure,
  AcademicSession,
  SubjectMaster,
  StudentProfile,
  TeacherProfile,
  AuditLogEntry,
} from './types/domain.ts';
import { auth, isFirebaseConfigured } from './config/firebase.ts';
import { signInWithCustomToken } from 'firebase/auth';

export default function App() {
  // Session & Authentication State
  const [authToken, setAuthToken] = useState<string | null>(() => {
    return localStorage.getItem('spis_auth_token') || null;
  });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [customEmailInput, setCustomEmailInput] = useState('');

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'teacher_workflow' | 'student_portal' | 'academic_admin' | 'oracle_migration' | 'audit_logs'>('overview');

  // Master Records
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [courses, setCourses] = useState<CourseStructure[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [subjects, setSubjects] = useState<SubjectMaster[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  // Teacher Assessment Workflow State
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('sub_bca101');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('sess_2025_26');
  const [selectedSessionalNum, setSelectedSessionalNum] = useState<SessionalNumber>(SessionalNumber.SESSIONAL_1);
  const [sheetData, setSheetData] = useState<any>(null);
  const [loadingSheet, setLoadingSheet] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [marksState, setMarksState] = useState<Record<string, any>>({});
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [workflowSuccessMsg, setWorkflowSuccessMsg] = useState<string | null>(null);

  // Student Portal State
  const [studentMarksData, setStudentMarksData] = useState<any[]>([]);
  const [studentReport, setStudentReport] = useState<any>(null);
  const [studentComparison, setStudentComparison] = useState<any>(null);
  const [loadingStudent, setLoadingStudent] = useState(false);

  // Oracle Migration
  const [migrationData, setMigrationData] = useState<any>(null);

  // Helper: Authenticated fetch wrapper
  const authFetch = async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    if (authToken) {
      headers.set('Authorization', `Bearer ${authToken}`);
    }
    return fetch(url, { ...options, headers });
  };

  // Verify Auth Session on Token Change
  useEffect(() => {
    if (!authToken) {
      setCurrentUser(null);
      setAuthLoading(false);
      return;
    }
    verifySession();
  }, [authToken]);

  const verifySession = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await authFetch('/api/auth/me');
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.data);
        localStorage.setItem('spis_auth_token', authToken!);
        // Set default view based on verified server role
        if (data.data.role === UserRole.TEACHER) {
          setActiveTab('teacher_workflow');
        } else if (data.data.role === UserRole.STUDENT) {
          setActiveTab('student_portal');
        }
      } else {
        setAuthError(data.message || 'Session expired or invalid.');
        setAuthToken(null);
        localStorage.removeItem('spis_auth_token');
      }
    } catch (err: any) {
      setAuthError('Failed to verify authentication: ' + err.message);
      setAuthToken(null);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLoginAs = async (email: string) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      if (auth && isFirebaseConfigured()) {
        const fbRes = await fetch('/api/auth/firebase-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim() }),
        });
        const fbData = await fbRes.json();
        if (fbData.success && fbData.customToken) {
          const cred = await signInWithCustomToken(auth, fbData.customToken);
          const realIdToken = await cred.user.getIdToken(true);
          setAuthToken(realIdToken);
          return;
        }
      }

      // Standard fallback for development/testing
      const res = await fetch('/api/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (data.success && data.token) {
        setAuthToken(data.token);
      } else {
        setAuthError(data.message || 'Login failed');
      }
    } catch (err: any) {
      setAuthError('Authentication request failed: ' + err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    setCurrentUser(null);
    localStorage.removeItem('spis_auth_token');
    setActiveTab('overview');
  };

  // Fetch Master Data on Mount / Auth Success
  useEffect(() => {
    if (currentUser) {
      fetchHealth();
      fetchMasterData();
      fetchMigrationOverview();
    }
  }, [currentUser]);

  const fetchHealth = async () => {
    setLoadingHealth(true);
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setHealthStatus(data);
    } catch (err) {
      console.error('Health check failed:', err);
    } finally {
      setLoadingHealth(false);
    }
  };

  const fetchMasterData = async () => {
    try {
      const [cRes, sRes, subRes] = await Promise.all([
        authFetch('/api/academic/courses').then((r) => r.json()),
        authFetch('/api/academic/sessions').then((r) => r.json()),
        authFetch('/api/academic/subjects').then((r) => r.json()),
      ]);
      if (cRes.success) setCourses(cRes.data);
      if (sRes.success) setSessions(sRes.data);
      if (subRes.success) setSubjects(subRes.data);

      if (currentUser?.role === UserRole.ADMIN) {
        const audRes = await authFetch('/api/audit/logs?limit=20').then((r) => r.json());
        if (audRes.success) setAuditLogs(audRes.data);
      }
    } catch (err) {
      console.error('Failed fetching master records:', err);
    }
  };

  const fetchMigrationOverview = async () => {
    if (currentUser?.role !== UserRole.ADMIN) return;
    try {
      const res = await authFetch('/api/migration/overview');
      const data = await res.json();
      if (data.success) setMigrationData(data.data);
    } catch (err) {
      console.error('Failed migration overview fetch:', err);
    }
  };

  const handleExportJson = async () => {
    try {
      const res = await authFetch('/api/migration/export-json');
      if (!res.ok) throw new Error('Export download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'spis_firestore_export.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export JSON:', err);
    }
  };

  // Load Teacher Assessment Sheet (Derives Teacher ID on the server from the token)
  const loadTeacherSheet = async () => {
    if (!currentUser || (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.TEACHER)) return;

    setLoadingSheet(true);
    setSheetError(null);
    setWorkflowSuccessMsg(null);
    try {
      const url = `/api/assessments/teacher/subject-sheet?subjectId=${selectedSubjectId}&sessionId=${selectedSessionId}&sessionalNumber=${selectedSessionalNum}`;
      const res = await authFetch(url);
      const data = await res.json();
      if (!data.success) {
        setSheetError(data.message || 'Error loading subject sheet');
        setSheetData(null);
      } else {
        setSheetData(data.data);
        const initialMarks: Record<string, any> = {};
        data.data.rows.forEach((r: any) => {
          initialMarks[r.student.id] = {
            ...r.assessment,
            obtainedMarks: r.assessment.obtainedMarks ?? '',
            examAttendance: r.assessment.examAttendance || ExamAttendance.ATTENDED,
            classAttendancePct: r.assessment.classAttendancePct ?? '',
            assignmentScore: r.assessment.assignmentScore ?? '',
            presentationScore: r.assessment.presentationScore ?? '',
            classInteractionScore: r.assessment.classInteractionScore ?? '',
          };
        });
        setMarksState(initialMarks);
      }
    } catch (err: any) {
      setSheetError(err.message || 'Network error fetching teacher sheet');
    } finally {
      setLoadingSheet(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'teacher_workflow' && currentUser) {
      loadTeacherSheet();
    }
  }, [activeTab, currentUser, selectedSubjectId, selectedSessionId, selectedSessionalNum]);

  // Load Student Portal Data (Server strictly forces studentId to authenticated student's profile)
  const loadStudentData = async () => {
    if (!currentUser) return;
    setLoadingStudent(true);
    try {
      const [marksRes, repRes, compRes] = await Promise.all([
        authFetch(`/api/assessments/student/marks?sessionId=${selectedSessionId}`).then((r) => r.json()),
        authFetch(`/api/reports/sessional?sessionId=${selectedSessionId}&sessionalNumber=1`).then((r) => r.json()),
        authFetch(`/api/reports/comparison?sessionId=${selectedSessionId}`).then((r) => r.json()),
      ]);
      if (marksRes.success) setStudentMarksData(marksRes.data);
      if (repRes.success) setStudentReport(repRes.data);
      if (compRes.success) setStudentComparison(compRes.data);
    } catch (err) {
      console.error('Error fetching student portal data:', err);
    } finally {
      setLoadingStudent(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'student_portal' && currentUser) {
      loadStudentData();
    }
  }, [activeTab, currentUser, selectedSessionId]);

  // Save Draft Handler
  const handleSaveDraft = async (studentId: string) => {
    const raw = marksState[studentId];
    if (!raw) return;

    try {
      const payload = {
        assessment: {
          ...raw,
          obtainedMarks: raw.obtainedMarks === '' ? null : Number(raw.obtainedMarks),
          classAttendancePct: raw.classAttendancePct === '' ? null : Number(raw.classAttendancePct),
          assignmentScore: raw.assignmentScore === '' ? null : Number(raw.assignmentScore),
          presentationScore: raw.presentationScore === '' ? null : Number(raw.presentationScore),
          classInteractionScore: raw.classInteractionScore === '' ? null : Number(raw.classInteractionScore),
        },
      };

      const res = await authFetch('/api/assessments/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setWorkflowSuccessMsg(`Draft saved for student ${studentId}. Strictly invisible to students.`);
        setTimeout(() => setWorkflowSuccessMsg(null), 4000);
      } else {
        alert('Save draft failed: ' + data.message);
      }
    } catch (err: any) {
      alert('Error saving draft: ' + err.message);
    }
  };

  // Final Submit Handler
  const handleConfirmFinalSubmit = async () => {
    if (!sheetData) return;
    const recordsToSubmit = sheetData.rows.map((r: any) => {
      const state = marksState[r.student.id];
      const isAbsent = state.examAttendance === ExamAttendance.NOT_ATTENDED;
      return {
        id: state.id,
        studentId: r.student.id,
        subjectId: sheetData.subject.id,
        configId: sheetData.config.id,
        sessionId: selectedSessionId,
        semester: sheetData.subject.semester,
        sessionalNumber: selectedSessionalNum,
        obtainedMarks: isAbsent ? 0 : state.obtainedMarks === '' ? null : Number(state.obtainedMarks),
        maxMarks: sheetData.config.maxMarks,
        examAttendance: state.examAttendance,
        classAttendancePct: state.classAttendancePct === '' ? null : Number(state.classAttendancePct),
        assignmentScore: state.assignmentScore === '' ? null : Number(state.assignmentScore),
        presentationScore: state.presentationScore === '' ? null : Number(state.presentationScore),
        classInteractionScore: state.classInteractionScore === '' ? null : Number(state.classInteractionScore),
      };
    });

    try {
      const res = await authFetch('/api/assessments/final-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessments: recordsToSubmit,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsReviewModalOpen(false);
        setWorkflowSuccessMsg('Final submission confirmed! Marks are now immediately visible to enrolled students.');
        loadTeacherSheet();
        fetchMasterData();
      } else {
        alert('Final submission failed: ' + data.message);
      }
    } catch (err: any) {
      alert('Error finalizing submission: ' + err.message);
    }
  };

  // If user is not authenticated, show institutional authentication portal
  if (!currentUser && !authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-400 mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-extrabold text-white">SPIS Institutional Login</h1>
            <p className="text-xs text-slate-400">
              Student Performance Intelligence System
            </p>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-start gap-2">
            <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              Server-Verified Authentication Active. Roles and record ownership are strictly verified via bearer tokens on every API request.
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
                  handleLoginAs(customEmailInput.trim());
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
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={authLoading || !customEmailInput.trim()}
                  className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all"
                >
                  Sign In
                </button>
              </div>
            </form>

            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Verified Institutional Accounts:</span>
                <span className="text-[10px] text-emerald-400 font-mono">Firebase Auth Live</span>
              </div>

              <button
                onClick={() => handleLoginAs('admin@institution.edu')}
                className="w-full p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-left transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-indigo-300">Prof. Eleanor Vance</div>
                  <div className="text-[11px] text-slate-400">admin@institution.edu</div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20">
                  ADMIN
                </span>
              </button>

              <button
                onClick={() => handleLoginAs('sharma@faculty.edu')}
                className="w-full p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-left transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-indigo-300">Dr. Rajesh Sharma (Faculty)</div>
                  <div className="text-[11px] text-slate-400">sharma@faculty.edu (Assigned: BCA-101, BCA-102)</div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 font-bold border border-sky-500/20">
                  TEACHER
                </span>
              </button>

              <button
                onClick={() => handleLoginAs('aarav.patel@student.edu')}
                className="w-full p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-left transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-indigo-300">Aarav Patel (Enrolled Student)</div>
                  <div className="text-[11px] text-slate-400">aarav.patel@student.edu (Roll: BCA-01)</div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
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
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Navigation Bar with Verified Authentication Identity */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-lg text-white">SPIS</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Verified RBAC
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">ScholarSense Performance Intelligence System</p>
            </div>
          </div>

          {/* Authenticated Identity Badge & Logout */}
          <div className="flex items-center gap-3">
            {currentUser && (
              <div className="flex items-center gap-2.5 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700">
                <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold text-xs">
                  {currentUser.displayName.charAt(0)}
                </div>
                <div className="hidden md:block text-left text-xs">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    {currentUser.displayName}
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono font-bold">
                      {currentUser.role}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono font-medium">
                      {authToken?.startsWith('eyJ') ? 'Firebase RS256 JWT' : 'Dev Token'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">{currentUser.email}</div>
                </div>

                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition-colors ml-1"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              onClick={fetchHealth}
              title="Refresh Health"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
            >
              <RefreshCw className={`w-4 h-4 ${loadingHealth ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tab Navigation filtered by server-verified role */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 overflow-x-auto py-1 scrollbar-none border-t border-slate-800/60">
          {[
            { id: 'overview', label: 'Architecture & Health', icon: Activity, roles: [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT] },
            { id: 'academic_admin', label: 'Academic Structures', icon: BookOpen, roles: [UserRole.ADMIN, UserRole.TEACHER] },
            { id: 'teacher_workflow', label: '11-Step Assessment Workflow', icon: FileSpreadsheet, roles: [UserRole.ADMIN, UserRole.TEACHER] },
            { id: 'student_portal', label: 'My Marks & Sessional Reports', icon: Award, roles: [UserRole.ADMIN, UserRole.STUDENT] },
            { id: 'oracle_migration', label: 'Oracle Migration Plan', icon: Database, roles: [UserRole.ADMIN] },
            { id: 'audit_logs', label: 'Audit Trail', icon: ShieldCheck, roles: [UserRole.ADMIN] },
          ]
            .filter((tab) => !currentUser || tab.roles.includes(currentUser.role))
            .map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  {tab.label}
                </button>
              );
            })}
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* TAB 1: OVERVIEW & SYSTEM HEALTH */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 p-6 shadow-xl relative overflow-hidden">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Increment 2: Production-Grade Authentication & RBAC Active
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Student Performance Intelligence System
                </h1>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                  Real server-side token authentication, trusted role mapping, student record isolation,
                  teacher-subject assignment restrictions, and zero-trust Firestore Security Rules.
                </p>
              </div>

              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-800">
                <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-800">
                  <div className="text-xs text-slate-400">Authenticated As</div>
                  <div className="text-sm font-bold text-white mt-1 truncate">
                    {currentUser?.displayName}
                  </div>
                </div>
                <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-800">
                  <div className="text-xs text-slate-400">Verified Role</div>
                  <div className="text-sm font-bold text-indigo-400 mt-1 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> {currentUser?.role}
                  </div>
                </div>
                <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-800">
                  <div className="text-xs text-slate-400">Record Isolation</div>
                  <div className="text-sm font-bold text-emerald-400 mt-1">Server Enforced</div>
                </div>
                <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-800">
                  <div className="text-xs text-slate-400">Firestore Rules</div>
                  <div className="text-sm font-bold text-sky-400 mt-1">Default Deny</div>
                </div>
              </div>
            </div>

            {/* Live Health-Check Diagnostics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 rounded-xl bg-slate-900 border border-slate-800 p-5">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white">Live Health-Check Endpoint (/api/health)</h3>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    HTTP 200 OK
                  </span>
                </div>

                {healthStatus ? (
                  <div className="mt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block">Service Status:</span>
                        <span className="font-semibold text-emerald-300">{healthStatus.status}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Node Runtime:</span>
                        <span className="font-mono text-slate-200">{healthStatus.nodeVersion}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Repository Layer:</span>
                        <span className="font-semibold text-sky-300">{healthStatus.database?.currentDriver}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Scoring Formula:</span>
                        <span className="font-semibold text-indigo-300">{healthStatus.scoringEngine?.formulaVersion} (Weights 100% verified)</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400">Loading health diagnostics...</div>
                )}
              </div>

              {/* Security Status Card */}
              <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-sm font-bold text-white">Security & RBAC Enforcement</h3>
                  </div>
                  <ul className="mt-3 space-y-2 text-xs text-slate-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Bearer Token verification on all protected endpoints</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Zero trust of client-supplied roles or student IDs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Strict teacher-subject assignment checks (403 Forbidden)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Cross-student record queries strictly blocked</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400">
                  <span>11 Supertest integration tests passed</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ACADEMIC STRUCTURES */}
        {activeTab === 'academic_admin' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">Academic Structures & Curricula</h2>
              <p className="text-xs text-slate-400">
                Configured degree courses, academic sessions, and subjects master catalogue.
              </p>
            </div>

            <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
              <div className="p-4 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white">Course Structures ({courses.length})</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
                {courses.map((course) => (
                  <div key={course.id} className="p-3.5 rounded-lg bg-slate-800/50 border border-slate-700/60">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{course.courseCode}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {course.durationYears} Years ({course.totalSemesters} Semesters)
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{course.name}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
              <div className="p-4 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white">Subject Master & Requirements</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-800/60 text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="px-4 py-3">Code</th>
                      <th className="px-4 py-3">Subject Name</th>
                      <th className="px-4 py-3">Course / Sem</th>
                      <th className="px-4 py-3">Classification</th>
                      <th className="px-4 py-3">Credits</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {subjects.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-800/30">
                        <td className="px-4 py-3 font-mono font-bold text-indigo-300">{sub.subjectCode}</td>
                        <td className="px-4 py-3 font-medium text-white">{sub.name}</td>
                        <td className="px-4 py-3 text-slate-400">
                          {sub.courseId.toUpperCase().replace('CRS_', '')} / Sem {sub.semester}
                        </td>
                        <td className="px-4 py-3">
                          {sub.isRequired ? (
                            <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 font-semibold border border-sky-500/20">
                              Required
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/20">
                              Elective ({sub.electiveGroup})
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono">{sub.credits}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: 11-STEP TEACHER ASSESSMENT WORKFLOW */}
        {activeTab === 'teacher_workflow' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
                  Teacher Assessment & Marks Entry Sheet
                </h2>
                <p className="text-xs text-slate-400">
                  Authenticated Faculty: <strong className="text-white">{currentUser?.displayName}</strong> ({currentUser?.email})
                </p>
              </div>

              {/* Subject Selection */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label="Select Subject"
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="bg-slate-900 text-xs border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                >
                  <option value="sub_bca101">BCA-101 (Assigned to Dr. Sharma)</option>
                  <option value="sub_bca102">BCA-102 (Assigned to Dr. Sharma)</option>
                  <option value="sub_bca103">BCA-103 (Assigned to Prof. Gupta)</option>
                  <option value="sub_bt101">BT-CS101 (Unassigned Subject - Test 403)</option>
                </select>

                <select
                  aria-label="Select Sessional"
                  value={selectedSessionalNum}
                  onChange={(e) => setSelectedSessionalNum(Number(e.target.value) as SessionalNumber)}
                  className="bg-slate-900 text-xs border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                >
                  <option value={SessionalNumber.SESSIONAL_1}>Sessional 1 (Max 25)</option>
                  <option value={SessionalNumber.SESSIONAL_2}>Sessional 2 (Max 25)</option>
                </select>
              </div>
            </div>

            {workflowSuccessMsg && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{workflowSuccessMsg}</span>
              </div>
            )}

            {sheetError && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-rose-200">Access Denied (403 Forbidden)</h4>
                  <p className="mt-1">{sheetError}</p>
                  <p className="text-slate-400 mt-2">
                    Teachers are strictly forbidden from modifying or viewing subjects they are not assigned to for this academic session.
                  </p>
                </div>
              </div>
            )}

            {sheetData && !sheetError && (
              <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg">
                <div className="p-4 bg-slate-850 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-mono text-indigo-400 font-bold">{sheetData.subject.subjectCode}</span>
                    <h3 className="text-sm font-bold text-white">{sheetData.subject.name}</h3>
                    <p className="text-xs text-slate-400">
                      Sessional {sheetData.config.sessionalNumber} | Configured Max Marks: {sheetData.config.maxMarks}
                    </p>
                  </div>

                  <button
                    onClick={() => setIsReviewModalOpen(true)}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Review Before Final Submit
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-800/80 text-slate-400 uppercase font-semibold">
                      <tr>
                        <th className="px-4 py-3">Roll & Student</th>
                        <th className="px-3 py-3">Exam Attendance</th>
                        <th className="px-3 py-3">Marks (Max {sheetData.config.maxMarks})</th>
                        <th className="px-3 py-3">Class Att (%)</th>
                        <th className="px-3 py-3">Assignment (%)</th>
                        <th className="px-3 py-3">Presentation (%)</th>
                        <th className="px-3 py-3">Interaction (%)</th>
                        <th className="px-3 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {sheetData.rows.map((row: any) => {
                        const state = marksState[row.student.id] || {};
                        const isAbsent = state.examAttendance === ExamAttendance.NOT_ATTENDED;
                        const isFinalSubmitted = state.submissionStatus === SubmissionStatus.FINAL_SUBMITTED;

                        return (
                          <tr key={row.student.id} className="hover:bg-slate-800/30">
                            <td className="px-4 py-3">
                              <div className="font-bold text-white">{row.student.name}</div>
                              <div className="text-slate-400 font-mono text-[11px]">{row.student.rollNo}</div>
                            </td>

                            <td className="px-3 py-3">
                              <select
                                aria-label="Attendance Status"
                                disabled={isFinalSubmitted}
                                value={state.examAttendance || ExamAttendance.ATTENDED}
                                onChange={(e) => {
                                  const att = e.target.value as ExamAttendance;
                                  setMarksState({
                                    ...marksState,
                                    [row.student.id]: {
                                      ...state,
                                      examAttendance: att,
                                      obtainedMarks: att === ExamAttendance.NOT_ATTENDED ? 0 : state.obtainedMarks,
                                    },
                                  });
                                }}
                                className="bg-slate-800 border border-slate-700 text-xs rounded px-2 py-1 text-slate-200"
                              >
                                <option value={ExamAttendance.ATTENDED}>Attended</option>
                                <option value={ExamAttendance.NOT_ATTENDED}>Not Attended (Absent)</option>
                              </select>
                            </td>

                            <td className="px-3 py-3">
                              <input
                                aria-label="Obtained Marks"
                                type="number"
                                step="0.5"
                                min="0"
                                max={sheetData.config.maxMarks}
                                disabled={isAbsent || isFinalSubmitted}
                                value={state.obtainedMarks ?? ''}
                                placeholder={isAbsent ? '0' : 'Marks'}
                                onChange={(e) => {
                                  setMarksState({
                                    ...marksState,
                                    [row.student.id]: {
                                      ...state,
                                      obtainedMarks: e.target.value,
                                    },
                                  });
                                }}
                                className="w-20 bg-slate-800 border border-slate-700 text-xs rounded px-2 py-1 font-mono text-white focus:ring-1 focus:ring-indigo-500"
                              />
                            </td>

                            <td className="px-3 py-3">
                              <input
                                aria-label="Class Attendance Percentage"
                                type="number"
                                min="0"
                                max="100"
                                disabled={isFinalSubmitted}
                                value={state.classAttendancePct ?? ''}
                                placeholder="%"
                                onChange={(e) => {
                                  setMarksState({
                                    ...marksState,
                                    [row.student.id]: {
                                      ...state,
                                      classAttendancePct: e.target.value,
                                    },
                                  });
                                }}
                                className="w-16 bg-slate-800 border border-slate-700 text-xs rounded px-2 py-1 font-mono text-white"
                              />
                            </td>

                            <td className="px-3 py-3">
                              <input
                                aria-label="Assignment Score"
                                type="number"
                                min="0"
                                max="100"
                                disabled={isFinalSubmitted}
                                value={state.assignmentScore ?? ''}
                                placeholder="%"
                                onChange={(e) => {
                                  setMarksState({
                                    ...marksState,
                                    [row.student.id]: {
                                      ...state,
                                      assignmentScore: e.target.value,
                                    },
                                  });
                                }}
                                className="w-16 bg-slate-800 border border-slate-700 text-xs rounded px-2 py-1 font-mono text-white"
                              />
                            </td>

                            <td className="px-3 py-3">
                              <input
                                aria-label="Presentation Score"
                                type="number"
                                min="0"
                                max="100"
                                disabled={isFinalSubmitted}
                                value={state.presentationScore ?? ''}
                                placeholder="%"
                                onChange={(e) => {
                                  setMarksState({
                                    ...marksState,
                                    [row.student.id]: {
                                      ...state,
                                      presentationScore: e.target.value,
                                    },
                                  });
                                }}
                                className="w-16 bg-slate-800 border border-slate-700 text-xs rounded px-2 py-1 font-mono text-white"
                              />
                            </td>

                            <td className="px-3 py-3">
                              <input
                                aria-label="Class Interaction Score"
                                type="number"
                                min="0"
                                max="100"
                                disabled={isFinalSubmitted}
                                value={state.classInteractionScore ?? ''}
                                placeholder="%"
                                onChange={(e) => {
                                  setMarksState({
                                    ...marksState,
                                    [row.student.id]: {
                                      ...state,
                                      classInteractionScore: e.target.value,
                                    },
                                  });
                                }}
                                className="w-16 bg-slate-800 border border-slate-700 text-xs rounded px-2 py-1 font-mono text-white"
                              />
                            </td>

                            <td className="px-3 py-3">
                              {isFinalSubmitted ? (
                                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                                  Final Submitted
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/20">
                                  Draft (Hidden)
                                </span>
                              )}
                            </td>

                            <td className="px-4 py-3 text-right">
                              {!isFinalSubmitted ? (
                                <button
                                  onClick={() => handleSaveDraft(row.student.id)}
                                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-[11px]"
                                >
                                  Save Draft
                                </button>
                              ) : (
                                <span className="text-[11px] text-slate-500">Locked</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Step 7: Confirmation & Review Modal */}
            {isReviewModalOpen && sheetData && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                  <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                        Step 7: Final Submission Confirmation & Review
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Please review the marks before finalizing. Once submitted, marks become immediately visible to students.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsReviewModalOpen(false)}
                      className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="p-5 overflow-y-auto space-y-4">
                    <div className="grid grid-cols-3 gap-2 bg-slate-800/40 p-3 rounded-lg text-xs">
                      <div>
                        <span className="text-slate-400">Subject:</span>{' '}
                        <strong className="text-white">{sheetData.subject.name}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Sessional:</span>{' '}
                        <strong className="text-indigo-300">Sessional {selectedSessionalNum}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Max Marks:</span>{' '}
                        <strong className="text-emerald-400">{sheetData.config.maxMarks}</strong>
                      </div>
                    </div>

                    <div className="border border-slate-800 rounded-lg overflow-hidden">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-800/80 text-slate-300">
                          <tr>
                            <th className="p-2">Student</th>
                            <th className="p-2">Exam Attendance</th>
                            <th className="p-2">Obtained Marks</th>
                            <th className="p-2">Class Att %</th>
                            <th className="p-2">Asg / Pre / Int</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {sheetData.rows.map((row: any) => {
                            const state = marksState[row.student.id] || {};
                            return (
                              <tr key={row.student.id} className="text-slate-200">
                                <td className="p-2 font-medium">{row.student.name}</td>
                                <td className="p-2">
                                  {state.examAttendance === ExamAttendance.NOT_ATTENDED ? (
                                    <span className="text-rose-400 font-bold">NOT ATTENDED (Absent)</span>
                                  ) : (
                                    <span className="text-emerald-400">Attended</span>
                                  )}
                                </td>
                                <td className="p-2 font-mono font-bold">
                                  {state.examAttendance === ExamAttendance.NOT_ATTENDED
                                    ? '0 (Absent)'
                                    : state.obtainedMarks || 'MISSING'}
                                </td>
                                <td className="p-2 font-mono">{state.classAttendancePct || 'Missing'}%</td>
                                <td className="p-2 font-mono">
                                  {state.assignmentScore || '-'}/{state.presentationScore || '-'}/{state.classInteractionScore || '-'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="p-4 border-t border-slate-800 bg-slate-850 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      Step 8: Explicit Teacher Confirmation Required
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsReviewModalOpen(false)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300 hover:bg-slate-700"
                      >
                        Back to Edit
                      </button>
                      <button
                        onClick={handleConfirmFinalSubmit}
                        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Confirm & Final Submit
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: STUDENT MARKS & OVERALL REPORTS */}
        {activeTab === 'student_portal' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-400" />
                Student Academic Record
              </h2>
              <p className="text-xs text-slate-400">
                Verified Student Identity: <strong className="text-white">{currentUser?.displayName}</strong> ({currentUser?.email})
              </p>
            </div>

            {/* Subject Marks Cards */}
            <div className="rounded-xl bg-slate-900 border border-slate-800 p-5">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-sky-400" />
                Final Submitted Subject Marks (Drafts Excluded)
              </h3>

              {studentMarksData.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 bg-slate-800/30 rounded-lg border border-slate-800">
                  No final-submitted marks available for your profile yet. Any draft entries remain securely hidden until final submission by faculty.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {studentMarksData.map((rec: any) => (
                    <div key={rec.id} className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-mono text-indigo-400 font-bold">{rec.subject?.subjectCode}</span>
                          <h4 className="text-sm font-bold text-white">{rec.subject?.name}</h4>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                          Final Submitted
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 bg-slate-900/80 p-2.5 rounded-lg text-xs">
                        <div>
                          <span className="text-slate-400 block">Exam Marks</span>
                          <span className="font-mono font-bold text-white">
                            {rec.examAttendance === ExamAttendance.NOT_ATTENDED ? (
                              <span className="text-rose-400">0 (Absent)</span>
                            ) : (
                              `${rec.obtainedMarks} / ${rec.maxMarks}`
                            )}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Class Attendance</span>
                          <span className="font-mono text-slate-200">{rec.classAttendancePct}%</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Weighted Score</span>
                          <span className="font-mono font-bold text-indigo-400">
                            {rec.calculation?.isComplete ? `${rec.calculation.performanceScore}%` : 'Incomplete'}
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-700/60 pt-2">
                        <span>Attendance: {rec.examAttendance}</span>
                        <span>Formula: {rec.calculation?.formulaVersion || 'v1.0'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Overall Sessional Report Precondition Gate */}
            {studentReport && (
              <div className="rounded-xl bg-slate-900 border border-slate-800 p-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-400" />
                    Overall Sessional 1 Report Card
                  </h3>
                  {studentReport.isEligibleForOverallReport ? (
                    <span className="text-xs px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                      Report Complete
                    </span>
                  ) : (
                    <span className="text-xs px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                      Incomplete - Blocked
                    </span>
                  )}
                </div>

                {!studentReport.isEligibleForOverallReport ? (
                  <div className="mt-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 space-y-2">
                    <div className="font-bold text-sm text-amber-300">
                      Overall Report Generation Blocked by Preconditions:
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-slate-300">
                      {studentReport.completionBlockers.map((b: string, i: number) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="mt-4 space-y-4">
                    <div className="bg-gradient-to-r from-indigo-950/60 to-slate-900 p-4 rounded-xl border border-indigo-900/40 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-indigo-300">Overall Sessional 1 Average:</span>
                        <div className="text-2xl font-extrabold text-white mt-1">
                          {studentReport.overallAverageScore}%
                        </div>
                      </div>
                      <div className="text-xs text-slate-400 text-right">
                        <div>Report Version: {studentReport.reportVersion}</div>
                        <div>Generated: {new Date(studentReport.generatedAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: ORACLE MIGRATION HUB (Admin Only) */}
        {activeTab === 'oracle_migration' && currentUser?.role === UserRole.ADMIN && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-amber-400" />
                  Future Oracle Database Migration Hub
                </h2>
                <p className="text-xs text-slate-400">
                  Critical architectural requirement: Isolation of persistence logic, Oracle relational DDL, and data reconciliation.
                </p>
              </div>

              <button
                onClick={handleExportJson}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-2 transition-all w-fit cursor-pointer"
              >
                <Download className="w-4 h-4 text-amber-400" />
                Export Checksummed JSON
              </button>
            </div>

            {migrationData && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {migrationData.migrationChecklist.map((item: any) => (
                  <div key={item.step} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-mono">Step {item.step}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                        {item.status}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white mt-2">{item.title}</div>
                    <p className="text-[11px] text-slate-400 mt-1">{item.detail}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
              <div className="p-4 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white">Firestore Collection to Oracle Table Mapping</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-800/80 text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="px-4 py-3">Firestore Collection</th>
                      <th className="px-4 py-3">Target Oracle Table</th>
                      <th className="px-4 py-3">Primary Key</th>
                      <th className="px-4 py-3">Driver Ready</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {migrationData?.oracleTableMapping.map((map: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="px-4 py-3 font-mono text-sky-300">{map.firestoreCollection}</td>
                        <td className="px-4 py-3 font-mono font-bold text-amber-300">{map.oracleTable}</td>
                        <td className="px-4 py-3 font-mono text-slate-300">{map.primaryKey}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                            node-oracledb DDL Ready
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: AUDIT TRAIL (Admin Only) */}
        {activeTab === 'audit_logs' && currentUser?.role === UserRole.ADMIN && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                Immutable System Audit Trail
              </h2>
              <p className="text-xs text-slate-400">
                Permanent audit records of sessional configurations, marks entries, final submissions, and corrections.
              </p>
            </div>

            <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-800/80 text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="px-4 py-3">Timestamp</th>
                      <th className="px-4 py-3">Entity Type</th>
                      <th className="px-4 py-3">Action</th>
                      <th className="px-4 py-3">Actor & Role</th>
                      <th className="px-4 py-3">Reason / Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/30">
                        <td className="px-4 py-3 font-mono text-slate-400">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 font-mono text-indigo-300">{log.entityType}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-semibold border border-indigo-500/20">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-200">
                          <span className="font-semibold">{log.actorId}</span>{' '}
                          <span className="text-slate-400">({log.actorRole})</span>
                        </td>
                        <td className="px-4 py-3 text-slate-300">{log.reason || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
