import React from 'react';
import { StatCard } from '../ui/StatCard';
import { Layers, AlertTriangle, XCircle, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/utils/format';

interface StatsRowProps {
  data: {
    totalItems: number;
    expiringSoon30: number;
    expiredItems: number;
    monthlyCost: number;
  };
}

export const StatsRow: React.FC<StatsRowProps> = ({ data }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Tracked Items"
        value={data.totalItems}
        subtitle="Licenses, policies, certs & assets"
        icon={Layers}
        variant="default"
      />

      <StatCard
        title="Expiring Within 30 Days"
        value={data.expiringSoon30}
        subtitle="Requires immediate review or action"
        icon={AlertTriangle}
        variant={data.expiringSoon30 > 0 ? 'warning' : 'success'}
      />

      <StatCard
        title="Expired / Lapsed"
        value={data.expiredItems}
        subtitle={data.expiredItems > 0 ? 'Urgent attention required' : 'Zero compliance lapses'}
        icon={XCircle}
        variant={data.expiredItems > 0 ? 'critical' : 'success'}
      />

      <StatCard
        title="Monthly Financial Run-Rate"
        value={formatCurrency(data.monthlyCost)}
        subtitle="Amortized active commitment"
        icon={DollarSign}
        variant="info"
      />
    </div>
  );
};
