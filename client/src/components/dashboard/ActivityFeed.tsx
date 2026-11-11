import React from 'react';
import { formatRelative } from '@/utils/dates';
import { History, Activity, ShieldCheck, FileText, Trash2, Edit3, PlusCircle } from 'lucide-react';

interface ActivityFeedProps {
  activities: any[];
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'item_created': return <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />;
      case 'item_updated': return <Edit3 className="w-3.5 h-3.5 text-indigo-400" />;
      case 'item_deleted': return <Trash2 className="w-3.5 h-3.5 text-red-400" />;
      case 'document_uploaded': return <FileText className="w-3.5 h-3.5 text-blue-400" />;
      case 'auto_expire_check': return <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />;
      default: return <Activity className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  const formatActionMessage = (action: string, details: any, itemName?: string) => {
    switch (action) {
      case 'item_created':
        return `Created record "${details?.name || itemName || 'Item'}"`;
      case 'item_updated':
        return `Updated fields on "${itemName || 'Item'}"`;
      case 'item_deleted':
        return `Deleted item "${details?.name || 'Item'}"`;
      case 'document_uploaded':
        return `Uploaded "${details?.filename}" to "${itemName || 'Item'}"`;
      case 'auto_expire_check':
        return `Engine flagged ${details?.expired_count || 0} expired records`;
      case 'system_initialized':
        return 'System initialized with baseline demonstration seed';
      default:
        return action.replace(/_/g, ' ');
    }
  };

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-400" />
          <span>Audit Log & System Activity</span>
        </h3>
        <span className="text-[10px] text-zinc-500 font-mono">Live Sync</span>
      </div>

      {(!activities || activities.length === 0) ? (
        <div className="py-6 text-center text-xs text-zinc-500">
          No recent activity recorded.
        </div>
      ) : (
        <div className="divide-y divide-zinc-800/60 max-h-60 overflow-y-auto">
          {activities.map((act: any) => (
            <div key={act.id} className="py-2.5 flex items-start gap-2.5 text-xs">
              <div className="p-1 rounded-md bg-zinc-800/80 mt-0.5 flex-shrink-0">
                {getActionIcon(act.action)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-zinc-300 font-medium truncate">
                  {formatActionMessage(act.action, act.details, act.item_name)}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-0.5">
                  <span>by {act.actor || 'system'}</span>
                  <span>•</span>
                  <span>{formatRelative(act.created_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
