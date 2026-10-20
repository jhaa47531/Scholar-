import React, { useState, useMemo } from 'react';
import { UserCheck, Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  TeacherAssignment,
  TeacherProfile,
  SubjectMaster,
  AcademicSession,
} from '../../types/domain.ts';
import { StatusBadge } from '../common/StatusBadge.tsx';
import { api } from '../../services/api.ts';

interface AdminAssignmentsProps {
  assignments: TeacherAssignment[];
  faculty: TeacherProfile[];
  subjects: SubjectMaster[];
  sessions: AcademicSession[];
  onRefresh?: () => Promise<void> | void;
}

export const AdminAssignments: React.FC<AdminAssignmentsProps> = ({
  assignments,
  faculty,
  subjects,
  sessions,
  onRefresh,
}) => {
  const [selectedTeacherId, setSelectedTeacherId] = useState(faculty[0]?.id || '');
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || '');
  const [selectedSessionId, setSelectedSessionId] = useState(sessions[0]?.id || 'sess_2025_26');
  const [semester, setSemester] = useState('1');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const teacherMap = useMemo(() => new Map(faculty.map((f) => [f.id, f])), [faculty]);
  const subjectMap = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);
  const sessionMap = useMemo(() => new Map(sessions.map((s) => [s.id, s])), [sessions]);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherId || !selectedSubjectId || !selectedSessionId) {
      setErrorMsg('Please select a teacher, subject, and session.');
      return;
    }

    setIsSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await api.createAssignment({
        teacherId: selectedTeacherId,
        subjectId: selectedSubjectId,
        sessionId: selectedSessionId,
        semester: parseInt(semester, 10),
      });

      if (res.success) {
        setSuccessMsg('Teacher assignment recorded successfully.');
        if (onRefresh) await onRefresh();
        setTimeout(() => setSuccessMsg(null), 5000);
      } else {
        setErrorMsg(res.message || 'Failed to assign teacher');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error assigning teacher');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-600" />
            Faculty Subject Assignments
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Official institutional allocation of faculty instructors to curriculum subjects per academic session.
          </p>
        </div>

        <div className="text-xs font-mono px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-2xs">
          Total Allocations: <span className="font-bold text-indigo-600 tabular-nums">{assignments.length}</span>
        </div>
      </div>

      {/* Assignment Creation Card */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <Plus className="w-4 h-4 text-indigo-600" />
          Assign Faculty to Subject
        </h2>

        {successMsg && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleAssign} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Select Faculty Instructor
            </label>
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer"
            >
              {faculty.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.employeeCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Curriculum Subject
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.subjectCode} - {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Academic Session
            </label>
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.sessionCode} ({s.title})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Semester & Action
            </label>
            <div className="flex gap-2">
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s.toString()}>
                    Sem {s}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isSubmitting ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Active Assignments Table */}
      <div className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">
          Active Institutional Assignments ({assignments.length})
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-mono uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Instructor</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Academic Session</th>
                <th className="py-3 px-4">Semester</th>
                <th className="py-3 px-4">Assigned On</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assignments.map((asg) => {
                const teacher = teacherMap.get(asg.teacherId);
                const subject = subjectMap.get(asg.subjectId);
                const session = sessionMap.get(asg.sessionId);

                return (
                  <tr key={asg.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">
                        {teacher ? teacher.name : asg.teacherId}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {teacher?.department} · {teacher?.employeeCode}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-indigo-700 mr-2">
                        {subject ? subject.subjectCode : asg.subjectId}
                      </span>
                      <span className="text-slate-800">{subject?.name}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {session ? session.sessionCode : asg.sessionId}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                      Semester {asg.semester}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {asg.assignedAt ? new Date(asg.assignedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <StatusBadge status={asg.isActive ? 'ACTIVE' : 'INACTIVE'} size="sm" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
