import React, { useState, useEffect, useMemo } from 'react';
import {
  FileSpreadsheet,
  Save,
  CheckCircle2,
  AlertCircle,
  Shield,
  Eye,
  RefreshCw,
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
      return null;
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
            Subject Assessment Marks Entry Matrix
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Real-time multi-component grading with weighted scoring: Sessional (40%), Attendance (20%), Assignment (15%), Presentation (15%), Interaction (10%).
          </p>
        </div>

        {sheetData && (
          <button
            onClick={() => setIsReviewModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <CheckCircle2 className="w-4 h-4" />
            Review & Final Submit Batch
          </button>
        )}
      </div>

      {/* Success Banner */}
      {successBanner && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Selection Filters Strip */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center gap-4">
        {/* Subject Select */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-600 block">
            Authorized Subject
          </label>
          <select
            value={selectedSubjectId}
            onChange={(e) => {
              setSelectedSubjectId(e.target.value);
              if (onSubjectChange) onSubjectChange(e.target.value);
            }}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer"
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
          <label className="text-[11px] font-semibold text-slate-600 block">
            Academic Session
          </label>
          <select
            value={selectedSessionId}
            onChange={(e) => setSelectedSessionId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer"
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
          <label className="text-[11px] font-semibold text-slate-600 block">
            Assessment Track
          </label>
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setSelectedSessionalNum(SessionalNumber.SESSIONAL_1)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                selectedSessionalNum === SessionalNumber.SESSIONAL_1
                  ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sessional 1
            </button>
            <button
              onClick={() => setSelectedSessionalNum(SessionalNumber.SESSIONAL_2)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                selectedSessionalNum === SessionalNumber.SESSIONAL_2
                  ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sessional 2
            </button>
          </div>
        </div>

        <button
          onClick={loadSheet}
          disabled={loadingSheet}
          className="ml-auto p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
          title="Refresh Marks Sheet"
        >
          <RefreshCw className={`w-4 h-4 ${loadingSheet ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Spreadsheet Content */}
      {loadingSheet ? (
        <LoadingSkeleton rows={6} />
      ) : sheetError ? (
        <div className="p-8 text-center bg-white rounded-xl border border-rose-200 text-rose-700 text-xs space-y-2 shadow-xs">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
          <p className="font-semibold">{sheetError}</p>
        </div>
      ) : !sheetData || sheetData.rows.length === 0 ? (
        <EmptyState
          title="No Students Enrolled"
          description="There are currently no students enrolled for this subject in the selected academic session."
          icon={FileSpreadsheet}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">
                Max Marks: {sheetData.config.maxMarks}
              </span>
              <span className="text-xs text-slate-700 font-medium">
                {sheetData.rows.length} Enrolled Student Records
              </span>
            </div>

            <div className="text-[11px] text-slate-500 font-mono flex items-center gap-3">
              <span>Weights: Exam:40% · Att:20% · Ass:15% · Pre:15% · Int:10%</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-mono uppercase text-[11px] border-b border-slate-200">
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
              <tbody className="divide-y divide-slate-100 font-medium">
                {sheetData.rows.map((row: any) => {
                  const state = marksState[row.student.id] || {};
                  const isAbsent = state.examAttendance === ExamAttendance.NOT_ATTENDED;
                  const liveScore = calculateLiveScore(row.student.id);
                  const isFinal = row.assessment.submissionStatus === SubmissionStatus.FINAL_SUBMITTED;

                  return (
                    <tr
                      key={row.student.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isFinal ? 'bg-emerald-50/40' : ''
                      }`}
                    >
                      {/* Student Info */}
                      <td className="px-4 py-3.5">
                        <div className="font-mono font-bold text-indigo-700 text-xs">{row.student.rollNo}</div>
                        <div className="text-slate-900 text-xs font-semibold">{row.student.name}</div>
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
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          <option value={ExamAttendance.ATTENDED}>
                            Attended
                          </option>
                          <option value={ExamAttendance.NOT_ATTENDED}>
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
                          placeholder={isAbsent ? '0' : 'Marks'}
                          value={isAbsent ? '0' : state.obtainedMarks}
                          onChange={(e) => handleInputChange(row.student.id, 'obtainedMarks', e.target.value)}
                          className="w-20 bg-white border border-slate-300 rounded px-2 py-1 text-center font-mono text-xs text-slate-800 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
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
                          className="w-16 bg-white border border-slate-300 rounded px-2 py-1 text-center font-mono text-xs text-slate-800 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
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
                          className="w-16 bg-white border border-slate-300 rounded px-2 py-1 text-center font-mono text-xs text-slate-800 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
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
                          className="w-16 bg-white border border-slate-300 rounded px-2 py-1 text-center font-mono text-xs text-slate-800 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
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
                          className="w-16 bg-white border border-slate-300 rounded px-2 py-1 text-center font-mono text-xs text-slate-800 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                        />
                      </td>

                      {/* Live Calculated Score */}
                      <td className="px-3 py-3.5 text-center font-mono">
                        {liveScore !== null ? (
                          <span className="font-bold text-indigo-700 tabular-nums text-xs">
                            {liveScore}%
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Incomplete</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3.5 text-center">
                        {isFinal ? (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                            FINAL SUBMITTED
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-semibold">
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
                            className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md transition-colors cursor-pointer inline-flex items-center gap-1"
                            title="Save as Draft (Invisible to student until final submit)"
                          >
                            <Save className="w-3 h-3 text-indigo-600" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Confirm Final Batch Submission</h3>
                <p className="text-xs text-slate-500">
                  {sheetData.subject.subjectCode} - {sheetData.subject.name} (Sessional {selectedSessionalNum})
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2.5">
              <div className="font-semibold text-indigo-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                Assessment Submission Preconditions Verified:
              </div>
              <ul className="space-y-1.5 text-slate-600 list-disc list-inside">
                <li>Total Students in Batch: <strong className="text-slate-900 font-mono">{sheetData.rows.length}</strong></li>
                <li>Weighted formula v1.0 applied (40% Exam, 20% Att, 15% Ass, 15% Pre, 10% Int).</li>
                <li className="text-amber-800 font-medium">
                  <strong>Notice:</strong> Once finalized, marks immediately become visible to enrolled students. Any post-submission changes will require a formal Dean-authorized correction reason logged in the immutable audit trail.
                </li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsReviewModalOpen(false)}
                disabled={isSubmittingFinal}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel & Keep Editing
              </button>
              <button
                onClick={handleConfirmFinalSubmit}
                disabled={isSubmittingFinal}
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
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
