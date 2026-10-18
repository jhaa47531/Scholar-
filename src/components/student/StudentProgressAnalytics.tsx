import React from 'react';
import { TrendingUp, Layers, CheckCircle2, Award, Calendar, BarChart3 } from 'lucide-react';
import { KpiCard } from '../common/KpiCard.tsx';
import { EmptyState } from '../common/EmptyState.tsx';

interface StudentProgressAnalyticsProps {
  marksData: any[];
  sessionalReport: any;
}

export const StudentProgressAnalytics: React.FC<StudentProgressAnalyticsProps> = ({
  marksData,
  sessionalReport,
}) => {
  // Aggregate component averages across all evaluated subjects
  const count = marksData.length;
  const avgExamPct = count > 0
    ? marksData.reduce((acc, m) => acc + (m.obtainedMarks && m.maxMarks ? (m.obtainedMarks / m.maxMarks) * 100 : 0), 0) / count
    : 0;

  const avgAttendance = count > 0
    ? marksData.reduce((acc, m) => acc + (m.classAttendancePct || 0), 0) / count
    : 0;

  const avgAssignment = count > 0
    ? marksData.reduce((acc, m) => acc + (m.assignmentScore || 0), 0) / count
    : 0;

  const avgPresentation = count > 0
    ? marksData.reduce((acc, m) => acc + (m.presentationScore || 0), 0) / count
    : 0;

  const avgInteraction = count > 0
    ? marksData.reduce((acc, m) => acc + (m.classInteractionScore || 0), 0) / count
    : 0;

  const components = [
    { name: 'Sessional Written Exam', weight: 40, avg: avgExamPct, color: 'from-amber-500 to-amber-400' },
    { name: 'Class Attendance Track', weight: 20, avg: avgAttendance, color: 'from-emerald-500 to-emerald-400' },
    { name: 'Assignments & Lab Work', weight: 15, avg: avgAssignment, color: 'from-sky-500 to-sky-400' },
    { name: 'Subject Presentations', weight: 15, avg: avgPresentation, color: 'from-purple-500 to-purple-400' },
    { name: 'Classroom Interaction', weight: 10, avg: avgInteraction, color: 'from-rose-500 to-rose-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#162740]">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            Evaluation Progress & Trajectory Analytics
          </h1>
          <p className="mt-0.5 text-xs text-slate-400">
            Multi-component weighted performance diagnostics and attendance correlation.
          </p>
        </div>

        <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
          Weight Formula: <strong className="text-amber-400">v1.0 (Sum: 100%)</strong>
        </span>
      </div>

      {marksData.length === 0 ? (
        <EmptyState
          title="No Progress Analytics Available"
          description="Progress analytics will generate once your instructor finalizes your assessment marks."
          icon={BarChart3}
        />
      ) : (
        <div className="space-y-6">
          {/* Component Weightage Performance Matrix */}
          <div className="surface-navy rounded-xl p-6 border border-[#192b45] space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Academic Component Proficiency vs Weight Allocation
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Your average score across each institutional evaluation component.
                </p>
              </div>
              <span className="text-xs text-emerald-400 font-mono font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> 100% Weightage Verified
              </span>
            </div>

            <div className="space-y-4">
              {components.map((comp) => (
                <div key={comp.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">{comp.name}</span>
                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      <span className="text-slate-400">Allocated Weight: {comp.weight}%</span>
                      <span className="font-bold text-white tabular-nums">
                        Average: {comp.avg.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* 3D-styled Progress Bar with specular gradient */}
                  <div className="w-full bg-slate-900 rounded-full h-3 p-0.5 border border-slate-800 overflow-hidden shadow-inner">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${comp.color} transition-all duration-700`}
                      style={{ width: `${Math.min(100, Math.max(0, comp.avg))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Attendance vs Performance Diagnostic */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="surface-navy rounded-xl p-5 border border-[#192b45] space-y-3">
              <h4 className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> Attendance Impact Factor
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Class attendance carries a direct <strong className="text-white">20% weight</strong> in your overall sessional aggregate. Maintaining $\ge 85\%$ attendance gives maximum component yield and ensures full exam eligibility.
              </p>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between font-mono text-xs">
                <span className="text-slate-400">Current Average Attendance:</span>
                <span className={`font-bold ${avgAttendance >= 75 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {avgAttendance.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="surface-navy rounded-xl p-5 border border-[#192b45] space-y-3">
              <h4 className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                <Award className="w-4 h-4" /> Continuous Assessment Optimization
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Assignments (15%), Presentations (15%), and Interaction (10%) combine for <strong className="text-white">40% of your grade</strong>. High performance in continuous assessment buffers exam pressure.
              </p>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between font-mono text-xs">
                <span className="text-slate-400">Continuous Assessment Aggregate:</span>
                <span className="font-bold text-amber-400">
                  {(((avgAssignment * 0.15 + avgPresentation * 0.15 + avgInteraction * 0.1) / 0.4)).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
