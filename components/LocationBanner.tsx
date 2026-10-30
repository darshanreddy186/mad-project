import { Linking, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LocateFixed, MapPinOff } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { useLocationStore } from '@/store/useLocationStore';

/** Explains missing location and offers GPS, settings, or manual selection. */
export function LocationBanner() {
  const router = useRouter();
  const { coords, permission, locating, error, requestGpsLocation } = useLocationStore();

  if (coords) return null;

  const blocked = permission === 'blocked';
  const message =
    error ??
    (permission === 'unknown'
      ? 'Share your location to see the closest shops and distances.'
      : 'Location access is off. Showing top-rated shops instead.');

  return (
    <View
      className="mx-5 mt-4 rounded-2xl p-4"
      style={{ backgroundColor: `${Colors.electric[500]}18`, borderWidth: 1, borderColor: `${Colors.electric[500]}40` }}>
      <View className="flex-row items-start gap-3">
        <MapPinOff size={20} color={Colors.electric[400]} />
        <Text className="flex-1 text-sm" style={{ color: Colors.charcoal[200] }}>
          {message}
        </Text>
      </View>
      <View className="mt-3 flex-row gap-2">
        <Pressable
          onPress={() => (blocked ? Linking.openSettings() : requestGpsLocation())}
          disabled={locating}
          className="flex-row items-center gap-1.5 rounded-full px-3.5 py-2"
          style={{ backgroundColor: Colors.electric[600], opacity: locating ? 0.6 : 1 }}>
          <LocateFixed size={14} color={Colors.white} />
          <Text className="text-xs font-semibold text-white">
            {locating ? 'Locating…' : blocked ? 'Open settings' : 'Use my location'}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/location')}
          className="rounded-full px-3.5 py-2"
          style={{ backgroundColor: Colors.charcoal[800] }}>
          <Text className="text-xs font-semibold text-white">Choose manually</Text>
        </Pressable>
      </View>
    </View>
  );
}
