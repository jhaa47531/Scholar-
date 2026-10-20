import React, { useState } from 'react';
import { GraduationCap, Lock, Mail, KeyRound, AlertCircle, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { CourseStructure, UserRole } from '../../types/domain.ts';

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister?: (payload: any) => Promise<void>;
  isLoading: boolean;
  errorMessage: string | null;
  courses?: CourseStructure[];
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLogin,
  onRegister,
  isLoading,
  errorMessage,
  courses = [],
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Registration state
  const [regRole, setRegRole] = useState<UserRole>(UserRole.STUDENT);
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regEnrollmentNo, setRegEnrollmentNo] = useState('');
  const [regRollNo, setRegRollNo] = useState('');
  const [regCourseId, setRegCourseId] = useState(courses[0]?.id || 'crs_bca');
  const [regSemester, setRegSemester] = useState('1');
  const [regDepartment, setRegDepartment] = useState('Computer Applications');
  const [regDesignation, setRegDesignation] = useState('Assistant Professor');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && password) {
      await onLogin(email.trim(), password);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onRegister || !email.trim() || !regDisplayName.trim()) return;

    const payload: any = {
      email: email.trim(),
      password,
      displayName: regDisplayName.trim(),
      role: regRole,
    };

    if (regRole === UserRole.STUDENT) {
      payload.enrollmentNo = regEnrollmentNo.trim() || `EN2025BCA00${Math.floor(Math.random() * 90) + 10}`;
      payload.rollNo = regRollNo.trim() || `BCA-${Math.floor(Math.random() * 90) + 10}`;
      payload.courseId = regCourseId;
      payload.currentSemester = parseInt(regSemester, 10);
      payload.admissionSessionId = 'sess_2025_26';
    } else if (regRole === UserRole.TEACHER) {
      payload.department = regDepartment;
      payload.designation = regDesignation;
      payload.employeeCode = `FAC-CS-0${Math.floor(Math.random() * 90) + 10}`;
    }

    await onRegister(payload);
  };

  const setQuickAccount = (quickEmail: string, quickPass = 'institutionalPass123!') => {
    setEmail(quickEmail);
    setPassword(quickEmail === 'jhaa47531@gmail.com' ? 'aditya' : quickPass);
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">
        {/* Institutional Branding */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 mx-auto flex items-center justify-center shadow-xs">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Global Institute of Information and Technology
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            ScholarSense — Student Performance Intelligence System (SPIS)
          </p>
        </div>

        {/* Tab Switcher */}
        {onRegister && (
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => setActiveTab('login')}
              className={`py-2 rounded-lg transition-all ${
                activeTab === 'login'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('register')}
              className={`py-2 rounded-lg transition-all ${
                activeTab === 'register'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Register Profile
            </button>
          </div>
        )}

        {/* Quick Institutional Persona Accounts */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Institutional Quick Sign-In:
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setQuickAccount('jhaa47531@gmail.com', 'aditya')}
              className="p-2 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-left transition-colors cursor-pointer group"
            >
              <div className="text-[11px] font-bold text-slate-800 group-hover:text-indigo-600">Admin</div>
              <div className="text-[10px] text-slate-500 truncate">Aditya Jha</div>
            </button>
            <button
              type="button"
              onClick={() => setQuickAccount('sharma@faculty.edu')}
              className="p-2 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-left transition-colors cursor-pointer group"
            >
              <div className="text-[11px] font-bold text-slate-800 group-hover:text-indigo-600">Faculty</div>
              <div className="text-[10px] text-slate-500 truncate">Dr. Sharma</div>
            </button>
            <button
              type="button"
              onClick={() => setQuickAccount('aarav.patel@student.edu')}
              className="p-2 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-left transition-colors cursor-pointer group"
            >
              <div className="text-[11px] font-bold text-slate-800 group-hover:text-indigo-600">Student</div>
              <div className="text-[10px] text-slate-500 truncate">Aarav (BCA)</div>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        {activeTab === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Institutional Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                  placeholder="e.g. jhaa47531@gmail.com"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  placeholder="Enter password"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email.trim() || !password}
              className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Academic Portal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Account Role
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRegRole(UserRole.STUDENT)}
                  className={`p-2 rounded-lg text-xs font-semibold border ${
                    regRole === UserRole.STUDENT
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setRegRole(UserRole.TEACHER)}
                  className={`p-2 rounded-lg text-xs font-semibold border ${
                    regRole === UserRole.TEACHER
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Faculty
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={regDisplayName}
                onChange={(e) => setRegDisplayName(e.target.value)}
                placeholder="e.g. Maya Sen"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Institutional Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. maya.sen@student.edu"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create secure password"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {regRole === UserRole.STUDENT && (
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Course</label>
                  <select
                    value={regCourseId}
                    onChange={(e) => setRegCourseId(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>{c.courseCode}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Semester</label>
                  <select
                    value={regSemester}
                    onChange={(e) => setRegSemester(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
                  >
                    {[1, 2, 3, 4, 5, 6].map((s) => (
                      <option key={s} value={s.toString()}>Semester {s}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !email.trim() || !regDisplayName.trim() || !password}
              className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {isLoading ? 'Creating account...' : 'Complete Registration'}
            </button>
          </form>
        )}

        {/* Security badge footer */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Role-Based Access Control (RBAC) & Cloud Firestore Protected</span>
        </div>
      </div>
    </div>
  );
};
