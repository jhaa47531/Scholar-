import React, { useState } from 'react';
import { GraduationCap, Mail, KeyRound, AlertCircle, ArrowRight, ShieldCheck, Shield, Users } from 'lucide-react';
import { CourseStructure } from '../../types/domain.ts';

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister?: (payload: any) => Promise<void>;
  isLoading: boolean;
  errorMessage: string | null;
  courses?: CourseStructure[];
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLogin,
  isLoading,
  errorMessage,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && password) {
      await onLogin(email.trim(), password);
    }
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

        {/* Quick Institutional Persona Accounts */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Institutional Quick Sign-In:
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setQuickAccount('jhaa47531@gmail.com', 'aditya')}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-left transition-colors cursor-pointer group"
            >
              <div className="text-[11px] font-bold text-slate-800 group-hover:text-indigo-600 flex items-center gap-1">
                <Shield className="w-3 h-3 text-indigo-600" /> Admin
              </div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5">Aditya Jha</div>
            </button>
            <button
              type="button"
              onClick={() => setQuickAccount('sharma@faculty.edu')}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-left transition-colors cursor-pointer group"
            >
              <div className="text-[11px] font-bold text-slate-800 group-hover:text-indigo-600 flex items-center gap-1">
                <Users className="w-3 h-3 text-sky-600" /> Faculty
              </div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5">Dr. Sharma</div>
            </button>
            <button
              type="button"
              onClick={() => setQuickAccount('aarav.patel@student.edu')}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-left transition-colors cursor-pointer group"
            >
              <div className="text-[11px] font-bold text-slate-800 group-hover:text-indigo-600 flex items-center gap-1">
                <GraduationCap className="w-3 h-3 text-emerald-600" /> Student
              </div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5">Aarav (BCA)</div>
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

        {/* Unified Institutional Sign In Form */}
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

        {/* Institutional Governance Note */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
          <span className="font-semibold text-slate-700 block mb-0.5">Institutional Access Policy:</span>
          Student and faculty accounts are provisioned exclusively by authorized GIIT administrators. Self-registration is disabled for academic compliance.
        </div>

        {/* Footer & Developer Signature */}
        <div className="pt-3 border-t border-slate-100 text-center space-y-1.5">
          <div className="text-xs font-semibold text-slate-700">
            Made with ❤️ by Aditya | BCA 3rd Semester
          </div>
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Role-Based Access Control (RBAC) & Cloud Firestore Protected</span>
          </div>
        </div>
      </div>
    </div>
  );
};
