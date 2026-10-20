import React, { useState, useMemo } from 'react';
import { History, Search, Filter } from 'lucide-react';
import { AuditLogEntry } from '../../types/domain.ts';
import { StatusBadge } from '../common/StatusBadge.tsx';
import { EmptyState } from '../common/EmptyState.tsx';

interface AdminAuditLogsProps {
  logs?: AuditLogEntry[];
  auditLogs?: AuditLogEntry[];
  onRefresh?: () => Promise<void> | void;
}

export const AdminAuditLogs: React.FC<AdminAuditLogsProps> = ({ logs, auditLogs }) => {
  const allLogs = logs || auditLogs || [];
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('ALL');

  const filteredLogs = useMemo(() => {
    return allLogs.filter((log) => {
      const matchSearch =
        log.actorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entityId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.reason || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchEntity = selectedEntity === 'ALL' || log.entityType === selectedEntity;

      return matchSearch && matchEntity;
    });
  }, [allLogs, searchTerm, selectedEntity]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            Immutable Compliance Audit Trail
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Cryptographically sealed event logs of faculty mark entries, sessional configurations, enrollments, and dean-authorized operations.
          </p>
        </div>

        <div className="text-xs font-mono px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-2xs">
          Recorded Events: <span className="font-bold text-indigo-600 tabular-nums">{filteredLogs.length}</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by actor email, entity ID, or operation reason..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer"
          >
            <option value="ALL">All Entity Types</option>
            <option value="ASSESSMENT">Assessment Submissions</option>
            <option value="ASSIGNMENT">Faculty Assignments</option>
            <option value="SESSIONAL_CONFIG">Sessional Configurations</option>
            <option value="ENROLLMENT">Enrollments</option>
            <option value="USER">User & Course Structures</option>
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
        <div className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-mono uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Entity Type</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target Entity ID</th>
                  <th className="py-3 px-4">Authorizing Actor</th>
                  <th className="py-3 px-4">Audit Note & Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                      <div className="font-medium text-slate-700">{new Date(log.timestamp).toLocaleDateString()}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
                        {log.entityType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={log.action} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 font-mono text-indigo-700 font-semibold">
                      {log.entityId}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{log.actorId}</div>
                      <div className="text-[10px] text-slate-400 font-mono uppercase">
                        {log.actorRole}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-sm">
                      {log.reason}
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
