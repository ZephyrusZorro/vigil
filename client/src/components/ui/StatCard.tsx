import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'default' | 'critical' | 'warning' | 'success' | 'info';
  trend?: {
    value: string;
    isPositive?: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'critical':
        return {
          iconBg: 'bg-red-500/15 text-red-400',
          border: 'border-red-500/30 hover:border-red-500/50',
          gradient: 'from-red-500/5 to-transparent',
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-500/15 text-amber-400',
          border: 'border-amber-500/30 hover:border-amber-500/50',
          gradient: 'from-amber-500/5 to-transparent',
        };
      case 'success':
        return {
          iconBg: 'bg-emerald-500/15 text-emerald-400',
          border: 'border-emerald-500/30 hover:border-emerald-500/50',
          gradient: 'from-emerald-500/5 to-transparent',
        };
      case 'info':
        return {
          iconBg: 'bg-blue-500/15 text-blue-400',
          border: 'border-blue-500/30 hover:border-blue-500/50',
          gradient: 'from-blue-500/5 to-transparent',
        };
      default:
        return {
          iconBg: 'bg-zinc-800 text-zinc-300',
          border: 'border-zinc-800 hover:border-zinc-700',
          gradient: 'from-zinc-800/40 to-transparent',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      className={`relative overflow-hidden rounded-xl border bg-zinc-900/90 p-5 shadow-sm transition-all duration-200 bg-gradient-to-b ${styles.gradient} ${styles.border}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-400">{title}</span>
        <div className={`p-2 rounded-lg ${styles.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3">
        <div className="text-3xl font-bold tracking-tight text-zinc-100">{value}</div>
        {subtitle && <p className="mt-1 text-xs text-zinc-500">{subtitle}</p>}
      </div>
    </div>
  );
};
