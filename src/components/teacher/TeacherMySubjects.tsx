import React from 'react';
import { BookOpen, FileSpreadsheet } from 'lucide-react';
import { SubjectMaster, TeacherAssignment } from '../../types/domain.ts';
import { StatusBadge } from '../common/StatusBadge.tsx';
import { EmptyState } from '../common/EmptyState.tsx';

interface TeacherMySubjectsProps {
  assignments: TeacherAssignment[];
  subjects: SubjectMaster[];
  onOpenMarksEntry: (subjectId: string, sessionalNumber: number) => void;
}

export const TeacherMySubjects: React.FC<TeacherMySubjectsProps> = ({
  assignments,
  subjects,
  onOpenMarksEntry,
}) => {
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const mySubjects = assignments.map((a) => ({
    assignment: a,
    subject: subjectMap.get(a.subjectId),
  })).filter((item) => item.subject !== undefined) as { assignment: TeacherAssignment; subject: SubjectMaster }[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            My Assigned Teaching Curriculum
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Institutional subjects you are officially assigned to teach and grade for the active academic session.
          </p>
        </div>

        <div className="text-xs font-mono px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-2xs">
          Allocated Subjects: <span className="font-bold text-indigo-600 tabular-nums">{mySubjects.length}</span>
        </div>
      </div>

      {mySubjects.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No Subjects Assigned"
          description="You currently have no curriculum subjects assigned for this academic session. Please contact the Academic Admin to allocate subjects."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mySubjects.map(({ assignment, subject }) => (
            <div
              key={subject.id}
              className="p-5 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 shadow-xs transition-all space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-indigo-700 px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200">
                      {subject.subjectCode}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      Semester {subject.semester}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 mt-2 leading-tight">
                    {subject.name}
                  </h3>
                </div>
                <StatusBadge status="ACTIVE" size="sm" />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 text-xs font-mono">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">CREDITS</span>
                  <span className="font-bold text-slate-800">{subject.credits} Credits</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">PROGRAMME</span>
                  <span className="font-bold text-slate-800">{subject.courseId.toUpperCase()}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">TYPE</span>
                  <span className="font-bold text-slate-800">{subject.isRequired ? 'Core' : 'Elective'}</span>
                </div>
              </div>

              {/* Action Buttons for S1 and S2 */}
              <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                <button
                  onClick={() => onOpenMarksEntry(subject.id, 1)}
                  className="flex-1 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                  Grade S1 Exam
                </button>
                <button
                  onClick={() => onOpenMarksEntry(subject.id, 2)}
                  className="flex-1 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                  Grade S2 Exam
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
