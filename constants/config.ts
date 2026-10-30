// Runtime configuration. Only EXPO_PUBLIC_* variables are bundled into the app,
// so nothing secret (e.g. the Supabase service-role key) may ever be read here.

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const APP_NAME = 'AutoMod';
export const APP_VERSION = '1.0.0';
export const SUPPORT_EMAIL = process.env.EXPO_PUBLIC_SUPPORT_EMAIL ?? 'support@automod.app';

// Display settings. Distances are stored/queried in kilometres and converted
// for display only.
export const CURRENCY_SYMBOL = process.env.EXPO_PUBLIC_CURRENCY_SYMBOL ?? '£';
export const DISTANCE_UNIT: 'km' | 'mi' =
  process.env.EXPO_PUBLIC_DISTANCE_UNIT === 'km' ? 'km' : 'mi';

// Fallback map centre when the user has not shared a location yet.
export const DEFAULT_REGION = {
  latitude: 53.4808,
  longitude: -2.2426,
  label: 'Manchester, UK',
};

// Distance filter options, in the display unit.
export const DISTANCE_OPTIONS = [5, 10, 25, 50, 100];

export const PRICE_LEVELS = [1, 2, 3, 4] as const;

export const STORAGE_BUCKETS = {
  avatars: 'avatars',
  shopMedia: 'shop-media',
} as const;

export const STORAGE_KEYS = {
  onboardingComplete: 'automod:onboarding-complete',
  manualLocation: 'automod:manual-location',
} as const;
