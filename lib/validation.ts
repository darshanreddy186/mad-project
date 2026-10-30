const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[0-9 ()-]{7,20}$/;

export const MIN_PASSWORD_LENGTH = 8;

export function isEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

export function isPhone(value: string): boolean {
  return PHONE_RE.test(value.trim());
}

export function validateEmail(value: string): string | undefined {
  if (!value.trim()) return 'Email is required';
  if (!isEmail(value)) return 'Enter a valid email address';
}

export function validatePassword(value: string): string | undefined {
  if (!value) return 'Password is required';
  if (value.length < MIN_PASSWORD_LENGTH) return `Use at least ${MIN_PASSWORD_LENGTH} characters`;
  if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) return 'Use both letters and numbers';
}

export function validateRequired(value: string, label: string, min = 1): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return `${label} is required`;
  if (trimmed.length < min) return `${label} must be at least ${min} characters`;
}

export function validatePhone(value: string, required = true): string | undefined {
  if (!value.trim()) return required ? 'Phone number is required' : undefined;
  if (!isPhone(value)) return 'Enter a valid phone number';
}

/** Parses a user-typed money amount. Returns null for blank, NaN for invalid. */
export function parseAmount(value: string): number | null {
  const cleaned = value.replace(/[^0-9.]/g, '');
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
}

export function parseYear(value: string): number | null {
  if (!value.trim()) return null;
  const n = Number(value);
  return Number.isInteger(n) && n >= 1900 && n <= 2100 ? n : NaN;
}

export function normalizeWebsite(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/** True when the form error map has no messages. */
export function isValid(errors: Record<string, string | undefined>): boolean {
  return Object.values(errors).every((e) => !e);
}
