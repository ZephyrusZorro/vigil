import { ItemRow, CategoryRow } from '../types';

/**
 * Risk scoring engine.
 * Produces a numeric 0-100 score for any item based on:
 *  - Days until expiry
 *  - Cost impact
 *  - Category default risk level
 *  - Manual risk_level override
 */

const RISK_LEVEL_WEIGHT: Record<string, number> = {
  critical: 40,
  high: 30,
  medium: 20,
  low: 10,
};

export function computeDaysUntilExpiry(expiryDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function computeRiskScore(
  item: ItemRow,
  category?: CategoryRow | null
): number {
  const daysUntil = computeDaysUntilExpiry(item.expiry_date);

  // ── Items < 7 days → automatic critical (score 90-100) ──
  if (daysUntil < 0) {
    // Already expired → maximum risk
    return 100;
  }

  // 1. Time-based score (0-50 points)
  let timeScore: number;
  if (daysUntil <= 3) {
    timeScore = 50;
  } else if (daysUntil <= 7) {
    timeScore = 45;
  } else if (daysUntil <= 14) {
    timeScore = 40;
  } else if (daysUntil <= 30) {
    timeScore = 32;
  } else if (daysUntil <= 60) {
    timeScore = 22;
  } else if (daysUntil <= 90) {
    timeScore = 15;
  } else if (daysUntil <= 180) {
    timeScore = 8;
  } else {
    timeScore = 2;
  }

  // 2. Manual risk_level weight (0-25 points)
  const manualRiskScore = (RISK_LEVEL_WEIGHT[item.risk_level] || 20) * 0.625;

  // 3. Category default risk level (0-10 points)
  const categoryRiskLevel = category?.default_risk_level || 'medium';
  const categoryScore = (RISK_LEVEL_WEIGHT[categoryRiskLevel] || 20) * 0.25;

  // 4. Cost impact (0-15 points)
  let costScore = 0;
  if (item.cost !== null && item.cost > 0) {
    if (item.cost >= 10000) costScore = 15;
    else if (item.cost >= 5000) costScore = 12;
    else if (item.cost >= 1000) costScore = 8;
    else if (item.cost >= 100) costScore = 4;
    else costScore = 2;
  }

  let total = Math.round(timeScore + manualRiskScore + categoryScore + costScore);
  total = Math.max(0, Math.min(100, total));

  // Items < 7 days: ensure minimum score of 85
  if (daysUntil >= 0 && daysUntil < 7) {
    total = Math.max(85, total);
  }

  return total;
}

export function effectiveRiskLevel(riskScore: number): string {
  if (riskScore >= 80) return 'critical';
  if (riskScore >= 55) return 'high';
  if (riskScore >= 30) return 'medium';
  return 'low';
}
