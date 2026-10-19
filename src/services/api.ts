import {
  AcademicSession,
  AssessmentRecord,
  AuditLogEntry,
  CourseStructure,
  SessionalConfig,
  SessionalNumber,
  SessionalOverallReport,
  StudentProfile,
  SubjectMaster,
  TeacherAssignment,
  TeacherProfile,
  UserAccount,
  UserRole,
} from '../types/domain.ts';

let currentAuthToken: string | null = typeof window !== 'undefined'
  ? localStorage.getItem('spis_auth_token')
  : null;

export function setApiAuthToken(token: string | null) {
  currentAuthToken = token;
  try {
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('spis_auth_token', token);
      } else {
        localStorage.removeItem('spis_auth_token');
      }
    }
  } catch (err) {
    console.warn('[API] Could not update localStorage token:', err);
  }
}

export function getApiAuthToken(): string | null {
  if (currentAuthToken) return currentAuthToken;
  try {
    if (typeof window !== 'undefined') {
      currentAuthToken = localStorage.getItem('spis_auth_token');
    }
  } catch {
    currentAuthToken = null;
  }
  return currentAuthToken;
}

export async function safeParseJson<T>(res: Response, fallback: T): Promise<T> {
  try {
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await res.text().catch(() => '');
      console.warn(
        `[API] Non-JSON response received from ${res.url || 'endpoint'} (status ${res.status}, type "${contentType}"):`,
        text.slice(0, 120)
      );
      return fallback;
    }
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn(`[API] JSON parse error:`, err);
    return fallback;
  }
}

function getSignInErrorMessage(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string'
      ? error.code
      : '';

  switch (code) {
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'The email or password is incorrect.';
    case 'auth/user-disabled':
      return 'This account is disabled. Contact your administrator.';
    case 'auth/too-many-requests':
      return 'Too many sign-in attempts. Try again later.';
    case 'auth/network-request-failed':
      return 'Unable to reach the authentication service. Check your connection.';
    case 'auth/operation-not-allowed':
      return 'Email and password sign-in is not enabled. Contact your administrator.';
    default:
      return 'Sign-in failed. Check your email and password, then try again.';
  }
}

