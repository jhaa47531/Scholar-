import React from 'react';
import { X, ShieldCheck, History } from 'lucide-react';
import { AuditLogEntry } from '../../types/domain.ts';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  auditLogs: AuditLogEntry[];
  onNavigateToAudit?: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  auditLogs,
  onNavigateToAudit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 px-6 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-800 tracking-tight">System & Audit Notifications</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* List of Real Audit Events */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {auditLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No recent system activity recorded.
              </div>
            ) : (
              auditLogs.slice(0, 15).map((log) => {
                let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
                if (log.action === 'FINAL_SUBMIT') badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                if (log.action === 'CORRECTION') badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
                if (log.action === 'CREATE') badgeColor = 'bg-sky-50 text-sky-700 border-sky-200';

                return (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${badgeColor}`}>
                        {log.action}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-800 font-medium">
                      {log.reason || `${log.entityType} state updated`}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1 border-t border-slate-200/60">
                      <span>Entity: {log.entityType}</span>
                      <span>By: {log.actorId}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {onNavigateToAudit && (
            <div className="p-4 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => {
                  onClose();
                  onNavigateToAudit();
                }}
                className="w-full py-2 px-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <History className="w-3.5 h-3.5" />
                View Complete Compliance Audit Trail
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
