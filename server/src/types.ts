import { z } from 'zod';

// ─── Database Row Types ───────────────────────────────────────────────

export interface ItemRow {
  id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  status: string;
  start_date: string | null;
  expiry_date: string;
  renewal_date: string | null;
  cost: number | null;
  currency: string;
  recurrence: string;
  recurrence_days: number | null;
  risk_level: string;
  responsible_person: string | null;
  responsible_email: string | null;
  vendor: string | null;
  vendor_contact: string | null;
  notes: string | null;
  tags: string | null;
  custom_fields: string | null;
  created_at: string;
  updated_at: string;
}

export interface CategoryRow {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  description: string | null;
  default_risk_level: string;
  created_at: string;
}

export interface DocumentRow {
  id: string;
  item_id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  uploaded_at: string;
}

export interface AlertRow {
  id: string;
  item_id: string;
  alert_type: string;
  days_before: number;
  is_sent: number;
  sent_at: string | null;
  created_at: string;
}

export interface AlertRuleRow {
  id: string;
  name: string;
  category_id: string | null;
  days_before: string;
  channels: string;
  is_active: number;
  created_at: string;
}

export interface ActivityLogRow {
  id: string;
  item_id: string | null;
  action: string;
  details: string | null;
  actor: string | null;
  created_at: string;
}

export interface SettingRow {
  key: string;
  value: string;
  updated_at: string;
}

export interface TagRow {
  id: string;
  name: string;
  color: string | null;
}

// ─── API Response Types ───────────────────────────────────────────────

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DashboardData {
  totalItems: number;
  activeItems: number;
  expiredItems: number;
  expiringSoon7: number;
  expiringSoon30: number;
  expiringSoon90: number;
  byCategory: { name: string; count: number; color: string | null }[];
  byRiskLevel: { level: string; count: number }[];
  monthlyCost: number;
  upcomingTimeline: {
    id: string;
    name: string;
    expiry_date: string;
    days_until: number;
    risk_level: string;
    category: string | null;
  }[];
  recentActivity: ActivityLogRow[];
}

export interface ItemWithComputed extends ItemRow {
  days_until_expiry: number;
  risk_score: number;
  category_name?: string | null;
  category_color?: string | null;
}

// ─── Zod Schemas ──────────────────────────────────────────────────────

export const CreateItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
  category_id: z.string().optional().nullable(),
  status: z.enum(['active', 'expired', 'archived', 'snoozed']).optional().default('active'),
  start_date: z.string().optional().nullable(),
  expiry_date: z.string().min(1, 'Expiry date is required'),
  renewal_date: z.string().optional().nullable(),
  cost: z.number().optional().nullable(),
  currency: z.string().optional().default('USD'),
  recurrence: z.enum(['none', 'monthly', 'quarterly', 'semi_annual', 'annual', 'biennial', 'custom']).optional().default('none'),
  recurrence_days: z.number().int().optional().nullable(),
  risk_level: z.enum(['critical', 'high', 'medium', 'low']).optional().default('medium'),
  responsible_person: z.string().optional().nullable(),
  responsible_email: z.string().email().optional().nullable().or(z.literal('')),
  vendor: z.string().optional().nullable(),
  vendor_contact: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  custom_fields: z.record(z.any()).optional().nullable(),
});

export const UpdateItemSchema = CreateItemSchema.partial();

export const StatusUpdateSchema = z.object({
  status: z.enum(['active', 'expired', 'archived', 'snoozed']),
});

export const BulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1, 'At least one ID required'),
});

export const BulkStatusUpdateSchema = z.object({
  ids: z.array(z.string()).min(1, 'At least one ID required'),
  status: z.enum(['active', 'expired', 'archived', 'snoozed']),
});

export const CreateCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  icon: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  default_risk_level: z.enum(['critical', 'high', 'medium', 'low']).optional().default('medium'),
});

export const UpdateCategorySchema = CreateCategorySchema.partial();

export const CreateAlertRuleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category_id: z.string().optional().nullable(),
  days_before: z.array(z.number().int()).min(1),
  channels: z.array(z.string()).min(1),
  is_active: z.boolean().optional().default(true),
});

export const UpdateAlertRuleSchema = CreateAlertRuleSchema.partial();

export const CreateTagSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  color: z.string().optional().nullable(),
});

export const UpdateTagSchema = CreateTagSchema.partial();

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const ItemFilterSchema = z.object({
  category: z.string().optional(),
  status: z.string().optional(),
  risk_level: z.string().optional(),
  tags: z.string().optional(),
  expiry_from: z.string().optional(),
  expiry_to: z.string().optional(),
  sort: z.string().optional().default('expiry_date'),
  order: z.enum(['asc', 'desc']).optional().default('asc'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});
