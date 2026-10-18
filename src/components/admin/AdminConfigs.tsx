import React, { useState } from 'react';
import { Settings, Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  AcademicSession,
  AssessmentConductStatus,
  CourseStructure,
  SessionalConfig,
  SessionalNumber,
} from '../../types/domain.ts';
import { api } from '../../services/api.ts';
import { StatusBadge } from '../common/StatusBadge.tsx';

interface AdminConfigsProps {
  configs: SessionalConfig[];
  courses: CourseStructure[];
  sessions: AcademicSession[];
  onRefresh: () => Promise<void>;
}

export const AdminConfigs: React.FC<AdminConfigsProps> = ({
  configs,
  courses,
  sessions,
  onRefresh,
}) => {
  const [sessionId, setSessionId] = useState(sessions[0]?.id || '');
  const [courseId, setCourseId] = useState(courses[0]?.id || '');
  const [semester, setSemester] = useState('1');
  const [sessionalNumber, setSessionalNumber] = useState('1');
  const [maxMarks, setMaxMarks] = useState('25');
  const [status, setStatus] = useState<AssessmentConductStatus>(AssessmentConductStatus.ACTIVE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const courseMap = new Map(courses.map((c) => [c.id, c]));
  const sessionMap = new Map(sessions.map((s) => [s.id, s]));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await api.saveConfig({
        sessionId,
        courseId,
        semester: Number(semester),
        sessionalNumber: Number(sessionalNumber) as SessionalNumber,
        maxMarks: Number(maxMarks),
        status,
      });

      if (res.success) {
        setSuccessMsg(`Sessional ${sessionalNumber} configuration saved successfully with max marks ${maxMarks}.`);
        await onRefresh();
      } else {
        setErrorMsg(res.message || 'Failed saving configuration');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred while saving config.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-400" />
            Assessment & Sessional Configuration
          </h1>
          <p className="mt-0.5 text-xs text-slate-400">
            Define institutional sessional evaluation tracks, maximum marks boundaries, and examination status.
          </p>
        </div>

        <div className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
          Configurations: <span className="font-bold text-amber-400 tabular-nums">{configs.length}</span> Total
        </div>
      </div>

      {/* Sessional Creator Form */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <h2 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-2">
          <Plus className="w-4 h-4 text-amber-400" />
          Configure Sessional Examination Track
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

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Academic Session
            </label>
            <select
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.sessionCode}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Degree Programme
            </label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.courseCode} ({c.name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Semester
            </label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
              <option value="3">Semester 3</option>
              <option value="4">Semester 4</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Sessional Exam
            </label>
            <select
              value={sessionalNumber}
              onChange={(e) => setSessionalNumber(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="1">Sessional 1 (S1)</option>
              <option value="2">Sessional 2 (S2)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Max Marks (Base)
            </label>
            <input
              type="number"
              min="10"
              max="100"
              value={maxMarks}
              onChange={(e) => setMaxMarks(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Status & Save
            </label>
            <div className="flex gap-2">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AssessmentConductStatus)}
                className="w-28 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value={AssessmentConductStatus.ACTIVE}>Active</option>
                <option value={AssessmentConductStatus.COMPLETED}>Completed</option>
                <option value={AssessmentConductStatus.NOT_CONDUCTED}>Not Conducted</option>
              </select>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-3 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {isSubmitting ? '...' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Configured Tracks Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
          Configured Sessional Tracks ({configs.length})
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-mono uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Config ID</th>
                <th className="py-3 px-4">Programme</th>
                <th className="py-3 px-4">Semester</th>
                <th className="py-3 px-4">Sessional</th>
                <th className="py-3 px-4">Configured Max Marks</th>
                <th className="py-3 px-4">Academic Session</th>
                <th className="py-3 px-4 text-right">Conduct Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {configs.map((cfg) => {
                const course = courseMap.get(cfg.courseId);
                const session = sessionMap.get(cfg.sessionId);

                return (
                  <tr key={cfg.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400 font-medium">
                      {cfg.id}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-white">
                        {course ? course.courseCode : cfg.courseId}
                      </span>
                      <span className="text-[11px] text-slate-400 ml-2 hidden sm:inline">
                        {course?.name}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-300">
                      Semester {cfg.semester}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">
                      Sessional {cfg.sessionalNumber}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums font-semibold text-slate-200">
                      {cfg.maxMarks} Marks (Normalized to 100%)
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {session ? session.sessionCode : cfg.sessionId}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <StatusBadge status={cfg.status} size="sm" />
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
