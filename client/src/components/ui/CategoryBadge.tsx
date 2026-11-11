import React from 'react';

interface CategoryBadgeProps {
  name: string;
  color?: string;
  icon?: string;
  className?: string;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  name,
  color = '#6366F1',
  icon,
  className = '',
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-200 border border-zinc-700/60 ${className}`}
    >
      {icon ? (
        <span className="text-xs">{icon}</span>
      ) : (
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
        />
      )}
      <span className="truncate max-w-[140px]">{name}</span>
    </span>
  );
};
