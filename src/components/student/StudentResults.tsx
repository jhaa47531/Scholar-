import React, { useState } from 'react';
import { Award, CheckCircle2, AlertCircle, FileSpreadsheet, Layers, ShieldCheck, Filter } from 'lucide-react';
import { ExamAttendance, SessionalNumber, SubmissionStatus } from '../../types/domain.ts';
import { EmptyState } from '../common/EmptyState.tsx';

interface StudentResultsProps {
  marksData: any[];
  studentName: string;
  studentRoll: string;
}

export const StudentResults: React.FC<StudentResultsProps> = ({
  marksData,
  studentName,
  studentRoll,
}) => {
  const [selectedSessional, setSelectedSessional] = useState<'ALL' | '1' | '2'>('ALL');

  const filteredMarks = marksData.filter((rec) => {
    if (selectedSessional === 'ALL') return true;
    return rec.sessionalNumber?.toString() === selectedSessional;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#162740]">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            Official Sessional Assessment Results
          </h1>
          <p className="mt-0.5 text-xs text-slate-400">
            Verified academic performance records finalized by faculty instructors. Drafts remain securely excluded.
          </p>
        </div>

        {/* Filter Segmented Control */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => setSelectedSessional('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              selectedSessional === 'ALL'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Tracks
          </button>
          <button
            onClick={() => setSelectedSessional('1')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              selectedSessional === '1'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sessional 1
          </button>
          <button
            onClick={() => setSelectedSessional('2')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              selectedSessional === '2'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sessional 2
          </button>
        </div>
      </div>

      {filteredMarks.length === 0 ? (
        <EmptyState
          title="No Final Submitted Results Available"
          description="There are currently no finalized marks published for your student profile. Any evaluation drafts created by your instructors remain securely hidden until official batch publication."
          icon={FileSpreadsheet}
        />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMarks.map((rec: any) => {
              const isAbsent = rec.examAttendance === ExamAttendance.NOT_ATTENDED;
              const perfScore = rec.calculation?.performanceScore;

              return (
                <div
                  key={rec.id}
                  className="surface-navy rounded-xl p-5 border border-[#192b45] card-3d flex flex-col justify-between gap-4"
                >
                  <div>
                    {/* Top Subject Tag & Status */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                        {rec.subject?.subjectCode || 'SUBJECT'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          Sessional {rec.sessionalNumber}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                          FINAL PUBLISHED
                        </span>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-white mt-2">
                      {rec.subject?.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Semester {rec.subject?.semester} · {rec.subject?.credits} Credits · {rec.subject?.isRequired ? 'Core Curriculum' : 'Elective'}
                    </p>

                    {/* Breakdown Matrix */}
                    <div className="grid grid-cols-3 gap-2.5 bg-slate-900/90 border border-slate-800 rounded-xl p-3 mt-4 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold">
                          Exam (40%)
                        </span>
                        <span className="font-mono font-bold text-white text-sm">
                          {isAbsent ? (
                            <span className="text-rose-400">0 (Absent)</span>
                          ) : (
                            `${rec.obtainedMarks} / ${rec.maxMarks}`
                          )}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold">
                          Class Att (20%)
                        </span>
                        <span className="font-mono font-bold text-slate-200 text-sm">
                          {rec.classAttendancePct ?? 'N/A'}%
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold">
                          Total Weighted
                        </span>
                        <span className="font-mono font-extrabold text-amber-400 text-sm">
                          {perfScore !== undefined ? `${perfScore}%` : 'Incomplete'}
                        </span>
                      </div>
                    </div>

                    {/* Secondary Component Breakdown */}
                    <div className="grid grid-cols-3 gap-2 mt-2 px-1 text-[11px] text-slate-400 font-mono">
                      <div>Assignment: {rec.assignmentScore ?? 'N/A'}%</div>
                      <div>Presentation: {rec.presentationScore ?? 'N/A'}%</div>
                      <div>Interaction: {rec.classInteractionScore ?? 'N/A'}%</div>
                    </div>
                  </div>

                  {/* Footer Invariants */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>Formula: {rec.calculation?.formulaVersion || 'v1.0'}</span>
                    <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" /> Published Record
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
