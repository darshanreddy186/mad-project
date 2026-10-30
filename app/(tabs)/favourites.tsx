import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Heart, Search } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import { ShopCard } from '@/components/ShopCard';
import { Button } from '@/components/Button';

export default function FavouritesScreen() {
  const router = useRouter();
  const shops = useAppStore((s) => s.shops);
  const favourites = useAppStore((s) => s.favourites);

  const favShops = shops.filter((s) => favourites.includes(s.id));

  return (
    <SafeAreaView
      edges={['top']}
      className="flex-1"
      style={{ backgroundColor: Colors.charcoal[950] }}>
      <View className="px-5 pt-4 pb-3">
        <Text className="text-xl font-bold text-white">Saved Shops</Text>
        <Text className="mt-1 text-sm" style={{ color: Colors.charcoal[400] }}>
          {favShops.length} {favShops.length === 1 ? 'shop' : 'shops'} in your favourites
        </Text>
      </View>

      {favShops.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10">
          <View
            className="mb-4 h-20 w-20 items-center justify-center rounded-full"
            style={{ backgroundColor: Colors.charcoal[800] }}>
            <Heart size={36} color={Colors.charcoal[500]} />
          </View>
          <Text className="text-base font-semibold text-white">No favourites yet</Text>
          <Text className="mt-2 text-center text-sm" style={{ color: Colors.charcoal[400] }}>
            Tap the heart icon on any shop to save it here for quick access
          </Text>
          <View className="mt-6 w-full">
            <Button
              label="Discover Shops"
              fullWidth
              onPress={() => router.push('/shops')}
            />
          </View>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}>
          {favShops.map((shop) => (
            <ShopCard key={shop.id} shop={shop} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