export async function authFetch(
  url: string,
  options: RequestInit = {},
  explicitToken?: string | null
): Promise<Response> {
  let token = explicitToken || getApiAuthToken();

  // If token is missing, attempt to acquire a fresh ID token from active Firebase Auth client
  if (!token) {
    try {
      const { auth } = await import('../config/firebase.ts');
      if (auth && auth.currentUser) {
        token = await auth.currentUser.getIdToken(false);
        if (token) {
          setApiAuthToken(token);
        }
      }
    } catch (_) {}
  }

  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    return await fetch(url, { ...options, headers });
  } catch (fetchErr: any) {
    console.warn(`[API] Network fetch error for ${url}:`, fetchErr.message);
    return new Response(
      JSON.stringify({
        success: false,
        code: 'NETWORK_ERROR',
        message: fetchErr.message || 'Network request failed',
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export const api = {
  // Health
  getHealth: async (): Promise<any> => {
    try {
      const res = await fetch('/api/health');
      return await safeParseJson(res, { status: 'DEGRADED' });
    } catch (err) {
      console.warn('[API] getHealth fetch failed:', err);
      return { status: 'OFFLINE' };
    }
  },

  // Auth
  getMe: async (explicitToken?: string | null): Promise<{ success: boolean; data?: any; message?: string }> => {
    try {
      const res = await authFetch('/api/auth/me', {}, explicitToken);
      return await safeParseJson<{ success: boolean; data?: any; message?: string }>(res, { success: false, message: 'Invalid server response' });
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },

  signInWithEmailAndPassword: async (
    email: string,
    password: string
  ): Promise<{ success: boolean; token?: string; message?: string }> => {
    try {
      const { auth } = await import('../config/firebase.ts');
      if (!auth) {
        return {
          success: false,
          message: 'Firebase Authentication is not configured. Contact your administrator.',
        };
      }

      const { signInWithEmailAndPassword: signIn } = await import('firebase/auth');
      const credential = await signIn(auth, email.trim(), password);
      const token = await credential.user.getIdToken();
      setApiAuthToken(token);
      return { success: true, token };
    } catch (error) {
      return { success: false, message: getSignInErrorMessage(error) };
    }
  },

  // Academic Master
  getSessions: async (): Promise<AcademicSession[]> => {
    try {
      const res = await authFetch('/api/academic/sessions');
      const data = await safeParseJson<{ success: boolean; data?: AcademicSession[] }>(res, { success: false, data: [] });
      return data.success && Array.isArray(data.data) ? data.data : [];
    } catch (err) {
      console.warn('[API] getSessions error:', err);
      return [];
    }
  },

  getCourses: async (): Promise<CourseStructure[]> => {
    try {
      const res = await authFetch('/api/academic/courses');
      const data = await safeParseJson<{ success: boolean; data?: CourseStructure[] }>(res, { success: false, data: [] });
      return data.success && Array.isArray(data.data) ? data.data : [];
    } catch (err) {
      console.warn('[API] getCourses error:', err);
      return [];
    }
  },

  getSubjects: async (courseId?: string, semester?: number): Promise<SubjectMaster[]> => {
    try {
      const params = new URLSearchParams();
      if (courseId) params.set('courseId', courseId);
      if (semester !== undefined) params.set('semester', semester.toString());
      const res = await authFetch(`/api/academic/subjects?${params.toString()}`);
      const data = await safeParseJson<{ success: boolean; data?: SubjectMaster[] }>(res, { success: false, data: [] });
      return data.success && Array.isArray(data.data) ? data.data : [];
    } catch (err) {
      console.warn('[API] getSubjects error:', err);
      return [];
    }
  },

  getStudents: async (courseId?: string, semester?: number): Promise<StudentProfile[]> => {
    try {
      const params = new URLSearchParams();
      if (courseId) params.set('courseId', courseId);
      if (semester !== undefined) params.set('semester', semester.toString());
      const res = await authFetch(`/api/academic/students?${params.toString()}`);
      const data = await safeParseJson<{ success: boolean; data?: StudentProfile[] }>(res, { success: false, data: [] });
      return data.success && Array.isArray(data.data) ? data.data : [];
    } catch (err) {
      console.warn('[API] getStudents error:', err);
      return [];
    }
  },

  getTeachers: async (): Promise<TeacherProfile[]> => {
    try {
      const res = await authFetch('/api/academic/teachers');
      const data = await safeParseJson<{ success: boolean; data?: TeacherProfile[] }>(res, { success: false, data: [] });
      return data.success && Array.isArray(data.data) ? data.data : [];
    } catch (err) {
      console.warn('[API] getTeachers error:', err);
      return [];
    }
  },

  getAssignments: async (teacherId?: string, sessionId?: string): Promise<TeacherAssignment[]> => {
    try {
      const params = new URLSearchParams();
      if (teacherId) params.set('teacherId', teacherId);
      if (sessionId) params.set('sessionId', sessionId);
      const res = await authFetch(`/api/academic/assignments?${params.toString()}`);
      const data = await safeParseJson<{ success: boolean; data?: TeacherAssignment[] }>(res, { success: false, data: [] });
      return data.success && Array.isArray(data.data) ? data.data : [];
    } catch (err) {
      console.warn('[API] getAssignments error:', err);
      return [];
    }
  },

  createAssignment: async (payload: { teacherId: string; subjectId: string; sessionId: string; semester: number }): Promise<{ success: boolean; data?: any; message?: string }> => {
    try {
      const res = await authFetch('/api/academic/assignments', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return await safeParseJson<{ success: boolean; data?: any; message?: string }>(res, { success: false, message: 'Server did not return a valid response' });
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },

  // Assessments
  getConfigs: async (sessionId?: string, courseId?: string): Promise<SessionalConfig[]> => {
    try {
      const params = new URLSearchParams();
      if (sessionId) params.set('sessionId', sessionId);
      if (courseId) params.set('courseId', courseId);
      const res = await authFetch(`/api/assessments/configs?${params.toString()}`);
      const data = await safeParseJson<{ success: boolean; data?: SessionalConfig[] }>(res, { success: false, data: [] });
      return data.success && Array.isArray(data.data) ? data.data : [];
    } catch (err) {
      console.warn('[API] getConfigs error:', err);
      return [];
    }
  },

  saveConfig: async (payload: Partial<SessionalConfig>): Promise<{ success: boolean; data?: any; message?: string }> => {
    try {
      const res = await authFetch('/api/assessments/configs', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return await safeParseJson<{ success: boolean; data?: any; message?: string }>(res, { success: false, message: 'Failed to save configuration' });
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },

  getTeacherSheet: async (subjectId: string, sessionId: string, sessionalNumber: number): Promise<{ success: boolean; data?: any; message?: string }> => {
    try {
      const url = `/api/assessments/teacher/subject-sheet?subjectId=${subjectId}&sessionId=${sessionId}&sessionalNumber=${sessionalNumber}`;
      const res = await authFetch(url);
      return await safeParseJson<{ success: boolean; data?: any; message?: string }>(res, { success: false, message: 'Failed to load teacher sheet' });
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },

  saveDraft: async (assessment: AssessmentRecord): Promise<{ success: boolean; data?: any; message?: string }> => {
    try {
      const res = await authFetch('/api/assessments/draft', {
        method: 'POST',
        body: JSON.stringify({ assessment }),
      });
      return await safeParseJson<{ success: boolean; data?: any; message?: string }>(res, { success: false, message: 'Failed to save draft' });
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },

  finalSubmitBatch: async (assessments: AssessmentRecord[]): Promise<{ success: boolean; data?: any; message?: string }> => {
    try {
      const res = await authFetch('/api/assessments/final-submit', {
        method: 'POST',
        body: JSON.stringify({ assessments }),
      });
      return await safeParseJson<{ success: boolean; data?: any; message?: string }>(res, { success: false, message: 'Failed to finalize submission' });
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },

  correctAssessment: async (assessmentId: string, updates: Partial<AssessmentRecord>, correctionReason: string): Promise<{ success: boolean; data?: any; message?: string }> => {
    try {
      const res = await authFetch('/api/assessments/correction', {
        method: 'POST',
        body: JSON.stringify({ assessmentId, updates, correctionReason }),
      });
      return await safeParseJson<{ success: boolean; data?: any; message?: string }>(res, { success: false, message: 'Failed to submit correction' });
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },

  getStudentMarks: async (sessionId: string, sessionalNumber?: number, studentId?: string): Promise<{ success: boolean; data?: any[]; message?: string }> => {
    try {
      const params = new URLSearchParams({ sessionId });
      if (sessionalNumber !== undefined) params.set('sessionalNumber', sessionalNumber.toString());
      if (studentId) params.set('studentId', studentId);
      const res = await authFetch(`/api/assessments/student/marks?${params.toString()}`);
      return await safeParseJson<{ success: boolean; data?: any[]; message?: string }>(res, { success: false, data: [] });
    } catch (err: any) {
      return { success: false, data: [], message: err.message };
    }
  },

  // Reports
  getSessionalReport: async (
    sessionId: string,
    sessionalNumber: number,
    studentId?: string
  ): Promise<{ success: boolean; data?: SessionalOverallReport; message?: string }> => {
    try {
      const params = new URLSearchParams({
        sessionId,
        sessionalNumber: sessionalNumber.toString(),
      });
      if (studentId) params.set('studentId', studentId);
      const res = await authFetch(`/api/reports/sessional?${params.toString()}`);
      return await safeParseJson<{ success: boolean; data?: SessionalOverallReport; message?: string }>(res, { success: false, message: 'Failed to load report' });
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },

  getComparisonReport: async (sessionId: string, studentId?: string): Promise<{ success: boolean; data?: any; message?: string }> => {
    try {
      const params = new URLSearchParams({ sessionId });
      if (studentId) params.set('studentId', studentId);
      const res = await authFetch(`/api/reports/comparison?${params.toString()}`);
      return await safeParseJson<{ success: boolean; data?: any; message?: string }>(res, { success: false, message: 'Failed to load comparison report' });
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },

  // Audit
  getAuditLogs: async (entityType?: string, entityId?: string, limit = 50): Promise<AuditLogEntry[]> => {
    try {
      const params = new URLSearchParams({ limit: limit.toString() });
      if (entityType) params.set('entityType', entityType);
      if (entityId) params.set('entityId', entityId);
      const res = await authFetch(`/api/audit/logs?${params.toString()}`);
      const data = await safeParseJson<{ success: boolean; data?: AuditLogEntry[] }>(res, { success: false, data: [] });
      return data.success && Array.isArray(data.data) ? data.data : [];
    } catch (err) {
      console.warn('[API] getAuditLogs error:', err);
      return [];
    }
  },

  // Migration
  getMigrationOverview: async (): Promise<{ success: boolean; data?: any; message?: string }> => {
    try {
      const res = await authFetch('/api/migration/overview');
      return await safeParseJson<{ success: boolean; data?: any; message?: string }>(res, { success: false, message: 'Failed to load migration status' });
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },

  exportMigrationJson: async () => {
    const res = await authFetch('/api/migration/export-json');
    if (!res.ok) throw new Error('Export download failed');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spis_data_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },
};
