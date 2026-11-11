import React from 'react';
import { LayoutGrid, List, Filter, RotateCcw } from 'lucide-react';
import { SearchInput } from '../ui/SearchInput';
import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '@/api/client';

interface FilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  categoryId: string;
  onCategoryChange: (val: string) => void;
  status: string;
  onStatusChange: (val: string) => void;
  riskLevel: string;
  onRiskLevelChange: (val: string) => void;
  viewMode: 'table' | 'cards';
  onViewModeChange: (val: 'table' | 'cards') => void;
  onReset: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  search,
  onSearchChange,
  categoryId,
  onCategoryChange,
  status,
  onStatusChange,
  riskLevel,
  onRiskLevelChange,
  viewMode,
  onViewModeChange,
  onReset,
}) => {
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.list,
  });

  const statuses = [
    { id: '', label: 'All Status' },
    { id: 'active', label: 'Active' },
    { id: 'expired', label: 'Expired' },
    { id: 'snoozed', label: 'Snoozed' },
    { id: 'archived', label: 'Archived' },
  ];

  const riskLevels = [
    { id: '', label: 'All Risks' },
    { id: 'critical', label: 'Critical' },
    { id: 'high', label: 'High' },
    { id: 'medium', label: 'Medium' },
    { id: 'low', label: 'Low' },
  ];

  const hasActiveFilters = Boolean(search || categoryId || status || riskLevel);

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-3 shadow-sm">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <SearchInput
            value={search}
            onChange={onSearchChange}
            placeholder="Filter by name, vendor, notes..."
          />
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}

          <div className="flex items-center p-1 bg-zinc-950 border border-zinc-800 rounded-xl">
            <button
              onClick={() => onViewModeChange('table')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'table'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Table view"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('cards')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'cards'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Card view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Selectors Row */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-800/60 text-xs">
        <div className="flex items-center gap-1.5 text-zinc-500 font-medium mr-1">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters:</span>
        </div>

        {/* Category Filter */}
        <select
          value={categoryId}
          onChange={e => onCategoryChange(e.target.value)}
          className="px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">All Categories</option>
          {categories.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={status}
          onChange={e => onStatusChange(e.target.value)}
          className="px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {statuses.map(s => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>

        {/* Risk Level Filter */}
        <select
          value={riskLevel}
          onChange={e => onRiskLevelChange(e.target.value)}
          className="px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {riskLevels.map(r => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
