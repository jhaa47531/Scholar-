import React from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  FolderTree,
  UserCheck,
  Settings,
  FileSpreadsheet,
  History,
  Database,
  ClipboardList,
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
}) => {
  const getNavItems = (): NavItem[] => {
    switch (currentRole) {
      case UserRole.ADMIN:
        return [
          { id: 'overview', label: 'Overview & Analytics', icon: LayoutDashboard },
          { id: 'students', label: 'Students', icon: GraduationCap },
          { id: 'faculty', label: 'Faculty Directory', icon: Users },
          { id: 'courses', label: 'Courses & Semesters', icon: Layers },
          { id: 'subjects', label: 'Subjects Master', icon: BookOpen },
          { id: 'assignments', label: 'Teacher Assignments', icon: UserCheck },
          { id: 'configs', label: 'Assessment Configs', icon: Settings },
          { id: 'reports', label: 'Performance Reports', icon: FileSpreadsheet },
          { id: 'audit', label: 'Audit Logs', icon: History },
          { id: 'migration', label: 'Oracle Migration', icon: Database },
        ];
      case UserRole.TEACHER:
        return [
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'my_subjects', label: 'My Subjects', icon: BookOpen },
          { id: 'roster', label: 'Student Roster', icon: Users },
          { id: 'marks_entry', label: 'Marks Entry', icon: FileSpreadsheet },
          { id: 'drafts', label: 'Draft Assessments', icon: FileEdit },
          { id: 'finalized', label: 'Final Submissions', icon: FileCheck2 },
          { id: 'corrections', label: 'Correction History', icon: History },
        ];
      case UserRole.STUDENT:
        return [
          { id: 'dashboard', label: 'My Dashboard', icon: LayoutDashboard },
          { id: 'results', label: 'My Results', icon: Award },
          { id: 'subject_performance', label: 'Subject Performance', icon: BookOpen },
          { id: 'progress_analytics', label: 'Progress Analytics', icon: TrendingUp },
          { id: 'recommendations', label: 'Advisory Engine', icon: Sparkles },
          { id: 'final_reports', label: 'Finalized Reports', icon: FileCheck2 },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <aside
      className={`relative flex flex-col justify-between h-screen bg-slate-950 border-r border-slate-800 transition-all duration-200 z-30 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="truncate">
              <span className="font-bold text-sm tracking-tight text-white block">
                ScholarSense
              </span>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider block">
                SPIS PLATFORM
              </span>
            </div>
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Role Badge Indicator */}
      {!isCollapsed && (
        <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-medium text-slate-300">
              {currentRole === UserRole.ADMIN
                ? 'Institutional Admin'
                : currentRole === UserRole.TEACHER
                ? 'Faculty Portal'
                : 'Student Portal'}
            </span>
          </div>
          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
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
              onClick={() => onSelectPage(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/90 border border-transparent'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />
              {!isCollapsed && (
                <span className="truncate flex-1 text-left whitespace-nowrap">
                  {item.label}
                </span>
              )}
              {!isCollapsed && item.badge && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Footer & Switch Role */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/40">
        {!isCollapsed ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
              <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-amber-400 shrink-0">
                {userDisplayName ? userDisplayName.charAt(0) : 'U'}
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-xs font-semibold text-white truncate">{userDisplayName || 'User'}</p>
                <p className="text-[10px] text-slate-400 font-mono truncate">{userEmail || ''}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={onSwitchUser}
                className="flex-1 py-1.5 px-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors text-center"
              >
                Switch Account
              </button>
              <button
                onClick={onLogout}
                title="Sign out"
                className="p-1.5 rounded-md bg-slate-850 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-slate-750 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={onSwitchUser}
              title="Switch Account"
              className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 flex items-center justify-center transition-colors"
            >
              <Users className="w-4 h-4" />
            </button>
            <button
              onClick={onLogout}
              title="Sign out"
              className="w-9 h-9 rounded-lg bg-slate-900 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 flex items-center justify-center transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
