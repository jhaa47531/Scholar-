import React, { useMemo } from 'react';
import { Sparkles, AlertTriangle, CheckCircle2, TrendingUp, Calendar, BookOpen, Target, ArrowRight } from 'lucide-react';
import { ExamAttendance } from '../../types/domain.ts';
import { EmptyState } from '../common/EmptyState.tsx';

interface StudentRecommendationsProps {
  marksData: any[];
  studentName: string;
  onNavigateToResults: () => void;
}

export const StudentRecommendations: React.FC<StudentRecommendationsProps> = ({
  marksData,
  studentName,
  onNavigateToResults,
}) => {
  // Derive real targeted recommendations based on actual data
  const recommendations = useMemo(() => {
    const list: {
      category: 'Attendance' | 'Exam Prep' | 'Continuous Assessment' | 'Excellence';
      severity: 'high' | 'medium' | 'positive';
      title: string;
      description: string;
      subjectCode?: string;
    }[] = [];

    if (!marksData || marksData.length === 0) return list;

    // 1. Attendance check per subject
    marksData.forEach((m) => {
      const att = m.classAttendancePct ?? 0;
      if (att < 75) {
        list.push({
          category: 'Attendance',
          severity: 'high',
          title: `Attendance Shortage in ${m.subject?.subjectCode || 'Subject'}`,
          description: `Current attendance is ${att}%, which is below the mandatory institutional 75% threshold. Attend upcoming lecture sessions to avoid exam disqualification.`,
          subjectCode: m.subject?.subjectCode,
        });
      } else if (att >= 90) {
        list.push({
          category: 'Excellence',
          severity: 'positive',
          title: `Exemplary Attendance in ${m.subject?.subjectCode || 'Subject'}`,
          description: `Outstanding attendance record of ${att}%. You are on track for maximum 20% attendance credit allocation.`,
          subjectCode: m.subject?.subjectCode,
        });
      }
    });

    // 2. Exam marks check
    marksData.forEach((m) => {
      if (m.examAttendance === ExamAttendance.NOT_ATTENDED) {
        list.push({
          category: 'Exam Prep',
          severity: 'high',
          title: `Absence Recorded for ${m.subject?.subjectCode || 'Exam'}`,
          description: `Exam attendance was marked as Absent (score 0). Submit formal medical/re-examination certificate to Department HOD if eligible for makeup evaluation.`,
          subjectCode: m.subject?.subjectCode,
        });
      } else if (m.obtainedMarks !== null && m.maxMarks > 0) {
        const pct = (m.obtainedMarks / m.maxMarks) * 100;
        if (pct < 50) {
          list.push({
            category: 'Exam Prep',
            severity: 'high',
            title: `Strengthen Core Concepts in ${m.subject?.subjectCode}`,
            description: `Written sessional score was ${pct.toFixed(0)}%. Consult course instructor during office hours for revision on core syllabus units.`,
            subjectCode: m.subject?.subjectCode,
          });
        }
      }
    });

    // 3. Continuous Assessment check (Assignments, Presentations)
    marksData.forEach((m) => {
      if (m.assignmentScore !== null && m.assignmentScore < 60) {
        list.push({
          category: 'Continuous Assessment',
          severity: 'medium',
          title: `Submit Pending Lab Assignments for ${m.subject?.subjectCode}`,
          description: `Assignment component score is ${m.assignmentScore}%. Review submission guidelines and laboratory rubrics to boost continuous assessment yield.`,
          subjectCode: m.subject?.subjectCode,
        });
      }

      if (m.presentationScore !== null && m.presentationScore < 60) {
        list.push({
          category: 'Continuous Assessment',
          severity: 'medium',
          title: `Seminar Presentation Practice for ${m.subject?.subjectCode}`,
          description: `Presentation score was ${m.presentationScore}%. Focus on slide structure and technical delivery in upcoming semester seminars.`,
          subjectCode: m.subject?.subjectCode,
        });
      }
    });

    // If student has all high marks, add overall praise
    if (list.length === 0) {
      list.push({
        category: 'Excellence',
        severity: 'positive',
        title: 'Consistent High Academic Standing',
        description: 'All your evaluation metrics across attendance, sessional exams, and continuous assessment meet or exceed distinction criteria.',
      });
    }

    return list;
  }, [marksData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#162740]">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Academic Advisory & Improvement Recommendations
          </h1>
          <p className="mt-0.5 text-xs text-slate-400">
            Automated recommendations calculated directly from your evaluation component scores and attendance rates.
          </p>
        </div>

        <button
          onClick={onNavigateToResults}
          className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 cursor-pointer"
        >
          View Marksheet <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {marksData.length === 0 ? (
        <EmptyState
          title="No Advisory Insights Available Yet"
          description="Personalized recommendations will automatically generate once faculty members publish your initial assessment marks."
          icon={Target}
        />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec, idx) => {
              const isHigh = rec.severity === 'high';
              const isPos = rec.severity === 'positive';

              const Icon = isHigh ? AlertTriangle : isPos ? CheckCircle2 : Target;
              const borderClass = isHigh
                ? 'border-rose-500/30'
                : isPos
                ? 'border-emerald-500/30'
                : 'border-amber-500/30';
              const badgeClass = isHigh
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                : isPos
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20';

              return (
                <div
                  key={idx}
                  className={`surface-navy rounded-xl p-5 border ${borderClass} card-3d flex flex-col justify-between gap-3`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded border ${badgeClass}`}>
                        {rec.category}
                      </span>
                      {rec.subjectCode && (
                        <span className="text-xs font-mono font-bold text-slate-400">
                          {rec.subjectCode}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Icon className={`w-4 h-4 shrink-0 ${isHigh ? 'text-rose-400' : isPos ? 'text-emerald-400' : 'text-amber-400'}`} />
                      {rec.title}
                    </h4>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {rec.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-500 flex items-center justify-between">
                    <span>Priority: {isHigh ? 'Urgent' : isPos ? 'Commendation' : 'Standard'}</span>
                    <span>Evaluation Engine v1.0</span>
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
