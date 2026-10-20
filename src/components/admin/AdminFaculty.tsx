import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Mail,
  Building2,
  Briefcase,
  UserPlus,
  Edit2,
  Power,
  X,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { TeacherProfile } from '../../types/domain.ts';
import { StatusBadge } from '../common/StatusBadge.tsx';
import { EmptyState } from '../common/EmptyState.tsx';
import { api } from '../../services/api.ts';

interface AdminFacultyProps {
  faculty: TeacherProfile[];
  onRefresh?: () => Promise<void> | void;
}

export const AdminFaculty: React.FC<AdminFacultyProps> = ({ faculty, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherProfile | null>(null);

  // Add Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [department, setDepartment] = useState('Computer Applications');
  const [designation, setDesignation] = useState('Assistant Professor');

  // Edit Form State
  const [editName, setEditName] = useState('');
  const [editEmployeeCode, setEditEmployeeCode] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editDesignation, setEditDesignation] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);

  // Status & Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const departments = useMemo(() => {
    const set = new Set(faculty.map((f) => f.department).filter(Boolean));
    return Array.from(set);
  }, [faculty]);

  const filteredFaculty = useMemo(() => {
    return faculty.filter((f) => {
      const matchSearch =
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.designation.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDept = selectedDept === 'ALL' || f.department === selectedDept;

      return matchSearch && matchDept;
    });
  }, [faculty, searchTerm, selectedDept]);

  const openAddModal = () => {
    setName('');
    setEmail('');
    setEmployeeCode(`FAC-CS-00${faculty.length + 1}`);
    setDepartment('Computer Applications');
    setDesignation('Assistant Professor');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (teacher: TeacherProfile) => {
    setEditingTeacher(teacher);
    setEditName(teacher.name);
    setEditEmployeeCode(teacher.employeeCode);
    setEditDepartment(teacher.department);
    setEditDesignation(teacher.designation);
    setEditIsActive(teacher.isActive);
    setFormError(null);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setFormError('Faculty name and institutional email are required.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      const res = await api.createTeacher({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        employeeCode: employeeCode.trim().toUpperCase(),
        department: department.trim(),
        designation: designation.trim(),
      });

      if (res.success) {
        setSuccessMessage(`Faculty member ${name.trim()} added successfully.`);
        setIsAddModalOpen(false);
        if (onRefresh) await onRefresh();
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setFormError(res.message || 'Failed to create faculty member.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Error creating faculty account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;

    setIsSubmitting(true);
    setFormError(null);
    try {
      const res = await api.updateTeacher(editingTeacher.id, {
        name: editName.trim(),
        employeeCode: editEmployeeCode.trim().toUpperCase(),
        department: editDepartment.trim(),
        designation: editDesignation.trim(),
        isActive: editIsActive,
      });

      if (res.success) {
        setSuccessMessage(`Faculty member ${editingTeacher.name} updated.`);
        setEditingTeacher(null);
        if (onRefresh) await onRefresh();
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setFormError(res.message || 'Failed to update faculty member.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Error updating faculty account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (teacher: TeacherProfile) => {
    try {
      const res = await api.updateTeacher(teacher.id, { isActive: !teacher.isActive });
      if (res.success && onRefresh) {
        await onRefresh();
      }
    } catch (err: any) {
      console.error('Error toggling faculty status:', err);
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
            <Users className="w-5 h-5 text-indigo-600" />
            Faculty & Department Directory
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Global Institute of Information and Technology — Teaching staff records, employee identifiers, academic departments, and institutional designations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-mono px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 shadow-2xs">
            Faculty Count: <span className="font-bold text-indigo-600 tabular-nums">{filteredFaculty.length}</span> / {faculty.length}
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Faculty</span>
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
            placeholder="Search by faculty name, employee code, department, or email..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
          />
        </div>

        {departments.length > 0 && (
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        )}

        {(searchTerm || selectedDept !== 'ALL') && (
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedDept('ALL');
            }}
            className="px-2.5 py-2 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Faculty Table */}
      {filteredFaculty.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Faculty Records Found"
          description={
            searchTerm || selectedDept !== 'ALL'
              ? 'No teaching staff match your search criteria. Try clearing the search filter.'
              : 'No faculty members configured yet. Click "Add Faculty" above to create teaching accounts.'
          }
        />
      ) : (
        <div className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-mono uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Faculty Member</th>
                  <th className="py-3 px-4">Employee Code</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFaculty.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{f.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{f.email}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">
                      {f.employeeCode}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {f.department}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                        {f.designation}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={f.isActive ? 'ACTIVE' : 'INACTIVE'} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(f)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                          title="Edit Faculty Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(f)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            f.isActive
                              ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={f.isActive ? 'Deactivate Faculty Member' : 'Reactivate Faculty Member'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= ADD FACULTY MODAL ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Add Faculty Member</h2>
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
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Ramesh Kumar"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
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
                  placeholder="e.g. ramesh@faculty.edu"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Employee Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value)}
                  placeholder="e.g. FAC-CS-003"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 font-mono uppercase focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Computer Applications"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Designation
                  </label>
                  <select
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Professor">Professor</option>
                    <option value="Professor & Head">Professor & Head</option>
                    <option value="Dean">Dean</option>
                  </select>
                </div>
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
                  {isSubmitting ? 'Adding...' : 'Confirm Faculty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT FACULTY MODAL ================= */}
      {editingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                Edit Faculty {editingTeacher.name}
              </h2>
              <button
                onClick={() => setEditingTeacher(null)}
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

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Employee Code
                </label>
                <input
                  type="text"
                  required
                  value={editEmployeeCode}
                  onChange={(e) => setEditEmployeeCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 font-mono uppercase focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    required
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Designation
                  </label>
                  <select
                    value={editDesignation}
                    onChange={(e) => setEditDesignation(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Professor">Professor</option>
                    <option value="Professor & Head">Professor & Head</option>
                    <option value="Dean">Dean</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Account Status
                </label>
                <div className="flex items-center gap-3 pt-1">
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="facultyStatus"
                      checked={editIsActive}
                      onChange={() => setEditIsActive(true)}
                      className="accent-indigo-600"
                    />
                    <span>Active Faculty</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="facultyStatus"
                      checked={!editIsActive}
                      onChange={() => setEditIsActive(false)}
                      className="accent-rose-600"
                    />
                    <span>Deactivated</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingTeacher(null)}
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
    </div>
  );
};
