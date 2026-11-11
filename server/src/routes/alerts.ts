import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';
import { CreateAlertRuleSchema, UpdateAlertRuleSchema, AlertRuleRow } from '../types';
import { getPendingAlerts } from '../services/alertService';
import { logActivity } from '../services/activityService';

const router = Router();

// GET /api/v1/alerts/rules - list all alert rules
router.get('/rules', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const rules = db.prepare(`
      SELECT ar.*, c.name as category_name
      FROM alert_rules ar
      LEFT JOIN categories c ON ar.category_id = c.id
      ORDER BY ar.created_at DESC
    `).all() as any[];

    const data = rules.map(r => ({
      ...r,
      days_before: JSON.parse(r.days_before),
      channels: JSON.parse(r.channels),
      is_active: Boolean(r.is_active),
    }));

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/alerts/rules - create alert rule
router.post('/rules', (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = CreateAlertRuleSchema.parse(req.body);
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO alert_rules (id, name, category_id, days_before, channels, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      body.name,
      body.category_id ?? null,
      JSON.stringify(body.days_before),
      JSON.stringify(body.channels),
      body.is_active ? 1 : 0,
      now
    );

    logActivity(null, 'alert_rule_created', { id, name: body.name }, 'user');

    const created = db.prepare(`
      SELECT ar.*, c.name as category_name
      FROM alert_rules ar
      LEFT JOIN categories c ON ar.category_id = c.id
      WHERE ar.id = ?
    `).get(id) as any;

    res.status(201).json({
      success: true,
      data: {
        ...created,
        days_before: JSON.parse(created.days_before),
        channels: JSON.parse(created.channels),
        is_active: Boolean(created.is_active),
      },
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/alerts/rules/:id
router.put('/rules/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = db.prepare('SELECT * FROM alert_rules WHERE id = ?').get(req.params.id) as AlertRuleRow | undefined;
    if (!existing) {
      res.status(404).json({ success: false, error: 'Alert rule not found' });
      return;
    }

    const body = UpdateAlertRuleSchema.parse(req.body);

    const updated = {
      name: body.name ?? existing.name,
      category_id: body.category_id !== undefined ? body.category_id : existing.category_id,
      days_before: body.days_before !== undefined ? JSON.stringify(body.days_before) : existing.days_before,
      channels: body.channels !== undefined ? JSON.stringify(body.channels) : existing.channels,
      is_active: body.is_active !== undefined ? (body.is_active ? 1 : 0) : existing.is_active,
    };

    db.prepare(`
      UPDATE alert_rules SET
        name = ?, category_id = ?, days_before = ?, channels = ?, is_active = ?
      WHERE id = ?
    `).run(
      updated.name,
      updated.category_id,
      updated.days_before,
      updated.channels,
      updated.is_active,
      req.params.id
    );

    const result = db.prepare(`
      SELECT ar.*, c.name as category_name
      FROM alert_rules ar
      LEFT JOIN categories c ON ar.category_id = c.id
      WHERE ar.id = ?
    `).get(req.params.id) as any;

    res.json({
      success: true,
      data: {
        ...result,
        days_before: JSON.parse(result.days_before),
        channels: JSON.parse(result.channels),
        is_active: Boolean(result.is_active),
      },
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/alerts/rules/:id
router.delete('/rules/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = db.prepare('SELECT * FROM alert_rules WHERE id = ?').get(req.params.id) as AlertRuleRow | undefined;
    if (!existing) {
      res.status(404).json({ success: false, error: 'Alert rule not found' });
      return;
    }

    db.prepare('DELETE FROM alert_rules WHERE id = ?').run(req.params.id);
    logActivity(null, 'alert_rule_deleted', { id: req.params.id, name: existing.name }, 'user');

    res.json({ success: true, data: { id: req.params.id, deleted: true } });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/alerts/pending
router.get('/pending', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const alerts = getPendingAlerts();
    res.json({ success: true, data: alerts });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/alerts/dismiss/:id
router.post('/dismiss/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date().toISOString();
    db.prepare('UPDATE alerts SET is_sent = 1, sent_at = ? WHERE id = ?').run(now, req.params.id);
    res.json({ success: true, data: { id: req.params.id, dismissed: true } });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/alerts/test
router.post('/test', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const alerts = getPendingAlerts();
    logActivity(null, 'test_alerts_run', { detected_count: alerts.length }, 'user');
    res.json({ success: true, message: `Processed alerts. Found ${alerts.length} pending alert(s).`, data: alerts });
  } catch (err) {
    next(err);
  }
});

export default router;
