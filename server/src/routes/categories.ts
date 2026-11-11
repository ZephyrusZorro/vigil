import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import { CreateCategorySchema, UpdateCategorySchema, CategoryRow } from '../types';
import { logActivity } from '../services/activityService';

const router = Router();

// GET /api/v1/categories - list all categories with item counts
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const rows = db.prepare(`
      SELECT 
        c.*,
        COUNT(i.id) as item_count,
        SUM(CASE WHEN i.status = 'active' THEN 1 ELSE 0 END) as active_count,
        SUM(CASE WHEN i.status = 'expired' THEN 1 ELSE 0 END) as expired_count
      FROM categories c
      LEFT JOIN items i ON c.id = i.category_id
      GROUP BY c.id
      ORDER BY c.name ASC
    `).all();

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/categories/:id
router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const row = db.prepare(`
      SELECT 
        c.*,
        COUNT(i.id) as item_count
      FROM categories c
      LEFT JOIN items i ON c.id = i.category_id
      WHERE c.id = ?
      GROUP BY c.id
    `).get(req.params.id) as any;

    if (!row) {
      res.status(404).json({ success: false, error: 'Category not found' });
      return;
    }

    res.json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/categories
router.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = CreateCategorySchema.parse(req.body);
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO categories (id, name, icon, color, description, default_risk_level, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      body.name,
      body.icon ?? '📁',
      body.color ?? '#6366F1',
      body.description ?? null,
      body.default_risk_level,
      now
    );

    const created = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as CategoryRow;
    logActivity(null, 'category_created', { id, name: body.name }, 'user');

    res.status(201).json({ success: true, data: { ...created, item_count: 0 } });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/categories/:id
router.put('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id) as CategoryRow | undefined;
    if (!existing) {
      res.status(404).json({ success: false, error: 'Category not found' });
      return;
    }

    const body = UpdateCategorySchema.parse(req.body);

    const updated = {
      name: body.name ?? existing.name,
      icon: body.icon !== undefined ? body.icon : existing.icon,
      color: body.color !== undefined ? body.color : existing.color,
      description: body.description !== undefined ? body.description : existing.description,
      default_risk_level: body.default_risk_level ?? existing.default_risk_level,
    };

    db.prepare(`
      UPDATE categories SET
        name = ?, icon = ?, color = ?, description = ?, default_risk_level = ?
      WHERE id = ?
    `).run(
      updated.name,
      updated.icon,
      updated.color,
      updated.description,
      updated.default_risk_level,
      req.params.id
    );

    const result = db.prepare(`
      SELECT c.*, COUNT(i.id) as item_count 
      FROM categories c
      LEFT JOIN items i ON c.id = i.category_id
      WHERE c.id = ?
      GROUP BY c.id
    `).get(req.params.id);

    logActivity(null, 'category_updated', { id: req.params.id, name: updated.name }, 'user');
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/categories/:id
router.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id) as CategoryRow | undefined;
    if (!existing) {
      res.status(404).json({ success: false, error: 'Category not found' });
      return;
    }

    // Set category_id = null on items belonging to this category
    db.prepare('UPDATE items SET category_id = NULL WHERE category_id = ?').run(req.params.id);
    db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);

    logActivity(null, 'category_deleted', { id: req.params.id, name: existing.name }, 'user');
    res.json({ success: true, data: { id: req.params.id, deleted: true } });
  } catch (err) {
    next(err);
  }
});

export default router;
