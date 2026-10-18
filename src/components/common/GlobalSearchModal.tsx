import React, { useState, useMemo } from 'react';
import { Search, X, GraduationCap, Users, BookOpen, Layers, ArrowRight } from 'lucide-react';
import { CourseStructure, StudentProfile, SubjectMaster, TeacherProfile } from '../../types/domain.ts';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: StudentProfile[];
  faculty: TeacherProfile[];
  subjects: SubjectMaster[];
  courses: CourseStructure[];
  onSelectResult: (type: 'student' | 'faculty' | 'subject' | 'course', id: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  students,
  faculty,
  subjects,
  courses,
  onSelectResult,
}) => {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();

    const matchedStudents = students
      .filter((s) => s.name.toLowerCase().includes(q) || s.rollNo.toLowerCase().includes(q) || s.enrollmentNo.toLowerCase().includes(q))
      .slice(0, 4)
      .map((s) => ({ type: 'student' as const, id: s.id, title: s.name, subtitle: `Roll: ${s.rollNo} · Course: ${s.courseId.toUpperCase()}` }));

    const matchedFaculty = faculty
      .filter((f) => f.name.toLowerCase().includes(q) || f.department.toLowerCase().includes(q) || f.employeeCode.toLowerCase().includes(q))
      .slice(0, 3)
      .map((f) => ({ type: 'faculty' as const, id: f.id, title: f.name, subtitle: `${f.designation} · Dept of ${f.department}` }));

    const matchedSubjects = subjects
      .filter((sub) => sub.name.toLowerCase().includes(q) || sub.subjectCode.toLowerCase().includes(q))
      .slice(0, 3)
      .map((sub) => ({ type: 'subject' as const, id: sub.id, title: `${sub.subjectCode} - ${sub.name}`, subtitle: `Semester ${sub.semester} · ${sub.credits} Credits` }));

    const matchedCourses = courses
      .filter((c) => c.name.toLowerCase().includes(q) || c.courseCode.toLowerCase().includes(q))
      .slice(0, 2)
      .map((c) => ({ type: 'course' as const, id: c.id, title: `${c.courseCode} - ${c.name}`, subtitle: `${c.durationYears} Years · ${c.totalSemesters} Semesters` }));

    return [...matchedStudents, ...matchedFaculty, ...matchedSubjects, ...matchedCourses];
  }, [query, students, faculty, subjects, courses]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20 flex justify-center items-start">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative w-full max-w-2xl surface-navy-elevated rounded-2xl border border-slate-800 shadow-2xl overflow-hidden mt-8">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-amber-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search students, faculty, subjects, or courses..."
            autoFocus
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded text-slate-500 hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs font-mono text-slate-400 bg-slate-800/80 px-2 py-1 rounded border border-slate-700"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="p-2 max-h-96 overflow-y-auto divide-y divide-slate-800/40">
          {query && results.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No academic records matching &ldquo;{query}&rdquo;
            </div>
          ) : !query ? (
            <div className="p-6 text-center text-xs text-slate-500">
              Type to instantly search registered students, faculty members, curriculum subjects, or degree programs.
            </div>
          ) : (
            results.map((res) => {
              const Icon =
                res.type === 'student'
                  ? GraduationCap
                  : res.type === 'faculty'
                  ? Users
                  : res.type === 'subject'
                  ? BookOpen
                  : Layers;

              return (
                <button
                  key={`${res.type}-${res.id}`}
                  onClick={() => {
                    onSelectResult(res.type, res.id);
                    onClose();
                  }}
                  className="w-full p-3 rounded-xl hover:bg-slate-800/60 transition-colors flex items-center justify-between group text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-800 text-amber-400">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-amber-300 transition-colors">
                        {res.title}
                      </div>
                      <div className="text-[11px] text-slate-400">{res.subtitle}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
