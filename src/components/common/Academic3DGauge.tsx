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
  colorScheme?: 'gold' | 'emerald' | 'cyan';
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
  colorScheme = 'gold',
}) => {
  const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Use a 270 degree arc for gauge look
  const arcLength = circumference * 0.75;
  const strokeDashoffset = arcLength - (arcLength * percentage) / 100;

  const gradientId = `gaugeGrad_${colorScheme}_${label.replace(/\s+/g, '')}`;

  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-xl surface-navy card-3d">
      <div className="relative" style={{ width: size, height: size * 0.85 }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform rotate-[135deg] overflow-visible"
        >
          <defs>
            {/* 3D Depth Shadow Filter */}
            <filter id="gaugeShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.6" />
            </filter>

            {/* Gradients */}
            {colorScheme === 'gold' && (
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#d97706" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#fef08a" />
              </linearGradient>
            )}
            {colorScheme === 'emerald' && (
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#059669" />
                <stop offset="50%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#6ee7b7" />
              </linearGradient>
            )}
            {colorScheme === 'cyan' && (
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="50%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#bae6fd" />
              </linearGradient>
            )}
          </defs>

          {/* Background Outer Ring Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#132238"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />

          {/* Inner Depth Rim */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius - strokeWidth / 2}
            fill="none"
            stroke="#070e1a"
            strokeWidth={1}
            strokeDasharray={`${arcLength} ${circumference}`}
          />

          {/* Foreground Active Arc with 3D shadow and rounded cap */}
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
            filter="url(#gaugeShadow)"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Readout in Normal Orientation */}
        <div className="absolute inset-0 flex flex-col items-center justify-center -mt-2">
          <span className="text-3xl font-extrabold text-white font-mono tabular-nums tracking-tight">
            {value.toFixed(1)}
            <span className="text-sm font-sans font-normal text-slate-400 ml-0.5">{unit}</span>
          </span>
          {gradeTier && (
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full mt-1">
              Tier {gradeTier}
            </span>
          )}
        </div>
      </div>

      <div className="text-center -mt-2">
        <h4 className="text-xs font-bold text-slate-200 tracking-wide">{label}</h4>
        {sublabel && <p className="text-[11px] text-slate-400 mt-0.5">{sublabel}</p>}
      </div>
    </div>
  );
};
