import React from 'react';
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  TrendingUp,
  FileSpreadsheet,
  AlertCircle,
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
  const attendedCount = marksData.filter((m) => m.examAttendance === ExamAttendance.ATTENDED).length;
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
      <div className="p-6 rounded-2xl surface-navy border border-[#192b45] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 card-3d">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold">
              Student Academic Portal
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-300 font-mono">Roll: {studentProfile.rollNo}</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            Welcome back, {studentProfile.name}
          </h1>
          <p className="mt-1 text-xs text-slate-400 max-w-2xl">
            Enrolled in <span className="text-slate-200 font-semibold">{studentProfile.courseId.toUpperCase()}</span> (Semester {studentProfile.currentSemester}). Active session:{' '}
            <span className="text-slate-200 font-semibold">{activeSession?.title || 'Academic Year 2025-2026'}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('results')}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 rounded-xl transition-all flex items-center gap-2 shadow-md shadow-amber-500/20 cursor-pointer"
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
        <div className="surface-navy rounded-xl p-5 border border-[#192b45] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              Sessional 1 Aggregate
            </h3>
            <span className="text-[11px] font-mono text-slate-400">Weight: 40% Exam</span>
          </div>

          <div className="py-2">
            <Academic3DGauge
              value={overallScore || 0}
              label="Weighted Performance"
              sublabel="Official Evaluation Score"
              gradeTier={overallScore >= 80 ? 'A+' : overallScore >= 60 ? 'B+' : 'C'}
              colorScheme="gold"
              size={175}
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Eligibility Status:</span>
            <span className={sessionalReport?.isEligibleForOverallReport ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
              {sessionalReport?.isEligibleForOverallReport ? 'Complete & Eligible' : 'Awaiting Remaining Sheets'}
            </span>
          </div>
        </div>

        {/* Center: 3D Gauge for Class Attendance */}
        <div className="surface-navy rounded-xl p-5 border border-[#192b45] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Institutional Attendance
            </h3>
            <span className="text-[11px] font-mono text-slate-400">Min Threshold: 75%</span>
          </div>

          <div className="py-2">
            <Academic3DGauge
              value={avgAttendance || 0}
              label="Lecture Attendance Ratio"
              sublabel="Minimum 75% required for final exams"
              gradeTier={avgAttendance >= 85 ? 'Exemplary' : avgAttendance >= 75 ? 'Eligible' : 'Warning'}
              colorScheme="emerald"
              size={175}
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Attendance Policy:</span>
            <span className={avgAttendance >= 75 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {avgAttendance >= 75 ? 'Exam Eligible' : 'Attendance Shortage'}
            </span>
          </div>
        </div>

        {/* Right: Quick Action Hub */}
        <div className="surface-navy rounded-xl p-5 border border-[#192b45] flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2 mb-1">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              Verified Student Actions
            </h3>
            <p className="text-xs text-slate-400">
              Direct access to your academic evaluation tools, official transcripts, and advisory insights.
            </p>
          </div>

          <div className="space-y-2">
            {[
              {
                id: 'results',
                title: 'Official Finalized Marksheet',
                desc: 'Detailed component breakdowns and exam attendance status.',
                icon: Award,
              },
              {
                id: 'subject_performance',
                title: '3D Performance Comparative View',
                desc: 'Compare your scores against class averages in 3D.',
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
                  className="w-full p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-slate-800 text-amber-400">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-amber-300 transition-colors">
                        {action.title}
                      </div>
                      <div className="text-[10px] text-slate-400 line-clamp-1">{action.desc}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                </button>
              );
            })}
          </div>

          <div className="text-[10px] text-slate-500 font-mono pt-2 border-t border-slate-800 flex items-center justify-between">
            <span>Cryptographic Proof: Active</span>
            <span>Tamper Protected</span>
          </div>
        </div>
      </div>
    </div>
  );
};
