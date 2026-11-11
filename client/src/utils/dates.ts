import { format, formatDistanceToNow, differenceInDays, parseISO, isValid } from 'date-fns';

export function formatDate(date: string | Date | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '—';
  return format(d, 'MMM d, yyyy');
}

export function formatDateShort(date: string | Date | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '—';
  return format(d, 'MMM d');
}

export function formatRelative(date: string | Date | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '—';
  return formatDistanceToNow(d, { addSuffix: true });
}

export function getDaysLeft(expiryDate: string | undefined): number | null {
  if (!expiryDate) return null;
  const d = parseISO(expiryDate);
  if (!isValid(d)) return null;
  return differenceInDays(d, new Date());
}

export function getDaysLeftLabel(days: number | null): string {
  if (days === null) return '—';
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Today';
  if (days === 1) return '1 day';
  return `${days} days`;
}

export function toInputDate(date: string | undefined): string {
  if (!date) return '';
  const d = parseISO(date);
  if (!isValid(d)) return '';
  return format(d, 'yyyy-MM-dd');
}
