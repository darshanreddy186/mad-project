import { create } from 'zustand';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { STORAGE_KEYS } from '@/constants/config';
import type { Coordinates } from '@/types';

export type PermissionState = 'unknown' | 'granted' | 'denied' | 'blocked';
export type LocationSource = 'gps' | 'manual';

interface LocationState {
  coords: Coordinates | null;
  label: string | null;
  source: LocationSource | null;
  permission: PermissionState;
  locating: boolean;
  error: string | null;
  hydrated: boolean;
  /** Restores a saved manual location or a granted GPS fix. Never prompts. */
  hydrate: () => Promise<void>;
  /** Prompts for permission if needed and fetches the current position. */
  requestGpsLocation: () => Promise<boolean>;
  setManualLocation: (coords: Coordinates, label: string) => Promise<void>;
  clearManualLocation: () => Promise<void>;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Location timed out')), ms)),
  ]);
}

export async function describeLocation(coords: Coordinates): Promise<string | null> {
  try {
    const [place] = await Location.reverseGeocodeAsync(coords);
    if (!place) return null;
    const area = place.city ?? place.subregion ?? place.district ?? place.region;
    return [area, place.isoCountryCode ?? place.country].filter(Boolean).join(', ') || null;
  } catch {
    // Reverse geocoding is unavailable on web without a Google API key.
    return null;
  }
}

async function readCurrentPosition(): Promise<Coordinates> {
  const last = Platform.OS !== 'web' ? await Location.getLastKnownPositionAsync({ maxAge: 5 * 60_000 }) : null;
  if (last) return { latitude: last.coords.latitude, longitude: last.coords.longitude };
  const current = await withTimeout(
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
    15_000
  );
  return { latitude: current.coords.latitude, longitude: current.coords.longitude };
}

export const useLocationStore = create<LocationState>((set, get) => ({
  coords: null,
  label: null,
  source: null,
  permission: 'unknown',
  locating: false,
  error: null,
  hydrated: false,

  hydrate: async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEYS.manualLocation);
      if (saved) {
        const parsed = JSON.parse(saved) as { coords: Coordinates; label: string };
        set({ coords: parsed.coords, label: parsed.label, source: 'manual' });
      }
      const perm = await Location.getForegroundPermissionsAsync();
      const permission: PermissionState = perm.granted
        ? 'granted'
        : perm.canAskAgain === false
          ? 'blocked'
          : perm.status === 'denied'
            ? 'denied'
            : 'unknown';
      set({ permission });
      if (!saved && perm.granted) {
        await get().requestGpsLocation();
      }
    } catch (err) {
      console.warn('[location] hydrate failed', err);
    } finally {
      set({ hydrated: true });
    }
  },

  requestGpsLocation: async () => {
    set({ locating: true, error: null });
    try {
      let perm = await Location.getForegroundPermissionsAsync();
      if (!perm.granted && perm.canAskAgain !== false) {
        perm = await Location.requestForegroundPermissionsAsync();
      }
      if (!perm.granted) {
        set({
          permission: perm.canAskAgain === false ? 'blocked' : 'denied',
          error: 'Location permission was denied. You can set your location manually.',
        });
        return false;
      }
      set({ permission: 'granted' });

      const coords = await readCurrentPosition();
      set({ coords, source: 'gps', label: 'Current location' });
      await AsyncStorage.removeItem(STORAGE_KEYS.manualLocation);
      const label = await describeLocation(coords);
      if (label && get().source === 'gps') set({ label });
      return true;
    } catch (err) {
      const servicesOn = await Location.hasServicesEnabledAsync().catch(() => true);
      set({
        error: servicesOn
          ? 'Could not determine your location. Try again or set it manually.'
          : 'Location services are turned off. Enable them or set your location manually.',
      });
      console.warn('[location] gps failed', err);
      return false;
    } finally {
      set({ locating: false });
    }
  },

  setManualLocation: async (coords, label) => {
    set({ coords, label, source: 'manual', error: null });
    await AsyncStorage.setItem(STORAGE_KEYS.manualLocation, JSON.stringify({ coords, label }));
  },

  clearManualLocation: async () => {
    await AsyncStorage.removeItem(STORAGE_KEYS.manualLocation);
    set({ coords: null, label: null, source: null });
    if (get().permission === 'granted') await get().requestGpsLocation();
  },
}));
