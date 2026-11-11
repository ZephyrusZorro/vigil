import React from 'react';
import { DaysLeftPill } from '../ui/DaysLeftPill';
import { RiskBadge } from '../ui/RiskBadge';
import { StatusBadge } from '../ui/StatusBadge';
import { CategoryBadge } from '../ui/CategoryBadge';
import { formatDate } from '@/utils/dates';
import { formatCurrency } from '@/utils/format';
import { ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';

interface ItemsTableProps {
  items: any[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: (all: boolean) => void;
  onItemClick: (item: any) => void;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (field: string) => void;
}

export const ItemsTable: React.FC<ItemsTableProps> = ({
  items,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onItemClick,
  sortField = 'expiry_date',
  sortOrder = 'asc',
  onSort,
}) => {
  const allSelected = items.length > 0 && selectedIds.length === items.length;

  const renderSortIcon = (field: string) => {
    if (!onSort) return null;
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />;
    }
    return sortOrder === 'asc' ? (
      <ChevronUp className="w-3.5 h-3.5 text-indigo-400" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 text-indigo-400" />
    );
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-sm">
      <table className="w-full text-left text-xs border-collapse">
        {/* Table Header */}
        <thead>
          <tr className="border-b border-zinc-800 bg-zinc-950/70 text-zinc-400 font-semibold select-none">
            <th className="py-3.5 pl-4 pr-2 w-10">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={e => onSelectAll(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 text-indigo-600 focus:ring-0 focus:ring-offset-0 bg-zinc-950 cursor-pointer"
              />
            </th>
            <th
              onClick={() => onSort?.('name')}
              className="py-3.5 px-3 cursor-pointer hover:text-zinc-200 transition group"
            >
              <div className="flex items-center gap-1.5">
                <span>Item Name</span>
                {renderSortIcon('name')}
              </div>
            </th>
            <th className="py-3.5 px-3">Category</th>
            <th
              onClick={() => onSort?.('expiry_date')}
              className="py-3.5 px-3 cursor-pointer hover:text-zinc-200 transition group"
            >
              <div className="flex items-center gap-1.5">
                <span>Expiry Date</span>
                {renderSortIcon('expiry_date')}
              </div>
            </th>
            <th
              onClick={() => onSort?.('cost')}
              className="py-3.5 px-3 cursor-pointer hover:text-zinc-200 transition group"
            >
              <div className="flex items-center gap-1.5">
                <span>Cost</span>
                {renderSortIcon('cost')}
              </div>
            </th>
            <th
              onClick={() => onSort?.('risk_level')}
              className="py-3.5 px-3 cursor-pointer hover:text-zinc-200 transition group"
            >
              <div className="flex items-center gap-1.5">
                <span>Risk Score</span>
                {renderSortIcon('risk_level')}
              </div>
            </th>
            <th
              onClick={() => onSort?.('status')}
              className="py-3.5 px-3 cursor-pointer hover:text-zinc-200 transition group"
            >
              <div className="flex items-center gap-1.5">
                <span>Status</span>
                {renderSortIcon('status')}
              </div>
            </th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className="divide-y divide-zinc-800/60">
          {items.map(item => {
            const isSelected = selectedIds.includes(item.id);
            return (
              <tr
                key={item.id}
                onClick={() => onItemClick(item)}
                className={`group cursor-pointer transition ${
                  isSelected
                    ? 'bg-indigo-500/10 hover:bg-indigo-500/15'
                    : 'hover:bg-zinc-800/40'
                }`}
              >
                {/* Checkbox */}
                <td
                  className="py-3.5 pl-4 pr-2"
                  onClick={e => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(item.id)}
                    className="w-4 h-4 rounded border-zinc-700 text-indigo-600 focus:ring-0 focus:ring-offset-0 bg-zinc-950 cursor-pointer"
                  />
                </td>

                {/* Name & Vendor */}
                <td className="py-3.5 px-3">
                  <div className="font-semibold text-zinc-100 group-hover:text-indigo-400 transition truncate max-w-xs">
                    {item.name}
                  </div>
                  {item.vendor && (
                    <div className="text-[11px] text-zinc-500 truncate max-w-xs">
                      {item.vendor}
                    </div>
                  )}
                </td>

                {/* Category */}
                <td className="py-3.5 px-3">
                  <CategoryBadge
                    name={item.category_name || 'Uncategorized'}
                    color={item.category_color}
                  />
                </td>

                {/* Expiry Date & Days Left */}
                <td className="py-3.5 px-3">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-300 font-mono text-[11px]">
                      {formatDate(item.expiry_date)}
                    </span>
                    <DaysLeftPill days={item.days_until_expiry} showIcon={false} />
                  </div>
                </td>

                {/* Cost */}
                <td className="py-3.5 px-3">
                  {item.cost !== null && item.cost !== undefined ? (
                    <div>
                      <span className="font-medium text-zinc-200">
                        {formatCurrency(item.cost, item.currency)}
                      </span>
                      {item.recurrence && item.recurrence !== 'none' && (
                        <div className="text-[10px] text-zinc-500 capitalize">
                          {item.recurrence.replace('_', ' ')}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-zinc-600">—</span>
                  )}
                </td>

                {/* Risk */}
                <td className="py-3.5 px-3">
                  <RiskBadge
                    level={item.risk_level}
                    score={item.risk_score}
                    showScore
                  />
                </td>

                {/* Status */}
                <td className="py-3.5 px-3">
                  <StatusBadge status={item.status} size="sm" />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
