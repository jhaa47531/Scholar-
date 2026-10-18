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
      // Find assessment record for the student under this subject
      const sheet = await api.getTeacherSheet(selectedSubjectId, activeSessionId, 1);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#162740]">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-amber-400" />
            Post-Submission Assessment Correction History
          </h1>
          <p className="mt-0.5 text-xs text-slate-400">
            Immutable log of all Dean-authorized adjustments applied to finalized assessment records.
          </p>
        </div>

        <button
          onClick={() => {
            setActionErrorMsg(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          Request Authorized Correction
        </button>
      </div>

      {/* Success Notification */}
      {actionSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Protocol Banner */}
      <div className="p-4 rounded-xl surface-navy border border-[#192b45] flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 space-y-1">
          <span className="font-bold text-amber-300 block">Strict Correction Governance Policy</span>
          <p className="text-slate-400">
            Finalized marks cannot be silently modified. Any modification creates an immutable audit log entry documenting the exact before/after state, timestamp, teacher identifier, and authorized justification.
          </p>
        </div>
      </div>

      {/* Audit Log Table */}
      {loading ? (
        <LoadingSkeleton count={4} height="h-20" />
      ) : logs.length === 0 ? (
        <EmptyState
          title="Zero Post-Submission Corrections"
          description="No corrections have been submitted or needed for your subjects. All finalized records remain in their original submitted state."
          icon={CheckCircle2}
        />
      ) : (
        <div className="surface-navy rounded-xl border border-[#192b45] overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-tight">
              Verified Post-Submission Correction Entries ({logs.length})
            </h3>
            <span className="text-xs text-slate-400 font-mono">Immutable Compliance Log</span>
          </div>

          <div className="divide-y divide-slate-800">
            {logs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-slate-850/40 transition-colors space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/25 font-bold">
                      CORRECTION AUDIT
                    </span>
                    <span className="text-xs font-semibold text-white">
                      Assessment ID: <code className="text-slate-400">{log.entityId}</code>
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                  <span className="text-slate-400 block text-[11px] uppercase font-mono font-semibold">
                    Authorized Justification Reason:
                  </span>
                  <p className="text-amber-200 mt-1 font-medium">{log.reason}</p>
                </div>

                {log.previousData && log.newData && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300">
                      <span className="block text-[10px] uppercase font-bold text-rose-400 mb-1">Before Snapshot:</span>
                      <div>Exam Marks: {(log.previousData as any).obtainedMarks ?? 'N/A'}</div>
                      <div>Attendance: {(log.previousData as any).classAttendancePct ?? 'N/A'}%</div>
                    </div>
                    <div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                      <span className="block text-[10px] uppercase font-bold text-emerald-400 mb-1">After Snapshot:</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="surface-navy-elevated rounded-2xl border border-slate-800 max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Dean-Authorized Assessment Correction</h3>
                <p className="text-xs text-slate-400">Post-submission marks adjustment protocol</p>
              </div>
            </div>

            {actionErrorMsg && (
              <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                {actionErrorMsg}
              </div>
            )}

            <form onSubmit={handleApplyCorrection} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Target Subject</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.subjectCode} - {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Student Roll Number or ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BCA-01"
                  value={selectedStudentRoll}
                  onChange={(e) => setSelectedStudentRoll(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Corrected Exam Marks</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    placeholder="New Marks"
                    value={newObtainedMarks}
                    onChange={(e) => setNewObtainedMarks(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Corrected Class Att %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="New Attendance %"
                    value={newAttendancePct}
                    onChange={(e) => setNewAttendancePct(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Mandatory Institutional Justification & Authorization Reason:
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Dean Approval Ref #ACAD-2025-891: Re-evaluation of Question 4 verified by Board of Examiners."
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md shadow-amber-600/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isSubmitting ? 'Logging & Applying...' : 'Apply Verified Correction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
