import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  GraduationCap,
  Mail,
  UserPlus,
  X,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Power,
  RotateCcw,
} from 'lucide-react';
import { CourseStructure, StudentProfile } from '../../types/domain.ts';
import { StatusBadge } from '../common/StatusBadge.tsx';
import { EmptyState } from '../common/EmptyState.tsx';
import { api } from '../../services/api.ts';

interface AdminStudentsProps {
  students: StudentProfile[];
  courses: CourseStructure[];
  onRefresh?: () => Promise<void> | void;
}

export const AdminStudents: React.FC<AdminStudentsProps> = ({
  students,
  courses,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('ALL');
  const [selectedSemester, setSelectedSemester] = useState('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentProfile | null>(null);

  // Add Student Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [enrollmentNo, setEnrollmentNo] = useState('');
  const [courseId, setCourseId] = useState(courses[0]?.id || 'crs_bca');
  const [currentSemester, setCurrentSemester] = useState('1');

  // Edit Student Form State
  const [editName, setEditName] = useState('');
  const [editRollNo, setEditRollNo] = useState('');
  const [editEnrollmentNo, setEditEnrollmentNo] = useState('');
  const [editSemester, setEditSemester] = useState('1');
  const [editIsActive, setEditIsActive] = useState(true);

  // Submission Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const courseMap = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses]);

  // Selected Course Object to compute semester limits
  const activeCourseObj = useMemo(() => {
    return courses.find((c) => c.id === courseId) || courses[0];
  }, [courses, courseId]);

  const maxSemestersForSelectedCourse = activeCourseObj ? activeCourseObj.totalSemesters : 6;

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.enrollmentNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.rollNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCourse = selectedCourse === 'ALL' || s.courseId === selectedCourse;
      const matchSemester =
        selectedSemester === 'ALL' || s.currentSemester.toString() === selectedSemester;

      return matchSearch && matchCourse && matchSemester;
    });
  }, [students, searchTerm, selectedCourse, selectedSemester]);

  const openAddModal = () => {
    setName('');
    setEmail('');
    setRollNo('');
    setEnrollmentNo('');
    setCourseId(courses[0]?.id || 'crs_bca');
    setCurrentSemester('1');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (student: StudentProfile) => {
    setEditingStudent(student);
    setEditName(student.name);
    setEditRollNo(student.rollNo);
    setEditEnrollmentNo(student.enrollmentNo);
    setEditSemester(student.currentSemester.toString());
    setEditIsActive(student.isActive);
    setFormError(null);
  };

  const handleAddStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    // Validation
    if (!name.trim()) {
      setFormError('Student full name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setFormError('A valid institutional email address is required.');
      return;
    }
    if (!rollNo.trim()) {
      setFormError('Student roll number is required (e.g. BCA-04).');
      return;
    }
    if (!enrollmentNo.trim()) {
      setFormError('Institutional enrollment number is required (e.g. EN2025BCA004).');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.createStudent({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        rollNo: rollNo.trim().toUpperCase(),
        enrollmentNo: enrollmentNo.trim().toUpperCase(),
        courseId,
        currentSemester: parseInt(currentSemester, 10),
        admissionSessionId: 'sess_2025_26',
      });

      if (res.success) {
        setSuccessMessage(`Student ${name.trim()} successfully enrolled into ${activeCourseObj?.courseCode || 'course'}.`);
        setIsAddModalOpen(false);
        if (onRefresh) {
          await onRefresh();
        }
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setFormError(res.message || 'Failed to create student.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Network error while adding student.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setFormError(null);

    setIsSubmitting(true);
    try {
      const res = await api.updateStudent(editingStudent.id, {
        name: editName.trim(),
        rollNo: editRollNo.trim().toUpperCase(),
        enrollmentNo: editEnrollmentNo.trim().toUpperCase(),
        currentSemester: parseInt(editSemester, 10),
        isActive: editIsActive,
      });

      if (res.success) {
        setSuccessMessage(`Student ${editName.trim()} updated successfully.`);
        setEditingStudent(null);
        if (onRefresh) {
          await onRefresh();
        }
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setFormError(res.message || 'Failed to update student profile.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Network error while updating student.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStudentStatus = async (student: StudentProfile) => {
    try {
      const res = await api.updateStudent(student.id, { isActive: !student.isActive });
      if (res.success && onRefresh) {
        await onRefresh();
      }
    } catch (err: any) {
      console.error('Error toggling student status:', err);
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
            <GraduationCap className="w-5 h-5 text-indigo-600" />
            Enrolled Students Directory
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Institutional roster for Global Institute of Information and Technology. Manage enrollments, degree allocations, and cohort status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-mono px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 shadow-2xs">
            Enrolled: <span className="font-bold text-indigo-600 tabular-nums">{filteredStudents.length}</span> / {students.length}
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student name, roll number, enrollment ID, or email..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
          />
        </div>

        {/* Course Filter */}
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

          {/* Semester Filter */}
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

      {/* Students Data Table */}
      {filteredStudents.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No Students Found"
          description={
            searchTerm || selectedCourse !== 'ALL' || selectedSemester !== 'ALL'
              ? 'No student records match the active search or filter criteria. Try resetting filters.'
              : 'No students have been enrolled in the institution yet. Click "Add Student" above to enroll students.'
          }
        />
      ) : (
        <div className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-mono uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Student Details</th>
                  <th className="py-3 px-4">Roll & Enrollment No.</th>
                  <th className="py-3 px-4">Degree Programme</th>
                  <th className="py-3 px-4">Current Semester</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student) => {
                  const course = courseMap.get(student.courseId);
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{student.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{student.email}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums text-slate-700">
                        <div className="font-semibold text-indigo-700">{student.rollNo}</div>
                        <div className="text-[11px] text-slate-500">{student.enrollmentNo}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800">
                          {course ? course.courseCode : student.courseId}
                        </span>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">
                          {course?.name}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums text-slate-700">
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          Semester {student.currentSemester}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={student.isActive ? 'ACTIVE' : 'INACTIVE'} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(student)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                            title="Edit Student Details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleStudentStatus(student)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              student.isActive
                                ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={student.isActive ? 'Deactivate Student Account' : 'Reactivate Student Account'}
                          >
                            <Power className="w-3.5 h-3.5" />
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

      {/* ================= ADD STUDENT MODAL ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 sm:p-7 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    Enroll New Student
                  </h2>
                  <p className="text-xs text-slate-500">
                    Register a student record into the institutional database.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddStudentSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Maya Sen"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Institutional Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. maya.sen@student.edu"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Degree Programme <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={courseId}
                    onChange={(e) => {
                      setCourseId(e.target.value);
                      setCurrentSemester('1');
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
                    Semester <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={currentSemester}
                    onChange={(e) => setCurrentSemester(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {Array.from({ length: maxSemestersForSelectedCourse }, (_, idx) => idx + 1).map((sem) => (
                      <option key={sem} value={sem.toString()}>
                        Semester {sem}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Roll Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={rollNo}
                    onChange={(e) => setRollNo(e.target.value)}
                    placeholder="e.g. BCA-04"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Enrollment ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={enrollmentNo}
                    onChange={(e) => setEnrollmentNo(e.target.value)}
                    placeholder="e.g. EN2025BCA004"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isSubmitting ? 'Enrolling student...' : 'Confirm Enrollment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT STUDENT MODAL ================= */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 sm:p-7 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    Edit Student Profile
                  </h2>
                  <p className="text-xs text-slate-500">
                    Modify student records or update semester progression.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingStudent(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleEditStudentSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Roll Number
                  </label>
                  <input
                    type="text"
                    required
                    value={editRollNo}
                    onChange={(e) => setEditRollNo(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Enrollment ID
                  </label>
                  <input
                    type="text"
                    required
                    value={editEnrollmentNo}
                    onChange={(e) => setEditEnrollmentNo(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Current Semester
                  </label>
                  <select
                    value={editSemester}
                    onChange={(e) => setEditSemester(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s.toString()}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Account Status
                  </label>
                  <div className="flex items-center gap-3 pt-2">
                    <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="editStatus"
                        checked={editIsActive}
                        onChange={() => setEditIsActive(true)}
                        className="accent-indigo-600"
                      />
                      <span>Active</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="editStatus"
                        checked={!editIsActive}
                        onChange={() => setEditIsActive(false)}
                        className="accent-rose-600"
                      />
                      <span>Deactivated</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isSubmitting ? 'Saving changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
