import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import { ItemRow } from '../types';
import { logActivity } from '../services/activityService';

const router = Router();

// GET /api/v1/import-export/export?format=csv|json
router.get('/export', (req: Request, res: Response, next: NextFunction) => {
  try {
    const format = req.query.format === 'csv' ? 'csv' : 'json';

    const items = db.prepare(`
      SELECT 
        i.*,
        c.name as category_name
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      ORDER BY i.expiry_date ASC
    `).all() as any[];

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="vigil-export.json"');
      res.send(JSON.stringify(items, null, 2));
      return;
    }

    // CSV format
    const headers = [
      'Name',
      'Category',
      'Status',
      'Start Date',
      'Expiry Date',
      'Renewal Date',
      'Cost',
      'Currency',
      'Recurrence',
      'Risk Level',
      'Responsible Person',
      'Responsible Email',
      'Vendor',
      'Notes',
    ];

    const escapeCsv = (str: any) => {
      if (str === null || str === undefined) return '';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const lines = [
      headers.join(','),
      ...items.map(i => [
        escapeCsv(i.name),
        escapeCsv(i.category_name),
        escapeCsv(i.status),
        escapeCsv(i.start_date),
        escapeCsv(i.expiry_date),
        escapeCsv(i.renewal_date),
        escapeCsv(i.cost),
        escapeCsv(i.currency),
        escapeCsv(i.recurrence),
        escapeCsv(i.risk_level),
        escapeCsv(i.responsible_person),
        escapeCsv(i.responsible_email),
        escapeCsv(i.vendor),
        escapeCsv(i.notes),
      ].join(',')),
    ];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="vigil-export.csv"');
    res.send(lines.join('\n'));
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/import-export/import - accept JSON items array
router.post('/import', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { items: incomingItems } = req.body;

    if (!Array.isArray(incomingItems) || incomingItems.length === 0) {
      res.status(400).json({ success: false, error: 'Please provide an array of items in the request body under "items"' });
      return;
    }

    const categories = db.prepare('SELECT id, name FROM categories').all() as { id: string; name: string }[];
    const catMap = new Map<string, string>();
    for (const c of categories) {
      catMap.set(c.name.toLowerCase(), c.id);
    }

    const now = new Date().toISOString();
    let importedCount = 0;

    const insertStmt = db.prepare(`
      INSERT INTO items (
        id, name, description, category_id, status, start_date, expiry_date,
        renewal_date, cost, currency, recurrence, risk_level, responsible_person,
        responsible_email, vendor, notes, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction((rows: any[]) => {
      for (const item of rows) {
        if (!item.name || !item.expiry_date) continue;

        let categoryId: string | null = null;
        if (item.category_id) {
          categoryId = item.category_id;
        } else if (item.category_name) {
          categoryId = catMap.get(item.category_name.toLowerCase()) || null;
        }

        insertStmt.run(
          uuidv4(),
          item.name,
          item.description ?? null,
          categoryId,
          item.status ?? 'active',
          item.start_date ?? null,
          item.expiry_date,
          item.renewal_date ?? null,
          Number(item.cost) || null,
          item.currency ?? 'USD',
          item.recurrence ?? 'none',
          item.risk_level ?? 'medium',
          item.responsible_person ?? null,
          item.responsible_email ?? null,
          item.vendor ?? null,
          item.notes ?? null,
          now,
          now
        );
        importedCount++;
      }
    });

    transaction(incomingItems);
    logActivity(null, 'items_imported', { count: importedCount }, 'user');

    res.json({ success: true, message: `Successfully imported ${importedCount} items`, importedCount });
  } catch (err) {
    next(err);
  }
});

export default router;
