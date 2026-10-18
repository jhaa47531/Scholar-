import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, CheckCircle2, AlertTriangle, Search, Award } from 'lucide-react';
import { AcademicSession, SessionalOverallReport, StudentProfile } from '../../types/domain.ts';
import { api } from '../../services/api.ts';
import { StatusBadge } from '../common/StatusBadge.tsx';
import { EmptyState } from '../common/EmptyState.tsx';
import { LoadingSkeleton } from '../common/LoadingSkeleton.tsx';

interface AdminReportsProps {
  students: StudentProfile[];
  sessions: AcademicSession[];
  activeSessionId: string;
}

export const AdminReports: React.FC<AdminReportsProps> = ({
  students,
  sessions,
  activeSessionId,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');
  const [selectedSessionId, setSelectedSessionId] = useState(activeSessionId || sessions[0]?.id || '');
  const [selectedSessionalNum, setSelectedSessionalNum] = useState<number>(1);
  const [report, setReport] = useState<SessionalOverallReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (selectedStudentId && selectedSessionId) {
      loadReport();
    }
  }, [selectedStudentId, selectedSessionId, selectedSessionalNum]);

  const loadReport = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.getSessionalReport(selectedSessionId, selectedSessionalNum, selectedStudentId);
      if (res.success && res.data) {
        setReport(res.data);
      } else {
        setReport(null);
        setErrorMsg(res.message || 'Unable to generate sessional report for selected student.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error fetching report.');
    } finally {
      setIsLoading(false);
    }
  };

  const currentStudent = students.find((s) => s.id === selectedStudentId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-amber-400" />
            Institutional Performance Evaluation & Reports
          </h1>
          <p className="mt-0.5 text-xs text-slate-400">
            Generate official Sessional 1 & Sessional 2 evaluation records with frozen weight snapshots and prerequisite validation.
          </p>
        </div>
      </div>

      {/* Selector Controls */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center gap-3">
        <div className="w-64">
          <label className="block text-[10px] font-mono text-slate-400 mb-1">SELECT STUDENT</label>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none cursor-pointer"
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.rollNo})
              </option>
            ))}
          </select>
        </div>

        <div className="w-48">
          <label className="block text-[10px] font-mono text-slate-400 mb-1">SESSION</label>
          <select
            value={selectedSessionId}
            onChange={(e) => setSelectedSessionId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none cursor-pointer"
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.sessionCode}
              </option>
            ))}
          </select>
        </div>

        <div className="w-36">
          <label className="block text-[10px] font-mono text-slate-400 mb-1">EXAMINATION TRACK</label>
          <select
            value={selectedSessionalNum}
            onChange={(e) => setSelectedSessionalNum(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value={1}>Sessional 1 (S1)</option>
            <option value={2}>Sessional 2 (S2)</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={5} />
      ) : errorMsg ? (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      ) : report ? (
        <div className="space-y-6">
          {/* Eligibility Banner */}
          <div
            className={`p-5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              report.isEligibleForOverallReport
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-bold text-sm">
                {report.isEligibleForOverallReport ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                )}
                <span>
                  {report.isEligibleForOverallReport
                    ? 'Eligible for Definitive Overall Sessional Report'
                    : 'Report Generation Prerequisites Pending'}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {report.isEligibleForOverallReport
                  ? 'All curriculum subjects have final-submitted scores and verified component breakdowns.'
                  : `Prerequisites missing: ${report.completionBlockers.join(' · ')}`}
              </p>
            </div>

            {report.overallAverageScore !== null && (
              <div className="text-right shrink-0">
                <span className="text-[10px] font-mono block text-slate-400 uppercase">
                  OVERALL PERFORMANCE SCORE
                </span>
                <span className="text-3xl font-extrabold font-mono tabular-nums text-white">
                  {report.overallAverageScore.toFixed(2)}%
                </span>
              </div>
            )}
          </div>

          {/* Frozen Weights Specification Card */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block font-semibold">
              FROZEN WEIGHTS SPECIFICATION (VERSION {report.formulaVersion})
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center font-mono">
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-850">
                <span className="text-[10px] text-slate-400 block">EXAM (40%)</span>
                <span className="font-bold text-amber-400">0.40 × M</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-850">
                <span className="text-[10px] text-slate-400 block">ATTENDANCE (20%)</span>
                <span className="font-bold text-sky-400">0.20 × A</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-850">
                <span className="text-[10px] text-slate-400 block">ASSIGNMENTS (15%)</span>
                <span className="font-bold text-emerald-400">0.15 × S</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-850">
                <span className="text-[10px] text-slate-400 block">PRESENTATION (15%)</span>
                <span className="font-bold text-purple-400">0.15 × R</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-850">
                <span className="text-[10px] text-slate-400 block">INTERACTION (10%)</span>
                <span className="font-bold text-indigo-400">0.10 × I</span>
              </div>
            </div>
          </div>

          {/* Subject Scores Table */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Curriculum Breakdown for {currentStudent?.name} ({currentStudent?.rollNo})
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-mono uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Exam Marks</th>
                    <th className="py-3 px-4">Attendance</th>
                    <th className="py-3 px-4">Submission Status</th>
                    <th className="py-3 px-4 text-right">Performance Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {report.subjectScores.map((score) => (
                    <tr key={score.subjectId} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">
                          <span className="font-mono text-amber-400 mr-2">{score.subjectCode}</span>
                          {score.subjectName}
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {score.isRequired ? 'Core Curriculum' : 'Elective'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums text-slate-300">
                        {score.obtainedMarks !== null ? (
                          <span>{score.obtainedMarks} / {score.maxMarks}</span>
                        ) : (
                          <span className="text-slate-500 italic">Unrecorded</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums text-slate-300">
                        {score.attendancePct !== null ? `${score.attendancePct}%` : 'N/A'}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={score.submissionStatus} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-sm tabular-nums">
                        {score.performanceScore !== null ? (
                          <span className="text-emerald-400">{score.performanceScore.toFixed(2)}%</span>
                        ) : (
                          <span className="text-slate-500 font-normal">Pending</span>
                        )}
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
