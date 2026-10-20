import React, { useState } from 'react';
import { Box, BarChart2 } from 'lucide-react';

export interface ChartDataItem {
  label: string;
  code: string;
  value: number; // 0 - 100 or actual score
  maxValue?: number;
  benchmark?: number; // e.g. class average
  subtext?: string;
  color?: string;
}

interface Academic3DBarChartProps {
  title: string;
  subtitle?: string;
  data: ChartDataItem[];
  valueSuffix?: string;
  height?: number;
  benchmarkLabel?: string;
  showBenchmark?: boolean;
}

export const Academic3DBarChart: React.FC<Academic3DBarChartProps> = ({
  title,
  subtitle,
  data,
  valueSuffix = '%',
  height = 260,
  benchmarkLabel = 'Class Average',
  showBenchmark = true,
}) => {
  const [is3DMode, setIs3DMode] = useState(true);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-slate-400 rounded-xl bg-white border border-slate-200">
        No comparative performance data available for this selection.
      </div>
    );
  }

  const chartHeight = height;
  const paddingBottom = 48;
  const paddingTop = 32;
  const usableHeight = chartHeight - paddingBottom - paddingTop;
  const barWidth = Math.min(36, Math.max(18, Math.floor(400 / (data.length * 2))));
  const depthOffset = is3DMode ? 10 : 0;

  return (
    <div className="rounded-xl bg-white border border-slate-200 shadow-xs p-5 space-y-4">
      {/* Header and 2D/3D View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
            {title}
          </h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2">
          {/* Legend */}
          <div className="flex items-center gap-3 text-[11px] text-slate-500 mr-2 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-indigo-600"></span>
              <span>Your Score</span>
            </div>
            {showBenchmark && (
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-slate-300"></span>
                <span>{benchmarkLabel}</span>
              </div>
            )}
          </div>

          {/* 2D/3D Toggle */}
          <button
            onClick={() => setIs3DMode(!is3DMode)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              is3DMode
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900'
            }`}
            title="Toggle between 3D Depth Visualization and Flat 2D View"
          >
            {is3DMode ? <Box className="w-3.5 h-3.5" /> : <BarChart2 className="w-3.5 h-3.5" />}
            <span>{is3DMode ? '3D Depth' : '2D Clean'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Chart Canvas */}
      <div className="relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${Math.max(600, data.length * 80 + 80)} ${chartHeight}`}
          className="w-full select-none"
          style={{ minWidth: `${Math.max(500, data.length * 75)}px`, height: `${chartHeight}px` }}
        >
          <defs>
            {/* Front Gradient - Indigo */}
            <linearGradient id="barIndigoFront" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#4338CA" />
            </linearGradient>
            {/* Top Face - Highlight */}
            <linearGradient id="barIndigoTop" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#A5B4FC" />
              <stop offset="100%" stopColor="#6366F1" />
            </linearGradient>
            {/* Side Face - Shadow */}
            <linearGradient id="barIndigoSide" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4338CA" />
              <stop offset="100%" stopColor="#312E81" />
            </linearGradient>

            {/* Benchmark Front - Soft Slate */}
            <linearGradient id="barBenchFront" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#E2E8F0" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </linearGradient>
            <linearGradient id="barBenchTop" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F1F5F9" />
              <stop offset="100%" stopColor="#E2E8F0" />
            </linearGradient>
            <linearGradient id="barBenchSide" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#94A3B8" />
              <stop offset="100%" stopColor="#64748B" />
            </linearGradient>
          </defs>

          {/* Gridlines */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const y = paddingTop + usableHeight - (tick / 100) * usableHeight;
            return (
              <g key={tick}>
                <line
                  x1="45"
                  y1={y}
                  x2={Math.max(600, data.length * 80 + 60)}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeDasharray="3 3"
                />
                <text
                  x="38"
                  y={y + 3}
                  textAnchor="end"
                  fill="#94A3B8"
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {tick}%
                </text>
              </g>
            );
          })}

          {/* Baseline */}
          <line
            x1="45"
            y1={paddingTop + usableHeight}
            x2={Math.max(600, data.length * 80 + 60)}
            y2={paddingTop + usableHeight}
            stroke="#CBD5E1"
            strokeWidth="1.5"
          />

          {/* Bars */}
          {data.map((item, idx) => {
            const colWidth = 72;
            const groupX = 65 + idx * colWidth;
            const primaryHeight = Math.max(4, (Math.min(100, item.value) / 100) * usableHeight);
            const benchHeight = showBenchmark && item.benchmark !== undefined
              ? Math.max(4, (Math.min(100, item.benchmark) / 100) * usableHeight)
              : 0;

            const baseY = paddingTop + usableHeight;
            const primaryY = baseY - primaryHeight;
            const benchY = baseY - benchHeight;
            const isHovered = hoveredIdx === idx;

            return (
              <g
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer group"
              >
                {/* Benchmark Bar */}
                {showBenchmark && item.benchmark !== undefined && (
                  <g opacity={isHovered ? 0.7 : 0.85}>
                    {is3DMode && (
                      <polygon
                        points={`
                          ${groupX + barWidth + 3},${benchY}
                          ${groupX + barWidth + 3 + depthOffset},${benchY - depthOffset}
                          ${groupX + barWidth + 3 + depthOffset},${baseY - depthOffset}
                          ${groupX + barWidth + 3},${baseY}
                        `}
                        fill="url(#barBenchSide)"
                      />
                    )}
                    {is3DMode && (
                      <polygon
                        points={`
                          ${groupX + 3},${benchY}
                          ${groupX + 3 + depthOffset},${benchY - depthOffset}
                          ${groupX + barWidth + 3 + depthOffset},${benchY - depthOffset}
                          ${groupX + barWidth + 3},${benchY}
                        `}
                        fill="url(#barBenchTop)"
                      />
                    )}
                    <rect
                      x={groupX + 3}
                      y={benchY}
                      width={barWidth}
                      height={benchHeight}
                      rx={is3DMode ? 0 : 3}
                      fill="url(#barBenchFront)"
                    />
                  </g>
                )}

                {/* Primary Student Bar */}
                <g className="transition-all duration-200">
                  {is3DMode && (
                    <polygon
                      points={`
                        ${groupX + barWidth + (showBenchmark ? barWidth + 5 : 0)},${primaryY}
                        ${groupX + barWidth + (showBenchmark ? barWidth + 5 : 0) + depthOffset},${primaryY - depthOffset}
                        ${groupX + barWidth + (showBenchmark ? barWidth + 5 : 0) + depthOffset},${baseY - depthOffset}
                        ${groupX + barWidth + (showBenchmark ? barWidth + 5 : 0)},${baseY}
                      `}
                      fill="url(#barIndigoSide)"
                    />
                  )}
                  {is3DMode && (
                    <polygon
                      points={`
                        ${groupX + (showBenchmark ? barWidth + 5 : 0)},${primaryY}
                        ${groupX + (showBenchmark ? barWidth + 5 : 0) + depthOffset},${primaryY - depthOffset}
                        ${groupX + barWidth + (showBenchmark ? barWidth + 5 : 0) + depthOffset},${primaryY - depthOffset}
                        ${groupX + barWidth + (showBenchmark ? barWidth + 5 : 0)},${primaryY}
                      `}
                      fill="url(#barIndigoTop)"
                    />
                  )}
                  <rect
                    x={groupX + (showBenchmark ? barWidth + 5 : 0)}
                    y={primaryY}
                    width={barWidth}
                    height={primaryHeight}
                    rx={is3DMode ? 0 : 3}
                    fill="url(#barIndigoFront)"
                    className={isHovered ? 'filter drop-shadow-[0_0_8px_rgba(79,70,229,0.4)]' : ''}
                  />

                  {/* Top Score Value Label */}
                  <text
                    x={groupX + (showBenchmark ? barWidth + 5 : 0) + barWidth / 2}
                    y={primaryY - (is3DMode ? depthOffset + 4 : 4)}
                    textAnchor="middle"
                    fill={isHovered ? '#4338CA' : '#4F46E5'}
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {item.value.toFixed(0)}
                    {valueSuffix}
                  </text>
                </g>

                {/* Bottom Subject Code & Label */}
                <text
                  x={groupX + barWidth}
                  y={baseY + 16}
                  textAnchor="middle"
                  fill={isHovered ? '#1E293B' : '#64748B'}
                  fontSize="11"
                  fontWeight="600"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {item.code}
                </text>
                <text
                  x={groupX + barWidth}
                  y={baseY + 30}
                  textAnchor="middle"
                  fill="#94A3B8"
                  fontSize="9.5"
                >
                  {item.label.length > 10 ? item.label.slice(0, 9) + '…' : item.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip when Hovered */}
        {hoveredIdx !== null && data[hoveredIdx] && (
          <div className="absolute top-2 right-4 p-3 rounded-lg bg-white border border-indigo-200 shadow-xl pointer-events-none text-xs z-10">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <span className="text-indigo-600 font-mono">{data[hoveredIdx].code}</span>
              <span>{data[hoveredIdx].label}</span>
            </div>
            <div className="mt-1.5 space-y-1 font-mono text-[11px]">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">Score:</span>
                <span className="font-bold text-indigo-600">
                  {data[hoveredIdx].value.toFixed(1)}
                  {valueSuffix}
                </span>
              </div>
              {showBenchmark && data[hoveredIdx].benchmark !== undefined && (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">{benchmarkLabel}:</span>
                  <span className="text-slate-700">
                    {data[hoveredIdx].benchmark?.toFixed(1)}
                    {valueSuffix}
                  </span>
                </div>
              )}
              {data[hoveredIdx].subtext && (
                <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                  {data[hoveredIdx].subtext}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
