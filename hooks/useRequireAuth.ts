import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { confirm } from '@/lib/dialog';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Returns a guard for actions that need an account (favourites, bookings,
 * reviews...). Guests are offered a sign-in prompt instead.
 */
export function useRequireAuth() {
  const router = useRouter();
  const hasSession = useAuthStore((s) => Boolean(s.session));

  return useCallback(
    (message = 'Please sign in to continue.') => {
      if (hasSession) return true;
      confirm('Sign in required', message, { confirmText: 'Sign in', cancelText: 'Not now' }).then(
        (ok) => {
          if (ok) router.push('/(auth)/login');
        }
      );
      return false;
    },
    [hasSession, router]
  );
}
