import React, { useState, useEffect } from 'react';
import { FileEdit, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';
import { SubjectMaster, TeacherAssignment } from '../../types/domain.ts';
import { EmptyState } from '../common/EmptyState.tsx';
import { LoadingSkeleton } from '../common/LoadingSkeleton.tsx';
import { api } from '../../services/api.ts';

interface TeacherDraftsProps {
  assignments: TeacherAssignment[];
  subjects: SubjectMaster[];
  activeSessionId: string;
  onOpenMarksEntry: (subjectId: string) => void;
}

interface DraftSummaryItem {
  subject: SubjectMaster;
  sessionalNumber: number;
  draftCount: number;
  totalStudents: number;
  updatedAt: string;
}

export const TeacherDrafts: React.FC<TeacherDraftsProps> = ({
  assignments,
  subjects,
  activeSessionId,
  onOpenMarksEntry,
}) => {
  const [draftSummaries, setDraftSummaries] = useState<DraftSummaryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDrafts();
  }, [assignments, subjects, activeSessionId]);

  const loadDrafts = async () => {
    setLoading(true);
    const subjectMap = new Map(subjects.map((s) => [s.id, s]));
    const results: DraftSummaryItem[] = [];

    for (const asg of assignments) {
      const sub = subjectMap.get(asg.subjectId);
      if (!sub) continue;

      for (const sessionalNum of [1, 2]) {
        try {
          const res = await api.getTeacherSheet(sub.id, activeSessionId || 'sess_2025_26', sessionalNum);
          if (res.success && res.data && res.data.rows) {
            const drafts = res.data.rows.filter((r: any) => r.status === 'DRAFT');
            if (drafts.length > 0) {
              results.push({
                subject: sub,
                sessionalNumber: sessionalNum,
                draftCount: drafts.length,
                totalStudents: res.data.rows.length,
                updatedAt: res.data.rows[0]?.updatedAt || new Date().toISOString(),
              });
            }
          }
        } catch {
          // continue
        }
      }
    }

    setDraftSummaries(results);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileEdit className="w-5 h-5 text-indigo-600" />
            Unsubmitted Assessment Drafts
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Saved draft evaluation entries. Strictly hidden from student portal visibility until formal batch submission.
          </p>
        </div>

        <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-2xs">
          Pending Draft Batches: <strong className="text-indigo-600 font-bold">{draftSummaries.length}</strong>
        </span>
      </div>

      {/* Info Callout */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 space-y-1">
          <div className="font-bold text-amber-800">Draft Invisibility Invariant Active</div>
          <p className="text-slate-600">
            Students cannot view marks while they remain in DRAFT status. When you are ready to publish official scores to the student cohort, open the marks entry sheet and execute Final Submit Batch.
          </p>
        </div>
      </div>

      {/* Drafts List */}
      {loading ? (
        <LoadingSkeleton rows={3} />
      ) : draftSummaries.length === 0 ? (
        <EmptyState
          title="No Pending Assessment Drafts"
          description="All student assessment records for your assigned subjects are either up-to-date or already final submitted."
          icon={CheckCircle2}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {draftSummaries.map((item, idx) => (
            <div
              key={idx}
              className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-indigo-700 px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200">
                    {item.subject.subjectCode}
                  </span>
                  <span className="text-[11px] font-mono text-slate-600 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                    Sessional {item.sessionalNumber}
                  </span>
                </div>

                <h3 className="text-base font-semibold text-slate-900 mt-2.5">
                  {item.subject.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Degree: {item.subject.courseId.toUpperCase()} · Semester {item.subject.semester} · {item.subject.credits} Credits
                </p>

                <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500">Draft Records:</span>
                  <span className="font-bold text-indigo-700">
                    {item.draftCount} of {item.totalStudents} Students
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">
                  Last updated {new Date(item.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <button
                  onClick={() => onOpenMarksEntry(item.subject.id)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  Resume Draft Entry <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
