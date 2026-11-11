import { Router, Request, Response, NextFunction } from 'express';
import db from '../database';
import { ItemRow, CategoryRow, ItemWithComputed } from '../types';
import { computeDaysUntilExpiry, computeRiskScore } from '../services/riskEngine';

const router = Router();

function enrichItem(row: any): ItemWithComputed {
  const category = row.category_id
    ? (db.prepare('SELECT * FROM categories WHERE id = ?').get(row.category_id) as CategoryRow | undefined)
    : null;

  return {
    ...row,
    tags: row.tags ? JSON.parse(row.tags) : [],
    custom_fields: row.custom_fields ? JSON.parse(row.custom_fields) : null,
    days_until_expiry: computeDaysUntilExpiry(row.expiry_date),
    risk_score: computeRiskScore(row as ItemRow, category),
    category_name: category?.name ?? null,
    category_color: category?.color ?? null,
  };
}

// GET /api/v1/search?q=query
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = req.query.q ? String(req.query.q).trim() : '';

    if (!q) {
      res.json({ success: true, data: [] });
      return;
    }

    const pattern = `%${q}%`;
    const rows = db.prepare(`
      SELECT i.*, c.name as category_name, c.color as category_color
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      WHERE 
        i.name LIKE ? OR 
        i.description LIKE ? OR 
        i.vendor LIKE ? OR 
        i.responsible_person LIKE ? OR 
        i.notes LIKE ? OR
        c.name LIKE ?
      ORDER BY i.expiry_date ASC
      LIMIT 50
    `).all(pattern, pattern, pattern, pattern, pattern, pattern) as ItemRow[];

    const data = rows.map(enrichItem);
    res.json({ success: true, data, count: data.length });
  } catch (err) {
    next(err);
  }
});

export default router;
