import React from 'react';
import { ExamAttendance, SubmissionStatus, FeePaymentStatus } from '../../types/domain.ts';

interface StatusBadgeProps {
  status: string | SubmissionStatus | ExamAttendance | FeePaymentStatus;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '', size = 'md' }) => {
  let label = status as string;
  let style = 'bg-slate-100 text-slate-700 border-slate-200';

  const s = String(status).toUpperCase();

  if (s === 'FINAL_SUBMITTED' || s === 'SUBMITTED' || s === 'COMPLETED' || s === 'ACTIVE' || s === 'PAID') {
    label = s === 'FINAL_SUBMITTED' ? 'Final Submitted' : s === 'ACTIVE' ? 'Active' : s === 'PAID' ? 'Paid' : s;
    style = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (s === 'DRAFT') {
    label = 'Draft (Private)';
    style = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (s === 'NOT_ATTENDED' || s === 'ABSENT' || s === 'OVERDUE') {
    label = s === 'NOT_ATTENDED' ? 'Absent (0)' : s === 'OVERDUE' ? 'Overdue' : 'Absent';
    style = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (s === 'PARTIAL') {
    label = 'Partial Paid';
    style = 'bg-indigo-50 text-indigo-700 border-indigo-200';
  } else if (s === 'ATTENDED') {
    label = 'Attended';
    style = 'bg-sky-50 text-sky-700 border-sky-200';
  } else if (s === 'INCOMPLETE' || s === 'NOT_AVAILABLE' || s === 'PENDING') {
    label = s === 'INCOMPLETE' ? 'Incomplete' : s === 'PENDING' ? 'Pending' : 'Pending';
    style = 'bg-slate-100 text-slate-600 border-slate-200';
  } else if (s === 'CORRECTION') {
    label = 'Correction Logged';
    style = 'bg-purple-50 text-purple-700 border-purple-200';
  }

  const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-0.5';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border tracking-wide whitespace-nowrap ${sizeClass} ${style} ${className}`}
    >
      {label}
    </span>
  );
};
