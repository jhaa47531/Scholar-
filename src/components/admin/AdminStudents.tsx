import React, { useState, useMemo } from 'react';
import { Search, Filter, GraduationCap, Mail, Hash } from 'lucide-react';
import { CourseStructure, StudentProfile } from '../../types/domain.ts';
import { StatusBadge } from '../common/StatusBadge.tsx';
import { EmptyState } from '../common/EmptyState.tsx';

interface AdminStudentsProps {
  students: StudentProfile[];
  courses: CourseStructure[];
}

export const AdminStudents: React.FC<AdminStudentsProps> = ({ students, courses }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('ALL');
  const [selectedSemester, setSelectedSemester] = useState('ALL');

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.enrollmentNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.rollNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCourse = selectedCourse === 'ALL' || s.courseId === selectedCourse;
      const matchSemester = selectedSemester === 'ALL' || s.currentSemester.toString() === selectedSemester;

      return matchSearch && matchCourse && matchSemester;
    });
  }, [students, searchTerm, selectedCourse, selectedSemester]);

  const courseMap = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-amber-400" />
            Enrolled Students Directory
          </h1>
          <p className="mt-0.5 text-xs text-slate-400">
            Institutional roster of students registered across academic programmes and cohorts.
          </p>
        </div>

        <div className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
          Total Enrolled: <span className="font-bold text-amber-400 tabular-nums">{filteredStudents.length}</span> of {students.length}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student name, roll no, enrollment ID, or email..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        {/* Course Filter */}
        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none cursor-pointer"
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
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Semesters</option>
            <option value="1">Semester 1</option>
            <option value="2">Semester 2</option>
            <option value="3">Semester 3</option>
            <option value="4">Semester 4</option>
          </select>

          {(searchTerm || selectedCourse !== 'ALL' || selectedSemester !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCourse('ALL');
                setSelectedSemester('ALL');
              }}
              className="px-2.5 py-2 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              Reset
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
              : 'No students have been enrolled in the institution yet.'
          }
        />
      ) : (
        <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Student Details</th>
                  <th className="py-3 px-4">Roll & Enrollment No.</th>
                  <th className="py-3 px-4">Degree Programme</th>
                  <th className="py-3 px-4">Current Semester</th>
                  <th className="py-3 px-4">Admission Session</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredStudents.map((student) => {
                  const course = courseMap.get(student.courseId);
                  return (
                    <tr key={student.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{student.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-500" />
                          <span>{student.email}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums text-slate-300">
                        <div className="font-semibold text-amber-400/90">{student.rollNo}</div>
                        <div className="text-[11px] text-slate-500">{student.enrollmentNo}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-200">
                          {course ? course.courseCode : student.courseId}
                        </span>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">
                          {course?.name}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums text-slate-300">
                        Semester {student.currentSemester}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {student.admissionSessionId}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <StatusBadge status={student.isActive ? 'ACTIVE' : 'INACTIVE'} size="sm" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
