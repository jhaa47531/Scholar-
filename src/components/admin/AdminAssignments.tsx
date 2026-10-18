import React, { useState } from 'react';
import { UserCheck, Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  AcademicSession,
  SubjectMaster,
  TeacherAssignment,
  TeacherProfile,
} from '../../types/domain.ts';
import { api } from '../../services/api.ts';
import { StatusBadge } from '../common/StatusBadge.tsx';

interface AdminAssignmentsProps {
  assignments: TeacherAssignment[];
  faculty: TeacherProfile[];
  subjects: SubjectMaster[];
  sessions: AcademicSession[];
  onRefresh: () => Promise<void>;
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
  const [selectedSessionId, setSelectedSessionId] = useState(sessions[0]?.id || '');
  const [semester, setSemester] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const teacherMap = new Map(faculty.map((f) => [f.id, f]));
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const sessionMap = new Map(sessions.map((s) => [s.id, s]));

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherId || !selectedSubjectId || !selectedSessionId) {
      setErrorMsg('Please select teacher, subject, and session.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await api.createAssignment({
        teacherId: selectedTeacherId,
        subjectId: selectedSubjectId,
        sessionId: selectedSessionId,
        semester: Number(semester),
      });

      if (res.success) {
        setSuccessMsg('Faculty member successfully assigned to subject.');
        await onRefresh();
      } else {
        setErrorMsg(res.message || 'Failed to assign teacher.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating assignment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-amber-400" />
            Faculty Subject Assignments
          </h1>
          <p className="mt-0.5 text-xs text-slate-400">
            Official institutional allocation of faculty instructors to curriculum subjects per academic session.
          </p>
        </div>

        <div className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
          Total Allocations: <span className="font-bold text-amber-400 tabular-nums">{assignments.length}</span>
        </div>
      </div>

      {/* Assignment Creation Card */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <h2 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-2">
          <Plus className="w-4 h-4 text-amber-400" />
          Assign Faculty to Subject
        </h2>

        {successMsg && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleAssign} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Select Faculty Instructor
            </label>
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50 cursor-pointer"
            >
              {faculty.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.employeeCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Curriculum Subject
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50 cursor-pointer"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.subjectCode} - {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Academic Session
            </label>
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50 cursor-pointer"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.sessionCode} ({s.title})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Semester & Action
            </label>
            <div className="flex gap-2">
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-24 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="1">Sem 1</option>
                <option value="2">Sem 2</option>
                <option value="3">Sem 3</option>
                <option value="4">Sem 4</option>
              </select>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {isSubmitting ? 'Assigning...' : 'Assign Faculty'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Active Assignments Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
          Active Institutional Assignments ({assignments.length})
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-mono uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Instructor</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Academic Session</th>
                <th className="py-3 px-4">Semester</th>
                <th className="py-3 px-4">Assigned On</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {assignments.map((asg) => {
                const teacher = teacherMap.get(asg.teacherId);
                const subject = subjectMap.get(asg.subjectId);
                const session = sessionMap.get(asg.sessionId);

                return (
                  <tr key={asg.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">
                        {teacher ? teacher.name : asg.teacherId}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {teacher?.department} · {teacher?.employeeCode}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-amber-400/90 mr-2">
                        {subject ? subject.subjectCode : asg.subjectId}
                      </span>
                      <span className="text-slate-200">{subject?.name}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {session ? session.sessionCode : asg.sessionId}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-300">
                      Semester {asg.semester}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
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
