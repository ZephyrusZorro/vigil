import { RiskLevel } from '@/types';

export function getRiskColor(level: RiskLevel): string {
  switch (level) {
    case 'critical': return 'text-red-500';
    case 'high': return 'text-orange-500';
    case 'medium': return 'text-amber-500';
    case 'low': return 'text-emerald-500';
    default: return 'text-zinc-400';
  }
}

export function getRiskBgColor(level: RiskLevel): string {
  switch (level) {
    case 'critical': return 'bg-red-500/10 text-red-400 border-red-500/20';
    case 'high': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    case 'medium': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'low': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
  }
}

export function getRiskDotColor(level: RiskLevel): string {
  switch (level) {
    case 'critical': return 'bg-red-500';
    case 'high': return 'bg-orange-500';
    case 'medium': return 'bg-amber-500';
    case 'low': return 'bg-emerald-500';
    default: return 'bg-zinc-500';
  }
}

export function getDaysLeftColor(days: number | null): string {
  if (days === null) return 'bg-zinc-700 text-zinc-300';
  if (days < 0) return 'bg-red-900/60 text-red-300 border border-red-700/50';
  if (days <= 7) return 'bg-red-500/15 text-red-400 border border-red-500/30';
  if (days <= 30) return 'bg-orange-500/15 text-orange-400 border border-orange-500/30';
  if (days <= 90) return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
  return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'active': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    case 'expired': return 'bg-red-500/15 text-red-400 border-red-500/30';
    case 'archived': return 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30';
    case 'snoozed': return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    default: return 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30';
  }
}

export const RISK_LEVELS: RiskLevel[] = ['critical', 'high', 'medium', 'low'];
