import React, { useState, useEffect } from 'react';
import { FileCheck2, Lock, Eye, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { AcademicSession, SubjectMaster, TeacherAssignment } from '../../types/domain.ts';
import { api } from '../../services/api.ts';
import { EmptyState } from '../common/EmptyState.tsx';
import { LoadingSkeleton } from '../common/LoadingSkeleton.tsx';

interface TeacherFinalSubmissionsProps {
  assignments: TeacherAssignment[];
  subjects: SubjectMaster[];
  sessions: AcademicSession[];
  activeSessionId: string;
  onOpenMarksEntry: (subjectId: string) => void;
}

export const TeacherFinalSubmissions: React.FC<TeacherFinalSubmissionsProps> = ({
  assignments,
  subjects,
  sessions,
  activeSessionId,
  onOpenMarksEntry,
}) => {
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const myAssignedSubjects = assignments.map((a) => subjectMap.get(a.subjectId)).filter(Boolean) as SubjectMaster[];

  const [loading, setLoading] = useState(false);
  const [finalSummaries, setFinalSummaries] = useState<any[]>([]);

  useEffect(() => {
    loadFinalized();
  }, [assignments, activeSessionId]);

  const loadFinalized = async () => {
    setLoading(true);
    try {
      const summaries: any[] = [];
      for (const sub of myAssignedSubjects) {
        for (const sessionalNum of [1, 2]) {
          const res = await api.getTeacherSheet(sub.id, activeSessionId, sessionalNum);
          if (res.success && res.data) {
            const finalRows = res.data.rows.filter((r: any) => r.assessment.submissionStatus === 'FINAL_SUBMITTED');
            if (finalRows.length > 0) {
              summaries.push({
                subject: sub,
                sessionalNumber: sessionalNum,
                finalCount: finalRows.length,
                totalStudents: res.data.rows.length,
                submittedAt: finalRows[0]?.assessment?.finalSubmittedAt || new Date().toISOString(),
              });
            }
          }
        }
      }
      setFinalSummaries(summaries);
    } catch (err) {
      console.error('Error fetching final summaries:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#162740]">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-emerald-400" />
            Final Submitted Marks & Published Records
          </h1>
          <p className="mt-0.5 text-xs text-slate-400">
            Officially finalized evaluation sheets. These marks are verified, locked, and immediately visible to enrolled students.
          </p>
        </div>

        <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
          Finalized Batches: <strong className="text-emerald-400 font-bold">{finalSummaries.length}</strong>
        </span>
      </div>

      {/* Submissions Grid */}
      {loading ? (
        <LoadingSkeleton count={3} height="h-24" />
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
              className="p-5 rounded-xl surface-navy card-3d border border-emerald-500/25 flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                    {item.subject.subjectCode}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-mono">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Locked & Published</span>
                  </div>
                </div>

                <h3 className="text-base font-semibold text-white mt-2.5">
                  {item.subject.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Degree: {item.subject.courseId.toUpperCase()} · Semester {item.subject.semester} · Sessional {item.sessionalNumber}
                </p>

                <div className="mt-4 p-3 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Enrolled Student Cohort:</span>
                  <span className="font-bold text-emerald-400">
                    {item.finalCount} of {item.totalStudents} Published
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">
                  Finalized on {new Date(item.submittedAt).toLocaleDateString()}
                </span>
                <button
                  onClick={() => onOpenMarksEntry(item.subject.id)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
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
