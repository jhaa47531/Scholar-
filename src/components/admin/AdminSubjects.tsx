import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  X,
  RotateCcw,
} from 'lucide-react';
import { CourseStructure, SubjectMaster } from '../../types/domain.ts';
import { StatusBadge } from '../common/StatusBadge.tsx';
import { EmptyState } from '../common/EmptyState.tsx';
import { api } from '../../services/api.ts';

interface AdminSubjectsProps {
  subjects: SubjectMaster[];
  courses: CourseStructure[];
  onRefresh?: () => Promise<void> | void;
}

export const AdminSubjects: React.FC<AdminSubjectsProps> = ({
  subjects,
  courses,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('ALL');
  const [selectedSemester, setSelectedSemester] = useState('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectMaster | null>(null);
  const [deletingSubject, setDeletingSubject] = useState<SubjectMaster | null>(null);

  // Form State
  const [subjectCode, setSubjectCode] = useState('');
  const [name, setName] = useState('');
  const [courseId, setCourseId] = useState(courses[0]?.id || 'crs_bca');
  const [semester, setSemester] = useState('1');
  const [credits, setCredits] = useState('3');
  const [isRequired, setIsRequired] = useState(true);
  const [electiveGroup, setElectiveGroup] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Sync courseId when courses prop updates
  React.useEffect(() => {
    if (courses.length > 0 && (!courseId || !courses.some((c) => c.id === courseId))) {
      setCourseId(courses[0].id);
    }
  }, [courses, courseId]);

  // Feedback State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const courseMap = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses]);

  // Selected Course Object for Add Modal
  const activeCourseObj = useMemo(() => {
    return courses.find((c) => c.id === courseId) || courses[0];
  }, [courses, courseId]);

  const maxSemesters = activeCourseObj ? activeCourseObj.totalSemesters : 6;

  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.subjectCode.toLowerCase().includes(searchTerm.toLowerCase());

      const selectedCourseCode = courseMap.get(selectedCourse)?.courseCode;
      const matchCourse =
        selectedCourse === 'ALL' ||
        s.courseId === selectedCourse ||
        s.courseId.toLowerCase() === selectedCourse.toLowerCase() ||
        (selectedCourseCode && s.courseId.toLowerCase() === selectedCourseCode.toLowerCase());

      const matchSemester =
        selectedSemester === 'ALL' || Number(s.semester) === Number(selectedSemester);

      return matchSearch && matchCourse && matchSemester;
    });
  }, [subjects, searchTerm, selectedCourse, selectedSemester, courseMap]);

  const openAddModal = () => {
    setSubjectCode('');
    setName('');
    setCourseId(courses[0]?.id || 'crs_bca');
    setSemester('1');
    setCredits('3');
    setIsRequired(true);
    setElectiveGroup('');
    setIsActive(true);
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (sub: SubjectMaster) => {
    setEditingSubject(sub);
    setSubjectCode(sub.subjectCode);
    setName(sub.name);
    setCourseId(sub.courseId);
    setSemester(sub.semester.toString());
    setCredits(sub.credits.toString());
    setIsRequired(sub.isRequired);
    setElectiveGroup(sub.electiveGroup || '');
    setIsActive(sub.isActive);
    setFormError(null);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectCode.trim() || !name.trim()) {
      setFormError('Subject code and title are required.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      const res = await api.createSubject({
        subjectCode: subjectCode.trim().toUpperCase(),
        name: name.trim(),
        courseId,
        semester: parseInt(semester, 10),
        credits: parseInt(credits, 10) || 3,
        isRequired,
        electiveGroup: !isRequired && electiveGroup.trim() ? electiveGroup.trim() : undefined,
      });

      if (res.success) {
        setSuccessMessage(`Subject ${subjectCode.trim()} created successfully.`);
        setIsAddModalOpen(false);
        if (onRefresh) await onRefresh();
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setFormError(res.message || 'Failed to create subject.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Error creating subject.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject) return;

    setIsSubmitting(true);
    setFormError(null);
    try {
      const res = await api.updateSubject(editingSubject.id, {
        subjectCode: subjectCode.trim().toUpperCase(),
        name: name.trim(),
        courseId,
        semester: parseInt(semester, 10),
        credits: parseInt(credits, 10) || 3,
        isRequired,
        electiveGroup: !isRequired && electiveGroup.trim() ? electiveGroup.trim() : undefined,
        isActive,
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
      setFormError(err.message || 'Error updating subject.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            Curriculum & Subjects Catalog
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Global Institute of Information and Technology — Institutional subject repository, credit ratings, semester allocations, and elective groupings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-mono px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 shadow-2xs">
            Subjects: <span className="font-bold text-indigo-600 tabular-nums">{filteredSubjects.length}</span> / {subjects.length}
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Subject</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by subject code (e.g. BCA-101, BCA-201) or title..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer"
          >
            <option value="ALL">All Degree Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.courseCode} ({c.name})
              </option>
            ))}
          </select>

          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer"
          >
            <option value="ALL">All Semesters</option>
            <option value="1">Semester 1</option>
            <option value="2">Semester 2</option>
            <option value="3">Semester 3</option>
            <option value="4">Semester 4</option>
            <option value="5">Semester 5</option>
            <option value="6">Semester 6</option>
            <option value="7">Semester 7</option>
            <option value="8">Semester 8</option>
          </select>

          {(searchTerm || selectedCourse !== 'ALL' || selectedSemester !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCourse('ALL');
                setSelectedSemester('ALL');
              }}
              className="px-2.5 py-2 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Subjects Table */}
      {filteredSubjects.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No Subjects Found"
          description={
            searchTerm || selectedCourse !== 'ALL' || selectedSemester !== 'ALL'
              ? 'No curriculum subjects match the active filters. Try resetting search filters.'
              : 'No subjects have been configured yet. Click "Add Subject" above to register course modules.'
          }
        />
      ) : (
        <div className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-mono uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Subject Code</th>
                  <th className="py-3 px-4">Subject Title</th>
                  <th className="py-3 px-4">Degree Programme</th>
                  <th className="py-3 px-4">Semester</th>
                  <th className="py-3 px-4">Credits</th>
                  <th className="py-3 px-4">Module Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubjects.map((subject) => {
                  const course = courseMap.get(subject.courseId);
                  return (
                    <tr key={subject.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">
                        {subject.subjectCode}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {subject.name}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {course ? course.courseCode : subject.courseId}
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums text-slate-700">
                        Sem {subject.semester}
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums text-slate-700">
                        {subject.credits} Credits
                      </td>
                      <td className="py-3.5 px-4">
                        {subject.isRequired ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold text-[11px]">
                            Core Required
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 font-semibold text-[11px]">
                            Elective ({subject.electiveGroup || 'General'})
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={subject.isActive ? 'ACTIVE' : 'INACTIVE'} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(subject)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                            title="Edit Subject"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingSubject(subject)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete or Archive Subject"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= ADD SUBJECT MODAL ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Add New Subject</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
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

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Subject Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={subjectCode}
                    onChange={(e) => setSubjectCode(e.target.value)}
                    placeholder="e.g. BCA-201"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 uppercase focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Credits
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={credits}
                    onChange={(e) => setCredits(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Subject Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Data Communication & Networking"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Degree Programme
                  </label>
                  <select
                    value={courseId}
                    onChange={(e) => {
                      setCourseId(e.target.value);
                      setSemester('1');
                    }}
                    className="w-full px-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.courseCode} ({c.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Semester
                  </label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {Array.from({ length: maxSemesters }, (_, i) => i + 1).map((s) => (
                      <option key={s} value={s.toString()}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Requirement Type
                  </label>
                  <select
                    value={isRequired ? 'CORE' : 'ELECTIVE'}
                    onChange={(e) => setIsRequired(e.target.value === 'CORE')}
                    className="w-full px-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="CORE">Core Required</option>
                    <option value="ELECTIVE">Elective</option>
                  </select>
                </div>

                {!isRequired && (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Elective Group Name
                    </label>
                    <input
                      type="text"
                      value={electiveGroup}
                      onChange={(e) => setElectiveGroup(e.target.value)}
                      placeholder="e.g. EL_GRP_1"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isSubmitting ? 'Adding...' : 'Confirm Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT SUBJECT MODAL ================= */}
      {editingSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 overflow-hidden">
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

            <form onSubmit={handleEditSubmit} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Subject Code
                  </label>
                  <input
                    type="text"
                    required
                    value={subjectCode}
                    onChange={(e) => setSubjectCode(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 uppercase focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Credits
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={credits}
                    onChange={(e) => setCredits(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Subject Title
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Reassign Programme
                  </label>
                  <select
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.courseCode} ({c.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Reassign Semester
                  </label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s.toString()}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Requirement Type
                  </label>
                  <select
                    value={isRequired ? 'CORE' : 'ELECTIVE'}
                    onChange={(e) => setIsRequired(e.target.value === 'CORE')}
                    className="w-full px-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="CORE">Core Required</option>
                    <option value="ELECTIVE">Elective</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Status
                  </label>
                  <div className="flex items-center gap-3 pt-2">
                    <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="subStatus"
                        checked={isActive}
                        onChange={() => setIsActive(true)}
                        className="accent-indigo-600"
                      />
                      <span>Active</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="subStatus"
                        checked={!isActive}
                        onChange={() => setIsActive(false)}
                        className="accent-rose-600"
                      />
                      <span>Inactive</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingSubject(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
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

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {deletingSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center gap-3 text-rose-600 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center font-bold">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Remove Subject</h3>
                <p className="text-xs text-slate-500">Safe institutional data integrity</p>
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
                onClick={handleConfirmDelete}
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
