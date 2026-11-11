import React from 'react';
import { DaysLeftPill } from '../ui/DaysLeftPill';
import { RiskBadge } from '../ui/RiskBadge';
import { StatusBadge } from '../ui/StatusBadge';
import { CategoryBadge } from '../ui/CategoryBadge';
import { formatDate } from '@/utils/dates';
import { formatCurrency } from '@/utils/format';
import { Calendar, User, Building, FileText } from 'lucide-react';

interface ItemCardProps {
  item: any;
  onClick: () => void;
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  onClick,
  selected = false,
  onSelect,
}) => {
  return (
    <div
      onClick={onClick}
      className={`group relative bg-zinc-900/90 border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between ${
        selected
          ? 'border-indigo-500 bg-indigo-500/5 ring-1 ring-indigo-500/50'
          : 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
      }`}
    >
      <div>
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            {onSelect && (
              <input
                type="checkbox"
                checked={selected}
                onChange={e => {
                  e.stopPropagation();
                  onSelect(e.target.checked);
                }}
                className="w-4 h-4 rounded border-zinc-700 text-indigo-600 focus:ring-0 focus:ring-offset-0 bg-zinc-950 cursor-pointer"
              />
            )}
            <CategoryBadge
              name={item.category_name || 'Uncategorized'}
              color={item.category_color}
            />
          </div>
          <DaysLeftPill days={item.days_until_expiry} />
        </div>

        {/* Title & Description */}
        <h3 className="font-semibold text-zinc-100 text-sm group-hover:text-indigo-400 transition line-clamp-1">
          {item.name}
        </h3>
        {item.description && (
          <p className="mt-1 text-xs text-zinc-500 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        )}
      </div>

      {/* Meta grid */}
      <div className="mt-4 pt-3 border-t border-zinc-800/80 space-y-2 text-xs text-zinc-400">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
            <span>Expires {formatDate(item.expiry_date)}</span>
          </div>
          {item.cost !== null && item.cost !== undefined && (
            <span className="font-medium text-zinc-200">
              {formatCurrency(item.cost, item.currency)}
              {item.recurrence && item.recurrence !== 'none' && (
                <span className="text-[10px] text-zinc-500">/{item.recurrence.replace('_', ' ')}</span>
              )}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5 truncate max-w-[150px]">
            {item.responsible_person ? (
              <>
                <User className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                <span className="truncate">{item.responsible_person}</span>
              </>
            ) : item.vendor ? (
              <>
                <Building className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                <span className="truncate">{item.vendor}</span>
              </>
            ) : (
              <span className="text-zinc-600">Unassigned</span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <RiskBadge level={item.risk_level} score={item.risk_score} showScore />
            <StatusBadge status={item.status} size="sm" />
          </div>
        </div>
      </div>
    </div>
  );
};
