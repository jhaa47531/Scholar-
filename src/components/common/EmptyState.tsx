import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`p-10 rounded-xl bg-white border border-slate-200 text-center flex flex-col items-center justify-center max-w-lg mx-auto shadow-xs ${className}`}
    >
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 mb-3">
        <Icon className="w-6 h-6 text-slate-500" />
      </div>
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      <p className="mt-1 text-xs text-slate-500 max-w-sm leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
