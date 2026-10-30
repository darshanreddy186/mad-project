import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, SlidersHorizontal } from 'lucide-react-native';
import { useState } from 'react';
import { Colors } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import { ShopCard } from '@/components/ShopCard';
import { CATEGORIES } from '@/data/mockData';
import { ModalSheet } from '@/components/ModalSheet';
import { Button } from '@/components/Button';
import type { FilterOptions } from '@/types';

export default function ShopsListScreen() {
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterOptions>({
    categories: [],
    maxDistance: 50,
    minRating: 0,
    maxPriceLevel: 4,
    sortBy: 'distance',
  });

  const getFilteredShops = useAppStore((s) => s.getFilteredShops);
  const filters = useAppStore((s) => s.filters);
  const setFilters = useAppStore((s) => s.setFilters);
  const resetFilters = useAppStore((s) => s.resetFilters);
  const searchQuery = useAppStore((s) => s.searchQuery);
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);

  const shops = getFilteredShops();

  const toggleCategory = (slug: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(slug)
        ? prev.categories.filter((c) => c !== slug)
        : [...prev.categories, slug],
    }));
  };

  const applyFilters = () => {
    setFilters(localFilters);
    setShowFilters(false);
  };

  const clearFilters = () => {
    resetFilters();
    setLocalFilters({
      categories: [],
      maxDistance: 50,
      minRating: 0,
      maxPriceLevel: 4,
      sortBy: 'distance',
    });
    setShowFilters(false);
  };

  return (
    <SafeAreaView
      edges={['top']}
      className="flex-1"
      style={{ backgroundColor: Colors.charcoal[950] }}>
      <View className="flex-row items-center gap-3 px-5 pt-4 pb-3">
        <Pressable
          className="flex-1 flex-row items-center gap-3 rounded-2xl px-4 py-3"
          style={{ backgroundColor: Colors.charcoal[800] }}>
          <Search size={20} color={Colors.charcoal[400]} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search shops, services, brands..."
            placeholderTextColor={Colors.charcoal[500]}
            className="flex-1 text-sm"
            style={{ color: Colors.white }}
          />
        </Pressable>
        <Pressable
          onPress={() => {
            setLocalFilters(filters);
            setShowFilters(true);
          }}
          className="h-11 w-11 items-center justify-center rounded-2xl"
          style={{ backgroundColor: Colors.charcoal[800] }}>
          <SlidersHorizontal size={20} color={Colors.charcoal[200]} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}>
        <Text className="mb-3 text-lg font-bold text-white">
          {shops.length} {shops.length === 1 ? 'Shop' : 'Shops'} Found
        </Text>

        {shops.length === 0 ? (
          <View className="mt-20 items-center">
            <Text className="text-base font-semibold text-white">No shops found</Text>
            <Text className="mt-2 text-sm" style={{ color: Colors.charcoal[400] }}>
              Try adjusting your search or filters
            </Text>
            <View className="mt-4">
              <Button label="Clear Filters" variant="outline" onPress={clearFilters} />
            </View>
          </View>
        ) : (
          shops.map((shop) => <ShopCard key={shop.id} shop={shop} />)
        )}
      </ScrollView>

      <ModalSheet
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filters">
        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 500 }}>
          <Text className="mb-3 text-sm font-semibold text-white">Category</Text>
          <View className="flex-row flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const selected = localFilters.categories.includes(cat.slug);
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => toggleCategory(cat.slug)}
                  className="rounded-full px-3 py-2"
                  style={{
                    backgroundColor: selected ? Colors.accent[600] : Colors.charcoal[800],
                    borderWidth: 1,
                    borderColor: selected ? Colors.accent[500] : Colors.charcoal[700],
                  }}>
                  <Text
                    className="text-xs font-medium"
                    style={{ color: selected ? Colors.white : Colors.charcoal[200] }}>
                    {cat.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text className="mb-2 mt-5 text-sm font-semibold text-white">
            Min Rating: {localFilters.minRating.toFixed(1)}
          </Text>
          <View className="flex-row gap-2">
            {[0, 3, 3.5, 4, 4.5].map((r) => (
              <Pressable
                key={r}
                onPress={() => setLocalFilters((p) => ({ ...p, minRating: r }))}
                className="flex-1 items-center rounded-xl py-2.5"
                style={{
                  backgroundColor: localFilters.minRating === r ? Colors.accent[600] : Colors.charcoal[800],
                }}>
                <Text
                  className="text-xs font-semibold"
                  style={{ color: localFilters.minRating === r ? Colors.white : Colors.charcoal[300] }}>
                  {r === 0 ? 'Any' : `${r}+`}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text className="mb-2 mt-5 text-sm font-semibold text-white">
            Max Price Level
          </Text>
          <View className="flex-row gap-2">
            {[1, 2, 3, 4].map((p) => (
              <Pressable
                key={p}
                onPress={() => setLocalFilters((prev) => ({ ...prev, maxPriceLevel: p }))}
                className="flex-1 items-center rounded-xl py-2.5"
                style={{
                  backgroundColor: localFilters.maxPriceLevel === p ? Colors.accent[600] : Colors.charcoal[800],
                }}>
                <Text
                  className="text-xs font-bold"
                  style={{ color: localFilters.maxPriceLevel === p ? Colors.white : Colors.charcoal[300] }}>
                  {'£'.repeat(p)}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text className="mb-2 mt-5 text-sm font-semibold text-white">Sort By</Text>
          <View className="flex-row gap-2">
            {[
              { label: 'Distance', value: 'distance' as const },
              { label: 'Rating', value: 'rating' as const },
              { label: 'Name', value: 'name' as const },
            ].map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => setLocalFilters((p) => ({ ...p, sortBy: opt.value }))}
                className="flex-1 items-center rounded-xl py-2.5"
                style={{
                  backgroundColor: localFilters.sortBy === opt.value ? Colors.accent[600] : Colors.charcoal[800],
                }}>
                <Text
                  className="text-xs font-semibold"
                  style={{ color: localFilters.sortBy === opt.value ? Colors.white : Colors.charcoal[300] }}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <View className="mt-6 flex-row gap-3">
            <View className="flex-1">
              <Button label="Reset" variant="outline" onPress={clearFilters} fullWidth />
            </View>
            <View className="flex-1">
              <Button label="Apply Filters" onPress={applyFilters} fullWidth />
            </View>
          </View>
        </ScrollView>
      </ModalSheet>
    </SafeAreaView>
  );
}
