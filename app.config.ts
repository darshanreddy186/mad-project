import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Extends app.json with values that come from the environment at build time
 * (EAS environment variables or a local .env). None of these are secrets that
 * grant data access; the Supabase service-role key is never used here.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const mapsKey = process.env.GOOGLE_MAPS_API_KEY;
  const projectId = process.env.EAS_PROJECT_ID ?? config.extra?.eas?.projectId;

  return {
    ...(config as ExpoConfig),
    plugins: [
      ...(config.plugins ?? []),
      // Android needs a Google Maps SDK key in release builds; Expo Go works without one.
      ['react-native-maps', { androidGoogleMapsApiKey: mapsKey, iosGoogleMapsApiKey: mapsKey }],
    ],
    extra: {
      ...config.extra,
      ...(projectId ? { eas: { ...config.extra?.eas, projectId } } : {}),
    },
    ...(projectId
      ? { updates: { url: `https://u.expo.dev/${projectId}` }, runtimeVersion: { policy: 'appVersion' } }
      : {}),
  };
};
