import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, SlidersHorizontal, MapPin } from 'lucide-react-native';
import { useState } from 'react';
import { Colors } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import { ShopCard } from '@/components/ShopCard';

export default function ShopsScreen() {
  const router = useRouter();
  const [showFilters, setShowFilters] = useState(false);
  const shops = useAppStore((s) => s.shops);

  return (
    <SafeAreaView
      edges={['top']}
      className="flex-1"
      style={{ backgroundColor: Colors.charcoal[950] }}>
      {/* Search and filter bar */}
      <View className="flex-row items-center gap-3 px-5 pt-4 pb-3">
        <Pressable
          onPress={() => router.push('/shops')}
          className="flex-1 flex-row items-center gap-3 rounded-2xl px-4 py-3"
          style={{ backgroundColor: Colors.charcoal[800] }}>
          <Search size={20} color={Colors.charcoal[400]} />
          <Text className="text-sm" style={{ color: Colors.charcoal[500] }}>
            Search shops...
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setShowFilters(true)}
          className="h-11 w-11 items-center justify-center rounded-2xl"
          style={{ backgroundColor: Colors.charcoal[800] }}>
          <SlidersHorizontal size={20} color={Colors.charcoal[200]} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}>
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-lg font-bold text-white">
            All Shops ({shops.length})
          </Text>
          <View className="flex-row items-center gap-1">
            <MapPin size={12} color={Colors.charcoal[400]} />
            <Text className="text-xs" style={{ color: Colors.charcoal[400] }}>
              Near you
            </Text>
          </View>
        </View>

        {shops.map((shop) => (
          <ShopCard key={shop.id} shop={shop} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
