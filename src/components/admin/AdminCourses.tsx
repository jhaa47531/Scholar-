import React, { useState, useMemo } from 'react';
import {
  Layers,
  BookOpen,
  Calendar,
  Clock,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  X,
  ChevronRight,
  Shield,
  RotateCcw,
} from 'lucide-react';
import { CourseStructure, SubjectMaster } from '../../types/domain.ts';
import { StatusBadge } from '../common/StatusBadge.tsx';
import { EmptyState } from '../common/EmptyState.tsx';
import { api } from '../../services/api.ts';

interface AdminCoursesProps {
  courses: CourseStructure[];
  subjects: SubjectMaster[];
  onRefresh?: () => Promise<void> | void;
  onNavigateToSubjects?: () => void;
}

export const AdminCourses: React.FC<AdminCoursesProps> = ({
  courses,
  subjects,
  onRefresh,
  onNavigateToSubjects,
}) => {
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    courses[0]?.id || 'crs_bca'
  );
  const [selectedSemester, setSelectedSemester] = useState<number>(1);

  // Keep selected course synchronized when courses load
  React.useEffect(() => {
    if (courses.length > 0 && (!selectedCourseId || !courses.some((c) => c.id === selectedCourseId))) {
      setSelectedCourseId(courses[0].id);
    }
  }, [courses, selectedCourseId]);

  // Modals
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
  const [isEditCourseModalOpen, setIsEditCourseModalOpen] = useState(false);
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectMaster | null>(null);
  const [deletingSubject, setDeletingSubject] = useState<SubjectMaster | null>(null);

  // Add/Edit Course State
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [totalSemesters, setTotalSemesters] = useState('6');
  const [durationYears, setDurationYears] = useState('3');
  const [courseIsActive, setCourseIsActive] = useState(true);

  // Add/Edit Subject State
  const [subCode, setSubCode] = useState('');
  const [subName, setSubName] = useState('');
  const [subCredits, setSubCredits] = useState('3');
  const [subIsRequired, setSubIsRequired] = useState(true);
  const [subElectiveGroup, setSubElectiveGroup] = useState('');

  // Status & Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Currently Selected Course
  const activeCourse = useMemo(() => {
    return courses.find((c) => c.id === selectedCourseId) || courses[0];
  }, [courses, selectedCourseId]);

  // Subjects assigned to the selected course (robust to courseId or courseCode matching)
  const courseSubjects = useMemo(() => {
    if (!activeCourse) return [];
    return subjects.filter(
      (s) =>
        s.courseId === activeCourse.id ||
        s.courseId === activeCourse.courseCode ||
        s.courseId.toLowerCase() === activeCourse.id.toLowerCase() ||
        s.courseId.toLowerCase() === activeCourse.courseCode.toLowerCase()
    );
  }, [subjects, activeCourse]);

  // Subjects assigned to the selected semester
  const semesterSubjects = useMemo(() => {
    return courseSubjects.filter((s) => Number(s.semester) === Number(selectedSemester));
  }, [courseSubjects, selectedSemester]);

  // Open Edit Course
  const openEditCourse = () => {
    if (!activeCourse) return;
    setCourseCode(activeCourse.courseCode);
    setCourseName(activeCourse.name);
    setTotalSemesters(activeCourse.totalSemesters.toString());
    setDurationYears(activeCourse.durationYears.toString());
    setCourseIsActive(activeCourse.isActive);
    setFormError(null);
    setIsEditCourseModalOpen(true);
  };

  // Open Add Subject Pre-configured for selected course and semester
  const openAddSubjectForSemester = (sem: number) => {
    setSelectedSemester(sem);
    setSubCode('');
    setSubName('');
    setSubCredits('3');
    setSubIsRequired(true);
    setSubElectiveGroup('');
    setFormError(null);
    setIsAddSubjectModalOpen(true);
  };

  // Open Edit Subject
  const openEditSubject = (sub: SubjectMaster) => {
    setEditingSubject(sub);
    setSubCode(sub.subjectCode);
    setSubName(sub.name);
    setSubCredits(sub.credits.toString());
    setSubIsRequired(sub.isRequired);
    setSubElectiveGroup(sub.electiveGroup || '');
    setFormError(null);
  };

  // Save Course Creation
  const handleCreateCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseCode.trim() || !courseName.trim()) {
      setFormError('Course code and degree name are required.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      const res = await api.createCourse({
        courseCode: courseCode.trim().toUpperCase(),
        name: courseName.trim(),
        totalSemesters: parseInt(totalSemesters, 10),
        durationYears: parseInt(durationYears, 10),
      });

      if (res.success && res.data) {
        setSuccessMessage(`Degree programme ${res.data.courseCode} added successfully.`);
        setIsAddCourseModalOpen(false);
        setSelectedCourseId(res.data.id);
        if (onRefresh) await onRefresh();
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setFormError(res.message || 'Failed to create course.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Network error while creating course.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Course Edit
  const handleEditCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCourse) return;

    setIsSubmitting(true);
    setFormError(null);
    try {
      const res = await api.updateCourse(activeCourse.id, {
        name: courseName.trim(),
        totalSemesters: parseInt(totalSemesters, 10),
        durationYears: parseInt(durationYears, 10),
        isActive: courseIsActive,
      });

      if (res.success) {
        setSuccessMessage(`Degree programme ${activeCourse.courseCode} updated.`);
        setIsEditCourseModalOpen(false);
        if (onRefresh) await onRefresh();
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setFormError(res.message || 'Failed to update course.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Network error while updating course.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save New Subject
  const handleAddSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCourse) return;
    if (!subCode.trim() || !subName.trim()) {
      setFormError('Subject code and title are required.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      const res = await api.createSubject({
        subjectCode: subCode.trim().toUpperCase(),
        name: subName.trim(),
        courseId: activeCourse.id,
        semester: selectedSemester,
        credits: parseInt(subCredits, 10) || 3,
        isRequired: subIsRequired,
        electiveGroup: !subIsRequired && subElectiveGroup.trim() ? subElectiveGroup.trim() : undefined,
      });

      if (res.success) {
        setSuccessMessage(`Subject ${subCode.trim()} added to Semester ${selectedSemester}.`);
        setIsAddSubjectModalOpen(false);
        if (onRefresh) await onRefresh();
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setFormError(res.message || 'Failed to create subject.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Network error creating subject.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Subject Edit
  const handleEditSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject) return;

    setIsSubmitting(true);
    setFormError(null);
    try {
      const res = await api.updateSubject(editingSubject.id, {
        subjectCode: subCode.trim().toUpperCase(),
        name: subName.trim(),
        credits: parseInt(subCredits, 10) || 3,
        isRequired: subIsRequired,
        electiveGroup: !subIsRequired && subElectiveGroup.trim() ? subElectiveGroup.trim() : undefined,
      });

      if (res.success) {
        setSuccessMessage(`Subject ${editingSubject.subjectCode} updated.`);
        setEditingSubject(null);
        if (onRefresh) await onRefresh();
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setFormError(res.message || 'Failed to update subject.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Network error updating subject.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete / Archive Subject
  const handleConfirmDeleteSubject = async () => {
    if (!deletingSubject) return;
    setIsSubmitting(true);
    try {
      const res = await api.deleteSubject(deletingSubject.id);
      if (res.success) {
        setSuccessMessage(res.message || 'Subject updated.');
        setDeletingSubject(null);
        if (onRefresh) await onRefresh();
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setFormError(res.message || 'Failed to delete subject.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Error deleting subject.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Notification Banner */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-900 font-bold"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            Degree Programmes & Curriculum Structure
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Global Institute of Information and Technology — Degree regulations, semester schedules, and syllabus configuration.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-mono px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 shadow-2xs">
            Programmes: <span className="font-bold text-indigo-600 tabular-nums">{courses.length}</span> Configured
          </div>
          <button
            onClick={() => {
              setCourseCode('');
              setCourseName('');
              setTotalSemesters('6');
              setDurationYears('3');
              setFormError(null);
              setIsAddCourseModalOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Course</span>
          </button>
        </div>
      </div>

      {/* Courses Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {courses.map((course) => {
          const cSubs = subjects.filter(
            (s) =>
              s.courseId === course.id ||
              s.courseId.toLowerCase() === course.id.toLowerCase() ||
              s.courseId.toLowerCase() === course.courseCode.toLowerCase()
          );
          const isSelected = activeCourse?.id === course.id;

          return (
            <div
              key={course.id}
              onClick={() => {
                setSelectedCourseId(course.id);
                setSelectedSemester(1);
              }}
              className={`p-4 rounded-xl border transition-all cursor-pointer text-left flex flex-col justify-between gap-3 ${
                isSelected
                  ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 font-bold">
                    {course.courseCode}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-2 leading-tight">
                    {course.name}
                  </h3>
                </div>
                <StatusBadge status={course.isActive ? 'ACTIVE' : 'INACTIVE'} size="sm" />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-mono">SEMESTERS</span>
                  <span className="font-semibold text-slate-800 tabular-nums">
                    {course.totalSemesters} Semesters
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-mono">DURATION</span>
                  <span className="font-semibold text-slate-800 tabular-nums">
                    {course.durationYears} Years
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                  {cSubs.length} Subjects
                </span>
                <span className="text-indigo-600 font-semibold flex items-center gap-0.5">
                  {isSelected ? 'Viewing' : 'Select'}
                  <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= DETAILED COURSE & SEMESTER VIEW ================= */}
      {activeCourse && (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
          {/* Detailed Course Header Bar */}
          <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/60">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-indigo-600 text-white font-mono text-xs font-bold">
                  {activeCourse.courseCode}
                </span>
                <h2 className="text-base font-bold text-slate-900">
                  {activeCourse.name} — Curriculum Breakdown
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Standard duration: {activeCourse.durationYears} Years ({activeCourse.totalSemesters} Total Semesters). Showing enrolled syllabus modules.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={openEditCourse}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Edit Course</span>
              </button>
              <button
                onClick={() => openAddSubjectForSemester(selectedSemester)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Subject to Sem {selectedSemester}</span>
              </button>
            </div>
          </div>

          {/* Semester Tabs */}
          <div className="px-5 pt-3 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto bg-white">
            {Array.from({ length: activeCourse.totalSemesters }, (_, i) => i + 1).map((sem) => {
              const semCount = courseSubjects.filter((s) => Number(s.semester) === Number(sem)).length;
              const isTabActive = selectedSemester === sem;

              return (
                <button
                  key={sem}
                  onClick={() => setSelectedSemester(sem)}
                  className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                    isTabActive
                      ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span>Semester {sem}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      semCount > 0
                        ? isTabActive
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-200 text-slate-700'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {semCount}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Semester Subjects Content */}
          <div className="p-5">
            {semesterSubjects.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-slate-50/70 border border-dashed border-slate-300 space-y-3">
                <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    No Subjects Configured for {activeCourse.courseCode} — Semester {selectedSemester}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    This semester currently has no registered subjects in the database. As administrator, you can configure the curriculum modules manually.
                  </p>
                </div>
                <button
                  onClick={() => openAddSubjectForSemester(selectedSemester)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Configure Subject for Semester {selectedSemester}</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-mono uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-4">Subject Code</th>
                      <th className="py-3 px-4">Title</th>
                      <th className="py-3 px-4">Credits</th>
                      <th className="py-3 px-4">Requirement Type</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {semesterSubjects.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">
                          {sub.subjectCode}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          {sub.name}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-700">
                          {sub.credits} Credits
                        </td>
                        <td className="py-3.5 px-4">
                          {sub.isRequired ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold text-[11px]">
                              Core Required
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 font-semibold text-[11px]">
                              Elective ({sub.electiveGroup || 'General'})
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={sub.isActive ? 'ACTIVE' : 'INACTIVE'} size="sm" />
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditSubject(sub)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                              title="Edit Subject"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingSubject(sub)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete or Archive Subject"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= ADD COURSE MODAL ================= */}
      {isAddCourseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Add Degree Programme</h2>
              <button
                onClick={() => setIsAddCourseModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCourseSubmit} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Course Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  placeholder="e.g. B.Sc (IT)"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 uppercase focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Full Programme Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="e.g. Bachelor of Science in Information Technology"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Total Semesters
                  </label>
                  <select
                    value={totalSemesters}
                    onChange={(e) => setTotalSemesters(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="4">4 Semesters (2 Years)</option>
                    <option value="6">6 Semesters (3 Years)</option>
                    <option value="8">8 Semesters (4 Years)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Duration (Years)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={durationYears}
                    onChange={(e) => setDurationYears(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddCourseModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isSubmitting ? 'Adding...' : 'Add Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT COURSE MODAL ================= */}
      {isEditCourseModalOpen && activeCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                Edit {activeCourse.courseCode} Details
              </h2>
              <button
                onClick={() => setIsEditCourseModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleEditCourseSubmit} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Programme Name
                </label>
                <input
                  type="text"
                  required
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Semesters Count
                  </label>
                  <select
                    value={totalSemesters}
                    onChange={(e) => setTotalSemesters(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="4">4 Semesters</option>
                    <option value="6">6 Semesters</option>
                    <option value="8">8 Semesters</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Duration (Years)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={durationYears}
                    onChange={(e) => setDurationYears(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Active Status
                </label>
                <div className="flex items-center gap-3 pt-1">
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="courseActive"
                      checked={courseIsActive}
                      onChange={() => setCourseIsActive(true)}
                      className="accent-indigo-600"
                    />
                    <span>Active Programme</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="courseActive"
                      checked={!courseIsActive}
                      onChange={() => setCourseIsActive(false)}
                      className="accent-rose-600"
                    />
                    <span>Archived / Inactive</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditCourseModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= ADD SUBJECT MODAL ================= */}
      {isAddSubjectModalOpen && activeCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                Add Subject to {activeCourse.courseCode} — Sem {selectedSemester}
              </h2>
              <button
                onClick={() => setIsAddSubjectModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddSubjectSubmit} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Subject Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={subCode}
                  onChange={(e) => setSubCode(e.target.value)}
                  placeholder="e.g. BCA-201 or BCA-301"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 uppercase focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Subject Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  placeholder="e.g. Database Management Systems"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Credits
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={subCredits}
                    onChange={(e) => setSubCredits(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Module Type
                  </label>
                  <select
                    value={subIsRequired ? 'CORE' : 'ELECTIVE'}
                    onChange={(e) => setSubIsRequired(e.target.value === 'CORE')}
                    className="w-full px-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="CORE">Core Required</option>
                    <option value="ELECTIVE">Elective</option>
                  </select>
                </div>
              </div>

              {!subIsRequired && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Elective Group
                  </label>
                  <input
                    type="text"
                    value={subElectiveGroup}
                    onChange={(e) => setSubElectiveGroup(e.target.value)}
                    placeholder="e.g. EL_GRP_1 or Discipline Specific"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddSubjectModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isSubmitting ? 'Saving...' : 'Add Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT SUBJECT MODAL ================= */}
      {editingSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                Edit Subject {editingSubject.subjectCode}
              </h2>
              <button
                onClick={() => setEditingSubject(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubjectSubmit} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Subject Code
                </label>
                <input
                  type="text"
                  required
                  value={subCode}
                  onChange={(e) => setSubCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 uppercase focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Subject Title
                </label>
                <input
                  type="text"
                  required
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Credits
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={subCredits}
                    onChange={(e) => setSubCredits(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Requirement
                  </label>
                  <select
                    value={subIsRequired ? 'CORE' : 'ELECTIVE'}
                    onChange={(e) => setSubIsRequired(e.target.value === 'CORE')}
                    className="w-full px-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="CORE">Core Required</option>
                    <option value="ELECTIVE">Elective</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSubject(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE SUBJECT CONFIRMATION MODAL ================= */}
      {deletingSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center gap-3 text-rose-600 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center font-bold">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Confirm Subject Deletion</h3>
                <p className="text-xs text-slate-500">Safe academic governance check</p>
              </div>
            </div>

            <div className="mt-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
              <p className="font-semibold">
                Are you sure you want to remove <span className="font-mono">{deletingSubject.subjectCode}</span> ({deletingSubject.name})?
              </p>
              <p className="text-[11px] text-amber-800">
                If faculty assignments or assessment marks are linked to this subject, the server will safely deactivate it instead of deleting historical student records.
              </p>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingSubject(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmDeleteSubject}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isSubmitting ? 'Processing...' : 'Confirm Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
