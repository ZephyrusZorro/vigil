import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import { CreateTagSchema, UpdateTagSchema, TagRow } from '../types';

const router = Router();

// GET /api/v1/tags
router.get('/', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const tags = db.prepare('SELECT * FROM tags ORDER BY name ASC').all() as TagRow[];
    res.json({ success: true, data: tags });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/tags
router.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = CreateTagSchema.parse(req.body);
    const id = uuidv4();

    db.prepare('INSERT INTO tags (id, name, color) VALUES (?, ?, ?)').run(
      id,
      body.name.toLowerCase().trim(),
      body.color ?? '#64748B'
    );

    const created = db.prepare('SELECT * FROM tags WHERE id = ?').get(id) as TagRow;
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/tags/:id
router.put('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = db.prepare('SELECT * FROM tags WHERE id = ?').get(req.params.id) as TagRow | undefined;
    if (!existing) {
      res.status(404).json({ success: false, error: 'Tag not found' });
      return;
    }

    const body = UpdateTagSchema.parse(req.body);
    const updatedName = body.name ? body.name.toLowerCase().trim() : existing.name;
    const updatedColor = body.color !== undefined ? body.color : existing.color;

    db.prepare('UPDATE tags SET name = ?, color = ? WHERE id = ?').run(updatedName, updatedColor, req.params.id);

    const result = db.prepare('SELECT * FROM tags WHERE id = ?').get(req.params.id) as TagRow;
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/tags/:id
router.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = db.prepare('SELECT * FROM tags WHERE id = ?').get(req.params.id) as TagRow | undefined;
    if (!existing) {
      res.status(404).json({ success: false, error: 'Tag not found' });
      return;
    }

    db.prepare('DELETE FROM tags WHERE id = ?').run(req.params.id);
    res.json({ success: true, data: { id: req.params.id, deleted: true } });
  } catch (err) {
    next(err);
  }
});

export default router;
