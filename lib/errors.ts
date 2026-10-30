/**
 * Normalises Supabase / network / runtime errors into user-facing messages.
 * Database guard triggers raise readable messages, which are passed through;
 * generic Postgres/RLS errors are mapped to friendlier text.
 */
export class AppError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'AppError';
    this.code = code;
  }
}

interface ErrorLike {
  message?: string;
  code?: string;
  status?: number;
}

const GENERIC_DB_MESSAGES = [
  'violates row-level security',
  'permission denied',
  'violates check constraint',
  'violates foreign key constraint',
  'invalid input syntax',
];

export function getErrorMessage(error: unknown): string {
  if (!error) return 'Something went wrong. Please try again.';
  if (typeof error === 'string') return error;

  const e = error as ErrorLike;
  const message = e.message ?? '';
  const lower = message.toLowerCase();

  if (lower.includes('network request failed') || lower.includes('failed to fetch')) {
    return 'Network error. Check your connection and try again.';
  }
  if (lower.includes('invalid login credentials')) return 'Incorrect email or password.';
  if (lower.includes('email not confirmed')) {
    return 'Please confirm your email address before signing in.';
  }
  if (lower.includes('user already registered')) {
    return 'An account with this email already exists.';
  }
  if (lower.includes('jwt expired') || e.code === 'PGRST301') {
    return 'Your session has expired. Please sign in again.';
  }

  switch (e.code) {
    case '23505':
      return 'This already exists.';
    case '23503':
      return 'A related record no longer exists.';
    case '23514':
      return 'Some details are invalid. Please check the form.';
    case '42501':
      if (GENERIC_DB_MESSAGES.some((m) => lower.includes(m))) {
        return "You don't have permission to do that.";
      }
      return message || "You don't have permission to do that.";
    case '22023':
      return message || 'Invalid request.';
    case 'PGRST116':
      return 'Not found.';
  }

  if (GENERIC_DB_MESSAGES.some((m) => lower.includes(m))) {
    return 'Something went wrong. Please check your details and try again.';
  }
  return message || 'Something went wrong. Please try again.';
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  return new AppError(getErrorMessage(error), (error as ErrorLike | undefined)?.code);
}

/** Unwraps a Supabase response, throwing an AppError on failure. */
export function unwrap<T>(result: { data: T | null; error: unknown }): T {
  if (result.error) throw toAppError(result.error);
  if (result.data === null) throw new AppError('Not found.', 'PGRST116');
  return result.data;
}

/** Throws if the Supabase response has an error; for mutations without data. */
export function check(result: { error: unknown }): void {
  if (result.error) throw toAppError(result.error);
}
