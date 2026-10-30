import { forwardRef, useImperativeHandle } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { MapPin, Star } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { formatDistance } from '@/lib/format';
import type { ShopMapProps } from './types';

export interface ShopMapHandle {
  focus: (coords: { latitude: number; longitude: number }, zoomDelta?: number) => void;
  fitAll: () => void;
}

/**
 * react-native-maps has no web implementation. On web we show a selectable
 * list in the map area so the screen stays fully usable.
 */
export const ShopMap = forwardRef<ShopMapHandle, ShopMapProps>(function ShopMap(
  { shops, selectedId, onSelect },
  ref
) {
  useImperativeHandle(ref, () => ({ focus: () => {}, fitAll: () => {} }));

  return (
    <View className="flex-1" style={{ backgroundColor: Colors.charcoal[900] }}>
      <Text className="px-4 pt-16 pb-2 text-xs" style={{ color: Colors.charcoal[400] }}>
        Interactive maps are available in the iOS and Android apps.
      </Text>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 160 }}>
        {shops.map((shop) => {
          const selected = shop.id === selectedId;
          return (
            <Pressable
              key={shop.id}
              onPress={() => onSelect(shop)}
              className="mb-2 flex-row items-center gap-3 rounded-xl p-3"
              style={{
                backgroundColor: selected ? `${Colors.accent[500]}25` : Colors.charcoal[800],
                borderWidth: 1,
                borderColor: selected ? Colors.accent[500] : 'transparent',
              }}>
              <MapPin size={18} color={selected ? Colors.accent[500] : Colors.electric[400]} />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-white">{shop.name}</Text>
                <Text className="text-xs" style={{ color: Colors.charcoal[400] }}>
                  {shop.city}
                  {formatDistance(shop.distance_km) ? ` · ${formatDistance(shop.distance_km)}` : ''}
                </Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Star size={12} color={Colors.accent[500]} fill={Colors.accent[500]} strokeWidth={0} />
                <Text className="text-xs font-semibold text-white">{shop.rating.toFixed(1)}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
});
