import React from 'react';
import { AcademicSession } from '../../types/domain.ts';
import { Calendar, Search, Bell, Menu, LogOut, CheckCircle2 } from 'lucide-react';

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
    <header className="h-16 px-4 sm:px-6 bg-white/95 backdrop-blur-md border-b border-slate-200 flex items-center justify-between gap-4 shrink-0 z-20">
      {/* Zone 1: Mobile Hamburger + Breadcrumb Trail */}
      <div className="flex items-center gap-3 overflow-hidden">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden cursor-pointer"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-medium overflow-hidden">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="text-slate-300 font-mono">/</span>}
              <span
                className={
                  idx === breadcrumbs.length - 1
                    ? 'text-slate-900 font-semibold truncate'
                    : 'text-slate-500 hover:text-slate-700 transition-colors truncate'
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
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-500 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>Search records...</span>
          </div>
          <kbd className="hidden sm:inline-block font-mono text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs">
            Search
          </kbd>
        </button>
      </div>

      {/* Zone 3: Academic Session, Notifications & Profile Menu */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Institution Badge */}
        <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-700 font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100">
          <span className="text-indigo-600 font-bold">GIIT</span>
          <span className="text-slate-400 font-normal">|</span>
          <span className="truncate max-w-[200px]">Global Institute of Information and Technology</span>
        </div>

        {/* Persistence Indicator */}
        <div className="hidden xl:flex items-center gap-1.5 text-[11px] text-slate-600 font-mono px-2 py-1 rounded bg-slate-50 border border-slate-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>{persistenceMode.includes('FIRESTORE') ? 'Cloud Firestore' : 'Live In-Memory'}</span>
        </div>

        {/* Academic Session Selector */}
        {sessions.length > 0 && (
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <select
              value={selectedSessionId}
              onChange={(e) => onSelectSession(e.target.value)}
              className="bg-transparent text-xs text-slate-700 font-medium focus:outline-none cursor-pointer pr-1"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id} className="bg-white text-slate-800">
                  {s.sessionCode}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
          title="Notifications & Audit Logs"
        >
          <Bell className="w-4 h-4 text-slate-600" />
          {notificationCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600" />
          )}
        </button>

        {/* Profile / Account Badge */}
        {userDisplayName && (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <button
              onClick={onSwitchUser}
              title="Click to Switch User Role"
              className="flex items-center gap-2 p-1 sm:pr-2.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer text-left"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-xs font-bold text-white shadow-xs shrink-0">
                {userDisplayName.charAt(0)}
              </div>
              <div className="hidden lg:block text-left">
                <span className="text-xs font-semibold text-slate-800 block truncate max-w-[120px]">
                  {userDisplayName}
                </span>
                <span className="text-[10px] text-indigo-600 font-mono uppercase block font-medium">
                  {userRoleName}
                </span>
              </div>
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                title="Sign Out"
                className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
