import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Check, LocateFixed, Map as MapIcon, MapPin, Navigation } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { ScreenHeader } from '@/components/ScreenHeader';
import { LocationPickerModal } from '@/components/LocationPickerModal';
import { useLocationStore } from '@/store/useLocationStore';
import { toast } from '@/store/useToastStore';

const POPULAR_CITIES = [
  { label: 'London, GB', latitude: 51.5074, longitude: -0.1278 },
  { label: 'Manchester, GB', latitude: 53.4808, longitude: -2.2426 },
  { label: 'Birmingham, GB', latitude: 52.4862, longitude: -1.8904 },
  { label: 'Leeds, GB', latitude: 53.8008, longitude: -1.5491 },
  { label: 'Liverpool, GB', latitude: 53.4084, longitude: -2.9916 },
  { label: 'Bristol, GB', latitude: 51.4545, longitude: -2.5879 },
  { label: 'Glasgow, GB', latitude: 55.8642, longitude: -4.2518 },
  { label: 'Edinburgh, GB', latitude: 55.9533, longitude: -3.1883 },
];

/** Manual location selection with GPS, popular cities and map picking. */
export default function LocationScreen() {
  const router = useRouter();
  const { coords, label, source, permission, locating, error, requestGpsLocation, setManualLocation } =
    useLocationStore();
  const [pickerOpen, setPickerOpen] = useState(false);

  const done = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  const useGps = async () => {
    if (permission === 'blocked') {
      Linking.openSettings();
      return;
    }
    if (await requestGpsLocation()) {
      toast.success('Using your current location.');
      done();
    }
  };

  const pickCity = async (city: (typeof POPULAR_CITIES)[number]) => {
    await setManualLocation({ latitude: city.latitude, longitude: city.longitude }, city.label);
    done();
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1" style={{ backgroundColor: Colors.charcoal[950] }}>
      <ScreenHeader title="Your location" subtitle={label ? `Currently: ${label}` : 'Not set'} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
        <Pressable
          onPress={useGps}
          disabled={locating}
          className="flex-row items-center gap-3 rounded-2xl p-4"
          style={{ backgroundColor: `${Colors.electric[500]}18`, borderWidth: 1, borderColor: `${Colors.electric[500]}40` }}>
          <View className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: Colors.electric[600] }}>
            {locating ? <ActivityIndicator color={Colors.white} size="small" /> : <LocateFixed size={18} color={Colors.white} />}
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-white">Use my current location</Text>
            <Text className="text-xs" style={{ color: Colors.charcoal[400] }}>
              {permission === 'blocked' ? 'Location access is blocked — tap to open Settings' : 'Uses GPS for the most accurate results'}
            </Text>
          </View>
          {source === 'gps' && coords && <Check size={18} color={Colors.success[500]} />}
        </Pressable>
        {error && <Text className="mt-2 text-xs" style={{ color: Colors.warning[500] }}>{error}</Text>}

        <Pressable
          onPress={() => setPickerOpen(true)}
          className="mt-3 flex-row items-center gap-3 rounded-2xl p-4"
          style={{ backgroundColor: Colors.charcoal[800] }}>
          <View className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: Colors.charcoal[700] }}>
            <MapIcon size={18} color={Colors.accent[500]} />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-white">Search address or pick on map</Text>
            <Text className="text-xs" style={{ color: Colors.charcoal[400] }}>Set any location manually</Text>
          </View>
          <Navigation size={16} color={Colors.charcoal[500]} />
        </Pressable>

        <Text className="mb-3 mt-6 text-sm font-semibold" style={{ color: Colors.charcoal[400] }}>
          POPULAR CITIES
        </Text>
        <View className="overflow-hidden rounded-2xl" style={{ backgroundColor: Colors.charcoal[800] }}>
          {POPULAR_CITIES.map((city, i) => {
            const active = source === 'manual' && label === city.label;
            return (
              <Pressable
                key={city.label}
                onPress={() => pickCity(city)}
                className="flex-row items-center gap-3 px-4 py-3.5"
                style={{ borderBottomWidth: i < POPULAR_CITIES.length - 1 ? 1 : 0, borderBottomColor: Colors.charcoal[700] }}>
                <MapPin size={16} color={active ? Colors.accent[500] : Colors.charcoal[400]} />
                <Text className="flex-1 text-sm text-white">{city.label}</Text>
                {active && <Check size={16} color={Colors.accent[500]} />}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <LocationPickerModal
        visible={pickerOpen}
        initial={coords}
        onClose={() => setPickerOpen(false)}
        onConfirm={async (c, pickedLabel) => {
          await setManualLocation(c, pickedLabel ?? 'Pinned location');
          setPickerOpen(false);
          done();
        }}
      />
    </SafeAreaView>
  );
}
