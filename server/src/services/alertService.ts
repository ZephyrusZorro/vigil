import db from '../database';
import { v4 as uuidv4 } from 'uuid';
import { AlertRow } from '../types';

/**
 * Generate pending alerts based on active alert rules.
 * Returns alerts that haven't been sent yet.
 */
export function getPendingAlerts(): any[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rules = db.prepare(`
    SELECT * FROM alert_rules WHERE is_active = 1
  `).all() as any[];

  const pendingAlerts: any[] = [];

  for (const rule of rules) {
    const daysBefore: number[] = JSON.parse(rule.days_before);
    const channels: string[] = JSON.parse(rule.channels);

    // Build query based on whether rule is category-specific
    let query = `
      SELECT i.*, c.name as category_name
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      WHERE i.status = 'active'
    `;
    const params: any[] = [];

    if (rule.category_id) {
      query += ' AND i.category_id = ?';
      params.push(rule.category_id);
    }

    const items = db.prepare(query).all(...params) as any[];

    for (const item of items) {
      const expiryDate = new Date(item.expiry_date);
      expiryDate.setHours(0, 0, 0, 0);
      const daysUntil = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      for (const threshold of daysBefore) {
        if (daysUntil <= threshold && daysUntil >= 0) {
          // Check if this alert was already created
          const existing = db.prepare(`
            SELECT id FROM alerts
            WHERE item_id = ? AND days_before = ? AND alert_type = ?
          `).get(item.id, threshold, rule.name) as AlertRow | undefined;

          if (!existing) {
            const alertId = uuidv4();
            db.prepare(`
              INSERT INTO alerts (id, item_id, alert_type, days_before, is_sent, created_at)
              VALUES (?, ?, ?, ?, 0, ?)
            `).run(alertId, item.id, rule.name, threshold, new Date().toISOString());

            pendingAlerts.push({
              id: alertId,
              item_id: item.id,
              item_name: item.name,
              category_name: item.category_name,
              expiry_date: item.expiry_date,
              days_until: daysUntil,
              alert_type: rule.name,
              days_before: threshold,
              channels,
              is_sent: false,
            });
          }
        }
      }
    }
  }

  // Also return existing unsent alerts
  const unsent = db.prepare(`
    SELECT a.*, i.name as item_name, c.name as category_name, i.expiry_date
    FROM alerts a
    JOIN items i ON a.item_id = i.id
    LEFT JOIN categories c ON i.category_id = c.id
    WHERE a.is_sent = 0
    ORDER BY a.created_at DESC
  `).all();

  return unsent;
}
