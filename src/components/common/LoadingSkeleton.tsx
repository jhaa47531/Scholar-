import React from 'react';

interface LoadingSkeletonProps {
  rows?: number;
  count?: number;
  height?: string;
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  rows = 4,
  count,
  height = 'h-10',
  className = '',
}) => {
  const numRows = count ?? rows;

  return (
    <div className={`space-y-3 animate-pulse ${className}`}>
      {Array.from({ length: numRows }).map((_, i) => (
        <div key={i} className={`${height} bg-slate-100 rounded-xl border border-slate-200/80`} />
      ))}
    </div>
  );
};
