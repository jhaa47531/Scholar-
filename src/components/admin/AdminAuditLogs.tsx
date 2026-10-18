import React, { useState, useMemo } from 'react';
import { History, Search, Filter, ShieldCheck } from 'lucide-react';
import { AuditLogEntry } from '../../types/domain.ts';
import { StatusBadge } from '../common/StatusBadge.tsx';
import { EmptyState } from '../common/EmptyState.tsx';

interface AdminAuditLogsProps {
  logs: AuditLogEntry[];
}

export const AdminAuditLogs: React.FC<AdminAuditLogsProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('ALL');

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchSearch =
        log.actorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entityId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.reason && log.reason.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchEntity = selectedEntity === 'ALL' || log.entityType === selectedEntity;

      return matchSearch && matchEntity;
    });
  }, [logs, searchTerm, selectedEntity]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-amber-400" />
            Immutable Compliance Audit Trail
          </h1>
          <p className="mt-0.5 text-xs text-slate-400">
            Cryptographically sealed event logs of faculty mark entries, sessional configurations, and dean-authorized corrections.
          </p>
        </div>

        <div className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
          Recorded Events: <span className="font-bold text-amber-400 tabular-nums">{filteredLogs.length}</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by actor email, entity ID, or operation reason..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Entity Types</option>
            <option value="ASSESSMENT">Assessment Submissions</option>
            <option value="ASSIGNMENT">Faculty Assignments</option>
            <option value="SESSIONAL_CONFIG">Sessional Configurations</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      {filteredLogs.length === 0 ? (
        <EmptyState
          icon={History}
          title="No Audit Records"
          description="No institutional audit events match the current filter parameters."
        />
      ) : (
        <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Entity Type</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target Entity ID</th>
                  <th className="py-3 px-4">Authorizing Actor</th>
                  <th className="py-3 px-4">Audit Note & Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-400 whitespace-nowrap">
                      <div>{new Date(log.timestamp).toLocaleDateString()}</div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[11px]">
                        {log.entityType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={log.action} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-amber-400/90 truncate max-w-xs">
                      {log.entityId}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      <div>{log.actorId}</div>
                      <span className="text-[10px] text-slate-500 uppercase">{log.actorRole}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 max-w-sm">
                      <p className="line-clamp-2">{log.reason || 'Standard system write operation'}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
