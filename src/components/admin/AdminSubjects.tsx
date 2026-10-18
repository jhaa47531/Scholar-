import React, { useState, useMemo } from 'react';
import { BookOpen, Search, Filter } from 'lucide-react';
import { CourseStructure, SubjectMaster } from '../../types/domain.ts';
import { StatusBadge } from '../common/StatusBadge.tsx';
import { EmptyState } from '../common/EmptyState.tsx';

interface AdminSubjectsProps {
  subjects: SubjectMaster[];
  courses: CourseStructure[];
}

export const AdminSubjects: React.FC<AdminSubjectsProps> = ({ subjects, courses }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('ALL');
  const [selectedSemester, setSelectedSemester] = useState('ALL');

  const courseMap = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses]);

  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.subjectCode.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCourse = selectedCourse === 'ALL' || s.courseId === selectedCourse;
      const matchSemester = selectedSemester === 'ALL' || s.semester.toString() === selectedSemester;

      return matchSearch && matchCourse && matchSemester;
    });
  }, [subjects, searchTerm, selectedCourse, selectedSemester]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            Curriculum & Subjects Master
          </h1>
          <p className="mt-0.5 text-xs text-slate-400">
            Institutional subject catalog, credit values, semester allocations, and elective groupings.
          </p>
        </div>

        <div className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
          Subjects: <span className="font-bold text-amber-400 tabular-nums">{filteredSubjects.length}</span> of {subjects.length}
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
            placeholder="Search by subject code (e.g. BCA101) or title..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>

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
                {c.courseCode}
              </option>
            ))}
          </select>

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
        </div>
      </div>

      {/* Subjects Table */}
      {filteredSubjects.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No Subjects Found"
          description="No curriculum subjects match the active filters. Try resetting search filters."
        />
      ) : (
        <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Subject Code</th>
                  <th className="py-3 px-4">Subject Title</th>
                  <th className="py-3 px-4">Degree Programme</th>
                  <th className="py-3 px-4">Semester</th>
                  <th className="py-3 px-4">Credits</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredSubjects.map((subject) => {
                  const course = courseMap.get(subject.courseId);
                  return (
                    <tr key={subject.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-400/90">
                        {subject.subjectCode}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {subject.name}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-300">
                        {course ? course.courseCode : subject.courseId}
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums text-slate-300">
                        Sem {subject.semester}
                      </td>
                      <td className="py-3.5 px-4 font-mono tabular-nums text-slate-300">
                        {subject.credits} Credits
                      </td>
                      <td className="py-3.5 px-4">
                        {subject.isRequired ? (
                          <span className="text-[11px] font-medium text-slate-300">
                            Core Required
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-amber-400/80 font-mono">
                            Elective ({subject.electiveGroup || 'General'})
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <StatusBadge status={subject.isActive ? 'ACTIVE' : 'INACTIVE'} size="sm" />
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
