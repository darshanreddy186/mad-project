import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LocateFixed, Navigation, Search, SlidersHorizontal, Star, X, Maximize2 } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { DEFAULT_REGION } from '@/constants/config';
import { ShopMap, type ShopMapHandle } from '@/components/map/ShopMap';
import { FilterSheet, activeFilterCount } from '@/components/FilterSheet';
import { useShopSearch } from '@/hooks/useShopSearch';
import { useAppStore } from '@/store/useAppStore';
import { useLocationStore } from '@/store/useLocationStore';
import { formatDistance, priceLevelSymbols } from '@/lib/format';
import { openDirections } from '@/lib/linking';
import { getErrorMessage } from '@/lib/errors';
import { toast } from '@/store/useToastStore';
import type { Shop } from '@/types';

export default function MapScreen() {
  const router = useRouter();
  const mapRef = useRef<ShopMapHandle>(null);
  const [selected, setSelected] = useState<Shop | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const filters = useAppStore((s) => s.filters);
  const { coords, locating, requestGpsLocation } = useLocationStore();
  const { shops, loading, error, hasLocation } = useShopSearch({ pageSize: 150 });

  // Recentre when the user's location changes (e.g. after granting permission).
  useEffect(() => {
    if (coords) mapRef.current?.focus(coords, 0.25);
  }, [coords]);

  // Drop the selection if it disappears from the filtered results.
  useEffect(() => {
    if (selected && !shops.some((s) => s.id === selected.id)) setSelected(null);
  }, [shops, selected]);

  const locate = async () => {
    if (coords) return mapRef.current?.focus(coords, 0.1);
    const ok = await requestGpsLocation();
    if (!ok) toast.info('Enable location access or set your location manually.');
  };

  const count = activeFilterCount(filters);

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.charcoal[950] }}>
      <ShopMap
        ref={mapRef}
        shops={shops}
        userLocation={coords}
        selectedId={selected?.id ?? null}
        onSelect={setSelected}
        initialCenter={coords ?? DEFAULT_REGION}
      />

      {/* Top controls */}
      <SafeAreaView edges={['top']} pointerEvents="box-none" className="absolute left-0 right-0 top-0">
        <View className="flex-row items-center gap-2 px-4 pt-3" pointerEvents="box-none">
          <Pressable
            onPress={() => router.push('/shops')}
            className="flex-1 flex-row items-center gap-2 rounded-2xl px-4 py-3"
            style={{ backgroundColor: 'rgba(26,29,37,0.95)' }}>
            <Search size={18} color={Colors.charcoal[400]} />
            <Text className="flex-1 text-sm" style={{ color: Colors.charcoal[400] }} numberOfLines={1}>
              {loading ? 'Loading shops…' : `${shops.length} shops${hasLocation ? ' near you' : ''}`}
            </Text>
            {loading && <ActivityIndicator size="small" color={Colors.accent[500]} />}
          </Pressable>
          <Pressable
            onPress={() => setShowFilters(true)}
            accessibilityLabel="Filters"
            className="h-12 w-12 items-center justify-center rounded-2xl"
            style={{ backgroundColor: count ? Colors.accent[600] : 'rgba(26,29,37,0.95)' }}>
            <SlidersHorizontal size={18} color={Colors.white} />
          </Pressable>
        </View>
        {error && (
          <View className="mx-4 mt-2 rounded-xl px-3 py-2" style={{ backgroundColor: `${Colors.error[500]}30` }}>
            <Text className="text-xs" style={{ color: Colors.white }}>
              {error}
            </Text>
          </View>
        )}
      </SafeAreaView>

      {/* Map buttons */}
      <View className="absolute right-4 gap-2" style={{ bottom: selected ? 196 : 24 }}>
        <Pressable
          onPress={() => mapRef.current?.fitAll()}
          accessibilityLabel="Show all shops"
          className="h-11 w-11 items-center justify-center rounded-full"
          style={{ backgroundColor: 'rgba(26,29,37,0.95)' }}>
          <Maximize2 size={18} color={Colors.white} />
        </Pressable>
        <Pressable
          onPress={locate}
          disabled={locating}
          accessibilityLabel="Go to my location"
          className="h-11 w-11 items-center justify-center rounded-full"
          style={{ backgroundColor: Colors.electric[600] }}>
          {locating ? <ActivityIndicator size="small" color={Colors.white} /> : <LocateFixed size={18} color={Colors.white} />}
        </Pressable>
      </View>

      {/* Selected shop preview */}
      {selected && (
        <View
          className="absolute bottom-4 left-4 right-4 overflow-hidden rounded-2xl"
          style={{ backgroundColor: Colors.charcoal[800], elevation: 6 }}>
          <View className="flex-row">
            {selected.cover_image_url ? (
              <Image source={{ uri: selected.cover_image_url }} className="h-full w-24" resizeMode="cover" />
            ) : (
              <View className="w-24" style={{ backgroundColor: Colors.charcoal[700] }} />
            )}
            <View className="flex-1 p-3">
              <View className="flex-row items-start justify-between gap-2">
                <Text className="flex-1 text-sm font-semibold text-white" numberOfLines={1}>
                  {selected.name}
                </Text>
                <Pressable onPress={() => setSelected(null)} hitSlop={10} accessibilityLabel="Close preview">
                  <X size={16} color={Colors.charcoal[400]} />
                </Pressable>
              </View>
              <Text className="mt-0.5 text-xs" style={{ color: Colors.charcoal[400] }} numberOfLines={1}>
                {selected.address}, {selected.city}
              </Text>
              <View className="mt-1.5 flex-row items-center gap-2">
                <Star size={12} color={Colors.accent[500]} fill={Colors.accent[500]} strokeWidth={0} />
                <Text className="text-xs font-semibold text-white">
                  {selected.rating > 0 ? selected.rating.toFixed(1) : 'New'}
                </Text>
                <Text className="text-xs" style={{ color: Colors.charcoal[400] }}>
                  ({selected.review_count}) · {priceLevelSymbols(selected.price_level)}
                  {formatDistance(selected.distance_km) ? ` · ${formatDistance(selected.distance_km)}` : ''}
                </Text>
              </View>
              <View className="mt-3 flex-row gap-2">
                <Pressable
                  onPress={() =>
                    openDirections(selected.latitude, selected.longitude, selected.name).catch((err) =>
                      toast.error(getErrorMessage(err))
                    )
                  }
                  className="flex-row items-center gap-1.5 rounded-xl px-3 py-2"
                  style={{ backgroundColor: Colors.charcoal[700] }}>
                  <Navigation size={13} color={Colors.electric[400]} />
                  <Text className="text-xs font-semibold text-white">Directions</Text>
                </Pressable>
                <Pressable
                  onPress={() => router.push(`/shop/${selected.id}`)}
                  className="flex-1 items-center rounded-xl px-3 py-2"
                  style={{ backgroundColor: Colors.accent[600] }}>
                  <Text className="text-xs font-bold text-white">View shop</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      )}

      <FilterSheet visible={showFilters} onClose={() => setShowFilters(false)} hasLocation={hasLocation} />
    </View>
  );
}
