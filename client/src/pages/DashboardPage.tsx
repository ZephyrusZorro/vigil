import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/api/client';
import { StatsRow } from '@/components/dashboard/StatsRow';
import { Timeline } from '@/components/dashboard/Timeline';
import { ExpiringList } from '@/components/dashboard/ExpiringList';
import { CategoryChart } from '@/components/dashboard/CategoryChart';
import { RiskChart } from '@/components/dashboard/RiskChart';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { SlideOver } from '@/components/ui/SlideOver';
import { ItemDetail } from '@/components/items/ItemDetail';
import { Modal } from '@/components/ui/Modal';
import { ItemForm } from '@/components/items/ItemForm';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);

  const { data: dashboard, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.get,
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <LoadingSpinner size="lg" label="Loading Vigil Intelligence..." />
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="p-8 text-center text-red-400 bg-red-500/10 border border-red-500/20 rounded-2xl">
        Failed to load dashboard metrics. Ensure backend server is running.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Title & Refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <span>Executive Command Center</span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Defense
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time compliance surveillance, risk-weighted obligations & renewal horizon
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-medium border border-zinc-800 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          <span>Sync Status</span>
        </button>
      </div>

      {/* Top 4 Stats */}
      <StatsRow data={dashboard} />

      {/* Expiry Horizon Timeline */}
      <Timeline
        items={dashboard.upcomingTimeline}
        onSelectItem={id => setSelectedItemId(id)}
      />

      {/* Two Column Section: Queue & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: High Priority Queue */}
        <ExpiringList
          items={dashboard.upcomingTimeline}
          onSelectItem={id => setSelectedItemId(id)}
        />

        {/* Right Column: Risk & Category Analytics */}
        <div className="space-y-6">
          <RiskChart data={dashboard.byRiskLevel} />
          <CategoryChart data={dashboard.byCategory} />
        </div>
      </div>

      {/* Full Width Activity Feed */}
      <ActivityFeed activities={dashboard.recentActivity} />

      {/* Item Detail Slide-Over */}
      <SlideOver
        isOpen={Boolean(selectedItemId)}
        onClose={() => setSelectedItemId(null)}
        title="Record Overview"
        subtitle="Tracking metadata, risk factors & attachments"
        width="xl"
      >
        {selectedItemId && (
          <ItemDetail
            itemId={selectedItemId}
            onClose={() => setSelectedItemId(null)}
            onEdit={item => {
              setEditingItem(item);
              setSelectedItemId(null);
            }}
          />
        )}
      </SlideOver>

      {/* Edit Item Modal */}
      <Modal
        isOpen={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
        title="Edit Record"
        description="Update tracked deadlines, terms, and metadata"
        maxWidth="2xl"
      >
        {editingItem && (
          <ItemForm
            initialData={editingItem}
            onSuccess={() => setEditingItem(null)}
            onCancel={() => setEditingItem(null)}
          />
        )}
      </Modal>
    </div>
  );
};
