import React from 'react';
import {
  BookOpen,
  FileSpreadsheet,
  FileEdit,
  History,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { KpiCard } from '../common/KpiCard.tsx';
import {
  AcademicSession,
  SubjectMaster,
  TeacherAssignment,
  TeacherProfile,
} from '../../types/domain.ts';

interface TeacherOverviewProps {
  teacher: TeacherProfile;
  assignments: TeacherAssignment[];
  subjects: SubjectMaster[];
  activeSession: AcademicSession | undefined;
  onNavigate: (pageId: string) => void;
  onSelectSubjectForGrading: (subjectId: string) => void;
}

export const TeacherOverview: React.FC<TeacherOverviewProps> = ({
  teacher,
  assignments,
  subjects,
  activeSession,
  onNavigate,
  onSelectSubjectForGrading,
}) => {
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const myAssignedSubjects = assignments.map((a) => subjectMap.get(a.subjectId)).filter(Boolean) as SubjectMaster[];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase tracking-wider text-indigo-700 font-bold">
              Faculty Instructor Portal
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500 font-mono">{teacher.employeeCode}</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Welcome back, {teacher.name}
          </h1>
          <p className="mt-1 text-xs text-slate-500 max-w-2xl">
            {teacher.designation} · Department of {teacher.department}. Active session:{' '}
            <span className="text-slate-800 font-semibold">{activeSession?.title || 'Academic Year 2025-2026'}</span>.
          </p>
        </div>

        <button
          onClick={() => onNavigate('marks_entry')}
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Open Assessment Entry Sheet
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="ASSIGNED SUBJECTS"
          value={myAssignedSubjects.length}
          subtitle="Curriculum subjects for current session"
          icon={BookOpen}
          onClick={() => onNavigate('my_subjects')}
          badge="Authorized"
        />
        <KpiCard
          title="ACTIVE WORKFLOW TRACKS"
          value="2 Sessional"
          subtitle="S1 & S2 configured for BCA"
          icon={FileSpreadsheet}
          onClick={() => onNavigate('marks_entry')}
        />
        <KpiCard
          title="DRAFT REPOSITORY"
          value="Private"
          subtitle="Strictly hidden from students"
          icon={FileEdit}
          onClick={() => onNavigate('drafts')}
        />
        <KpiCard
          title="CORRECTION AUDIT"
          value="Secured"
          subtitle="Dean-authorized modification log"
          icon={History}
          onClick={() => onNavigate('corrections')}
        />
      </div>

      {/* Assigned Subjects Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-mono uppercase tracking-wider text-slate-600 font-bold">
            My Authorized Teaching Subjects ({myAssignedSubjects.length})
          </h2>
          <button
            onClick={() => onNavigate('my_subjects')}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
          >
            View All Subjects <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myAssignedSubjects.map((sub) => (
            <div
              key={sub.id}
              className="p-5 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 shadow-xs transition-all flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-indigo-700 px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200">
                    {sub.subjectCode}
                  </span>
                  <span className="text-xs text-slate-500 font-mono tabular-nums">
                    Sem {sub.semester} · {sub.credits} Credits
                  </span>
                </div>
                <h3 className="text-base font-semibold text-slate-900 mt-2">{sub.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Degree: {sub.courseId.toUpperCase()} · {sub.isRequired ? 'Core Curriculum' : 'Elective'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 font-mono">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" /> Assignment Authorized
                </span>
                <button
                  onClick={() => {
                    onSelectSubjectForGrading(sub.id);
                    onNavigate('marks_entry');
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  Grade Subject <ArrowRight className="w-3.5 h-3.5 text-indigo-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
