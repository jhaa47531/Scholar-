import React from 'react';

interface Academic3DGaugeProps {
  value: number; // 0 - 100
  maxValue?: number;
  label: string;
  sublabel?: string;
  size?: number;
  strokeWidth?: number;
  unit?: string;
  gradeTier?: string;
  colorScheme?: 'gold' | 'emerald' | 'cyan' | 'indigo';
}

export const Academic3DGauge: React.FC<Academic3DGaugeProps> = ({
  value,
  maxValue = 100,
  label,
  sublabel,
  size = 180,
  strokeWidth = 14,
  unit = '%',
  gradeTier,
  colorScheme = 'indigo',
}) => {
  const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Use a 270 degree arc for gauge look
  const arcLength = circumference * 0.75;
  const strokeDashoffset = arcLength - (arcLength * percentage) / 100;

  const gradientId = `gaugeGrad_${colorScheme}_${label.replace(/\s+/g, '')}`;

  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
      <div className="relative" style={{ width: size, height: size * 0.85 }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform rotate-[135deg] overflow-visible"
        >
          <defs>
            {/* Gradients */}
            {(colorScheme === 'gold' || colorScheme === 'indigo') && (
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4F46E5" />
                <stop offset="50%" stopColor="#6366F1" />
                <stop offset="100%" stopColor="#0EA5E9" />
              </linearGradient>
            )}
            {colorScheme === 'emerald' && (
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#15803D" />
                <stop offset="50%" stopColor="#16A34A" />
                <stop offset="100%" stopColor="#4ADE80" />
              </linearGradient>
            )}
            {colorScheme === 'cyan' && (
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0369A1" />
                <stop offset="50%" stopColor="#0EA5E9" />
                <stop offset="100%" stopColor="#7DD3FC" />
              </linearGradient>
            )}
          </defs>

          {/* Background Outer Ring Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#F1F5F9"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />

          {/* Foreground Active Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center -mt-2">
          <span className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums tracking-tight">
            {value.toFixed(1)}
            <span className="text-sm font-sans font-normal text-slate-500 ml-0.5">{unit}</span>
          </span>
          {gradeTier && (
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full mt-1">
              Tier {gradeTier}
            </span>
          )}
        </div>
      </div>

      <div className="text-center -mt-2">
        <h4 className="text-xs font-bold text-slate-800 tracking-wide">{label}</h4>
        {sublabel && <p className="text-[11px] text-slate-500 mt-0.5">{sublabel}</p>}
      </div>
    </div>
  );
};
