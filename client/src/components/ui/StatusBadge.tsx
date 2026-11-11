import React from 'react';
import { ItemStatus } from '@/types';
import { getStatusColor } from '@/utils/risk';
import { capitalize } from '@/utils/format';

interface StatusBadgeProps {
  status: ItemStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const colorClasses = getStatusColor(status);
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium capitalize border ${colorClasses} ${sizeClasses}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70" />
      {capitalize(status)}
    </span>
  );
};
