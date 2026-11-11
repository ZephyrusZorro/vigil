import React from 'react';
import { RiskLevel } from '@/types';
import { getRiskBgColor, getRiskDotColor } from '@/utils/risk';
import { capitalize } from '@/utils/format';

interface RiskBadgeProps {
  level: RiskLevel | string;
  score?: number;
  showScore?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, score, showScore = false }) => {
  const badgeClasses = getRiskBgColor(level as RiskLevel);
  const dotColor = getRiskDotColor(level as RiskLevel);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${badgeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{capitalize(level)}</span>
      {showScore && score !== undefined && (
        <span className="opacity-75 text-[10px] font-mono ml-0.5">({score})</span>
      )}
    </span>
  );
};
