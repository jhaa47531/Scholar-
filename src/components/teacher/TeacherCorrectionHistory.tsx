import React, { useState, useEffect } from 'react';
import { History, ShieldAlert, PlusCircle, CheckCircle2, Clock, FileText, ArrowRight } from 'lucide-react';
import { AcademicSession, AssessmentRecord, AuditLogEntry, SubjectMaster, TeacherAssignment } from '../../types/domain.ts';
import { api } from '../../services/api.ts';
import { EmptyState } from '../common/EmptyState.tsx';
import { LoadingSkeleton } from '../common/LoadingSkeleton.tsx';

interface TeacherCorrectionHistoryProps {
  assignments: TeacherAssignment[];
  subjects: SubjectMaster[];
  sessions: AcademicSession[];
  activeSessionId: string;
}

export const TeacherCorrectionHistory: React.FC<TeacherCorrectionHistoryProps> = ({
  assignments,
  subjects,
  sessions,
  activeSessionId,
}) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New correction form state
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || '');
  const [selectedStudentRoll, setSelectedStudentRoll] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');
  const [newObtainedMarks, setNewObtainedMarks] = useState('');
  const [newAttendancePct, setNewAttendancePct] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs('ASSESSMENT');
      const corrections = data.filter((l) => l.action === 'CORRECTION');
      setLogs(corrections);
    } catch (err) {
      console.error('Error fetching correction logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionErrorMsg(null);
    if (!correctionReason.trim()) {
      setActionErrorMsg('A formal correction reason with institutional authorization reference is strictly mandatory.');
      return;
    }

    setIsSubmitting(true);
    try {
      const sheet = await api.getTeacherSheet(selectedSubjectId, activeSessionId || 'sess_2025_26', 1);
      if (!sheet.success || !sheet.data) {
        throw new Error('Unable to retrieve assessment sheet for subject.');
      }

      const row = sheet.data.rows.find(
        (r: any) =>
          r.student.rollNo.toLowerCase() === selectedStudentRoll.trim().toLowerCase() ||
          r.student.id === selectedStudentRoll.trim()
      );

      if (!row) {
        throw new Error(`Student with Roll No / ID "${selectedStudentRoll}" not found in this subject cohort.`);
      }

      const updates: Partial<AssessmentRecord> = {};
      if (newObtainedMarks !== '') updates.obtainedMarks = Number(newObtainedMarks);
      if (newAttendancePct !== '') updates.classAttendancePct = Number(newAttendancePct);

      const res = await api.correctAssessment(row.assessment.id, updates, correctionReason.trim());
      if (res.success) {
        setActionSuccessMsg(`Correction formally audited and applied for ${row.student.name}.`);
        setIsModalOpen(false);
        setCorrectionReason('');
        setNewObtainedMarks('');
        setNewAttendancePct('');
        setSelectedStudentRoll('');
        loadLogs();
        setTimeout(() => setActionSuccessMsg(null), 4000);
      } else {
        setActionErrorMsg(res.message || 'Correction failed.');
      }
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Error applying correction.');
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
            <History className="w-5 h-5 text-indigo-600" />
            Post-Submission Assessment Correction History
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Immutable log of all Dean-authorized adjustments applied to finalized assessment records.
          </p>
        </div>

        <button
          onClick={() => {
            setActionErrorMsg(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          Request Authorized Correction
        </button>
      </div>

      {/* Success Notification */}
      {actionSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Protocol Banner */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 space-y-1">
          <span className="font-bold text-amber-800 block">Strict Correction Governance Policy</span>
          <p className="text-slate-600">
            Finalized marks cannot be silently modified. Any modification creates an immutable audit log entry documenting the exact before/after state, timestamp, teacher identifier, and authorized justification.
          </p>
        </div>
      </div>

      {/* Audit Log Table */}
      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : logs.length === 0 ? (
        <EmptyState
          title="Zero Post-Submission Corrections"
          description="No corrections have been submitted or needed for your subjects. All finalized records remain in their original submitted state."
          icon={CheckCircle2}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Verified Post-Submission Correction Entries ({logs.length})
            </h3>
            <span className="text-xs text-slate-500 font-mono">Immutable Compliance Log</span>
          </div>

          <div className="divide-y divide-slate-100">
            {logs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-slate-50/80 transition-colors space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                      CORRECTION AUDIT
                    </span>
                    <span className="text-xs font-semibold text-slate-800">
                      Assessment ID: <code className="text-indigo-600 font-mono">{log.entityId}</code>
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                  <span className="text-slate-500 block text-[11px] uppercase font-mono font-semibold">
                    Authorized Justification Reason:
                  </span>
                  <p className="text-slate-800 mt-1 font-medium">{log.reason}</p>
                </div>

                {log.previousData && log.newData && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-800">
                      <span className="block text-[10px] uppercase font-bold text-rose-700 mb-1">Before Snapshot:</span>
                      <div>Exam Marks: {(log.previousData as any).obtainedMarks ?? 'N/A'}</div>
                      <div>Attendance: {(log.previousData as any).classAttendancePct ?? 'N/A'}%</div>
                    </div>
                    <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800">
                      <span className="block text-[10px] uppercase font-bold text-emerald-700 mb-1">After Snapshot:</span>
                      <div>Exam Marks: {(log.newData as any).obtainedMarks ?? 'N/A'}</div>
                      <div>Attendance: {(log.newData as any).classAttendancePct ?? 'N/A'}%</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal for Requesting Authorized Correction */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-600">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Dean-Authorized Assessment Correction</h3>
                <p className="text-xs text-slate-500">Post-submission marks adjustment protocol</p>
              </div>
            </div>

            {actionErrorMsg && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {actionErrorMsg}
              </div>
            )}

            <form onSubmit={handleApplyCorrection} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Target Subject</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.subjectCode} - {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Student Roll Number or ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BCA-01"
                  value={selectedStudentRoll}
                  onChange={(e) => setSelectedStudentRoll(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Corrected Exam Marks</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    placeholder="New Marks"
                    value={newObtainedMarks}
                    onChange={(e) => setNewObtainedMarks(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Corrected Class Att %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="New Attendance %"
                    value={newAttendancePct}
                    onChange={(e) => setNewAttendancePct(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Mandatory Institutional Justification & Authorization Reason:
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Dean Approval Ref #ACAD-2025-891: Re-evaluation of Question 4 verified by Board of Examiners."
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isSubmitting ? 'Recording audit...' : 'Submit Audit Correction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
