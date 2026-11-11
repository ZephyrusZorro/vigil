import React from 'react';
import { getDaysLeftColor } from '@/utils/risk';
import { getDaysLeftLabel } from '@/utils/dates';
import { Clock } from 'lucide-react';

interface DaysLeftPillProps {
  days: number | null;
  className?: string;
  showIcon?: boolean;
}

export const DaysLeftPill: React.FC<DaysLeftPillProps> = ({ days, className = '', showIcon = true }) => {
  const colorClasses = getDaysLeftColor(days);
  const label = getDaysLeftLabel(days);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${colorClasses} ${className}`}
    >
      {showIcon && <Clock className="w-3.5 h-3.5 opacity-80" />}
      <span>{label}</span>
    </span>
  );
};
