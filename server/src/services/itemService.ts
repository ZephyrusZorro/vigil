import db from '../database';
import { logActivity } from './activityService';

/**
 * Checks all active items and marks them as expired if expiry_date < today.
 */
export function checkAndExpireItems(): number {
  const now = new Date().toISOString().split('T')[0];
  const result = db.prepare(`
    UPDATE items SET status = 'expired', updated_at = ?
    WHERE status = 'active' AND expiry_date < ?
  `).run(new Date().toISOString(), now);

  if (result.changes > 0) {
    console.log(`[Expiry Check] Marked ${result.changes} item(s) as expired.`);
    logActivity(null, 'auto_expire_check', { expired_count: result.changes }, 'system');
  }
  return result.changes;
}

/**
 * Start the periodic expiry check (every hour).
 */
export function startExpiryChecker(): NodeJS.Timeout {
  // Check immediately on startup
  checkAndExpireItems();
  // Then every hour
  return setInterval(checkAndExpireItems, 60 * 60 * 1000);
}
