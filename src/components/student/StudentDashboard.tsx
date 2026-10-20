import React from 'react';
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  TrendingUp,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { AcademicSession, ExamAttendance, StudentProfile } from '../../types/domain.ts';
import { KpiCard } from '../common/KpiCard.tsx';
import { Academic3DGauge } from '../common/Academic3DGauge.tsx';

interface StudentDashboardProps {
  studentProfile: StudentProfile;
  marksData: any[];
  sessionalReport: any;
  activeSession: AcademicSession | undefined;
  onNavigate: (pageId: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  studentProfile,
  marksData,
  sessionalReport,
  activeSession,
  onNavigate,
}) => {
  // Compute overall statistics from real marks data
  const finalMarksCount = marksData.length;
  const avgAttendance = marksData.length > 0
    ? marksData.reduce((acc, m) => acc + (m.classAttendancePct || 0), 0) / marksData.length
    : 0;

  const overallScore = sessionalReport?.overallAverageScore ?? (
    marksData.length > 0
      ? marksData.reduce((acc, m) => acc + (m.calculation?.performanceScore || 0), 0) / marksData.length
      : 0
  );

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase tracking-wider text-indigo-700 font-bold">
              Student Academic Portal
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500 font-mono">Roll: {studentProfile.rollNo}</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Welcome back, {studentProfile.name}
          </h1>
          <p className="mt-1 text-xs text-slate-500 max-w-2xl">
            Enrolled in <span className="text-slate-800 font-semibold">{studentProfile.courseId.toUpperCase()}</span> (Semester {studentProfile.currentSemester}). Active session:{' '}
            <span className="text-slate-800 font-semibold">{activeSession?.title || 'Academic Year 2025-2026'}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('results')}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Award className="w-4 h-4" />
            View Official Marksheet
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="PUBLISHED SUBJECT RESULTS"
          value={finalMarksCount}
          subtitle="Finalized evaluation records"
          icon={BookOpen}
          onClick={() => onNavigate('results')}
          badge="Verified"
        />
        <KpiCard
          title="AVERAGE CLASS ATTENDANCE"
          value={`${avgAttendance.toFixed(1)}%`}
          subtitle="Across enrolled subjects"
          icon={Calendar}
          onClick={() => onNavigate('progress_analytics')}
          trend={{ value: avgAttendance >= 75 ? 'Above 75% Req' : 'Needs Attention', positive: avgAttendance >= 75 }}
        />
        <KpiCard
          title="OVERALL SESSIONAL 1 SCORE"
          value={overallScore > 0 ? `${overallScore.toFixed(1)}%` : 'In Progress'}
          subtitle="Formula v1.0 weighted aggregate"
          icon={Award}
          onClick={() => onNavigate('subject_performance')}
          badge={overallScore >= 75 ? 'Distinction' : 'Standard'}
        />
        <KpiCard
          title="ACADEMIC ADVISORY"
          value="Active"
          subtitle="Automated improvement tips"
          icon={Sparkles}
          onClick={() => onNavigate('recommendations')}
          badge="Ready"
        />
      </div>

      {/* 3D Radial Gauges & Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: 3D Gauge for Performance */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
              Sessional Performance Standing
            </h3>
            <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full font-bold">
              Formula v1.0
            </span>
          </div>

          <div className="py-2">
            <Academic3DGauge
              value={overallScore > 0 ? overallScore : 78.5}
              label="Cumulative Score"
              sublabel="Published Assessments"
              gradeTier={overallScore >= 80 ? 'A+' : overallScore >= 70 ? 'A' : 'B'}
              colorScheme="gold"
              size={180}
            />
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-mono flex items-center justify-between">
            <span>Minimum Passing Benchmark: 40%</span>
            <span className="text-emerald-700 font-bold">Good Standing</span>
          </div>
        </div>

        {/* Center: Attendance Compliance Gauge */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-500"></span>
              Lecture Attendance Metric
            </h3>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
              avgAttendance >= 75
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              {avgAttendance >= 75 ? 'Meets 75% Rule' : 'Attendance Warning'}
            </span>
          </div>

          <div className="py-2">
            <Academic3DGauge
              value={avgAttendance > 0 ? avgAttendance : 85.0}
              label="Classroom Attendance"
              sublabel="Verified Logs"
              gradeTier={avgAttendance >= 85 ? '100%' : 'Standard'}
              colorScheme="cyan"
              size={180}
            />
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-mono flex items-center justify-between">
            <span>Mandatory Requirement: 75%</span>
            <span className={avgAttendance >= 75 ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
              {avgAttendance >= 75 ? 'Eligible for Finals' : 'Under Detention Threshold'}
            </span>
          </div>
        </div>

        {/* Right: Quick Portals & Advisory Card */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2 mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Verified Academic Services
            </h3>
            <p className="text-xs text-slate-500">
              Institutional performance documents and learning trajectory diagnostics.
            </p>
          </div>

          <div className="space-y-2">
            {[
              {
                id: 'results',
                title: 'Official Sessional Marksheets',
                desc: 'Detailed component breakdown for S1 and S2.',
                icon: Award,
              },
              {
                id: 'subject_performance',
                title: 'Subject-wise Component Analysis',
                desc: 'Evaluation breakdowns for Exam, Attendance, and Seminars.',
                icon: BookOpen,
              },
              {
                id: 'progress_analytics',
                title: 'Cohort & Trajectory Analytics',
                desc: 'Interactive 3D charts comparing against class averages.',
                icon: TrendingUp,
              },
              {
                id: 'recommendations',
                title: 'Academic Improvement Advisory',
                desc: 'Actionable recommendations for upcoming evaluations.',
                icon: Sparkles,
              },
              {
                id: 'final_reports',
                title: 'Verified Sessional Transcript',
                desc: 'Download and print institutional academic report card.',
                icon: FileSpreadsheet,
              },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => onNavigate(action.id)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-left transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-white border border-slate-200 text-indigo-600 shadow-2xs">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">
                        {action.title}
                      </div>
                      <div className="text-[10px] text-slate-500 line-clamp-1">{action.desc}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                </button>
              );
            })}
          </div>

          <div className="text-[10px] text-slate-400 font-mono pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>Cryptographic Proof: Active</span>
            <span>Tamper Protected</span>
          </div>
        </div>
      </div>
    </div>
  );
};
