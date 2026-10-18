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

  return fetch(url, { ...options, headers });
}

export const api = {
  // Health
  getHealth: async () => {
    const res = await fetch('/api/health');
    return res.json();
  },

  // Auth
  getMe: async (explicitToken?: string | null) => {
    const res = await authFetch('/api/auth/me', {}, explicitToken);
    return res.json();
  },

  loginAs: async (email: string) => {
    // 1. Try real Firebase token generation first
    try {
      const fbRes = await fetch('/api/auth/firebase-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const fbData = await fbRes.json();
      if (fbData.success && fbData.customToken) {
        const { auth } = await import('../config/firebase.ts');
        const { signInWithCustomToken } = await import('firebase/auth');
        if (auth) {
          const cred = await signInWithCustomToken(auth, fbData.customToken);
          const realIdToken = await cred.user.getIdToken(true);
          setApiAuthToken(realIdToken);
          return { success: true, token: realIdToken, user: fbData.user };
        }
      } else if (fbData.success && fbData.token) {
        setApiAuthToken(fbData.token);
        return fbData;
      }
    } catch (err) {
      console.warn('[API] Firebase login fallback:', err);
    }

    // 2. Standard dev token fallback
    const res = await fetch('/api/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    });
    const devData = await res.json();
    if (devData.success && devData.token) {
      setApiAuthToken(devData.token);
    }
    return devData;
  },

  // Academic Master
  getSessions: async (): Promise<AcademicSession[]> => {
    const res = await authFetch('/api/academic/sessions');
    const data = await res.json();
    return data.success ? data.data : [];
  },

  getCourses: async (): Promise<CourseStructure[]> => {
    const res = await authFetch('/api/academic/courses');
    const data = await res.json();
    return data.success ? data.data : [];
  },

  getSubjects: async (courseId?: string, semester?: number): Promise<SubjectMaster[]> => {
    const params = new URLSearchParams();
    if (courseId) params.set('courseId', courseId);
    if (semester !== undefined) params.set('semester', semester.toString());
    const res = await authFetch(`/api/academic/subjects?${params.toString()}`);
    const data = await res.json();
    return data.success ? data.data : [];
  },

  getStudents: async (courseId?: string, semester?: number): Promise<StudentProfile[]> => {
    const params = new URLSearchParams();
    if (courseId) params.set('courseId', courseId);
    if (semester !== undefined) params.set('semester', semester.toString());
    const res = await authFetch(`/api/academic/students?${params.toString()}`);
    const data = await res.json();
    return data.success ? data.data : [];
  },

  getTeachers: async (): Promise<TeacherProfile[]> => {
    const res = await authFetch('/api/academic/teachers');
    const data = await res.json();
    return data.success ? data.data : [];
  },

  getAssignments: async (teacherId?: string, sessionId?: string): Promise<TeacherAssignment[]> => {
    const params = new URLSearchParams();
    if (teacherId) params.set('teacherId', teacherId);
    if (sessionId) params.set('sessionId', sessionId);
    const res = await authFetch(`/api/academic/assignments?${params.toString()}`);
    const data = await res.json();
    return data.success ? data.data : [];
  },

  createAssignment: async (payload: { teacherId: string; subjectId: string; sessionId: string; semester: number }) => {
    const res = await authFetch('/api/academic/assignments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // Assessments
  getConfigs: async (sessionId?: string, courseId?: string): Promise<SessionalConfig[]> => {
    const params = new URLSearchParams();
    if (sessionId) params.set('sessionId', sessionId);
    if (courseId) params.set('courseId', courseId);
    const res = await authFetch(`/api/assessments/configs?${params.toString()}`);
    const data = await res.json();
    return data.success ? data.data : [];
  },

  saveConfig: async (payload: Partial<SessionalConfig>) => {
    const res = await authFetch('/api/assessments/configs', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  getTeacherSheet: async (subjectId: string, sessionId: string, sessionalNumber: number) => {
    const url = `/api/assessments/teacher/subject-sheet?subjectId=${subjectId}&sessionId=${sessionId}&sessionalNumber=${sessionalNumber}`;
    const res = await authFetch(url);
    return res.json();
  },

  saveDraft: async (assessment: AssessmentRecord) => {
    const res = await authFetch('/api/assessments/draft', {
      method: 'POST',
      body: JSON.stringify({ assessment }),
    });
    return res.json();
  },

  finalSubmitBatch: async (assessments: AssessmentRecord[]) => {
    const res = await authFetch('/api/assessments/final-submit', {
      method: 'POST',
      body: JSON.stringify({ assessments }),
    });
    return res.json();
  },

  correctAssessment: async (assessmentId: string, updates: Partial<AssessmentRecord>, correctionReason: string) => {
    const res = await authFetch('/api/assessments/correction', {
      method: 'POST',
      body: JSON.stringify({ assessmentId, updates, correctionReason }),
    });
    return res.json();
  },

  getStudentMarks: async (sessionId: string, sessionalNumber?: number, studentId?: string) => {
    const params = new URLSearchParams({ sessionId });
    if (sessionalNumber !== undefined) params.set('sessionalNumber', sessionalNumber.toString());
    if (studentId) params.set('studentId', studentId);
    const res = await authFetch(`/api/assessments/student/marks?${params.toString()}`);
    return res.json();
  },

  // Reports
  getSessionalReport: async (
    sessionId: string,
    sessionalNumber: number,
    studentId?: string
  ): Promise<{ success: boolean; data?: SessionalOverallReport; message?: string }> => {
    const params = new URLSearchParams({
      sessionId,
      sessionalNumber: sessionalNumber.toString(),
    });
    if (studentId) params.set('studentId', studentId);
    const res = await authFetch(`/api/reports/sessional?${params.toString()}`);
    return res.json();
  },

  getComparisonReport: async (sessionId: string, studentId?: string) => {
    const params = new URLSearchParams({ sessionId });
    if (studentId) params.set('studentId', studentId);
    const res = await authFetch(`/api/reports/comparison?${params.toString()}`);
    return res.json();
  },

  // Audit
  getAuditLogs: async (entityType?: string, entityId?: string, limit = 50): Promise<AuditLogEntry[]> => {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (entityType) params.set('entityType', entityType);
    if (entityId) params.set('entityId', entityId);
    const res = await authFetch(`/api/audit/logs?${params.toString()}`);
    const data = await res.json();
    return data.success ? data.data : [];
  },

  // Migration
  getMigrationOverview: async () => {
    const res = await authFetch('/api/migration/overview');
    return res.json();
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
