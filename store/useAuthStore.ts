import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { getProfile } from '@/api/profiles';
import * as authApi from '@/api/auth';
import type { Profile, UserRole } from '@/types';

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  /** True once the persisted session (and profile) has been restored. */
  initialized: boolean;
  /** Set when the user arrived through a password-recovery link/code. */
  passwordRecovery: boolean;
  initialize: () => () => void;
  refreshProfile: () => Promise<Profile | null>;
  setProfile: (profile: Profile) => void;
  signIn: (email: string, password: string) => Promise<Profile | null>;
  signUp: (input: authApi.SignUpInput) => Promise<{ needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  setPasswordRecovery: (value: boolean) => void;
}

let initializing = false;

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  initialized: false,
  passwordRecovery: false,

  initialize: () => {
    if (initializing) return () => {};
    initializing = true;

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        set({ session: data.session });
        if (data.session) await get().refreshProfile();
      })
      .catch((err) => console.warn('[auth] failed to restore session', err))
      .finally(() => set({ initialized: true }));

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      set({ session });
      if (event === 'PASSWORD_RECOVERY') set({ passwordRecovery: true });
      if (event === 'SIGNED_OUT') {
        set({ profile: null, passwordRecovery: false });
        return;
      }
      // Never await Supabase calls inside this callback (it can deadlock the
      // auth lock); defer profile loading to the next tick instead.
      if (session && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
        setTimeout(() => {
          get().refreshProfile();
        }, 0);
      }
    });

    return () => {
      data.subscription.unsubscribe();
      initializing = false;
    };
  },

  refreshProfile: async () => {
    const userId = get().session?.user.id;
    if (!userId) {
      set({ profile: null });
      return null;
    }
    try {
      const profile = await getProfile(userId);
      set({ profile });
      return profile;
    } catch (err) {
      console.warn('[auth] failed to load profile', err);
      return get().profile;
    }
  },

  setProfile: (profile) => set({ profile }),

  signIn: async (email, password) => {
    const session = await authApi.signIn(email, password);
    set({ session });
    return get().refreshProfile();
  },

  signUp: (input) => authApi.signUp(input),

  signOut: async () => {
    await authApi.signOut();
    set({ session: null, profile: null, passwordRecovery: false });
  },

  setPasswordRecovery: (value) => set({ passwordRecovery: value }),
}));

export const selectRole = (s: AuthState): UserRole | null => s.profile?.role ?? null;
export const selectUserId = (s: AuthState): string | null => s.session?.user.id ?? null;

/** Where a signed-in user should land based on their role. */
export function homeRouteForRole(role: UserRole | null | undefined) {
  switch (role) {
    case 'admin':
      return '/admin' as const;
    case 'shop_owner':
      return '/owner' as const;
    default:
      return '/(tabs)' as const;
  }
}
