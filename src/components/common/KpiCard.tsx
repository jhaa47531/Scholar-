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
      className={`relative p-5 rounded-xl surface-navy card-3d border border-[#192b45] transition-all duration-200 group ${
        onClick ? 'cursor-pointer hover:border-amber-500/40' : ''
      } ${className}`}
    >
      {/* Subtle Top Specular Lighting Highlight */}
      <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent pointer-events-none" />

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase font-mono">{title}</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white font-mono tabular-nums">
              {value}
            </span>
            {badge && (
              <span className="text-[10px] font-mono font-semibold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded">
                {badge}
              </span>
            )}
          </div>
        </div>

        {Icon && (
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/80 text-amber-400 shadow-sm group-hover:scale-105 group-hover:border-amber-500/30 transition-transform">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          {subtitle && <span className="truncate">{subtitle}</span>}
          {trend && (
            <span
              className={`font-mono tabular-nums font-semibold ${
                trend.neutral
                  ? 'text-slate-400'
                  : trend.positive
                  ? 'text-emerald-400'
                  : 'text-rose-400'
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
