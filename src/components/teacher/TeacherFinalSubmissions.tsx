import React, { useState, useEffect } from 'react';
import { FileCheck2, Lock, Eye, AlertCircle } from 'lucide-react';
import { SubjectMaster, TeacherAssignment } from '../../types/domain.ts';
import { EmptyState } from '../common/EmptyState.tsx';
import { LoadingSkeleton } from '../common/LoadingSkeleton.tsx';
import { api } from '../../services/api.ts';

interface TeacherFinalSubmissionsProps {
  assignments: TeacherAssignment[];
  subjects: SubjectMaster[];
  activeSessionId: string;
  onOpenMarksEntry: (subjectId: string) => void;
}

interface FinalSummaryItem {
  subject: SubjectMaster;
  sessionalNumber: number;
  finalCount: number;
  totalStudents: number;
  submittedAt: string;
}

export const TeacherFinalSubmissions: React.FC<TeacherFinalSubmissionsProps> = ({
  assignments,
  subjects,
  activeSessionId,
  onOpenMarksEntry,
}) => {
  const [finalSummaries, setFinalSummaries] = useState<FinalSummaryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubmissions();
  }, [assignments, subjects, activeSessionId]);

  const loadSubmissions = async () => {
    setLoading(true);
    const subjectMap = new Map(subjects.map((s) => [s.id, s]));
    const results: FinalSummaryItem[] = [];

    for (const asg of assignments) {
      const sub = subjectMap.get(asg.subjectId);
      if (!sub) continue;

      for (const sessionalNum of [1, 2]) {
        try {
          const res = await api.getTeacherSheet(sub.id, activeSessionId || 'sess_2025_26', sessionalNum);
          if (res.success && res.data && res.data.rows) {
            const finalRecords = res.data.rows.filter((r: any) => r.status === 'FINAL_SUBMITTED');
            if (finalRecords.length > 0) {
              results.push({
                subject: sub,
                sessionalNumber: sessionalNum,
                finalCount: finalRecords.length,
                totalStudents: res.data.rows.length,
                submittedAt: finalRecords[0]?.submittedAt || new Date().toISOString(),
              });
            }
          }
        } catch {
          // continue
        }
      }
    }

    setFinalSummaries(results);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-indigo-600" />
            Final Submitted Marks & Published Records
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Officially finalized evaluation sheets. These marks are verified, locked, and immediately visible to enrolled students.
          </p>
        </div>

        <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-2xs">
          Finalized Batches: <strong className="text-emerald-600 font-bold">{finalSummaries.length}</strong>
        </span>
      </div>

      {/* Submissions Grid */}
      {loading ? (
        <LoadingSkeleton rows={3} />
      ) : finalSummaries.length === 0 ? (
        <EmptyState
          title="No Finalized Submissions Yet"
          description="You haven't submitted any finalized evaluation sheets for this session. Use Marks Entry to review and submit drafts."
          icon={Lock}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {finalSummaries.map((item, idx) => (
            <div
              key={idx}
              className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-emerald-800 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                    {item.subject.subjectCode}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-mono font-semibold">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Locked & Published</span>
                  </div>
                </div>

                <h3 className="text-base font-semibold text-slate-900 mt-2.5">
                  {item.subject.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Degree: {item.subject.courseId.toUpperCase()} · Semester {item.subject.semester} · Sessional {item.sessionalNumber}
                </p>

                <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500">Enrolled Student Cohort:</span>
                  <span className="font-bold text-emerald-700">
                    {item.finalCount} of {item.totalStudents} Published
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">
                  Finalized on {new Date(item.submittedAt).toLocaleDateString()}
                </span>
                <button
                  onClick={() => onOpenMarksEntry(item.subject.id)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-indigo-600" />
                  View Sheet
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
