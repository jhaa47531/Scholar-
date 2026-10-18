import React, { useState } from 'react';
import { Box, Layers, BarChart2 } from 'lucide-react';

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
      <div className="p-8 text-center text-xs text-slate-500 rounded-xl surface-navy border border-slate-800">
        No comparative performance data available for this selection.
      </div>
    );
  }

  const chartHeight = height;
  const paddingBottom = 48;
  const paddingTop = 32;
  const usableHeight = chartHeight - paddingBottom - paddingTop;
  const barWidth = Math.min(36, Math.max(18, Math.floor(400 / (data.length * 2))));
  const depthOffset = is3DMode ? 10 : 0; // isometric 3D depth

  return (
    <div className="rounded-xl surface-navy p-5 space-y-4">
      {/* Header and 2D/3D View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            {title}
          </h3>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2">
          {/* Legend */}
          <div className="flex items-center gap-3 text-[11px] text-slate-400 mr-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-tr from-amber-600 to-amber-300"></span>
              <span>Your Score</span>
            </div>
            {showBenchmark && (
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-600"></span>
                <span>{benchmarkLabel}</span>
              </div>
            )}
          </div>

          {/* 2D/3D Toggle */}
          <button
            onClick={() => setIs3DMode(!is3DMode)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              is3DMode
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
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
            {/* Front Gradient - Gold */}
            <linearGradient id="barGoldFront" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
            {/* Top Face - Highlight */}
            <linearGradient id="barGoldTop" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
            {/* Side Face - Shadow */}
            <linearGradient id="barGoldSide" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#b45309" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>

            {/* Benchmark Front */}
            <linearGradient id="barBenchFront" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>
            <linearGradient id="barBenchTop" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>
            <linearGradient id="barBenchSide" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#1e293b" />
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
                  stroke="#1e293b"
                  strokeDasharray="3 3"
                />
                <text
                  x="38"
                  y={y + 3}
                  textAnchor="end"
                  fill="#64748b"
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
            stroke="#334155"
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
                {/* Benchmark Bar (if enabled) */}
                {showBenchmark && item.benchmark !== undefined && (
                  <g opacity={isHovered ? 0.7 : 0.85}>
                    {/* 3D Side Face */}
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

                    {/* 3D Top Face */}
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

                    {/* Front Face */}
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
                  {/* 3D Side Face */}
                  {is3DMode && (
                    <polygon
                      points={`
                        ${groupX + barWidth + (showBenchmark ? barWidth + 5 : 0)},${primaryY}
                        ${groupX + barWidth + (showBenchmark ? barWidth + 5 : 0) + depthOffset},${primaryY - depthOffset}
                        ${groupX + barWidth + (showBenchmark ? barWidth + 5 : 0) + depthOffset},${baseY - depthOffset}
                        ${groupX + barWidth + (showBenchmark ? barWidth + 5 : 0)},${baseY}
                      `}
                      fill="url(#barGoldSide)"
                    />
                  )}

                  {/* 3D Top Face */}
                  {is3DMode && (
                    <polygon
                      points={`
                        ${groupX + (showBenchmark ? barWidth + 5 : 0)},${primaryY}
                        ${groupX + (showBenchmark ? barWidth + 5 : 0) + depthOffset},${primaryY - depthOffset}
                        ${groupX + barWidth + (showBenchmark ? barWidth + 5 : 0) + depthOffset},${primaryY - depthOffset}
                        ${groupX + barWidth + (showBenchmark ? barWidth + 5 : 0)},${primaryY}
                      `}
                      fill="url(#barGoldTop)"
                    />
                  )}

                  {/* Front Face */}
                  <rect
                    x={groupX + (showBenchmark ? barWidth + 5 : 0)}
                    y={primaryY}
                    width={barWidth}
                    height={primaryHeight}
                    rx={is3DMode ? 0 : 3}
                    fill="url(#barGoldFront)"
                    className={isHovered ? 'filter drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]' : ''}
                  />

                  {/* Top Score Value Label */}
                  <text
                    x={groupX + (showBenchmark ? barWidth + 5 : 0) + barWidth / 2}
                    y={primaryY - (is3DMode ? depthOffset + 4 : 4)}
                    textAnchor="middle"
                    fill={isHovered ? '#fef08a' : '#f59e0b'}
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
                  fill={isHovered ? '#ffffff' : '#94a3b8'}
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
                  fill="#64748b"
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
          <div className="absolute top-2 right-4 p-3 rounded-lg bg-slate-900/95 border border-amber-500/40 shadow-xl pointer-events-none text-xs z-10 backdrop-blur">
            <div className="font-bold text-white flex items-center gap-1.5">
              <span className="text-amber-400 font-mono">{data[hoveredIdx].code}</span>
              <span>{data[hoveredIdx].label}</span>
            </div>
            <div className="mt-1.5 space-y-1 font-mono text-[11px]">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400">Score:</span>
                <span className="font-bold text-amber-400">
                  {data[hoveredIdx].value.toFixed(1)}
                  {valueSuffix}
                </span>
              </div>
              {showBenchmark && data[hoveredIdx].benchmark !== undefined && (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-400">{benchmarkLabel}:</span>
                  <span className="text-slate-300">
                    {data[hoveredIdx].benchmark?.toFixed(1)}
                    {valueSuffix}
                  </span>
                </div>
              )}
              {data[hoveredIdx].subtext && (
                <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800">
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
