import { Router, Request, Response, NextFunction } from 'express';
import db from '../database';
import { computeDaysUntilExpiry } from '../services/riskEngine';
import { getRecentActivity } from '../services/activityService';
import { DashboardData } from '../types';

const router = Router();

// GET /api/v1/dashboard
router.get('/', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const d7 = new Date();
    d7.setDate(d7.getDate() + 7);
    const d7Str = d7.toISOString().split('T')[0];

    const d30 = new Date();
    d30.setDate(d30.getDate() + 30);
    const d30Str = d30.toISOString().split('T')[0];

    const d90 = new Date();
    d90.setDate(d90.getDate() + 90);
    const d90Str = d90.toISOString().split('T')[0];

    // Counts
    const counts = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired,
        SUM(CASE WHEN status = 'active' AND expiry_date >= ? AND expiry_date <= ? THEN 1 ELSE 0 END) as exp7,
        SUM(CASE WHEN status = 'active' AND expiry_date >= ? AND expiry_date <= ? THEN 1 ELSE 0 END) as exp30,
        SUM(CASE WHEN status = 'active' AND expiry_date >= ? AND expiry_date <= ? THEN 1 ELSE 0 END) as exp90
      FROM items
    `).get(todayStr, d7Str, todayStr, d30Str, todayStr, d90Str) as any;

    // By Category
    const byCategory = db.prepare(`
      SELECT 
        COALESCE(c.name, 'Uncategorized') as name,
        COALESCE(c.color, '#94A3B8') as color,
        COUNT(i.id) as count
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      GROUP BY c.id
      ORDER BY count DESC
    `).all() as { name: string; count: number; color: string }[];

    // By Risk Level
    const byRiskLevel = db.prepare(`
      SELECT 
        risk_level as level,
        COUNT(*) as count
      FROM items
      WHERE status IN ('active', 'expired')
      GROUP BY risk_level
      ORDER BY 
        CASE risk_level 
          WHEN 'critical' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'medium' THEN 3 
          WHEN 'low' THEN 4 
          ELSE 5 
        END
    `).all() as { level: string; count: number }[];

    // Monthly cost calculation
    const costItems = db.prepare(`
      SELECT cost, recurrence, currency FROM items
      WHERE status = 'active' AND cost IS NOT NULL AND cost > 0
    `).all() as { cost: number; recurrence: string; currency: string }[];

    let monthlyCost = 0;
    for (const item of costItems) {
      const c = Number(item.cost) || 0;
      switch (item.recurrence) {
        case 'monthly':
          monthlyCost += c;
          break;
        case 'quarterly':
          monthlyCost += c / 3;
          break;
        case 'semi_annual':
          monthlyCost += c / 6;
          break;
        case 'annual':
          monthlyCost += c / 12;
          break;
        case 'biennial':
          monthlyCost += c / 24;
          break;
        default:
          // One-time or none — amortize over 12 months for estimated monthly exposure
          monthlyCost += c / 12;
          break;
      }
    }

    // Upcoming Timeline
    const upcomingRows = db.prepare(`
      SELECT 
        i.id,
        i.name,
        i.expiry_date,
        i.risk_level,
        c.name as category,
        c.color as category_color
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      WHERE i.status IN ('active', 'expired')
      ORDER BY i.expiry_date ASC
      LIMIT 12
    `).all() as any[];

    const upcomingTimeline = upcomingRows.map(row => ({
      id: row.id,
      name: row.name,
      expiry_date: row.expiry_date,
      days_until: computeDaysUntilExpiry(row.expiry_date),
      risk_level: row.risk_level,
      category: row.category,
      category_color: row.category_color,
    }));

    // Recent Activity
    const recentActivity = getRecentActivity(10);

    const dashboardData: DashboardData = {
      totalItems: counts.total || 0,
      activeItems: counts.active || 0,
      expiredItems: counts.expired || 0,
      expiringSoon7: counts.exp7 || 0,
      expiringSoon30: counts.exp30 || 0,
      expiringSoon90: counts.exp90 || 0,
      byCategory,
      byRiskLevel,
      monthlyCost: Math.round(monthlyCost * 100) / 100,
      upcomingTimeline,
      recentActivity,
    };

    res.json({ success: true, data: dashboardData });
  } catch (err) {
    next(err);
  }
});

export default router;
