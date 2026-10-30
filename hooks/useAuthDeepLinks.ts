import { useEffect, useRef } from 'react';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { createSessionFromUrl } from '@/api/auth';
import { getErrorMessage } from '@/lib/errors';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/store/useToastStore';

const AUTH_PARAM = /[#?&](access_token|code|error_description)=/;

/**
 * Completes sign-in from email links (confirmation and password recovery).
 * The redirect URLs must be allow-listed in Supabase Auth settings.
 */
export function useAuthDeepLinks() {
  const url = Linking.useURL();
  const router = useRouter();
  const handled = useRef<string | null>(null);
  const setPasswordRecovery = useAuthStore((s) => s.setPasswordRecovery);

  useEffect(() => {
    if (!url || handled.current === url || !AUTH_PARAM.test(url)) return;
    handled.current = url;

    createSessionFromUrl(url)
      .then((type) => {
        if (type === 'recovery') {
          setPasswordRecovery(true);
          router.replace('/reset-password');
        } else if (type) {
          toast.success('Email confirmed. Welcome to AutoMod!');
          router.replace('/');
        }
      })
      .catch((err) => toast.error(getErrorMessage(err)));
  }, [url, router, setPasswordRecovery]);
}
