import React from 'react';

interface ScoreGaugeProps {
  score: number | null | undefined;
  maxScore?: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  score,
  maxScore = 100,
  label,
  size = 'md',
  showPercentage = true,
}) => {
  if (score === null || score === undefined) {
    return (
      <span className="text-xs text-slate-500 font-mono italic">
        Incomplete
      </span>
    );
  }

  const percentage = Math.min(100, Math.max(0, (score / maxScore) * 100));

  let colorClass = 'text-emerald-400 bg-emerald-500';
  if (percentage < 50) {
    colorClass = 'text-rose-400 bg-rose-500';
  } else if (percentage < 70) {
    colorClass = 'text-amber-400 bg-amber-500';
  }

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2">
        {label && <span className="text-xs text-slate-400">{label}</span>}
        <span className="font-mono font-semibold tabular-nums text-sm text-slate-100">
          {score.toFixed(1)}
          {showPercentage ? '%' : ` / ${maxScore}`}
        </span>
      </div>
      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${colorClass.split(' ')[1]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
