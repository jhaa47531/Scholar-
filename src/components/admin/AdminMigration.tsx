import React, { useState, useEffect } from 'react';
import { Database, Download, CheckCircle2, ShieldCheck, ArrowRight, Table } from 'lucide-react';
import { api } from '../../services/api.ts';
import { LoadingSkeleton } from '../common/LoadingSkeleton.tsx';

export const AdminMigration: React.FC = () => {
  const [migrationData, setMigrationData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.getMigrationOverview();
      if (res.success) {
        setMigrationData(res.data);
      } else {
        setErrorMsg(res.message || 'Failed loading migration overview.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error connecting to migration endpoint.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await api.exportMigrationJson();
    } catch (err: any) {
      alert(`Export error: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Database className="w-5 h-5 text-amber-400" />
            Oracle Enterprise Database Migration & Export
          </h1>
          <p className="mt-0.5 text-xs text-slate-400">
            Relational schema validation, table row parity checks, and authenticated checksummed JSON export.
          </p>
        </div>

        <button
          onClick={handleExport}
          disabled={isExporting}
          className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {isExporting ? 'Generating JSON...' : 'Export Checksummed JSON'}
        </button>
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={5} />
      ) : errorMsg ? (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
          {errorMsg}
        </div>
      ) : migrationData ? (
        <div className="space-y-6">
          {/* Status Banner */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                {migrationData.status}
              </span>
              <h3 className="text-sm font-semibold text-white mt-1">
                Decoupled Architecture Verification
              </h3>
              <p className="text-xs text-slate-400">
                Current driver: <span className="text-slate-200 font-mono">{migrationData.currentEngine}</span>.
                Target schema: <span className="text-amber-400 font-mono">{migrationData.targetEngine}</span>.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg shrink-0">
              <ShieldCheck className="w-4 h-4" />
              <span>DDL Ready & Schema Normalized</span>
            </div>
          </div>

          {/* Migration Checklist Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {migrationData.migrationChecklist.map((item: any) => (
              <div key={item.step} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-500">STEP 0{item.step}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    {item.status}
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-white">{item.title}</h4>
                <p className="text-[11px] text-slate-400 line-clamp-2">{item.detail}</p>
              </div>
            ))}
          </div>

          {/* Oracle Relational Table Mapping */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center justify-between">
              <span>Oracle 23c Relational Mapping Contract</span>
              <span className="text-[11px] text-slate-500">node-oracledb Driver Target</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-mono uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Firestore Collection</th>
                    <th className="py-3 px-4">Oracle Target Table</th>
                    <th className="py-3 px-4">Primary Key Column</th>
                    <th className="py-3 px-4 text-right">Target Row Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {migrationData.oracleTableMapping.map((map: any) => (
                    <tr key={map.oracleTable} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {map.firestoreCollection}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-amber-400">
                        {map.oracleTable}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">
                        {map.primaryKey}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-white">
                        {map.targetRowCount}
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
