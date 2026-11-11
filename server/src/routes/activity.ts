import { Router, Request, Response, NextFunction } from 'express';
import db from '../database';
import { PaginationSchema } from '../types';

const router = Router();

// GET /api/v1/activity - paginated activity logs
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit } = PaginationSchema.parse(req.query);
    const offset = (page - 1) * limit;

    const countRow = db.prepare('SELECT COUNT(*) as total FROM activity_log').get() as { total: number };
    const total = countRow.total;
    const totalPages = Math.ceil(total / limit);

    const rows = db.prepare(`
      SELECT 
        al.*,
        i.name as item_name
      FROM activity_log al
      LEFT JOIN items i ON al.item_id = i.id
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset) as any[];

    const data = rows.map(r => ({
      ...r,
      details: r.details ? JSON.parse(r.details) : null,
    }));

    res.json({
      success: true,
      data,
      pagination: { total, page, limit, totalPages },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
