import { CURRENCY_SYMBOL, DISTANCE_UNIT } from '@/constants/config';
import { kmToUnit } from '@/lib/geo';

export function formatDistance(km: number | null | undefined): string | null {
  if (km === null || km === undefined || !Number.isFinite(km)) return null;
  const value = kmToUnit(km, DISTANCE_UNIT);
  if (value < 0.1) return `<0.1${DISTANCE_UNIT}`;
  return `${value < 10 ? value.toFixed(1) : Math.round(value)}${DISTANCE_UNIT}`;
}

export function formatPrice(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || !Number.isFinite(amount)) return '—';
  const hasPence = Math.round(amount * 100) % 100 !== 0;
  return `${CURRENCY_SYMBOL}${amount.toLocaleString('en-GB', {
    minimumFractionDigits: hasPence ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

export function formatPriceRange(from: number, to?: number | null): string {
  if (to === null || to === undefined || to === from) return formatPrice(from);
  return `${formatPrice(from)} – ${formatPrice(to)}`;
}

export function priceLevelSymbols(level: number): string {
  return CURRENCY_SYMBOL.repeat(Math.max(1, Math.min(4, level)));
}

export function formatDate(value: string | Date, opts?: Intl.DateTimeFormatOptions): string {
  const date = typeof value === 'string' ? parseDate(value) : value;
  return date.toLocaleDateString('en-GB', opts ?? { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Parses 'YYYY-MM-DD' as a local date (not UTC) and ISO timestamps as-is. */
export function parseDate(value: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return new Date(value);
}

/** 'HH:MM:SS' or 'HH:MM' -> 'HH:MM' */
export function formatTime(value: string): string {
  return value.slice(0, 5);
}

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function timeAgo(value: string, now: Date = new Date()): string {
  const diffMs = now.getTime() - new Date(value).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 35) return `${Math.floor(days / 7)}w ago`;
  return formatDate(value);
}

export function initials(name: string | null | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return parts
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
}

export function titleCase(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
