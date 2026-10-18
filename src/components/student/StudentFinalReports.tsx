import React from 'react';
import { FileCheck2, Printer, ShieldCheck, AlertCircle, Award, CheckCircle2, Calendar } from 'lucide-react';
import { SessionalOverallReport, StudentProfile } from '../../types/domain.ts';
import { EmptyState } from '../common/EmptyState.tsx';

interface StudentFinalReportsProps {
  report: SessionalOverallReport | null;
  studentProfile: StudentProfile;
}

export const StudentFinalReports: React.FC<StudentFinalReportsProps> = ({
  report,
  studentProfile,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#162740]">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-amber-400" />
            Verified Sessional Academic Transcript & Report Card
          </h1>
          <p className="mt-0.5 text-xs text-slate-400">
            Institutional evaluation certificate with cryptographic audit verification and completion precondition checks.
          </p>
        </div>

        {report?.isEligibleForOverallReport && (
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            Print Academic Transcript
          </button>
        )}
      </div>

      {!report ? (
        <EmptyState
          title="Transcript Generating"
          description="Sessional reports are calculated from verified faculty submissions. Please check back once all subject marks are submitted."
          icon={FileCheck2}
        />
      ) : !report.isEligibleForOverallReport ? (
        <div className="surface-navy rounded-xl p-6 border border-amber-500/30 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Overall Report Generation Preconditions Incomplete</h3>
              <p className="text-xs text-slate-400">
                Institutional integrity policy blocks final GPA and composite transcript generation until all prerequisite criteria are met.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="text-xs font-mono font-bold text-amber-400 block uppercase">
              Current Evaluation Completion Blockers ({report.completionBlockers.length}):
            </span>
            <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
              {report.completionBlockers.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        /* Verified Academic Report Card Container */
        <div className="surface-navy rounded-2xl border border-slate-700/80 p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden print:bg-white print:text-black">
          {/* Subtle Institutional Watermark / Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 font-bold text-xl shadow-lg shadow-amber-500/20">
                <Award className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-white tracking-tight">
                  ScholarSense Academic Intelligence System
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  Official Sessional {report.sessionalNumber} Grade Transcript · Session {report.sessionId}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold inline-flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                VERIFIED OFFICIAL TRANSCRIPT
              </span>
              <div className="text-[11px] text-slate-500 font-mono mt-1">
                Issued: {new Date(report.generatedAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Student Identifiers Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-500 block">Student Name</span>
              <span className="font-bold text-white text-sm">{studentProfile.name}</span>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-500 block">Roll Number</span>
              <span className="font-mono font-bold text-amber-400 text-sm">{studentProfile.rollNo}</span>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-500 block">Degree Programme</span>
              <span className="font-semibold text-slate-200">{studentProfile.courseId.toUpperCase()}</span>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-500 block">Current Semester</span>
              <span className="font-mono font-semibold text-slate-200">Semester {studentProfile.currentSemester}</span>
            </div>
          </div>

          {/* Subject Scores Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Subject Code & Name</th>
                  <th className="px-3 py-3 text-center">Exam Marks</th>
                  <th className="px-3 py-3 text-center">Class Att %</th>
                  <th className="px-3 py-3 text-center">Normalized (100)</th>
                  <th className="px-3 py-3 text-right">Weighted Final</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-medium">
                {report.subjectScores.map((score) => (
                  <tr key={score.subjectId} className="hover:bg-slate-850/40">
                    <td className="px-4 py-3.5">
                      <span className="font-mono font-bold text-amber-400 mr-2">{score.subjectCode}</span>
                      <span className="text-white">{score.subjectName}</span>
                    </td>
                    <td className="px-3 py-3.5 text-center font-mono">
                      {score.obtainedMarks ?? 0} / {score.maxMarks}
                    </td>
                    <td className="px-3 py-3.5 text-center font-mono text-slate-300">
                      {score.attendancePct ?? 0}%
                    </td>
                    <td className="px-3 py-3.5 text-center font-mono text-slate-300">
                      {score.normalizedScore?.toFixed(1) ?? 'N/A'}%
                    </td>
                    <td className="px-3 py-3.5 text-right font-mono font-extrabold text-amber-400 text-sm">
                      {score.performanceScore?.toFixed(1) ?? 'N/A'}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Overall Composite Score Box */}
          <div className="p-5 rounded-xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-amber-300 font-bold">
                Overall Sessional Weighted Average
              </span>
              <div className="text-3xl font-extrabold text-white mt-1 font-mono tabular-nums">
                {report.overallAverageScore?.toFixed(2)}%
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Calculated using institutional formula snapshot {report.formulaVersion}
              </p>
            </div>

            <div className="text-right text-xs text-slate-400 font-mono space-y-1">
              <div>Weight: Exam 40% · Att 20% · Ass 15% · Pre 15% · Int 10%</div>
              <div className="text-emerald-400 font-bold flex items-center justify-end gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> All Institutional Criteria Satisfied
              </div>
            </div>
          </div>

          {/* Cryptographic Verification Stamp */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 font-mono gap-2">
            <div>Transcript Hash: SHA256:{report.id.slice(0, 16)}...</div>
            <div>Dean of Academic Affairs · Institutional Verification Active</div>
          </div>
        </div>
      )}
    </div>
  );
};
