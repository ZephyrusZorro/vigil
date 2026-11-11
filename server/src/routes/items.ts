import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import {
  CreateItemSchema,
  UpdateItemSchema,
  StatusUpdateSchema,
  BulkDeleteSchema,
  BulkStatusUpdateSchema,
  ItemFilterSchema,
  ItemRow,
  CategoryRow,
  ItemWithComputed,
} from '../types';
import { computeDaysUntilExpiry, computeRiskScore } from '../services/riskEngine';
import { logActivity } from '../services/activityService';

const router = Router();

/** Enrich a raw ItemRow with computed fields. */
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

// GET /api/v1/items — list with filters, sorting, pagination
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = ItemFilterSchema.parse(req.query);
    const { page, limit, sort, order, category, status, risk_level, tags, expiry_from, expiry_to } = filters;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (category) {
      whereClause += ' AND i.category_id = ?';
      params.push(category);
    }
    if (status) {
      whereClause += ' AND i.status = ?';
      params.push(status);
    }
    if (risk_level) {
      whereClause += ' AND i.risk_level = ?';
      params.push(risk_level);
    }
    if (expiry_from) {
      whereClause += ' AND i.expiry_date >= ?';
      params.push(expiry_from);
    }
    if (expiry_to) {
      whereClause += ' AND i.expiry_date <= ?';
      params.push(expiry_to);
    }
    if (tags) {
      const tagList = tags.split(',').map(t => t.trim());
      for (const tag of tagList) {
        whereClause += ` AND i.tags LIKE ?`;
        params.push(`%"${tag}"%`);
      }
    }

    // Validate sort column
    const allowedSorts = ['name', 'expiry_date', 'created_at', 'updated_at', 'cost', 'risk_level', 'status'];
    const sortCol = allowedSorts.includes(sort!) ? `i.${sort}` : 'i.expiry_date';
    const sortOrder = order === 'desc' ? 'DESC' : 'ASC';

    // Count total
    const countRow = db.prepare(`SELECT COUNT(*) as total FROM items i ${whereClause}`).get(...params) as { total: number };
    const total = countRow.total;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    const rows = db.prepare(`
      SELECT i.* FROM items i
      ${whereClause}
      ORDER BY ${sortCol} ${sortOrder}
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset) as ItemRow[];

    const data = rows.map(enrichItem);

    res.json({
      success: true,
      data,
      pagination: { total, page, limit, totalPages },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/items/timeline — items grouped by month
router.get('/timeline', (req: Request, res: Response, next: NextFunction) => {
  try {
    const rows = db.prepare(`
      SELECT i.* FROM items i
      WHERE i.status IN ('active', 'expired')
      ORDER BY i.expiry_date ASC
    `).all() as ItemRow[];

    const enriched = rows.map(enrichItem);

    const grouped: Record<string, ItemWithComputed[]> = {};
    for (const item of enriched) {
      const monthKey = item.expiry_date.substring(0, 7); // YYYY-MM
      if (!grouped[monthKey]) grouped[monthKey] = [];
      grouped[monthKey].push(item);
    }

    const timeline = Object.entries(grouped).map(([month, items]) => ({
      month,
      items,
    }));

    res.json({ success: true, data: timeline });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/items/:id
router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const row = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id) as ItemRow | undefined;
    if (!row) {
      res.status(404).json({ success: false, error: 'Item not found' });
      return;
    }

    // Also fetch documents for this item
    const documents = db.prepare('SELECT * FROM documents WHERE item_id = ?').all(req.params.id);

    const enriched = enrichItem(row);
    res.json({ success: true, data: { ...enriched, documents } });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/items
router.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = CreateItemSchema.parse(req.body);
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO items (id, name, description, category_id, status, start_date, expiry_date, renewal_date, cost, currency, recurrence, recurrence_days, risk_level, responsible_person, responsible_email, vendor, vendor_contact, notes, tags, custom_fields, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      body.name,
      body.description ?? null,
      body.category_id ?? null,
      body.status,
      body.start_date ?? null,
      body.expiry_date,
      body.renewal_date ?? null,
      body.cost ?? null,
      body.currency,
      body.recurrence,
      body.recurrence_days ?? null,
      body.risk_level,
      body.responsible_person ?? null,
      body.responsible_email || null,
      body.vendor ?? null,
      body.vendor_contact ?? null,
      body.notes ?? null,
      body.tags ? JSON.stringify(body.tags) : null,
      body.custom_fields ? JSON.stringify(body.custom_fields) : null,
      now,
      now
    );

    const created = db.prepare('SELECT * FROM items WHERE id = ?').get(id) as ItemRow;
    logActivity(id, 'item_created', { name: body.name }, 'user');

    res.status(201).json({ success: true, data: enrichItem(created) });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/items/:id
router.put('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id) as ItemRow | undefined;
    if (!existing) {
      res.status(404).json({ success: false, error: 'Item not found' });
      return;
    }

    const body = UpdateItemSchema.parse(req.body);
    const now = new Date().toISOString();

    const updated = {
      name: body.name ?? existing.name,
      description: body.description !== undefined ? body.description : existing.description,
      category_id: body.category_id !== undefined ? body.category_id : existing.category_id,
      status: body.status ?? existing.status,
      start_date: body.start_date !== undefined ? body.start_date : existing.start_date,
      expiry_date: body.expiry_date ?? existing.expiry_date,
      renewal_date: body.renewal_date !== undefined ? body.renewal_date : existing.renewal_date,
      cost: body.cost !== undefined ? body.cost : existing.cost,
      currency: body.currency ?? existing.currency,
      recurrence: body.recurrence ?? existing.recurrence,
      recurrence_days: body.recurrence_days !== undefined ? body.recurrence_days : existing.recurrence_days,
      risk_level: body.risk_level ?? existing.risk_level,
      responsible_person: body.responsible_person !== undefined ? body.responsible_person : existing.responsible_person,
      responsible_email: body.responsible_email !== undefined ? (body.responsible_email || null) : existing.responsible_email,
      vendor: body.vendor !== undefined ? body.vendor : existing.vendor,
      vendor_contact: body.vendor_contact !== undefined ? body.vendor_contact : existing.vendor_contact,
      notes: body.notes !== undefined ? body.notes : existing.notes,
      tags: body.tags !== undefined ? (body.tags ? JSON.stringify(body.tags) : null) : existing.tags,
      custom_fields: body.custom_fields !== undefined ? (body.custom_fields ? JSON.stringify(body.custom_fields) : null) : existing.custom_fields,
    };

    db.prepare(`
      UPDATE items SET
        name=?, description=?, category_id=?, status=?, start_date=?, expiry_date=?,
        renewal_date=?, cost=?, currency=?, recurrence=?, recurrence_days=?, risk_level=?,
        responsible_person=?, responsible_email=?, vendor=?, vendor_contact=?, notes=?,
        tags=?, custom_fields=?, updated_at=?
      WHERE id=?
    `).run(
      updated.name, updated.description, updated.category_id, updated.status,
      updated.start_date, updated.expiry_date, updated.renewal_date, updated.cost,
      updated.currency, updated.recurrence, updated.recurrence_days, updated.risk_level,
      updated.responsible_person, updated.responsible_email, updated.vendor,
      updated.vendor_contact, updated.notes, updated.tags, updated.custom_fields,
      now, req.params.id
    );

    const result = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id) as ItemRow;
    logActivity(String(req.params.id), 'item_updated', { changes: Object.keys(body) }, 'user');

    res.json({ success: true, data: enrichItem(result) });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/items/:id
router.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id) as ItemRow | undefined;
    if (!existing) {
      res.status(404).json({ success: false, error: 'Item not found' });
      return;
    }

    db.prepare('DELETE FROM items WHERE id = ?').run(req.params.id);
    logActivity(String(req.params.id), 'item_deleted', { name: existing.name }, 'user');

    res.json({ success: true, data: { id: req.params.id, deleted: true } });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/items/:id/status
router.patch('/:id/status', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = StatusUpdateSchema.parse(req.body);
    const existing = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id) as ItemRow | undefined;
    if (!existing) {
      res.status(404).json({ success: false, error: 'Item not found' });
      return;
    }

    const now = new Date().toISOString();
    db.prepare('UPDATE items SET status = ?, updated_at = ? WHERE id = ?').run(status, now, req.params.id);
    logActivity(String(req.params.id), 'status_changed', { from: existing.status, to: status }, 'user');

    const result = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id) as ItemRow;
    res.json({ success: true, data: enrichItem(result) });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/items/bulk-delete
router.post('/bulk-delete', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ids } = BulkDeleteSchema.parse(req.body);
    const deleteStmt = db.prepare('DELETE FROM items WHERE id = ?');
    const deleteMany = db.transaction((ids: string[]) => {
      let deleted = 0;
      for (const id of ids) {
        const result = deleteStmt.run(id);
        deleted += result.changes;
      }
      return deleted;
    });

    const deleted = deleteMany(ids);
    logActivity(null, 'bulk_delete', { count: deleted, ids }, 'user');

    res.json({ success: true, data: { deleted } });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/items/bulk-update-status
router.post('/bulk-update-status', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ids, status } = BulkStatusUpdateSchema.parse(req.body);
    const now = new Date().toISOString();
    const updateStmt = db.prepare('UPDATE items SET status = ?, updated_at = ? WHERE id = ?');
    const updateMany = db.transaction((ids: string[]) => {
      let updated = 0;
      for (const id of ids) {
        const result = updateStmt.run(status, now, id);
        updated += result.changes;
      }
      return updated;
    });

    const updated = updateMany(ids);
    logActivity(null, 'bulk_status_update', { count: updated, status, ids }, 'user');

    res.json({ success: true, data: { updated, status } });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/items/:id/renew — One-click automated renewal workflow
router.post('/:id/renew', (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id) as ItemRow | undefined;
    if (!existing) {
      res.status(404).json({ success: false, error: 'Item not found' });
      return;
    }

    const currentExpiry = new Date(existing.expiry_date);
    const newExpiry = new Date(currentExpiry);

    switch (existing.recurrence) {
      case 'monthly':
        newExpiry.setMonth(newExpiry.getMonth() + 1);
        break;
      case 'quarterly':
        newExpiry.setMonth(newExpiry.getMonth() + 3);
        break;
      case 'semi_annual':
        newExpiry.setMonth(newExpiry.getMonth() + 6);
        break;
      case 'annual':
        newExpiry.setFullYear(newExpiry.getFullYear() + 1);
        break;
      case 'biennial':
        newExpiry.setFullYear(newExpiry.getFullYear() + 2);
        break;
      default:
        if (existing.recurrence_days && existing.recurrence_days > 0) {
          newExpiry.setDate(newExpiry.getDate() + existing.recurrence_days);
        } else {
          newExpiry.setFullYear(newExpiry.getFullYear() + 1);
        }
        break;
    }

    const newExpiryStr = newExpiry.toISOString().split('T')[0];
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE items SET
        start_date = ?,
        expiry_date = ?,
        status = 'active',
        updated_at = ?
      WHERE id = ?
    `).run(existing.expiry_date, newExpiryStr, now, req.params.id);

    // Dismiss existing alerts for this item so fresh ones are computed for the new cycle
    db.prepare('UPDATE alerts SET is_sent = 1, sent_at = ? WHERE item_id = ?').run(now, req.params.id);

    logActivity(
      String(req.params.id),
      'item_renewed',
      {
        previous_expiry: existing.expiry_date,
        new_expiry: newExpiryStr,
        recurrence: existing.recurrence,
      },
      'user'
    );

    const result = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id) as ItemRow;
    res.json({
      success: true,
      message: `Item renewed until ${newExpiryStr}`,
      data: enrichItem(result),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/items/:id/snooze — Snooze alerts for this item
router.post('/:id/snooze', (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id) as ItemRow | undefined;
    if (!existing) {
      res.status(404).json({ success: false, error: 'Item not found' });
      return;
    }

    const days = Number(req.body.days) || 7;
    const now = new Date().toISOString();

    db.prepare("UPDATE items SET status = 'snoozed', updated_at = ? WHERE id = ?").run(now, req.params.id);
    logActivity(String(req.params.id), 'item_snoozed', { snooze_days: days }, 'user');

    const result = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id) as ItemRow;
    res.json({
      success: true,
      message: `Item snoozed for ${days} days`,
      data: enrichItem(result),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
