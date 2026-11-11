import React from 'react';
import { DaysLeftPill } from '../ui/DaysLeftPill';
import { RiskBadge } from '../ui/RiskBadge';
import { formatDate } from '@/utils/dates';
import { AlertCircle, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ExpiringListProps {
  items: any[];
  onSelectItem?: (id: string) => void;
}

export const ExpiringList: React.FC<ExpiringListProps> = ({ items, onSelectItem }) => {
  const navigate = useNavigate();

  // Filter items expiring in <= 30 days or already expired
  const criticalItems = items.filter(
    i => i.days_until <= 30
  );

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span>High-Priority Attention Queue</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Items within critical 30-day decision window
          </p>
        </div>

        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
          {criticalItems.length} Urgent
        </span>
      </div>

      {criticalItems.length === 0 ? (
        <div className="py-8 text-center text-xs text-zinc-500 bg-zinc-950/40 rounded-xl border border-dashed border-zinc-800">
          No items currently in the 30-day critical zone.
        </div>
      ) : (
        <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
          {criticalItems.map((item: any) => (
            <div
              key={item.id}
              onClick={() => {
                if (onSelectItem) onSelectItem(item.id);
                else navigate(`/items?id=${item.id}`);
              }}
              className="p-3 bg-zinc-950/70 border border-zinc-800 hover:border-zinc-700 rounded-xl cursor-pointer transition flex items-center justify-between gap-3 group"
            >
              <div className="overflow-hidden">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-200 group-hover:text-indigo-400 transition text-xs truncate">
                    {item.name}
                  </span>
                  <RiskBadge level={item.risk_level} />
                </div>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Expires {formatDate(item.expiry_date)} • {item.category || 'General'}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <DaysLeftPill days={item.days_until} />
                <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 transition" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
