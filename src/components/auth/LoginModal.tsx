import React, { useState } from 'react';
import { Shield, GraduationCap, Users, ArrowRight, X, AlertCircle } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string) => Promise<void>;
  isLoading: boolean;
  errorMessage: string | null;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  isLoading,
  errorMessage,
}) => {
  const [customEmail, setCustomEmail] = useState('');

  if (!isOpen) return null;

  const demoAccounts = [
    {
      role: 'ADMIN',
      title: 'Prof. Eleanor Vance',
      designation: 'Dean & Academic Admin',
      email: 'admin@institution.edu',
      icon: Shield,
      accent: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
    },
    {
      role: 'TEACHER',
      title: 'Dr. Rajesh Sharma',
      designation: 'HOD Computing & Faculty',
      email: 'sharma@faculty.edu',
      icon: Users,
      accent: 'border-sky-500/30 text-sky-400 bg-sky-500/10',
    },
    {
      role: 'TEACHER',
      title: 'Prof. Anita Gupta',
      designation: 'Assistant Professor',
      email: 'gupta@faculty.edu',
      icon: Users,
      accent: 'border-sky-500/30 text-sky-400 bg-sky-500/10',
    },
    {
      role: 'STUDENT',
      title: 'Aarav Patel',
      designation: 'BCA 1st Year (EN2025BCA001)',
      email: 'aarav.patel@student.edu',
      icon: GraduationCap,
      accent: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
    },
    {
      role: 'STUDENT',
      title: 'Diya Sharma',
      designation: 'BCA 1st Year (EN2025BCA002)',
      email: 'diya.sharma@student.edu',
      icon: GraduationCap,
      accent: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
    },
  ];

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customEmail.trim()) {
      onLogin(customEmail.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Institutional Account Switcher</h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Select an institutional persona or enter an authenticated email.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Demo Personas Grid */}
        <div className="mt-4 space-y-2 max-h-72 overflow-y-auto pr-1">
          {demoAccounts.map((account) => {
            const Icon = account.icon;
            return (
              <button
                key={account.email}
                disabled={isLoading}
                onClick={() => onLogin(account.email)}
                className="w-full p-3 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-750 hover:border-slate-700 transition-all text-left flex items-center justify-between group disabled:opacity-50 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg border ${account.accent}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">{account.title}</span>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {account.role}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">{account.email}</p>
                    <p className="text-[10px] text-slate-400">{account.designation}</p>
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
              </button>
            );
          })}
        </div>

        {/* Custom Email Form */}
        <form onSubmit={handleCustomSubmit} className="mt-5 pt-4 border-t border-slate-800 flex gap-2">
          <input
            type="email"
            value={customEmail}
            onChange={(e) => setCustomEmail(e.target.value)}
            placeholder="e.g. your.email@institution.edu"
            className="flex-1 px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
          />
          <button
            type="submit"
            disabled={isLoading || !customEmail.trim()}
            className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};
