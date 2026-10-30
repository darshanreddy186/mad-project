import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, SlidersHorizontal } from 'lucide-react-native';
import { useState } from 'react';
import { Colors } from '@/constants/theme';
import { SHOPS } from '@/data/mockData';
import type { Shop } from '@/types';

export default function MapScreen() {
  const router = useRouter();
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);

  const centerLat = SHOPS.reduce((sum, s) => sum + s.latitude, 0) / SHOPS.length;
  const centerLng = SHOPS.reduce((sum, s) => sum + s.longitude, 0) / SHOPS.length;

  return (
    <SafeAreaView
      edges={['top']}
      className="flex-1"
      style={{ backgroundColor: Colors.charcoal[950] }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
        <View className="flex-row items-center gap-3">
          <Text className="text-xl font-bold text-white">Map</Text>
          <Text className="text-sm" style={{ color: Colors.charcoal[400] }}>
            {SHOPS.length} shops
          </Text>
        </View>
        <Pressable
          className="h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: Colors.charcoal[800] }}>
          <SlidersHorizontal size={18} color={Colors.charcoal[200]} />
        </Pressable>
      </View>

      {/* Map placeholder */}
      <View className="relative flex-1 mx-5 mb-5 overflow-hidden rounded-2xl" style={{ backgroundColor: Colors.charcoal[900] }}>
        {/* Simulated map background */}
        <View className="absolute inset-0" style={{ backgroundColor: Colors.charcoal[900] }}>
          {/* Grid lines for map feel */}
          {[0.15, 0.3, 0.45, 0.6, 0.75, 0.9].map((pos) => (
            <View key={`h-${pos}`} className="absolute left-0 right-0" style={{ top: `${pos * 100}%`, height: 1, backgroundColor: Colors.charcoal[800] }} />
          ))}
          {[0.2, 0.4, 0.6, 0.8].map((pos) => (
            <View key={`v-${pos}`} className="absolute top-0 bottom-0" style={{ left: `${pos * 100}%`, width: 1, backgroundColor: Colors.charcoal[800] }} />
          ))}

          {/* Simulated road */}
          <View
            className="absolute"
            style={{
              top: '20%',
              left: '-10%',
              right: '-10%',
              height: 3,
              backgroundColor: Colors.charcoal[700],
              transform: [{ rotate: '15deg' }],
            }}
          />
          <View
            className="absolute"
            style={{
              top: '60%',
              left: '-10%',
              right: '-10%',
              height: 2,
              backgroundColor: Colors.charcoal[700],
              transform: [{ rotate: '-10deg' }],
            }}
          />
        </View>

        {/* Shop markers */}
        {SHOPS.map((shop, i) => {
          const top = 15 + (i * 13) % 65;
          const left = 15 + (i * 23) % 65;
          const isSelected = selectedShop?.id === shop.id;
          return (
            <Pressable
              key={shop.id}
              onPress={() => setSelectedShop(shop)}
              className="absolute items-center"
              style={{ top: `${top}%`, left: `${left}%` }}>
              <View
                className="items-center justify-center rounded-full"
                style={{
                  width: isSelected ? 36 : 28,
                  height: isSelected ? 36 : 28,
                  backgroundColor: isSelected ? Colors.accent[600] : Colors.charcoal[700],
                  borderWidth: 2,
                  borderColor: Colors.white,
                }}>
                <Text className="text-[10px] font-bold text-white">
                  {shop.rating.toFixed(1)}
                </Text>
              </View>
              {isSelected && (
                <View
                  className="absolute -top-8 rounded-full px-2 py-0.5"
                  style={{ backgroundColor: Colors.charcoal[900] }}>
                  <Text className="text-[9px] font-semibold text-white" numberOfLines={1}>
                    {shop.name}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}

        {/* Center label */}
        <View className="absolute left-4 top-4 rounded-full px-3 py-1.5" style={{ backgroundColor: 'rgba(15,17,21,0.8)' }}>
          <Text className="text-xs font-medium text-white">Tap markers to preview</Text>
        </View>

        {/* Shop preview card */}
        {selectedShop && (
          <View
            className="absolute bottom-4 left-4 right-4 overflow-hidden rounded-2xl p-4"
            style={{ backgroundColor: Colors.charcoal[800] }}>
            <View className="flex-row items-start justify-between">
              <View className="flex-1">
                <Text className="text-sm font-semibold text-white">{selectedShop.name}</Text>
                <Text className="mt-1 text-xs" style={{ color: Colors.charcoal[400] }}>
                  {selectedShop.city} · {selectedShop.distance?.toFixed(1)}mi
                </Text>
                <Text className="mt-1 text-xs font-semibold" style={{ color: Colors.accent[500] }}>
                  Rating: {selectedShop.rating.toFixed(1)} ({selectedShop.review_count} reviews)
                </Text>
              </View>
              <Pressable
                onPress={() => router.push(`/shop/${selectedShop.id}`)}
                className="rounded-xl px-4 py-2"
                style={{ backgroundColor: Colors.accent[600] }}>
                <Text className="text-xs font-bold text-white">View</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
