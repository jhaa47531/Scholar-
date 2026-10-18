import React, { useState, useMemo } from 'react';
import { Users, Search, Mail, Building2, Briefcase } from 'lucide-react';
import { TeacherProfile } from '../../types/domain.ts';
import { StatusBadge } from '../common/StatusBadge.tsx';
import { EmptyState } from '../common/EmptyState.tsx';

interface AdminFacultyProps {
  faculty: TeacherProfile[];
}

export const AdminFaculty: React.FC<AdminFacultyProps> = ({ faculty }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            Faculty & Department Directory
          </h1>
          <p className="mt-0.5 text-xs text-slate-400">
            Teaching staff profiles, employee codes, academic departments, and institutional designations.
          </p>
        </div>

        <div className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
          Faculty Count: <span className="font-bold text-amber-400 tabular-nums">{filteredFaculty.length}</span> of {faculty.length}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by faculty name, employee code, department, or email..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        {departments.length > 0 && (
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Faculty Table */}
      {filteredFaculty.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Faculty Records Found"
          description="No teaching staff match your search criteria. Try clearing the search filter."
        />
      ) : (
        <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Faculty Member</th>
                  <th className="py-3 px-4">Employee Code</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredFaculty.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{f.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-500" />
                        <span>{f.email}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-amber-400/90">
                      {f.employeeCode}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="flex items-center gap-1 text-slate-300">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                        {f.department}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="flex items-center gap-1 text-slate-300">
                        <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                        {f.designation}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <StatusBadge status={f.isActive ? 'ACTIVE' : 'INACTIVE'} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
