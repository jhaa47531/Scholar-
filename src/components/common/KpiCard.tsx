import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: string;
    positive?: boolean;
    neutral?: boolean;
  };
  badge?: string;
  onClick?: () => void;
  className?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  badge,
  onClick,
  className = '',
}) => {
  return (
    <div
      onClick={onClick}
      className={`relative p-5 rounded-xl bg-white border border-slate-200/90 shadow-xs card-hover transition-all duration-200 ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold text-slate-500 tracking-wider uppercase font-mono">
            {title}
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 font-mono tabular-nums">
              {value}
            </span>
            {badge && (
              <span className="text-[10px] font-mono font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded">
                {badge}
              </span>
            )}
          </div>
        </div>

        {Icon && (
          <div className="p-2.5 rounded-xl bg-indigo-50/80 border border-indigo-100 text-indigo-600 shadow-xs">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          {subtitle && <span className="truncate">{subtitle}</span>}
          {trend && (
            <span
              className={`font-mono tabular-nums font-semibold ${
                trend.neutral
                  ? 'text-slate-500'
                  : trend.positive
                  ? 'text-emerald-600'
                  : 'text-rose-600'
              }`}
            >
              {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
