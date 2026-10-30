import type { DayKey, OpeningHours } from '@/types';

/** Indexed by Date#getDay(). */
export const DAY_KEYS: DayKey[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Display order, Monday first. */
export const WEEK_DAYS: DayKey[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const DEFAULT_OPENING_HOURS: OpeningHours[] = WEEK_DAYS.map((day) => ({
  day,
  open: day === 'Sun' ? '' : '09:00',
  close: day === 'Sun' ? '' : day === 'Sat' ? '13:00' : '17:30',
  closed: day === 'Sun',
}));

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidTime(value: string): boolean {
  return TIME_RE.test(value);
}

export function toMinutes(value: string): number {
  const [h, m] = value.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function fromMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function hoursForDate(hours: OpeningHours[], date: Date): OpeningHours | undefined {
  const key = DAY_KEYS[date.getDay()];
  return hours.find((h) => h.day === key);
}

/** Returns an error message for the first invalid day, if any. */
export function validateOpeningHours(hours: OpeningHours[]): string | undefined {
  for (const h of hours) {
    if (h.closed) continue;
    if (!isValidTime(h.open) || !isValidTime(h.close)) {
      return `${h.day}: use 24-hour times like 09:00`;
    }
    if (toMinutes(h.close) <= toMinutes(h.open)) {
      return `${h.day}: closing time must be after opening time`;
    }
  }
}

/**
 * Appointment start times for a day. Shops without configured hours fall back
 * to 09:00–17:00. Same-day slots require at least `leadMinutes` notice.
 */
export function generateTimeSlots(
  hours: OpeningHours[],
  date: Date,
  now: Date = new Date(),
  intervalMinutes = 60,
  leadMinutes = 60
): string[] {
  const entry = hours.length > 0 ? hoursForDate(hours, date) : undefined;
  if (hours.length > 0 && (!entry || entry.closed)) return [];

  const open = entry ? toMinutes(entry.open) : 9 * 60;
  const close = entry ? toMinutes(entry.close) : 17 * 60;
  if (!(close > open)) return [];

  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  const earliest = sameDay ? now.getHours() * 60 + now.getMinutes() + leadMinutes : -1;

  const slots: string[] = [];
  for (let t = open; t + intervalMinutes <= close; t += intervalMinutes) {
    if (t >= earliest) slots.push(fromMinutes(t));
  }
  return slots;
}

/** The next `count` calendar days starting today (local time, midnight). */
export function upcomingDates(count = 14, from: Date = new Date()): Date[] {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

/** null when the shop has not published opening hours. */
export function isOpenNow(hours: OpeningHours[], now: Date = new Date()): boolean | null {
  if (hours.length === 0) return null;
  const entry = hoursForDate(hours, now);
  if (!entry || entry.closed || !isValidTime(entry.open) || !isValidTime(entry.close)) {
    return false;
  }
  const minutes = now.getHours() * 60 + now.getMinutes();
  return minutes >= toMinutes(entry.open) && minutes < toMinutes(entry.close);
}

/** Normalises arbitrary JSON from the database into a full week. */
export function normalizeOpeningHours(value: unknown): OpeningHours[] {
  if (!Array.isArray(value)) return [];
  const byDay = new Map<string, OpeningHours>();
  for (const raw of value) {
    if (!raw || typeof raw !== 'object') continue;
    const r = raw as Record<string, unknown>;
    const day = String(r.day ?? '') as DayKey;
    if (!WEEK_DAYS.includes(day)) continue;
    byDay.set(day, {
      day,
      open: typeof r.open === 'string' ? r.open : '',
      close: typeof r.close === 'string' ? r.close : '',
      closed: Boolean(r.closed),
    });
  }
  if (byDay.size === 0) return [];
  return WEEK_DAYS.map((day) => byDay.get(day) ?? { day, open: '', close: '', closed: true });
}
