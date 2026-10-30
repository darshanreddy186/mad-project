import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { LocateFixed, Search, X } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { DEFAULT_REGION } from '@/constants/config';
import { ShopMap } from '@/components/map/ShopMap';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { describeLocation, useLocationStore } from '@/store/useLocationStore';
import { isValidCoordinate } from '@/lib/geo';
import type { Coordinates } from '@/types';

interface LocationPickerModalProps {
  visible: boolean;
  title?: string;
  initial?: Coordinates | null;
  /** Pre-filled address search (e.g. the shop's address). */
  initialQuery?: string;
  onClose: () => void;
  onConfirm: (coords: Coordinates, label: string | null) => void;
}

export function LocationPickerModal({
  visible,
  title = 'Choose location',
  initial,
  initialQuery = '',
  onClose,
  onConfirm,
}: LocationPickerModalProps) {
  const requestGps = useLocationStore((s) => s.requestGpsLocation);
  const [picked, setPicked] = useState<Coordinates | null>(initial ?? null);
  const [label, setLabel] = useState<string | null>(null);
  const [query, setQuery] = useState(initialQuery);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [mapKey, setMapKey] = useState(0);
  const [latText, setLatText] = useState('');
  const [lngText, setLngText] = useState('');

  useEffect(() => {
    if (!visible) return;
    setPicked(initial ?? null);
    setQuery(initialQuery);
    setLabel(null);
    setMessage(null);
    setLatText(initial ? String(initial.latitude) : '');
    setLngText(initial ? String(initial.longitude) : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const choose = (coords: Coordinates, newLabel: string | null, recenter = false) => {
    setPicked(coords);
    setLabel(newLabel);
    setLatText(coords.latitude.toFixed(6));
    setLngText(coords.longitude.toFixed(6));
    if (recenter) setMapKey((k) => k + 1);
  };

  const search = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setMessage(null);
    try {
      const [result] = await Location.geocodeAsync(query.trim());
      if (!result) {
        setMessage('No results. Try a fuller address, or tap the map.');
        return;
      }
      choose({ latitude: result.latitude, longitude: result.longitude }, query.trim(), true);
    } catch {
      setMessage(
        Platform.OS === 'web'
          ? 'Address search is not available on web. Enter coordinates below.'
          : 'Address search failed. Check your connection or tap the map.'
      );
    } finally {
      setSearching(false);
    }
  };

  const useGps = async () => {
    setSearching(true);
    const ok = await requestGps();
    const { coords, label: gpsLabel, error } = useLocationStore.getState();
    if (ok && coords) choose(coords, gpsLabel, true);
    else setMessage(error ?? 'Could not get your location.');
    setSearching(false);
  };

  const confirm = async () => {
    let coords = picked;
    if (Platform.OS === 'web') {
      const lat = Number(latText);
      const lng = Number(lngText);
      if (!isValidCoordinate(lat, lng)) {
        setMessage('Enter a valid latitude and longitude.');
        return;
      }
      coords = { latitude: lat, longitude: lng };
    }
    if (!coords) {
      setMessage('Search for an address or tap the map to drop a pin.');
      return;
    }
    const finalLabel = label ?? (await describeLocation(coords));
    onConfirm(coords, finalLabel);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="fullScreen">
      <SafeAreaView edges={['top', 'bottom']} className="flex-1" style={{ backgroundColor: Colors.charcoal[950] }}>
        <View className="flex-row items-center justify-between px-5 pb-3 pt-2">
          <Text className="text-lg font-bold text-white">{title}</Text>
          <Pressable onPress={onClose} accessibilityLabel="Close" className="h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: Colors.charcoal[800] }}>
            <X size={18} color={Colors.white} />
          </Pressable>
        </View>

        <View className="flex-row gap-2 px-5">
          <View className="flex-1 flex-row items-center gap-2 rounded-xl px-3" style={{ backgroundColor: Colors.charcoal[800] }}>
            <Search size={16} color={Colors.charcoal[400]} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={search}
              returnKeyType="search"
              placeholder="Search address, town or postcode"
              placeholderTextColor={Colors.charcoal[500]}
              className="flex-1 py-3 text-sm"
              style={{ color: Colors.white }}
            />
            {searching && <ActivityIndicator size="small" color={Colors.accent[500]} />}
          </View>
          <Pressable onPress={useGps} accessibilityLabel="Use my current location" className="w-12 items-center justify-center rounded-xl" style={{ backgroundColor: Colors.electric[600] }}>
            <LocateFixed size={18} color={Colors.white} />
          </Pressable>
        </View>
        {message && (
          <Text className="px-5 pt-2 text-xs" style={{ color: Colors.warning[500] }}>{message}</Text>
        )}

        <View className="mx-5 mt-3 flex-1 overflow-hidden rounded-2xl">
          <ShopMap
            key={mapKey}
            shops={[]}
            userLocation={null}
            selectedId={null}
            onSelect={() => {}}
            onPickLocation={(c) => choose(c, null)}
            pickedLocation={picked}
            initialCenter={picked ?? DEFAULT_REGION}
          />
          {Platform.OS !== 'web' && (
            <View className="absolute left-3 top-3 rounded-full px-3 py-1.5" style={{ backgroundColor: 'rgba(15,17,21,0.8)' }}>
              <Text className="text-xs text-white">Tap the map to drop a pin</Text>
            </View>
          )}
        </View>

        {Platform.OS === 'web' && (
          <View className="flex-row gap-3 px-5 pt-3">
            <View className="flex-1"><Input label="Latitude" value={latText} onChangeText={setLatText} keyboardType="decimal-pad" /></View>
            <View className="flex-1"><Input label="Longitude" value={lngText} onChangeText={setLngText} keyboardType="decimal-pad" /></View>
          </View>
        )}

        <View className="px-5 pt-3">
          {picked && (
            <Text className="mb-2 text-xs" style={{ color: Colors.charcoal[400] }}>
              {label ? `${label} · ` : ''}
              {picked.latitude.toFixed(5)}, {picked.longitude.toFixed(5)}
            </Text>
          )}
          <Button label="Use this location" onPress={confirm} fullWidth size="lg" />
        </View>
      </SafeAreaView>
    </Modal>
  );
}
