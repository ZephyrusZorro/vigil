// ── Types for the Vigil Deadline & Compliance Intelligence Platform ──

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low';
export type ItemStatus = 'active' | 'expired' | 'archived' | 'snoozed';
export type RecurrenceType = 'none' | 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'custom';

export interface Item {
  id: string;
  name: string;
  description?: string | null;
  category_id?: string | null;
  category_name?: string | null;
  category_color?: string | null;
  category_icon?: string | null;
  vendor?: string | null;
  vendor_contact?: string | null;
  start_date?: string | null;
  expiry_date: string;
  renewal_date?: string | null;
  cost?: number | null;
  currency: string;
  recurrence?: RecurrenceType | string | null;
  responsible_person?: string | null;
  responsible_email?: string | null;
  risk_level: RiskLevel;
  risk_score: number;
  status: ItemStatus;
  notes?: string | null;
  days_until_expiry: number;
  days_left?: number;
  tags?: string[] | null;
  documents?: Document[];
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string | null;
  color: string;
  description?: string | null;
  default_risk_level?: RiskLevel;
  item_count?: number;
  active_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  name: string;
  item_count?: number;
}

export interface Document {
  id: string;
  item_id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
}

export interface AlertRule {
  id: string;
  name: string;
  category_id?: string | null;
  category_name?: string | null;
  days_before: number[];
  channels: string[];
  is_active: boolean | number;
  created_at: string;
  updated_at: string;
}

export interface ActivityEntry {
  id: string;
  item_id?: string | null;
  item_name?: string | null;
  action: string;
  details?: any;
  actor?: string | null;
  created_at: string;
}

export interface DashboardStats {
  totalItems: number;
  expiringSoon30: number;
  expiredItems: number;
  monthlyCost: number;
  byRiskLevel: { level: string; count: number }[];
  byCategory: { name: string; count: number; color: string }[];
  upcomingTimeline: {
    id: string;
    name: string;
    expiry_date: string;
    days_until: number;
    risk_level: string;
    category?: string;
  }[];
  recentActivity: ActivityEntry[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ItemFilters {
  search?: string;
  category?: string;
  status?: string;
  risk_level?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ItemFormData {
  name: string;
  description?: string | null;
  category_id?: string | null;
  status?: ItemStatus;
  start_date?: string | null;
  expiry_date: string;
  renewal_date?: string | null;
  cost?: number | null;
  currency?: string;
  recurrence?: RecurrenceType | string;
  risk_level?: RiskLevel;
  responsible_person?: string | null;
  responsible_email?: string | null;
  vendor?: string | null;
  vendor_contact?: string | null;
  notes?: string | null;
  tags?: string[] | null;
}

export interface CategoryFormData {
  name: string;
  icon?: string;
  color: string;
  description?: string | null;
  default_risk_level?: RiskLevel;
}

export interface AlertRuleFormData {
  name: string;
  category_id?: string | null;
  days_before: number[];
  channels: string[];
  is_active?: boolean;
}
