import React, { useState } from 'react';
import { X, AlertCircle, GraduationCap, Users, Shield, ArrowRight } from 'lucide-react';
import { CourseStructure, UserRole } from '../../types/domain.ts';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister?: (payload: any) => Promise<void>;
  isLoading: boolean;
  errorMessage: string | null;
  courses?: CourseStructure[];
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  onRegister,
  isLoading,
  errorMessage,
  courses = [],
}) => {
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Registration state
  const [regRole, setRegRole] = useState<UserRole>(UserRole.STUDENT);
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regEnrollmentNo, setRegEnrollmentNo] = useState('');
  const [regRollNo, setRegRollNo] = useState('');
  const [regCourseId, setRegCourseId] = useState('crs_bca');
  const [regSemester, setRegSemester] = useState('1');
  const [regDepartment, setRegDepartment] = useState('Computer Applications');
  const [regDesignation, setRegDesignation] = useState('Assistant Professor');

  if (!isOpen) return null;

  const handleSignInSubmit = async (e: React.FormEvent) => {
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

  const setQuickAccount = (quickEmail: string) => {
    setEmail(quickEmail);
    setPassword(quickEmail === 'jhaa47531@gmail.com' ? 'aditya' : 'institutionalPass123!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 sm:p-7 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <GraduationCap className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Global Institute of Information and Technology
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              ScholarSense SPIS — Sign in with institutional credentials or register a student / faculty profile.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="mt-4 p-1 bg-slate-100 rounded-lg flex items-center">
          <button
            type="button"
            onClick={() => setMode('signin')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              mode === 'signin' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              mode === 'register' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Register Account
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Quick Demo Role Accounts (Quick-Access Bar for QA & Testing) */}
        {mode === 'signin' && (
          <div className="mt-4 p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 space-y-2">
            <span className="text-[11px] font-semibold text-indigo-900 block font-mono uppercase tracking-wide">
              Quick Institutional Profiles (Testing & Verification)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setQuickAccount('jhaa47531@gmail.com')}
                className="p-1.5 bg-white border border-indigo-200 hover:border-indigo-400 text-left rounded-lg text-[11px] text-slate-700 transition-colors cursor-pointer shadow-2xs"
              >
                <div className="font-bold text-indigo-700 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Aditya (Admin)
                </div>
                <div className="text-[10px] text-slate-500 truncate">jhaa47531@gmail.com</div>
              </button>
              <button
                type="button"
                onClick={() => setQuickAccount('admin@institution.edu')}
                className="p-1.5 bg-white border border-indigo-200 hover:border-indigo-400 text-left rounded-lg text-[11px] text-slate-700 transition-colors cursor-pointer shadow-2xs"
              >
                <div className="font-bold text-indigo-700 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Dean Vance
                </div>
                <div className="text-[10px] text-slate-500 truncate">Institutional Dean</div>
              </button>
              <button
                type="button"
                onClick={() => setQuickAccount('sharma@faculty.edu')}
                className="p-1.5 bg-white border border-indigo-200 hover:border-indigo-400 text-left rounded-lg text-[11px] text-slate-700 transition-colors cursor-pointer shadow-2xs"
              >
                <div className="font-bold text-sky-700 flex items-center gap-1">
                  <Users className="w-3 h-3" /> Faculty
                </div>
                <div className="text-[10px] text-slate-500 truncate">Dr. Sharma (HOD)</div>
              </button>
              <button
                type="button"
                onClick={() => setQuickAccount('aarav.patel@student.edu')}
                className="p-1.5 bg-white border border-indigo-200 hover:border-indigo-400 text-left rounded-lg text-[11px] text-slate-700 transition-colors cursor-pointer shadow-2xs"
              >
                <div className="font-bold text-emerald-700 flex items-center gap-1">
                  <GraduationCap className="w-3 h-3" /> Student
                </div>
                <div className="text-[10px] text-slate-500 truncate">Aarav (BCA Sem 1)</div>
              </button>
            </div>
          </div>
        )}

        {/* Forms */}
        {mode === 'signin' ? (
          <form onSubmit={handleSignInSubmit} className="mt-4 space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Institutional Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
                placeholder="e.g. admin@institution.edu or student@institution.edu"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                placeholder="Institutional password"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !email.trim() || !password}
              className="w-full mt-2 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-sm flex items-center justify-center gap-2"
            >
              {isLoading ? 'Verifying credentials...' : 'Sign In'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            <div className="flex gap-2">
              <label className="flex-1 p-2 rounded-lg border text-xs cursor-pointer flex items-center gap-2 bg-white has-checked:border-indigo-600 has-checked:bg-indigo-50/50">
                <input
                  type="radio"
                  name="regRole"
                  checked={regRole === UserRole.STUDENT}
                  onChange={() => setRegRole(UserRole.STUDENT)}
                  className="accent-indigo-600"
                />
                <span className="font-semibold text-slate-800">Student</span>
              </label>
              <label className="flex-1 p-2 rounded-lg border text-xs cursor-pointer flex items-center gap-2 bg-white has-checked:border-indigo-600 has-checked:bg-indigo-50/50">
                <input
                  type="radio"
                  name="regRole"
                  checked={regRole === UserRole.TEACHER}
                  onChange={() => setRegRole(UserRole.TEACHER)}
                  className="accent-indigo-600"
                />
                <span className="font-semibold text-slate-800">Faculty</span>
              </label>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Full Name</label>
              <input
                type="text"
                value={regDisplayName}
                onChange={(e) => setRegDisplayName(e.target.value)}
                required
                placeholder="e.g. Maya Sen"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Institutional Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="e.g. maya.sen@student.edu"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Create password"
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {regRole === UserRole.STUDENT ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Degree Program</label>
                    <select
                      value={regCourseId}
                      onChange={(e) => setRegCourseId(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      {courses.length > 0 ? (
                        courses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.courseCode} ({c.name})
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="crs_bca">BCA (3 Years)</option>
                          <option value="crs_btech">B.Tech (4 Years)</option>
                          <option value="crs_bba">BBA (3 Years)</option>
                          <option value="crs_mca">MCA (2 Years)</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Semester</label>
                    <select
                      value={regSemester}
                      onChange={(e) => setRegSemester(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="1">Semester 1 (Dec cycle)</option>
                      <option value="2">Semester 2 (June cycle)</option>
                      <option value="3">Semester 3 (Dec cycle)</option>
                      <option value="4">Semester 4 (June cycle)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Roll Number</label>
                    <input
                      type="text"
                      value={regRollNo}
                      onChange={(e) => setRegRollNo(e.target.value)}
                      placeholder="e.g. BCA-04"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Enrollment ID</label>
                    <input
                      type="text"
                      value={regEnrollmentNo}
                      onChange={(e) => setRegEnrollmentNo(e.target.value)}
                      placeholder="e.g. EN2025BCA004"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Department</label>
                  <input
                    type="text"
                    value={regDepartment}
                    onChange={(e) => setRegDepartment(e.target.value)}
                    placeholder="e.g. Computer Applications"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Designation</label>
                  <input
                    type="text"
                    value={regDesignation}
                    onChange={(e) => setRegDesignation(e.target.value)}
                    placeholder="e.g. Assistant Professor"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !email.trim() || !regDisplayName.trim()}
              className="w-full mt-3 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-sm flex items-center justify-center gap-2"
            >
              {isLoading ? 'Creating account...' : `Register ${regRole}`}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
