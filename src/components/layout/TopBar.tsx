import React from 'react';
import { AcademicSession } from '../../types/domain.ts';
import { Calendar, ChevronDown, Bell, CheckCircle2 } from 'lucide-react';

interface TopBarProps {
  breadcrumbs: string[];
  sessions: AcademicSession[];
  selectedSessionId: string;
  onSelectSession: (sessionId: string) => void;
  userRoleName: string;
  systemHealthStatus?: string;
  persistenceMode?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  breadcrumbs,
  sessions,
  selectedSessionId,
  onSelectSession,
  userRoleName,
  systemHealthStatus = 'HEALTHY',
  persistenceMode = 'CLOUD_FIRESTORE',
}) => {
  return (
    <header className="h-16 px-6 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between gap-6 shrink-0 z-20">
      {/* Zone 1: Breadcrumb Trail */}
      <div className="flex items-center gap-2 text-xs text-slate-400 font-medium overflow-hidden">
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <span className="text-slate-600 font-mono">/</span>}
            <span
              className={
                idx === breadcrumbs.length - 1
                  ? 'text-slate-100 font-semibold truncate'
                  : 'text-slate-400 hover:text-slate-200 transition-colors truncate'
              }
            >
              {crumb}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* Zone 2 & 3: Contextual Controls & Active Session */}
      <div className="flex items-center gap-4 shrink-0">
        {/* Persistence Status */}
        <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>{persistenceMode === 'CLOUD_FIRESTORE' ? 'Cloud Firestore' : 'In-Memory'}</span>
        </div>

        {/* Academic Session Selector */}
        {sessions.length > 0 && (
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={selectedSessionId}
              onChange={(e) => onSelectSession(e.target.value)}
              className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer pr-2"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-slate-200">
                  {s.sessionCode} ({s.title})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </header>
  );
};
