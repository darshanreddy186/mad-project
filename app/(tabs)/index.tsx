import { useEffect } from 'react';
import { View, Text, ScrollView, Image, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Search, MapPin, Bell, TrendingUp, ChevronDown, Store } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { MARKETING_IMAGES } from '@/constants/images';
import { CategoryCard } from '@/components/CategoryCard';
import { ShopCard } from '@/components/ShopCard';
import { SectionHeader } from '@/components/SectionHeader';
import { LocationBanner } from '@/components/LocationBanner';
import { EmptyState, ErrorView, LoadingView } from '@/components/StateViews';
import { searchShops } from '@/api/shops';
import { useQuery } from '@/hooks/useQuery';
import { useAppStore } from '@/store/useAppStore';
import { useLocationStore } from '@/store/useLocationStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useAuthStore } from '@/store/useAuthStore';

export default function HomeScreen() {
  const router = useRouter();
  const categories = useAppStore((s) => s.categories);
  const setFilters = useAppStore((s) => s.setFilters);
  const loadCategories = useAppStore((s) => s.loadCategories);
  const { coords, label, hydrated, permission, requestGpsLocation } = useLocationStore();
  const unread = useNotificationStore((s) => s.unreadCount);
  const firstName = useAuthStore((s) => s.profile?.full_name.split(' ')[0]);

  // Ask for location the first time the user reaches the home screen.
  useEffect(() => {
    if (hydrated && permission === 'unknown' && !coords) requestGpsLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  const { data, loading, error, refreshing, refresh } = useQuery(
    async () => {
      const [topRated, nearby] = await Promise.all([
        searchShops({ coords, sortBy: 'rating', limit: 6 }),
        searchShops({ coords, sortBy: coords ? 'distance' : 'rating', limit: 5 }),
      ]);
      return { topRated, nearby };
    },
    [coords?.latitude, coords?.longitude],
    { enabled: hydrated }
  );

  const onRefresh = () => {
    loadCategories(true);
    refresh();
  };

  const seeAll = (sortBy: 'distance' | 'rating') => {
    setFilters({ sortBy });
    router.push('/shops');
  };

  return (
    <SafeAreaView
      edges={['top']}
      className="flex-1"
      style={{ backgroundColor: Colors.charcoal[950] }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent[500]} />
        }>
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
          <Pressable onPress={() => router.push('/location')} className="flex-1" accessibilityRole="button">
            <View className="flex-row items-center gap-1.5">
              <MapPin size={14} color={Colors.accent[500]} />
              <Text className="text-xs font-medium" style={{ color: Colors.charcoal[400] }} numberOfLines={1}>
                {label ?? 'Set your location'}
              </Text>
              <ChevronDown size={14} color={Colors.charcoal[400]} />
            </View>
            <Text className="mt-0.5 text-xl font-bold text-white">
              {firstName ? `Hi ${firstName}, find your mod shop` : 'Find your mod shop'}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/notifications')}
            accessibilityRole="button"
            accessibilityLabel={unread > 0 ? `${unread} unread notifications` : 'Notifications'}
            className="relative h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: Colors.charcoal[800] }}>
            <Bell size={20} color={Colors.charcoal[200]} />
            {unread > 0 && (
              <View
                className="absolute right-2 top-2 h-2 w-2 rounded-full"
                style={{ backgroundColor: Colors.accent[500] }}
              />
            )}
          </Pressable>
        </View>

        {/* Search bar */}
        <View className="px-5">
          <Pressable
            onPress={() => router.push('/shops')}
            accessibilityRole="search"
            className="flex-row items-center gap-3 rounded-2xl px-4 py-3.5"
            style={{ backgroundColor: Colors.charcoal[800] }}>
            <Search size={20} color={Colors.charcoal[400]} />
            <Text className="text-sm" style={{ color: Colors.charcoal[500] }}>
              Search shops, services, brands...
            </Text>
          </Pressable>
        </View>

        {hydrated && <LocationBanner />}

        {/* Featured banner */}
        <View className="px-5 mt-5">
          <Pressable
            onPress={() => seeAll('rating')}
            className="overflow-hidden rounded-2xl"
            style={{ backgroundColor: Colors.charcoal[800] }}>
            <Image
              source={{ uri: MARKETING_IMAGES.banner }}
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
        {categories.length > 0 && (
          <>
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
              {categories.map((cat) => (
                <CategoryCard key={cat.id} category={cat} variant="row" />
              ))}
            </ScrollView>
          </>
        )}

        {loading || !hydrated ? (
          <LoadingView label="Finding shops…" />
        ) : error ? (
          <ErrorView message={error} onRetry={refresh} />
        ) : !data || data.nearby.length === 0 ? (
          <EmptyState
            icon={Store}
            title="No shops listed yet"
            message="Approved modification shops will appear here. Check back soon!"
            compact
          />
        ) : (
          <>
            {/* Top rated shops */}
            <View className="mt-6 px-5">
              <SectionHeader
                title="Top Rated"
                subtitle="Highest-rated shops on AutoMod"
                actionText="See all"
                onAction={() => seeAll('rating')}
              />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}>
              {data.topRated.map((shop) => (
                <ShopCard key={shop.id} shop={shop} variant="compact" />
              ))}
            </ScrollView>

            {/* Nearby shops */}
            <View className="mt-6 px-5">
              <SectionHeader
                title={coords ? 'Nearby Shops' : 'Popular Shops'}
                subtitle={coords ? 'Closest to your location' : 'Set your location to see shops near you'}
                actionText="See all"
                onAction={() => seeAll(coords ? 'distance' : 'rating')}
              />
            </View>
            <View className="px-5">
              {data.nearby.map((shop) => (
                <ShopCard key={shop.id} shop={shop} />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
