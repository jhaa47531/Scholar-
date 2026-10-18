import React from 'react';
import { ExamAttendance, SubmissionStatus } from '../../types/domain.ts';

interface StatusBadgeProps {
  status: string | SubmissionStatus | ExamAttendance;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '', size = 'md' }) => {
  let label = status as string;
  let style = 'bg-slate-800 text-slate-300 border-slate-700';

  const s = String(status).toUpperCase();

  if (s === 'FINAL_SUBMITTED' || s === 'SUBMITTED' || s === 'COMPLETED' || s === 'ACTIVE') {
    label = s === 'FINAL_SUBMITTED' ? 'Final Submitted' : s === 'ACTIVE' ? 'Active' : s;
    style = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  } else if (s === 'DRAFT') {
    label = 'Draft (Private)';
    style = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  } else if (s === 'NOT_ATTENDED' || s === 'ABSENT') {
    label = 'Absent (0)';
    style = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  } else if (s === 'ATTENDED') {
    label = 'Attended';
    style = 'bg-sky-500/10 text-sky-400 border-sky-500/20';
  } else if (s === 'INCOMPLETE' || s === 'NOT_AVAILABLE') {
    label = s === 'INCOMPLETE' ? 'Incomplete' : 'Pending';
    style = 'bg-slate-800 text-slate-400 border-slate-700';
  } else if (s === 'CORRECTION') {
    label = 'Correction Logged';
    style = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
  }

  const sizeClass = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2.5 py-0.5';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border tracking-wide whitespace-nowrap ${sizeClass} ${style} ${className}`}
    >
      {label}
    </span>
  );
};
