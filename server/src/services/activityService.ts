import { v4 as uuidv4 } from 'uuid';
import db from '../database';

export function logActivity(
  itemId: string | null,
  action: string,
  details: Record<string, any> | null,
  actor: string = 'system'
): void {
  const stmt = db.prepare(`
    INSERT INTO activity_log (id, item_id, action, details, actor, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(uuidv4(), itemId, action, details ? JSON.stringify(details) : null, actor, new Date().toISOString());
}

export function getRecentActivity(limit: number = 20): any[] {
  return db.prepare(`
    SELECT al.*, i.name as item_name
    FROM activity_log al
    LEFT JOIN items i ON al.item_id = i.id
    ORDER BY al.created_at DESC
    LIMIT ?
  `).all(limit);
}
