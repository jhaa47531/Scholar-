import React, { useState, useMemo } from 'react';
import { Users, Search } from 'lucide-react';
import { StudentProfile, SubjectMaster, TeacherAssignment } from '../../types/domain.ts';
import { EmptyState } from '../common/EmptyState.tsx';
import { LoadingSkeleton } from '../common/LoadingSkeleton.tsx';

interface TeacherRosterProps {
  assignments: TeacherAssignment[];
  subjects: SubjectMaster[];
  students: StudentProfile[];
  isLoading?: boolean;
}

export const TeacherRoster: React.FC<TeacherRosterProps> = ({
  assignments,
  subjects,
  students,
  isLoading = false,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState(assignments[0]?.subjectId || '');
  const [searchTerm, setSearchTerm] = useState('');

  const subjectMap = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);

  const mySubjects = useMemo(() => {
    return assignments
      .map((a) => subjectMap.get(a.subjectId))
      .filter((s) => s !== undefined) as SubjectMaster[];
  }, [assignments, subjectMap]);

  const activeSubject = subjectMap.get(selectedSubjectId) || mySubjects[0];

  const filteredStudents = useMemo(() => {
    if (!activeSubject) return [];

    return students.filter((student) => {
      const matchCohort =
        student.courseId === activeSubject.courseId &&
        student.currentSemester === activeSubject.semester;

      const matchSearch =
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.rollNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.enrollmentNo.toLowerCase().includes(searchTerm.toLowerCase());

      return matchCohort && matchSearch;
    });
  }, [students, activeSubject, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Subject Enrollment Roster
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Enrolled student cohort for your assigned teaching subjects.
          </p>
        </div>

        <div className="text-xs font-mono px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-2xs">
          Enrolled Cohort: <span className="font-bold text-indigo-600 tabular-nums">{filteredStudents.length}</span> Students
        </div>
      </div>

      {/* Subject Filter Bar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="w-full sm:w-72">
          <label className="block text-[10px] font-mono text-slate-500 mb-1">ASSIGNED SUBJECT</label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer"
          >
            {mySubjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.subjectCode} - {s.name} (Sem {s.semester})
              </option>
            ))}
          </select>
        </div>

        <div className="relative flex-1 self-end">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search students by name, roll no, or enrollment number..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
          />
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={5} />
      ) : filteredStudents.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Students in Roster"
          description="No students are enrolled in this course semester cohort, or none match the active search term."
        />
      ) : (
        <div className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-mono uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Enrollment Number</th>
                  <th className="py-3 px-4">Degree Programme</th>
                  <th className="py-3 px-4">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">
                      {student.rollNo}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {student.name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {student.enrollmentNo}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {activeSubject?.courseId.toUpperCase()} (Semester {student.currentSemester})
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {student.email}
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
