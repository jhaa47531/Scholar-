import React from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  UserCheck,
  Settings,
  FileSpreadsheet,
  History,
  Database,
  BarChart3,
  FileCheck2,
  FileEdit,
  TrendingUp,
  Award,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Shield,
  Layers,
  X,
  CreditCard,
} from 'lucide-react';
import { UserRole } from '../../types/domain.ts';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

interface SidebarProps {
  currentRole: UserRole;
  activePage: string;
  onSelectPage: (pageId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  userDisplayName?: string;
  userEmail?: string;
  onSwitchUser: () => void;
  onLogout: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRole,
  activePage,
  onSelectPage,
  isCollapsed,
  onToggleCollapse,
  userDisplayName,
  userEmail,
  onSwitchUser,
  onLogout,
  isMobileOpen,
  onCloseMobile,
}) => {
  const getNavItems = (): NavItem[] => {
    switch (currentRole) {
      case UserRole.ADMIN:
        return [
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'analytics', label: 'Institutional Analytics', icon: BarChart3 },
          { id: 'students', label: 'Students Directory', icon: GraduationCap },
          { id: 'faculty', label: 'Faculty Directory', icon: Users },
          { id: 'courses', label: 'Courses & Semesters', icon: Layers },
          { id: 'subjects', label: 'Subjects Master', icon: BookOpen },
          { id: 'assignments', label: 'Teacher Assignments', icon: UserCheck },
          { id: 'configs', label: 'Assessment Configuration', icon: Settings },
          { id: 'fees', label: 'Fee Management', icon: CreditCard },
          { id: 'reports', label: 'Performance Reports', icon: FileSpreadsheet },
          { id: 'audit', label: 'Audit Logs', icon: History },
          { id: 'migration', label: 'Data Export & Migration', icon: Database },
        ];
      case UserRole.TEACHER:
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'my_subjects', label: 'My Subjects', icon: BookOpen },
          { id: 'roster', label: 'Student Roster', icon: Users },
          { id: 'marks_entry', label: 'Marks Entry', icon: FileSpreadsheet },
          { id: 'drafts', label: 'Drafts', icon: FileEdit },
          { id: 'finalized', label: 'Final Submissions', icon: FileCheck2 },
          { id: 'corrections', label: 'Correction History', icon: History },
        ];
      case UserRole.STUDENT:
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'results', label: 'My Results', icon: Award },
          { id: 'subject_performance', label: 'Subject-wise Performance', icon: BookOpen },
          { id: 'progress_analytics', label: 'Progress Analytics', icon: TrendingUp },
          { id: 'recommendations', label: 'Improvement Advisory', icon: Sparkles },
          { id: 'final_reports', label: 'Finalized Reports', icon: FileCheck2 },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full bg-white border-r border-slate-200">
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 text-white font-bold shrink-0 shadow-xs">
            <GraduationCap className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="truncate">
              <span className="font-bold text-xs tracking-tight text-slate-900 block truncate" title="Global Institute of Information and Technology">
                Global Institute of IT
              </span>
              <span className="text-[10px] text-indigo-600 font-mono tracking-wider block font-semibold">
                ScholarSense SPIS
              </span>
            </div>
          )}
        </div>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Mobile Close Button */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Role Pill Banner */}
      {!isCollapsed && (
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Shield className="w-3.5 h-3.5 text-indigo-600" />
            <span className="font-semibold text-slate-800">
              {currentRole === UserRole.ADMIN
                ? 'Institutional Admin'
                : currentRole === UserRole.TEACHER
                ? 'Faculty Portal'
                : 'Student Portal'}
            </span>
          </div>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white text-indigo-700 border border-slate-200 font-semibold">
            {currentRole}
          </span>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectPage(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
              title={isCollapsed ? item.label : undefined}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                }`}
              />
              {!isCollapsed && (
                <span className="truncate flex-1 text-left whitespace-nowrap">
                  {item.label}
                </span>
              )}
              {!isCollapsed && item.badge && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Footer & Switch Role */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/80 shrink-0">
        {!isCollapsed ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-white border border-slate-200">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-xs">
                {userDisplayName ? userDisplayName.charAt(0) : 'U'}
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-xs font-semibold text-slate-800 truncate">{userDisplayName || 'User'}</p>
                <p className="text-[10px] text-slate-500 font-mono truncate">{userEmail || ''}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onSwitchUser}
                className="flex-1 py-1.5 px-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200 transition-colors text-center cursor-pointer"
              >
                Switch Role
              </button>
              <button
                onClick={onLogout}
                title="Sign out"
                className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={onSwitchUser}
              title="Switch Account"
              className="w-10 h-10 rounded-xl bg-white hover:bg-slate-100 text-indigo-600 flex items-center justify-center transition-colors border border-slate-200 cursor-pointer shadow-xs"
            >
              <Users className="w-4 h-4" />
            </button>
            <button
              onClick={onLogout}
              title="Sign out"
              className="w-10 h-10 rounded-xl bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 flex items-center justify-center transition-colors border border-slate-200 cursor-pointer shadow-xs"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col h-screen transition-all duration-200 shrink-0 z-30 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[80vw] h-full shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
