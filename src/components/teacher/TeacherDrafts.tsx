import React, { useState, useEffect } from 'react';
import { FileEdit, ArrowRight, ShieldAlert, BookOpen, Clock, CheckCircle2 } from 'lucide-react';
import { AcademicSession, SubjectMaster, TeacherAssignment } from '../../types/domain.ts';
import { api } from '../../services/api.ts';
import { EmptyState } from '../common/EmptyState.tsx';
import { LoadingSkeleton } from '../common/LoadingSkeleton.tsx';

interface TeacherDraftsProps {
  assignments: TeacherAssignment[];
  subjects: SubjectMaster[];
  sessions: AcademicSession[];
  activeSessionId: string;
  onOpenMarksEntry: (subjectId: string) => void;
}

export const TeacherDrafts: React.FC<TeacherDraftsProps> = ({
  assignments,
  subjects,
  sessions,
  activeSessionId,
  onOpenMarksEntry,
}) => {
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const myAssignedSubjects = assignments.map((a) => subjectMap.get(a.subjectId)).filter(Boolean) as SubjectMaster[];

  const [loading, setLoading] = useState(false);
  const [draftSummaries, setDraftSummaries] = useState<any[]>([]);

  useEffect(() => {
    loadDrafts();
  }, [assignments, activeSessionId]);

  const loadDrafts = async () => {
    setLoading(true);
    try {
      const summaries: any[] = [];
      for (const sub of myAssignedSubjects) {
        for (const sessionalNum of [1, 2]) {
          const res = await api.getTeacherSheet(sub.id, activeSessionId, sessionalNum);
          if (res.success && res.data) {
            const draftRows = res.data.rows.filter((r: any) => r.assessment.submissionStatus === 'DRAFT');
            if (draftRows.length > 0) {
              summaries.push({
                subject: sub,
                sessionalNumber: sessionalNum,
                draftCount: draftRows.length,
                totalStudents: res.data.rows.length,
                maxMarks: res.data.config.maxMarks,
                updatedAt: draftRows[0]?.assessment?.updatedAt || new Date().toISOString(),
              });
            }
          }
        }
      }
      setDraftSummaries(summaries);
    } catch (err) {
      console.error('Error fetching draft summaries:', err);
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
            <FileEdit className="w-5 h-5 text-amber-400" />
            Unsubmitted Assessment Drafts
          </h1>
          <p className="mt-0.5 text-xs text-slate-400">
            Saved draft evaluation entries. Strictly hidden from student portal visibility until formal batch submission.
          </p>
        </div>

        <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
          Pending Draft Batches: <strong className="text-amber-400 font-bold">{draftSummaries.length}</strong>
        </span>
      </div>

      {/* Info Callout */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-200 space-y-1">
          <div className="font-bold text-amber-300">Draft Invisibility Invariant Active</div>
          <p className="text-slate-300">
            Students cannot view marks while they remain in DRAFT status. When you are ready to publish official scores to the student cohort, open the marks entry sheet and execute Final Submit Batch.
          </p>
        </div>
      </div>

      {/* Drafts List */}
      {loading ? (
        <LoadingSkeleton count={3} height="h-24" />
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
              className="p-5 rounded-xl surface-navy card-3d border border-[#192b45] flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                    {item.subject.subjectCode}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-800">
                    Sessional {item.sessionalNumber}
                  </span>
                </div>

                <h3 className="text-base font-semibold text-white mt-2.5">
                  {item.subject.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Degree: {item.subject.courseId.toUpperCase()} · Semester {item.subject.semester} · {item.subject.credits} Credits
                </p>

                <div className="mt-4 p-3 rounded-lg bg-slate-900/90 border border-slate-800/80 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Draft Records:</span>
                  <span className="font-bold text-amber-400">
                    {item.draftCount} of {item.totalStudents} Students
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-mono">
                  Last updated {new Date(item.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <button
                  onClick={() => onOpenMarksEntry(item.subject.id)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer font-sans"
                >
                  Resume Grading <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
