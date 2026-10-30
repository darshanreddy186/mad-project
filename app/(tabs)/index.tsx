import { View, Text, ScrollView, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Search, MapPin, Bell, TrendingUp, Star } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { CATEGORIES, SHOPS, GALLERY_IMAGES } from '@/data/mockData';
import { CategoryCard } from '@/components/CategoryCard';
import { ShopCard } from '@/components/ShopCard';
import { SectionHeader } from '@/components/SectionHeader';

export default function HomeScreen() {
  const router = useRouter();
  const topRated = [...SHOPS].sort((a, b) => b.rating - a.rating).slice(0, 4);
  const nearby = [...SHOPS].sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0)).slice(0, 4);

  return (
    <SafeAreaView
      edges={['top']}
      className="flex-1"
      style={{ backgroundColor: Colors.charcoal[950] }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
          <View>
            <View className="flex-row items-center gap-1.5">
              <MapPin size={14} color={Colors.accent[500]} />
              <Text className="text-xs font-medium" style={{ color: Colors.charcoal[400] }}>
                Manchester, UK
              </Text>
            </View>
            <Text className="mt-0.5 text-xl font-bold text-white">
              Find your mod shop
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/notifications')}
            className="relative h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: Colors.charcoal[800] }}>
            <Bell size={20} color={Colors.charcoal[200]} />
            <View
              className="absolute right-2 top-2 h-2 w-2 rounded-full"
              style={{ backgroundColor: Colors.accent[500] }}
            />
          </Pressable>
        </View>

        {/* Search bar */}
        <View className="px-5">
          <Pressable
            onPress={() => router.push('/shops')}
            className="flex-row items-center gap-3 rounded-2xl px-4 py-3.5"
            style={{ backgroundColor: Colors.charcoal[800] }}>
            <Search size={20} color={Colors.charcoal[400]} />
            <Text className="text-sm" style={{ color: Colors.charcoal[500] }}>
              Search shops, services, brands...
            </Text>
          </Pressable>
        </View>

        {/* Featured banner */}
        <View className="px-5 mt-5">
          <Pressable
            onPress={() => router.push('/shops')}
            className="overflow-hidden rounded-2xl"
            style={{ backgroundColor: Colors.charcoal[800] }}>
            <Image
              source={{ uri: GALLERY_IMAGES[0] }}
              className="h-36 w-full"
              resizeMode="cover"
            />
            <View
              className="absolute inset-0 items-center justify-center p-5"
              style={{ backgroundColor: 'rgba(15,17,21,0.55)' }}>
              <Text className="text-lg font-bold text-white">
                Top-rated shops this week
              </Text>
              <Text
                className="mt-1 text-center text-xs"
                style={{ color: Colors.charcoal[200] }}>
                Discover the best car modification specialists near you
              </Text>
              <View
                className="mt-3 flex-row items-center gap-1.5 rounded-full px-4 py-2"
                style={{ backgroundColor: Colors.accent[600] }}>
                <TrendingUp size={14} color={Colors.white} />
                <Text className="text-xs font-bold text-white">Explore now</Text>
              </View>
            </View>
          </Pressable>
        </View>

        {/* Categories */}
        <View className="mt-6 px-5">
          <SectionHeader
            title="Categories"
            subtitle="Browse by modification type"
            actionText="See all"
            onAction={() => router.push('/categories')}
          />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}>
          {CATEGORIES.map((cat) => (
            <CategoryCard key={cat.id} category={cat} variant="row" />
          ))}
        </ScrollView>

        {/* Top rated shops */}
        <View className="mt-6 px-5">
          <SectionHeader
            title="Top Rated"
            subtitle="Highest-rated shops near you"
            actionText="See all"
            onAction={() => router.push('/shops?sort=rating')}
          />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}>
          {topRated.map((shop) => (
            <ShopCard key={shop.id} shop={shop} variant="compact" />
          ))}
        </ScrollView>

        {/* Nearby shops */}
        <View className="mt-6 px-5">
          <SectionHeader
            title="Nearby Shops"
            subtitle="Closest to your current location"
            actionText="See all"
            onAction={() => router.push('/shops')}
          />
        </View>
        <View className="px-5">
          {nearby.map((shop) => (
            <ShopCard key={shop.id} shop={shop} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
