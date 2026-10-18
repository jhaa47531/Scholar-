import React, { useState, useEffect } from 'react';
import { Users, Search, Mail, BookOpen, GraduationCap } from 'lucide-react';
import { StudentProfile, SubjectMaster, TeacherAssignment } from '../../types/domain.ts';
import { api } from '../../services/api.ts';
import { LoadingSkeleton } from '../common/LoadingSkeleton.tsx';
import { EmptyState } from '../common/EmptyState.tsx';

interface TeacherRosterProps {
  assignments: TeacherAssignment[];
  subjects: SubjectMaster[];
}

export const TeacherRoster: React.FC<TeacherRosterProps> = ({ assignments, subjects }) => {
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const mySubjects = assignments.map((a) => subjectMap.get(a.subjectId)).filter(Boolean) as SubjectMaster[];

  const [selectedSubjectId, setSelectedSubjectId] = useState(mySubjects[0]?.id || '');
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const selectedSubject = subjectMap.get(selectedSubjectId);

  useEffect(() => {
    if (selectedSubject) {
      loadStudents();
    }
  }, [selectedSubjectId]);

  const loadStudents = async () => {
    if (!selectedSubject) return;
    setIsLoading(true);
    try {
      const data = await api.getStudents(selectedSubject.courseId, selectedSubject.semester);
      setStudents(data);
    } catch (err) {
      console.error('Failed to load roster:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.enrollmentNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            Subject Enrollment Roster
          </h1>
          <p className="mt-0.5 text-xs text-slate-400">
            Enrolled student cohort for your assigned teaching subjects.
          </p>
        </div>

        <div className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
          Enrolled Cohort: <span className="font-bold text-amber-400 tabular-nums">{filteredStudents.length}</span> Students
        </div>
      </div>

      {/* Subject Filter Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="w-full sm:w-72">
          <label className="block text-[10px] font-mono text-slate-400 mb-1">ASSIGNED SUBJECT</label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none cursor-pointer"
          >
            {mySubjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.subjectCode} - {s.name} (Sem {s.semester})
              </option>
            ))}
          </select>
        </div>

        <div className="relative flex-1 self-end">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search students by name, roll no, or enrollment number..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
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
        <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Enrollment Number</th>
                  <th className="py-3 px-4">Degree Programme</th>
                  <th className="py-3 px-4">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                      {student.rollNo}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {student.name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {student.enrollmentNo}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-300">
                      {selectedSubject?.courseId.toUpperCase()} · Sem {student.currentSemester}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-slate-500" />
                        {student.email}
                      </span>
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
