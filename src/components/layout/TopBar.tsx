import React from 'react';
import { AcademicSession } from '../../types/domain.ts';
import { Calendar, Search, Bell, Menu, Shield, User, LogOut, CheckCircle2 } from 'lucide-react';

interface TopBarProps {
  breadcrumbs: string[];
  sessions: AcademicSession[];
  selectedSessionId: string;
  onSelectSession: (sessionId: string) => void;
  userRoleName: string;
  userDisplayName?: string;
  userEmail?: string;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  notificationCount?: number;
  onToggleMobileSidebar?: () => void;
  onSwitchUser?: () => void;
  onLogout?: () => void;
  persistenceMode?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  breadcrumbs,
  sessions,
  selectedSessionId,
  onSelectSession,
  userRoleName,
  userDisplayName,
  userEmail,
  onOpenSearch,
  onOpenNotifications,
  notificationCount = 0,
  onToggleMobileSidebar,
  onSwitchUser,
  onLogout,
  persistenceMode = 'IN_MEMORY',
}) => {
  return (
    <header className="h-16 px-4 sm:px-6 bg-[#060d1a]/90 backdrop-blur-md border-b border-[#162740] flex items-center justify-between gap-4 shrink-0 z-20">
      {/* Zone 1: Mobile Hamburger + Breadcrumb Trail */}
      <div className="flex items-center gap-3 overflow-hidden">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-medium overflow-hidden">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="text-slate-600 font-mono">/</span>}
              <span
                className={
                  idx === breadcrumbs.length - 1
                    ? 'text-white font-semibold truncate'
                    : 'text-slate-400 hover:text-slate-200 transition-colors truncate'
                }
              >
                {crumb}
              </span>
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Zone 2: Global Search Quick Trigger */}
      <div className="hidden md:flex items-center flex-1 max-w-xs mx-4">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-xs text-slate-400 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>Search records...</span>
          </div>
          <kbd className="hidden sm:inline-block font-mono text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
            Search
          </kbd>
        </button>
      </div>

      {/* Zone 3: Academic Session, Notifications & Profile Menu */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Persistence Indicator */}
        <div className="hidden xl:flex items-center gap-1.5 text-[11px] text-slate-400 font-mono px-2 py-1 rounded bg-slate-900/80 border border-slate-800">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>{persistenceMode.includes('FIRESTORE') ? 'Cloud Firestore' : 'Live In-Memory'}</span>
        </div>

        {/* Academic Session Selector */}
        {sessions.length > 0 && (
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200">
            <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <select
              value={selectedSessionId}
              onChange={(e) => onSelectSession(e.target.value)}
              className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer pr-1"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-slate-200">
                  {s.sessionCode}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-850 transition-colors border border-transparent hover:border-slate-800 cursor-pointer"
          title="Notifications & Audit Logs"
        >
          <Bell className="w-4 h-4 text-slate-300" />
          {notificationCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          )}
        </button>

        {/* Profile / Account Badge */}
        {userDisplayName && (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <button
              onClick={onSwitchUser}
              title="Click to Switch User Role"
              className="flex items-center gap-2 p-1 sm:pr-2.5 rounded-lg hover:bg-slate-850 transition-colors cursor-pointer text-left"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-xs font-bold text-slate-950 shadow-sm shrink-0">
                {userDisplayName.charAt(0)}
              </div>
              <div className="hidden lg:block text-left">
                <span className="text-xs font-semibold text-white block truncate max-w-[120px]">
                  {userDisplayName}
                </span>
                <span className="text-[10px] text-amber-400 font-mono uppercase block">
                  {userRoleName}
                </span>
              </div>
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                title="Sign Out"
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
