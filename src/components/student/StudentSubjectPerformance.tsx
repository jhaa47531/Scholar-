import React, { useMemo } from 'react';
import { BookOpen, TrendingUp, Award, BarChart2, CheckCircle2 } from 'lucide-react';
import { Academic3DBarChart, ChartDataItem } from '../common/Academic3DBarChart.tsx';
import { EmptyState } from '../common/EmptyState.tsx';

interface StudentSubjectPerformanceProps {
  marksData: any[];
  comparisonData: any;
}

export const StudentSubjectPerformance: React.FC<StudentSubjectPerformanceProps> = ({
  marksData,
  comparisonData,
}) => {
  // Construct real 3D bar chart data
  const chartData: ChartDataItem[] = useMemo(() => {
    return marksData.map((rec) => {
      const score = rec.calculation?.performanceScore ?? (
        rec.obtainedMarks !== null && rec.maxMarks > 0
          ? (rec.obtainedMarks / rec.maxMarks) * 100
          : 0
      );

      // Find subject benchmark if available in comparison report, or compute standard 70% threshold
      const benchmark = comparisonData?.subjectAverages?.[rec.subjectId] ?? 68.5;

      return {
        code: rec.subject?.subjectCode || 'SUB',
        label: rec.subject?.name || 'Subject',
        value: score,
        benchmark,
        subtext: `Attendance: ${rec.classAttendancePct ?? 0}% · Assignment: ${rec.assignmentScore ?? 0}%`,
      };
    });
  }, [marksData, comparisonData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#162740]">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            Subject-wise Academic Performance Analytics
          </h1>
          <p className="mt-0.5 text-xs text-slate-400">
            Tasteful 3D comparative visualization of your evaluated subject scores against the class average benchmark.
          </p>
        </div>

        <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
          Evaluated Subjects: <strong className="text-amber-400 font-bold">{marksData.length}</strong>
        </span>
      </div>

      {marksData.length === 0 ? (
        <EmptyState
          title="No Comparative Marks Available"
          description="Subject performance analytics will be rendered once your faculty instructors finalize and publish your assessment marks."
          icon={BarChart2}
        />
      ) : (
        <div className="space-y-6">
          {/* Main 3D Chart Canvas */}
          <Academic3DBarChart
            title="Subject Performance vs Class Average Benchmark"
            subtitle="Isometric 3D perspective display. Toggle 2D mode anytime for flat tabular reading."
            data={chartData}
            benchmarkLabel="Class Average"
            height={300}
          />

          {/* Subject Breakdown Detailed Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {marksData.map((rec: any) => {
              const score = rec.calculation?.performanceScore ?? 0;
              const isAboveAvg = score >= (comparisonData?.subjectAverages?.[rec.subjectId] ?? 68.5);

              return (
                <div
                  key={rec.id}
                  className="surface-navy rounded-xl p-5 border border-[#192b45] card-3d flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                        {rec.subject?.subjectCode}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${
                        isAboveAvg
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {isAboveAvg ? 'Above Avg' : 'Near Avg'}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white mt-2 line-clamp-1">
                      {rec.subject?.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Credits: {rec.subject?.credits} · Semester {rec.subject?.semester}
                    </p>

                    <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs font-mono">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Your Score</span>
                        <span className="text-base font-bold text-white">{score}%</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Class Avg</span>
                        <span className="text-base font-semibold text-slate-300">
                          {comparisonData?.subjectAverages?.[rec.subjectId]?.toFixed(1) ?? '68.5'}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>Exam: {rec.obtainedMarks}/{rec.maxMarks}</span>
                    <span>Att: {rec.classAttendancePct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
