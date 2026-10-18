import React, { useState, useEffect, useMemo } from 'react';
import {
  FileSpreadsheet,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Shield,
  Layers,
  ArrowRight,
  Eye,
  RefreshCw,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  AcademicSession,
  AssessmentRecord,
  ExamAttendance,
  SessionalNumber,
  SubjectMaster,
  SubmissionStatus,
  TeacherAssignment,
} from '../../types/domain.ts';
import { api } from '../../services/api.ts';
import { LoadingSkeleton } from '../common/LoadingSkeleton.tsx';
import { EmptyState } from '../common/EmptyState.tsx';

interface TeacherMarksEntryProps {
  assignments: TeacherAssignment[];
  subjects: SubjectMaster[];
  sessions: AcademicSession[];
  activeSessionId: string;
  selectedSubjectId?: string;
  onSubjectChange?: (subjectId: string) => void;
}

export const TeacherMarksEntry: React.FC<TeacherMarksEntryProps> = ({
  assignments,
  subjects,
  sessions,
  activeSessionId,
  selectedSubjectId: initialSubjectId,
  onSubjectChange,
}) => {
  const subjectMap = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);
  const myAssignedSubjects = useMemo(() => {
    return assignments.map((a) => subjectMap.get(a.subjectId)).filter(Boolean) as SubjectMaster[];
  }, [assignments, subjectMap]);

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    initialSubjectId || myAssignedSubjects[0]?.id || 'sub_bca101'
  );
  const [selectedSessionId, setSelectedSessionId] = useState<string>(activeSessionId || sessions[0]?.id || 'sess_2025_26');
  const [selectedSessionalNum, setSelectedSessionalNum] = useState<SessionalNumber>(SessionalNumber.SESSIONAL_1);

  const [sheetData, setSheetData] = useState<any>(null);
  const [loadingSheet, setLoadingSheet] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [marksState, setMarksState] = useState<Record<string, any>>({});
  const [savingDraftFor, setSavingDraftFor] = useState<string | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isSubmittingFinal, setIsSubmittingFinal] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Sync initial subject if provided
  useEffect(() => {
    if (initialSubjectId && initialSubjectId !== selectedSubjectId) {
      setSelectedSubjectId(initialSubjectId);
    }
  }, [initialSubjectId]);

  // Load teacher assessment sheet
  useEffect(() => {
    if (selectedSubjectId && selectedSessionId) {
      loadSheet();
    }
  }, [selectedSubjectId, selectedSessionId, selectedSessionalNum]);

  const loadSheet = async () => {
    setLoadingSheet(true);
    setSheetError(null);
    try {
      const data = await api.getTeacherSheet(selectedSubjectId, selectedSessionId, selectedSessionalNum);
      if (!data.success) {
        setSheetError(data.message || 'Error loading subject sheet.');
        setSheetData(null);
      } else {
        setSheetData(data.data);
        const initialMarks: Record<string, any> = {};
        data.data.rows.forEach((r: any) => {
          initialMarks[r.student.id] = {
            ...r.assessment,
            obtainedMarks: r.assessment.obtainedMarks ?? '',
            examAttendance: r.assessment.examAttendance || ExamAttendance.ATTENDED,
            classAttendancePct: r.assessment.classAttendancePct ?? '',
            assignmentScore: r.assessment.assignmentScore ?? '',
            presentationScore: r.assessment.presentationScore ?? '',
            classInteractionScore: r.assessment.classInteractionScore ?? '',
          };
        });
        setMarksState(initialMarks);
      }
    } catch (err: any) {
      setSheetError(err.message || 'Network error fetching teacher sheet.');
    } finally {
      setLoadingSheet(false);
    }
  };

  // Local state change for a student row
  const handleInputChange = (studentId: string, field: string, value: any) => {
    setMarksState((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      },
    }));
  };

  // Helper to calculate live weighted preview score for a row
  const calculateLiveScore = (studentId: string) => {
    const row = marksState[studentId];
    if (!row) return null;
    const maxMarks = sheetData?.config?.maxMarks || 25;

    if (row.examAttendance === ExamAttendance.NOT_ATTENDED) {
      // 0 for exam, check if others present
      const att = Number(row.classAttendancePct || 0);
      const ass = Number(row.assignmentScore || 0);
      const pre = Number(row.presentationScore || 0);
      const int = Number(row.classInteractionScore || 0);
      const total = 0 * 0.4 + att * 0.2 + ass * 0.15 + pre * 0.15 + int * 0.1;
      return total.toFixed(1);
    }

    if (
      row.obtainedMarks === '' ||
      row.classAttendancePct === '' ||
      row.assignmentScore === '' ||
      row.presentationScore === '' ||
      row.classInteractionScore === ''
    ) {
      return null; // Incomplete
    }

    const examPct = (Number(row.obtainedMarks) / maxMarks) * 100;
    const att = Number(row.classAttendancePct);
    const ass = Number(row.assignmentScore);
    const pre = Number(row.presentationScore);
    const int = Number(row.classInteractionScore);

    const total = examPct * 0.4 + att * 0.2 + ass * 0.15 + pre * 0.15 + int * 0.1;
    return total.toFixed(1);
  };

  // Save single student draft
  const handleSaveDraft = async (studentId: string) => {
    const raw = marksState[studentId];
    if (!raw) return;

    setSavingDraftFor(studentId);
    try {
      const payload: AssessmentRecord = {
        ...raw,
        studentId,
        subjectId: sheetData.subject.id,
        configId: sheetData.config.id,
        sessionId: selectedSessionId,
        semester: sheetData.subject.semester,
        sessionalNumber: selectedSessionalNum,
        maxMarks: sheetData.config.maxMarks,
        obtainedMarks: raw.obtainedMarks === '' ? null : Number(raw.obtainedMarks),
        classAttendancePct: raw.classAttendancePct === '' ? null : Number(raw.classAttendancePct),
        assignmentScore: raw.assignmentScore === '' ? null : Number(raw.assignmentScore),
        presentationScore: raw.presentationScore === '' ? null : Number(raw.presentationScore),
        classInteractionScore: raw.classInteractionScore === '' ? null : Number(raw.classInteractionScore),
      };

      const res = await api.saveDraft(payload);
      if (res.success) {
        setSuccessBanner(`Draft saved for student ${studentId}. Changes remain strictly invisible to students.`);
        setTimeout(() => setSuccessBanner(null), 3500);
      } else {
        alert('Save draft failed: ' + res.message);
      }
    } catch (err: any) {
      alert('Error saving draft: ' + err.message);
    } finally {
      setSavingDraftFor(null);
    }
  };

  // Confirm final batch submit
  const handleConfirmFinalSubmit = async () => {
    if (!sheetData) return;
    setIsSubmittingFinal(true);

    const recordsToSubmit = sheetData.rows.map((r: any) => {
      const state = marksState[r.student.id];
      const isAbsent = state.examAttendance === ExamAttendance.NOT_ATTENDED;
      return {
        id: state.id,
        studentId: r.student.id,
        subjectId: sheetData.subject.id,
        configId: sheetData.config.id,
        sessionId: selectedSessionId,
        semester: sheetData.subject.semester,
        sessionalNumber: selectedSessionalNum,
        obtainedMarks: isAbsent ? 0 : state.obtainedMarks === '' ? null : Number(state.obtainedMarks),
        maxMarks: sheetData.config.maxMarks,
        examAttendance: state.examAttendance,
        classAttendancePct: state.classAttendancePct === '' ? null : Number(state.classAttendancePct),
        assignmentScore: state.assignmentScore === '' ? null : Number(state.assignmentScore),
        presentationScore: state.presentationScore === '' ? null : Number(state.presentationScore),
        classInteractionScore: state.classInteractionScore === '' ? null : Number(state.classInteractionScore),
      };
    });

    try {
      const res = await api.finalSubmitBatch(recordsToSubmit);
      if (res.success) {
        setIsReviewModalOpen(false);
        setSuccessBanner('Final submission verified and published! Marks are now immediately visible to enrolled students.');
        loadSheet();
      } else {
        alert('Final submission failed: ' + res.message);
      }
    } catch (err: any) {
      alert('Error finalizing submission: ' + err.message);
    } finally {
      setIsSubmittingFinal(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#162740]">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-amber-400" />
            Subject Assessment Marks Entry Matrix
          </h1>
          <p className="mt-0.5 text-xs text-slate-400">
            Real-time multi-component grading with weighted scoring: Sessional (40%), Attendance (20%), Assignment (15%), Presentation (15%), Interaction (10%).
          </p>
        </div>

        {sheetData && (
          <button
            onClick={() => setIsReviewModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <CheckCircle2 className="w-4 h-4" />
            Review & Final Submit Batch
          </button>
        )}
      </div>

      {/* Success Banner */}
      {successBanner && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Selection Filters Strip */}
      <div className="p-4 rounded-xl surface-navy border border-[#192b45] flex flex-wrap items-center gap-4">
        {/* Subject Select */}
        <div className="space-y-1">
          <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold block">
            Authorized Subject
          </label>
          <select
            value={selectedSubjectId}
            onChange={(e) => {
              setSelectedSubjectId(e.target.value);
              if (onSubjectChange) onSubjectChange(e.target.value);
            }}
            className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-white font-medium focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            {myAssignedSubjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.subjectCode} - {sub.name} (Sem {sub.semester})
              </option>
            ))}
          </select>
        </div>

        {/* Academic Session */}
        <div className="space-y-1">
          <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold block">
            Academic Session
          </label>
          <select
            value={selectedSessionId}
            onChange={(e) => setSelectedSessionId(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-white font-medium focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.sessionCode} ({s.title})
              </option>
            ))}
          </select>
        </div>

        {/* Sessional Number Toggle */}
        <div className="space-y-1">
          <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold block">
            Assessment Track
          </label>
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setSelectedSessionalNum(SessionalNumber.SESSIONAL_1)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                selectedSessionalNum === SessionalNumber.SESSIONAL_1
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sessional 1
            </button>
            <button
              onClick={() => setSelectedSessionalNum(SessionalNumber.SESSIONAL_2)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                selectedSessionalNum === SessionalNumber.SESSIONAL_2
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sessional 2
            </button>
          </div>
        </div>

        <button
          onClick={loadSheet}
          disabled={loadingSheet}
          className="ml-auto p-2 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
          title="Refresh Marks Sheet"
        >
          <RefreshCw className={`w-4 h-4 ${loadingSheet ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Spreadsheet Content */}
      {loadingSheet ? (
        <LoadingSkeleton count={6} height="h-16" />
      ) : sheetError ? (
        <div className="p-8 text-center surface-navy rounded-xl border border-rose-500/30 text-rose-300 text-xs space-y-2">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
          <p className="font-semibold">{sheetError}</p>
        </div>
      ) : !sheetData || sheetData.rows.length === 0 ? (
        <EmptyState
          title="No Students Enrolled"
          description="There are currently no students enrolled for this subject in the selected academic session."
          icon={FileSpreadsheet}
        />
      ) : (
        <div className="surface-navy rounded-xl border border-[#192b45] overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-900/60">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                Max Marks: {sheetData.config.maxMarks}
              </span>
              <span className="text-xs text-slate-300 font-medium">
                {sheetData.rows.length} Enrolled Student Records
              </span>
            </div>

            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-3">
              <span>Weights: S:40% · A:20% · Ass:15% · P:15% · I:10%</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Roll No & Student</th>
                  <th className="px-3 py-3 text-center">Attendance Status</th>
                  <th className="px-3 py-3 text-center">Exam Marks ({sheetData.config.maxMarks})</th>
                  <th className="px-3 py-3 text-center">Class Att %</th>
                  <th className="px-3 py-3 text-center">Assignment %</th>
                  <th className="px-3 py-3 text-center">Presentation %</th>
                  <th className="px-3 py-3 text-center">Interaction %</th>
                  <th className="px-3 py-3 text-center">Calculated Score</th>
                  <th className="px-3 py-3 text-center">Submission Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-medium">
                {sheetData.rows.map((row: any) => {
                  const state = marksState[row.student.id] || {};
                  const isAbsent = state.examAttendance === ExamAttendance.NOT_ATTENDED;
                  const liveScore = calculateLiveScore(row.student.id);
                  const isFinal = row.assessment.submissionStatus === SubmissionStatus.FINAL_SUBMITTED;

                  return (
                    <tr
                      key={row.student.id}
                      className={`hover:bg-slate-850/50 transition-colors ${
                        isFinal ? 'bg-emerald-950/10' : ''
                      }`}
                    >
                      {/* Student Info */}
                      <td className="px-4 py-3.5">
                        <div className="font-mono font-bold text-white text-xs">{row.student.rollNo}</div>
                        <div className="text-slate-300 text-xs font-semibold">{row.student.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{row.student.enrollmentNo}</div>
                      </td>

                      {/* Exam Attendance Selector */}
                      <td className="px-3 py-3.5 text-center">
                        <select
                          disabled={isFinal}
                          value={state.examAttendance}
                          onChange={(e) => handleInputChange(row.student.id, 'examAttendance', e.target.value)}
                          className={`text-[11px] font-mono px-2 py-1 rounded border focus:outline-none cursor-pointer ${
                            isAbsent
                              ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                              : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          }`}
                        >
                          <option value={ExamAttendance.ATTENDED} className="bg-slate-900 text-slate-100">
                            Attended
                          </option>
                          <option value={ExamAttendance.NOT_ATTENDED} className="bg-slate-900 text-slate-100">
                            Absent (0)
                          </option>
                        </select>
                      </td>

                      {/* Obtained Marks */}
                      <td className="px-3 py-3.5 text-center">
                        <input
                          type="number"
                          min="0"
                          max={sheetData.config.maxMarks}
                          step="0.5"
                          disabled={isFinal || isAbsent}
                          placeholder={isAbsent ? '0 (Absent)' : 'Marks'}
                          value={isAbsent ? '0' : state.obtainedMarks}
                          onChange={(e) => handleInputChange(row.student.id, 'obtainedMarks', e.target.value)}
                          className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-mono text-xs text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
                        />
                      </td>

                      {/* Class Attendance % */}
                      <td className="px-3 py-3.5 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          disabled={isFinal}
                          placeholder="0-100"
                          value={state.classAttendancePct}
                          onChange={(e) => handleInputChange(row.student.id, 'classAttendancePct', e.target.value)}
                          className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-mono text-xs text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
                        />
                      </td>

                      {/* Assignment % */}
                      <td className="px-3 py-3.5 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          disabled={isFinal}
                          placeholder="0-100"
                          value={state.assignmentScore}
                          onChange={(e) => handleInputChange(row.student.id, 'assignmentScore', e.target.value)}
                          className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-mono text-xs text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
                        />
                      </td>

                      {/* Presentation % */}
                      <td className="px-3 py-3.5 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          disabled={isFinal}
                          placeholder="0-100"
                          value={state.presentationScore}
                          onChange={(e) => handleInputChange(row.student.id, 'presentationScore', e.target.value)}
                          className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-mono text-xs text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
                        />
                      </td>

                      {/* Interaction % */}
                      <td className="px-3 py-3.5 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          disabled={isFinal}
                          placeholder="0-100"
                          value={state.classInteractionScore}
                          onChange={(e) => handleInputChange(row.student.id, 'classInteractionScore', e.target.value)}
                          className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-mono text-xs text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
                        />
                      </td>

                      {/* Live Calculated Score */}
                      <td className="px-3 py-3.5 text-center font-mono">
                        {liveScore !== null ? (
                          <span className="font-bold text-amber-400 tabular-nums text-xs">
                            {liveScore}%
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">Incomplete</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3.5 text-center">
                        {isFinal ? (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                            FINAL SUBMITTED
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-semibold">
                            DRAFT
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        {!isFinal && (
                          <button
                            onClick={() => handleSaveDraft(row.student.id)}
                            disabled={savingDraftFor === row.student.id}
                            className="px-2.5 py-1 text-[11px] font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors cursor-pointer inline-flex items-center gap-1"
                            title="Save as Draft (Invisible to student until final submit)"
                          >
                            <Save className="w-3 h-3 text-amber-400" />
                            {savingDraftFor === row.student.id ? 'Saving...' : 'Save Draft'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Review Modal for Final Submit */}
      {isReviewModalOpen && sheetData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="surface-navy-elevated rounded-2xl border border-slate-800 max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Confirm Final Batch Submission</h3>
                <p className="text-xs text-slate-400">
                  {sheetData.subject.subjectCode} - {sheetData.subject.name} (Sessional {selectedSessionalNum})
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-2.5">
              <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                Assessment Submission Preconditions Verified:
              </div>
              <ul className="space-y-1.5 text-slate-400 list-disc list-inside">
                <li>Total Students in Batch: <strong className="text-white font-mono">{sheetData.rows.length}</strong></li>
                <li>Weighted formula v1.0 applied (40% Exam, 20% Att, 15% Ass, 15% Pre, 10% Int).</li>
                <li className="text-amber-200">
                  <strong>Notice:</strong> Once finalized, marks immediately become visible to enrolled students. Any post-submission changes will require a formal Dean-authorized correction reason logged in the immutable audit trail.
                </li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsReviewModalOpen(false)}
                disabled={isSubmittingFinal}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel & Keep Editing
              </button>
              <button
                onClick={handleConfirmFinalSubmit}
                disabled={isSubmittingFinal}
                className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md shadow-amber-600/20 flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isSubmittingFinal ? 'Confirming...' : 'Confirm Final Submission'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
