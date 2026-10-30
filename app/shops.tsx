import { useEffect, useState } from 'react';
import { View, Text, Pressable, TextInput, FlatList, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Search, SlidersHorizontal, X, SearchX } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { DISTANCE_UNIT } from '@/constants/config';
import { useAppStore } from '@/store/useAppStore';
import { ShopCard } from '@/components/ShopCard';
import { FilterSheet, activeFilterCount } from '@/components/FilterSheet';
import { Chip } from '@/components/Chip';
import { EmptyState, ErrorView, LoadingView } from '@/components/StateViews';
import { useShopSearch } from '@/hooks/useShopSearch';
import { priceLevelSymbols } from '@/lib/format';
import type { SortOption } from '@/types';

const SORT_LABEL: Record<SortOption, string> = {
  distance: 'Nearest',
  rating: 'Top rated',
  name: 'A–Z',
};

export default function ShopsListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string; sort?: string; q?: string }>();
  const [showFilters, setShowFilters] = useState(false);

  const categories = useAppStore((s) => s.categories);
  const filters = useAppStore((s) => s.filters);
  const setFilters = useAppStore((s) => s.setFilters);
  const resetFilters = useAppStore((s) => s.resetFilters);
  const searchQuery = useAppStore((s) => s.searchQuery);
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);

  // Support deep links such as /shops?category=wheels-tyres&sort=rating
  useEffect(() => {
    if (params.category) setFilters({ categories: [params.category] });
    if (params.sort === 'rating' || params.sort === 'distance' || params.sort === 'name') {
      setFilters({ sortBy: params.sort });
    }
    if (params.q) setSearchQuery(params.q);
  }, [params.category, params.sort, params.q, setFilters, setSearchQuery]);

  const { shops, loading, loadingMore, refreshing, error, hasLocation, refresh, retry, loadMore } =
    useShopSearch();

  const activeCount = activeFilterCount(filters);
  const clearAll = () => {
    resetFilters();
    setSearchQuery('');
  };

  const activeChips: { key: string; label: string; onRemove: () => void }[] = [
    ...filters.categories.map((slug) => ({
      key: `c-${slug}`,
      label: categories.find((c) => c.slug === slug)?.name ?? slug,
      onRemove: () => setFilters({ categories: filters.categories.filter((c) => c !== slug) }),
    })),
    ...(filters.maxDistance !== null
      ? [{ key: 'd', label: `Within ${filters.maxDistance}${DISTANCE_UNIT}`, onRemove: () => setFilters({ maxDistance: null }) }]
      : []),
    ...(filters.minRating > 0
      ? [{ key: 'r', label: `${filters.minRating}+ stars`, onRemove: () => setFilters({ minRating: 0 }) }]
      : []),
    ...(filters.maxPriceLevel < 4
      ? [{ key: 'p', label: `Up to ${priceLevelSymbols(filters.maxPriceLevel)}`, onRemove: () => setFilters({ maxPriceLevel: 4 }) }]
      : []),
  ];

  return (
    <SafeAreaView
      edges={['top']}
      className="flex-1"
      style={{ backgroundColor: Colors.charcoal[950] }}>
      <View className="flex-row items-center gap-3 px-5 pt-4 pb-3">
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
          accessibilityLabel="Go back"
          className="h-11 w-11 items-center justify-center rounded-2xl"
          style={{ backgroundColor: Colors.charcoal[800] }}>
          <ArrowLeft size={20} color={Colors.white} />
        </Pressable>
        <View
          className="flex-1 flex-row items-center gap-3 rounded-2xl px-4"
          style={{ backgroundColor: Colors.charcoal[800] }}>
          <Search size={20} color={Colors.charcoal[400]} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search shops, services, brands..."
            placeholderTextColor={Colors.charcoal[500]}
            returnKeyType="search"
            autoCorrect={false}
            accessibilityLabel="Search shops"
            className="flex-1 py-3 text-sm"
            style={{ color: Colors.white }}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8} accessibilityLabel="Clear search">
              <X size={16} color={Colors.charcoal[400]} />
            </Pressable>
          )}
        </View>
        <Pressable
          onPress={() => setShowFilters(true)}
          accessibilityLabel="Filters"
          className="h-11 w-11 items-center justify-center rounded-2xl"
          style={{ backgroundColor: activeCount ? Colors.accent[600] : Colors.charcoal[800] }}>
          <SlidersHorizontal size={20} color={Colors.white} />
          {activeCount > 0 && (
            <View
              className="absolute -right-1 -top-1 h-5 w-5 items-center justify-center rounded-full"
              style={{ backgroundColor: Colors.white }}>
              <Text className="text-[10px] font-bold" style={{ color: Colors.accent[600] }}>
                {activeCount}
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      {activeChips.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="max-h-12 flex-grow-0"
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 8 }}>
          {activeChips.map((chip) => (
            <Chip
              key={chip.key}
              label={chip.label}
              selected
              size="sm"
              onPress={chip.onRemove}
              icon={<X size={12} color={Colors.white} />}
            />
          ))}
        </ScrollView>
      )}

      {loading ? (
        <LoadingView label="Searching shops…" />
      ) : error && shops.length === 0 ? (
        <ErrorView message={error} onRetry={retry} />
      ) : (
        <FlatList
          data={shops}
          keyExtractor={(s) => s.id}
          renderItem={({ item }) => <ShopCard shop={item} />}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, flexGrow: 1 }}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshing={refreshing}
          onRefresh={refresh}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={6}
          windowSize={7}
          ListHeaderComponent={
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-white">
                {shops.length} {shops.length === 1 ? 'Shop' : 'Shops'}
                {shops.length > 0 && loadingMore ? '+' : ''}
              </Text>
              <Text className="text-xs" style={{ color: Colors.charcoal[400] }}>
                {filters.sortBy === 'distance' && !hasLocation ? 'Top rated (no location)' : SORT_LABEL[filters.sortBy]}
              </Text>
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              icon={SearchX}
              title="No shops found"
              message={
                hasLocation && filters.maxDistance !== null
                  ? 'Try a larger distance or fewer filters.'
                  : 'Try adjusting your search or filters.'
              }
              actionLabel={activeCount || searchQuery ? 'Clear search & filters' : undefined}
              onAction={clearAll}
            />
          }
          ListFooterComponent={
            loadingMore ? <ActivityIndicator className="py-4" color={Colors.accent[500]} /> : undefined
          }
        />
      )}

      <FilterSheet visible={showFilters} onClose={() => setShowFilters(false)} hasLocation={hasLocation} />
    </SafeAreaView>
  );
}
