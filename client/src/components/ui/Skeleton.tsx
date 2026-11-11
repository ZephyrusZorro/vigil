import React from 'react';

interface SkeletonProps {
  className?: string;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = 'h-4 w-full', count = 1 }) => {
  if (count === 1) {
    return <div className={`skeleton ${className}`} />;
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`skeleton ${className}`} />
      ))}
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
      <div className="skeleton h-8 w-full rounded-lg" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-2">
          <div className="skeleton h-5 w-5 rounded" />
          <div className="skeleton h-5 w-48 rounded" />
          <div className="skeleton h-5 w-24 rounded" />
          <div className="skeleton h-5 w-28 rounded" />
          <div className="skeleton h-5 w-20 rounded" />
          <div className="skeleton h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
};
