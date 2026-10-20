import React, { useState, useMemo } from 'react';
import { Settings, Plus, CheckCircle2, AlertCircle, Layers } from 'lucide-react';
import {
  SessionalConfig,
  CourseStructure,
  AcademicSession,
  AssessmentConductStatus,
} from '../../types/domain.ts';
import { StatusBadge } from '../common/StatusBadge.tsx';
import { api } from '../../services/api.ts';

interface AdminConfigsProps {
  configs: SessionalConfig[];
  courses: CourseStructure[];
  sessions: AcademicSession[];
  onRefresh?: () => Promise<void> | void;
}

export const AdminConfigs: React.FC<AdminConfigsProps> = ({
  configs,
  courses,
  sessions,
  onRefresh,
}) => {
  const [sessionId, setSessionId] = useState(sessions[0]?.id || 'sess_2025_26');
  const [courseId, setCourseId] = useState(courses[0]?.id || 'crs_bca');
  const [semester, setSemester] = useState('1');
  const [sessionalNumber, setSessionalNumber] = useState('1');
  const [maxMarks, setMaxMarks] = useState('30');
  const [status, setStatus] = useState<AssessmentConductStatus>(AssessmentConductStatus.ACTIVE);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const courseMap = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses]);
  const sessionMap = useMemo(() => new Map(sessions.map((s) => [s.id, s])), [sessions]);

  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === courseId) || courses[0],
    [courses, courseId]
  );
  const maxSemesters = selectedCourse ? selectedCourse.totalSemesters : 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await api.saveConfig({
        sessionId,
        courseId,
        semester: parseInt(semester, 10),
        sessionalNumber: parseInt(sessionalNumber, 10),
        maxMarks: parseFloat(maxMarks),
        status,
      });

      if (res.success) {
        setSuccessMsg(
          `Configuration saved: ${selectedCourse?.courseCode || courseId} Sem ${semester} Sessional ${sessionalNumber}`
        );
        if (onRefresh) await onRefresh();
        setTimeout(() => setSuccessMsg(null), 5000);
      } else {
        setErrorMsg(res.message || 'Failed to save configuration');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error saving configuration');
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
            <Settings className="w-5 h-5 text-indigo-600" />
            Assessment & Sessional Policy Configuration
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Define institutional sessional evaluation tracks, maximum marks boundaries, and examination conduct status.
          </p>
        </div>

        <div className="text-xs font-mono px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-2xs">
          Configurations: <span className="font-bold text-indigo-600 tabular-nums">{configs.length}</span> Total
        </div>
      </div>

      {/* Sessional Creator Form */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <Plus className="w-4 h-4 text-indigo-600" />
          Configure Sessional Examination Track
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

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Academic Session
            </label>
            <select
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.sessionCode}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Degree Programme
            </label>
            <select
              value={courseId}
              onChange={(e) => {
                setCourseId(e.target.value);
                setSemester('1');
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.courseCode} ({c.name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Semester
            </label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer"
            >
              {Array.from({ length: maxSemesters }, (_, i) => i + 1).map((s) => (
                <option key={s} value={s.toString()}>
                  Semester {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Sessional Exam
            </label>
            <select
              value={sessionalNumber}
              onChange={(e) => setSessionalNumber(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer"
            >
              <option value="1">Sessional 1 (S1)</option>
              <option value="2">Sessional 2 (S2)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Max Marks (Base)
            </label>
            <input
              type="number"
              min="10"
              max="100"
              value={maxMarks}
              onChange={(e) => setMaxMarks(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-mono focus:outline-none focus:border-indigo-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Status & Save
            </label>
            <div className="flex gap-2">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AssessmentConductStatus)}
                className="w-28 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer"
              >
                <option value={AssessmentConductStatus.ACTIVE}>Active</option>
                <option value={AssessmentConductStatus.COMPLETED}>Completed</option>
                <option value={AssessmentConductStatus.NOT_CONDUCTED}>Not Conducted</option>
              </select>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isSubmitting ? '...' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Configured Tracks Table */}
      <div className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">
          Configured Sessional Tracks ({configs.length})
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-mono uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Config ID</th>
                <th className="py-3 px-4">Programme</th>
                <th className="py-3 px-4">Semester</th>
                <th className="py-3 px-4">Sessional</th>
                <th className="py-3 px-4">Configured Max Marks</th>
                <th className="py-3 px-4">Academic Session</th>
                <th className="py-3 px-4 text-right">Conduct Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {configs.map((cfg) => {
                const course = courseMap.get(cfg.courseId);
                const session = sessionMap.get(cfg.sessionId);

                return (
                  <tr key={cfg.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-500 font-medium">
                      {cfg.id}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900">
                        {course ? course.courseCode : cfg.courseId}
                      </span>
                      <span className="text-[11px] text-slate-500 ml-2 hidden sm:inline">
                        {course?.name}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                      Semester {cfg.semester}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                      Sessional {cfg.sessionalNumber}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums font-semibold text-slate-800">
                      {cfg.maxMarks} Marks (Normalized to 100%)
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
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
