import React from 'react';
import { Layers, Calendar, Clock, BookOpen } from 'lucide-react';
import { CourseStructure, SubjectMaster } from '../../types/domain.ts';
import { StatusBadge } from '../common/StatusBadge.tsx';

interface AdminCoursesProps {
  courses: CourseStructure[];
  subjects: SubjectMaster[];
}

export const AdminCourses: React.FC<AdminCoursesProps> = ({ courses, subjects }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            Degree Programmes & Course Structures
          </h1>
          <p className="mt-0.5 text-xs text-slate-400">
            Registered degree programs, semester structures, and program durations.
          </p>
        </div>

        <div className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
          Programmes: <span className="font-bold text-amber-400 tabular-nums">{courses.length}</span> Active
        </div>
      </div>

      {/* Courses Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map((course) => {
          const courseSubjects = subjects.filter((s) => s.courseId === course.id);
          const totalCredits = courseSubjects.reduce((acc, s) => acc + s.credits, 0);

          return (
            <div
              key={course.id}
              className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                    {course.courseCode}
                  </span>
                  <h3 className="text-sm font-semibold text-white mt-2 leading-tight">
                    {course.name}
                  </h3>
                </div>
                <StatusBadge status={course.isActive ? 'ACTIVE' : 'INACTIVE'} size="sm" />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/80 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-850">
                  <span className="text-[10px] text-slate-400 block font-mono">SEMESTERS</span>
                  <span className="font-mono font-semibold text-white tabular-nums text-sm">
                    {course.totalSemesters} Semesters
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-850">
                  <span className="text-[10px] text-slate-400 block font-mono">DURATION</span>
                  <span className="font-mono font-semibold text-white tabular-nums text-sm">
                    {course.durationYears} Years
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-slate-400 font-mono">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                  {courseSubjects.length} Registered Subjects
                </span>
                <span className="text-amber-400 font-medium">
                  {totalCredits} Credits
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
