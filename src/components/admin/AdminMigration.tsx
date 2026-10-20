import React, { useState, useEffect } from 'react';
import { Database, Download, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { LoadingSkeleton } from '../common/LoadingSkeleton.tsx';
import { api } from '../../services/api.ts';

interface AdminMigrationProps {
  onRefresh?: () => Promise<void> | void;
}

export const AdminMigration: React.FC<AdminMigrationProps> = () => {
  const [migrationData, setMigrationData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadMigrationPlan();
  }, []);

  const loadMigrationPlan = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.getMigrationPlan();
      if (res.success && res.data) {
        setMigrationData(res.data);
      } else {
        setErrorMsg(res.message || 'Unable to load migration readiness report.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error fetching migration status');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadJsonExport = () => {
    if (!migrationData) return;
    const blob = new Blob([JSON.stringify(migrationData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scholarsense-spis-migration-contract-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            Decoupled Architecture & Migration Readiness
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Repository Pattern verification and schema contract for zero-downtime transition to Oracle 23c / PostgreSQL.
          </p>
        </div>

        <button
          onClick={downloadJsonExport}
          disabled={!migrationData}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export Schema Contract</span>
        </button>
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={5} />
      ) : errorMsg ? (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
          {errorMsg}
        </div>
      ) : migrationData ? (
        <div className="space-y-6">
          {/* Status Banner */}
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                {migrationData.status}
              </span>
              <h3 className="text-sm font-semibold text-slate-900 mt-1">
                Decoupled Architecture Verification
              </h3>
              <p className="text-xs text-slate-500">
                Current driver: <span className="text-slate-800 font-mono font-medium">{migrationData.currentEngine}</span>.
                Target schema: <span className="text-indigo-700 font-mono font-medium">{migrationData.targetEngine}</span>.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg shrink-0">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>DDL Ready & Schema Normalized</span>
            </div>
          </div>

          {/* Migration Checklist Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {migrationData.migrationChecklist.map((item: any) => (
              <div key={item.step} className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400">STEP 0{item.step}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                    {item.status}
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-slate-900">{item.title}</h4>
                <p className="text-[11px] text-slate-500 line-clamp-2">{item.detail}</p>
              </div>
            ))}
          </div>

          {/* Relational Table Mapping */}
          <div className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold flex items-center justify-between">
              <span>Oracle 23c / PostgreSQL Relational Mapping Contract</span>
              <span className="text-[11px] text-slate-400">Database Driver Target</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-mono uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Firestore Collection</th>
                    <th className="py-3 px-4">Relational Target Table</th>
                    <th className="py-3 px-4">Primary Key Column</th>
                    <th className="py-3 px-4 text-right">Target Row Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {migrationData.oracleTableMapping.map((map: any) => (
                    <tr key={map.oracleTable} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {map.firestoreCollection}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                        {map.oracleTable}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {map.primaryKey}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-800">
                        {map.rowCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
