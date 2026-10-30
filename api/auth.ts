import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';
import { AppError, check, toAppError } from '@/lib/errors';
import type { UserRole } from '@/types';

export interface SignUpInput {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  role: Extract<UserRole, 'customer' | 'shop_owner'>;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) throw toAppError(error);
  return data.session;
}

/**
 * Creates the auth user; the database trigger creates the profile with the
 * requested role ('admin' can never be requested). Returns whether the user
 * must confirm their email before a session exists.
 */
export async function signUp({ email, password, fullName, phone, role }: SignUpInput) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: { full_name: fullName.trim(), phone: phone?.trim() || null, role },
      emailRedirectTo: Linking.createURL('/login'),
    },
  });
  if (error) throw toAppError(error);
  // Supabase returns a user with no identities when the email is already taken
  // and email enumeration protection is on.
  if (data.user && data.user.identities?.length === 0) {
    throw new AppError('An account with this email already exists.');
  }
  return { needsConfirmation: !data.session };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    // Clear the local session even if the server call fails (e.g. offline).
    await supabase.auth.signOut({ scope: 'local' });
  }
}

export async function sendPasswordReset(email: string) {
  check(
    await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: Linking.createURL('/reset-password'),
    })
  );
}

/** Signs in with the 6-digit recovery code from the reset email. */
export async function verifyRecoveryCode(email: string, token: string) {
  const { error } = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: token.trim(),
    type: 'recovery',
  });
  if (error) throw toAppError(error);
}

export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw toAppError(error);
}

export async function resendConfirmation(email: string) {
  check(
    await supabase.auth.resend({
      type: 'signup',
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: Linking.createURL('/login') },
    })
  );
}

/**
 * Completes a session from an auth deep link (email confirmation or password
 * recovery). Supports both the implicit (#access_token) and PKCE (?code) flows.
 * Returns the link type, or null if the URL is not an auth link.
 */
export async function createSessionFromUrl(url: string): Promise<string | null> {
  const [, hash = ''] = url.split('#');
  const query = url.includes('?') ? url.split('?')[1]!.split('#')[0]! : '';
  const params = new URLSearchParams(`${query}&${hash}`);

  const errorDescription = params.get('error_description');
  if (errorDescription) throw new AppError(errorDescription.replace(/\+/g, ' '));

  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  const code = params.get('code');
  const type = params.get('type');

  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) throw toAppError(error);
    return type ?? 'magiclink';
  }
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw toAppError(error);
    return type ?? 'code';
  }
  return null;
}

/**
 * Deletes the signed-in user's account (or, for admins, another user) via the
 * delete-account Edge Function, which holds the service-role key server-side.
 */
export async function deleteAccount(userId?: string) {
  const { error } = await supabase.functions.invoke('delete-account', {
    body: userId ? { user_id: userId } : {},
  });
  if (error) {
    let message = error.message;
    try {
      const body = await (error as { context?: Response }).context?.json();
      if (body?.error) message = body.error;
    } catch {
      // keep the generic message
    }
    throw new AppError(message);
  }
}
