import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import {
  StudentProfile,
  AcademicSession,
  CourseStructure,
  SubjectMaster,
  SessionalOverallReport,
} from '../../types/domain.ts';
import { StatusBadge } from '../common/StatusBadge.tsx';
import { LoadingSkeleton } from '../common/LoadingSkeleton.tsx';
import { api } from '../../services/api.ts';

interface AdminReportsProps {
  students: StudentProfile[];
  sessions: AcademicSession[];
  activeSessionId?: string;
  courses?: CourseStructure[];
  subjects?: SubjectMaster[];
  onRefresh?: () => Promise<void> | void;
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
    if (!selectedStudentId || !selectedSessionId) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.getSessionalReport(selectedSessionId, selectedSessionalNum, selectedStudentId);
      if (res.success && res.data) {
        setReport(res.data);
      } else {
        setErrorMsg(res.message || 'Unable to retrieve sessional report.');
        setReport(null);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error loading report');
      setReport(null);
    } finally {
      setIsLoading(false);
    }
  };

  const currentStudent = students.find((s) => s.id === selectedStudentId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
            Institutional Performance Evaluation & Reports
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Generate official Sessional 1 & Sessional 2 evaluation records with frozen weight snapshots and prerequisite validation.
          </p>
        </div>
      </div>

      {/* Selector Controls */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="w-64">
          <label className="block text-[10px] font-mono text-slate-500 mb-1">SELECT STUDENT</label>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer"
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.rollNo})
              </option>
            ))}
          </select>
        </div>

        <div className="w-48">
          <label className="block text-[10px] font-mono text-slate-500 mb-1">SESSION</label>
          <select
            value={selectedSessionId}
            onChange={(e) => setSelectedSessionId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer"
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.sessionCode}
              </option>
            ))}
          </select>
        </div>

        <div className="w-36">
          <label className="block text-[10px] font-mono text-slate-500 mb-1">EXAMINATION TRACK</label>
          <select
            value={selectedSessionalNum}
            onChange={(e) => setSelectedSessionalNum(Number(e.target.value))}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer"
          >
            <option value={1}>Sessional 1 (S1)</option>
            <option value={2}>Sessional 2 (S2)</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={5} />
      ) : errorMsg ? (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      ) : report ? (
        <div className="space-y-6">
          {/* Eligibility Banner */}
          <div
            className={`p-5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              report.isEligibleForOverallReport
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-bold text-sm">
                {report.isEligibleForOverallReport ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                )}
                <span>
                  {report.isEligibleForOverallReport
                    ? 'Eligible for Definitive Overall Sessional Report'
                    : 'Report Generation Prerequisites Pending'}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                {report.isEligibleForOverallReport
                  ? 'All curriculum subjects have final-submitted scores and verified component breakdowns.'
                  : `Prerequisites missing: ${report.completionBlockers.join(' · ')}`}
              </p>
            </div>

            {report.overallAverageScore !== null && (
              <div className="text-right shrink-0">
                <span className="text-[10px] font-mono block text-slate-500 uppercase">
                  OVERALL PERFORMANCE SCORE
                </span>
                <span className="text-3xl font-extrabold font-mono tabular-nums text-slate-900">
                  {report.overallAverageScore.toFixed(2)}%
                </span>
              </div>
            )}
          </div>

          {/* Frozen Weights Specification Card */}
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs text-xs space-y-2">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block font-semibold">
              FROZEN WEIGHTS SPECIFICATION (VERSION {report.formulaVersion})
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center font-mono">
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block">EXAM (40%)</span>
                <span className="font-bold text-indigo-700">0.40 × M</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block">ATTENDANCE (20%)</span>
                <span className="font-bold text-sky-700">0.20 × A</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block">ASSIGNMENTS (15%)</span>
                <span className="font-bold text-emerald-700">0.15 × S</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block">PRESENTATION (15%)</span>
                <span className="font-bold text-purple-700">0.15 × R</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block">INTERACTION (10%)</span>
                <span className="font-bold text-amber-700">0.10 × I</span>
              </div>
            </div>
          </div>

          {/* Subject Scores Table */}
          <div className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">
              Curriculum Breakdown for {currentStudent?.name} ({currentStudent?.rollNo})
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-mono uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Exam Marks</th>
                    <th className="py-3 px-4">Attendance</th>
                    <th className="py-3 px-4">Submission Status</th>
                    <th className="py-3 px-4 text-right">Performance Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.subjectScores.map((score) => (
                    <tr key={score.subjectId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">
                          <span className="font-mono text-indigo-700 mr-2">{score.subjectCode}</span>
                          {score.subjectName}
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {score.isRequired ? 'Core Curriculum' : 'Elective'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums text-slate-700">
                        {score.obtainedMarks !== null ? (
                          <span>{score.obtainedMarks} / {score.maxMarks}</span>
                        ) : (
                          <span className="text-slate-400 italic">Unrecorded</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums text-slate-700">
                        {score.attendancePct !== null ? `${score.attendancePct}%` : 'N/A'}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={score.submissionStatus} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-sm tabular-nums">
                        {score.performanceScore !== null ? (
                          <span className="text-emerald-700">{score.performanceScore.toFixed(2)}%</span>
                        ) : (
                          <span className="text-slate-400 font-normal">Pending</span>
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
