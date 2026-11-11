import React from 'react';
import { DaysLeftPill } from '../ui/DaysLeftPill';
import { RiskBadge } from '../ui/RiskBadge';
import { formatDate } from '@/utils/dates';
import { Clock, Calendar, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TimelineProps {
  items: any[];
  onSelectItem?: (id: string) => void;
}

export const Timeline: React.FC<TimelineProps> = ({ items, onSelectItem }) => {
  const navigate = useNavigate();

  if (!items || items.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-zinc-500 bg-zinc-900/40 rounded-2xl border border-zinc-800">
        No upcoming items scheduled in the timeline.
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>Upcoming Expiry Horizon</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Chronological deadline projection for active items
          </p>
        </div>

        <button
          onClick={() => navigate('/items')}
          className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
        >
          <span>View All Items</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Horizon items list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.slice(0, 6).map((item: any) => (
          <div
            key={item.id}
            onClick={() => {
              if (onSelectItem) onSelectItem(item.id);
              else navigate(`/items?id=${item.id}`);
            }}
            className="p-3.5 bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 rounded-xl cursor-pointer transition flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider truncate max-w-[130px]">
                  {item.category || 'General'}
                </span>
                <DaysLeftPill days={item.days_until} />
              </div>
              <p className="font-semibold text-zinc-200 group-hover:text-indigo-400 transition text-xs truncate">
                {item.name}
              </p>
            </div>

            <div className="mt-3 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500">
              <span className="flex items-center gap-1 font-mono">
                <Calendar className="w-3 h-3" />
                {formatDate(item.expiry_date)}
              </span>
              <RiskBadge level={item.risk_level} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
