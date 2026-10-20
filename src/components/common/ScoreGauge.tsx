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
      <span className="text-xs text-slate-400 font-mono italic">
        Incomplete
      </span>
    );
  }

  const percentage = Math.min(100, Math.max(0, (score / maxScore) * 100));

  let colorBar = 'bg-emerald-500';
  let colorText = 'text-emerald-700';
  if (percentage < 50) {
    colorBar = 'bg-rose-500';
    colorText = 'text-rose-700';
  } else if (percentage < 70) {
    colorBar = 'bg-amber-500';
    colorText = 'text-amber-700';
  }

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2">
        {label && <span className="text-xs text-slate-500">{label}</span>}
        <span className={`font-mono font-semibold tabular-nums text-sm ${colorText}`}>
          {score.toFixed(1)}
          {showPercentage ? '%' : ` / ${maxScore}`}
        </span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${colorBar}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
