import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const DATA_DIR = path.resolve(__dirname, '../../data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const DB_PATH = path.join(DATA_DIR, 'vigil.db');

// Ensure directories exist
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Initialize native SQLite database
const nativeDb = new DatabaseSync(DB_PATH);

// Pragmas for performance and data integrity
nativeDb.exec('PRAGMA journal_mode = WAL;');
nativeDb.exec('PRAGMA foreign_keys = ON;');
nativeDb.exec('PRAGMA busy_timeout = 5000;');

export interface DBWrapper {
  exec: (sql: string) => void;
  prepare: (sql: string) => any;
  transaction: <T extends (...args: any[]) => any>(fn: T) => T;
}

export const db: DBWrapper = {
  exec: (sql: string) => nativeDb.exec(sql),
  prepare: (sql: string) => nativeDb.prepare(sql),
  transaction: <T extends (...args: any[]) => any>(fn: T): T => {
    return ((...args: any[]) => {
      nativeDb.exec('BEGIN TRANSACTION');
      try {
        const result = fn(...args);
        nativeDb.exec('COMMIT');
        return result;
      } catch (err) {
        nativeDb.exec('ROLLBACK');
        throw err;
      }
    }) as T;
  },
};

export function initializeDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT,
      color TEXT,
      description TEXT,
      default_risk_level TEXT DEFAULT 'medium',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      category_id TEXT,
      status TEXT DEFAULT 'active',
      start_date TEXT,
      expiry_date TEXT NOT NULL,
      renewal_date TEXT,
      cost REAL,
      currency TEXT DEFAULT 'USD',
      recurrence TEXT DEFAULT 'none',
      recurrence_days INTEGER,
      risk_level TEXT DEFAULT 'medium',
      responsible_person TEXT,
      responsible_email TEXT,
      vendor TEXT,
      vendor_contact TEXT,
      notes TEXT,
      tags TEXT,
      custom_fields TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      item_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      uploaded_at TEXT NOT NULL,
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      item_id TEXT NOT NULL,
      alert_type TEXT NOT NULL,
      days_before INTEGER NOT NULL,
      is_sent INTEGER DEFAULT 0,
      sent_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS alert_rules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category_id TEXT,
      days_before TEXT NOT NULL,
      channels TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id TEXT PRIMARY KEY,
      item_id TEXT,
      action TEXT NOT NULL,
      details TEXT,
      actor TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      color TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
    CREATE INDEX IF NOT EXISTS idx_items_expiry_date ON items(expiry_date);
    CREATE INDEX IF NOT EXISTS idx_items_category_id ON items(category_id);
    CREATE INDEX IF NOT EXISTS idx_items_risk_level ON items(risk_level);
    CREATE INDEX IF NOT EXISTS idx_documents_item_id ON documents(item_id);
    CREATE INDEX IF NOT EXISTS idx_alerts_item_id ON alerts(item_id);
    CREATE INDEX IF NOT EXISTS idx_activity_log_item_id ON activity_log(item_id);
    CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at);
  `);
}

export function seedDatabase(): void {
  const itemCount = db.prepare('SELECT COUNT(*) as count FROM items').get() as { count: number };
  if (itemCount.count > 0) {
    console.log('[DB] Database already seeded, skipping.');
    return;
  }

  console.log('[DB] Seeding database with demo data...');
  const now = new Date().toISOString();
  const today = new Date();

  function daysFromNow(days: number): string {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }

  // ─── Seed Categories ───
  const categories = [
    { id: uuidv4(), name: 'Business Licenses', icon: '📋', color: '#4F46E5', description: 'Government and municipal business licenses', default_risk_level: 'high' },
    { id: uuidv4(), name: 'Insurance Policies', icon: '🛡️', color: '#059669', description: 'Business insurance policies', default_risk_level: 'critical' },
    { id: uuidv4(), name: 'Vendor Contracts', icon: '🤝', color: '#D97706', description: 'Vendor and supplier agreements', default_risk_level: 'medium' },
    { id: uuidv4(), name: 'Employee Certifications', icon: '🎓', color: '#7C3AED', description: 'Employee licenses and certifications', default_risk_level: 'high' },
    { id: uuidv4(), name: 'Digital Assets', icon: '🌐', color: '#2563EB', description: 'Domains, SSL certs, digital properties', default_risk_level: 'medium' },
    { id: uuidv4(), name: 'SaaS Subscriptions', icon: '☁️', color: '#EC4899', description: 'Software subscriptions', default_risk_level: 'low' },
    { id: uuidv4(), name: 'Facility & Property', icon: '🏢', color: '#14B8A6', description: 'Leases, permits, property-related items', default_risk_level: 'high' },
    { id: uuidv4(), name: 'Vehicles & Equipment', icon: '🚛', color: '#F97316', description: 'Vehicle registrations, equipment warranties', default_risk_level: 'medium' },
    { id: uuidv4(), name: 'Regulatory Filings', icon: '⚖️', color: '#DC2626', description: 'Regulatory and compliance filings', default_risk_level: 'critical' },
  ];

  const insertCategory = db.prepare(`
    INSERT INTO categories (id, name, icon, color, description, default_risk_level, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const cat of categories) {
    insertCategory.run(cat.id, cat.name, cat.icon, cat.color, cat.description, cat.default_risk_level, now);
  }

  const catByName = (name: string) => categories.find(c => c.name === name)!.id;

  // ─── Seed Tags ───
  const seedTags = [
    { id: uuidv4(), name: 'urgent', color: '#EF4444' },
    { id: uuidv4(), name: 'auto-renew', color: '#10B981' },
    { id: uuidv4(), name: 'needs-review', color: '#F59E0B' },
    { id: uuidv4(), name: 'compliance', color: '#6366F1' },
    { id: uuidv4(), name: 'cost-center', color: '#8B5CF6' },
    { id: uuidv4(), name: 'mission-critical', color: '#DC2626' },
  ];

  const insertTag = db.prepare('INSERT INTO tags (id, name, color) VALUES (?, ?, ?)');
  for (const tag of seedTags) {
    insertTag.run(tag.id, tag.name, tag.color);
  }

  // ─── Seed Items ───
  const items = [
    {
      name: 'Business Operating License',
      description: 'Annual business operating license for Austin, TX location',
      category_id: catByName('Business Licenses'),
      status: 'active',
      start_date: daysFromNow(-320),
      expiry_date: daysFromNow(45),
      cost: 750,
      currency: 'USD',
      recurrence: 'annual',
      risk_level: 'high',
      responsible_person: 'David Park',
      responsible_email: 'david.park@company.com',
      vendor: 'City of Austin',
      vendor_contact: 'licensing@austintexas.gov',
      notes: 'Must be renewed in-person at city hall. Bring current insurance certificate.',
      tags: JSON.stringify(['compliance']),
    },
    {
      name: 'General Liability Insurance',
      description: 'Commercial general liability insurance policy - $2M aggregate',
      category_id: catByName('Insurance Policies'),
      status: 'active',
      start_date: daysFromNow(-353),
      expiry_date: daysFromNow(12),
      cost: 4200,
      currency: 'USD',
      recurrence: 'annual',
      risk_level: 'critical',
      responsible_person: 'Lisa Wong',
      responsible_email: 'lisa.wong@company.com',
      vendor: 'Travelers Insurance',
      vendor_contact: 'agent@travelers.com',
      notes: 'Renewal quote expected 30 days before expiry. Compare with Hartford.',
      tags: JSON.stringify(['urgent', 'mission-critical']),
    },
    {
      name: 'AWS Cloud Services Agreement',
      description: 'Enterprise agreement for AWS cloud infrastructure services',
      category_id: catByName('Vendor Contracts'),
      status: 'active',
      start_date: daysFromNow(-185),
      expiry_date: daysFromNow(180),
      cost: 890,
      currency: 'USD',
      recurrence: 'monthly',
      risk_level: 'high',
      responsible_person: 'James Chen',
      responsible_email: 'james.chen@company.com',
      vendor: 'Amazon Web Services',
      vendor_contact: 'enterprise-support@aws.amazon.com',
      notes: 'Negotiate reserved instance pricing at renewal. Current spend trending up.',
      tags: JSON.stringify(['cost-center', 'mission-critical']),
    },
    {
      name: 'Office Lease - Suite 200',
      description: 'Commercial office lease for headquarters, 5,000 sqft',
      category_id: catByName('Facility & Property'),
      status: 'active',
      start_date: daysFromNow(-275),
      expiry_date: daysFromNow(90),
      cost: 3500,
      currency: 'USD',
      recurrence: 'monthly',
      risk_level: 'high',
      responsible_person: 'Maria Gonzalez',
      responsible_email: 'maria.gonzalez@company.com',
      vendor: 'Pinnacle Property Group',
      vendor_contact: 'leasing@pinnaclepg.com',
      notes: '90-day notice required for non-renewal. Consider expansion options.',
      tags: JSON.stringify(['cost-center']),
    },
    {
      name: 'SSL Certificate - api.example.com',
      description: 'TLS/SSL certificate for production API endpoint',
      category_id: catByName('Digital Assets'),
      status: 'expired',
      start_date: daysFromNow(-370),
      expiry_date: daysFromNow(-5),
      cost: 0,
      currency: 'USD',
      recurrence: 'annual',
      risk_level: 'critical',
      responsible_person: 'Kevin Torres',
      responsible_email: 'kevin.torres@company.com',
      vendor: "Let's Encrypt",
      vendor_contact: null,
      notes: 'URGENT: Certificate has expired! Auto-renewal via certbot failed. Check cron job.',
      tags: JSON.stringify(['urgent', 'mission-critical']),
    },
    {
      name: 'John Smith - OSHA Safety Certification',
      description: 'OSHA 30-Hour General Industry Safety certification',
      category_id: catByName('Employee Certifications'),
      status: 'active',
      start_date: daysFromNow(-357),
      expiry_date: daysFromNow(8),
      cost: 350,
      currency: 'USD',
      recurrence: 'annual',
      risk_level: 'high',
      responsible_person: 'John Smith',
      responsible_email: 'john.smith@company.com',
      vendor: 'OSHA Training Institute',
      vendor_contact: 'training@osha.gov',
      notes: 'Online refresher course available. Must complete before expiry to avoid work stoppage.',
      tags: JSON.stringify(['compliance', 'urgent']),
    },
    {
      name: 'quickbooks.com domain',
      description: 'Primary domain name registration',
      category_id: catByName('Digital Assets'),
      status: 'active',
      start_date: daysFromNow(-25),
      expiry_date: daysFromNow(340),
      cost: 15,
      currency: 'USD',
      recurrence: 'annual',
      risk_level: 'low',
      responsible_person: 'Kevin Torres',
      responsible_email: 'kevin.torres@company.com',
      vendor: 'GoDaddy',
      vendor_contact: 'support@godaddy.com',
      notes: 'Auto-renewal enabled. Verify WHOIS privacy is active.',
      tags: JSON.stringify(['auto-renew']),
    },
    {
      name: 'Adobe Creative Cloud',
      description: 'Adobe CC All Apps subscription for design team (5 seats)',
      category_id: catByName('SaaS Subscriptions'),
      status: 'active',
      start_date: daysFromNow(-340),
      expiry_date: daysFromNow(25),
      cost: 55,
      currency: 'USD',
      recurrence: 'monthly',
      risk_level: 'medium',
      responsible_person: 'Sarah Kim',
      responsible_email: 'sarah.kim@company.com',
      vendor: 'Adobe Inc.',
      vendor_contact: 'enterprise@adobe.com',
      notes: 'Review seat usage before renewal. Consider downgrading unused licenses.',
      tags: JSON.stringify(['cost-center', 'needs-review']),
    },
    {
      name: 'Forklift Operator License - Mike Johnson',
      description: 'OSHA-compliant forklift operator certification',
      category_id: catByName('Employee Certifications'),
      status: 'active',
      start_date: daysFromNow(-362),
      expiry_date: daysFromNow(3),
      cost: 200,
      currency: 'USD',
      recurrence: 'annual',
      risk_level: 'critical',
      responsible_person: 'Mike Johnson',
      responsible_email: 'mike.johnson@company.com',
      vendor: 'National Safety Council',
      vendor_contact: 'training@nsc.org',
      notes: 'CRITICAL: Cannot operate forklift without valid license. Schedule renewal training ASAP.',
      tags: JSON.stringify(['urgent', 'compliance', 'mission-critical']),
    },
    {
      name: 'Building Fire Safety Permit',
      description: 'Annual fire safety inspection and operating permit',
      category_id: catByName('Regulatory Filings'),
      status: 'active',
      start_date: daysFromNow(-305),
      expiry_date: daysFromNow(60),
      cost: 500,
      currency: 'USD',
      recurrence: 'annual',
      risk_level: 'high',
      responsible_person: 'David Park',
      responsible_email: 'david.park@company.com',
      vendor: 'Austin Fire Department',
      vendor_contact: 'fireprevention@austintexas.gov',
      notes: 'Inspection required before renewal. Schedule 30 days in advance.',
      tags: JSON.stringify(['compliance']),
    },
    {
      name: 'Vehicle Registration - Company Van',
      description: '2022 Ford Transit cargo van - TX plate ABC-1234',
      category_id: catByName('Vehicles & Equipment'),
      status: 'active',
      start_date: daysFromNow(-350),
      expiry_date: daysFromNow(15),
      cost: 120,
      currency: 'USD',
      recurrence: 'annual',
      risk_level: 'medium',
      responsible_person: 'Mike Johnson',
      responsible_email: 'mike.johnson@company.com',
      vendor: 'Texas DMV',
      vendor_contact: null,
      notes: 'Emissions test required before renewal. Online renewal available at txdmv.gov.',
      tags: JSON.stringify(['compliance']),
    },
    {
      name: 'Workers Compensation Insurance',
      description: 'Workers compensation insurance policy for all employees',
      category_id: catByName('Insurance Policies'),
      status: 'active',
      start_date: daysFromNow(-165),
      expiry_date: daysFromNow(200),
      cost: 6800,
      currency: 'USD',
      recurrence: 'annual',
      risk_level: 'critical',
      responsible_person: 'Lisa Wong',
      responsible_email: 'lisa.wong@company.com',
      vendor: 'State Farm',
      vendor_contact: 'commercial@statefarm.com',
      notes: 'Review experience modification rate at renewal. Current EMR: 0.92.',
      tags: JSON.stringify(['compliance', 'mission-critical']),
    },
    {
      name: 'Google Workspace Subscription',
      description: 'Google Workspace Business Standard - 25 users',
      category_id: catByName('SaaS Subscriptions'),
      status: 'active',
      start_date: daysFromNow(0),
      expiry_date: daysFromNow(365),
      cost: 14,
      currency: 'USD',
      recurrence: 'monthly',
      risk_level: 'low',
      responsible_person: 'Kevin Torres',
      responsible_email: 'kevin.torres@company.com',
      vendor: 'Google',
      vendor_contact: 'workspace-support@google.com',
      notes: 'Annual commitment. Auto-renews. Review user count quarterly.',
      tags: JSON.stringify(['auto-renew', 'cost-center']),
    },
    {
      name: 'Vendor NDA - Acme Corp',
      description: 'Mutual non-disclosure agreement with Acme Corporation',
      category_id: catByName('Vendor Contracts'),
      status: 'expired',
      start_date: daysFromNow(-385),
      expiry_date: daysFromNow(-20),
      cost: null,
      currency: 'USD',
      recurrence: 'annual',
      risk_level: 'medium',
      responsible_person: 'Maria Gonzalez',
      responsible_email: 'maria.gonzalez@company.com',
      vendor: 'Acme Corporation',
      vendor_contact: 'legal@acmecorp.com',
      notes: 'NDA expired. Halt any confidential information sharing until renewed.',
      tags: JSON.stringify(['needs-review']),
    },
    {
      name: 'Health Department Food License',
      description: 'Food handling and preparation license for office cafeteria',
      category_id: catByName('Business Licenses'),
      status: 'active',
      start_date: daysFromNow(-335),
      expiry_date: daysFromNow(30),
      cost: 350,
      currency: 'USD',
      recurrence: 'annual',
      risk_level: 'high',
      responsible_person: 'David Park',
      responsible_email: 'david.park@company.com',
      vendor: 'Austin Public Health',
      vendor_contact: 'foodsafety@austintexas.gov',
      notes: 'Health inspection scheduled 2 weeks before expiry. Ensure kitchen compliance.',
      tags: JSON.stringify(['compliance']),
    },
    {
      name: 'Professional Engineer License - Sarah Chen',
      description: 'Texas Professional Engineer (PE) license',
      category_id: catByName('Employee Certifications'),
      status: 'active',
      start_date: daysFromNow(-290),
      expiry_date: daysFromNow(75),
      cost: 300,
      currency: 'USD',
      recurrence: 'annual',
      risk_level: 'high',
      responsible_person: 'Sarah Chen',
      responsible_email: 'sarah.chen@company.com',
      vendor: 'Texas Board of Professional Engineers',
      vendor_contact: 'licensing@engineers.texas.gov',
      notes: 'Requires 15 PDH credits for renewal. Currently has 10 credits completed.',
      tags: JSON.stringify(['compliance']),
    },
    {
      name: 'Cybersecurity Insurance',
      description: 'Cyber liability insurance with $5M coverage',
      category_id: catByName('Insurance Policies'),
      status: 'active',
      start_date: daysFromNow(-215),
      expiry_date: daysFromNow(150),
      cost: 3200,
      currency: 'USD',
      recurrence: 'annual',
      risk_level: 'high',
      responsible_person: 'Lisa Wong',
      responsible_email: 'lisa.wong@company.com',
      vendor: 'Coalition Insurance',
      vendor_contact: 'underwriting@coalitioninc.com',
      notes: 'Premium likely to increase. Complete security questionnaire 60 days before renewal.',
      tags: JSON.stringify(['mission-critical']),
    },
    {
      name: 'Equipment Warranty - CNC Machine',
      description: 'Extended warranty for Haas VF-2 CNC milling machine',
      category_id: catByName('Vehicles & Equipment'),
      status: 'active',
      start_date: daysFromNow(-360),
      expiry_date: daysFromNow(5),
      cost: 45000,
      currency: 'USD',
      recurrence: 'none',
      risk_level: 'high',
      responsible_person: 'Mike Johnson',
      responsible_email: 'mike.johnson@company.com',
      vendor: 'Haas Automation',
      vendor_contact: 'warranty@haascnc.com',
      notes: 'Machine value: $45,000. Extended warranty renewal quote: $2,800/yr. Get quote before expiry.',
      tags: JSON.stringify(['urgent', 'cost-center']),
    },
  ];

  const insertItem = db.prepare(`
    INSERT INTO items (id, name, description, category_id, status, start_date, expiry_date, renewal_date, cost, currency, recurrence, recurrence_days, risk_level, responsible_person, responsible_email, vendor, vendor_contact, notes, tags, custom_fields, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const item of items) {
    insertItem.run(
      uuidv4(),
      item.name,
      item.description,
      item.category_id,
      item.status,
      item.start_date,
      item.expiry_date,
      null,
      item.cost,
      item.currency,
      item.recurrence,
      null,
      item.risk_level,
      item.responsible_person,
      item.responsible_email,
      item.vendor,
      item.vendor_contact ?? null,
      item.notes,
      item.tags,
      null,
      now,
      now
    );
  }

  // ─── Seed Alert Rules ───
  const insertAlertRule = db.prepare(`
    INSERT INTO alert_rules (id, name, category_id, days_before, channels, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertAlertRule.run(uuidv4(), 'Critical Expiry Warning', null, JSON.stringify([7, 3, 1]), JSON.stringify(['email', 'dashboard']), 1, now);
  insertAlertRule.run(uuidv4(), 'Standard Renewal Reminder', null, JSON.stringify([90, 60, 30]), JSON.stringify(['email']), 1, now);
  insertAlertRule.run(uuidv4(), 'Insurance Policy Alert', catByName('Insurance Policies'), JSON.stringify([60, 30, 14, 7]), JSON.stringify(['email', 'sms', 'dashboard']), 1, now);
  insertAlertRule.run(uuidv4(), 'License Expiry Alert', catByName('Business Licenses'), JSON.stringify([30, 14, 7, 3]), JSON.stringify(['email', 'dashboard']), 1, now);

  // ─── Seed Activity Log ───
  const insertActivity = db.prepare(`
    INSERT INTO activity_log (id, item_id, action, details, actor, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertActivity.run(uuidv4(), null, 'system_initialized', JSON.stringify({ message: 'Vigil system initialized with demo data' }), 'system', now);

  // ─── Seed Settings ───
  const insertSetting = db.prepare('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)');
  insertSetting.run('app_name', 'Vigil', now);
  insertSetting.run('timezone', 'America/Chicago', now);
  insertSetting.run('email_notifications', 'true', now);
  insertSetting.run('auto_expire_check_interval', '3600', now);

  console.log(`[DB] Seeded ${items.length} items, ${categories.length} categories, ${seedTags.length} tags, 4 alert rules.`);
}

export function getDb(): DBWrapper {
  return db;
}

export function getUploadsDir(): string {
  return UPLOADS_DIR;
}

export default db;
